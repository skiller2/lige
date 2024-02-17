import { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";

import { Utils } from "../liquidaciones/liquidaciones.utils";
import { promises as fsPromises } from 'fs';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import path from 'path';
import { mkdirSync, existsSync } from "fs";
import puppeteer, { Browser } from 'puppeteer';
import { NumeroALetras, setSingular, setPlural, setCentsPlural, setCentsSingular } from "numeros_a_palabras/numero_to_word"
import {
  SendFileToDownload,
  getPeriodoFromRequest,
} from "../liquidaciones/liquidaciones-banco/liquidaciones-banco.utils";

import { QueryRunner } from "typeorm";

export class RecibosController extends BaseController {
  directoryRecibo = process.env.PATH_RECIBO || "tmp";
  constructor() {
    super();
    if (!existsSync(this.directoryRecibo)) {
      mkdirSync(this.directoryRecibo, { recursive: true });
    }
  }

  async cleanDirectories(queryRunner: QueryRunner, directorPath: string, periodo: number) {
    try {
      console.log("limpiando directorio")
      if (fs.existsSync(directorPath)) {
        const archivos = fs.readdirSync(directorPath);
        archivos.forEach(archivo => {
          const rutaArchivo = path.join(directorPath, archivo);
          fs.unlinkSync(rutaArchivo);
        });
      }

      await this.deleteDirectories(queryRunner, periodo)

    } catch (error) {
      console.error("Error al limpiar el directorio:", error);
    }
  }

  async deleteDirectories(queryRunner: QueryRunner, periodo: number) {

    queryRunner.query(`delete from lige.dbo.docgeneral where periodo=@0 ; `, [periodo])

  }

  async generaRecibos(req: Request, res: Response, next: NextFunction) {

    let usuario = res.locals.userName
    let ip = this.getRemoteAddress(req)
    const queryRunner = dataSource.createQueryRunner();
    try {

      const periodo = getPeriodoFromRequest(req);
      let fechaActual = new Date();
      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, periodo.year, periodo.month, usuario, ip)

      const movimientosPendientes = await this.getUsuariosLiquidacion(queryRunner, periodo_id, periodo.year, periodo.month)

      var directorPath = this.directoryRecibo + '/' + String(periodo.year) + String(periodo.month).padStart(2, '0') + '/' + periodo_id
      if (!existsSync(directorPath)) {
        mkdirSync(directorPath, { recursive: true });
      }
      await this.cleanDirectories(queryRunner, directorPath, periodo_id)

      const basePath = (process.env.PATH_ASSETS) ? process.env.PATH_ASSETS : './assets'

      const imgPath = `${basePath}/icons/icon-lince-96x96.png`
      const imgBuffer = await fsPromises.readFile(imgPath);
      const imgBase64 = imgBuffer.toString('base64');

      const imgPathinaes = `${basePath}/icons/inaes.png`
      const imgBufferinaes = await fsPromises.readFile(imgPathinaes);
      const imgBase64inaes = imgBufferinaes.toString('base64');


      const htmlFilePath = `${basePath}/html/inaes.html`;
      const headerFilePath = `${basePath}/html/inaes-header.html`;
      const footerfilePath = `${basePath}/html/inaes-footer.html`;

      let headerContent = await fsPromises.readFile(headerFilePath, 'utf-8');
      let htmlContent = await fsPromises.readFile(htmlFilePath, 'utf-8');
      let footerContent = await fsPromises.readFile(footerfilePath, 'utf-8');

      headerContent = headerContent.replace(/\${imgBase64}/g, imgBase64);
      footerContent = footerContent.replace(/\${imgBase64inaes}/g, imgBase64inaes);

      htmlContent = htmlContent.replace(/\${anio}/g, periodo.year.toString());
      htmlContent = htmlContent.replace(/\${mes}/g, periodo.month.toString());
      htmlContent = htmlContent.replace(/\${fechaFormateada}/g, this.dateFormatter.format(fechaActual));
      const htmlContentPre = htmlContent;

      const browser = await puppeteer.launch({ headless: 'new' })

      for (const movimiento of movimientosPendientes) {
        const persona_id = movimiento.PersonalId
        const filesPath = directorPath + '/' + persona_id + '-' + String(periodo.month) + "-" + String(periodo.year) + ".pdf"
        const nombre_archivo = persona_id + '-' + String(periodo.month) + "-" + String(periodo.year) + ".pdf"
        const doc_id = await this.getProxNumero(queryRunner, `docgeneral`, usuario, ip)

        await this.setUsuariosLiquidacionDocGeneral(
          queryRunner,
          doc_id,
          periodo_id,
          fechaActual,
          persona_id,
          0,
          nombre_archivo,
          filesPath,
          usuario,
          ip,
          fechaActual,
          "REC"

        )

        const PersonalNombre = movimiento.PersonalNombre
        const Cuit = movimiento.PersonalCUITCUILCUIT
        const Domicilio = (movimiento.DomicilioCompleto) ? movimiento.DomicilioCompleto : 'Sin especificar'
        const Asociado = movimiento.PersonalNroLegajo
        const Grupo = (movimiento.GrupoActividadDetalle) ? movimiento.GrupoActividadDetalle : 'Sin asignar' 

        await this.createPdf(queryRunner, filesPath, persona_id, doc_id, PersonalNombre, Cuit, Domicilio, Asociado,
          Grupo, periodo_id, browser, htmlContentPre, headerContent, footerContent)

      }
      await browser.close();

      this.jsonRes([], res, `Se generaron ${movimientosPendientes.length} recibos`);

    } catch (error) {

      this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      //   await queryRunner.release();
    }


  }


  convertirNumeroALetras(numero: any) {

    setSingular('peso')
    setPlural('pesos')
    setCentsPlural('centavo')
    setCentsSingular('centavos')
    return NumeroALetras(numero).toUpperCase()
  }

  async createPdf(queryRunner: QueryRunner,
    filesPath: string,
    persona_id: number,
    doc_id: number,
    PersonaNombre: string,
    Cuit: string,
    Domicilio: string,
    Asociado: number,
    Grupo:string,
    periodo_id: number,
    browser: Browser,
    htmlContent: string,
    headerContent: string,
    footerContent: string,
  ) {

    htmlContent = htmlContent.replace(/\${doc_id}/g, doc_id.toString());
    htmlContent = htmlContent.replace(/\${PersonaNombre}/g, PersonaNombre);
    htmlContent = htmlContent.replace(/\${Cuit}/g, Cuit.toString());
    htmlContent = htmlContent.replace(/\${Domicilio}/g, Domicilio);


    const liquidacionInfo = await this.getUsuariosLiquidacionMovimientos(queryRunner, periodo_id, persona_id)
    let neto = 0
    let retribucion = 0
    let retenciones = 0
    let htmlEgreso = ''
    let htmlIngreso = ''
    let htmlDeposito = ''

    for (const liquidacionElement of liquidacionInfo) {

      switch (liquidacionElement.indicador) {
        case "R":
          htmlEgreso += `<tr><td>${liquidacionElement.des_movimiento} - ${liquidacionElement.detalle}</td><td>${this.currencyPipe.format(liquidacionElement.SumaImporte)}</td></tr>`
          retribucion += liquidacionElement.SumaImporte
          break;
        case "D":
          htmlDeposito += `<tr><td>${liquidacionElement.detalle}</td><td>${this.currencyPipe.format(liquidacionElement.SumaImporte)}</td></tr>`
          break
        case "I":
          htmlIngreso += `<tr><td>${liquidacionElement.detalle}</td><td>${this.currencyPipe.format(liquidacionElement.SumaImporte)}</td></tr>`
          retenciones += liquidacionElement.SumaImporte
          break
        default:
          break;
      }
    }

    if (retribucion > 0)
      htmlEgreso += `<tr class="subtotal"><td>Subtotal:</td><td>${this.currencyPipe.format(retribucion)}</td></tr>`
    if (retenciones > 0)
      htmlIngreso += `<tr class="subtotal"><td>Subtotal:</td><td>${this.currencyPipe.format(retenciones)}</td></tr>`


    neto = retenciones - retribucion

    htmlContent = htmlContent.replace(/\${retribucion}/g, this.currencyPipe.format(retribucion));
    htmlContent = htmlContent.replace(/\${retenciones}/g, this.currencyPipe.format(retenciones));

    htmlContent = htmlContent.replace(/\${textegreso}/g, htmlEgreso);
    htmlContent = htmlContent.replace(/\${textingreso}/g, htmlIngreso);
    htmlContent = htmlContent.replace(/\${textdeposito}/g, htmlDeposito);

    htmlContent = htmlContent.replace(/\${textneto}/g, this.convertirNumeroALetras(neto))
    htmlContent = htmlContent.replace(/\${neto}/g, this.currencyPipe.format(neto));
    htmlContent = htmlContent.replace(/\${asociado}/g, Asociado.toString());
    htmlContent = htmlContent.replace(/\${grupo}/g, Grupo);

    const page = await browser.newPage();

//    await fsPromises.writeFile(filesPath + '.html', htmlContent)
    await page.setContent(htmlContent);
    await page.pdf({
      path: filesPath,
      margin: { top: '150px', right: '50px', bottom: '100px', left: '50px' },
      printBackground: true,
      format: 'A4',
      displayHeaderFooter: true,
      headerTemplate: headerContent,
      footerTemplate: footerContent,
    });

    await page.close()
  }




  async getUsuariosLiquidacion(queryRunner: QueryRunner, periodo_id: Number, anio:number,mes:number) {

    return queryRunner.query(`SELECT
    per.PersonalId, per.PersonalNroLegajo, 
    CONCAT(TRIM(per.PersonalNombre), ' ', TRIM(per.PersonalApellido)) AS PersonalNombre,
  
    cuit.PersonalCUITCUILCUIT,
    TRIM(CONCAT(
      TRIM(dom.PersonalDomicilioDomCalle), ' ',
      TRIM(dom.PersonalDomicilioDomNro), ' ',
      TRIM(dom.PersonalDomicilioDomPiso), ' ',
      TRIM(dom.PersonalDomicilioDomDpto)
    )) AS DomicilioCompleto,
   act.GrupoActividadNumero,
   act.GrupoActividadDetalle,
    1
    
    FROM Personal per
    LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
    LEFT JOIN PersonalDomicilio AS dom ON dom.PersonalId = per.PersonalId AND dom.PersonalDomicilioActual = 1 AND dom.PersonalDomicilioId = ( SELECT MAX(dommax.PersonalDomicilioId) FROM PersonalDomicilio dommax WHERE dommax.PersonalId = per.PersonalId AND dom.PersonalDomicilioActual = 1)
    
    
    LEFT JOIN (SELECT grp.GrupoActividadPersonalPersonalId, MAX(grp.GrupoActividadPersonalDesde) AS GrupoActividadPersonalDesde, MAX(ISNULL(grp.GrupoActividadPersonalHasta,'9999-12-31')) GrupoActividadPersonalHasta FROM GrupoActividadPersonal AS grp WHERE EOMONTH(DATEFROMPARTS(@1,@2,1)) > grp.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(grp.GrupoActividadPersonalHasta, '9999-12-31') GROUP BY grp.GrupoActividadPersonalPersonalId) as grupodesde ON grupodesde.GrupoActividadPersonalPersonalId = per.PersonalId
    LEFT JOIN GrupoActividadPersonal grupo ON grupo.GrupoActividadPersonalPersonalId = per.PersonalId AND grupo.GrupoActividadPersonalDesde = grupodesde.GrupoActividadPersonalDesde AND ISNULL(grupo.GrupoActividadPersonalHasta,'9999-12-31') = grupodesde.GrupoActividadPersonalHasta 
        
    
    LEFT JOIN GrupoActividad act ON act.GrupoActividadId= grupo.GrupoActividadId
    WHERE per.PersonalId IN ( 
  
      SELECT DISTINCT liq.persona_id
      FROM lige.dbo.liqmamovimientos liq
      WHERE liq.tipocuenta_id = 'G' AND liq.periodo_id = @0
    )
    ORDER BY per.PersonalId ASC`, [periodo_id,anio,mes])
  }


  async getUsuariosLiquidacionMovimientos(queryRunner: QueryRunner, periodo_id: Number, user_id: Number) {

    return queryRunner.query(`SELECT 
    liq.persona_id, 
    liq.tipo_movimiento_id, 
    tip.des_movimiento, 
    liq.detalle,
    SUM(liq.importe) AS SumaImporte, 
    tip.indicador_recibo AS indicador
    FROM  lige.dbo.liqmamovimientos AS liq
    JOIN  lige.dbo.liqcotipomovimiento AS tip ON tip.tipo_movimiento_id = liq.tipo_movimiento_id
    WHERE  liq.periodo_id = @0 AND  liq.tipocuenta_id = 'G' AND  liq.persona_id = @1
    GROUP BY 
    liq.persona_id, 
    liq.detalle,
    liq.tipo_movimiento_id, 
    tip.des_movimiento, 
    tip.indicador_recibo;`, [periodo_id, user_id])

  }


  async setUsuariosLiquidacionDocGeneral(
    queryRunner: any,
    doc_id: number,
    periodo: number,
    fecha: Date,
    persona_id: number,
    objetivo_id: number,
    nombre_archivo: string,
    path: string,
    usuario: string,
    ip: string,
    audfecha: Date,
    doctipo_id: string

  ) {

    return queryRunner.query(`INSERT INTO lige.dbo.docgeneral ("doc_id", "periodo", "fecha", "persona_id", "objetivo_id", "path", "nombre_archivo", "aud_usuario_ins", "aud_ip_ins", "aud_fecha_ins", "aud_usuario_mod", "aud_ip_mod", "aud_fecha_mod", "doctipo_id")
    VALUES
    (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13);`,
      [
        doc_id,
        periodo,
        fecha,
        persona_id,
        objetivo_id,
        path,
        nombre_archivo,
        usuario, ip, audfecha,
        usuario, ip, audfecha,
        doctipo_id
      ])

  }

  async downloadComprobantesByPeriodo(
    year: string,
    month: string,
    personalIdRel: string,
    res: Response,
    req: Request,
    next: NextFunction
  ) {
    let usuario = res.locals.userName
    let ip = this.getRemoteAddress(req)
    const queryRunner = dataSource.createQueryRunner();


    try {
      let fechaActual = new Date();
      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, parseInt(year), parseInt(month), usuario, ip);
      const gettmpfilename = await this.getRutaFile(queryRunner, periodo_id, parseInt(personalIdRel))
      const tmpfilename = gettmpfilename[0]?.path;
      const responsePDFBuffer = await this.obtenerPDFBuffer(tmpfilename);

      await fs.promises.writeFile(tmpfilename, responsePDFBuffer);
      res.download(tmpfilename, gettmpfilename[0]?.nombre_archivo, async (error) => {
        if (error) {
          console.error('Error al descargar el archivo:', error);
          return next(error)
        }
      });
    } catch (error) {
      return next(error)
    }
  }


  async getRutaFile(queryRunner: QueryRunner, periodo_id: number, personalIdRel: number) {

    return queryRunner.query(`SELECT * from lige.dbo.docgeneral 
  WHERE periodo = @0 
  AND persona_id = @1`, [periodo_id, personalIdRel])
  }


  async obtenerPDFBuffer(tmpfilename: string) {
    const buffer = fs.readFileSync(tmpfilename);
    return buffer;
  }


  async bindPdf(
    year: string,
    month: string,
    arrayPeronalId: string,
    res: Response,
    req: Request,
    next: NextFunction) {

    let usuario = res.locals.userName
    let ip = this.getRemoteAddress(req)
    const queryRunner = dataSource.createQueryRunner();

    let perosonalIds = JSON.parse(arrayPeronalId)
    perosonalIds = arrayPeronalId.split(",")




    try {
      let fechaActual = new Date();
      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, parseInt(year), parseInt(month), usuario, ip);

      const pathFile = await this.getparthFile(queryRunner, periodo_id, perosonalIds)
      console.log("pathFile", pathFile)
      const rutaDirectorio = this.directoryRecibo + '/' + String(year) + String(month).padStart(2, '0') + '/' + periodo_id;
      const pdfBytes = await this.joinPDFsOnPath(rutaDirectorio);
      const rutaPDF = path.join(this.directoryRecibo, `pdf_${year}${month}.pdf`);


      // fs.writeFileSync(rutaPDF, pdfBytes);
      // console.log('PDF guardado en la ruta especificada:', rutaPDF);
      // res.download(rutaPDF, `pdf_${year}${month}.pdf`, async (err) => {
      //     if (err) {
      //         console.error('Error al descargar el PDF:', err);
      //         return next(err);
      //     } else {
      //         console.log('PDF descargado con éxito');
      //         fs.unlinkSync(rutaPDF);
      //         console.log('PDF eliminado del servidor');
      //     }
      // });
    } catch (error) {
      return next(error)
    }

  }

  async getparthFile(queryRunner: QueryRunner, periodo_id: number, perosonalIds: any) {
    const personalIdsString = perosonalIds.join(', ');
    return queryRunner.query(`SELECT * FROM lige.dbo.docgeneral WHERE periodo = @0 AND personal_id IN (${personalIdsString})`, [periodo_id])
  }

  async joinPDFsOnPath(rutaDirectorio) {
    const archivosPDF = fs.readdirSync(rutaDirectorio).filter(archivo => archivo.toLowerCase().endsWith('.pdf'));

    const pdfFinal = await PDFDocument.create();

    for (const archivo of archivosPDF) {
      const contenidoPDF = fs.readFileSync(path.join(rutaDirectorio, archivo));
      const pdf = await PDFDocument.load(contenidoPDF);
      const paginas = pdf.getPages();

      for (const pagina of paginas) {
        const nuevaPagina = await pdfFinal.copyPages(pdf, [pdf.getPages().indexOf(pagina)]);
        pdfFinal.addPage(nuevaPagina[0]);
      }
    }

    const pdfBytes = await pdfFinal.save();
    return pdfBytes;
  }


}




