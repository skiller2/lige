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

export class ImpuestosAfipController extends BaseController {
    
  directory = process.env.PATH_MONOTRIBUTO || "tmp";
    
  async downloadComprobante( req : Request, res: Response, next: NextFunction){
    
    const year: string = req.params.anio
    const month: string = req.params.mes
    const cuit: string = req.params.CUIT
    const personalId: string = req.params.PersonalId

    const queryRunner = dataSource.createQueryRunner();

    const dirtmp = `${process.env.PATH_MONOTRIBUTO}/temp`;
    const tmpfilename = `${dirtmp}/${tmpName(dirtmp)}`;
    try {
      const [personalQuery] = await queryRunner.query(
        `SELECT DISTINCT
        per.PersonalId PersonalId, cuit2.PersonalCUITCUILCUIT AS CUIT, CONCAT(TRIM(per.PersonalApellido), ',', TRIM(per.PersonalNombre)) ApellidoNombre,
        ga.GrupoActividadId, ga.GrupoActividadNumero, ga.GrupoActividadDetalle,
        1
        FROM Personal per
        LEFT JOIN PersonalCUITCUIL cuit2 ON cuit2.PersonalId = per.PersonalId AND cuit2.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)
        LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31')
        LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId
      
        
        WHERE per.PersonalId = @0`,
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
        throw new ClientException(`El archivo no existe (${downloadPath}).`);

      const uint8Array = readFileSync(downloadPath);

      if (!personalID)
        throw new ClientException(`No se pudo encontrar la persona ${personalId}`);
      const ApellidoNombre = personalQuery.ApellidoNombre;
      const GrupoActividadDetalle = personalQuery.GrupoActividadDetalle;

      const buffer = await this.alterPDF(
        uint8Array,
        ApellidoNombre,
        GrupoActividadDetalle
      );
      writeFileSync(tmpfilename, buffer);
      res.download(tmpfilename, filename, (msg) => {
        unlinkSync(tmpfilename);
      });
    } catch (error) {
      return next(error)
    }
  }

  async alterPDF(
    bufferPDF: Uint8Array,
    ApellidoNombre: string,
    GrupoActividadDetalle: string
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

  

    TODO://Detectar el espacio vacío alrededor del comprobante de manera automática
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
    } else if (page0.getWidth() == 595.32001 && page0.getHeight() == 841.92004) {  //Comprobante Manual
      origenComprobante = "MANUAL"
      embededPages = await newPdf.embedPages(originPDFPages, [
        { top: 830, bottom: 450, left: 167, right: 430 },
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
            `Grupo: ${GrupoActividadDetalle}`,
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
        case "MANUAL":
          currentPage.drawText(
            `${ApellidoNombre}\n\nGrupo: ${GrupoActividadDetalle}`,
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
            `${ApellidoNombre}\n\nGrupo: ${GrupoActividadDetalle}`,
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