import { BaseController, ClientException } from "./base.controller.ts";
import type { NextFunction, Request, Response } from "express";
import * as CryptoJS from 'crypto-js';
import { botServer, dbServer } from "../index.ts";

export class NovedadController extends BaseController {

  async saveNovedad(telefono: string, novedad:any) {
    const jsonNovedad = Object.keys(novedad).length === 0 ? null : JSON.stringify(novedad)
    return await dbServer.dataSource.query(`
      UPDATE lige.dbo.regtelefonopersonal
      SET incidente = @1
      WHERE telefono = @0
      `, [telefono, jsonNovedad]
    )
  }

  async getBackupNovedad(telefono: string) {
    const result = await dbServer.dataSource.query(`
      SELECT incidente AS novedad
      FROM lige.dbo.regtelefonopersonal
      WHERE telefono = @0
      `, [telefono]
    )
    return result
  }

  async addNovedad(novedad: any, Telefono:string, PersonalId:number) {
    const array = novedad.CodObjetivo.split('/')
    const ClienteId:number = parseInt(array[0])
    const ClienteElementoDependienteId:number = parseInt(array[1])

    const [dia, mes, anio] = novedad.Fecha.split('/');
    const fechaISO = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}T${novedad.Hora}:00` // Crea un string en formato ISO (yyyy-mm-ddThh:mm)
    const Fecha = new Date(fechaISO);

    const Descripcion = novedad.Descripcion
    const NovedadTipoCod = novedad.Tipo.NovedadTipoCod
    const now:Date = new Date()
    const jsonNovedad = JSON.stringify(novedad)
    const NovedadCodigo = await this.getProxNumero(dbServer.dataSource, `Novedad`, 'bot', '::1')
    await dbServer.dataSource.query(`
      INSERT INTO Novedad (
        NovedadCodigo,
        ClienteId, ClienteElementoDependienteId, PersonalId, Telefono, Fecha, Descripcion, NovedadTipoCod,
        Json, AudFechaIng, AudFechaMod, AudIpIng, AudIpMod, AudUsuarioIng, AudUsuarioMod
      ) VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@9,@10,@10,@11,@11)
      `, [
        NovedadCodigo,
        ClienteId, ClienteElementoDependienteId, PersonalId, Telefono, Fecha, Descripcion, NovedadTipoCod,
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