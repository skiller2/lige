import { Request, Response } from "express";
import { getDocument } from "pdfjs-dist/legacy/build/pdf";
import { BaseController } from "../controller/baseController";
import fs, { copyFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import { TextContent, TextItem } from "pdfjs-dist/types/src/display/api";
import { dataSource } from "../data-source";

const cuitRegex = /^\d{11}$/;
const periodoRegex = /^PERIODO FISCAL ([0-9]{4})\/([0-9]{2})/;
const importeMontoRegex =
  /^\$[\s*](([0-9]{1,3}[,|.]([0-9]{3}[,|.])*[0-9]{3}|[0-9]+)([.|,][0-9][0-9]))?$/;

export class ImpuestosAfipController extends BaseController {
  directory = "./uploads/monotributo";
  constructor() {
    super();
    if (!existsSync(this.directory)) {
      mkdirSync(this.directory, { recursive: true });
    }
  }
  async getDescuentoByPeriodo(req: Request, res: Response) {
    const anio = req.params.anio;
    const mes = req.params.mes;

    try {
      const result = await dataSource.query(
        `SELECT
      perrel.OperacionesPersonalAAsignarPersonalId PersonalId,
      des.PersonalOtroDescuentoImporteVariable monto,
      cuit2.PersonalCUITCUILCUIT AS CUIT, CONCAT(TRIM(per.PersonalApellido), ',', TRIM(per.PersonalNombre)) ApellidoNombre, 
      perrel.PersonalCategoriaPersonalId PersonalIdJ,
      cuit.PersonalCUITCUILCUIT AS CUITJ, CONCAT(TRIM(perjer.PersonalApellido), ', ', TRIM(perjer.PersonalNombre)) ApellidoNombreJ
     FROM PersonalOtroDescuento des
     LEFT JOIN OperacionesPersonalAsignarAJerarquico perrel ON perrel.OperacionesPersonalAAsignarPersonalId = des.PersonalId
     LEFT JOIN Personal perjer ON perjer.PersonalId = perrel.PersonalCategoriaPersonalId
     LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = perjer.PersonalId AND cuit.PersonalCUITCUILId = perjer.PersonalCUITCUILUltNro
     LEFT JOIN Personal per ON per.PersonalId = des.PersonalId
     LEFT JOIN PersonalCUITCUIL cuit2 ON cuit2.PersonalId = per.PersonalId AND cuit2.PersonalCUITCUILId = per.PersonalCUITCUILUltNro
     WHERE DATEFROMPARTS(@1,@2,28) > perrel.OperacionesPersonalAsignarAJerarquicoDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(perrel.OperacionesPersonalAsignarAJerarquicoHasta, '9999-12-31')
     AND des.PersonalOtroDescuentoAnoAplica = @1 AND des.PersonalOtroDescuentoMesesAplica = @2
     `,
        [, anio, mes]
      );
      this.jsonRes(result, res);
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
        periodoAnio == anioRequest && periodoMes == mesRequest;

      if (!periodoIsValid)
        throw new Error(
          `El periodo especificado ${anioRequest}-${mesRequest} no coincide con el contenido en el documento ${periodoAnio}-${periodoMes}.`
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
          Number(process.env.OtroDescuentoId),
          periodoAnio,
          periodoMes,
        ]
      );

      if (alreadyExists)
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
      this.errRes(err, res, "Algo salió mal!", 400);
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
    const result = textContent.items.find((item) => regex.test(item.str));
    if (!result) throw err;
    return result.str.match(regex);
  }
  // async handlePDFUpload(req: any, res: Response) {
  //   try {
  //     if (!req.file) throw new Error("File not recieved/did not pass filter.");

  //     const file: Express.Multer.File = req.file
  //     const filename: string = file.originalname
  //     const path: string = file.path
  //     //Analizar el contenido del archivo y el formato de cuit del nombre para cargar los valores
  //     console.log('req', filename, file)

  //     const markedContentRegex = (mcid: number) =>
  //       new RegExp(`<<[^]*\\/MCID[\\0\\t\\n\\f\\r\\ ]*${mcid}[^]*>>[^]*BDC([^]*)EMC`);

  //     const extractMarkedContent = (mcid: number, contentStream: string) => {
  //       const regex = markedContentRegex(mcid);
  //       const res = contentStream.match(regex);
  //       return res?.[1];
  //     };

  //     const traverseStructTree = (root: PDFDict) => {
  //       const kidsRef = root.get(PDFName.of('K'));
  //       const structElementType = root.get(PDFName.of('S'));
  //       const paragraphType = PDFName.of('P');

  //       if (structElementType === paragraphType) {
  //         // TODO: What if this isn't a `PDFPageLeaf`?
  //         const page = root.lookup(PDFName.of('Pg')) as PDFPageLeaf;

  //         // TODO: What if this isn't a `PDFRawStream`?
  //         const contents = page.Contents() as PDFRawStream;

  //         // TODO: What if this isn't a `PDFNumber`?
  //         const markedContentIdentifer = kidsRef! as PDFNumber;
  //         const mcid = markedContentIdentifer.value();

  //         console.log(`------- Marked Content (id=${mcid}) --------`);
  //         const decodedBytes = decodePDFRawStream(contents).decode();
  //         const decodedString = arrayAsString(decodedBytes);
  //         const content = extractMarkedContent(mcid, decodedString);
  //         console.log(content);
  //         console.log(`-------- End (id=${mcid}) ---------`);
  //         console.log();
  //       }

  //       let node;
  //       if (!kidsRef || kidsRef instanceof PDFNumber) return;

  //       if (kidsRef instanceof PDFRef) {
  //         node = root.context.lookup(kidsRef, PDFDict);
  //         traverseStructTree(node);
  //       } else if (kidsRef instanceof PDFArray) {
  //         for (let idx = 0, len = kidsRef.size(); idx < len; idx++) {
  //           const nodeRef = kidsRef.get(idx);
  //           node = root.context.lookup(nodeRef);
  //           if (!(node instanceof PDFDict)) return;
  //           traverseStructTree(node);
  //         }
  //       }
  //     };

  //     const pdfDoc = await PDFDocument.load(fs.readFileSync(path));

  //     //console.log('pdfDoc',pdfDoc)

  //     const structTreeRoot = pdfDoc.catalog.lookupMaybe(
  //       PDFName.of('structTreeRoot'),
  //       //          PDFName.of('Catalog'),
  //       PDFDict,
  //     );
  //     console.log('structTreeRoot', structTreeRoot)
  //     traverseStructTree(structTreeRoot);

  //     this.jsonRes([], res, "PDF Recieved!");
  //   } catch (err) {
  //     this.errRes(err, res, "Something failed!", 400);
  //   }
  // }
}
