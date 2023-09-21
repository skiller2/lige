import { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../../controller/baseController";
import { dataSource } from "../../data-source";
import { LiqBanco } from "../../schemas/ResponseJSON";
import { Filtro, Options } from "../../schemas/filtro";
import path from "path";
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
          fieldName: "per.PersonalApellidoNombre",
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
          searchHidden: true,
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
        }
    
      ];


  async getByLiquidacionesBanco(
    req: any,
    res: Response, next: NextFunction
  ) {

    try {

      const banco = await dataSource.query(
        `SELECT per.PersonalId as id,per.PersonalId, per.PersonalApellidoNombre, cuit.PersonalCUITCUILCUIT,perban.PersonalBancoCBU, banc.BancoDescripcion ,movpos.sum_importe
        FROM ERP_Produccion.dbo.Personal per
        JOIN ERP_Produccion.dbo.PersonalBanco AS perban ON perban.PersonalId = per.PersonalId
        JOIN ERP_Produccion.dbo.PersonalCUITCUIL AS cuit ON cuit.PersonalId = per.PersonalId
        JOIN ERP_Produccion.dbo.banco AS banc ON banc.BancoId = perban.PersonalBancoBancoId
        JOIN(SELECT liq.persona_id, SUM(liq.importe) sum_importe FROM lige.dbo.liqmamovimientos liq
        GROUP BY liq.persona_id HAVING SUM(liq.importe) > 0) AS movpos ON movpos.persona_id = per.PersonalId`)

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

  async getLiquidacionesBancoCols(req: Request, res: Response) {
    this.jsonRes(this.listaColumnas, res);
  }

  async handleDownloadComprobantesByFiltro(req: Request, res: Response, next:NextFunction) {
    try {
      const descuentoId = process.env.OTRO_DESCUENTO_ID;

      req.body.options.sort= [{ fieldName: 'ApellidoNombre',direction:'ASC' }] 

      const periodo = getPeriodoFromRequest(req);
      const options = getOptionsFromRequest(req);
      const cantxpag = req.body.cantxpag

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

      // const responsePDFBuffer = await this.PDFmergeFromFiles(files, filesPath, cantxpag);
      const responsePDFBuffer = new Uint8Array([17, -45.3]);
      const filename = `${periodo.year}-${formattedMonth}-filtrado.pdf`;

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
      FROM ERP_Produccion.dbo.Personal per
      JOIN ERP_Produccion.dbo.PersonalBanco AS perban ON perban.PersonalId = per.PersonalId
      JOIN ERP_Produccion.dbo.PersonalCUITCUIL AS cuit ON cuit.PersonalId = per.PersonalId
      JOIN ERP_Produccion.dbo.banco AS banc ON banc.BancoId = perban.PersonalBancoBancoId
      JOIN(SELECT liq.persona_id, SUM(liq.importe) sum_importe FROM lige.dbo.liqmamovimientos liq
      GROUP BY liq.persona_id HAVING SUM(liq.importe) > 0) AS movpos ON movpos.persona_id = per.PersonalId`)
    }


    // async PDFmergeFromFiles(
    //     files: {
    //       name: string;
    //       apellidoNombre: string;
    //     }[],
    //     filesPath: string,
    //     cantxpag: number
    //   ) {
    //     const newDocument = await PDFDocument.create();
    //     let currentFileBuffer: Buffer;
    //     let currentFilePDF: PDFDocument;
    //     let currentFilePDFPage: PDFPage;
    //     let lastPage: PDFPage;
    
    //     for (const [index, file] of files.entries()) {
    //       const locationIndex = (cantxpag==4)?index % 4 :0
    //       currentFileBuffer = null;
    //       currentFilePDF = null;
    //       currentFilePDFPage = null;
    
    //       if (locationIndex === 0) lastPage = newDocument.addPage(PageSizes.A4);
    
    //       const filePath = path.join(filesPath, file.name);
    //       const fileExists = existsSync(filePath);
    
    //       const pageWidth = lastPage.getWidth();
    //       const pageHeight = lastPage.getHeight();
    
    //       if (fileExists) {
    //         currentFileBuffer = readFileSync(filePath);
    //         currentFilePDF = await PDFDocument.load(currentFileBuffer);
    //         currentFilePDFPage = currentFilePDF.getPages()[0];
    
    //         let embeddedPage: PDFEmbeddedPage = null;
    //         let origenComprobante = "";
    
    //         if (
    //           currentFilePDFPage.getWidth() == 595.276 &&
    //           currentFilePDFPage.getHeight() == 841.89
    //         ) {
    //           origenComprobante = "PAGO"
    //           embeddedPage = await newDocument.embedPage(currentFilePDFPage, {
    //             top: 790,
    //             bottom: 410,
    //             left: 53,
    //             right: 307,
    //           });
    //         } else if (
    //           currentFilePDFPage.getWidth() == 598 &&
    //           currentFilePDFPage.getHeight() == 845
    //         ) {
    //           origenComprobante = "AFIP"
    //           embeddedPage = await newDocument.embedPage(currentFilePDFPage, {
    //             top: 808,
    //             bottom: 385,
    //             left: 37,
    //             right: 560,
    //           });
    //         } else {
    //           embeddedPage = await newDocument.embedPage(currentFilePDFPage);
    //         }
    
    //         const imgWidthScale = (pageWidth / 2 - 20) / embeddedPage.width;
    //         const imgHeightScale = (pageHeight / 2 - 20) / embeddedPage.height;
    //         const scalePage = embeddedPage.scale(
    //           Math.min(imgWidthScale, imgHeightScale)
    //         );
    
    //         const positionFromIndex: PDFPageDrawPageOptions = {
    //           x:
    //             locationIndex % 2 == 0
    //               ? Math.abs(pageWidth / 2 - scalePage.width) / 2
    //               : (Math.abs(pageWidth / 2 - scalePage.width) + pageWidth) / 2,
    //           y:
    //             locationIndex < 2
    //               ? (Math.abs(pageHeight / 2 - scalePage.height) + pageHeight) / 2
    //               : Math.abs(pageHeight / 2 - scalePage.height) / 2,
    //           width: scalePage.width,
    //           height: scalePage.height,
    //         };
    
    //         lastPage.drawPage(embeddedPage, { ...positionFromIndex });
    
    
    //         switch (origenComprobante) {
    //           case "AFIP":
    //             lastPage.drawText(
    //               `Responsable: ${file.apellidoNombreJ}`,
    //               {
    //                 x: positionFromIndex.x + 22,
    //                 y: positionFromIndex.y + 25,
    //                 size: 5,
    //                 color: rgb(0, 0, 0),
    //                 lineHeight: 6,
    //                 //opacity: 0.75,
    //               }
    //             );
    
    //             lastPage.drawText(
    //               `COMPROBANTE DE PAGO`,
    //               {
    //                 x: positionFromIndex.x + 125,
    //                 y: positionFromIndex.y + 215,
    //                 size: 8,
    //                 color: rgb(0, 0, 0),
    //                 lineHeight: 6,
    //                 //opacity: 0.75,
    //               }
    //             );
    
    
    //             lastPage.drawText(
    //               `352-CONTRIBUCIONES OBRA SOCIAL`,
    //               {
    //                 x: positionFromIndex.x + 123,
    //                 y: positionFromIndex.y + 95,
    //                 size: 4.5,
    //                 color: rgb(0, 0, 0),
    //                 lineHeight: 6,
    //                 //opacity: 0.75,
    //               }
    //             );
    
    //             break
    //           case "PAGO":
    //             lastPage.drawText(
    //               `${file.apellidoNombre}\n\nResponsable: ${file.apellidoNombreJ}`,
    //               {
    //                 x: positionFromIndex.x + 22,
    //                 y: positionFromIndex.y + 60,
    //                 size: 10,
    //                 color: rgb(0, 0, 0),
    //                 lineHeight: 6,
    //                 //opacity: 0.75,
    //               }
    //             );
    
    //             break
    //           default:
    //             lastPage.drawText(
    //               `${file.apellidoNombre}\n\nResponsable: ${file.apellidoNombreJ}`,
    //               {
    //                 x: positionFromIndex.x + 22,
    //                 y: positionFromIndex.y + 60,
    //                 size: 10,
    //                 color: rgb(0, 0, 0),
    //                 lineHeight: 6,
    //                 //opacity: 0.75,
    //               }
    //             );
    
    //             break
    //         }
    
    
    //         // newPage.drawText(`Comprobante: ${file.name}`);
    //       } else {
    //         const positionFromIndex: PDFPageDrawPageOptions = {
    //           x: locationIndex % 2 == 0 ? 20 : pageWidth / 2 + 20,
    //           y: locationIndex < 2 ? pageHeight / 2 + 20 : 20,
    //         };
    //         lastPage.drawText(`Falta el comprobante: ${file.name}`, {
    //           ...positionFromIndex,
    //           size: 15,
    //           rotate: degrees(65),
    //         });
    //       }
    //     }
    
    //     return newDocument.save();
    //   }
    


}




