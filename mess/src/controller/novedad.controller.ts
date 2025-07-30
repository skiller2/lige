import { BaseController, ClientException } from "./base.controller.ts";
import type { NextFunction, Request, Response } from "express";
import * as CryptoJS from 'crypto-js';
import { botServer, dbServer } from "../index.ts";

export class NovedadController extends BaseController {

  async saveNovedad(telefono: string, novedad:any) {
    const jsonNovedad = Object.keys(novedad).length === 0 ? null : JSON.stringify(novedad);
    return await dbServer.dataSource.query(`
      UPDATE regtelefonopersonal
      SET incidente = @1
      WHERE telefono == @0
      `, [telefono, jsonNovedad]
    )
  }

  async getBackupNovedad(telefono: string) {
    const result = await dbServer.dataSource.query(`
      SELECT incidente AS novedad
      FROM regtelefonopersonal
      WHERE telefono == @0
      `, [telefono]
    )
    return result
  }

  async addNovedad(novedad: any, telefono:string, personalId:number) {
    await dbServer.dataSource.query(`
      INSERT INTO Novedad (
        ClienteId, ClienteElementoDependienteId, PersonalId, Telefono, Fecha, Detalle, NovedadTipoCod,
        Json, AudFechaIng, AudFechaMod, AudIpIng, AudIpMod, AudUsuarioIng, AudUsuarioMod
      ) VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@11,@12,@13)
    `, [])
  }

}