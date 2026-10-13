import { BaseController, ClientException } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import type { NextFunction, Request, Response } from "express";
import type { QueryRunner } from "typeorm";
import { reconocerRostro, UMBRAL_SIMILITUD, type FotoPersonal } from "./reconocimiento-facial.ts";

// Configuración de la pantalla de marcado, en ParametroGeneral (JSON). Se editan desde
// Configuración > Parámetros Generales. Todos los campos son obligatorios y numéricos.
//
// ┌────────┬──────────────────────────┬───────┬─────────────────────────────────────────────────────────────────────┐
// │ Código │ Campo                    │ Valor │ Qué controla                                                        │
// ├────────┼──────────────────────────┼───────┼─────────────────────────────────────────────────────────────────────┤
// │ ROSTR  │ intervaloDeteccionMs     │ 200   │ Cada cuántos ms se analiza un cuadro del video                      │
// │        │ tiempoEstableMs          │ 1000  │ Cuánto tiempo tiene que quedarse el rostro bien ubicado para marcar │
// │        │ tamanioMinimoRostro      │ 0.40  │ Ancho mínimo del rostro, como proporción del círculo                │
// │        │ desvioMaximoCentro       │ 0.10  │ Cuánto puede alejarse el rostro del centro                          │
// │        │ confianzaMinimaDeteccion │ 0.6   │ Confianza mínima de MediaPipe para considerar que hay un rostro     │
// │        │ ladoFoto                 │ 480   │ Tamaño de la foto que se manda al back. Si se sube mucho puede      │
// │        │                          │       │ pasar el límite de 100 KB de las peticiones JSON del back.          │
// ├────────┼──────────────────────────┼───────┼─────────────────────────────────────────────────────────────────────┤
// │ UBICA  │ precisionMaximaMetros    │ 100   │ Por encima de esto, la ubicación se marca como "imprecisa"          │
// │        │ esperaUbicacionMs        │ 15000 │ Cuánto se espera cada lectura antes de dar error                    │
// │        │ distanciaMaximaMetros    │ 150   │ Distancia máxima al objetivo para poder marcar                      │
// └────────┴──────────────────────────┴───────┴─────────────────────────────────────────────────────────────────────┘
const PARAMETRO_ROSTRO = 'ROSTR'
const PARAMETRO_UBICACION = 'UBICA'

// Campos numéricos obligatorios de cada JSON
const CAMPOS_ROSTRO = ['intervaloDeteccionMs', 'tiempoEstableMs', 'tamanioMinimoRostro', 'desvioMaximoCentro', 'confianzaMinimaDeteccion', 'ladoFoto']
const CAMPOS_UBICACION = ['precisionMaximaMetros', 'esperaUbicacionMs', 'distanciaMaximaMetros']

// Origen del registro en RegistroAsistenciaOrigen: AB = acceso biométrico
const ORIGEN_REGISTRO = 'AB'

// Numerador de GenNumerador del que sale RegistroAsistenciaCodigo
const NUMERADOR_REGISTRO = 'RegistroAsistencia'

// Tipo del registro: por ahora, el tipo de dispositivo desde el que se marcó. Se decide por el
// User-Agent del navegador, con el mismo criterio que apiService.isMobile() del front.
const DISPOSITIVO_MOVIL = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
const TIPO_CELULAR = 'CEL'
const TIPO_COMPUTADORA = 'PC'

// Dónde registra la asistencia la persona reconocida
const TIPOS_LUGAR = [
  { value: 'OBJ', label: 'Objetivo' },
  { value: 'CUS', label: 'Custodia' },
]

export class RegistroAsistenciaController extends BaseController {

  async getTiposLugar(req: Request, res: Response) {
    this.jsonRes(TIPOS_LUGAR, res)
  }

  // Graba la asistencia de la persona reconocida en el objetivo o la custodia elegidos
  async confirmar(req: Request, res: Response, next: NextFunction) {
    const PersonalId = Number(req.body?.PersonalId) || 0
    const ApellidoNombre = String(req.body?.ApellidoNombre ?? '')
    const similitud = req.body?.similitud ?? null
    const TipoLugar = String(req.body?.TipoLugar ?? '').trim()
    const ObjetivoId = Number(req.body?.ObjetivoId) || 0
    const CustodiaTexto = String(req.body?.CustodiaCodigo ?? '').trim()
    const ubicacion = req.body?.ubicacion ?? null
    const queryRunner = await getConnection(res.locals.userName);

    try {
      const usuario = res.locals.userName
      const ip = this.getRemoteAddress(req)
      // La fecha del registro es la del servidor, no la del dispositivo
      const ahora = new Date()
      const userAgent = String(req.headers['user-agent'] ?? '')
      const Tipo = DISPOSITIVO_MOVIL.test(userAgent) ? TIPO_CELULAR : TIPO_COMPUTADORA

      if (!PersonalId)
        throw new ClientException('Falta la persona reconocida')

      const fieldErrors: any[] = []
      if (!TIPOS_LUGAR.some(tipo => tipo.value === TipoLugar))
        fieldErrors.push({ fieldTree: 'TipoLugar', kind: 'server', message: 'Elija dónde registra la asistencia' })
      if (TipoLugar === 'OBJ' && !ObjetivoId)
        fieldErrors.push({ fieldTree: 'ObjetivoId', kind: 'server', message: 'Elija el objetivo' })
      if (TipoLugar === 'CUS' && !CustodiaTexto)
        fieldErrors.push({ fieldTree: 'CustodiaCodigo', kind: 'server', message: 'Ingrese la custodia' })
      else if (TipoLugar === 'CUS' && !/^\d+$/.test(CustodiaTexto))
        fieldErrors.push({ fieldTree: 'CustodiaCodigo', kind: 'server', message: 'El código de custodia tiene que ser numérico' })

      if (fieldErrors.length)
        throw new ClientException('Debe completar los campos requeridos.', { fieldErrors })

      // El objetivo se graba por su cliente y elemento dependiente
      let ClienteId: number | null = null
      let ClienteElementoDependienteId: number | null = null
      if (TipoLugar === 'OBJ') {
        const [objetivo] = await queryRunner.query(
          `SELECT ClienteId, ClienteElementoDependienteId FROM Objetivo WHERE ObjetivoId = @0`, [ObjetivoId])
        if (!objetivo)
          throw new ClientException('El objetivo no existe', {
            fieldErrors: [{ fieldTree: 'ObjetivoId', kind: 'server', message: `No se encontró el objetivo ${ObjetivoId}` }]
          })
        ClienteId = objetivo.ClienteId
        ClienteElementoDependienteId = objetivo.ClienteElementoDependienteId
      }

      // La custodia tiene que existir (clave foránea)
      let CustodiaCodigo: number | null = null
      if (TipoLugar === 'CUS') {
        CustodiaCodigo = Number(CustodiaTexto)
        const [custodia] = await queryRunner.query(
          `SELECT CustodiaCodigo FROM Custodia WHERE CustodiaCodigo = @0`, [CustodiaCodigo])
        if (!custodia)
          throw new ClientException('La custodia no existe', {
            fieldErrors: [{ fieldTree: 'CustodiaCodigo', kind: 'server', message: `No se encontró la custodia ${CustodiaCodigo}` }]
          })
      }

      // Por ahora solo "latitud,longitud"; sin ubicación queda vacío (la columna no admite nulos)
      const GeoReferenciacion = ubicacion?.latitud != null && ubicacion?.longitud != null
        ? `${ubicacion.latitud},${ubicacion.longitud}`
        : ''

      // Todo lo recibido y lo resuelto, para auditoría (sin la foto)
      const ObjetoCompleto = JSON.stringify({
        PersonalId, ApellidoNombre, similitud,
        TipoLugar, ObjetivoId: TipoLugar === 'OBJ' ? ObjetivoId : null,
        ClienteId, ClienteElementoDependienteId, CustodiaCodigo,
        ubicacion, usuario, ip, fechaHora: ahora,
        Tipo, userAgent,
      })

      await queryRunner.startTransaction()

      // El código sale del numerador 'RegistroAsistencia' de GenNumerador, como el resto del sistema
      const RegistroAsistenciaCodigo = await BaseController.getProxNumero(queryRunner, NUMERADOR_REGISTRO, usuario, ip)

      await queryRunner.query(`
        INSERT INTO RegistroAsistencia (
          RegistroAsistenciaCodigo, FechaHora, PersonalId, ClienteId, ClienteElementoDependienteId,
          CustodiaCodigo, Tipo, RegistroAsistenciaOrigenCodigo, GeoReferenciacion, ObjetoCompleto,
          AudFechaIng, AudFechaMod, AudIpIng, AudIpMod, AudUsuarioIng, AudUsuarioMod
        ) VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @1, @1, @10, @10, @11, @11)
      `, [
        RegistroAsistenciaCodigo, ahora, PersonalId, ClienteId, ClienteElementoDependienteId,
        CustodiaCodigo, Tipo, ORIGEN_REGISTRO, GeoReferenciacion, ObjetoCompleto,
        ip, usuario
      ])

      await queryRunner.commitTransaction()

      console.log('[registro-asistencia] Confirmación grabada', {
        RegistroAsistenciaCodigo, PersonalId, Tipo, TipoLugar, ClienteId, ClienteElementoDependienteId, CustodiaCodigo, GeoReferenciacion,
      })

      this.jsonRes({ RegistroAsistenciaCodigo, PersonalId, TipoLugar }, res,
        `Asistencia registrada (código ${RegistroAsistenciaCodigo})`)
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  // Configuración de la detección de rostro y de la ubicación, para el front
  async getConfiguracion(req: Request, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);

    try {
      const parametros = await queryRunner.query(
        `SELECT ParametroGeneralCodigo, Parametros FROM ParametroGeneral WHERE ParametroGeneralCodigo IN (@0, @1)`,
        [PARAMETRO_ROSTRO, PARAMETRO_UBICACION])

      this.jsonRes({
        rostro: this.leerParametro(parametros, PARAMETRO_ROSTRO, CAMPOS_ROSTRO),
        ubicacion: this.leerParametro(parametros, PARAMETRO_UBICACION, CAMPOS_UBICACION),
      }, res)
    } catch (error) {
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  // JSON de un parámetro general, validando que tenga todos los campos numéricos pedidos
  private leerParametro(parametros: any[], codigo: string, campos: string[]) {
    const parametro = parametros.find(p => String(p.ParametroGeneralCodigo).trim() === codigo)
    if (!parametro)
      throw new ClientException(`No se encontró el parámetro general ${codigo} con la configuración del registro de asistencia.`)

    let valores: any
    try {
      valores = JSON.parse(parametro.Parametros)
    } catch (_e) {
      throw new ClientException(`El parámetro general ${codigo} no tiene un formato JSON válido.`)
    }

    const faltantes = campos.filter(campo => !Number.isFinite(Number(valores?.[campo])))
    if (faltantes.length)
      throw new ClientException(`Al parámetro general ${codigo} le faltan valores numéricos: ${faltantes.join(', ')}.`)

    return Object.fromEntries(campos.map(campo => [campo, Number(valores[campo])]))
  }

  // Fotos contra las que se compara: la foto vigente (Personal.PersonalFotoId) del personal
  // activo a la fecha (situación de revista 2, 10 o 12, como en el resto del sistema). El archivo
  // está en PATH_ARCHIVOS + la ruta del parámetro de la foto, igual que en file-upload.
  private async getFotosPersonalActivo(queryRunner: QueryRunner, fecha: Date): Promise<FotoPersonal[]> {
    const fotos = await queryRunner.query(`
      SELECT DISTINCT per.PersonalId,
        CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre)) AS ApellidoNombre,
        CONCAT(TRIM(dir.DocumentoImagenParametroDirectorioPathWeb), TRIM(foto.DocumentoImagenFotoBlobNombreArchivo)) AS RutaRelativa
      FROM Personal per
      JOIN PersonalSituacionRevista sitrev ON sitrev.PersonalId = per.PersonalId
        AND sitrev.PersonalSituacionRevistaDesde <= @0
        AND ISNULL(sitrev.PersonalSituacionRevistaHasta, '9999-12-31') >= @0
      JOIN DocumentoImagenFoto foto ON foto.PersonalId = per.PersonalId AND foto.DocumentoImagenFotoId = per.PersonalFotoId
      JOIN DocumentoImagenParametroDirectorio dir ON dir.DocumentoImagenParametroId = foto.DocumentoImagenParametroId
      WHERE sitrev.PersonalSituacionRevistaSituacionId IN (2, 10, 12)
    `, [fecha])

    const pathArchivos = process.env.PATH_ARCHIVOS ? process.env.PATH_ARCHIVOS : '.'
    return fotos.map((foto: any) => ({
      PersonalId: Number(foto.PersonalId),
      ApellidoNombre: foto.ApellidoNombre,
      ruta: `${pathArchivos}/${foto.RutaRelativa}`,
    }))
  }

  // Prueba del marcado: reconoce el rostro contra las fotos del personal activo e informa en
  // consola. Todavía no graba nada.
  async marcar(req: Request, res: Response, next: NextFunction) {
    const foto = String(req.body?.foto ?? '').replace(/^data:image\/\w+;base64,/, '')
    const ubicacion = req.body?.ubicacion ?? null
    const queryRunner = await getConnection(res.locals.userName);

    try {
      if (!foto)
        throw new ClientException('Falta la foto del marcado')

      const inicio = Date.now()
      const fotosPersonal = await this.getFotosPersonalActivo(queryRunner, new Date())
      const resultado = await reconocerRostro(Buffer.from(foto, 'base64'), fotosPersonal)

      console.log('[registro-asistencia] Marcado', {
        usuario: res.locals.userName,
        ubicacion,
        fotosPersonalActivo: fotosPersonal.length,
        rostrosDetectados: resultado.rostrosDetectados,
        umbral: UMBRAL_SIMILITUD,
        candidatos: resultado.candidatos.map(c => `${c.PersonalId} ${c.ApellidoNombre}: ${c.similitud.toFixed(3)}`),
        encontrado: resultado.encontrado,
        PersonalId: resultado.encontrado ? resultado.mejor.PersonalId : null,
        ms: Date.now() - inicio,
      })

      this.jsonRes({
        rostrosDetectados: resultado.rostrosDetectados,
        encontrado: resultado.encontrado,
        PersonalId: resultado.encontrado ? resultado.mejor.PersonalId : null,
        ApellidoNombre: resultado.encontrado ? resultado.mejor.ApellidoNombre : '',
        similitud: resultado.mejor?.similitud ?? null,
      }, res)

    } catch (error) {
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }
}
