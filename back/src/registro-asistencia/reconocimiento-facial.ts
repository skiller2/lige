import ort from "onnxruntime-node";
import { Jimp } from "jimp";
import { join } from "node:path";

/*
 * Reconocimiento facial con modelos ONNX del OpenCV Model Zoo, todo en Node:
 * - YuNet (MIT): detecta los rostros y 5 puntos (ojos, nariz, comisuras de la boca).
 * - SFace (Apache 2.0): convierte el rostro alineado en un embedding de 128 números.
 * Dos rostros son de la misma persona si la similitud coseno de sus embeddings supera el umbral.
 *
 * Los vectores de las fotos del personal no se calculan en el marcado: los calcula
 * iniciarCalculoVectoresFaciales (registro-asistencia.controller.ts) y quedan en
 * DocumentoImagenFoto.VectorFacial. En el marcado solo se calcula el vector de la foto tomada y se
 * compara con los que recibe reconocerRostro.
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

// El umbral de similitud coseno (por encima, misma persona) no está acá: viene de ParametroGeneral
// ROSTR (umbralSimilitud) y lo recibe reconocerRostro. Como referencia, la documentación de OpenCV
// usa 0.363 para SFace, que para asistencia resulta permisivo.

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

// Cantidad de valores del vector de SFace: VectorFacial guarda 128 float32 (512 bytes)
const LARGO_VECTOR = 128

// Vector facial guardado de una persona (DocumentoImagenFoto.VectorFacial de su foto vigente)
export interface VectorPersonal {
  PersonalId: number
  ApellidoNombre: string
  vector: Float32Array
}

export interface Coincidencia {
  PersonalId: number
  ApellidoNombre: string
  similitud: number
}

export interface ResultadoReconocimiento {
  rostrosDetectados: number
  encontrado: boolean
  mejor: Coincidencia | null
  candidatos: Coincidencia[]
  // Cuánto tardó analizar la foto del marcado, en ms (leerla, detectar el rostro, calcular el
  // vector y comparar)
  tiempos: { analisisMs: number }
}

let sesiones: Promise<{ yunet: ort.InferenceSession, sface: ort.InferenceSession }> | null = null

function getSesiones() {
  return sesiones ??= (async () => ({
    yunet: await ort.InferenceSession.create(join(MODELOS, "face_detection_yunet_2023mar.onnx")),
    sface: await ort.InferenceSession.create(join(MODELOS, "face_recognition_sface_2021dec.onnx")),
  }))().catch(error => {
    sesiones = null   // Si no se pudieron cargar los modelos, el próximo marcado lo vuelve a intentar
    throw error
  })
}

// ONNX Runtime es código nativo: un fallo ahí no es un error de JavaScript que se pueda atrapar y
// tira el proceso. Para no exponerlo a ejecuciones simultáneas (dos marcados juntos, o un marcado
// mientras se calculan los vectores del personal), cada ejecución de un modelo espera a que termine la anterior.
let cola: Promise<unknown> = Promise.resolve()
function enCola<T>(tarea: () => Promise<T>): Promise<T> {
  const resultado = cola.then(tarea, tarea)
  cola = resultado.catch(() => undefined)
  return resultado
}

/** Compara la foto con los vectores guardados del personal y devuelve la mejor coincidencia. */
export async function reconocerRostro(foto: Buffer, vectoresPersonal: VectorPersonal[], umbralSimilitud: number): Promise<ResultadoReconocimiento> {
  const inicioAnalisis = Date.now()
  const tiempos = () => ({ analisisMs: Date.now() - inicioAnalisis })

  const imagen = await leerImagen(foto)
  const rostros = await detectarRostros(imagen)

  if (!rostros.length)
    return { rostrosDetectados: 0, encontrado: false, mejor: null, candidatos: [], tiempos: tiempos() }

  const embedding = await calcularEmbedding(imagen, rostros[0])

  // La mejor similitud de cada persona (por si llega más de un vector de la misma)
  const porPersona = new Map<number, Coincidencia>()
  for (const personal of vectoresPersonal) {
    const similitud = similitudCoseno(embedding, personal.vector)
    const actual = porPersona.get(personal.PersonalId)
    if (!actual || similitud > actual.similitud)
      porPersona.set(personal.PersonalId, { PersonalId: personal.PersonalId, ApellidoNombre: personal.ApellidoNombre, similitud })
  }

  const candidatos = [...porPersona.values()].sort((a, b) => b.similitud - a.similitud).slice(0, 5)
  const mejor = candidatos[0] ?? null

  return {
    rostrosDetectados: rostros.length,
    encontrado: !!mejor && mejor.similitud >= umbralSimilitud,
    mejor,
    candidatos,
    tiempos: tiempos(),
  }
}

/**
 * Vector facial (embedding de SFace, 128 float32) de una foto, o null si no tiene rostro.
 * Si la imagen no se puede leer o el rostro no se puede alinear, lanza el error.
 */
export async function calcularVectorFacial(origen: Buffer | string): Promise<Float32Array | null> {
  const imagen = await leerImagen(origen)
  const rostros = await detectarRostros(imagen)
  if (!rostros.length) return null
  return calcularEmbedding(imagen, rostros[0])
}

// Modelo que genera el vector, para DocumentoImagenFoto.VectorFacialVersion: vectores de modelos
// distintos no se pueden comparar entre sí. Si se cambia el modelo SFace, cambiar también esto.
export const VERSION_VECTOR_FACIAL = 'sface_2021dec'

/** Vector para DocumentoImagenFoto.VectorFacial (VARBINARY): los 128 float32 tal cual, 512 bytes. */
export function vectorABuffer(vector: Float32Array): Buffer {
  return Buffer.from(vector.buffer, vector.byteOffset, vector.byteLength)
}

/** Vector guardado en VectorFacial, o null si no tiene el largo esperado (vacío o truncado). */
export function bufferAVector(buffer: Buffer | null): Float32Array | null {
  if (!buffer || buffer.length !== LARGO_VECTOR * 4) return null
  // Se copia a un ArrayBuffer propio: el del Buffer puede no estar alineado a 4 bytes
  return new Float32Array(Uint8Array.from(buffer).buffer)
}

async function leerImagen(origen: Buffer | string): Promise<Imagen> {
  let imagen: Awaited<ReturnType<typeof Jimp.read>>
  try {
    imagen = await Jimp.read(origen)
  } catch (error) {
    throw new Error(`No se pudo leer la imagen: ${error instanceof Error ? error.message : error}`)
  }
  const { data, width, height } = imagen.bitmap
  // Una imagen vacía haría una escala infinita al pasarla a 640x640
  if (!width || !height || !data?.length)
    throw new Error('La imagen está vacía')
  return { data, width, height }
}

/** Rostros de la imagen, de mayor a menor puntaje. */
async function detectarRostros(imagen: Imagen): Promise<Rostro[]> {
  const { yunet } = await getSesiones()

  // La imagen se reduce para entrar en 640x640 y el resto queda en negro
  const escala = YUNET_TAMANIO / Math.max(imagen.width, imagen.height)
  const entrada = muestrear(imagen, YUNET_TAMANIO, YUNET_TAMANIO, (u, v) => [u / escala, v / escala], "bgr")
  const salidas = await enCola(() => yunet.run({ input: new ort.Tensor("float32", entrada, [1, 3, YUNET_TAMANIO, YUNET_TAMANIO]) }))

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
  // Con los 5 puntos encimados (o valores inválidos) la cara no se puede alinear: dividir por det
  // daría infinitos y una entrada basura al modelo
  if (!Number.isFinite(det) || det < 1e-9 || ![a, b, tx, ty].every(Number.isFinite))
    throw new Error('No se pudo alinear el rostro')
  const entrada = muestrear(imagen, SFACE_TAMANIO, SFACE_TAMANIO, (u, v) => {
    const du = u - tx, dv = v - ty
    return [(a * du + b * dv) / det, (-b * du + a * dv) / det]
  }, "rgb")

  const salidas = await enCola(() => sface.run({ data: new ort.Tensor("float32", entrada, [1, 3, SFACE_TAMANIO, SFACE_TAMANIO]) }))
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
