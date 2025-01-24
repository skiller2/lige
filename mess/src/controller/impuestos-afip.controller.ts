import { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "./base.controller";

import {
  existsSync,
  readFileSync
} from "fs";

import { dataSource } from "../data-source";

import { tmpName } from "../server";
import { QueryRunner } from "typeorm";

export class ImpuestosAfipController extends BaseController {

  directory = process.env.PATH_MONOTRIBUTO || "tmp";
  apiPath = process.env.URL_API || "http://localhost:4200/mess/api";

  async getURLDocComprobante(
    PersonalId: number,
    anio: number,
    mes: number,
  ) {

    const queryRunner = dataSource.createQueryRunner();

    try {
      const gettmpfilename = await this.getRutaFile(queryRunner, PersonalId, anio, mes)
      let tmpURL = ''
      if (gettmpfilename[0] ) {
        tmpURL = `${this.apiPath}/impuestos_afip/download/${PersonalId}/${anio}/${mes}`;
      } else {
        throw new ClientException(`Recibo no generado`)
      }
      return { URL:tmpURL, doc_id: gettmpfilename[0].doc_id }

    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return error
    }
  }

  async getRutaFile(queryRunner: QueryRunner, personalIdRel: number, year: number, month: number) {
    return queryRunner.query(`
     SELECT DISTINCT
        com.PersonalComprobantePagoAFIPId, com.PersonalId,
        com.PersonalComprobantePagoAFIPAno,com.PersonalComprobantePagoAFIPMes,com.PersonalComprobantePagoAFIPImporte,

        1
        FROM PersonalComprobantePagoAFIP com WHERE com.PersonalId=@0 AND com.PersonalComprobantePagoAFIPAno = @1 AND com.PersonalComprobantePagoAFIPMes = @2
`,
      [personalIdRel, year, month]
    )
  }



  async downloadComprobante( req: Request, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const PersonalId = req.params.PersonalId
    const anio = req.params.anio
    const mes = req.params.mes

    try {
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
        WHERE per.PersonalId = @0`, [PersonalId, anio, mes]
      );
      if (!comprobante)
        throw new ClientException(`No se pudo encontrar el comprobante`);

      const filename = `${anio}-${mes.toString().padStart(2, '0')}-${comprobante.CUIT}-${comprobante.PersonalId}.pdf`
      const downloadPath = `${this.directory}/${anio}/${filename}`;

      if (!existsSync(downloadPath))
        throw new ClientException(`El archivo no existe (${downloadPath}).`);

//      const uint8Array = readFileSync(downloadPath);

      res.download(downloadPath, filename,async (error) => {
        if (error) {
          console.error('Error al descargar el archivo:', error);
          return next(error)
        }
      });

    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    }
  }

  async getLastPeriodosOfComprobantes(personalId: number, cant: number) {
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
      // await this.rollbackTransaction(queryRunner)
      return error
    }
  }

}