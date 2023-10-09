import { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../../controller/baseController";
import { dataSource } from "../../data-source";
import { LiqBanco } from "../../schemas/ResponseJSON";
import { Filtro, Options } from "../../schemas/filtro";
//import xlsx, { WorkSheet } from 'node-xlsx';
 import Excel from  'exceljs';

import path from "path";
import {
  PDFDocument,
  PDFEmbeddedPage,
  PDFPage,
  PDFPageDrawPageOptions,
  PageSizes,
  degrees,
  rgb,
} from "pdf-lib";

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import {
  SendFileToDownload,
  getPeriodoFromRequest,
} from "./liquidaciones-banco.utils";
import {
  filtrosToSql,
  getOptionsFromRequest,
  isOptions,
  orderToSQL,
} from "../../impuestos-afip/filtros-utils/filtros";
import { tmpName } from "../../server";

export class LiquidacionesBancoController extends BaseController {

  directory = process.env.PATH_BANCO || "tmp";
  constructor() {
    super();
    if (!existsSync(this.directory)) {
      mkdirSync(this.directory, { recursive: true });
    }
  }

  listaColumnas: any[] = [
    {
      id: "PersonalId",
      name: "Personal Id",
      field: "PersonalId",
      fieldName: "per.PersonalId",
      type: "number",
      sortable: true,
      searchHidden: true,
      hidden: true
    },
    {
      name: "Apellido Nombre",
      type: "string",
      id: "PersonalApellidoNombre",
      field: "PersonalApellidoNombre",
      fieldName: "per.PersonalId",
      searchComponent: "inpurForPersonalSearch",
      searchType: "number",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "CUIT",
      type: "number",
      id: "PersonalCUITCUILCUIT",
      field: "PersonalCUITCUILCUIT",
      fieldName: "cuit.PersonalCUITCUILCUIT",
      sortable: true,
      hidden: false,
      searchHidden: false
    },
    {
      name: "CBU",
      type: "number",
      id: "PersonalBancoCBU",
      field: "PersonalBancoCBU",
      fieldName: "perban.PersonalBancoCBU",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "importe",
      type: "currency",
      id: "sum_importe",
      field: "sum_importe",
      fieldName: "movpos.sum_importe",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Banco",
      type: "string",
      id: "BancoDescripcion",
      field: "BancoDescripcion",
      fieldName: "banc.BancoDescripcion",
      sortable: true,
      hidden: false,
      searchHidden: false
    },
    {
      name: "BancoId",
      type: "number",
      id: "BancoId",
      field: "BancoId",
      fieldName: "banc.BancoId",
      sortable: true,
      hidden: true,
      searchHidden: true
    }


  ];

  listaColumnasAyuda: any[] = [
    {
      id: "PersonalId",
      name: "Personal Id",
      field: "PersonalId",
      fieldName: "per.PersonalId",
      type: "number",
      sortable: true,
      searchHidden: true,
      hidden: true
    },
    {
      name: "Apellido Nombre",
      type: "string",
      id: "PersonalApellidoNombre",
      field: "PersonalApellidoNombre",
      fieldName: "per.PersonalId",
      searchComponent: "inpurForPersonalSearch",
      searchType: "number",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "CUIT",
      type: "number",
      id: "PersonalCUITCUILCUIT",
      field: "PersonalCUITCUILCUIT",
      fieldName: "cuit.PersonalCUITCUILCUIT",
      sortable: true,
      hidden: false,
      searchHidden: false
    },
    {
      name: "CBU",
      type: "number",
      id: "PersonalBancoCBU",
      field: "PersonalBancoCBU",
      fieldName: "perban.PersonalBancoCBU",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "importe",
      type: "currency",
      id: "importe",
      field: "importe",
      fieldName: "ade.importe",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Banco",
      type: "string",
      id: "BancoDescripcion",
      field: "BancoDescripcion",
      fieldName: "banc.BancoDescripcion",
      sortable: true,
      hidden: false,
      searchHidden: false
    }

  ];

  async getBancoSaldo(anio: Number, mes: Number, filtros: any, sort: any) {
    const filterSql = filtrosToSql(filtros, this.listaColumnas);
    const orderBy = orderToSQL(sort)

    return dataSource.query(
      `SELECT per.PersonalId as id,per.PersonalId, per.PersonalApellidoNombre, cuit.PersonalCUITCUILCUIT,perban.PersonalBancoCBU, banc.BancoDescripcion ,movpos.sum_importe
        FROM Personal per
        JOIN(SELECT liq.persona_id, SUM(liq.importe * tipo.signo) sum_importe FROM lige.dbo.liqmamovimientos liq
        JOIN lige.dbo.liqcotipomovimiento tipo ON tipo.tipo_movimiento_id = liq.tipo_movimiento_id
        JOIN lige.dbo.liqmaperiodo per ON per.periodo_id = liq.periodo_id AND per.anio=@0 AND per.mes=@1

                GROUP BY liq.persona_id HAVING SUM(liq.importe* tipo.signo) > 0) AS movpos ON movpos.persona_id = per.PersonalId
        LEFT JOIN PersonalBanco AS perban ON perban.PersonalId = per.PersonalId AND perban.PersonalBancoId = ( SELECT MAX(perbanmax.PersonalBancoId) FROM PersonalBanco perbanmax WHERE perbanmax.PersonalId = per.PersonalId)
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 

        LEFT JOIN banco AS banc ON banc.BancoId = perban.PersonalBancoBancoId
        WHERE  (${filterSql}) 
        ${orderBy}
        `, [anio, mes])

  }

  async getByLiquidacionesBanco(
    req: any,
    res: Response, next: NextFunction
  ) {
    const filterSql = filtrosToSql(req.body.options.filtros, this.listaColumnas);
    const orderBy = orderToSQL(req.body.options.sort)
    const anio = Number(req.body.anio)
    const mes = Number(req.body.mes)

    try {
      const banco = await this.getBancoSaldo(anio, mes, req.body.options.filtros, req.body.options.sort)
      this.jsonRes(
        {
          total: banco.length,
          list: banco,
        },
        res
      );

    } catch (error) {
      return next(error)
    }
  }

  async getByLiquidacionesBancoAyudaAsistencial(
    req: any,
    res: Response, next: NextFunction
  ) {
    const filterSql = filtrosToSql(req.body.options.filtros, this.listaColumnas);
    const orderBy = orderToSQL(req.body.options.sort)
    const anio = Number(req.body.anio)
    const mes = Number(req.body.mes)

    try {

      const ayuda = await dataSource.query(
        `SELECT CONCAT(per.PersonalId,'-',ade.PersonalAdelantoId ) as id,per.PersonalId, per.PersonalApellidoNombre, cuit.PersonalCUITCUILCUIT,perban.PersonalBancoCBU, banc.BancoDescripcion ,
        ade.PersonalAdelantoMontoAutorizado AS importe, ade.PersonalAdelantoAplicaEl,
        tipo.tipo_movimiento_id, tipo.des_movimiento,
        ade.PersonalAdelantoLiquidoFinanzas,
            1
                FROM Personal per
                JOIN PersonalAdelanto ade ON ade.PersonalId = per.PersonalId AND ade.PersonalAdelantoAprobado='S' AND ISNULL(ade.PersonalAdelantoLiquidoFinanzas,0) =0
                JOIN lige.dbo.liqcotipomovimiento tipo ON tipo.tipo_movimiento_id = 1
                LEFT JOIN PersonalBanco AS perban ON perban.PersonalId = per.PersonalId AND perban.PersonalBancoId = ( SELECT MAX(perbanmax.PersonalBancoId) FROM PersonalBanco perbanmax WHERE perbanmax.PersonalId = per.PersonalId)
                LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
        
                LEFT JOIN banco AS banc ON banc.BancoId = perban.PersonalBancoBancoId
                
        WHERE (${filterSql}) 
        ${orderBy}
        `)

      this.jsonRes(
        {
          total: ayuda.length,
          list: ayuda,
        },
        res
      );

    } catch (error) {
      return next(error)
    }
  }

  async getLiquidacionesBancoCols(req: Request, res: Response) {
    this.jsonRes(this.listaColumnas, res);
  }

  async getLiquidacionesBancoColsAyuda(req: Request, res: Response) {
    this.jsonRes(this.listaColumnasAyuda, res);
  }

  async downloadArchivoBanco(req: Request, res: Response, next: NextFunction) {
    const directory = process.env.PATH_LIQUIDACIONES || "tmp";
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }

    try {
      const periodo = getPeriodoFromRequest(req);
      let options: any = getOptionsFromRequest(req);
      const BancoId = req.body.BancoId

      options.filtros.push({index: 'BancoId', condition: 'AND', operador: '=', valor: [BancoId]})


      const banco = await this.getBancoSaldo(periodo.year, periodo.month, req.body.options.filtros, req.body.options.sort)

/*
      const workSheetsFromBuffer = xlsx.parse(readFileSync(`${directory}/Patagonia_Sueldos.xls`),{raw:true,rawNumbers:true})
      const sheet0:WorkSheet = workSheetsFromBuffer[0] as WorkSheet;
      const sheet1:WorkSheet = workSheetsFromBuffer[1]as WorkSheet;
//console.log('sheet1',sheet1)

      for (let row of banco) {
//              console.log('row',row)        
      }
      const buffer = xlsx.build([sheet0,sheet1])

      writeFileSync(tmpfilename, buffer);

*/
      
      const formattedMonth = String(periodo.month).padStart(2, "0");
      const fileName = `${periodo.year}-${formattedMonth}-liquidacion.xlsx`;
      const tmpfilename = `${directory}/${tmpName(directory)}`;
      
  	  const  wb = new Excel.Workbook()
      const wb1=  await wb.xlsx.readFile(`${directory}/Patagonia_Sueldos.xls`,)
      const worksheet = wb1.worksheets[0];
//      var row = worksheet.getRow(5);
//        row.getCell(1).value = 5; // A5's value set to 5
//        row.commit();
console.log('wb1',wb1)
console.log('worksheet',worksheet)
//      workbook.properties.date1904 = true;

      wb1.properties.date1904 = true

      await wb1.xlsx.writeFile(tmpfilename)  
      res.download(tmpfilename, fileName, (msg) => {
        unlinkSync(tmpfilename);
      });
    

    } catch (error) {
      return next(error)
    }
  }


  async handleDownloadComprobantesByFiltro(req: Request, res: Response, next: NextFunction) {
    try {

      const descuentoId = process.env.OTRO_DESCUENTO_ID;

      req.body.options.sort = [{ fieldName: 'ApellidoNombre', direction: 'ASC' }]

      const periodo = getPeriodoFromRequest(req);
      const options = getOptionsFromRequest(req);
      const cantxpag = req.body.cantxpag;
      const listdowload = req.body.listdowload;

      console.log("listdowload", listdowload)

      const formattedMonth = String(periodo.month).padStart(2, "0");
      const filesPath = path.join(this.directory, String(periodo.year));

      const liquidaciones: LiqBanco[] = await this.BancoByPeriodo({
        anio: String(periodo.year),
        mes: String(periodo.month),
        options,

      });
      const files = liquidaciones
        .filter(
          (liquidacion) => liquidacion.PersonalId !== null
        )
        .map((liquidacion, index) => {
          return {
            name: `${periodo.year}-${formattedMonth}-${liquidacion.CUIT}-${liquidacion.PersonalId}.pdf`,
            apellidoNombre: liquidacion.ApellidoNombre,
          };
        });

      const responsePDFBuffer = await this.PDFmergeFromFiles(files, filesPath, cantxpag);
      //const responsePDFBuffer = new Uint8Array([17, -45.3]);
      const filename = `${periodo.year}-${formattedMonth}-liquidacion.pdf`;

      SendFileToDownload(res, filename, responsePDFBuffer);
    } catch (error) {
      return next(error)
    }
  }


  async BancoByPeriodo(params: {
    anio: string;
    mes: string;
    options: Options;
  }) {

    return dataSource.query(`SELECT per.PersonalId as id,per.PersonalId, per.PersonalApellidoNombre, cuit.PersonalCUITCUILCUIT,perban.PersonalBancoCBU, banc.BancoDescripcion ,movpos.sum_importe
      FROM Personal per
      JOIN PersonalBanco AS perban ON perban.PersonalId = per.PersonalId
      JOIN PersonalCUITCUIL AS cuit ON cuit.PersonalId = per.PersonalId
      JOIN banco AS banc ON banc.BancoId = perban.PersonalBancoBancoId
      JOIN(SELECT liq.persona_id, SUM(liq.importe) sum_importe FROM lige.dbo.liqmamovimientos liq
      GROUP BY liq.persona_id HAVING SUM(liq.importe) > 0) AS movpos ON movpos.persona_id = per.PersonalId`)
  }


  async PDFmergeFromFiles(
    files: {
      name: string;
      apellidoNombre: string;
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
      const locationIndex = (cantxpag == 4) ? index % 4 : 0
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
          case "PAGO":
            lastPage.drawText(
              `${file.apellidoNombre}\n\nResponsable: ${file.apellidoNombre}`,
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
              `${file.apellidoNombre}\n\nResponsable: ${file.apellidoNombre}`,
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



}




