import { BaseController, ClientException } from "./base.controller.ts";
import type { NextFunction, Request, Response } from "express";
import * as CryptoJS from 'crypto-js';
import { botServer, dbServer } from "../index.ts";
import { ObjetivoController } from "./objetivo.controller.ts";

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


    const msg = `Novedad:\n` +
      `Fecha: ${novedad.Fecha ? parseFecha(novedad.Fecha) : 's/d'}\n` +
      `Hora: ${novedad.Hora ?? 's/d'}\n` +
      `Objetivo: ${(novedad.ClienteId && novedad.ClienteElementoDependienteId) ? (novedad.ClienteId + '/' + novedad.ClienteElementoDependienteId) : 's/d'} ${novedad.DesObjetivo ?? ''}\n` +
      `Tipo de novedad: ${novedad.Tipo?.Descripcion ?? 's/d'}\n` +
      `Descripción: ${novedad.Descripcion ?? 's/d'}\n` +
      `Teléfono: ${novedad.telefonoOrigen ?? 's/d'}\n` +
      `Documentos registrados: ${novedad.files.length}\n` +
      `Acción: ${novedad.Accion ?? 's/d'}`

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


  async addRelNovedadDoc(novdedadId: number, documentoId: number, fechaActual:Date) {
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

}