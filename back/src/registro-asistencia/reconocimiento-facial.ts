import ort from "onnxruntime-node";
import { Jimp } from "jimp";
import { join } from "node:path";

/*
 * Reconocimiento facial con modelos ONNX del OpenCV Model Zoo, todo en Node:
 * - YuNet (MIT): detecta los rostros y 5 puntos (ojos, nariz, comisuras de la boca).
 * - SFace (Apache 2.0): convierte el rostro alineado en un embedding de 128 números.
 * Dos rostros son de la misma persona si la similitud coseno de sus embeddings supera el umbral.
 *
 * La galería es la lista de fotos que recibe reconocerRostro (la arma el controller: foto vigente
 * del personal activo). Por ahora sus embeddings quedan en memoria (sin tablas): en cada marcado se
 * calculan solo las fotos nuevas de la lista y se sacan las que ya no están.
 */

const MODELOS = join(import.meta.dirname, "modelos")

// YuNet: entrada fija de 640x640, BGR 0..255
const YUNET_TAMANIO = 640
const YUNET_PUNTAJE_MINIMO = 0.6
const YUNET_IOU_NMS = 0.3
const YUNET_PASOS = [8, 16, 32]

// SFace: rostro alineado de 112x112, RGB 0..255
const SFACE_TAMANIO = 112
// Dónde tienen que quedar ojos, nariz y comisuras en la cara alineada (los de FaceRecognizerSF de OpenCV)
const PUNTOS_REFERENCIA: Punto[] = [
  [38.2946, 51.6963],
  [73.5318, 51.5014],
  [56.0252, 71.7366],
  [41.5493, 92.3655],
  [70.7299, 92.2041],
]

// Umbral de similitud coseno de SFace según la documentación de OpenCV: por encima, misma persona
export const UMBRAL_SIMILITUD = 0.363

type Punto = [number, number]

interface Imagen {
  data: Uint8Array   // RGBA
  width: number
  height: number
}

export interface Rostro {
  x: number
  y: number
  ancho: number
  alto: number
  puntaje: number
  puntos: Punto[]
}

// Una foto de la galería: de quién es y dónde está el archivo
export interface FotoPersonal {
  PersonalId: number
  ApellidoNombre: string
  ruta: string
}

interface FotoGaleria extends FotoPersonal {
  embedding: Float32Array
}

export interface Coincidencia extends FotoPersonal {
  similitud: number
}

export interface ResultadoReconocimiento {
  rostrosDetectados: number
  encontrado: boolean
  mejor: Coincidencia | null
  candidatos: Coincidencia[]
}

let sesiones: Promise<{ yunet: ort.InferenceSession, sface: ort.InferenceSession }> | null = null

// Embeddings calculados, por ruta del archivo. Las fotos sin rostro o con error también se
// recuerdan (null), para no reprocesarlas en cada marcado.
const galeria = new Map<string, FotoGaleria | null>()
// Actualización en curso: si llegan dos marcados juntos, el segundo espera la misma
let actualizando: Promise<FotoGaleria[]> | null = null

function getSesiones() {
  return sesiones ??= (async () => ({
    yunet: await ort.InferenceSession.create(join(MODELOS, "face_detection_yunet_2023mar.onnx")),
    sface: await ort.InferenceSession.create(join(MODELOS, "face_recognition_sface_2021dec.onnx")),
  }))()
}

/** Compara la foto con las fotos del personal y devuelve la mejor coincidencia. */
export async function reconocerRostro(foto: Buffer, fotosPersonal: FotoPersonal[]): Promise<ResultadoReconocimiento> {
  const fotos = await actualizarGaleria(fotosPersonal)
  const imagen = await leerImagen(foto)
  const rostros = await detectarRostros(imagen)

  if (!rostros.length)
    return { rostrosDetectados: 0, encontrado: false, mejor: null, candidatos: [] }

  const embedding = await calcularEmbedding(imagen, rostros[0])

  // La mejor similitud de cada persona (puede tener más de una foto)
  const porPersona = new Map<number, Coincidencia>()
  for (const foto of fotos) {
    const similitud = similitudCoseno(embedding, foto.embedding)
    const actual = porPersona.get(foto.PersonalId)
    if (!actual || similitud > actual.similitud)
      porPersona.set(foto.PersonalId, { PersonalId: foto.PersonalId, ApellidoNombre: foto.ApellidoNombre, ruta: foto.ruta, similitud })
  }

  const candidatos = [...porPersona.values()].sort((a, b) => b.similitud - a.similitud).slice(0, 5)
  const mejor = candidatos[0] ?? null

  return {
    rostrosDetectados: rostros.length,
    encontrado: !!mejor && mejor.similitud >= UMBRAL_SIMILITUD,
    mejor,
    candidatos,
  }
}

// Pone la galería al día con la lista de fotos y devuelve las que tienen rostro
function actualizarGaleria(fotosPersonal: FotoPersonal[]) {
  return actualizando ??= sincronizarGaleria(fotosPersonal).finally(() => { actualizando = null })
}

async function sincronizarGaleria(fotosPersonal: FotoPersonal[]): Promise<FotoGaleria[]> {
  const enLista = new Set(fotosPersonal.map(foto => foto.ruta))

  // Las que ya no están en la lista (baja, cambio de foto) salen de la galería
  let quitadas = 0
  for (const ruta of galeria.keys())
    if (!enLista.has(ruta)) {
      galeria.delete(ruta)
      quitadas++
    }

  const nuevas = fotosPersonal.filter(foto => !galeria.has(foto.ruta))
  if (nuevas.length) {
    const inicio = Date.now()
    console.log(`[reconocimiento] Galería: ${nuevas.length} fotos nuevas para procesar`)

    let sinRostro = 0, conError = 0, agregadas = 0
    for (const [indice, foto] of nuevas.entries()) {
      const procesada = await procesarFotoGaleria(foto, { sinRostro: () => sinRostro++, conError: () => conError++ })
      galeria.set(foto.ruta, procesada)
      if (procesada) agregadas++

      if ((indice + 1) % 100 === 0)
        console.log(`[reconocimiento] Galería: ${indice + 1}/${nuevas.length} fotos nuevas procesadas`)
    }

    console.log(`[reconocimiento] Galería actualizada en ${((Date.now() - inicio) / 1000).toFixed(1)} s: ` +
      `${agregadas} rostros agregados, ${sinRostro} fotos sin rostro, ${conError} con error`)
  }
  if (quitadas)
    console.log(`[reconocimiento] Galería: ${quitadas} fotos quitadas (ya no están en la lista)`)

  // Los datos de la persona se toman de la lista actual (el nombre pudo cambiar)
  return fotosPersonal
    .map(foto => {
      const procesada = galeria.get(foto.ruta)
      return procesada ? { ...foto, embedding: procesada.embedding } : null
    })
    .filter((foto): foto is FotoGaleria => !!foto)
}

// Embedding de una foto de la galería, o null si no sirve (no se encuentra, sin rostro o con error)
async function procesarFotoGaleria(foto: FotoPersonal,
  contar: { sinRostro: () => void, conError: () => void }): Promise<FotoGaleria | null> {
  try {
    const imagen = await leerImagen(foto.ruta)
    const rostros = await detectarRostros(imagen)
    if (!rostros.length) {
      contar.sinRostro()
      return null
    }
    return { ...foto, embedding: await calcularEmbedding(imagen, rostros[0]) }
  } catch (error) {
    contar.conError()
    console.warn(`[reconocimiento] No se pudo procesar ${foto.ruta} (PersonalId ${foto.PersonalId}):`, error instanceof Error ? error.message : error)
    return null
  }
}

async function leerImagen(origen: Buffer | string): Promise<Imagen> {
  const imagen = await Jimp.read(origen)
  return { data: imagen.bitmap.data, width: imagen.bitmap.width, height: imagen.bitmap.height }
}

/** Rostros de la imagen, de mayor a menor puntaje. */
async function detectarRostros(imagen: Imagen): Promise<Rostro[]> {
  const { yunet } = await getSesiones()

  // La imagen se reduce para entrar en 640x640 y el resto queda en negro
  const escala = YUNET_TAMANIO / Math.max(imagen.width, imagen.height)
  const entrada = muestrear(imagen, YUNET_TAMANIO, YUNET_TAMANIO, (u, v) => [u / escala, v / escala], "bgr")
  const salidas = await yunet.run({ input: new ort.Tensor("float32", entrada, [1, 3, YUNET_TAMANIO, YUNET_TAMANIO]) })

  const candidatos: Rostro[] = []
  for (const paso of YUNET_PASOS) {
    const cls = salidas[`cls_${paso}`].data as Float32Array
    const obj = salidas[`obj_${paso}`].data as Float32Array
    const bbox = salidas[`bbox_${paso}`].data as Float32Array
    const kps = salidas[`kps_${paso}`].data as Float32Array
    const columnas = YUNET_TAMANIO / paso
    const filas = YUNET_TAMANIO / paso

    for (let fila = 0; fila < filas; fila++) {
      for (let columna = 0; columna < columnas; columna++) {
        const i = fila * columnas + columna
        const puntaje = Math.sqrt(limitar(cls[i]) * limitar(obj[i]))
        if (puntaje < YUNET_PUNTAJE_MINIMO) continue

        const cx = (columna + bbox[i * 4]) * paso
        const cy = (fila + bbox[i * 4 + 1]) * paso
        const ancho = Math.exp(bbox[i * 4 + 2]) * paso
        const alto = Math.exp(bbox[i * 4 + 3]) * paso
        const puntos: Punto[] = []
        for (let n = 0; n < 5; n++)
          puntos.push([(kps[i * 10 + 2 * n] + columna) * paso / escala, (kps[i * 10 + 2 * n + 1] + fila) * paso / escala])

        candidatos.push({
          x: (cx - ancho / 2) / escala,
          y: (cy - alto / 2) / escala,
          ancho: ancho / escala,
          alto: alto / escala,
          puntaje,
          puntos,
        })
      }
    }
  }

  return suprimirSolapados(candidatos)
}

/** Embedding normalizado del rostro: se alinea a 112x112 con los 5 puntos y pasa por SFace. */
async function calcularEmbedding(imagen: Imagen, rostro: Rostro): Promise<Float32Array> {
  const { sface } = await getSesiones()

  // Transformación de semejanza (rotación, escala, desplazamiento) de los puntos detectados a los
  // de referencia; para armar la cara alineada se recorre al revés: de cada píxel de salida a la foto
  const { a, b, tx, ty } = transformacionSemejanza(rostro.puntos, PUNTOS_REFERENCIA)
  const det = a * a + b * b
  const entrada = muestrear(imagen, SFACE_TAMANIO, SFACE_TAMANIO, (u, v) => {
    const du = u - tx, dv = v - ty
    return [(a * du + b * dv) / det, (-b * du + a * dv) / det]
  }, "rgb")

  const salidas = await sface.run({ data: new ort.Tensor("float32", entrada, [1, 3, SFACE_TAMANIO, SFACE_TAMANIO]) })
  return normalizar(salidas["fc1"].data as Float32Array)
}

/**
 * Arma la entrada de un modelo (CHW, valores 0..255) tomando cada píxel de salida de la posición
 * de la imagen que indica `origen`, con interpolación bilineal. Fuera de la imagen queda en 0.
 */
function muestrear(imagen: Imagen, ancho: number, alto: number, origen: (u: number, v: number) => Punto, orden: "rgb" | "bgr"): Float32Array {
  const plano = ancho * alto
  const salida = new Float32Array(3 * plano)
  const canales = orden === "rgb" ? [0, 1, 2] : [2, 1, 0]   // RGBA -> orden pedido

  for (let v = 0; v < alto; v++) {
    for (let u = 0; u < ancho; u++) {
      const [x, y] = origen(u, v)
      if (x < 0 || y < 0 || x > imagen.width - 1 || y > imagen.height - 1) continue

      const x0 = Math.floor(x), y0 = Math.floor(y)
      const x1 = Math.min(x0 + 1, imagen.width - 1), y1 = Math.min(y0 + 1, imagen.height - 1)
      const fx = x - x0, fy = y - y0
      const p00 = (y0 * imagen.width + x0) * 4, p10 = (y0 * imagen.width + x1) * 4
      const p01 = (y1 * imagen.width + x0) * 4, p11 = (y1 * imagen.width + x1) * 4

      for (let c = 0; c < 3; c++) {
        const k = canales[c]
        const arriba = imagen.data[p00 + k] * (1 - fx) + imagen.data[p10 + k] * fx
        const abajo = imagen.data[p01 + k] * (1 - fx) + imagen.data[p11 + k] * fx
        salida[c * plano + v * ancho + u] = arriba * (1 - fy) + abajo * fy
      }
    }
  }
  return salida
}

/**
 * Semejanza por mínimos cuadrados que lleva `origen` a `destino`:
 * destino = [a -b; b a] · origen + [tx, ty]
 */
function transformacionSemejanza(origen: Punto[], destino: Punto[]) {
  const n = origen.length
  const mox = origen.reduce((s, p) => s + p[0], 0) / n, moy = origen.reduce((s, p) => s + p[1], 0) / n
  const mdx = destino.reduce((s, p) => s + p[0], 0) / n, mdy = destino.reduce((s, p) => s + p[1], 0) / n

  let numA = 0, numB = 0, den = 0
  for (let i = 0; i < n; i++) {
    const sx = origen[i][0] - mox, sy = origen[i][1] - moy
    const dx = destino[i][0] - mdx, dy = destino[i][1] - mdy
    numA += sx * dx + sy * dy
    numB += sx * dy - sy * dx
    den += sx * sx + sy * sy
  }
  const a = numA / den, b = numB / den
  return { a, b, tx: mdx - (a * mox - b * moy), ty: mdy - (b * mox + a * moy) }
}

/** Saca los rostros que se superponen con otro de mayor puntaje (NMS). */
function suprimirSolapados(rostros: Rostro[]): Rostro[] {
  const ordenados = [...rostros].sort((r1, r2) => r2.puntaje - r1.puntaje)
  const elegidos: Rostro[] = []
  for (const rostro of ordenados)
    if (elegidos.every(elegido => interseccionSobreUnion(elegido, rostro) <= YUNET_IOU_NMS))
      elegidos.push(rostro)
  return elegidos
}

function interseccionSobreUnion(r1: Rostro, r2: Rostro) {
  const ancho = Math.max(0, Math.min(r1.x + r1.ancho, r2.x + r2.ancho) - Math.max(r1.x, r2.x))
  const alto = Math.max(0, Math.min(r1.y + r1.alto, r2.y + r2.alto) - Math.max(r1.y, r2.y))
  const interseccion = ancho * alto
  return interseccion / (r1.ancho * r1.alto + r2.ancho * r2.alto - interseccion)
}

function similitudCoseno(e1: Float32Array, e2: Float32Array) {
  let suma = 0
  for (let i = 0; i < e1.length; i++) suma += e1[i] * e2[i]
  return suma   // Los dos ya están normalizados
}

function normalizar(vector: Float32Array) {
  const norma = Math.sqrt(vector.reduce((s, x) => s + x * x, 0)) || 1
  return vector.map(x => x / norma)
}

function limitar(valor: number) {
  return Math.min(Math.max(valor, 0), 1)
}
