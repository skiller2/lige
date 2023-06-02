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
import {
  TextContent,
  TextItem,
  TextMarkedContent,
  TextStyle,
} from "pdfjs-dist/types/src/display/api";
import { getDocument } from "pdfjs-dist/legacy/build/pdf";
import { dataSource } from "../data-source";
import {
  FileEmbedder,
  PDFDocument,
  PDFPage,
  PDFPageDrawPageOptions,
  PageSizes,
  degrees,
  rgb,
} from "pdf-lib";

import { tmpName } from "../server";
import path from "path";
import { DescuentoJSON } from "src/schemas/ResponseJSON";
import { readFile } from "fs/promises";
import { BoundingBox } from "pdf-lib/cjs/types/fontkit";

const cuitRegex = [/:\d{2}\n(\d{11})$/m, /CUIT\/CUIL\/CDI\n(\d{11})/m];
const periodoRegex = [
  /PERIODO FISCAL (\d*)\/(\d*)/m,
  /^Fecha Retención\/Percepción\n\d{2}\/(\d{2})\/(\d{4})$/m,
];
const importeMontoRegex = [
  /^\$[\s*](([0-9]{1,3}[,|.]([0-9]{3}[,|.])*[0-9]{3}|[0-9]+)([.|,][0-9][0-9]))?$/m,
  /Monto de la Retenci.n\/Percepci.n\n(\d*.\d{2})/m,
];

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
    personalIdRel: string;
  }) {
    const extrafilter =
      options.personalIdRel && options.personalIdRel != "0"
        ? "AND perrel.PersonalCategoriaPersonalId = @4"
        : "";

    return dataSource.query(
      `SELECT DISTINCT
      per.PersonalId PersonalId,
      des.PersonalOtroDescuentoId,
      cuit2.PersonalCUITCUILCUIT AS CUIT, CONCAT(TRIM(per.PersonalApellido), ',', TRIM(per.PersonalNombre)) ApellidoNombre,

      perrel.PersonalCategoriaPersonalId PersonalIdJ, perrel.OperacionesPersonalAsignarAJerarquicoDesde, perrel.OperacionesPersonalAsignarAJerarquicoHasta,
      cuit.PersonalCUITCUILCUIT AS CUITJ, CONCAT(TRIM(perjer.PersonalApellido), ', ', TRIM(perjer.PersonalNombre)) ApellidoNombreJ,
      des.PersonalOtroDescuentoImporteVariable monto, des.PersonalOtroDescuentoAnoAplica, des.PersonalOtroDescuentoMesesAplica, des.PersonalOtroDescuentoDescuentoId,
    excep.PersonalExencionCUIT, 
	 sitrev.PersonalSituacionRevistaMotivo, sit.SituacionRevistaId, sit.SituacionRevistaDescripcion, sitrev.PersonalSituacionRevistaDesde, sitrev.PersonalSituacionRevistaHasta,
    1
     FROM PersonalImpuestoAFIP imp

      JOIN Personal per ON per.PersonalId = imp.PersonalId
     LEFT JOIN PersonalOtroDescuento des ON des.PersonalId = imp.PersonalId AND des.PersonalOtroDescuentoDescuentoId=@3 AND des.PersonalOtroDescuentoAnoAplica = @1 AND des.PersonalOtroDescuentoMesesAplica = @2
     LEFT JOIN OperacionesPersonalAsignarAJerarquico perrel ON perrel.OperacionesPersonalAAsignarPersonalId = imp.PersonalId AND DATEFROMPARTS(@1,@2,28) > perrel.OperacionesPersonalAsignarAJerarquicoDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(perrel.OperacionesPersonalAsignarAJerarquicoHasta, '9999-12-31')
     LEFT JOIN Personal perjer ON perjer.PersonalId = perrel.PersonalCategoriaPersonalId
     LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = perjer.PersonalId AND cuit.PersonalCUITCUILId = perjer.PersonalCUITCUILUltNro
     LEFT JOIN PersonalCUITCUIL cuit2 ON cuit2.PersonalId = per.PersonalId AND cuit2.PersonalCUITCUILId = per.PersonalCUITCUILUltNro
     LEFT JOIN PersonalExencion excep ON excep.PersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > excep.PersonalExencionDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(excep.PersonalExencionHasta,'9999-12-31')        
     LEFT JOIN PersonalSituacionRevista sitrev ON sitrev.PersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) >  sitrev.PersonalSituacionRevistaDesde AND  DATEFROMPARTS(@1,@2,28) < ISNULL(sitrev.PersonalSituacionRevistaHasta,'9999-12-31')
     LEFT JOIN SituacionRevista sit ON sit.SituacionRevistaId = sitrev.PersonalSituacionRevistaSituacionId
     WHERE
   1=1

   AND DATEFROMPARTS(@1,@2,28) > imp.PersonalImpuestoAFIPDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(imp.PersonalImpuestoAFIPHasta,'9999-12-31')
     AND excep.PersonalExencionCUIT IS NULL

	AND sit.SituacionRevistaId NOT IN (3,13,19,21,15,17,14,27,8,24,7)

     ${extrafilter} 
   `,
      [, options.anio, options.mes, options.descuentoId, options.personalIdRel]
    );
  }

  async getDescuentosGridCols(req: Request, res: Response) {
    /*
      PersonalId: number;
  CUIT: number;
  ApellidoNombre: string;
  PersonalEstado: string;

  PersonalIdJ: number;
  CUITJ: number;
  ApellidoNombreJ: string;
  monto: null | number;
  PersonalOtroDescuentoAnoAplica: null | number;
  PersonalOtroDescuentoMesesAplica: null | number;
  PersonalOtroDescuentoDescuentoId: null | number;

    */
    this.jsonRes(
      [
        {
          title: "CUIT",
          index: "CUIT",
          type: "number",
          resizable: true,
          sort: { compare: (a, b) => a.price - b.price },
        },
        {
          title: "Apellido Nombre",
          type: "",
          index: "ApellidoNombre",
          exported: true,
        },
        {
          title: "Sit Revista",
          type: "",
          index: "SituacionRevistaDescripcion",
          exported: true,
        },
        { title: "Importe", type: "currency", index: "monto", exported: true },
        {
          title: "CUIT Responsable",
          type: "number",
          index: "CUITJ",
          exported: true,
        },
        {
          title: "Apellido Nombre Responsable",
          type: "string",
          index: "ApellidoNombreJ",
          exported: true,
        },
        {
          title: "ID Descuento",
          type: "number",
          index: "PersonalOtroDescuentoId",
          exported: true,
        },
      ],
      res
    );
  }

  async getDescuentosGridList(req: Request, res: Response) {
    const anio = String(req.body.anio);
    const mes = String(req.body.mes);
    const personalIdRel = req.body.personalIdRel ? req.body.personalIdRel : "";
    const descuentoId = process.env.OTRO_DESCUENTO_ID;

    try {
      const result = await this.getDescuentosByPeriodo({
        anio,
        mes,
        descuentoId,
        personalIdRel,
      });
      this.jsonRes(
        {
          total: result.length,
          list: result,
        },
        res
      );
    } catch (error) {
      this.errRes(error, res);
    }
  }

  async handleGetDescuentos(req: Request, res: Response) {
    const anio = req.params.anio;
    const mes = req.params.mes;
    const personalIdRel = req.params.personalIdRel;
    const descuentoId = process.env.OTRO_DESCUENTO_ID;

    try {
      const result: DescuentoJSON[] = await this.getDescuentosByPeriodo({
        anio,
        mes,
        descuentoId,
        personalIdRel,
      });
      const sincomprobante = result.reduce(
        (total, item: any) =>
          item.PersonalOtroDescuentoDescuentoId == null ? total + 1 : total,
        0
      );
      this.jsonRes(
        {
          RegistrosConComprobantes: result.length - sincomprobante,
          RegistrosSinComprobantes: sincomprobante,
          Registros: result,
        },
        res
      );
    } catch (error) {
      this.errRes(error, res);
    }
  }
  async handlePDFUpload(req: Request, res: Response, forzado: boolean) {
    const file = req.file;
    const anioRequest = req.body.anio;
    const mesRequest = req.body.mes;
    const queryRunner = dataSource.createQueryRunner();

    try {
      if (!anioRequest) throw new Error("Faltó indicar el anio.");
      if (!anioRequest) throw new Error("Faltó indicar el mes.");

      await queryRunner.connect();
      await queryRunner.startTransaction();

      let CUIT: string;
      let importeMonto: number;

      if (forzado) {
        const importeRequest = req.body.monto;
        const cuitRequest = req.body.monto;

        if (!importeRequest) throw new Error("Faltó indicar el importe.");
        importeMonto = importeRequest;

        if (!cuitRequest) throw new Error("Faltó indicar el cuit.");
        CUIT = cuitRequest;
      } else {
        const loadingTask = getDocument(file.path);
        const document = await loadingTask.promise;

        // const metadata = await document.getMetadata();
        // console.log(metadata);

        const page = await document.getPage(1);
        const textContent = await page.getTextContent();

        const textContentItems: (TextItem | TextMarkedContent)[] =
          textContent.items.filter(function (value: any, index, arr) {
            return value.str.trim() != "";
          });

        let textdocument = "";

        textContent.items.forEach((item: TextItem) => {
          if (item.str.trim() != "") textdocument += item.str.trim() + "\n";
        });

        let [, periodoAnio, periodoMes] = this.getByRegexText(
          textdocument,
          periodoRegex,
          new Error("No se pudo encontrar el periodo.")
        );

        [, CUIT] = this.getByRegexText(
          textdocument,
          cuitRegex,
          new Error("No se pudo encontrar el CUIT.")
        );

        const [, importeMontoTemp] = this.getByRegexText(
          textdocument,
          importeMontoRegex,
          new Error("No se pudo encontrar el monto.")
        );
        importeMonto = parseFloat(importeMontoTemp.replace(",", "."));

        let periodoIsValid =
          Number(periodoAnio) == anioRequest &&
          Number(periodoMes) == mesRequest;

        if (!periodoIsValid) {
          const tmp = periodoAnio;
          periodoAnio = periodoMes;
          periodoMes = tmp;
        }

        periodoIsValid =
          Number(periodoAnio) == anioRequest &&
          Number(periodoMes) == mesRequest;

        if (!periodoIsValid)
          throw new Error(
            `El periodo especificado ${anioRequest}-${mesRequest} no coincide con el contenido en el documento ${periodoAnio}-${Number(
              periodoMes
            )}.`
          );
      }
      // if (!file) throw new Error("File not recieved/did not pass filter.");
      // if (!anioRequest) throw new Error("No se especificó un año.");
      // if (!mesRequest) throw new Error("No se especificó un mes.");

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
          anioRequest,
          mesRequest,
        ]
      );
      if (alreadyExists.length > 0)
        throw new Error(
          `Ya existe un descuento para el periodo ${anioRequest}-${mesRequest} y el CUIT ${CUIT}`
        );

      mkdirSync(`${this.directory}/${anioRequest}`, { recursive: true });
      const newFilePath = `${this.directory}/${anioRequest}/${anioRequest}-${mesRequest}-${CUIT}-${personalID}.pdf`;
      if (existsSync(newFilePath)) throw new Error("El documento ya existe.");
      const now = new Date();
      await queryRunner.query(
        `INSERT INTO PersonalOtroDescuento (PersonalOtroDescuentoId, PersonalId, PersonalOtroDescuentoDescuentoId, PersonalOtroDescuentoAnoAplica, PersonalOtroDescuentoMesesAplica, PersonalOtroDescuentoMes, PersonalOtroDescuentoCantidad, PersonalOtroDescuentoCantidadCuotas, PersonalOtroDescuentoImporteVariable, PersonalOtroDescuentoFechaAplica, PersonalOtroDescuentoCuotasPagas, PersonalOtroDescuentoLiquidoFinanzas, PersonalOtroDescuentoCuotaUltNro, PersonalOtroDescuentoUltimaLiquidacion)
        VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13)`,
        [
          personalIDQuery.OtroDescuentoId + 1,
          personalID,
          Number(process.env.OTRO_DESCUENTO_ID),
          anioRequest,
          mesRequest,
          mesRequest,
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

  getByRegexText(
    txt: string,
    regexExp: RegExp[],
    err = new Error("Could not find content.")
  ): RegExpMatchArray {
    let result: RegExpMatchArray;

    for (const re of regexExp) {
      result = txt.match(re);
      console.log("res", result, re);
      if (result) break;
    }

    if (!result) throw err;
    return result;
  }

  getByRegex(
    textContentItems: (TextItem | TextMarkedContent)[],
    regex: RegExp,
    err = new Error("Could not find content.")
  ): RegExpMatchArray {
    const result = textContentItems.find((item) =>
      regex.test((item as TextItem).str)
    );
    if (!result) throw err;
    return (result as TextItem).str.match(regex);
  }

  async downloadComprobantesByPeriodo(
    year: string,
    month: string,
    personalIdRel: string,
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
        personalIdRel,
      });

      const files = descuentos
        .filter(
          (descuento) => descuento.PersonalOtroDescuentoDescuentoId !== null
        )

        .map((descuento, index) => {
          return {
            name: `${year}-${formattedMonth}-${descuento.CUIT}-${descuento.PersonalId}.pdf`,
            apellidoNombre: descuento.ApellidoNombre,
            apellidoNombreJ: descuento.ApellidoNombreJ,
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
      apellidoNombre: string;
      apellidoNombreJ: string;
    }[],
    filesPath: string
  ) {
    const newDocument = await PDFDocument.create();
    let currentFileBuffer: Buffer;
    let currentFilePDF: PDFDocument;
    let currentFilePDFPage: PDFPage;
    let lastPage: PDFPage;

    for (const [index, file] of files.entries()) {
      const locationIndex = index % 4;
      currentFileBuffer = null;
      currentFilePDF = null;
      currentFilePDFPage = null;

      if (locationIndex === 0) lastPage = newDocument.addPage(PageSizes.A4);

      const filePath = path.join(filesPath, file.name);
      const fileExists = existsSync(filePath);

      const pageWidth = lastPage.getWidth();
      const pageHeight = lastPage.getHeight();

      if (fileExists) {
        currentFileBuffer = readFileSync(filePath);
        currentFilePDF = await PDFDocument.load(currentFileBuffer);
        currentFilePDFPage = currentFilePDF.getPages()[0];

        const embeddedPage = await newDocument.embedPage(currentFilePDFPage, {
          top: 790,
          bottom: 410,
          left: 53,
          right: 307,
        });

        const positionFromIndex: PDFPageDrawPageOptions = {
          x:
            locationIndex % 2 == 0
              ? Math.abs(pageWidth / 2 - embeddedPage.size().width) / 2
              : (Math.abs(pageWidth / 2 - embeddedPage.size().width) +
                  pageWidth) /
                2,
          y:
            locationIndex < 2
              ? (Math.abs(pageHeight / 2 - embeddedPage.size().height) +
                  pageHeight) /
                2
              : Math.abs(pageHeight / 2 - embeddedPage.size().height) / 2,
        };

        lastPage.drawPage(embeddedPage, { ...positionFromIndex });

        lastPage.drawText(
          `${file.apellidoNombre}\n\nResponsable: ${file.apellidoNombreJ}`,
          {
            x: positionFromIndex.x + 22,
            y: positionFromIndex.y + 60,
            size: 10,
            color: rgb(0, 0, 0),
            lineHeight: 6,
            //opacity: 0.75,
          }
        );

        // newPage.drawText(`Comprobante: ${file.name}`);
      } else {
        const positionFromIndex: PDFPageDrawPageOptions = {
          x: locationIndex % 2 == 0 ? 20 : pageWidth / 2 + 20,
          y: locationIndex < 2 ? pageHeight / 2 + 20 : 20,
        };
        lastPage.drawText(`Falta el comprobante: ${file.name}`, {
          ...positionFromIndex,
          size: 15,
          rotate: degrees(65),
        });
      }
    }

    return newDocument.save();
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
    const tmpfilename = `${dirtmp}/${tmpName(dirtmp)}`;
    try {
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
      const cuit = personalQuery.CUIT;

      const filename = `${year}-${month.padStart(
        2,
        "0"
      )}-${cuit}-${personalId}.pdf`;
      const downloadPath = `${this.directory}/${year}/${filename}`;

      if (!existsSync(downloadPath))
        throw new Error(`El archivo no existe (${downloadPath}).`);

      const uint8Array = readFileSync(downloadPath);

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

    let currentPage: PDFPage;
    //    currentPage = newPdf.addPage(PageSizes.A4);

    /*
    originPDFPages.forEach((embPage, index) => { 
      const { x, y, width, height } = embPage.getTrimBox();
      console.log('hoja:',x, y, width, height)
    })
    */
    const embededPages = await newPdf.embedPages(originPDFPages, [
      { top: 790, bottom: 410, left: 53, right: 307 },
    ]);
    //    const image = await fetch('assets/pdf/firma_recibo.png').then(res => res.arrayBuffer())
    //    const embededImage = await newPdf.embedPng(image)
    //    const scaleImage = embededImage.scale(1/20)

    embededPages.forEach((embPage, index) => {
      const embPageSize = embPage.scale(1);
      const margin = 20;

      currentPage = newPdf.addPage([
        embPageSize.width + margin,
        embPageSize.height + margin,
      ]);
      const pageRatio = currentPage.getWidth() / currentPage.getHeight();

      //      currentPage.drawPage(embPage, { x: (currentPage.getWidth() - embPage.width) / 2, y: currentPage.getHeight() / 2 * ((index+1) % 2) })
      //      const posy =
      //        index % 2 == 0 ? 0 + 20 : (currentPage.getHeight() / 2) * -1 + 20;

      currentPage.drawPage(embPage, {
        x: (currentPage.getWidth() - embPageSize.width) / 2,
        y: (currentPage.getHeight() - embPageSize.height) / 2,
        width: embPageSize.width,
        height: embPageSize.height,
      });

      //      currentPage.drawImage(embededImage, { x: 210, y: (((index) % 2 == 0) ? currentPage.getHeight() / 2: 0)  + 90, width: scaleImage.width, height: scaleImage.height })
      currentPage.drawText(
        `${ApellidoNombre}\n\nResponsable: ${ApellidoNombreJ}`,
        {
          x: 33,
          y: 70,
          size: 10,
          color: rgb(0, 0, 0),
          lineHeight: 6,
          //opacity: 0.75,
        }
      );
    });

    return newPdf.save();
  }
}
