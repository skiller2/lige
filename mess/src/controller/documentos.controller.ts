import { BaseController, ClientException } from "./base.controller.ts";
import * as fs from 'fs';
import { dbServer } from "../index.ts";

export class DocumentosController extends BaseController {

  // async linkDownloadComprobanteRecibo(
  //   personalId: number
  // ){
  //   const date = new Date
  //   const year = date.getFullYear()
  //   const month = date.getMonth()+1
  //   const result = `http://localhost:3010/api/recibos/download/${year}/${month}/${personalId}`
  //   return result
  // }

  async getLastPeriodoOfComprobantes( personalId: number, cant: number ) {
    const queryRunner = dbServer.dataSource.createQueryRunner();

    try {
      // await queryRunner.startTransaction()
      const respuesta = queryRunner.query(`
        SELECT TOP ${cant} per.anio, per.mes FROM lige.dbo.liqmaperiodo per
        JOIN documento doc ON per.anio = doc.Documentoanio AND per.mes = doc.Documentomes
        WHERE doc.personalid = @0 AND doc.DocumentoTipoCodigo = 'REC'      
        ORDER BY per.anio DESC,per.mes DESC`, 
        [personalId])
      // await queryRunner.commitTransaction()
      return respuesta
    } catch (error) {
      // await this.rollbackTransaction(queryRunner)
      return error
    }
  }
 
  async getLastPeriodosOfComprobantesAFIP(personalId: number, cant: number) {
    const queryRunner = dbServer.dataSource.createQueryRunner();
    try {
      // await queryRunner.startTransaction()
      const respuesta = await queryRunner.query(`
        SELECT TOP ${cant} des.PersonalId, des.PersonalComprobantePagoAFIPId, des.PersonalComprobantePagoAFIPMes mes, des.PersonalComprobantePagoAFIPAno anio
        FROM PersonalComprobantePagoAFIP  des 
        WHERE des.PersonalId = @0 
        ORDER BY des.PersonalComprobantePagoAFIPAno DESC, des.PersonalComprobantePagoAFIPMes DESC`,
        [personalId])
      // await queryRunner.commitTransaction()

      return respuesta
    } catch (error) {
      // await this.rollbackTransaction(queryRunner)
      return error
    }
  }
  
}