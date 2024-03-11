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

  // async linkDownloadComprobanteRecibo(
  //   personalId: number
  // ){
  //   const date = new Date
  //   const year = date.getFullYear()
  //   const month = date.getMonth()+1
  //   const result = `http://localhost:3010/api/recibos/download/${year}/${month}/${personalId}`
  //   return result
  // }

  async downloadComprobantesByPeriodo(
    personalId: number,
    month: number,
    year: number,
  ) {

    const queryRunner = dataSource.createQueryRunner();
    
    try {
      const gettmpfilename = await this.getRutaFile(queryRunner, year, month, personalId)
      const tmpfilename = gettmpfilename[0]?.path;
      const responsePDFBuffer = await this.obtenerPDFBuffer(tmpfilename);
      
      await queryRunner.commitTransaction()

      await fs.promises.writeFile(tmpfilename, responsePDFBuffer);
      return tmpfilename
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return error
    }
  }

  async getRutaFile(queryRunner: QueryRunner, year: number, month: number, personalIdRel: number) {
    return queryRunner.query(`
      SELECT * from lige.dbo.docgeneral doc
      JOIN lige.dbo.liqmaperiodo per ON per.periodo_id = doc.periodo
      WHERE per.anio =@0 AND per.mes=@1 AND doc.persona_id = @2  AND doctipo_id = 'REC'`, 
      [year, month, personalIdRel]
    )
  }

  async obtenerPDFBuffer(tmpfilename: string) {
    const buffer = fs.readFileSync(tmpfilename);
    return buffer;
  }

  async getLastPeriodoOfComprobantes( personalId: number, cant: number ) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const respuesta = queryRunner.query(`
        SELECT TOP ${cant} per.periodo_id, per.anio, per.mes from lige.dbo.liqmaperiodo per
        JOIN lige.dbo.docgeneral doc ON per.periodo_id = doc.periodo
        WHERE doc.persona_id = @0 AND doctipo_id = 'REC'      
        ORDER BY per.anio DESC,per.mes DESC`, 
        [personalId])

      return respuesta
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return error
    }
  }
      
}