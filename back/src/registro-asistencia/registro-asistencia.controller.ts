import { BaseController, ClientException } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import type { NextFunction, Request, Response } from "express";
import type { QueryRunner } from "typeorm";
import { join } from "node:path";
import { bufferAVector, calcularVectorFacial, columnasVectorFacial, reconocerRostro, VERSION_VECTOR_FACIAL, type VectorPersonal } from "./reconocimiento-facial.ts";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros.ts";
import { FileUploadController } from "../controller/file-upload.controller.ts";
import type { Options } from "../schemas/filtro.ts";

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
// │        │ umbralSimilitud          │ 0.40  │ (Back) Similitud mínima con la foto del personal para reconocerlo.  │
// │        │                          │       │ Más alto = más estricto (menos confusiones, más reintentos).        │
// ├────────┼──────────────────────────┼───────┼─────────────────────────────────────────────────────────────────────┤
// │ UBICA  │ precisionMaximaMetros    │ 100   │ Por encima de esto, la ubicación se marca como "imprecisa"          │
// │        │ esperaUbicacionMs        │ 15000 │ Cuánto se espera cada lectura antes de dar error                    │
// │        │ distanciaMaximaMetros    │ 150   │ Distancia máxima al objetivo para poder marcar                      │
// └────────┴──────────────────────────┴───────┴─────────────────────────────────────────────────────────────────────┘
const PARAMETRO_ROSTRO = 'ROSTR'
const PARAMETRO_UBICACION = 'UBICA'

// Campos numéricos obligatorios de cada JSON
const CAMPOS_ROSTRO = ['intervaloDeteccionMs', 'tiempoEstableMs', 'tamanioMinimoRostro', 'desvioMaximoCentro', 'confianzaMinimaDeteccion', 'ladoFoto', 'umbralSimilitud']
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

// Usuario de auditoría de los marcados sin login (las rutas son públicas). Distinto de 'server'
// (getUser de BaseController), que es el usuario de los procesos automáticos.
const USUARIO_SIN_LOGIN = 'asistencia-web'

// Dónde registra la asistencia la persona reconocida
const TIPOS_LUGAR = [
  { value: 'OBJ', label: 'Objetivo' },
  { value: 'CUS', label: 'Custodia' },
]

// Tipo del registro (dispositivo desde el que se marcó), para mostrarlo en la consulta
const TIPOS_REGISTRO = [
  { value: TIPO_CELULAR, label: 'Celular' },
  { value: TIPO_COMPUTADORA, label: 'Computadora' },
]

// Columnas de la consulta de registros de asistencia (grilla con filtro-builder)
const consultaColumns: any[] = [
  {
    id: "id",
    name: "id",
    field: "id",
    fieldName: "reg.RegistroAsistenciaCodigo",
    type: "number",
    sortable: false,
    hidden: true,
    searchHidden: true
  },
  {
    id: "RegistroAsistenciaCodigo",
    name: "Código",
    field: "RegistroAsistenciaCodigo",
    fieldName: "reg.RegistroAsistenciaCodigo",
    type: "number",
    searchComponent: "inputForNumberAdvancedSearch",
    sortable: true,
    hidden: false,
    searchHidden: false,
    maxWidth: 90
  },
  {
    id: "FechaHora",
    name: "Fecha Hora",
    field: "FechaHora",
    fieldName: "reg.FechaHora",
    type: "dateTime",
    searchComponent: "inputForFechaSearch",
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: "PersonalId",
    name: "Persona",
    field: "PersonalId",
    fieldName: "reg.PersonalId",
    type: "number",
    searchComponent: "inputForPersonalSearch",
    sortable: true,
    hidden: true,
    searchHidden: false,
  },
  {
    id: "ApellidoNombre",
    name: "Persona",
    field: "ApellidoNombre",
    // orderToSQL solo acepta alias.Campo: se ordena por apellido
    fieldName: "per.PersonalApellido",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
  {
    id: "ClienteId",
    name: "Cliente",
    field: "ClienteId",
    fieldName: "reg.ClienteId",
    type: "number",
    searchComponent: "inputForClientSearch",
    sortable: true,
    hidden: true,
    searchHidden: false,
  },
  {
    id: "Cliente",
    name: "Cliente",
    field: "Cliente",
    fieldName: "cli.ClienteDenominacion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
  {
    id: "CustodiaCodigo",
    name: "Custodia Código",
    field: "CustodiaCodigo",
    fieldName: "reg.CustodiaCodigo",
    type: "number",
    searchComponent: "inputForNumberAdvancedSearch",
    sortable: true,
    hidden: false,
    searchHidden: false,
    maxWidth: 120
  },
  {
    id: "Tipo",
    name: "Tipo",
    field: "Tipo",
    fieldName: "reg.Tipo",
    type: "string",
    formatter: 'collectionFormatter',
    params: { collection: TIPOS_REGISTRO },
    sortable: true,
    hidden: false,
    searchHidden: false,
    maxWidth: 120
  },
  {
    id: "GeoReferenciacion",
    name: "Georeferenciación",
    field: "GeoReferenciacion",
    fieldName: "reg.GeoReferenciacion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
]

// Distancia en metros entre dos coordenadas (fórmula de haversine)
function distanciaEnMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const RADIO_TIERRA = 6371000
  const rad = (grados: number) => grados * Math.PI / 180
  const dLat = rad(lat2 - lat1)
  const dLon = rad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * RADIO_TIERRA * Math.asin(Math.sqrt(a))
}

export class RegistroAsistenciaController extends BaseController {

  async getGridCols(req: Request, res: Response) {
    this.jsonRes(consultaColumns, res)
  }

  // Registros de asistencia para la consulta. El cliente se muestra como en el resto del sistema:
  // ClienteId/ClienteElementoDependienteId Cliente Elemento dependiente
  async listRegistros(req: Request, res: Response, next: NextFunction) {
    const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null }
    const filterSql = filtrosToSql(options.filtros, consultaColumns)
    const orderBy = orderToSQL(options.sort)
    const queryRunner = await getConnection(res.locals.userName)

    try {
      const registros = await queryRunner.query(`
        SELECT reg.RegistroAsistenciaCodigo id, reg.RegistroAsistenciaCodigo, reg.FechaHora,
          reg.PersonalId, CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre)) ApellidoNombre,
          reg.ClienteId,
          IIF(reg.ClienteId IS NULL, NULL, CONCAT(reg.ClienteId, '/', reg.ClienteElementoDependienteId, ' ', TRIM(cli.ClienteDenominacion), ' ', TRIM(eledep.ClienteElementoDependienteDescripcion))) Cliente,
          reg.CustodiaCodigo, TRIM(reg.Tipo) Tipo, reg.GeoReferenciacion
        FROM RegistroAsistencia reg
        JOIN Personal per ON per.PersonalId = reg.PersonalId
        LEFT JOIN Cliente cli ON cli.ClienteId = reg.ClienteId
        LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteId = reg.ClienteId AND eledep.ClienteElementoDependienteId = reg.ClienteElementoDependienteId
        WHERE ${filterSql}
        ${orderBy ? orderBy : 'ORDER BY reg.FechaHora DESC'}`)

      this.jsonRes(registros, res)
    } catch (error) {
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  // Las rutas no pasan por verifyToken: res.locals.userName llega vacío y se usa el usuario fijo
  private getUsuario(res: Response): string {
    return res.locals.userName || USUARIO_SIN_LOGIN
  }

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
    // La conexión se abre dentro del try: si falla, el error va a next() y no queda sin atender
    let queryRunner: QueryRunner | null = null

    try {
      queryRunner = await getConnection(this.getUsuario(res));
      const usuario = this.getUsuario(res)
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

      // Descripción del objetivo o la custodia, para mostrarla al confirmar (mismo formato que
      // la consulta de liquidaciones)
      let LugarDescripcion = ''

      // El objetivo se graba por su cliente y elemento dependiente
      let ClienteId: number | null = null
      let ClienteElementoDependienteId: number | null = null
      if (TipoLugar === 'OBJ') {
        const [objetivo] = await queryRunner.query(`
          SELECT obj.ClienteId, obj.ClienteElementoDependienteId,
            CONCAT(obj.ClienteId, '/', obj.ClienteElementoDependienteId, ' ', TRIM(cli.ClienteDenominacion), ' ', TRIM(eledep.ClienteElementoDependienteDescripcion)) AS Descripcion
          FROM Objetivo obj
          LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
          LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteId = obj.ClienteId AND eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
          WHERE obj.ObjetivoId = @0`, [ObjetivoId])
        if (!objetivo)
          throw new ClientException('El objetivo no existe', {
            fieldErrors: [{ fieldTree: 'ObjetivoId', kind: 'server', message: `No se encontró el objetivo ${ObjetivoId}` }]
          })
        ClienteId = objetivo.ClienteId
        ClienteElementoDependienteId = objetivo.ClienteElementoDependienteId
        LugarDescripcion = String(objetivo.Descripcion ?? '').trim()
      }

      // La custodia tiene que existir (clave foránea)
      let CustodiaCodigo: number | null = null
      if (TipoLugar === 'CUS') {
        CustodiaCodigo = Number(CustodiaTexto)
        const [custodia] = await queryRunner.query(`
          SELECT cus.CustodiaCodigo,
            CONCAT(cus.CustodiaCodigo, ' ', TRIM(cli.ClienteDenominacion), ' ', FORMAT(cus.FechaInicio, 'dd/MM/yyyy')) AS Descripcion
          FROM Custodia cus
          LEFT JOIN Cliente cli ON cli.ClienteId = cus.ClienteId
          WHERE cus.CustodiaCodigo = @0`, [CustodiaCodigo])
        if (!custodia)
          throw new ClientException('La custodia no existe', {
            fieldErrors: [{ fieldTree: 'CustodiaCodigo', kind: 'server', message: `No se encontró la custodia ${CustodiaCodigo}` }]
          })
        LugarDescripcion = String(custodia.Descripcion ?? '').trim()
      }

      // Por ahora solo "latitud,longitud"; sin ubicación queda vacío (la columna no admite nulos)
      const GeoReferenciacion = ubicacion?.latitud != null && ubicacion?.longitud != null
        ? `${ubicacion.latitud},${ubicacion.longitud}`
        : ''

      // Todo lo recibido y lo resuelto, para auditoría (sin la foto)
      const ObjetoCompleto = JSON.stringify({
        PersonalId, ApellidoNombre, similitud,
        TipoLugar, ObjetivoId: TipoLugar === 'OBJ' ? ObjetivoId : null,
        ClienteId, ClienteElementoDependienteId, CustodiaCodigo, LugarDescripcion,
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

      this.jsonRes({ RegistroAsistenciaCodigo, PersonalId, TipoLugar, LugarDescripcion }, res,
        `Asistencia registrada (código ${RegistroAsistenciaCodigo})`)
    } catch (error) {
      if (queryRunner) await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner?.release()
    }
  }

  // Anula (borra) una asistencia recién confirmada. Solo la puede anular el mismo usuario que la
  // registró: la ruta no permite borrar registros ajenos.
  async anular(req: Request, res: Response, next: NextFunction) {
    const RegistroAsistenciaCodigo = Number(req.body?.RegistroAsistenciaCodigo) || 0
    let queryRunner: QueryRunner | null = null

    try {
      queryRunner = await getConnection(this.getUsuario(res));
      const usuario = this.getUsuario(res)

      if (!RegistroAsistenciaCodigo)
        throw new ClientException('Falta el registro de asistencia a anular')

      await queryRunner.startTransaction()

      const [registro] = await queryRunner.query(
        `SELECT RegistroAsistenciaCodigo, PersonalId, AudUsuarioIng FROM RegistroAsistencia WHERE RegistroAsistenciaCodigo = @0`,
        [RegistroAsistenciaCodigo])

      if (!registro)
        throw new ClientException(`No se encontró el registro de asistencia ${RegistroAsistenciaCodigo}`)

      if (String(registro.AudUsuarioIng ?? '').trim().toLowerCase() !== String(usuario ?? '').trim().toLowerCase())
        throw new ClientException('Solo se puede anular una asistencia registrada por el mismo usuario')

      await queryRunner.query(`DELETE FROM RegistroAsistencia WHERE RegistroAsistenciaCodigo = @0`, [RegistroAsistenciaCodigo])

      await queryRunner.commitTransaction()

      console.log('[registro-asistencia] Asistencia anulada', {
        RegistroAsistenciaCodigo, PersonalId: registro.PersonalId, usuario,
      })

      this.jsonRes({ RegistroAsistenciaCodigo }, res, `Asistencia anulada (código ${RegistroAsistenciaCodigo})`)
    } catch (error) {
      if (queryRunner) await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner?.release()
    }
  }

  // Configuración de la detección de rostro y de la ubicación, para el front
  async getConfiguracion(req: Request, res: Response, next: NextFunction) {
    // La conexión se abre dentro del try: si falla, el error va a next() y no queda sin atender
    let queryRunner: QueryRunner | null = null

    try {
      queryRunner = await getConnection(this.getUsuario(res));
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
      await queryRunner?.release()
    }
  }

  // JSON de un parámetro general, validando que tenga todos los campos numéricos pedidos
  private leerParametro(parametros: any[], codigo: string, campos: string[]) {
    const parametro = parametros.find(p => String(p.ParametroGeneralCodigo).trim() === codigo)
    if (!parametro)
      throw new ClientException(`No se encontró el parámetro general ${codigo} con la configuración del registro de asistencia.`)

    // Diagnóstico: el texto tal cual llega de la base (stringify para ver saltos de línea y
    // caracteres ocultos)
    // console.log(`[registro-asistencia] Parámetro ${codigo} leído de la base:`, JSON.stringify(parametro.Parametros))

    let valores: any
    try {
      valores = JSON.parse(parametro.Parametros)
    } catch (_e) {
      throw new ClientException(`El parámetro general ${codigo} no tiene un formato JSON válido.`)
    }

    // console.log(`[registro-asistencia] Parámetro ${codigo} interpretado:`, valores)

    const faltantes = campos.filter(campo => !Number.isFinite(Number(valores?.[campo])))
    if (faltantes.length)
      throw new ClientException(`Al parámetro general ${codigo} le faltan valores numéricos: ${faltantes.join(', ')}.`)

    return Object.fromEntries(campos.map(campo => [campo, Number(valores[campo])]))
  }

  // Vectores contra los que se compara: DocumentoImagenFoto.VectorFacial de la foto vigente
  // (Personal.PersonalFotoId) del personal activo a la fecha (situación de revista 2, 10 o 12, como
  // en el resto del sistema), calculados con el modelo actual (VectorFacialVersion). Los graba
  // iniciarCalculoVectoresFaciales: las fotos todavía sin vector no participan. La situación de
  // revista va en EXISTS para no repetir filas (y no usar DISTINCT sobre el VARBINARY).
  private async getVectoresPersonalActivo(queryRunner: QueryRunner, fecha: Date): Promise<VectorPersonal[]> {
    const filas = await queryRunner.query(`
      SELECT per.PersonalId,
        CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre)) AS ApellidoNombre,
        foto.VectorFacial
      FROM Personal per
      JOIN DocumentoImagenFoto foto ON foto.PersonalId = per.PersonalId AND foto.DocumentoImagenFotoId = per.PersonalFotoId
      WHERE foto.VectorFacial IS NOT NULL
        AND foto.VectorFacialVersion = @1
        AND EXISTS (
          SELECT 1 FROM PersonalSituacionRevista sitrev
          WHERE sitrev.PersonalId = per.PersonalId
            AND sitrev.PersonalSituacionRevistaSituacionId IN (2, 10, 12)
            AND sitrev.PersonalSituacionRevistaDesde <= @0
            AND ISNULL(sitrev.PersonalSituacionRevistaHasta, '9999-12-31') >= @0)
    `, [fecha, VERSION_VECTOR_FACIAL])

    // Un vector con otro largo (columna truncada, dato corrupto) no se compara
    return filas
      .map((fila: any) => ({
        PersonalId: Number(fila.PersonalId),
        ApellidoNombre: fila.ApellidoNombre,
        vector: bufferAVector(fila.VectorFacial),
      }))
      .filter((fila: any): fila is VectorPersonal => !!fila.vector)
  }

  private async analizarUbicacion(queryRunner: QueryRunner, ubicacion: any, config: Record<string, number>): Promise<any[]> {
    try {
      const { precisionMaximaMetros, distanciaMaximaMetros } = config
      const latitud = Number(ubicacion?.latitud)
      const longitud = Number(ubicacion?.longitud)
      const precision = Number(ubicacion?.precision)

      if (ubicacion?.latitud == null || ubicacion?.longitud == null || !Number.isFinite(latitud) || !Number.isFinite(longitud)) {
        console.log('[registro-asistencia] Ubicación del marcado: el dispositivo no mandó ubicación', { ubicacion })
        return []
      }

      const objetivos = await queryRunner.query(`
        SELECT obj.ObjetivoId, obj.ClienteId, obj.ClienteElementoDependienteId,
          CONCAT(obj.ClienteId, '/', obj.ClienteElementoDependienteId, ' ', TRIM(cli.ClienteDenominacion), ' ', TRIM(eledep.ClienteElementoDependienteDescripcion)) AS Descripcion,
          dom.DomicilioId,
          COALESCE(NULLIF(TRIM(dom.DomicilioLatitudCorregida), ''), NULLIF(TRIM(dom.DomicilioLatitud), '')) AS Latitud,
          COALESCE(NULLIF(TRIM(dom.DomicilioLongitudCorregida), ''), NULLIF(TRIM(dom.DomicilioLongitud), '')) AS Longitud
        FROM Objetivo obj
        JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
        JOIN ClienteElementoDependiente eledep ON eledep.ClienteId = obj.ClienteId AND eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
        JOIN NexoDomicilio nexdom ON nexdom.ClienteId = obj.ClienteId AND nexdom.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND nexdom.NexoDomicilioActual = 1
        JOIN Domicilio dom ON dom.DomicilioId = nexdom.DomicilioId
        WHERE EXISTS (
          SELECT 1 FROM ClienteElementoDependienteContrato eledepcon
          WHERE eledepcon.ClienteId = obj.ClienteId AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
            AND eledepcon.ClienteElementoDependienteContratoFechaDesde <= @0
            AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaHasta, '9999-12-31') >= @0
            AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaFinalizacion, '9999-12-31') >= @0)
      `, [new Date()])

      const conCoordenadas = objetivos
        .map((obj: any) => ({ ...obj, Latitud: Number(obj.Latitud), Longitud: Number(obj.Longitud) }))
        .filter((obj: any) => Number.isFinite(obj.Latitud) && Number.isFinite(obj.Longitud) && !(obj.Latitud === 0 && obj.Longitud === 0))

      const cercanos = conCoordenadas
        .map((obj: any) => ({
          ObjetivoId: obj.ObjetivoId,
          Descripcion: String(obj.Descripcion ?? '').trim(),
          DomicilioId: obj.DomicilioId,
          coordenadas: `${obj.Latitud},${obj.Longitud}`,
          distanciaMetros: Math.round(distanciaEnMetros(latitud, longitud, obj.Latitud, obj.Longitud)),
        }))
        .sort((a: any, b: any) => a.distanciaMetros - b.distanciaMetros)

      const dentroDelRango = cercanos.filter((obj: any) => obj.distanciaMetros <= distanciaMaximaMetros)

      // console.log('[registro-asistencia] Ubicación del marcado', {
      //   dispositivo: `${latitud},${longitud}`,
      //   precisionMetros: Number.isFinite(precision) ? precision : null,
      //   precisionMaximaMetros,
      //   precisionAceptable: Number.isFinite(precision) && precision <= precisionMaximaMetros,
      //   distanciaMaximaMetros,
      //   objetivosVigentes: objetivos.length,
      //   objetivosConCoordenadas: conCoordenadas.length,
      //   // Solo los objetivos a distanciaMaximaMetros o menos, del más cercano al más lejano
      //   objetivosDentroDelRango: dentroDelRango.length,
      //   dentroDelRango: dentroDelRango.map((obj: any) => `${obj.ObjetivoId} ${obj.Descripcion}: ${obj.distanciaMetros} m`),
      // })

      return dentroDelRango
    } catch (error) {
      console.error('[registro-asistencia] Error al analizar la ubicación del marcado', error)
      return []
    }
  }

  // Prueba del marcado: reconoce el rostro contra los vectores guardados del personal activo e
  // informa en consola. Todavía no graba nada.
  async marcar(req: Request, res: Response, next: NextFunction) {
    const foto = String(req.body?.foto ?? '').replace(/^data:image\/\w+;base64,/, '')
    const ubicacion = req.body?.ubicacion ?? null
    // La conexión se abre dentro del try: si falla, el error va a next() y no queda sin atender
    let queryRunner: QueryRunner | null = null

    try {
      queryRunner = await getConnection(this.getUsuario(res));
      if (!foto)
        throw new ClientException('Falta la foto del marcado')

      const inicio = Date.now()

      // El umbral de similitud y la configuración de ubicación se leen en cada marcado: un cambio en
      // ROSTR o UBICA se aplica sin reiniciar
      const parametros = await queryRunner.query(
        `SELECT ParametroGeneralCodigo, Parametros FROM ParametroGeneral WHERE ParametroGeneralCodigo IN (@0, @1)`,
        [PARAMETRO_ROSTRO, PARAMETRO_UBICACION])
      const { umbralSimilitud } = this.leerParametro(parametros, PARAMETRO_ROSTRO, CAMPOS_ROSTRO)
      const configUbicacion = this.leerParametro(parametros, PARAMETRO_UBICACION, CAMPOS_UBICACION)

      // Con un solo objetivo en el radio, el front lo deja elegido en la confirmación; con ninguno o
      const objetivosEnRango = await this.analizarUbicacion(queryRunner, ubicacion, configUbicacion)
      const ObjetivoIdSugerido = objetivosEnRango.length === 1 ? objetivosEnRango[0].ObjetivoId : null

      const inicioVectores = Date.now()
      const vectoresPersonal = await this.getVectoresPersonalActivo(queryRunner, new Date())
      const vectoresMs = Date.now() - inicioVectores
      const resultado = await reconocerRostro(Buffer.from(foto, 'base64'), vectoresPersonal, umbralSimilitud)

      // Tiempos del back, en ms: total del marcado, leer los vectores de la base y analizar la foto
      const tiempos = { totalBackMs: Date.now() - inicio, vectoresMs, ...resultado.tiempos }

      console.log('[registro-asistencia] Marcado', {
        usuario: this.getUsuario(res),
        ubicacion,
        vectoresPersonalActivo: vectoresPersonal.length,
        rostrosDetectados: resultado.rostrosDetectados,
        umbral: umbralSimilitud,
        candidatos: resultado.candidatos.map(c => `${c.PersonalId} ${c.ApellidoNombre}: ${c.similitud.toFixed(3)}`),
        encontrado: resultado.encontrado,
        PersonalId: resultado.encontrado ? resultado.mejor.PersonalId : null,
        tiempos,
      })

      this.jsonRes({
        rostrosDetectados: resultado.rostrosDetectados,
        encontrado: resultado.encontrado,
        PersonalId: resultado.encontrado ? resultado.mejor.PersonalId : null,
        ApellidoNombre: resultado.encontrado ? resultado.mejor.ApellidoNombre : '',
        similitud: resultado.mejor?.similitud ?? null,
        ObjetivoIdSugerido,
        tiempos,
      }, res)

    } catch (error) {
      return next(error)
    } finally {
      await queryRunner?.release()
    }
  }

  // Calcula el vector facial de la foto vigente del personal activo y lo graba en
  // DocumentoImagenFoto.VectorFacial y VectorFacialFecha. Solo las fotos con VectorFacial en NULL:
  // las que ya tienen vector se saltean. Queda registrado en EventoLog.
  async iniciarCalculoVectoresFaciales(req: Request, res: Response, next: NextFunction) {
    const usuario = this.getUser(res)
    const ip = this.getRemoteAddress(req)
    const queryRunner = await getConnection(usuario);
    const fechaActual = new Date()
    fechaActual.setHours(0, 0, 0, 0)
    let EventoLogCodigo = 0


    try {

      ({ EventoLogCodigo } = await this.eventoLogInicio(
        queryRunner,
        `Cálculo Vectores Faciales`,
        { usuario, ip },
        usuario,
        ip,
        "JOB"
      ));

      const resumen = await this.calcularVectoresFacialesPendientes(queryRunner)
      const resp = `Vectores faciales: ${resumen.guardadas} guardados, ${resumen.sinRostro} fotos sin rostro, ${resumen.conError} con error (de ${resumen.pendientes} pendientes)`

      await this.eventoLogFin(
        queryRunner,
        EventoLogCodigo,
        'COM',
        {
          res: resp,
          resumen
        },
        usuario,
        ip
      );

      if (res)
        this.jsonRes({ list: [] }, res, resp);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      await this.eventoLogFin(queryRunner,
        EventoLogCodigo,
        'ERR',
        { res: error },
        usuario,
        ip
      );
      return next(error)
    } finally {
      await queryRunner.release();
    }
  }

  // Busca las fotos pendientes (foto vigente del personal activo, mismo criterio que
  // getVectoresPersonalActivo, con VectorFacial en NULL), calcula el vector de cada una y lo graba. Cada foto se graba sola (sin transacción): si
  // el proceso se corta, lo grabado queda. Una foto que falla no corta el resto: se cuenta y los
  // errores se devuelven agrupados por causa, con algunas rutas de ejemplo.
  private async calcularVectoresFacialesPendientes(queryRunner: QueryRunner) {
    const fotos = await queryRunner.query(`
      SELECT DISTINCT foto.DocumentoImagenFotoId, foto.PersonalId, doc.DocumentoPath
      FROM Personal per
      JOIN PersonalSituacionRevista sitrev ON sitrev.PersonalId = per.PersonalId
        AND sitrev.PersonalSituacionRevistaDesde <= @0
        AND ISNULL(sitrev.PersonalSituacionRevistaHasta, '9999-12-31') >= @0
      JOIN DocumentoImagenFoto foto ON foto.PersonalId = per.PersonalId AND foto.DocumentoImagenFotoId = per.PersonalFotoId
      JOIN Documento doc ON doc.DocumentoId = foto.DocumentoId
      WHERE sitrev.PersonalSituacionRevistaSituacionId IN (2, 10, 12)
        AND foto.VectorFacial IS NULL
    `, [new Date()])

    let guardadas = 0, sinRostro = 0, conError = 0
    const errores: Record<string, { cantidad: number, ejemplos: string[] }> = {}

    for (const foto of fotos) {
      const ruta = join(FileUploadController.pathDocuments, foto.DocumentoPath)
      try {
        const vector = await calcularVectorFacial(ruta)
        if (!vector) {
          sinRostro++
          continue
        }
        const { VectorFacial, VectorFacialFecha, VectorFacialVersion } = columnasVectorFacial(vector)
        await queryRunner.query(`
          UPDATE DocumentoImagenFoto SET VectorFacial = @0, VectorFacialFecha = @1, VectorFacialVersion = @4
          WHERE DocumentoImagenFotoId = @2 AND PersonalId = @3 AND VectorFacial IS NULL
        `, [VectorFacial, VectorFacialFecha, foto.DocumentoImagenFotoId, foto.PersonalId, VectorFacialVersion])
        guardadas++
      } catch (error) {
        conError++
        // La causa sin la ruta (el mensaje de Jimp/fs la incluye), para poder agrupar
        const causa = (error instanceof Error ? error.message : String(error)).split(ruta).join('<ruta>')
        errores[causa] ??= { cantidad: 0, ejemplos: [] }
        errores[causa].cantidad++
        if (errores[causa].ejemplos.length < 3) errores[causa].ejemplos.push(`${ruta} (PersonalId ${foto.PersonalId})`)
      }
    }

    return { pendientes: fotos.length, guardadas, sinRostro, conError, pathDocuments: FileUploadController.pathDocuments, errores }
  }
}
