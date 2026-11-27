import { BaseController, ClientException } from "./base.controller.ts";
import type { NextFunction, Response } from "express";
import * as CryptoJS from 'crypto-js';
import { botServer, dbServer } from "../index.ts";
import { IA_HISTORIAL_TIMEOUT_MS } from "../bot-server.ts";
import { chatBotController, personalController } from "./controller.module.ts";

// Funciones del agente de asistencia (ASIS). PersonalId y chatId los pone siempre el servidor, nunca el modelo.

// Parámetro general con las variables del agente de asistencia
const PARAMETRO_ASISTENCIA = 'ASBOT'
// Se usan solo si falta el parámetro ASBOT o alguno de sus valores (solo numéricos;
// verificacionFacialSiempre es booleano y se lee aparte, con false por defecto)
const PARAMETROS_POR_DEFECTO = {
  horasIngresoAbierto: 12,
  horasLimiteCorreccion: 2,
  diasVerificacionFacial: 7,
  intentosVerificacionFacial: 3
}
// Modelo de los vectores faciales: tiene que ser igual a VERSION_VECTOR_FACIAL de back (reconocimiento-facial.ts)
const VERSION_VECTOR_FACIAL = 'sface_2021dec'
// Mensaje interno con el que se dispara el agente cuando termina la verificación facial
const MENSAJE_VERIFICACION_TERMINADA = 'Verificación facial terminada. Consultá getResultadoVerificacion y seguí con el registro.'
// Origen de los registros hechos desde el chatbot (tabla RegistroAsistenciaOrigen)
const ORIGEN_REGISTRO = 'BW'
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
  async getEstadoAsistencia(personalId: number, chatId: string) {
    const queryRunner = await dbServer.connection()
    try {
      const rows = await queryRunner.query(`
        SELECT TOP 1 ra.RegistroAsistenciaCodigo, ra.Tipo, ra.FechaHora, ra.ClienteId, ra.ClienteElementoDependienteId,
          CONCAT(TRIM(cli.ClienteDenominacion), ' - ', TRIM(ele.ClienteElementoDependienteDescripcion)) Objetivo,
          DATEDIFF(MINUTE, ra.FechaHora, GETDATE()) MinutosTranscurridos,
          DATEDIFF(MINUTE, ra.AudFechaIng, GETDATE()) MinutosDesdeCarga
        FROM RegistroAsistencia ra
        LEFT JOIN Cliente cli ON cli.ClienteId = ra.ClienteId
        LEFT JOIN ClienteElementoDependiente ele ON ele.ClienteId = ra.ClienteId AND ele.ClienteElementoDependienteId = ra.ClienteElementoDependienteId
        WHERE ra.PersonalId = @0 AND ra.FechaAnulado IS NULL AND ra.Tipo IN ('ING', 'EGR')
        ORDER BY ra.FechaHora DESC, ra.RegistroAsistenciaCodigo DESC
      `, [personalId])

      const ultimo = rows[0]
      const parametros = await this.getParametrosAsistencia(queryRunner)
      const ingresoAbierto = ultimo?.Tipo === 'ING'
      const horasDesdeIngreso = ingresoAbierto ? Math.round(ultimo.MinutosTranscurridos / 6) / 10 : null
      // Se cuenta desde que se cargó el registro, no desde la hora informada
      const puedeCorregir = !!ultimo && ultimo.MinutosDesdeCarga <= parametros.horasLimiteCorreccion * 60

      // SIN_REGISTROS: mostrar las 3 opciones. EGR: ingreso abierto dentro del rango.
      // EGR_PENDIENTE: ingreso abierto fuera del rango, hay que registrar el egreso antes de otro ingreso.
      // ING: el último movimiento fue un egreso.
      let operacionSugerida = 'SIN_REGISTROS'
      if (ingresoAbierto)
        operacionSugerida = horasDesdeIngreso <= parametros.horasIngresoAbierto ? 'EGR' : 'EGR_PENDIENTE'
      else if (ultimo)
        operacionSugerida = 'ING'

      // Última verificación facial correcta, de un registro sin anular. El resultado se guarda en el
      // JSON de ObjetoCompleto (no hay columna propia); el CASE evita leer un ObjetoCompleto que no sea JSON
      const verificaciones = await queryRunner.query(`
        SELECT MAX(ra.FechaHora) UltimaVerificacionFacial, DATEDIFF(DAY, MAX(ra.FechaHora), GETDATE()) DiasDesdeVerificacionFacial
        FROM RegistroAsistencia ra
        WHERE ra.PersonalId = @0 AND ra.FechaAnulado IS NULL
          AND CASE WHEN ISJSON(ra.ObjetoCompleto) = 1 THEN JSON_VALUE(ra.ObjetoCompleto, '$.VerificacionFacial') END = 'OK'
      `, [personalId])
      const ultimaVerificacionFacial = verificaciones[0]?.UltimaVerificacionFacial ?? null

      // Se pide la cara si está configurado siempre, si nunca verificó o si pasaron los días del parámetro
      const requiereFacial = parametros.verificacionFacialSiempre || !ultimaVerificacionFacial
        || verificaciones[0].DiasDesdeVerificacionFacial >= parametros.diasVerificacionFacial
      // Sin foto vigente con vector facial no se manda el enlace: se pide la ubicación y se registra como FALLO
      const sinFotoVerificacionFacial = requiereFacial && !(await this.tieneVectorFacial(queryRunner, personalId))

      const resultadoSesion = botServer.iaHistorial[chatId]?.verificacionFacial?.resultado

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
        horasLimiteIngresoAbierto: parametros.horasIngresoAbierto,
        // Si el último registro todavía se puede anular o modificar
        puedeCorregir,
        horasLimiteCorreccion: parametros.horasLimiteCorreccion,
        operacionSugerida,
        verificacionRequerida: requiereFacial && !sinFotoVerificacionFacial ? 'FACIAL' : 'UBICACION',
        ultimaVerificacionFacial,
        sinFotoVerificacionFacial,
        // Hay un resultado de verificación facial (OK o FALLO) todavía sin usar en un registro
        verificacionFacialLista: resultadoSesion === 'OK' || resultadoSesion === 'FALLO'
      }
    } finally {
      await queryRunner.release()
    }
  }

  // Objetivo ingresado a mano por código ClienteId/ClienteElementoDependienteId (ej. 134/2)
  async getObjetivoPorCodigo(latitud:number, longitud:number, CodObjetivo: string | undefined) {
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

      const lat = Number(obj.Latitud)
      const lon = Number(obj.Longitud)
      const conCoordenadas = obj.Latitud != null && obj.Longitud != null && Number.isFinite(lat) && Number.isFinite(lon) && !(lat === 0 && lon === 0)
      const distanciaMetros = latitud && conCoordenadas
        ? Math.round(distanciaEnMetros(latitud, longitud, lat, lon))
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
  async getObjetivosSugeridos(personalId: number, latitud:number, longitud:number) {
    const queryRunner = await dbServer.connection()
    try {
      const vigentes = await this.getObjetivosVigentes(queryRunner)
      const conDistancia = vigentes.map((obj: any) => ({
        ...obj,
        distanciaMetros:  obj.Latitud != null
          ? Math.round(distanciaEnMetros(latitud, longitud, obj.Latitud, obj.Longitud))
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

  // Variables del agente (parámetro general ASBOT); cada valor faltante o inválido toma su valor por defecto
  private async getParametrosAsistencia(queryRunner: any) {
    const rows = await queryRunner.query(`SELECT Parametros FROM ParametroGeneral WHERE ParametroGeneralCodigo = @0`, [PARAMETRO_ASISTENCIA])
    let valores: any = {}
    try {
      valores = JSON.parse(rows[0]?.Parametros ?? '{}') ?? {}
    } catch (_e) { }
    const parametros = { ...PARAMETROS_POR_DEFECTO }
    for (const clave of Object.keys(parametros) as (keyof typeof PARAMETROS_POR_DEFECTO)[]) {
      const valor = Number(valores[clave])
      if (Number.isFinite(valor) && valor >= 0) parametros[clave] = valor
    }
    const verificacionFacialSiempre = valores.verificacionFacialSiempre === true || valores.verificacionFacialSiempre === 1
    return { ...parametros, verificacionFacialSiempre }
  }

  // Si la persona tiene foto vigente con vector facial: misma condición que getVectoresPersonalActivo de back
  // (foto más reciente con documento, vector del modelo actual y situación de revista 2, 10 o 12)
  private async tieneVectorFacial(queryRunner: any, personalId: number) {
    const fotos = await queryRunner.query(`
      SELECT TOP 1 foto.DocumentoImagenFotoId
      FROM DocumentoImagenFoto foto
      WHERE foto.PersonalId = @0
        AND foto.DocumentoImagenFotoId = (
          SELECT MAX(f.DocumentoImagenFotoId)
          FROM DocumentoImagenFoto f
          JOIN Documento doc ON doc.DocumentoId = f.DocumentoId
          WHERE f.PersonalId = @0)
        AND foto.VectorFacial IS NOT NULL
        AND foto.VectorFacialVersion = @1
        AND EXISTS (
          SELECT 1 FROM PersonalSituacionRevista sitrev
          WHERE sitrev.PersonalId = foto.PersonalId
            AND sitrev.PersonalSituacionRevistaSituacionId IN (2, 10, 12)
            AND sitrev.PersonalSituacionRevistaDesde <= @2
            AND ISNULL(sitrev.PersonalSituacionRevistaHasta, '9999-12-31') >= @2)
    `, [personalId, VERSION_VECTOR_FACIAL, new Date()])
    return fotos.length > 0
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
  async registrarAsistencia(personalId: number, chatId: string, latitude:number, longitude:number, args: any) {
    const Tipo = String(args?.Tipo ?? '').trim().toUpperCase()
    if (Tipo !== 'ING' && Tipo !== 'EGR')
      return { Error: 'TIPO_INVALIDO', mensaje: 'La operación debe ser ING (ingreso) o EGR (egreso).' }

    const Observaciones = String(args?.Observaciones ?? '').trim() || null
    const ahora = new Date()

    // Hora informada por el asociado (ingreso o egreso olvidado): no puede ser futura y requiere observación
    let FechaHora = ahora
    const horaInformada = !!String(args?.FechaHora ?? '').trim()
    if (horaInformada) {
      FechaHora = new Date(String(args.FechaHora).trim().replace(' ', 'T'))
      if (isNaN(FechaHora.getTime()))
        return { Error: 'FECHA_INVALIDA', mensaje: 'La fecha y hora debe tener el formato YYYY-MM-DD HH:mm.' }
      if (FechaHora > ahora)
        return { Error: 'FECHA_FUTURA', mensaje: 'La fecha y hora informada no puede ser posterior a la actual.' }
      if (!Observaciones)
        return { Error: 'FALTA_OBSERVACION', mensaje: 'Cuando la hora la informa el asociado hay que completar Observaciones.' }
    }

    // Verificación facial: se controla en el servidor, sin depender del modelo
    const verificacion = botServer.iaHistorial[chatId]?.verificacionFacial ?? null
    const resultadoFacial = verificacion?.resultado === 'OK' || verificacion?.resultado === 'FALLO' ? verificacion.resultado : null
    const estado = await this.getEstadoAsistencia(personalId, chatId)
    if (estado.verificacionRequerida === 'FACIAL' && !resultadoFacial)
      return { Error: 'FALTA_VERIFICACION_FACIAL', mensaje: 'Antes de registrar hay que completar la verificación facial con el enlace de getLinkVerificacionFacial.' }

    // OK, FALLO o NULL si no se pidió; la nota queda en Observaciones
    let VerificacionFacial: string | null = resultadoFacial
    let notaVerificacion = ''
    if (resultadoFacial === 'FALLO') {
      notaVerificacion = 'Falló la verificación facial.'
    } else if (!resultadoFacial && estado.sinFotoVerificacionFacial) {
      VerificacionFacial = 'FALLO'
      notaVerificacion = 'Sin foto para verificación facial.'
    }
    const ObservacionesRegistro = [Observaciones, notaVerificacion].filter(Boolean).join(' | ') || null

    // El objetivo tiene que existir y estar vigente
    const objetivo: any = await this.getObjetivoPorCodigo(latitude, longitude, `${args?.ClienteId}/${args?.ClienteElementoDependienteId}`)
    if (objetivo.Error) return objetivo

    const usuario = BaseController.getUser(null)
    const ip = '::1'
    const queryRunner = await dbServer.connection()
    try {
      await queryRunner.startTransaction()

      // Último movimiento con bloqueo: evita dos ingresos abiertos por mensajes simultáneos
      const ultimos = await queryRunner.query(`
        SELECT TOP 1 ra.RegistroAsistenciaCodigo, ra.Tipo, ra.FechaHora, ra.ClienteId, ra.ClienteElementoDependienteId
        FROM RegistroAsistencia ra WITH (UPDLOCK, HOLDLOCK)
        WHERE ra.PersonalId = @0 AND ra.FechaAnulado IS NULL AND ra.Tipo IN ('ING', 'EGR')
        ORDER BY ra.FechaHora DESC, ra.RegistroAsistenciaCodigo DESC
      `, [personalId])
      const ultimo = ultimos[0]

      if (Tipo === 'ING' && ultimo?.Tipo === 'ING') {
        await queryRunner.rollbackTransaction()
        return { Error: 'INGRESO_ABIERTO', mensaje: 'Tiene un ingreso abierto. Primero hay que registrar su egreso.', ingresoAbierto: ultimo }
      }
      if (Tipo === 'EGR' && ultimo?.Tipo !== 'ING') {
        await queryRunner.rollbackTransaction()
        return { Error: 'SIN_INGRESO_ABIERTO', mensaje: 'No tiene un ingreso abierto para registrar el egreso.' }
      }
      if (Tipo === 'EGR' && (ultimo.ClienteId != objetivo.ClienteId || ultimo.ClienteElementoDependienteId != objetivo.ClienteElementoDependienteId)) {
        await queryRunner.rollbackTransaction()
        return { Error: 'EGRESO_OTRO_OBJETIVO', mensaje: `El ingreso abierto es en el objetivo ${ultimo.ClienteId}/${ultimo.ClienteElementoDependienteId}. El egreso tiene que ser de ese objetivo.` }
      }
      if (ultimo && FechaHora <= new Date(ultimo.FechaHora)) {
        await queryRunner.rollbackTransaction()
        return { Error: 'FECHA_ANTERIOR_AL_ULTIMO', mensaje: 'La fecha y hora tiene que ser posterior al último registro de asistencia.', ultimoRegistro: ultimo }
      }

      const GeoReferenciacion = latitude?`${latitude},${longitude}` : ''
      // Todo lo recibido y lo resuelto, para auditoría
      const ObjetoCompleto = JSON.stringify({
        PersonalId: personalId, chatId, Tipo, FechaHora, horaInformada,
        ClienteId: objetivo.ClienteId, ClienteElementoDependienteId: objetivo.ClienteElementoDependienteId,
        Objetivo: objetivo.Objetivo, latitude,longitude, distanciaMetros: objetivo.distanciaMetros,
        distanciaMaximaMetros: objetivo.distanciaMaximaMetros, Observaciones: ObservacionesRegistro,
        VerificacionFacial, similitud: verificacion?.similitud ?? null, usuario, fechaRegistro: ahora
      })

      const RegistroAsistenciaCodigo = await BaseController.getProxNumero(queryRunner, 'RegistroAsistencia', usuario, ip)
      await queryRunner.query(`
        INSERT INTO RegistroAsistencia (
          RegistroAsistenciaCodigo, FechaHora, PersonalId, ClienteId, ClienteElementoDependienteId,
          CustodiaCodigo, Tipo, RegistroAsistenciaOrigenCodigo, GeoReferenciacion, ObjetoCompleto, Observaciones,
          AudFechaIng, AudFechaMod, AudIpIng, AudIpMod, AudUsuarioIng, AudUsuarioMod
        ) VALUES (@0, @1, @2, @3, @4, NULL, @5, @6, @7, @8, @9, @10, @10, @11, @11, @12, @12)
      `, [
        RegistroAsistenciaCodigo, FechaHora, personalId, objetivo.ClienteId, objetivo.ClienteElementoDependienteId,
        Tipo, ORIGEN_REGISTRO, GeoReferenciacion, ObjetoCompleto, ObservacionesRegistro,
        ahora, ip, usuario
      ])

      await queryRunner.commitTransaction()

      // El resultado de la verificación facial ya se usó
      if (botServer.iaHistorial[chatId])
        delete botServer.iaHistorial[chatId].verificacionFacial

      return {
        registrado: true,
        RegistroAsistenciaCodigo,
        Tipo,
        FechaHora,
        Objetivo: objetivo.Objetivo,
        CodObjetivo: objetivo.CodObjetivo,
        distanciaMetros: objetivo.distanciaMetros,
        Observaciones: ObservacionesRegistro,
        VerificacionFacial
      }
    } catch (err) {
      await this.rollbackTransaction(queryRunner)
      throw err
    } finally {
      await queryRunner.release()
    }
  }

  // Cambia solo el objetivo del último registro de la persona, dentro del plazo de corrección.
  // Un egreso no se modifica porque tiene que ser del mismo objetivo que su ingreso.
  async modificarObjetivoUltimoRegistro(personalId: number, chatId: string, args: any) {
    // El objetivo nuevo tiene que existir y estar vigente
    const objetivo: any = await this.getObjetivoPorCodigo(null,null, `${args?.ClienteId}/${args?.ClienteElementoDependienteId}`)
    if (objetivo.Error) return objetivo

    const Motivo = String(args?.Observaciones ?? '').trim() || null
    const ahora = new Date()
    const usuario = BaseController.getUser(null)
    const ip = '::1'
    let ultimo: any
    let Observacion = ''
    const queryRunner = await dbServer.connection()
    try {
      await queryRunner.startTransaction()

      const ultimos = await queryRunner.query(`
        SELECT TOP 1 ra.RegistroAsistenciaCodigo, ra.Tipo, ra.FechaHora, ra.ClienteId, ra.ClienteElementoDependienteId,
          CONCAT(TRIM(cli.ClienteDenominacion), ' - ', TRIM(ele.ClienteElementoDependienteDescripcion)) Objetivo,
          DATEDIFF(MINUTE, ra.AudFechaIng, GETDATE()) MinutosDesdeCarga
        FROM RegistroAsistencia ra WITH (UPDLOCK, HOLDLOCK)
        LEFT JOIN Cliente cli ON cli.ClienteId = ra.ClienteId
        LEFT JOIN ClienteElementoDependiente ele ON ele.ClienteId = ra.ClienteId AND ele.ClienteElementoDependienteId = ra.ClienteElementoDependienteId
        WHERE ra.PersonalId = @0 AND ra.FechaAnulado IS NULL AND ra.Tipo IN ('ING', 'EGR')
        ORDER BY ra.FechaHora DESC, ra.RegistroAsistenciaCodigo DESC
      `, [personalId])
      ultimo = ultimos[0]

      if (!ultimo) {
        await queryRunner.rollbackTransaction()
        return { Error: 'SIN_REGISTROS', mensaje: 'No tiene registros de asistencia para modificar.' }
      }
      if (ultimo.Tipo === 'EGR') {
        await queryRunner.rollbackTransaction()
        return { Error: 'EGRESO_NO_MODIFICABLE', mensaje: 'El objetivo de un egreso no se modifica porque tiene que ser el mismo del ingreso. Si el egreso fue un error, se puede anular.' }
      }
      const { horasLimiteCorreccion } = await this.getParametrosAsistencia(queryRunner)
      if (ultimo.MinutosDesdeCarga > horasLimiteCorreccion * 60) {
        await queryRunner.rollbackTransaction()
        return { Error: 'FUERA_DE_PLAZO', mensaje: `Solo se puede modificar un registro dentro de las ${horasLimiteCorreccion} horas de cargado. Tiene que pedirlo a su responsable.` }
      }
      if (ultimo.ClienteId == objetivo.ClienteId && ultimo.ClienteElementoDependienteId == objetivo.ClienteElementoDependienteId) {
        await queryRunner.rollbackTransaction()
        return { Error: 'MISMO_OBJETIVO', mensaje: 'El registro ya está en ese objetivo.' }
      }

      // Queda constancia del objetivo anterior; el motivo de la IA se agrega a continuación
      Observacion = `Objetivo modificado de ${ultimo.ClienteId}/${ultimo.ClienteElementoDependienteId} a ${objetivo.CodObjetivo}.`
      if (Motivo) Observacion += ` ${Motivo}`

      await queryRunner.query(`
        UPDATE RegistroAsistencia SET
          ClienteId = @2, ClienteElementoDependienteId = @3,
          Observaciones = CONCAT(ISNULL(Observaciones + ' | ', ''), @4),
          AudFechaMod = @5, AudUsuarioMod = @6, AudIpMod = @7
        WHERE RegistroAsistenciaCodigo = @0 AND PersonalId = @1 AND FechaAnulado IS NULL
      `, [ultimo.RegistroAsistenciaCodigo, personalId, objetivo.ClienteId, objetivo.ClienteElementoDependienteId, Observacion, ahora, usuario, ip])

      await queryRunner.commitTransaction()
    } catch (err) {
      await this.rollbackTransaction(queryRunner)
      throw err
    } finally {
      await queryRunner.release()
    }

    return {
      modificado: true,
      RegistroAsistenciaCodigo: ultimo.RegistroAsistenciaCodigo,
      Tipo: ultimo.Tipo,
      FechaHora: ultimo.FechaHora,
      ObjetivoAnterior: String(ultimo.Objetivo ?? '').trim(),
      ObjetivoNuevo: objetivo.Objetivo,
      CodObjetivoNuevo: objetivo.CodObjetivo,
      distanciaMetros: objetivo.distanciaMetros,
      Observaciones: Observacion
    }
  }

  // Anula (FechaAnulado) un registro de la persona, sin borrarlo
  // Solo el último registro: así nunca queda un egreso sin su ingreso
  async anularRegistroAsistencia(personalId: number, chatId: string, args: any) {
    const RegistroAsistenciaCodigo = Number(args?.RegistroAsistenciaCodigo)
    if (!Number.isInteger(RegistroAsistenciaCodigo) || RegistroAsistenciaCodigo <= 0)
      return { Error: 'CODIGO_INVALIDO', mensaje: 'Falta el código del registro a anular.' }

    const Motivo = String(args?.Observaciones ?? '').trim() || null
    const ahora = new Date()
    const usuario = BaseController.getUser(null)
    const ip = '::1'
    let ultimo: any
    const queryRunner = await dbServer.connection()
    try {
      await queryRunner.startTransaction()

      const ultimos = await queryRunner.query(`
        SELECT TOP 1 ra.RegistroAsistenciaCodigo, ra.Tipo, ra.FechaHora, ra.ClienteId, ra.ClienteElementoDependienteId,
          CONCAT(TRIM(cli.ClienteDenominacion), ' - ', TRIM(ele.ClienteElementoDependienteDescripcion)) Objetivo,
          DATEDIFF(MINUTE, ra.AudFechaIng, GETDATE()) MinutosDesdeCarga
        FROM RegistroAsistencia ra WITH (UPDLOCK, HOLDLOCK)
        LEFT JOIN Cliente cli ON cli.ClienteId = ra.ClienteId
        LEFT JOIN ClienteElementoDependiente ele ON ele.ClienteId = ra.ClienteId AND ele.ClienteElementoDependienteId = ra.ClienteElementoDependienteId
        WHERE ra.PersonalId = @0 AND ra.FechaAnulado IS NULL AND ra.Tipo IN ('ING', 'EGR')
        ORDER BY ra.FechaHora DESC, ra.RegistroAsistenciaCodigo DESC
      `, [personalId])
      ultimo = ultimos[0]

      if (!ultimo) {
        await queryRunner.rollbackTransaction()
        return { Error: 'SIN_REGISTROS', mensaje: 'No tiene registros de asistencia para anular.' }
      }
      if (ultimo.RegistroAsistenciaCodigo != RegistroAsistenciaCodigo) {
        await queryRunner.rollbackTransaction()
        return { Error: 'NO_ES_ULTIMO_REGISTRO', mensaje: 'Solo se puede anular el último registro de asistencia.', ultimoRegistro: ultimo }
      }
      const { horasLimiteCorreccion } = await this.getParametrosAsistencia(queryRunner)
      if (ultimo.MinutosDesdeCarga > horasLimiteCorreccion * 60) {
        await queryRunner.rollbackTransaction()
        return { Error: 'FUERA_DE_PLAZO', mensaje: `Solo se puede anular un registro dentro de las ${horasLimiteCorreccion} horas de cargado. Tiene que pedirlo a su responsable.` }
      }

      await queryRunner.query(`
        UPDATE RegistroAsistencia SET
          FechaAnulado = @2,
          Observaciones = CASE WHEN @3 IS NULL THEN Observaciones ELSE CONCAT(ISNULL(Observaciones + ' | ', ''), @3) END,
          AudFechaMod = @2, AudUsuarioMod = @4, AudIpMod = @5
        WHERE RegistroAsistenciaCodigo = @0 AND PersonalId = @1 AND FechaAnulado IS NULL
      `, [RegistroAsistenciaCodigo, personalId, ahora, Motivo, usuario, ip])

      await queryRunner.commitTransaction()
    } catch (err) {
      await this.rollbackTransaction(queryRunner)
      throw err
    } finally {
      await queryRunner.release()
    }

    // Estado después de anular: si quedó un ingreso abierto o no
    const estadoActual = await this.getEstadoAsistencia(personalId, chatId)
    return {
      anulado: true,
      RegistroAsistenciaCodigo,
      Tipo: ultimo.Tipo,
      FechaHora: ultimo.FechaHora,
      Objetivo: String(ultimo.Objetivo ?? '').trim(),
      Motivo,
      estadoActual
    }
  }

  // Genera el enlace externo que toma la foto y la ubicación. El encTelNro es el mismo cifrado del
  // enlace de AUTH (genTelCode con el chatId); el PersonalId no viaja en la URL.
  async getLinkVerificacionFacial(personalId: number, chatId: string) {
    const estado = await this.getEstadoAsistencia(personalId, chatId)
    if (estado.verificacionFacialLista)
      return { Error: 'VERIFICACION_YA_REALIZADA', mensaje: 'La verificación facial ya terminó. Consultá getResultadoVerificacion y seguí con el registro.' }
    if (estado.verificacionRequerida !== 'FACIAL')
      return { Error: 'VERIFICACION_FACIAL_NO_REQUERIDA', mensaje: 'No hace falta verificación facial: pedile que comparta su ubicación actual.' }

    const ret = await personalController.genTelCode(chatId)
    const anterior = botServer.iaHistorial[chatId].verificacionFacial
    // Un enlace nuevo reemplaza al anterior pero conserva los intentos ya usados
    botServer.iaHistorial[chatId].verificacionFacial = {
      encTelNro: ret.encTelNro, generado: new Date(), intentos: anterior?.intentos ?? 0, resultado: null, similitud: null, ubicacion: null
    }
    return {
      // Mismo formato que el enlace de AUTH (chatbot.controller, init/ident): la pantalla de registro de asistencia
      url: `${process.env.URL_LINK}/#/asis/registro-asistencia;encTelNro=${encodeURIComponent(ret.encTelNro)}`,
      // El enlace dura lo mismo que la conversación (timeout de inactividad de la sesión)
      linkVigenciaMinutos: Math.round(IA_HISTORIAL_TIMEOUT_MS / 1000 / 60)
    }
  }

  // Resultado de la verificación facial e intentos restantes
  async getResultadoVerificacion(personalId: number, verificacion:any) {
    if (!verificacion)
      return { estado: 'SIN_LINK', intentosRestantes: null }
    const queryRunner = await dbServer.connection()
    let estado = verificacion.resultado
    let intentosRestantes=0
    try {
      const { intentosVerificacionFacial } = await this.getParametrosAsistencia(queryRunner)
      intentosRestantes = Math.max(intentosVerificacionFacial - verificacion.intentos, 0)
      if (!estado)
        estado = Date.now() - new Date(verificacion.generado).getTime() > IA_HISTORIAL_TIMEOUT_MS ? 'VENCIDO' : 'PENDIENTE'
    } finally {
      await queryRunner.release()
    }
    return { estado, intentosRestantes }

  }

  // Pantalla de registro de asistencia en modo verificación: valida el enlace y devuelve la persona
  async getVerificacion(req: any, res: Response, next: NextFunction) {
    const encTelNro = String(req.params.encTelNro ?? '')
    const queryRunner = await dbServer.connection()
    try {
      const { chatId, verificacion } = this.getVerificacionPorEncTelNro(encTelNro)
      const { intentosVerificacionFacial } = await this.getParametrosAsistencia(queryRunner)
      const estadoPersona = await personalController.getPersonaState(chatId)
      if (!estadoPersona.stateData?.personalId)
        throw new ClientException('No se pudo identificar a la persona del enlace')

      this.jsonRes({
        PersonalId: estadoPersona.stateData.personalId,
        ApellidoNombre: estadoPersona.fullName,
        intentosRestantes: Math.max(intentosVerificacionFacial - verificacion.intentos, 0)
      }, res)
    } catch (error) {
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  // Resultado de un intento de verificación facial (lo manda back). Con OK, o FALLO al agotar los
  // intentos, el resultado y la ubicación del enlace quedan en la sesión y se avisa al chat.
  async setResultadoVerificacion(req: any, res: Response, next: NextFunction) {
    const encTelNro = String(req.body?.encTelNro ?? '')
    const encontrado = req.body?.encontrado === true
    const similitud = req.body?.similitud ?? null
    const queryRunner = await dbServer.connection()
    try {
      const { chatId, verificacion } = this.getVerificacionPorEncTelNro(encTelNro)
      const { intentosVerificacionFacial } = await this.getParametrosAsistencia(queryRunner)

      verificacion.intentos++
      verificacion.similitud = similitud
      const latitud = Number(req.body?.ubicacion?.latitud)
      const longitud = Number(req.body?.ubicacion?.longitud)
      if (req.body?.ubicacion && Number.isFinite(latitud) && Number.isFinite(longitud))
        verificacion.ubicacion = { latitud, longitud, fecha: new Date() }

      const intentosRestantes = Math.max(intentosVerificacionFacial - verificacion.intentos, 0)
      let resultado = 'PENDIENTE'
      if (encontrado)
        resultado = 'OK'
      else if (intentosRestantes === 0)
        resultado = 'FALLO'

      if (resultado !== 'PENDIENTE') {
        verificacion.resultado = resultado
        // La ubicación del enlace reemplaza a la de WhatsApp: no se vuelve a pedir
        if (verificacion.ubicacion)
          botServer.iaHistorial[chatId].ubicacion = verificacion.ubicacion
        this.avisarVerificacionTerminada(chatId)
      }

      this.jsonRes({ resultado, intentosRestantes }, res)
    } catch (error) {
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  // Descifra el encTelNro (mismo cifrado que getIdentDecode, el de init/ident) y exige que sea el
  // último enlace generado para ese chat: no sirve un enlace de AUTH ni uno viejo
  private getVerificacionPorEncTelNro(encTelNro: string) {
    let dataObj: any
    try {
      const _key = CryptoJS.default.enc.Utf8.parse(process.env.KEY_IDENT_TEL);
      const _iv = CryptoJS.default.enc.Utf8.parse(process.env.KEY_IDENT_TEL);
      const decrypted = CryptoJS.default.AES.decrypt(
        encTelNro, _key, {
        keySize: 16,
        iv: _iv,
        mode: CryptoJS.default.mode.ECB,
        padding: CryptoJS.default.pad.Pkcs7,
        format: CryptoJS.default.format.Hex
      });
      dataObj = JSON.parse(decrypted.toString(CryptoJS.default.enc.Utf8))
    } catch (_e) {
      throw new ClientException('El enlace proporcionado no es válido, solicite uno nuevo en el chat')
    }
    if (!dataObj?.stmgen || new Date().getTime() - Date.parse(dataObj?.stmgen) > IA_HISTORIAL_TIMEOUT_MS)
      throw new ClientException('El enlace proporcionado expiró, solicite uno nuevo en el chat')

    const chatId = String(dataObj?.data)
    const verificacion = botServer.iaHistorial[chatId]?.verificacionFacial
    if (!verificacion || verificacion.encTelNro !== encTelNro)
      throw new ClientException('El enlace proporcionado no es válido, solicite uno nuevo en el chat')
    if (verificacion.resultado)
      throw new ClientException('La verificación facial ya terminó, vuelva al chat')
    return { chatId, verificacion }
  }

  // Dispara el agente para el chat con un mensaje interno, sin esperar a que escriba el vigilador.
  // Las respuestas quedan sin enviar para que las levante la consulta de mensajes del chat (GET chatagent).
  private avisarVerificacionTerminada(chatId: string) {
    const res: any = {
      locals: {},
      status: () => ({
        json: (body: any) => body?.data?.response?.forEach((m: any) => { m.sendIt = false })
      })
    }
    // interno: chatAgent agrega el mensaje ya con debug, para que no se vea como escrito por el vigilador
    const req: any = { body: { message: MENSAJE_VERIFICACION_TERMINADA, chatId, interno: true } }
    chatBotController.chatAgent(req, res, (error: any) => console.error(`[IA][${chatId}] Aviso de verificación facial falló: ${error?.message}`))
      .catch((error: any) => console.error(`[IA][${chatId}] Aviso de verificación facial falló: ${error?.message}`))
  }

}
