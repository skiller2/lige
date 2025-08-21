import { BaseController, ClientException } from "./base.controller.ts";
import type { NextFunction, Request, Response } from "express";
import * as CryptoJS from 'crypto-js';
import { botServer, dbServer } from "../index.ts";
import { ObjetivoController } from "./objetivo.controller.ts";

export class NovedadController extends BaseController {
  async sendMsgResponsable(novedad: any) {
    const CodObjetivo = novedad.CodObjetivo.split('/')
    const ClienteId:number = parseInt(CodObjetivo[0])
    const ClienteElementoDependienteId: number = parseInt(CodObjetivo[1])
    const anio=2025
    const mes=7

    const responsables = await ObjetivoController.getObjetivoResponsables(anio, mes, ClienteId,ClienteElementoDependienteId)

//            ChatBotController.enqueBotMsg(personal_id: number, texto_mensaje: string, clase_mensaje: string, usuario: string, ip: string)

  }

  async saveNovedad(personalId: string, novedad:any) {
    const jsonNovedad = Object.keys(novedad).length === 0 ? null : JSON.stringify(novedad)
      const queryRunner = dbServer.dataSource.createQueryRunner();
    

    const res = await queryRunner.query(`
      UPDATE lige.dbo.regtelefonopersonal
      SET incidente = @1
      WHERE personal_id = @0
      `, [personalId, jsonNovedad],true
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
    return JSON.parse(result[0].novedad) ??{}
  }

  async addNovedad(novedad: any, Telefono:string, PersonalId:number) {
    const array = novedad.CodObjetivo.split('/')
    const ClienteId:number = parseInt(array[0])
    const ClienteElementoDependienteId:number = parseInt(array[1])

    const [dia, mes, anio] = novedad.Fecha.split('/');
    const fechaISO = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}T${novedad.Hora}:00` // Crea un string en formato ISO (yyyy-mm-ddThh:mm)
    const Fecha = new Date(fechaISO);

    const Descripcion = novedad.Descripcion
    const Accion = novedad.Descripcion
    const NovedadTipoCod = novedad.Tipo.NovedadTipoCod
    const now:Date = new Date()
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
  }

  async getNovedadTipo() {
    const result = await dbServer.dataSource.query(`
      SELECT NovedadTipoCod, Descripcion
      FROM NovedadTipo
    `)
    return result
  }

}