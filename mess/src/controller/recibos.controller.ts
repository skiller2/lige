import { BaseController, ClientException } from "./base.controller";
// import fetch, { Request } from "node-fetch";
import { dataSource } from "../data-source";
// import { Response } from "express-serve-static-core";
// import { ParsedQs } from "qs";
import { NextFunction, Request, Response } from "express";
import * as fs from 'fs';
import { QueryRunner } from "typeorm";

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
  directoryRecibo = process.env.PATH_RECIBO || "tmp";
  apiPath = process.env.URL_API || "http://localhost:4200/mess/api";


  async downloadRecibo(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    let usuario = res.locals.userName
    let ip = this.getRemoteAddress(req)
    const doc_id = req.params.doc_id

    const queryRunner = dataSource.createQueryRunner();
    try {
      const data = await queryRunner.query(`SELECT doc.path, doc.nombre_archivo from lige.dbo.docgeneral doc
      JOIN lige.dbo.liqmaperiodo per ON per.periodo_id = doc.periodo
      WHERE doctipo_id = 'REC' AND doc.doc_id=@0`,
        [doc_id]
      )

      if (!data[0])
        throw new ClientException(`Recibo no generado`)

      res.download(this.directoryRecibo + '/' + data[0].path, data[0].nombre_archivo, async (error) => {
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


  async getURLDocRecibo(
    personalId: number,
    year: number,
    month: number,
  ) {

    const queryRunner = dataSource.createQueryRunner();
    
    try {
      
      const gettmpfilename = await this.getRutaFile(queryRunner, personalId, year, month)
      let tmpURL = ''
      if (gettmpfilename[0] && gettmpfilename[0].doc_id ) {
        tmpURL = `${this.apiPath}/recibos/download/${gettmpfilename[0].doc_id}`;
      } else {
        throw new ClientException(`Recibo no generado`)
      }
      return tmpURL
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return error
    }
  }

  async getRutaFile(queryRunner: QueryRunner, personalIdRel: number, year: number, month: number) {
    return queryRunner.query(`
      SELECT * from lige.dbo.docgeneral doc
      JOIN lige.dbo.liqmaperiodo per ON per.periodo_id = doc.periodo
      WHERE per.anio =@1 AND per.mes=@2 AND doc.persona_id = @0  AND doctipo_id = 'REC'`,
      [personalIdRel, year, month]
    )
  }

  async getLastPeriodoOfComprobantes( personalId: number, cant: number ) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      // await queryRunner.startTransaction()
      const respuesta = queryRunner.query(`
        SELECT TOP ${cant} per.periodo_id, per.anio, per.mes FROM lige.dbo.liqmaperiodo per
        JOIN lige.dbo.docgeneral doc ON per.periodo_id = doc.periodo
        WHERE doc.persona_id = @0 AND doctipo_id = 'REC'      
        ORDER BY per.anio DESC,per.mes DESC`, 
        [personalId])
      // await queryRunner.commitTransaction()
      return respuesta
    } catch (error) {
      // this.rollbackTransaction(queryRunner)
      return error
    }
  }
      
}