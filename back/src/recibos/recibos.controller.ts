import { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";

import { Utils } from "../liquidaciones/liquidaciones.utils";
import { promises as fsPromises } from 'fs';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import path from 'path';
import { mkdirSync, existsSync } from "fs";
import puppeteer, { Browser, Page } from 'puppeteer';
import { NumeroALetras, setSingular, setPlural, setCentsPlural, setCentsSingular } from "numeros_a_palabras/numero_to_word"
import {
  SendFileToDownload,
  getPeriodoFromRequest,
} from "../liquidaciones/liquidaciones-banco/liquidaciones-banco.utils";
//import moment from 'moment';
import { QueryRunner } from "typeorm";

export class RecibosController extends BaseController {
  directoryRecibo = process.env.PATH_RECIBO || "tmp";
  constructor() {
    super();
    if (!existsSync(this.directoryRecibo)) {
      mkdirSync(this.directoryRecibo, { recursive: true });
    }
  }

  async cleanDirectories(queryRunner: QueryRunner, directorPath: string, periodo: number, isUnique:any, directorPathUnique:string,idrecibo:number) {
    try {

      if(isUnique){
        fs.unlinkSync(directorPathUnique);
      }else{
        console.log("limpiando directorio")
        if (fs.existsSync(directorPath)) {
          const archivos = fs.readdirSync(directorPath);
          archivos.forEach(archivo => {
            const rutaArchivo = path.join(directorPath, archivo);
            fs.unlinkSync(rutaArchivo);
          });
        }
      }
      await this.deleteDirectories(queryRunner, periodo,isUnique,idrecibo)
    } catch (error) {
      console.error("Error al limpiar el directorio:", error);
    }
  }

  async deleteDirectories(queryRunner: QueryRunner, periodo: number, isUnique:any, idrecibo:number) {

    if(isUnique){
      await queryRunner.query(`delete from lige.dbo.docgeneral where idrecibo=@0 ; `, [idrecibo])
    }else{
      await queryRunner.query(`delete from lige.dbo.docgeneral where periodo=@0 ; `, [periodo])
    }

  }

  async generaRecibos(req: Request, res: Response, next: NextFunction) {

    let usuario = res.locals.userName
    let ip = this.getRemoteAddress(req)
    let isUnique = req.body.isUnique
    const personalId = req.body?.personalId
    const queryRunner = dataSource.createQueryRunner()
    let persona_id = 0
      //estas  variables se usan solo si el recibo previamente ya existe 
    let fechaRecibo:Date
    let docgeneral:number
    let idrecibo:number
    let directorPathUnique = ""
    const fechaActual = new Date();

    try {

      const periodo = getPeriodoFromRequest(req);
      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, periodo.year, periodo.month, usuario, ip)
      
      if (!isUnique) {

        // codigo para cuenado es recibo general
        const getRecibosGenerados = await this.getRecibosGenerados(queryRunner, periodo_id)
        if (getRecibosGenerados[0].ind_recibos_generados == 1)
          throw new ClientException(`Los recibos para este periodo ya se generaron`)
        fechaRecibo = fechaActual
      } else {

        // codigo para cuenado es unico recibo bebe validar que el recibo exista para poder regenerarlo, caso contrario arrojar error
        const existRecibo = await this.existReciboId(queryRunner, fechaActual, periodo_id, personalId);

        if (existRecibo.length <=  0)
          throw new ClientException(`Recibo no existe para el periodo seleccionado`)

        fechaRecibo = existRecibo[0].fecha;
        idrecibo = existRecibo[0].idrecibo
        docgeneral = existRecibo[0].docgeneral
        directorPathUnique = existRecibo[0].path
      }

      const movimientosPendientes = await this.getUsuariosLiquidacion(queryRunner, periodo_id, periodo.year, periodo.month, personalId)

      var directorPath = this.directoryRecibo + '/' + String(periodo.year) + String(periodo.month).padStart(2, '0') + '/' + periodo_id
      if (!existsSync(directorPath)) {
        mkdirSync(directorPath, { recursive: true });
      }

      await this.cleanDirectories(queryRunner, directorPath, periodo_id, isUnique, directorPathUnique,idrecibo)

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

      headerContent = headerContent.replace(/\${anio}/g, periodo.year.toString());
      headerContent = headerContent.replace(/\${mes}/g, periodo.month.toString());



      headerContent = headerContent.replace(/\${fechaFormateada}/g, this.dateFormatter.format(fechaRecibo));
      const htmlContentPre = htmlContent;

      const browser = await puppeteer.launch({ headless: 'new' })
      const page = await browser.newPage();

      for (const movimiento of movimientosPendientes) {
        persona_id = movimiento.PersonalId
        const filesPath = directorPath + '/' + persona_id + '-' + String(periodo.month) + "-" + String(periodo.year) + ".pdf"
        const nombre_archivo = persona_id + '-' + String(periodo.month) + "-" + String(periodo.year) + ".pdf"
        docgeneral = await this.getProxNumero(queryRunner, `docgeneral`, usuario, ip)

        if(!isUnique)
          idrecibo = await this.getProxNumero(queryRunner, `idrecibo`, usuario, ip)
        



           await this.setUsuariosLiquidacionDocGeneral(
            queryRunner,
            docgeneral,
            periodo_id,
            fechaRecibo,
            persona_id,
            0,
            nombre_archivo,
            filesPath,
            usuario,
            ip,
            fechaActual,
            "REC",
            idrecibo
  
          )
        

       

        const PersonalNombre = movimiento.PersonalNombre
        const Cuit = movimiento.PersonalCUITCUILCUIT
        const Domicilio = (movimiento.DomicilioCompleto) ? movimiento.DomicilioCompleto : 'Sin especificar'
        const Asociado = (movimiento.PersonalNroLegajo) ? movimiento.PersonalNroLegajo.toString() : 'Pendiente'
        const Grupo = (movimiento.GrupoActividadDetalle) ? movimiento.GrupoActividadDetalle : 'Sin asignar'



        await this.createPdf(queryRunner, filesPath, persona_id, idrecibo, PersonalNombre, Cuit, Domicilio, Asociado,
          Grupo, periodo_id, page, htmlContentPre, headerContent, footerContent)


      }

      if (!isUnique)
        await this.updateTablePeriodo(queryRunner, periodo_id, usuario, ip, fechaActual)

      await page.close()
      await browser.close();

      this.jsonRes([], res, `Se generaron ${movimientosPendientes.length} recibos`);

    } catch (error) {

      this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      //   await queryRunner.release();
    }

  }

  async updateTablePeriodo(queryRunner: QueryRunner, periodo_id: number, usuario: string, ip: string, audfecha: Date,) {
    return queryRunner.query(
      `UPDATE lige.dbo.liqmaperiodo
         SET ind_recibos_generados = 1,aud_usuario_mod = @1,aud_ip_mod = @2,aud_fecha_mod = @3
         WHERE periodo_id = @0`,
      [periodo_id, usuario, ip, audfecha]
    );
  }

  async getRecibosGenerados(queryRunner: QueryRunner, periodo_id: number) {
    return queryRunner.query(
      `SELECT ind_recibos_generados FROM lige.dbo.liqmaperiodo WHERE periodo_id = @0`,
      [periodo_id]
    );
  }


  existReciboId(queryRunner: QueryRunner, fechaActual: Date, periodo_id: number, personalId: number) {
    return queryRunner.query(`SELECT * from lige.dbo.docgeneral WHERE periodo= @0 AND persona_id = @1`, [periodo_id, personalId])
  }


  convertirNumeroALetras(numero: any) {

    setSingular('peso');
    setPlural('pesos');
    setCentsPlural('centavo');
    setCentsSingular('centavos');

    if (numero < 0) {
      return `MENOS ${NumeroALetras(Math.abs(numero)).toUpperCase()}`;
    } else {
      return NumeroALetras(numero).toUpperCase();
    }
  }

  async createPdf(queryRunner: QueryRunner,
    filesPath: string,
    persona_id: number,
    idrecibo: number,
    PersonaNombre: string,
    Cuit: string,
    Domicilio: string,
    Asociado: string,
    Grupo: string,
    periodo_id: number,
    page: Page,
    htmlContent: string,
    headerContent: string,
    footerContent: string,
  ) {

    headerContent = headerContent.replace(/\${idrecibo}/g, idrecibo.toString());
    htmlContent = htmlContent.replace(/\${PersonaNombre}/g, PersonaNombre);
    htmlContent = htmlContent.replace(/\${Cuit}/g, Cuit.toString());
    htmlContent = htmlContent.replace(/\${Domicilio}/g, Domicilio);


    const liquidacionInfo = await this.getUsuariosLiquidacionMovimientos(queryRunner, periodo_id, persona_id)
    let neto = 0
    let retribucion = 0
    let retenciones = 0
    let adelanto = 0
    let htmlEgreso = ''
    let htmlIngreso = ''
    let htmlDeposito = ''
    let htmlAdelanto = ''

    for (const liquidacionElement of liquidacionInfo) {

      switch (liquidacionElement.indicador) {
        case "A":
          htmlAdelanto += `<tr><td>${liquidacionElement.des_movimiento} - ${liquidacionElement.detalle}</td><td>${this.currencyPipe.format(liquidacionElement.SumaImporte)}</td></tr>`
          adelanto += liquidacionElement.SumaImporte
          break;
        case "R":
          htmlEgreso += `<tr><td>${liquidacionElement.des_movimiento} - ${liquidacionElement.detalle}</td><td>${this.currencyPipe.format(liquidacionElement.SumaImporte)}</td></tr>`
          retribucion += liquidacionElement.SumaImporte
          break;
        case "D":
          htmlDeposito += `<tr><td>${liquidacionElement.detalle}</td><td>${this.currencyPipe.format(liquidacionElement.SumaImporte)}</td></tr>`
          break
        case "I":
          htmlIngreso += `<tr><td>${liquidacionElement.detalle} ${(liquidacionElement.ClienteId) ? liquidacionElement.ClienteId + '/' + liquidacionElement.ClienteElementoDependienteId : ''}</td><td>${this.currencyPipe.format(liquidacionElement.SumaImporte)}</td></tr>`
          retenciones += liquidacionElement.SumaImporte
          break
        default:
          break;
      }
    }

    if (adelanto > 0)
      htmlAdelanto += `<tr class="subtotal"><td>Subtotal:</td><td>${this.currencyPipe.format(adelanto)}</td></tr>`
    if (retribucion > 0)
      htmlEgreso += `<tr class="subtotal"><td>Subtotal:</td><td>${this.currencyPipe.format(retribucion)}</td></tr>`
    if (retenciones > 0)
      htmlIngreso += `<tr class="subtotal"><td>Subtotal:</td><td>${this.currencyPipe.format(retenciones)}</td></tr>`

    neto = adelanto + retenciones - retribucion

    htmlContent = htmlContent.replace(/\${retribucion}/g, this.currencyPipe.format(retribucion));
    htmlContent = htmlContent.replace(/\${retenciones}/g, this.currencyPipe.format(retenciones));
    htmlContent = htmlContent.replace(/\${adelanto}/g, this.currencyPipe.format(adelanto));

    htmlContent = htmlContent.replace(/\${textegreso}/g, htmlEgreso);
    htmlContent = htmlContent.replace(/\${textingreso}/g, htmlIngreso);
    htmlContent = htmlContent.replace(/\${textdeposito}/g, htmlDeposito);
    htmlContent = htmlContent.replace(/\${textadelanto}/g, htmlAdelanto);

    htmlContent = htmlContent.replace(/\${textneto}/g, this.convertirNumeroALetras(neto))
    htmlContent = htmlContent.replace(/\${neto}/g, this.currencyPipe.format(neto));
    htmlContent = htmlContent.replace(/\${asociado}/g, Asociado);
    htmlContent = htmlContent.replace(/\${grupo}/g, Grupo);

    await page.setContent(htmlContent);
    await page.pdf({
      path: filesPath,
      margin: { top: '140px', right: '50px', bottom: '100px', left: '50px' },
      printBackground: true,
      format: 'A4',
      displayHeaderFooter: true,
      headerTemplate: headerContent,
      footerTemplate: footerContent,
    });

  }




  async getUsuariosLiquidacion(queryRunner: QueryRunner, periodo_id: Number, anio: number, mes: number, personalId: number) {

    let createSelect = `SELECT
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
      WHERE liq.tipocuenta_id = 'G' AND liq.periodo_id = @0`

    if (personalId != 0 && personalId != undefined)
      createSelect += ` AND per.PersonalId = @3`

    createSelect += `)ORDER BY per.PersonalId ASC`

    return queryRunner.query(createSelect, [periodo_id, anio, mes, personalId])
  }

  async getUsuariosLiquidacionMovimientos(queryRunner: QueryRunner, periodo_id: Number, user_id: Number) {

    return queryRunner.query(`SELECT
    liq.persona_id, 
    liq.tipo_movimiento_id, 
    tip.des_movimiento, 
    liq.detalle,
    obj.ClienteId,
    ISNULL(obj.ClienteElementoDependienteId,0) ClienteElementoDependienteId,
    SUM(liq.importe) AS SumaImporte, 
    tip.indicador_recibo AS indicador
    FROM  lige.dbo.liqmamovimientos AS liq
    JOIN  lige.dbo.liqcotipomovimiento AS tip ON tip.tipo_movimiento_id = liq.tipo_movimiento_id
    LEFT JOIN Objetivo obj ON obj.ObjetivoId = liq.objetivo_id
    WHERE  liq.periodo_id = @0 AND  liq.tipocuenta_id = 'G' AND  liq.persona_id = @1
    GROUP BY 
    liq.persona_id, 
	 obj.ClienteId,
    obj.ClienteElementoDependienteId,
    liq.detalle,
    liq.tipo_movimiento_id, 
    tip.des_movimiento, 
    tip.indicador_recibo`, [periodo_id, user_id])

  }

  // async updateUsuariosLiquidacionDocGeneral(
  //   queryRunner: any,
  //   usuario: string,
  //   ip: string,
  //   audfecha: Date,
  //   idrecibo: number,
  //   persona_id: number, )
  // {
  //   return queryRunner.query(`UPDATE lige.dbo.docgeneral
  //   SET aud_ip_mod= @1, aud_fecha_mod=@2
  //   WHERE persona_id =@3 AND idrecibo=@4 `,
  //     [usuario, ip, audfecha,persona_id,idrecibo ])

  // }

  async setUsuariosLiquidacionDocGeneral(
    queryRunner: any,
    docgeneral: number,
    periodo: number,
    fecha: Date,
    persona_id: number,
    objetivo_id: number,
    nombre_archivo: string,
    path: string,
    usuario: string,
    ip: string,
    audfecha: Date,
    doctipo_id: string,
    idrecibo: number

  ) {

    return queryRunner.query(`INSERT INTO lige.dbo.docgeneral ("doc_id", "periodo", "fecha", "persona_id", "objetivo_id", "path", "nombre_archivo", "aud_usuario_ins", "aud_ip_ins", "aud_fecha_ins", "aud_usuario_mod", "aud_ip_mod", "aud_fecha_mod", "doctipo_id", "idrecibo")
    VALUES
    (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14);`,
      [
        docgeneral,
        periodo,
        fecha,
        persona_id,
        objetivo_id,
        path,
        nombre_archivo,
        usuario, ip, fecha,
        usuario, ip, audfecha,
        doctipo_id, idrecibo
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
      // const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, parseInt(year), parseInt(month), usuario, ip);
      const gettmpfilename = await this.getRutaFile(queryRunner, parseInt(year), parseInt(month), parseInt(personalIdRel))
      let tmpfilename;
      if (gettmpfilename[0] && typeof gettmpfilename[0].path === 'string') {
        tmpfilename = gettmpfilename[0].path;
      } else {
        throw new ClientException(`Recibo no generado`)
      }
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


  async getRutaFile(queryRunner: QueryRunner, year: number, month: number, personalIdRel: number) {
    return queryRunner.query(`SELECT * from lige.dbo.docgeneral doc
      JOIN lige.dbo.liqmaperiodo per ON per.periodo_id = doc.periodo
      WHERE per.anio =@0 AND per.mes=@1 AND doc.persona_id = @2 AND doctipo_id = 'REC'`,
      [year, month, personalIdRel]
    )
  }


  async obtenerPDFBuffer(tmpfilename: string) {
    const buffer = fs.readFileSync(tmpfilename);
    return buffer;
  }


  async bindPdf(req: Request, res: Response, next: NextFunction) {

    const queryRunner = dataSource.createQueryRunner()
    const {
      Usuario,
      Anio,
      Mes,
      isfull,
      lista,
      isDuplicate
    } = req.body

    const user = (res.locals.userName) ? res.locals.userName : Usuario
    if (!user)
      throw new ClientException(`Usuario no identificado`)

    let ip = this.getRemoteAddress(req)
    let pathFile: any

    try {
      let fechaActual = new Date();
      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, Anio, parseInt(Mes), user, ip);

     pathFile = isfull 
     ? await this.getGrupFilterDowload(queryRunner,periodo_id) 
     : await this.getparthFile(queryRunner, periodo_id, lista, isfull)
      
      const rutaPDF = path.join(this.directoryRecibo, `Recibos-${Anio}-${Mes}.pdf`);
      const mergedPdf = await PDFDocument.create();

      let urlForValidation = ""
      console.log("pathFile " + pathFile.length)
      
      if (pathFile == undefined || pathFile == "")
        throw new ClientException(`Recibo/s no generado/s para el periodo seleccionado`);

        for (const filterDowload of pathFile) {

        try {
      
          if(isfull){
            urlForValidation = `${process.env.PATH_RECIBO}/${Anio}${Mes}/${periodo_id}/${filterDowload.PersonalId}-${Mes}-${Anio}.pdf`
           
            if (!fs.existsSync(urlForValidation))
              throw new ClientException(`Error al generar el recibo unificado`);

          }
            let pdfBytes : any 
            let pdfDoc : any
            let copiedPages: any

          if(isfull) {
             pdfBytes = await fs.promises.readFile(urlForValidation.trim());
             pdfDoc = await PDFDocument.load(pdfBytes);
          } else {
             pdfBytes = await fs.promises.readFile(filterDowload.path);
             pdfDoc = await PDFDocument.load(pdfBytes);
          }

            copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
            

         // se crea el otro pdf
         if(isfull && isDuplicate) {
            const pdfBytesCopie = await fs.promises.readFile(urlForValidation.trim());
            const pdfDocCopie = await PDFDocument.load(pdfBytesCopie);
            const headerText = "DUPLICADO";
            const pages = pdfDocCopie.getPages();

          for (let i = 0; i < pages.length; i++) {
              const { height } = pages[i].getSize();
              const fontSize = 12;

              // Agregar encabezado - para center colocar 260 
              pages[i].drawText(headerText, {
                  x: 478,
                  y: height - 30,
                  size: fontSize,
              });
          }

          copiedPages = await mergedPdf.copyPages(pdfDocCopie, pdfDocCopie.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
          }
        } catch (error) {
          console.error(`Error al procesar el archivo ${urlForValidation}:`, error.message);
        }
      }

      const mergedPdfBytes = await mergedPdf.save();
      fs.writeFileSync(rutaPDF, mergedPdfBytes);
      console.log('PDF guardado en la ruta especificada:', rutaPDF);
      res.download(rutaPDF, `Recibos-${Anio}-${Mes}.pdf`, async (err) => {
        if (err) {
          console.error('Error al descargar el PDF:', err);
          return next(err);
        } else {
          console.log('PDF descargado con éxito');
          fs.unlinkSync(rutaPDF);
          console.log('PDF eliminado del servidor');
        }
      });
    } catch (error) {
      return next(error)
    }

  }

  async getGrupFilterDowload(queryRunner: QueryRunner,periodo_id: number,){
    return queryRunner.query(`SELECT DISTINCT g.GrupoActividadDetalle, per.PersonalApellido, per.PersonalNombre, per.PersonalId as PersonalId
    FROM lige.dbo.docgeneral doc 
    JOIN Personal per ON per.PersonalId=doc.persona_id
    LEFT JOIN GrupoActividadPersonal gaprel
     ON gaprel.GrupoActividadPersonalPersonalId = per.PersonalId 
     AND doc.fecha > gaprel.GrupoActividadPersonalDesde 
     AND doc.fecha < ISNULL(gaprel.GrupoActividadPersonalHasta , '9999-12-31')
    LEFT JOIN GrupoActividad g ON g.GrupoActividadId = gaprel.GrupoActividadId           
    WHERE doc.periodo =  @0 AND doc.doctipo_id = 'REC'
    ORDER BY g.GrupoActividadDetalle, per.PersonalApellido, per.PersonalNombre, per.PersonalId;`, [periodo_id])
  }

  async getparthFile(queryRunner: QueryRunner, periodo_id: number, perosonalIds: number[], isfull: any) {
    if (isfull) {
      return queryRunner.query(`SELECT * FROM lige.dbo.docgeneral WHERE periodo = @0 AND doctipo_id = 'REC'`, [periodo_id])
    } else {
      const personalIdsString = perosonalIds.join(', ');
      return queryRunner.query(`SELECT * FROM lige.dbo.docgeneral WHERE periodo = @0 AND doctipo_id = 'REC' AND persona_id IN (${personalIdsString})`, [periodo_id])
    }

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




