import { BaseController, ClientException } from "./base.controller";
import { NextFunction, Request, Response } from "express";
import { existsSync, readFileSync } from "fs";
import { botServer } from "../";
import { dataSource } from "../data-source";

export class ChatBotController extends BaseController {
  getChatBotStatus(req: Request, res: Response, next: NextFunction) {
    const ret = botServer.status()
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