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
    
  async downloadComprobante( personalId: number, year: number, month: number,){
    const queryRunner = dataSource.createQueryRunner();

    const dirtmp = `${process.env.PATH_MONOTRIBUTO}/temp`;
    const tmpfilename = `${dirtmp}/${tmpName(dirtmp)}`;
    try {
      await queryRunner.startTransaction()
      const [comprobante] = await queryRunner.query(
        `SELECT des.PersonalId, cuit.PersonalCUITCUILCUIT cuit, des.PersonalOtroDescuentoMesesAplica,des.PersonalOtroDescuentoAnoAplica, CONCAT('/',des.PersonalOtroDescuentoAnoAplica,'/',des.PersonalOtroDescuentoAnoAplica,'-',FORMAT(des.PersonalOtroDescuentoMesesAplica,'00'),'-',cuit.PersonalCUITCUILCUIT,'-',des.PersonalId,'.pdf') path,
        CONCAT(TRIM(per.PersonalApellido), ',', TRIM(per.PersonalNombre)) ApellidoNombre, ga.GrupoActividadId, ga.GrupoActividadNumero, ga.GrupoActividadDetalle
        FROM PersonalOtroDescuento des 
        JOIN Personal per ON per.PersonalId = des.PersonalId
        JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = des.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = des.PersonalId)
        JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = des.PersonalId
        JOIN GrupoActividad ga ON ga.GrupoActividadId = gap.GrupoActividadId
        WHERE des.PersonalId = @0 AND des.PersonalOtroDescuentoDescuentoId = 31 AND des.PersonalOtroDescuentoAnoAplica = @1 AND des.PersonalOtroDescuentoMesesAplica = @2
        `,
        [personalId, year, month]
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

  async getLastPeriodosOfComprobantes( personalId: number, cant: number ) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      // await queryRunner.startTransaction()
      const respuesta = queryRunner.query(`
        SELECT TOP ${cant} des.PersonalId, des.PersonalOtroDescuentoMesesAplica mes, des.PersonalOtroDescuentoAnoAplica anio
        FROM PersonalOtroDescuento des 
        WHERE des.PersonalId = @0 AND des.PersonalOtroDescuentoDescuentoId = 31
        ORDER BY des.PersonalOtroDescuentoAnoAplica DESC, des.PersonalOtroDescuentoMesesAplica DESC`, 
        [personalId])
      // await queryRunner.commitTransaction()
      
      return respuesta
    } catch (error) {
      // this.rollbackTransaction(queryRunner)
      return error
    }
  }

}