import { Request, Response } from "express";
import { BaseController } from "../controller/baseController";
import {
  Dirent,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { TextContent, TextItem } from "pdfjs-dist/types/src/display/api";
import { getDocument } from "pdfjs-dist/legacy/build/pdf";
import { dataSource } from "../data-source";
import { FileEmbedder, PDFDocument, PDFPage, PageSizes, rgb } from "pdf-lib";

import { tmpName } from "../server";
import path from "path";
import { DescuentoJSON } from "src/schemas/ResponseJSON";
import { readFile } from "fs/promises";

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

  getDescuentosByPeriodo(options: {
    anio: string;
    mes: string;
    descuentoId: string;
  }) {
    return dataSource.query(
      `SELECT DISTINCT
      per.PersonalId PersonalId,
      
      cuit2.PersonalCUITCUILCUIT AS CUIT, CONCAT(TRIM(per.PersonalApellido), ',', TRIM(per.PersonalNombre)) ApellidoNombre,
      per.PersonalEstado, 
      perrel.PersonalCategoriaPersonalId PersonalIdJ,
      cuit.PersonalCUITCUILCUIT AS CUITJ, CONCAT(TRIM(perjer.PersonalApellido), ', ', TRIM(perjer.PersonalNombre)) ApellidoNombreJ,
      des.PersonalOtroDescuentoImporteVariable monto, des.PersonalOtroDescuentoAnoAplica, des.PersonalOtroDescuentoMesesAplica, des.PersonalOtroDescuentoDescuentoId,
    excep.PersonalExencionCUIT,
    1   
     FROM PersonalImpuestoAFIP imp
     
      JOIN Personal per ON per.PersonalId = imp.PersonalId
     LEFT JOIN PersonalOtroDescuento des ON des.PersonalId = imp.PersonalId AND des.PersonalOtroDescuentoDescuentoId=@3 AND des.PersonalOtroDescuentoAnoAplica = @1 AND des.PersonalOtroDescuentoMesesAplica = @2
     LEFT JOIN OperacionesPersonalAsignarAJerarquico perrel ON perrel.OperacionesPersonalAAsignarPersonalId = imp.PersonalId AND DATEFROMPARTS(@1,@2,28) > perrel.OperacionesPersonalAsignarAJerarquicoDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(perrel.OperacionesPersonalAsignarAJerarquicoHasta, '9999-12-31')
     LEFT JOIN Personal perjer ON perjer.PersonalId = perrel.PersonalCategoriaPersonalId
     LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = perjer.PersonalId AND cuit.PersonalCUITCUILId = perjer.PersonalCUITCUILUltNro
     LEFT JOIN PersonalCUITCUIL cuit2 ON cuit2.PersonalId = per.PersonalId AND cuit2.PersonalCUITCUILId = per.PersonalCUITCUILUltNro
     LEFT JOIN PersonalExencion excep ON excep.PersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > excep.PersonalExencionDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(excep.PersonalExencionHasta,'9999-12-31')
     
     
     WHERE 
   1=1
    
   AND DATEFROMPARTS(@1,@2,28) > imp.PersonalImpuestoAFIPDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(imp.PersonalImpuestoAFIPHasta,'9999-12-31')
     AND excep.PersonalExencionCUIT IS NULL

     AND per.PersonalEstado NOT IN ('BAJA','BAJAT','POSTULANTEP','POSTULANTEA','POSTULANTE') 
   `,
      [, options.anio, options.mes, options.descuentoId]
    );
  }
  async handleGetDescuentos(req: Request, res: Response) {
    const anio = req.params.anio;
    const mes = req.params.mes;
    const descuentoId = process.env.OTRO_DESCUENTO_ID;

    try {
      const result: DescuentoJSON[] = await this.getDescuentosByPeriodo({
        anio,
        mes,
        descuentoId,
      });
      const count =
        result.length -
        result.reduce(
          (total, item: any) =>
            item.PersonalOtroDescuentoDescuentoId == null ? total + 1 : total,
          0
        );
      this.jsonRes({ RegistrosConComprobantes: count, Registros: result }, res);
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
        "SELECT cuit.PersonalId, per.PersonalOtroDescuentoUltNro OtroDescuentoId, CONCAT(per.PersonalApellido,', ',per.PersonalNombre) ApellidoNombre FROM PersonalCUITCUIL cuit JOIN Personal per ON per.PersonalId = cuit.PersonalId WHERE cuit.PersonalCUITCUILCUIT = @0",
        [CUIT]
      );
      const personalID = personalIDQuery.PersonalId;
      if (!personalID) throw new Error(`No se pudo encontrar el CUIT ${CUIT}`);

      const ApellidoNombre = personalIDQuery.ApellidoNombre;

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
          Number(process.env.OTRO_DESCUENTO_ID),
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
  ): RegExpMatchArray {
    const result = textContent.items.find((item) =>
      regex.test((item as TextItem).str)
    );
    if (!result) throw err;
    return (result as TextItem).str.match(regex);
  }

  async downloadComprobantesByPeriodo(
    year: string,
    month: string,
    res: Response
  ) {
    try {
      const formattedMonth = month.padStart(2, "0");
      const filesPath = path.join(this.directory, year);

      const descuentoId = process.env.OTRO_DESCUENTO_ID;
      const descuentos: DescuentoJSON[] = await this.getDescuentosByPeriodo({
        anio: year,
        mes: formattedMonth,
        descuentoId,
      });

      const files = descuentos.map((descuento, index) => {
        return {
          name: `${year}-${formattedMonth}-${descuento.CUIT}-${descuento.PersonalId}.pdf`,
          hasComprobante: descuento.PersonalOtroDescuentoDescuentoId
            ? true
            : false,
        };
      });

      const responsePDFBuffer = await this.PDFmergeFromFiles(files, filesPath);

      const dirtmp = `${process.env.PATH_MONOTRIBUTO}/temp`;
      const tmpfilename = `${dirtmp}/${tmpName(dirtmp)}`;
      const filename = `${year}-${formattedMonth}.pdf`;

      writeFileSync(tmpfilename, responsePDFBuffer);

      res.download(tmpfilename, filename, (msg) => {
        unlinkSync(tmpfilename);
      });
    } catch (error) {
      this.errRes(error, res, "Algo salió mal!", 409);
    }
  }

  async PDFmergeFromFiles(
    files: {
      name: string;
      hasComprobante: boolean;
    }[],
    filesPath: string
  ) {
    const newDocument = await PDFDocument.create();
    let currentFileBuffer: Buffer;
    let currentFilePDF: PDFDocument;
    let currentFilePDFPage: PDFPage;

    files.forEach(async (file) => {
      // currentFileBuffer = null;
      // currentFilePDF = null;
      // currentFilePDFPage = null;

      if (!file.hasComprobante) return;

      const newPage = newDocument.addPage();
      const filePath = path.join(filesPath, file.name);
      const fileExists = existsSync(filePath);
      if (fileExists) {
        currentFileBuffer = readFileSync(filePath);
        currentFilePDF = await PDFDocument.load(currentFileBuffer);
        // currentFilePDFPage = currentFilePDF.getPages()[0];

        // const embeddedPage = await newDocument.embedPage(currentFilePDFPage);
        // const embeddedPageDims = embeddedPage.scale(1);
        // newPage.drawPage(embeddedPage);
        newPage.drawText(`Comprobante: ${file.name}`);
      } else {
        newPage.drawText(`Falta el comprobante: ${file.name}`);
      }
    });

    return await newDocument.save();
  }

  async downloadComprobante(
    year: string,
    month: string,
    cuit: string,
    personalId: string,
    res: Response
  ) {
    const queryRunner = dataSource.createQueryRunner();

    const dirtmp = `${process.env.PATH_MONOTRIBUTO}/temp`;
    const filename = `${year}-${month.padStart(
      2,
      "0"
    )}-${cuit}-${personalId}.pdf`;
    const downloadPath = `${this.directory}/${year}/${filename}`;
    const tmpfilename = `${dirtmp}/${tmpName(dirtmp)}`;
    try {
      if (!existsSync(downloadPath))
        throw new Error(`El archivo no existe (${downloadPath}).`);

      const uint8Array = readFileSync(downloadPath);

      const [personalQuery] = await queryRunner.query(
        `SELECT DISTINCT
        per.PersonalId PersonalId,
        
        cuit2.PersonalCUITCUILCUIT AS CUIT, CONCAT(TRIM(per.PersonalApellido), ',', TRIM(per.PersonalNombre)) ApellidoNombre,
        per.PersonalEstado, 
        perrel.PersonalCategoriaPersonalId PersonalIdJ,
        cuit.PersonalCUITCUILCUIT AS CUITJ, CONCAT(TRIM(perjer.PersonalApellido), ', ', TRIM(perjer.PersonalNombre)) ApellidoNombreJ,
      1   
       
        FROM Personal per
       LEFT JOIN OperacionesPersonalAsignarAJerarquico perrel ON perrel.OperacionesPersonalAAsignarPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > perrel.OperacionesPersonalAsignarAJerarquicoDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(perrel.OperacionesPersonalAsignarAJerarquicoHasta, '9999-12-31')
       LEFT JOIN Personal perjer ON perjer.PersonalId = perrel.PersonalCategoriaPersonalId
       LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = perjer.PersonalId AND cuit.PersonalCUITCUILId = perjer.PersonalCUITCUILUltNro
       LEFT JOIN PersonalCUITCUIL cuit2 ON cuit2.PersonalId = per.PersonalId AND cuit2.PersonalCUITCUILId = per.PersonalCUITCUILUltNro
       
       
       WHERE per.PersonalId = @0
		 `,
        [personalId, year, month]
      );
      const personalID = personalQuery.PersonalId;
      if (!personalID)
        throw new Error(`No se pudo encontrar la persona ${personalId}`);
      const ApellidoNombre = personalQuery.ApellidoNombre;
      const ApellidoNombreJ = personalQuery.ApellidoNombreJ;

      const buffer = await this.alterPDF(
        uint8Array,
        ApellidoNombre,
        ApellidoNombreJ
      );
      writeFileSync(tmpfilename, buffer);

      res.download(tmpfilename, filename, (msg) => {
        unlinkSync(tmpfilename);
      });
    } catch (error) {
      this.errRes(error, res, "Algo salió mal.", 404);
    }
  }

  async alterPDF(
    bufferPDF: Uint8Array,
    ApellidoNombre: string,
    ApellidoNombreJ: string
  ) {
    if (bufferPDF.length == 0) return;
    const originPDF = await PDFDocument.load(bufferPDF);
    const originPDFPages = originPDF.getPages();
    if (originPDFPages.length == 0) return;

    const newPdf = await PDFDocument.create();

    const embededPages = await newPdf.embedPages(originPDFPages);
    //    const image = await fetch('assets/pdf/firma_recibo.png').then(res => res.arrayBuffer())
    //    const embededImage = await newPdf.embedPng(image)
    //    const scaleImage = embededImage.scale(1/20)

    let currentPage: PDFPage;
    embededPages.forEach((embPage, index) => {
      if (index % 2 == 0) {
        currentPage = newPdf.addPage(PageSizes.A4);
      }
      const pageRatio = currentPage.getWidth() / currentPage.getHeight();

      const embPageSize = embPage.scale(1);
      //      currentPage.drawPage(embPage, { x: (currentPage.getWidth() - embPage.width) / 2, y: currentPage.getHeight() / 2 * ((index+1) % 2) })
      const posy =
        index % 2 == 0 ? 0 + 20 : (currentPage.getHeight() / 2) * -1 + 20;

      currentPage.drawPage(embPage, {
        x: (currentPage.getWidth() - embPageSize.width) / 2,
        y: posy,
        width: embPageSize.width,
        height: embPageSize.height,
      });

      //      currentPage.drawImage(embededImage, { x: 210, y: (((index) % 2 == 0) ? currentPage.getHeight() / 2: 0)  + 90, width: scaleImage.width, height: scaleImage.height })
      currentPage.drawText(
        `${ApellidoNombre}\n\nResponsable: ${ApellidoNombreJ}`,
        {
          x: 80,
          y: (index % 2 == 0 ? currentPage.getHeight() / 2 : 0) + 70,
          size: 8,
          color: rgb(0, 0, 0),
          lineHeight: 6,
          //opacity: 0.75,
        }
      );
    });

    return newPdf.save();
  }
}
