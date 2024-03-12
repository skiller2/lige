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

      const getRecibosGenerados = await this.getRecibosGenerados(queryRunner,periodo_id)
      
      if(!getRecibosGenerados)
      throw new ClientException(`Los recibos para este periodo ya se generaron`)

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

      headerContent = headerContent.replace(/\${anio}/g, periodo.year.toString());
      headerContent = headerContent.replace(/\${mes}/g, periodo.month.toString());
      headerContent = headerContent.replace(/\${fechaFormateada}/g, this.dateFormatter.format(fechaActual));
      const htmlContentPre = htmlContent;

      const browser = await puppeteer.launch({ headless: 'new' })
      const page = await browser.newPage();

      for (const movimiento of movimientosPendientes) {
        const persona_id = movimiento.PersonalId
        const filesPath = directorPath + '/' + persona_id + '-' + String(periodo.month) + "-" + String(periodo.year) + ".pdf"
        const nombre_archivo = persona_id + '-' + String(periodo.month) + "-" + String(periodo.year) + ".pdf"
        const docgeneral = await this.getProxNumero(queryRunner, `docgeneral`, usuario, ip)
        const idrecibo = await this.getProxNumero(queryRunner, `idrecibo`, usuario, ip)

        await this.setUsuariosLiquidacionDocGeneral(
          queryRunner,
          docgeneral,
          periodo_id,
          fechaActual,
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
          Grupo, periodo_id, page,htmlContentPre, headerContent, footerContent)
        

      }

      await this.updateTablePeriodo(queryRunner,periodo_id)
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

  async updateTablePeriodo(queryRunner:QueryRunner,periodo_id:number){
    try {
      queryRunner.query(
        `UPDATE lige.dbo.liqmaperiodo
         SET ind_recibos_generados = 1
         WHERE periodo_id = @0`,
        [periodo_id]
      );
    } catch (error) {
      this.rollbackTransaction(queryRunner)
    }
  }

  async getRecibosGenerados(queryRunner:QueryRunner,periodo_id:number){
    try {
      return queryRunner.query(
        `SELECT ind_recibos_generados FROM dbo.liqmaperiodo WHERE periodo_id = @0`,
        [periodo_id]
      );
    } catch (error) {
      this.rollbackTransaction(queryRunner)
    }
  }

  async generaReciboUnico(req: Request, res: Response, next: NextFunction) {

    let usuario = res.locals.userName
    let ip = this.getRemoteAddress(req)
    const queryRunner = dataSource.createQueryRunner();
    try {

     
      const periodo = getPeriodoFromRequest(req);
      const personalId = req.body.personalId;
      let fechaActual = new Date();
      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, periodo.year, periodo.month, usuario, ip);
      const existRecibo = await this.existReciboId(queryRunner, fechaActual, periodo_id,personalId);


      if (existRecibo.length > 0) 
        throw new ClientException(`Recibo ya existe para el periodo seleccionado`)

      const movimientosPendientes = await this.getUsuariosLiquidacionForUserId(queryRunner, periodo_id, periodo.year, periodo.month,personalId)

      var directorPath = this.directoryRecibo + '/' + String(periodo.year) + String(periodo.month).padStart(2, '0') + '/' + periodo_id
      if (!existsSync(directorPath)) {
        mkdirSync(directorPath, { recursive: true });
      }

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
      headerContent = headerContent.replace(/\${fechaFormateada}/g, this.dateFormatter.format(fechaActual));
      const htmlContentPre = htmlContent;

      const browser = await puppeteer.launch({ headless: 'new' })
      const page = await browser.newPage();

      for (const movimiento of movimientosPendientes) {
        const persona_id = movimiento.PersonalId
        const filesPath = directorPath + '/' + persona_id + '-' + String(periodo.month) + "-" + String(periodo.year) + ".pdf"
        const nombre_archivo = persona_id + '-' + String(periodo.month) + "-" + String(periodo.year) + ".pdf"
        const docgeneral = await this.getProxNumero(queryRunner, `docgeneral`, usuario, ip)
        const idrecibo = await this.getProxNumero(queryRunner, `idrecibo`, usuario, ip)

        await this.setUsuariosLiquidacionDocGeneral(
          queryRunner,
          docgeneral,
          periodo_id,
          fechaActual,
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
          Grupo, periodo_id, page,htmlContentPre, headerContent, footerContent)
        

      }
        
      
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

  existReciboId(queryRunner:QueryRunner, fechaActual: Date, periodo_id:number,personalId:number){
    return queryRunner.query(`SELECT * from lige.dbo.docgeneral WHERE periodo= @0 AND persona_id = @1`, [periodo_id,personalId])
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
    Grupo:string,
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
          htmlIngreso += `<tr><td>${liquidacionElement.detalle} ${(liquidacionElement.ClienteId)? liquidacionElement.ClienteId+'/'+liquidacionElement.ClienteElementoDependienteId:''}</td><td>${this.currencyPipe.format(liquidacionElement.SumaImporte)}</td></tr>`
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

  async getUsuariosLiquidacionForUserId(queryRunner: QueryRunner, periodo_id: Number, anio:number,mes:number,personalId:number) {

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
      AND per.PersonalId = @3
    )
    ORDER BY per.PersonalId ASC`, [periodo_id,anio,mes,personalId])
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
    idrecibo : number

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
        usuario, ip, audfecha,
        usuario, ip, audfecha,
        doctipo_id,idrecibo
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


  async bindPdf( req: Request, res: Response, next: NextFunction) {

    const queryRunner = dataSource.createQueryRunner()
    const {
      Usuario,
      Anio,
      Mes,
      isfull,
      lista
    } = req.body

    const user = (res.locals.userName)? res.locals.userName : Usuario
      if (!user)
        throw new ClientException(`Usuario no identificado`)

    let ip = this.getRemoteAddress(req)
    let perosonalIds
    let pathFile:any

    if(lista && lista.length  > 0 )
      perosonalIds = JSON.parse(lista)
    try {
      let fechaActual = new Date();
      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, Anio, parseInt(Mes), user, ip);

      if(isfull){
        pathFile = await this.getparthFileFull(queryRunner, periodo_id)
      }else{
        pathFile = await this.getparthFile(queryRunner, periodo_id, perosonalIds)
      }
      const rutaPDF = path.join(this.directoryRecibo, `Recibos-${Anio}-${Mes}.pdf`);
      const mergedPdf = await PDFDocument.create();

      for (const filePath of pathFile) {
        try {
          const pdfBytes = await fs.promises.readFile(filePath.path);
          const pdfDoc = await PDFDocument.load(pdfBytes);
          const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        } catch (error) {
          console.error(`Error al procesar el archivo ${filePath}:`, error.message);
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

  async getparthFile(queryRunner: QueryRunner, periodo_id: number, perosonalIds: any) {
    const personalIdsString = perosonalIds.join(', ');
    return queryRunner.query(`SELECT * FROM lige.dbo.docgeneral WHERE periodo = @0 AND persona_id IN (${personalIdsString})`, [periodo_id])
  }

  async getparthFileFull(queryRunner: QueryRunner, periodo_id: number) {
    return queryRunner.query(`SELECT * FROM lige.dbo.docgeneral WHERE periodo = @0`, [periodo_id])
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




