import { BaseController, ClientException } from "./base.controller";
// import { PersonaObj } from "../schemas/personal.schemas";
// import fetch, { Request } from "node-fetch";
import { dataSource } from "../data-source";
// import { Response } from "express-serve-static-core";
// import { ParsedQs } from "qs";
import { NextFunction, Request, Response } from "express";
import * as fs from 'fs';
import { QueryRunner } from "typeorm";
import { Utils } from "./util";

export class RecibosController extends BaseController {

  async linkDownloadComprobanteRecibo(
    personalId: number
  ){
    const date = new Date
    const year = date.getFullYear()
    const month = date.getMonth()+1
    const result = `http://localhost:3010/api/recibos/download/${year}/${month}/${personalId}`
    return result
  }

  async downloadComprobantesByPeriodo(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const year = req.params.anio
    const month = req.params.mes
    const personalIdRel = req.params.personalIdRel

    let usuario = res.locals.userName
    let ip = this.getRemoteAddress(req)
    const queryRunner = dataSource.createQueryRunner();
    
    try {
      let fechaActual = new Date();
      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, parseInt(year), parseInt(month), usuario, ip);
      const gettmpfilename = await this.getRutaFile(queryRunner, periodo_id, parseInt(personalIdRel))
      const tmpfilename = gettmpfilename[0]?.path;
      const responsePDFBuffer = await this.obtenerPDFBuffer(tmpfilename);
      
      await queryRunner.commitTransaction()

      await fs.promises.writeFile(tmpfilename, responsePDFBuffer);
      res.download(tmpfilename, gettmpfilename[0]?.nombre_archivo, async (error) => {
        if (error) {
          console.error('Error al descargar el archivo:', error);
          return next(error)
        }
      });
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    }
  }

  async getRutaFile(queryRunner: QueryRunner, periodo_id: number, personalIdRel: number) {
    return queryRunner.query(`SELECT * from lige.dbo.docgeneral 
      WHERE periodo = @0 
      AND persona_id = @1`, 
      [periodo_id, personalIdRel])
  }

  async obtenerPDFBuffer(tmpfilename: string) {
    const buffer = fs.readFileSync(tmpfilename);
    return buffer;
  }
      
}