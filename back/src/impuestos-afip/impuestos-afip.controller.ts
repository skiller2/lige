import { Request, Response } from "express";
import { BaseController } from "../controller/baseController";
import { copyFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import { TextContent, TextItem } from "pdfjs-dist/types/src/display/api";
import { getDocument } from "pdfjs-dist/legacy/build/pdf";
import { dataSource } from "../data-source";

const cuitRegex = /^\d{11}$/;
const periodoRegex = /^PERIODO FISCAL ([0-9]{4})\/([0-9]{2})/;
const importeMontoRegex =
  /^\$[\s*](([0-9]{1,3}[,|.]([0-9]{3}[,|.])*[0-9]{3}|[0-9]+)([.|,][0-9][0-9]))?$/;

export class ImpuestosAfipController extends BaseController {
  directory = process.env.PATH_MONOTRIBUTO;
  constructor() {
    super();
    if (!existsSync(this.directory)) {
      mkdirSync(this.directory, { recursive: true });
    }
  }
  async getDescuentoByPeriodo(req: Request, res: Response) {
    const anio = req.params.anio;
    const mes = req.params.mes;

    const descuentoId = process.env.OTRO_DESCUENTO_ID;
    try {
      const result: [] = await dataSource.query(
        `SELECT DISTINCT
        perrel.OperacionesPersonalAAsignarPersonalId PersonalId,
        
        cuit2.PersonalCUITCUILCUIT AS CUIT, CONCAT(TRIM(per.PersonalApellido), ',', TRIM(per.PersonalNombre)) ApellidoNombre,
        per.PersonalEstado, 
        perrel.PersonalCategoriaPersonalId PersonalIdJ,
        cuit.PersonalCUITCUILCUIT AS CUITJ, CONCAT(TRIM(perjer.PersonalApellido), ', ', TRIM(perjer.PersonalNombre)) ApellidoNombreJ,
        des.PersonalOtroDescuentoImporteVariable monto, des.PersonalOtroDescuentoAnoAplica, des.PersonalOtroDescuentoMesesAplica, des.PersonalOtroDescuentoDescuentoId

       FROM PersonalImpuestoAFIP imp
       
        JOIN Personal per ON per.PersonalId = imp.PersonalId
       LEFT JOIN PersonalOtroDescuento des ON des.PersonalId = imp.PersonalId AND des.PersonalOtroDescuentoDescuentoId=@3 AND des.PersonalOtroDescuentoAnoAplica = @1 AND des.PersonalOtroDescuentoMesesAplica = @2
       LEFT JOIN OperacionesPersonalAsignarAJerarquico perrel ON perrel.OperacionesPersonalAAsignarPersonalId = imp.PersonalId
       LEFT JOIN Personal perjer ON perjer.PersonalId = perrel.PersonalCategoriaPersonalId
       LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = perjer.PersonalId AND cuit.PersonalCUITCUILId = perjer.PersonalCUITCUILUltNro
       LEFT JOIN PersonalCUITCUIL cuit2 ON cuit2.PersonalId = per.PersonalId AND cuit2.PersonalCUITCUILId = per.PersonalCUITCUILUltNro
       WHERE DATEFROMPARTS(@1,@2,28) > perrel.OperacionesPersonalAsignarAJerarquicoDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(perrel.OperacionesPersonalAsignarAJerarquicoHasta, '9999-12-31')
       AND DATEFROMPARTS(@1,@2,28) > imp.PersonalImpuestoAFIPDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(imp.PersonalImpuestoAFIPHasta,'9999-12-31')
  
     `,
        [, anio, mes, descuentoId]
      );
      const count =
        result.length -
        result.reduce(
          (total, item: any) =>
            item.PersonalOtroDescuentoDescuentoId == null ? total + 1 : total,
          0
        );
      this.jsonRes([...result, { Comprobantes: count }], res);
    } catch (error) {
      this.errRes(error, res);
    }
  }
  async handlePDFUpload(req: Request, res: Response) {
    const file = req.file;
    const anioRequest = req.body.anio;
    const mesRequest = req.body.mes;
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      // if (!file) throw new Error("File not recieved/did not pass filter.");
      // if (!anioRequest) throw new Error("No se especificó un año.");
      // if (!mesRequest) throw new Error("No se especificó un mes.");

      const loadingTask = getDocument(file.path);
      const document = await loadingTask.promise;

      // const metadata = await document.getMetadata();
      // console.log(metadata);

      const page = await document.getPage(1);
      const textContent = await page.getTextContent();
      // console.log(textContent);
      const [, periodoAnio, periodoMes] = this.getByRegex(
        textContent,
        periodoRegex,
        new Error("No se pudo encontrar el periodo.")
      );

      const periodoIsValid =
        Number(periodoAnio) == anioRequest && Number(periodoMes) == mesRequest;

      if (!periodoIsValid)
        throw new Error(
          `El periodo especificado ${anioRequest}-${mesRequest} no coincide con el contenido en el documento ${periodoAnio}-${Number(
            periodoMes
          )}.`
        );

      const [, importeMontoTemp] = this.getByRegex(
        textContent,
        importeMontoRegex,
        new Error("No se pudo encontrar el monto.")
      );

      const importeMonto = parseFloat(importeMontoTemp.replace(",", "."));

      const [CUIT] = this.getByRegex(
        textContent,
        cuitRegex,
        new Error("No se pudo encontrar el CUIT.")
      );

      const [personalIDQuery] = await queryRunner.query(
        "SELECT cuit.PersonalId, per.PersonalOtroDescuentoUltNro OtroDescuentoId FROM PersonalCUITCUIL cuit JOIN Personal per ON per.PersonalId = cuit.PersonalId WHERE cuit.PersonalCUITCUILCUIT = @0",
        [CUIT]
      );
      const personalID = personalIDQuery.PersonalId;
      if (!personalID) throw new Error(`No se pudo encontrar el CUIT ${CUIT}`);

      const alreadyExists = await queryRunner.query(
        `SELECT * FROM PersonalOtroDescuento des WHERE des.PersonalId = @0 AND des.PersonalOtroDescuentoDescuentoId = @1 AND des.PersonalOtroDescuentoAnoAplica = @2 AND des.PersonalOtroDescuentoMesesAplica = @3`,
        [
          personalID,
          Number(process.env.OTRO_DESCUENTO_ID),
          periodoAnio,
          periodoMes,
        ]
      );
      if (alreadyExists.length > 0)
        throw new Error(
          `Ya existe un descuento para el periodo ${periodoAnio}-${periodoMes} y el CUIT ${CUIT}`
        );
      mkdirSync(`${this.directory}/${periodoAnio}`, { recursive: true });
      const newFilePath = `${this.directory}/${periodoAnio}/${periodoAnio}-${periodoMes}-${CUIT}-${personalID}.pdf`;
      if (existsSync(newFilePath)) throw new Error("El documento ya existe.");
      const now = new Date();
      await queryRunner.query(
        `INSERT INTO PersonalOtroDescuento (PersonalOtroDescuentoId, PersonalId, PersonalOtroDescuentoDescuentoId, PersonalOtroDescuentoAnoAplica, PersonalOtroDescuentoMesesAplica, PersonalOtroDescuentoMes, PersonalOtroDescuentoCantidad, PersonalOtroDescuentoCantidadCuotas, PersonalOtroDescuentoImporteVariable, PersonalOtroDescuentoFechaAplica, PersonalOtroDescuentoCuotasPagas, PersonalOtroDescuentoLiquidoFinanzas, PersonalOtroDescuentoCuotaUltNro, PersonalOtroDescuentoUltimaLiquidacion)
        VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13)`,
        [
          personalIDQuery.OtroDescuentoId + 1,
          personalID,
          Number(process.env.OtroDescuentoId),
          periodoAnio,
          periodoMes,
          periodoMes,
          1,
          1,
          importeMonto,
          now,
          0,
          0,
          null,
          "",
        ]
      );
      await queryRunner.query(
        `UPDATE Personal SET PersonalOtroDescuentoUltNro = @0 WHERE PersonalId = @1`,
        [personalIDQuery.OtroDescuentoId + 1, personalID]
      );
      copyFileSync(file.path, newFilePath);
      await queryRunner.commitTransaction();

      this.jsonRes([], res, "PDF Recibido!");
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.errRes(err, res, err.message, 409);
    } finally {
      await queryRunner.release();
      unlinkSync(file.path);
    }
  }
  getByRegex(
    textContent: TextContent,
    regex: RegExp,
    err = new Error("Could not find content.")
  ) {
    const result = textContent.items.find((item) =>
      regex.test((item as TextItem).str)
    );
    if (!result) throw err;
    return (result as TextItem).str.match(regex);
  }

  downloadComprobante(
    year: string,
    month: string,
    cuit: string,
    personalId: string,
    res: Response
  ) {
    try {
      const downloadPath = `${this.directory}/${year}/${year}-${month.padStart(
        2,
        "0"
      )}-${cuit}-${personalId}.pdf`;
      console.log(downloadPath);

      if (!existsSync(downloadPath)) throw new Error("El archivo no existe.");
      res.status(200).download(downloadPath, (error) => {
        console.log(error);
      });
    } catch (error) {
      this.errRes(error, res, "Algo salió mal.", 409);
    }
  }
}
