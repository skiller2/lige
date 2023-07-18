import { Request, Response } from "express";
import { BaseController } from "../controller/baseController";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { TextItem, TextMarkedContent } from "pdfjs-dist/types/src/display/api";
import { getDocument, GlobalWorkerOptions} from "pdfjs-dist/legacy/build/pdf";
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
import path from "path";
import { DescuentoJSON } from "../schemas/ResponseJSON";
import { Filtro, Options } from "../schemas/filtro";
import { listaColumnas } from "./comprobantes-utils/lista";
import {
  filtrosToSql,
  getOptionsFromRequest,
  isOptions,
} from "./filtros-utils/filtros";
import {
  SendFileToDownload,
  getPeriodoFromRequest,
} from "./impuestos-afip.utils";
import { getFiltroFromRequest } from "./download-informe-utils/informe-filtro";

GlobalWorkerOptions.workerSrc = `./pdf.worker.js`;


const cuitRegex = [
  /:\d{2}\n(\d{11})$/m,
  /CUIT\/CUIL\/CDI\n(\d{11})/m,
  /^CUIT: (\d{11})$/m,
];
const periodoRegex = [
  /PERIODO FISCAL (\d*)\/(\d*)/m,
  /^Fecha Retención\/Percepción\n\d{2}\/(\d{2})\/(\d{4})$/m,
  /PERIODO: (\d{2})\/(\d{4})$/m,
];
const importeMontoRegex = [
  /^\$[\s*](([0-9]{1,3}[,|.]([0-9]{3}[,|.])*[0-9]{3}|[0-9]+)([.|,][0-9][0-9]))?$/m,
  /Monto de la Retenci.n\/Percepci.n\n(\d*.\d{2})/m,
  /^IMPORTE: \$(([0-9]{1,3}[,|.]([0-9]{3}[,|.])*[0-9]{3}|[0-9]+)([.|,][0-9][0-9]))$/m,
];

export class ImpuestosAfipController extends BaseController {
  directory = process.env.PATH_MONOTRIBUTO || "tmp";
  constructor() {
    super();
    if (!existsSync(this.directory)) {
      mkdirSync(this.directory, { recursive: true });
    }
  }

  async handleDownloadInformeByFiltro(req: Request, res: Response) {
    try {
      const periodo = getPeriodoFromRequest(req);
      const filtro = getFiltroFromRequest(req);

      const filesPath = path.join(this.directory, String(periodo.year));
    } catch (error) {
      this.errRes(error, res, "Algo salió mal!", 409);
    }
  }

  async handleDownloadComprobantesByFiltro(req: Request, res: Response) {
    try {
      const descuentoId = process.env.OTRO_DESCUENTO_ID;
      const periodo = getPeriodoFromRequest(req);
      const options = getOptionsFromRequest(req);
      const cantxpag = req.body.cantxpag

      const formattedMonth = String(periodo.month).padStart(2, "0");
      const filesPath = path.join(this.directory, String(periodo.year));

      const descuentos: DescuentoJSON[] = await this.DescuentosByPeriodo({
        anio: String(periodo.year),
        mes: String(periodo.month),
        descuentoId: descuentoId,
        options,
      });
      const files = descuentos
        .filter(
          (descuento) => descuento.PersonalOtroDescuentoDescuentoId !== null
        )
        .map((descuento, index) => {
          return {
            name: `${periodo.year}-${formattedMonth}-${descuento.CUIT}-${descuento.PersonalId}.pdf`,
            apellidoNombre: descuento.ApellidoNombre,
            apellidoNombreJ: descuento.ApellidoNombreJ,
          };
        });

      const responsePDFBuffer = await this.PDFmergeFromFiles(files, filesPath, cantxpag);
      const filename = `${periodo.year}-${formattedMonth}-filtrado.pdf`;

      SendFileToDownload(res, filename, responsePDFBuffer);
    } catch (error) {
      this.errRes(error, res, "Algo salió mal!", 409);
    }
  }

  DescuentosByPeriodo(params: {
    anio: string;
    mes: string;
    descuentoId: string;
    options: Options;
  }) {
    const filtros = params.options.filtros;
    const filterSql = filtrosToSql(filtros,listaColumnas);

    return dataSource.query(
      `SELECT DISTINCT 
      CONCAT(per.PersonalId,'-',des.PersonalOtroDescuentoId) id,
      per.PersonalId PersonalId,
      des.PersonalOtroDescuentoId,
      cuit2.PersonalCUITCUILCUIT AS CUIT, CONCAT(TRIM(per.PersonalApellido), ',', TRIM(per.PersonalNombre)) ApellidoNombre,

      perrel.PersonalCategoriaPersonalId PersonalIdJ, perrel.OperacionesPersonalAsignarAJerarquicoDesde, perrel.OperacionesPersonalAsignarAJerarquicoHasta,
      cuit.PersonalCUITCUILCUIT AS CUITJ, CONCAT(TRIM(perjer.PersonalApellido), ', ', TRIM(perjer.PersonalNombre)) ApellidoNombreJ,
      des.PersonalOtroDescuentoImporteVariable monto, des.PersonalOtroDescuentoAnoAplica, des.PersonalOtroDescuentoMesesAplica, des.PersonalOtroDescuentoDescuentoId,
    excep.PersonalExencionCUIT, 
-- 	 sitrev.PersonalSituacionRevistaMotivo, sit.SituacionRevistaId, sit.SituacionRevistaDescripcion, sitrev.PersonalSituacionRevistaDesde, sitrev.PersonalSituacionRevistaHasta,
    1
     FROM PersonalImpuestoAFIP imp

      JOIN Personal per ON per.PersonalId = imp.PersonalId
     LEFT JOIN PersonalOtroDescuento des ON des.PersonalId = imp.PersonalId AND des.PersonalOtroDescuentoDescuentoId=@3 AND des.PersonalOtroDescuentoAnoAplica = @1 AND des.PersonalOtroDescuentoMesesAplica = @2
     LEFT JOIN OperacionesPersonalAsignarAJerarquico perrel ON perrel.OperacionesPersonalAAsignarPersonalId = imp.PersonalId AND DATEFROMPARTS(@1,@2,28) > perrel.OperacionesPersonalAsignarAJerarquicoDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(perrel.OperacionesPersonalAsignarAJerarquicoHasta, '9999-12-31')
     LEFT JOIN Personal perjer ON perjer.PersonalId = perrel.PersonalCategoriaPersonalId
     LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = perjer.PersonalId AND cuit.PersonalCUITCUILId = perjer.PersonalCUITCUILUltNro
     LEFT JOIN PersonalCUITCUIL cuit2 ON cuit2.PersonalId = per.PersonalId AND cuit2.PersonalCUITCUILId = per.PersonalCUITCUILUltNro
     LEFT JOIN PersonalExencion excep ON excep.PersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > excep.PersonalExencionDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(excep.PersonalExencionHasta,'9999-12-31')        
     LEFT JOIN PersonalSituacionRevista sitrev ON sitrev.PersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) >  sitrev.PersonalSituacionRevistaDesde AND  DATEFROMPARTS(@1,@2,1) < ISNULL(sitrev.PersonalSituacionRevistaHasta,'9999-12-31')
     LEFT JOIN SituacionRevista sit ON sit.SituacionRevistaId = sitrev.PersonalSituacionRevistaSituacionId
     WHERE
   1=1

   AND DATEFROMPARTS(@1,@2,28) > imp.PersonalImpuestoAFIPDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(imp.PersonalImpuestoAFIPHasta,'9999-12-31')
     AND excep.PersonalExencionCUIT IS NULL

	-- AND sit.SituacionRevistaId NOT IN (3,13,19,21,15,17,14,27,8,24,7)
  AND sit.SituacionRevistaId  IN (2,4,5,6,9,10,11,12,20,23,26)
    AND (${filterSql})
   `,
      [, params.anio, params.mes, params.descuentoId]
    );
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
-- 	 sitrev.PersonalSituacionRevistaMotivo, sit.SituacionRevistaId, sit.SituacionRevistaDescripcion, sitrev.PersonalSituacionRevistaDesde, sitrev.PersonalSituacionRevistaHasta,
    1
     FROM PersonalImpuestoAFIP imp

      JOIN Personal per ON per.PersonalId = imp.PersonalId
     LEFT JOIN PersonalOtroDescuento des ON des.PersonalId = imp.PersonalId AND des.PersonalOtroDescuentoDescuentoId=@3 AND des.PersonalOtroDescuentoAnoAplica = @1 AND des.PersonalOtroDescuentoMesesAplica = @2
     LEFT JOIN OperacionesPersonalAsignarAJerarquico perrel ON perrel.OperacionesPersonalAAsignarPersonalId = imp.PersonalId AND DATEFROMPARTS(@1,@2,28) > perrel.OperacionesPersonalAsignarAJerarquicoDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(perrel.OperacionesPersonalAsignarAJerarquicoHasta, '9999-12-31')
     LEFT JOIN Personal perjer ON perjer.PersonalId = perrel.PersonalCategoriaPersonalId
     LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = perjer.PersonalId AND cuit.PersonalCUITCUILId = perjer.PersonalCUITCUILUltNro
     LEFT JOIN PersonalCUITCUIL cuit2 ON cuit2.PersonalId = per.PersonalId AND cuit2.PersonalCUITCUILId = per.PersonalCUITCUILUltNro
     LEFT JOIN PersonalExencion excep ON excep.PersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > excep.PersonalExencionDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(excep.PersonalExencionHasta,'9999-12-31')        
     LEFT JOIN PersonalSituacionRevista sitrev ON sitrev.PersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) >  sitrev.PersonalSituacionRevistaDesde AND  DATEFROMPARTS(@1,@2,1) < ISNULL(sitrev.PersonalSituacionRevistaHasta,'9999-12-31')
     LEFT JOIN SituacionRevista sit ON sit.SituacionRevistaId = sitrev.PersonalSituacionRevistaSituacionId
     WHERE
   1=1

   AND DATEFROMPARTS(@1,@2,28) > imp.PersonalImpuestoAFIPDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(imp.PersonalImpuestoAFIPHasta,'9999-12-31')
     AND excep.PersonalExencionCUIT IS NULL

	-- AND sit.SituacionRevistaId NOT IN (3,13,19,21,15,17,14,27,8,24,7)
  AND sit.SituacionRevistaId  IN (2,4,5,6,9,10,11,12,20,23,26)

     ${extrafilter} 
   `,
      [, options.anio, options.mes, options.descuentoId, options.personalIdRel]
    );
  }

  async getDescuentosGridCols(req: Request, res: Response) {
    this.jsonRes(listaColumnas, res);
  }

  async getDescuentosGridList(req: Request, res: Response) {
    const anio = String(req.body.anio);
    const mes = String(req.body.mes);
    const options: Options = isOptions(req.body.options)
      ? req.body.options
      : { filtros: [], sort: null };

//    console.log(options);

    const descuentoId = process.env.OTRO_DESCUENTO_ID;

    try {
      const listaDescuentos = await this.DescuentosByPeriodo({
        anio,
        mes,
        descuentoId,
        options,
      });

      this.jsonRes(
        {
          total: listaDescuentos.length,
          list: listaDescuentos,
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

  async insertPDF(
    queryRunner,
    CUIT,
    anioRequest,
    mesRequest,
    importeMonto,
    file,
    pagenum
  ) {
    const [personalIDQuery] = await queryRunner.query(
      "SELECT cuit.PersonalId, per.PersonalOtroDescuentoUltNro OtroDescuentoId, CONCAT(per.PersonalApellido,', ',per.PersonalNombre) ApellidoNombre FROM PersonalCUITCUIL cuit JOIN Personal per ON per.PersonalId = cuit.PersonalId WHERE cuit.PersonalCUITCUILCUIT = @0",
      [CUIT]
    );

    if (!personalIDQuery.PersonalId)
      throw new Error(`No se pudo encontrar el CUIT ${CUIT}`);

    const personalID = personalIDQuery.PersonalId;

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
    const newFilePath = `${this.directory
      }/${anioRequest}/${anioRequest}-${mesRequest
        .toString()
        .padStart(2, "0")}-${CUIT}-${personalID}.pdf`;

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
    if (pagenum == null) {
      copyFileSync(file.path, newFilePath);
    } else {
      const currentFileBuffer = readFileSync(file.path);

      const pdfDoc = await PDFDocument.create();
      const srcDoc = await PDFDocument.load(currentFileBuffer);

      const copiedPages = await pdfDoc.copyPages(srcDoc, [pagenum - 1]);
      const [copiedPage] = copiedPages;

      pdfDoc.addPage(copiedPage);
      const buffer = await pdfDoc.save();
      writeFileSync(newFilePath, buffer);
    }
  }

  async handlePDFUpload(req: Request, res: Response, forzado: boolean) {
    const file = req.file;
    const anioRequest: number = req.body.anio;
    const mesRequest: number = req.body.mes;
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
        const cuitRequest = req.body.cuit;

        if (!importeRequest) throw new Error("Faltó indicar el importe.");
        importeMonto = importeRequest;

        if (!cuitRequest) throw new Error("Faltó indicar el cuit.");
        CUIT = cuitRequest;

        //Call to writefile
        await this.insertPDF(
          queryRunner,
          CUIT,
          anioRequest,
          mesRequest,
          importeMonto,
          file,
          null
        );
      } else {
        const loadingTask = getDocument(file.path);

        const document = await loadingTask.promise;

        let errList: Array<any> = [];
        for (let pagenum = 1; pagenum <= document.numPages; pagenum++) {
          //        for (let pagenum = 1; pagenum <= 1; pagenum++) {

          const page = await document.getPage(pagenum);

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

          try {
            await this.insertPDF(
              queryRunner,
              CUIT,
              anioRequest,
              mesRequest,
              importeMonto,
              file,
              pagenum
            );
          } catch (err: any) {
            errList.push(err);
          }
        }
        let errTxt = "";
        if (errList.length > 0) {
          errList.forEach((err) => {
            errTxt += err.message + "\n";
          });

          //throw new Error(errTxt)
        }
      }
      // if (!file) throw new Error("File not recieved/did not pass filter.");
      // if (!anioRequest) throw new Error("No se especificó un año.");
      // if (!mesRequest) throw new Error("No se especificó un mes.");

      await queryRunner.commitTransaction();

      this.jsonRes([], res, "PDF Recibido!");
    } catch (err) {
      if (queryRunner.isTransactionActive)
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

      let filtros: Filtro[] = []
      
      if (personalIdRel != '') 
        filtros.push({ index: 'PersonalIdJ', operador: '=', condition: 'AND', valor: personalIdRel })

      const descuentos: DescuentoJSON[] = await this.DescuentosByPeriodo({
        anio: year,
        mes: month,
        descuentoId: descuentoId,
        options: { filtros:filtros, sort: null },
      });
      // const descuentos: DescuentoJSON[] = await this.getDescuentosByPeriodo({
      //   anio: year,
      //   mes: formattedMonth,
      //   descuentoId,
      //   personalIdRel,
      // });

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

      const responsePDFBuffer = await this.PDFmergeFromFiles(files, filesPath, 4);

      const dirtmp = `${process.env.PATH_MONOTRIBUTO}/temp`;
      const tmpfilename = `${dirtmp}/${tmpName(dirtmp)}`;
      const filename = `${year}-${formattedMonth}.pdf`;

      writeFileSync(tmpfilename, responsePDFBuffer);

      res.download(tmpfilename, filename, (msg) => {
        unlinkSync(tmpfilename);
      });
    } catch (error) {
      this.errRes(error, res, "Algo salió mal 2!", 409);
    }
  }

  async PDFmergeFromFiles(
    files: {
      name: string;
      apellidoNombre: string;
      apellidoNombreJ: string;
    }[],
    filesPath: string,
    cantxpag: number
  ) {
    const newDocument = await PDFDocument.create();
    let currentFileBuffer: Buffer;
    let currentFilePDF: PDFDocument;
    let currentFilePDFPage: PDFPage;
    let lastPage: PDFPage;

    for (const [index, file] of files.entries()) {
      const locationIndex = (cantxpag==4)?index % 4 :0
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

        let embeddedPage: PDFEmbeddedPage = null;
        let origenComprobante = "";

        if (
          currentFilePDFPage.getWidth() == 595.276 &&
          currentFilePDFPage.getHeight() == 841.89
        ) {
          origenComprobante = "PAGO"
          embeddedPage = await newDocument.embedPage(currentFilePDFPage, {
            top: 790,
            bottom: 410,
            left: 53,
            right: 307,
          });
        } else if (
          currentFilePDFPage.getWidth() == 598 &&
          currentFilePDFPage.getHeight() == 845
        ) {
          origenComprobante = "AFIP"
          embeddedPage = await newDocument.embedPage(currentFilePDFPage, {
            top: 808,
            bottom: 385,
            left: 37,
            right: 560,
          });
        } else {
          embeddedPage = await newDocument.embedPage(currentFilePDFPage);
        }

        const imgWidthScale = (pageWidth / 2 - 20) / embeddedPage.width;
        const imgHeightScale = (pageHeight / 2 - 20) / embeddedPage.height;
        const scalePage = embeddedPage.scale(
          Math.min(imgWidthScale, imgHeightScale)
        );

        const positionFromIndex: PDFPageDrawPageOptions = {
          x:
            locationIndex % 2 == 0
              ? Math.abs(pageWidth / 2 - scalePage.width) / 2
              : (Math.abs(pageWidth / 2 - scalePage.width) + pageWidth) / 2,
          y:
            locationIndex < 2
              ? (Math.abs(pageHeight / 2 - scalePage.height) + pageHeight) / 2
              : Math.abs(pageHeight / 2 - scalePage.height) / 2,
          width: scalePage.width,
          height: scalePage.height,
        };

        lastPage.drawPage(embeddedPage, { ...positionFromIndex });


        switch (origenComprobante) {
          case "AFIP":
            lastPage.drawText(
              `Responsable: ${file.apellidoNombreJ}`,
              {
                x: positionFromIndex.x + 22,
                y: positionFromIndex.y + 25,
                size: 5,
                color: rgb(0, 0, 0),
                lineHeight: 6,
                //opacity: 0.75,
              }
            );

            lastPage.drawText(
              `COMPROBANTE DE PAGO`,
              {
                x: positionFromIndex.x + 125,
                y: positionFromIndex.y + 215,
                size: 8,
                color: rgb(0, 0, 0),
                lineHeight: 6,
                //opacity: 0.75,
              }
            );


            lastPage.drawText(
              `352-CONTRIBUCIONES OBRA SOCIAL`,
              {
                x: positionFromIndex.x + 123,
                y: positionFromIndex.y + 95,
                size: 4.5,
                color: rgb(0, 0, 0),
                lineHeight: 6,
                //opacity: 0.75,
              }
            );

            break
          case "PAGO":
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

            break
          default:
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

            break
        }


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
      this.errRes(error, res, "Algo salió mal 3!", 404);
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

    const page0 = originPDFPages[0];

    let embededPages = null;
    let origenComprobante = "";

    if (page0.getWidth() == 595.276 && page0.getHeight() == 841.89) {
      origenComprobante = "PAGO"
      embededPages = await newPdf.embedPages(originPDFPages, [
        { top: 790, bottom: 410, left: 53, right: 307 },
      ]);
    } else if (page0.getWidth() == 598 && page0.getHeight() == 845) {  //Comprobante AFIP
      origenComprobante = "AFIP"
      embededPages = await newPdf.embedPages(originPDFPages, [
        { top: 808, bottom: 385, left: 37, right: 560 },
      ]);
    } else {
      embededPages = await newPdf.embedPages(originPDFPages);
    }

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

      switch (origenComprobante) {
        case "AFIP":
          currentPage.drawText(
            `352-CONTRIBUCIONES OBRA SOCIAL`,
            {
              x: 241,
              y: 187,
              size: 9,
              color: rgb(0, 0, 0),
              lineHeight: 6,
              //opacity: 0.75,
            }
          );

          currentPage.drawText(
            `COMPROBANTE DE PAGO`,
            {
              x: 256,
              y: 418,
              size: 16,
              color: rgb(0, 0, 0),
              lineHeight: 6,
              //opacity: 0.75,
            }
          );
          currentPage.drawText(
            `Responsable: ${ApellidoNombreJ}`,
            {
              x: 33,
              y: 59,
              size: 10,
              color: rgb(0, 0, 0),
              lineHeight: 6,
              //opacity: 0.75,
            }
          );
          break;
        case "PAGO":
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
          break;
        default:
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

          break;
      }
    });

    return newPdf.save();
  }
}
