import { BaseController } from "./base.controller.ts";
import { botServer, dbServer } from "../index.ts";

// Funciones del agente de asistencia (ASIS). PersonalId y chatId los pone siempre el servidor, nunca el modelo.
// Mientras una función no esté implementada devuelve un Error para que la IA no informe una operación inexistente.
const EN_DESARROLLO = { Error: 'FUNCION_EN_DESARROLLO', mensaje: 'Esta función todavía no está disponible.' }

// Pasa a ParametroGeneral cuando se cree el parámetro
const HORAS_INGRESO_ABIERTO = 12
// Se usa solo si falta distanciaMaximaMetros en el parámetro general UBICA
const DISTANCIA_MAXIMA_METROS = 500

// Distancia en metros entre dos coordenadas (fórmula de haversine, igual que registro-asistencia de back)
function distanciaEnMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const RADIO_TIERRA = 6371000
  const rad = (grados: number) => grados * Math.PI / 180
  const dLat = rad(lat2 - lat1)
  const dLon = rad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * RADIO_TIERRA * Math.asin(Math.sqrt(a))
}

export class AsistenciaController extends BaseController {

  // Último movimiento, ingreso abierto (objetivo y horas), operación sugerida y verificación requerida
  async getEstadoAsistencia(personalId: number) {
    const queryRunner = await dbServer.connection()
    try {
      const rows = await queryRunner.query(`
        SELECT TOP 1 ra.RegistroAsistenciaCodigo, ra.Tipo, ra.FechaHora, ra.ClienteId, ra.ClienteElementoDependienteId,
          CONCAT(TRIM(cli.ClienteDenominacion), ' - ', TRIM(ele.ClienteElementoDependienteDescripcion)) Objetivo,
          DATEDIFF(MINUTE, ra.FechaHora, GETDATE()) MinutosTranscurridos
        FROM RegistroAsistencia ra
        LEFT JOIN Cliente cli ON cli.ClienteId = ra.ClienteId
        LEFT JOIN ClienteElementoDependiente ele ON ele.ClienteId = ra.ClienteId AND ele.ClienteElementoDependienteId = ra.ClienteElementoDependienteId
        WHERE ra.PersonalId = @0 AND ra.FechaAnulado IS NULL AND ra.Tipo IN ('ING', 'EGR')
        ORDER BY ra.FechaHora DESC, ra.RegistroAsistenciaCodigo DESC
      `, [personalId])

      const ultimo = rows[0]
      const ingresoAbierto = ultimo?.Tipo === 'ING'
      const horasDesdeIngreso = ingresoAbierto ? Math.round(ultimo.MinutosTranscurridos / 6) / 10 : null

      // SIN_REGISTROS: mostrar las 3 opciones. EGR: ingreso abierto dentro del rango.
      // PREGUNTAR: ingreso abierto fuera del rango. ING: el último movimiento fue un egreso.
      let operacionSugerida = 'SIN_REGISTROS'
      if (ingresoAbierto)
        operacionSugerida = horasDesdeIngreso <= HORAS_INGRESO_ABIERTO ? 'EGR' : 'PREGUNTAR'
      else if (ultimo)
        operacionSugerida = 'ING'

      return {
        tieneRegistrosPrevios: !!ultimo,
        ultimoRegistro: ultimo ? {
          RegistroAsistenciaCodigo: ultimo.RegistroAsistenciaCodigo,
          Tipo: ultimo.Tipo,
          FechaHora: ultimo.FechaHora,
          ClienteId: ultimo.ClienteId,
          ClienteElementoDependienteId: ultimo.ClienteElementoDependienteId,
          Objetivo: ultimo.Objetivo
        } : null,
        ingresoAbierto,
        horasDesdeIngreso,
        horasLimiteIngresoAbierto: HORAS_INGRESO_ABIERTO,
        operacionSugerida,
        // Provisorio: UBICACION hasta que esté el enlace de verificación facial
        verificacionRequerida: 'UBICACION'
      }
    } finally {
      await queryRunner.release()
    }
  }

  // Objetivo ingresado a mano por código ClienteId/ClienteElementoDependienteId (ej. 134/2)
  async getObjetivoPorCodigo(chatId: string, CodObjetivo: string | undefined) {
    const partes = String(CodObjetivo ?? '').replace(/\s/g, '').match(/^(\d+)\/(\d+)$/)
    if (!partes)
      return { Error: 'CODIGO_INVALIDO', mensaje: 'El código de objetivo debe tener el formato número/número, por ejemplo 134/2.' }
    const ClienteId = Number(partes[1])
    const ClienteElementoDependienteId = Number(partes[2])

    const queryRunner = await dbServer.connection()
    try {
      const rows = await queryRunner.query(`
        SELECT obj.ClienteId, obj.ClienteElementoDependienteId,
          CONCAT(obj.ClienteId, '/', obj.ClienteElementoDependienteId) CodObjetivo,
          CONCAT(TRIM(cli.ClienteDenominacion), ' - ', TRIM(eledep.ClienteElementoDependienteDescripcion)) Objetivo,
          COALESCE(NULLIF(TRIM(dom.DomicilioLatitudCorregida), ''), NULLIF(TRIM(dom.DomicilioLatitud), '')) Latitud,
          COALESCE(NULLIF(TRIM(dom.DomicilioLongitudCorregida), ''), NULLIF(TRIM(dom.DomicilioLongitud), '')) Longitud,
          CASE WHEN EXISTS (
            SELECT 1 FROM ClienteElementoDependienteContrato eledepcon
            WHERE eledepcon.ClienteId = obj.ClienteId AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
              AND eledepcon.ClienteElementoDependienteContratoFechaDesde <= @2
              AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaHasta, '9999-12-31') >= @2
              AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaFinalizacion, '9999-12-31') >= @2
          ) THEN 1 ELSE 0 END Vigente
        FROM Objetivo obj
        JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
        JOIN ClienteElementoDependiente eledep ON eledep.ClienteId = obj.ClienteId AND eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
        LEFT JOIN NexoDomicilio nexdom ON nexdom.ClienteId = obj.ClienteId AND nexdom.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND nexdom.NexoDomicilioActual = 1
        LEFT JOIN Domicilio dom ON dom.DomicilioId = nexdom.DomicilioId
        WHERE obj.ClienteId = @0 AND obj.ClienteElementoDependienteId = @1
      `, [ClienteId, ClienteElementoDependienteId, new Date()])

      const obj = rows[0]
      if (!obj)
        return { Error: 'OBJETIVO_NO_ENCONTRADO', mensaje: `No existe un objetivo con el código ${ClienteId}/${ClienteElementoDependienteId}.` }
      if (!obj.Vigente)
        return { Error: 'OBJETIVO_NO_VIGENTE', mensaje: `El objetivo ${obj.CodObjetivo} no está vigente.` }

      const ubicacion = botServer.iaHistorial[chatId]?.ubicacion ?? null
      const lat = Number(obj.Latitud)
      const lon = Number(obj.Longitud)
      const conCoordenadas = obj.Latitud != null && obj.Longitud != null && Number.isFinite(lat) && Number.isFinite(lon) && !(lat === 0 && lon === 0)
      const distanciaMetros = ubicacion && conCoordenadas
        ? Math.round(distanciaEnMetros(ubicacion.latitud, ubicacion.longitud, lat, lon))
        : null

      return {
        ClienteId: obj.ClienteId,
        ClienteElementoDependienteId: obj.ClienteElementoDependienteId,
        CodObjetivo: obj.CodObjetivo,
        Objetivo: String(obj.Objetivo ?? '').trim(),
        distanciaMetros,
        distanciaMaximaMetros: await this.getDistanciaMaximaMetros(queryRunner)
      }
    } finally {
      await queryRunner.release()
    }
  }

  // Objetivos vigentes: cercanos a la ubicación recibida y de asistencias anteriores
  async getObjetivosSugeridos(personalId: number, chatId: string) {
    const queryRunner = await dbServer.connection()
    try {
      const ubicacion = botServer.iaHistorial[chatId]?.ubicacion ?? null
      const vigentes = await this.getObjetivosVigentes(queryRunner)
      const conDistancia = vigentes.map((obj: any) => ({
        ...obj,
        distanciaMetros: ubicacion && obj.Latitud != null
          ? Math.round(distanciaEnMetros(ubicacion.latitud, ubicacion.longitud, obj.Latitud, obj.Longitud))
          : null
      }))
      const salida = (obj: any) => ({
        ClienteId: obj.ClienteId,
        ClienteElementoDependienteId: obj.ClienteElementoDependienteId,
        CodObjetivo: obj.CodObjetivo,
        Objetivo: obj.Objetivo,
        distanciaMetros: obj.distanciaMetros
      })

      const distanciaMaximaMetros = await this.getDistanciaMaximaMetros(queryRunner)

      const anteriores = await queryRunner.query(`
        SELECT TOP 5 ra.ClienteId, ra.ClienteElementoDependienteId, MAX(ra.FechaHora) UltimaFecha
        FROM RegistroAsistencia ra
        WHERE ra.PersonalId = @0 AND ra.FechaAnulado IS NULL AND ra.Tipo IN ('ING', 'EGR')
        GROUP BY ra.ClienteId, ra.ClienteElementoDependienteId
        ORDER BY MAX(ra.FechaHora) DESC
      `, [personalId])
      const deAsistenciasAnteriores = anteriores
        .map((ant: any) => conDistancia.find((obj: any) => obj.ClienteId == ant.ClienteId && obj.ClienteElementoDependienteId == ant.ClienteElementoDependienteId))
        .filter((obj: any) => !!obj)
        .map(salida)

      if (!ubicacion)
        return { ubicacionRecibida: false, accion: 'Pedile que comparta su ubicación actual.', deAsistenciasAnteriores }

      const ordenados = conDistancia
        .filter((obj: any) => obj.distanciaMetros != null)
        .sort((a: any, b: any) => a.distanciaMetros - b.distanciaMetros)
      const cercanos = ordenados.filter((obj: any) => obj.distanciaMetros <= distanciaMaximaMetros)

      return {
        ubicacionRecibida: true,
        distanciaMaximaMetros,
        // Uno solo: proponerlo. Varios: lista para elegir. Ninguno: los más próximos fuera del rango.
        cercanos: cercanos.slice(0, 10).map(salida),
        masProximosFueraDeRango: cercanos.length ? [] : ordenados.slice(0, 5).map(salida),
        deAsistenciasAnteriores
      }
    } finally {
      await queryRunner.release()
    }
  }

  // Objetivos con contrato vigente hoy, con sus coordenadas si las tienen (misma consulta que registro-asistencia de back)
  private async getObjetivosVigentes(queryRunner: any) {
    const objetivos = await queryRunner.query(`
      SELECT obj.ObjetivoId, obj.ClienteId, obj.ClienteElementoDependienteId,
        CONCAT(obj.ClienteId, '/', obj.ClienteElementoDependienteId) CodObjetivo,
        CONCAT(TRIM(cli.ClienteDenominacion), ' - ', TRIM(eledep.ClienteElementoDependienteDescripcion)) Objetivo,
        COALESCE(NULLIF(TRIM(dom.DomicilioLatitudCorregida), ''), NULLIF(TRIM(dom.DomicilioLatitud), '')) Latitud,
        COALESCE(NULLIF(TRIM(dom.DomicilioLongitudCorregida), ''), NULLIF(TRIM(dom.DomicilioLongitud), '')) Longitud
      FROM Objetivo obj
      JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
      JOIN ClienteElementoDependiente eledep ON eledep.ClienteId = obj.ClienteId AND eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
      LEFT JOIN NexoDomicilio nexdom ON nexdom.ClienteId = obj.ClienteId AND nexdom.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND nexdom.NexoDomicilioActual = 1
      LEFT JOIN Domicilio dom ON dom.DomicilioId = nexdom.DomicilioId
      WHERE EXISTS (
        SELECT 1 FROM ClienteElementoDependienteContrato eledepcon
        WHERE eledepcon.ClienteId = obj.ClienteId AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
          AND eledepcon.ClienteElementoDependienteContratoFechaDesde <= @0
          AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaHasta, '9999-12-31') >= @0
          AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaFinalizacion, '9999-12-31') >= @0)
    `, [new Date()])

    return objetivos.map((obj: any) => {
      const lat = Number(obj.Latitud)
      const lon = Number(obj.Longitud)
      const valida = obj.Latitud != null && obj.Longitud != null && Number.isFinite(lat) && Number.isFinite(lon) && !(lat === 0 && lon === 0)
      return { ...obj, Objetivo: String(obj.Objetivo ?? '').trim(), Latitud: valida ? lat : null, Longitud: valida ? lon : null }
    })
  }

  // Radio para considerar cercano un objetivo: parámetro general UBICA, el mismo del registro de asistencia de back
  private async getDistanciaMaximaMetros(queryRunner: any) {
    const rows = await queryRunner.query(`SELECT Parametros FROM ParametroGeneral WHERE ParametroGeneralCodigo = @0`, ['UBICA'])
    try {
      const valor = Number(JSON.parse(rows[0]?.Parametros ?? '{}').distanciaMaximaMetros)
      if (Number.isFinite(valor) && valor > 0) return valor
    } catch (_e) { }
    return DISTANCIA_MAXIMA_METROS
  }

  // Graba un INGRESO o EGRESO en RegistroAsistencia; valida que no queden dos ingresos abiertos
  async registrarAsistencia(personalId: number, chatId: string, args: any) {
    return EN_DESARROLLO
  }

  // Cambia solo el objetivo del último registro de la persona
  async modificarObjetivoUltimoRegistro(personalId: number, chatId: string, args: any) {
    return EN_DESARROLLO
  }

  // Anula (FechaAnulado) un registro de la persona, sin borrarlo
  async anularRegistroAsistencia(personalId: number, chatId: string, args: any) {
    return EN_DESARROLLO
  }

  // Genera el enlace externo que toma la foto y la ubicación
  async getLinkVerificacionFacial(personalId: number, chatId: string) {
    return EN_DESARROLLO
  }

  // Resultado de la verificación facial e intentos restantes
  async getResultadoVerificacion(personalId: number, chatId: string) {
    return EN_DESARROLLO
  }

}
