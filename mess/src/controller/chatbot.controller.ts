import { BaseController, ClientException } from "./base.controller.ts";
import type { NextFunction, Request, Response } from "express";
import { existsSync, readFileSync } from "fs";
//import { botServer } from "../bot-server.ts";
import { dataSource } from "../data-source.ts";

export class ChatBotController extends BaseController {
  getChatBotStatus(req: Request, res: Response, next: NextFunction) {
    //  const ret = botServer.status()
    const ret=null
    return this.jsonRes(ret, res);
  }
  delay: number = 1000

  getDelay() {
    return this.delay
  }

  setDelay(delay: number) {
    this.delay = delay
  }

  async getChatBotDelay(req: any, res: Response, next: NextFunction) {
    const delay = this.getDelay()
    return this.jsonRes(delay, res);
  }

  async setChatBotDelay(req: any, res: Response, next: NextFunction) {
    const ms = req.body.ms
    this.setDelay(ms)
    return this.getDelay()
  }

  async getChatBotQR(req: any, res: Response, next: NextFunction) {
    const pathArchivos = './bot.qr.png'
    try {
      if (!existsSync(pathArchivos))
        throw new ClientException(`El archivo Imagen no existe`, { 'path': pathArchivos });

      const resBuffer = readFileSync(pathArchivos)
      res.setHeader('Content-Length', resBuffer.length);
      res.write(resBuffer);
      res.end();
    } catch (error) {
      return next(error)
    }
  }

  async addToDocLog(doc_id:number,telefono:string) {
    const queryRunner = dataSource.createQueryRunner();
    const fechaActual = new Date()
    const { personal_id } = (await queryRunner.query(`SELECT personal_id FROM lige.dbo.regtelefonopersonal WHERE telefono = @0`, [telefono]))[0]
    await queryRunner.query(`INSERT INTO lige.dbo.doc_descaga_log (doc_id, fecha_descarga, telefono, personal_id, aud_usuario_ins, aud_ip_ins, aud_fecha_ins)
      VALUES (@0,@1,@2,@3,@4,@5,@6)`, 
      [doc_id, fechaActual, telefono, personal_id, 'bot', '127.0.0.1', fechaActual])
  }

    static async enqueBotMsg(personal_id: number, texto_mensaje: string, clase_mensaje: string, usuario: string, ip: string) {
        const queryRunner = dataSource.createQueryRunner()  
        const fechaActual = new Date()
        try {
            const existsTel = await queryRunner.query(`SELECT personal_id FROM lige.dbo.regtelefonopersonal WHERE personal_id = @0`, [personal_id]) 
            if (existsTel.length==0) throw new ClientException(`El personal no tiene un telefono registrado.`)
    
            await queryRunner
                .query(`INSERT INTO lige.dbo.bot_cola_mensajes (fecha_ingreso, personal_id, clase_mensaje, texto_mensaje, fecha_proceso, aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_fecha_mod, aud_ip_mod) 
            VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10)`, [fechaActual, personal_id, clase_mensaje, texto_mensaje, null, usuario, ip, fechaActual, usuario, fechaActual, ip])
            return true

        } catch (error) { 
            return false
        }
    }


  static async getColaMsg() {
    const queryRunner = dataSource.createQueryRunner();
    const fechaActual = new Date()
    return queryRunner.query(`
      SELECT col.fecha_ingreso, col.personal_id, tel.telefono, col.texto_mensaje,
      1 
      FROM lige.dbo.bot_cola_mensajes col 
      JOIN lige.dbo.regtelefonopersonal tel ON tel.personal_id = col.personal_id
      WHERE col.fecha_proceso IS NULL`, [])
  }

  static async updColaMsg(fecha_ingreso: Date, personal_id: number) {
    const queryRunner = dataSource.createQueryRunner();
    const fechaActual = new Date()
    return queryRunner.query(`UPDATE lige.dbo.bot_cola_mensajes SET fecha_proceso = @0, aud_usuario_mod=@3, aud_fecha_mod=@0, aud_ip_mod=@4 WHERE fecha_ingreso = @1 AND personal_id = @2`, [fechaActual, fecha_ingreso, personal_id,'bot','127.0.0.1'])
  }
}