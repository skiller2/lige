import { BaseController, ClientException } from "./base.controller.ts";
import type { NextFunction, Request, Response } from "express";
import * as CryptoJS from 'crypto-js';
import { botServer, dbServer } from "../index.ts";
import { ObjetivoController } from "./objetivo.controller.ts";
import { PersonalController } from "./personal.controller.ts";

const personalController = new PersonalController()

function parseFecha(fecha: string): string {
  const date: Date = new Date(fecha)
  return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear()
}

export class NovedadController extends BaseController {
  async sendMsgResponsable(novedad: any) {
    const Fecha = new Date(novedad.Fecha)
    const ClienteId = novedad.ClienteId
    const ClienteElementoDependienteId = novedad.ClienteElementoDependienteId
    const DesObjetivo = novedad.DesObjetivo
    const anio = Fecha.getFullYear()
    const mes = Fecha.getMonth() + 1
    const responsables = await ObjetivoController.getObjetivoResponsables(anio, mes, ClienteId, ClienteElementoDependienteId)
    const supervisor = responsables.find(r => r.ord == 3)

    const infoPersonal = await personalController.getPersonalQuery(novedad.telefonoOrigen, novedad.personalId)
    console.log('infoPersonal', infoPersonal)

    const msg = `*Novedad:*\n` +
      `- Fecha: ${novedad.Fecha ? parseFecha(novedad.Fecha) : 's/d'}\n` +
      `- Hora: ${novedad.Hora ?? 's/d'}\n` +
      `- Objetivo: ${(novedad.ClienteId && novedad.ClienteElementoDependienteId) ? (novedad.ClienteId + '/' + novedad.ClienteElementoDependienteId) : 's/d'} ${novedad.DesObjetivo ?? ''}\n` +
      `- Tipo de novedad: ${novedad.Tipo?.Descripcion ?? 's/d'}\n` +
      `- Descripción: ${novedad.Descripcion ?? 's/d'}\n` +
      `- Acción: ${novedad.Accion ?? 's/d'}\n\n` +
      `*Datos del Personal:*\n`+
      `- Nombre: ${infoPersonal[0].fullName ?? 's/d'}\n` +
      `- Cuit:  ${infoPersonal[0].cuit ?? 's/d'}\n`+
      `- Teléfono: ${novedad.telefonoOrigen ?? 's/d'}\n\n` +
      `- Documentos registrados: ${novedad.files.length}\n`


    if (supervisor.GrupoActividadId) {
      const PersonalId = supervisor.GrupoActividadId
      const result = await dbServer.dataSource.query(`SELECT * FROM lige.dbo.regtelefonopersonal WHERE personal_id = @0 `, [PersonalId])
      let telefono = (result[0]) ? result[0].telefono : ''

      if (process.env.PERSONALID_TEST)
        telefono = novedad.telefonoOrigen

      if (telefono) {
        console.log('envio a', PersonalId, telefono, msg)
        await botServer.sendMsg(telefono, msg)
        //ChatBotController.enqueBotMsg(PersonalId, texto_mensaje: string, clase_mensaje: string, usuario: string, ip: string)

      }
    }
  }

  async saveNovedad(personalId: string, novedad: any) {
    const jsonNovedad = Object.keys(novedad).length === 0 ? null : JSON.stringify(novedad)
    const queryRunner = dbServer.dataSource.createQueryRunner();


    const res = await queryRunner.query(`
      UPDATE lige.dbo.regtelefonopersonal
      SET incidente = @1
      WHERE personal_id = @0
      `, [personalId, jsonNovedad], true
    )

    return res
  }

  async getBackupNovedad(personalId: string) {
    const result = await dbServer.dataSource.query(`
      SELECT incidente AS novedad
      FROM lige.dbo.regtelefonopersonal
      WHERE personal_id = @0
      `, [personalId]
    )
    return JSON.parse(result[0].novedad) ?? {}
  }


  async addRelNovedadDoc(novdedadId: number, documentoId: number, fechaActual: Date) {
    await dbServer.dataSource.query(`
      INSERT INTO DocumentoRelaciones (DocumentoId, PersonalId, ObjetivoId, ClienteId, PersonalLicenciaId, NovedadCodigo, AudFechaIng, AudFechaMod, AudUsuarioIng, AudUsuarioMod, AudIpIng, AudIpMod)
 VALUES (@0,@1,@2,@3,@4,@5, @6,@6, @7,@7, @8,@8)
      `, [
      documentoId,
      null,
      null,
      null,
      null,
      novdedadId,
      fechaActual, 'bot', '127.0.0.1'
    ])
  }


  async addNovedad(novedad: any, Telefono: string, PersonalId: number) {
    const ClienteId = novedad.ClienteId
    const ClienteElementoDependienteId = novedad.ClienteElementoDependienteId

    const Fecha = novedad.Fecha

    const Descripcion = novedad.Descripcion
    const Accion = novedad.Descripcion
    const NovedadTipoCod = novedad.Tipo.NovedadTipoCod
    const now: Date = new Date()
    const jsonNovedad = JSON.stringify(novedad)
    const NovedadCodigo = await this.getProxNumero(dbServer.dataSource, `Novedad`, 'bot', '::1')
    await dbServer.dataSource.query(`
      INSERT INTO Novedad (
        NovedadCodigo,
        ClienteId, ClienteElementoDependienteId, PersonalId, Telefono, Fecha, Descripcion, Accion, NovedadTipoCod,
        Json, AudFechaIng, AudFechaMod, AudIpIng, AudIpMod, AudUsuarioIng, AudUsuarioMod
      ) VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@10,@11,@11,@12,@12)
      `, [
      NovedadCodigo,
      ClienteId, ClienteElementoDependienteId, PersonalId, Telefono, Fecha, Descripcion, Accion, NovedadTipoCod,
      jsonNovedad, now, 'bot', '::1'
    ])

    return NovedadCodigo
  }

  async getNovedadTipo() {
    const result = await dbServer.dataSource.query(`
      SELECT NovedadTipoCod, Descripcion
      FROM NovedadTipo
    `)
    return result
  }

  async addDocumentoRelaciones(novedadId: any, documentoId: any) {

    const now: Date = new Date()
    await dbServer.dataSource.query(`

      `, [novedadId, documentoId])
  }

  async getNovedadesByResponsable(PersonalId: any) {
    const date = new Date()
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const res = await dbServer.dataSource.query(`
        SELECT obj.ClienteElementoDependienteId, obj.ClienteId, 'Supervisor' tipo,
          per.PersonalId, CONCAT(TRIM(per.PersonalApellido),', ',TRIM(per.PersonalNombre)) AS ApellidoNombre, gaj.GrupoActividadJerarquicoDesde AS desde , gaj.GrupoActividadJerarquicoHasta hasta
          
        FROM Objetivo obj 
        LEFT JOIN GrupoActividadObjetivo gap ON gap.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND EOMONTh(DATEFROMPARTS(@1,@2,1)) >=   gap.GrupoActividadObjetivoDesde  AND DATEFROMPARTS(@1,@2,1) <  ISNULL(gap.GrupoActividadObjetivoHasta,'9999-12-31') 
        LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId
        LEFT JOIN GrupoActividadJerarquico gaj ON gaj.GrupoActividadId = ga.GrupoActividadId AND EOMONTh(DATEFROMPARTS(@1,@2,1)) >=   gaj.GrupoActividadJerarquicoDesde  AND DATEFROMPARTS(@1,@2,1) <  ISNULL(gaj.GrupoActividadJerarquicoHasta,'9999-12-31') AND gaj.GrupoActividadJerarquicoComo = 'J'
        JOIN Personal per ON per.PersonalId = gaj.GrupoActividadJerarquicoPersonalId
        WHERE per.PersonalId = @0
      `, [PersonalId, year, month]
    )
    if (!res.length) return []

  
    let novPendientes = []
    for (let index = 0; index < res.length; index++) {
      const ClienteElementoDependienteId = res[index].ClienteElementoDependienteId
      const ClienteId = res[index].ClienteId
      const novedades = await dbServer.dataSource.query(`
          SELECT 
            ROW_NUMBER() OVER (ORDER BY nov.NovedadCodigo) id
            , nov.NovedadCodigo, nov.PersonalId, nov.Telefono, nov.Fecha, nov.Descripcion, nov.NovedadTipoCod, nov.Accion
            , tipo.Descripcion TipoDescripcion
            , CONCAT(TRIM(per.PersonalApellido) , ', ', TRIM(per.PersonalNombre), ' CUIT:' , cuit.PersonalCUITCUILCUIT) PersonalFullName
            , obj.ObjetivoDescripcion
          FROM Novedad nov
          JOIN NovedadTipo tipo ON tipo.NovedadTipoCod = nov.NovedadTipoCod
          JOIN Personal per ON per.PersonalId = nov.PersonalId
          LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
          JOIN Objetivo obj ON obj.ClienteId = nov.ClienteId AND obj.ClienteElementoDependienteId = nov.ClienteElementoDependienteId
          WHERE nov.ClienteId IN (@0) AND nov.ClienteElementoDependienteId IN (@1) AND nov.VisualizacionFecha IS NULL
        `, [ClienteId, ClienteElementoDependienteId]
      )
      novPendientes = novPendientes.concat(novedades)
    }
    
    return novPendientes
  }

}