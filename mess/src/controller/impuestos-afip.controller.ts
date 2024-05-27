import { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "./base.controller";

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "fs";

import { dataSource } from "../data-source";
import {
  PDFDocument,
  PDFEmbeddedPage,
  PDFPage,
  PDFPageDrawPageOptions,
  PageSizes,
  degrees,
  rgb,
} from "pdf-lib";

import { tmpName } from "../server";
import { QueryRunner } from "typeorm";

export class ImpuestosAfipController extends BaseController {

  // async linkDownloadComprobanteMonotributo(
  //   personalId: number,
  //   cuit: number
  // ){
  //   const date = new Date
  //   const year = date.getFullYear()
  //   const month = date.getMonth()+1
  //   const result = `http://localhost:3010/api/impuestos_afip/${year}/${month}/${cuit}/${personalId}`
  //   return result
  // }
    
  directory = process.env.PATH_MONOTRIBUTO || "tmp";
  apiPath = process.env.URL_API || "http://localhost:4200/mess/api";



  async getURLDocComprobante(
    personalId: number,
    year: number,
    month: number,
  ) {

    const queryRunner = dataSource.createQueryRunner();
    
    try {
      await queryRunner.startTransaction()
      
      const gettmpfilename = await this.getRutaFile(queryRunner, personalId, year, month)
      let tmpURL = ''
      if (gettmpfilename[0] && gettmpfilename[0].doc_id ) {
        tmpURL = `${this.apiPath}/impuestos_afip/download/${gettmpfilename[0].doc_id}`;
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


    
  async downloadComprobante( personalId: number, year: number, month: number,){
    const queryRunner = dataSource.createQueryRunner();

    const dirtmp = `${process.env.PATH_MONOTRIBUTO}/temp`;
    const tmpfilename = `${dirtmp}/${tmpName(dirtmp)}`;
    try {
      await queryRunner.startTransaction()
      const [comprobante] = await queryRunner.query(
        `SELECT DISTINCT
        per.PersonalId PersonalId, cuit2.PersonalCUITCUILCUIT AS CUIT, CONCAT(TRIM(per.PersonalApellido), ',', TRIM(per.PersonalNombre)) ApellidoNombre,
        com.PersonalComprobantePagoAFIPAno,com.PersonalComprobantePagoAFIPMes,com.PersonalComprobantePagoAFIPImporte,
        ga.GrupoActividadId, ga.GrupoActividadNumero, ga.GrupoActividadDetalle,
        1
        FROM Personal per
        JOIN PersonalComprobantePagoAFIP com ON com.PersonalId=per.PersonalId AND com.PersonalComprobantePagoAFIPAno = @1 AND com.PersonalComprobantePagoAFIPMes = @2
        LEFT JOIN PersonalCUITCUIL cuit2 ON cuit2.PersonalId = per.PersonalId AND cuit2.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)
        LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND EOMONTH(DATEFROMPARTS(@1,@2,1)) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31')
        LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId
        WHERE per.PersonalId = @0`,[personalId, year, month]
      );
      if (!comprobante)
        throw new ClientException(`No se pudo encontrar el comprobante`);

      const filename = comprobante.path
      const downloadPath = `${this.directory}/${filename}`;

      if (!existsSync(downloadPath))
        throw new ClientException(`El archivo no existe (${downloadPath}).`);

      const uint8Array = readFileSync(downloadPath);

      const ApellidoNombre = comprobante.ApellidoNombre;
      const GrupoActividadDetalle = comprobante.GrupoActividadDetalle;

      const buffer = await this.alterPDF(
        uint8Array,
        ApellidoNombre,
        GrupoActividadDetalle
      );
      writeFileSync(tmpfilename, buffer);

      await queryRunner.commitTransaction()
      
      return tmpfilename
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return error
    }
  }

  async getLastPeriodosOfComprobantes( personalId: number, cant: number ) {
    const queryRunner = dataSource.createQueryRunner();
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
      // this.rollbackTransaction(queryRunner)
      return error
    }
  }

}