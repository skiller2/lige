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
  getPeriodoFromRequest,
} from "../liquidaciones/liquidaciones-banco/liquidaciones-banco.utils";

import { QueryRunner } from "typeorm";
import { CustodiaController } from "src/controller/custodia.controller";
import { AsistenciaController } from "src/controller/asistencia.controller";
import { FileUploadController } from "src/controller/file-upload.controller";
import { Filter } from "ldapts/filters/Filter";



export class RecibosController extends BaseController {
  directoryRecibo = (process.env.PATH_DOCUMENTS) ? process.env.PATH_DOCUMENTS : '.' + '/recibos'
  PathReciboTemplate = {
    header: `${this.directoryRecibo}/config/recibo-header.html`,
    body: `${this.directoryRecibo}/config/recibo-body.html`,
    footer: `${this.directoryRecibo}/config/recibo-footer.html`,
    headerDef: './assets/recibo/recibo-header.def.html',
    bodyDef: './assets/recibo/recibo-body.def.html',
    footerDef: './assets/recibo/recibo-footer.def.html'
  }


  constructor() {
    super();
    if (!existsSync(this.directoryRecibo)) {
      mkdirSync(this.directoryRecibo, { recursive: true });
    }
  }


  async cleanDirectories(queryRunner: QueryRunner, directorPath: string, anio: number, mes:number, isUnique: any, directorPathUnique: string, den_documento: number) {
    try {

      if (isUnique) {
        fs.unlinkSync(directorPathUnique);
      } else {
        console.log("limpiando directorio")
        if (fs.existsSync(directorPath)) {
          const archivos = fs.readdirSync(directorPath);
          archivos.forEach(archivo => {
            const rutaArchivo = path.join(directorPath, archivo);
            fs.unlinkSync(rutaArchivo);
          });
        }
      }
      await this.deleteDirectories(queryRunner, anio,mes, isUnique, den_documento)
    } catch (error) {
      console.error("Error al limpiar el directorio:", error);
    }
  }

  async deleteDirectories(queryRunner: QueryRunner, anio: number, mes:number, isUnique: any, den_documento: number) {

    if (isUnique) {
      await queryRunner.query(`delete from Documento where DocumentoDenominadorDocumento=@0 AND DocumentoTipoCodigo='REC' `, [den_documento])
    } else {
      await queryRunner.query(`delete from Documento WHERE DocumentoAnio=@1 AND DocumentoMes=@2 AND DocumentoTipoCodigo='REC' `, [null,anio,mes])
    }

  }

  async getReciboHtmlContentGeneral(fechaRecibo: Date, anio: number, mes: number, header: string = "", body: string = "", footer: string = "", raw: boolean = false, prev: boolean = false) {

    const imgPath = `./assets/logo-lince-full.svg`
    const imgBuffer = await fsPromises.readFile(imgPath);
    const imgBase64 = imgBuffer.toString('base64');

    const imgBufferFirma = await fsPromises.readFile(`./assets/firma_tesorero.svg`);
    const imgBase64Firma = imgBufferFirma.toString('base64');

    const imgPathinaes = `./assets/icons/inaes.png`
    const imgBufferinaes = await fsPromises.readFile(imgPathinaes);
    const imgBase64inaes = imgBufferinaes.toString('base64');

    header = (header) ? header : (fs.existsSync(this.PathReciboTemplate.header) ? fs.readFileSync(this.PathReciboTemplate.header + ((prev) ? '.old' : ''), 'utf-8') : fs.readFileSync(this.PathReciboTemplate.headerDef, 'utf-8'))
    body = (body) ? body : (fs.existsSync(this.PathReciboTemplate.body) ? fs.readFileSync(this.PathReciboTemplate.body + ((prev) ? '.old' : ''), 'utf-8') : fs.readFileSync(this.PathReciboTemplate.bodyDef, 'utf-8'))
    footer = (footer) ? footer : (fs.existsSync(this.PathReciboTemplate.footer) ? fs.readFileSync(this.PathReciboTemplate.footer + ((prev) ? '.old' : ''), 'utf-8') : fs.readFileSync(this.PathReciboTemplate.footerDef, 'utf-8'))

    if (!raw) {
      header = header.replace(/\${imgBase64}/g, imgBase64);
      footer = footer.replace(/\${imgBase64inaes}/g, imgBase64inaes);
      body = body.replace(/\${imgBase64Firma}/g, imgBase64Firma);

      header = header.replace(/\${anio}/g, anio.toString());
      header = header.replace(/\${mes}/g, mes.toString());
      header = header.replace(/\${fechaFormateada}/g, this.dateOutputFormat(fechaRecibo));
    }
    return { header, body, footer }
  }


  async generaRecibos(req: Request, res: Response, next: NextFunction) {

    const usuario = res.locals.userName
    const ip = this.getRemoteAddress(req)
    let isUnique = req.body.isUnique
    const personalId = req.body?.personalId
    const queryRunner = dataSource.createQueryRunner()
    let persona_id = 0
    //estas  variables se usan solo si el recibo previamente ya existe 
    let fechaRecibo = new Date(req.body.fechaRecibo)
    let DocumentoId: number
    let den_documento: number
    let directorPathUnique = ""
    const fechaActual = new Date();
    let ProcesoAutomaticoLogCodigo = 0

    try {
      ({ ProcesoAutomaticoLogCodigo } = await this.procesoAutomaticoLogInicio(queryRunner,"Recibos",req.body,usuario,ip))

      const periodo = getPeriodoFromRequest(req);
      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, periodo.year, periodo.month, usuario, ip)

      const resPendLiq = await CustodiaController.listCustodiasPendientesLiqui(periodo.year, periodo.month, 3)
      if (resPendLiq.length > 0) {
        const fecha_limite = resPendLiq[0].fecha_limite
        throw new ClientException(`Existen ${resPendLiq.length} custodias pendientes con fecha de inicio anterior o igual al ${this.dateOutputFormat(fecha_limite)}`)
      }

      const resPendAsisCierre = await AsistenciaController.objetivosPendAsis(periodo.year, periodo.month)
      if (resPendAsisCierre.length > 0)
        throw new ClientException(`Existen ${resPendAsisCierre.length} objetivos pendientes de cierre o sin asistencia para el período ${periodo.month}/${periodo.year}`)




      if (!isUnique) {
        // codigo para cuenado es recibo general
        const getRecibosGenerados = await this.getRecibosGenerados(queryRunner, periodo_id)
        if (getRecibosGenerados[0].ind_recibos_generados == 1)
          throw new ClientException(`Los recibos para este periodo ya se generaron`)

      } else {

        // codigo para cuando es unico recibo bebe validar que el recibo exista para poder regenerarlo, caso contrario arrojar error
        const existRecibo = await this.existReciboId(queryRunner, fechaActual, periodo.year, periodo.month, personalId);

        if (existRecibo.length <= 0)
          throw new ClientException(`Recibo no existe para el periodo seleccionado`)

        fechaRecibo = existRecibo[0].DocumentoFecha;
        den_documento = existRecibo[0].DocumentoDenominadorDocumento
        DocumentoId = existRecibo[0].DocumentoId
        directorPathUnique = existRecibo[0].DocumentoPath
      }
      const movimientosPendientes = await this.getUsuariosLiquidacion(queryRunner, periodo_id, periodo.year, periodo.month, personalId, fechaRecibo)

      var directorPath = String(periodo.year) + String(periodo.month).padStart(2, '0')
      if (!existsSync(this.directoryRecibo + '/' + directorPath)) {
        mkdirSync(this.directoryRecibo + '/' + directorPath, { recursive: true });
      }

      await this.cleanDirectories(queryRunner, this.directoryRecibo + '/' + directorPath, periodo.year, periodo.month, isUnique, directorPathUnique, den_documento)

      const htmlContent = await this.getReciboHtmlContentGeneral(fechaRecibo, periodo.year, periodo.month)

      const browser = await puppeteer.launch({ headless: 'new' })
      const page = await browser.newPage();

      for (const movimiento of movimientosPendientes) {
        persona_id = movimiento.PersonalId
        const filesPath = directorPath + '/' + persona_id + '-' + String(periodo.month) + "-" + String(periodo.year) + ".pdf"
        const nombre_archivo = persona_id + '-' + String(periodo.month) + "-" + String(periodo.year) + ".pdf"
        DocumentoId = await BaseController.getProxNumero(queryRunner, `Documento`, usuario, ip)

        if (!isUnique)
          den_documento = await BaseController.getProxNumero(queryRunner, `idrecibo`, usuario, ip)

        await this.setUsuariosLiquidacionDocumento(
          queryRunner,
          DocumentoId,
          periodo.year,
          periodo.month,
          fechaRecibo,
          persona_id,
          null,
          nombre_archivo,
          filesPath,
          usuario,
          ip,
          fechaActual,
          "REC",
          den_documento

        )

        await this.createPdf(queryRunner, this.directoryRecibo + '/' + filesPath, persona_id, den_documento, movimiento.PersonalNombre, movimiento.PersonalCUITCUILCUIT, movimiento.DomicilioCompleto, movimiento.SucursalDescripcion, movimiento.PersonalNroLegajo,
          movimiento.GrupoActividadDetalle, periodo_id, page, htmlContent.body, htmlContent.header, htmlContent.footer)
      }

      if (!isUnique)
        await this.updateTablePeriodo(queryRunner, periodo_id, usuario, ip, fechaActual)

      await page.close()
      await browser.close()
//      await queryRunner.commitTransaction()


      await this.procesoAutomaticoLogFin(queryRunner, ProcesoAutomaticoLogCodigo, 'COM', { res: `Procesado correctamente`,'CantRecibos': movimientosPendientes.length }, usuario, ip)

      this.jsonRes([], res, `Se generaron ${movimientosPendientes.length} recibos`);

    } catch (error) {

      await this.rollbackTransaction(queryRunner)
      await this.procesoAutomaticoLogFin(queryRunner, ProcesoAutomaticoLogCodigo, 'ERR', { res: error }, usuario, ip)

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


  existReciboId(queryRunner: QueryRunner, fechaActual: Date, anio: number, mes:number, personalId: number) {
    return queryRunner.query(`SELECT * from Documento WHERE DocumentoAnio= @1 AND DocumentoMes=@2 AND PersonalId = @0`, [personalId,anio,mes])
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
    den_documento: number,
    PersonaNombre: string,
    Cuit: string,
    Domicilio: string,
    SucursalPrincipal: string,
    Asociado: string,
    Grupo: string,
    periodo_id: number,
    page: Page,
    htmlContent: string,
    headerContent: string,
    footerContent: string,
  ) {
    Domicilio = (Domicilio && Domicilio != '()') ? Domicilio : 'Sin especificar'
    Asociado = (Asociado) ? Asociado.toString() : 'Pendiente'
    Grupo = (Grupo) ? Grupo : 'Sin asignar'
    Cuit = (Cuit) ? Cuit.toString() : 'Sin especificar'


    headerContent = headerContent.replace(/\${idrecibo}/g, den_documento.toString());
    htmlContent = htmlContent.replace(/\${PersonaNombre}/g, PersonaNombre);
    htmlContent = htmlContent.replace(/\${Cuit}/g, Cuit);
    htmlContent = htmlContent.replace(/\${Domicilio}/g, Domicilio);
    htmlContent = htmlContent.replace(/\${SucursalPrincipal}/g, SucursalPrincipal);


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
          htmlEgreso += `<tr><td>${liquidacionElement.des_movimiento} - ${liquidacionElement.detalle}</td><td>${this.currencyPipe.format(liquidacionElement.SumaImporte*-1)}</td></tr>`
          retribucion += liquidacionElement.SumaImporte
          break;
        case "D":
          htmlDeposito += `<tr><td>${liquidacionElement.detalle}</td><td>${this.currencyPipe.format(liquidacionElement.SumaImporte)}</td></tr>`
          break
        case "I":
          htmlIngreso += `<tr><td>${liquidacionElement.detalle} ${liquidacionElement.custodia_id ? 'Custodia ' + liquidacionElement.custodia_id + ' ' + liquidacionElement.ClienteDenominacion : ''} ${(liquidacionElement.ClienteId) ? liquidacionElement.ClienteId + '/' + liquidacionElement.ClienteElementoDependienteId : ''}</td><td>${this.currencyPipe.format(liquidacionElement.SumaImporte)}</td></tr>`
          retenciones += liquidacionElement.SumaImporte
          break
        default:
          break;
      }
    }

    if (adelanto > 0)
      htmlAdelanto += `<tr class="subtotal"><td>Subtotal:</td><td>${this.currencyPipe.format(adelanto)}</td></tr>`
    if (retribucion > 0)
      htmlEgreso += `<tr class="subtotal"><td>Subtotal:</td><td>${this.currencyPipe.format(retribucion*-1)}</td></tr>`
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

    //fs.writeFileSync("./full.html",htmlContent)
    await page.pdf({
      path: filesPath,
      margin: { top: '80px', right: '0px', bottom: '50px', left: '0px' },
      printBackground: true,
      format: 'A4',
      displayHeaderFooter: true,
      headerTemplate: headerContent,
      footerTemplate: footerContent,
    });

  }




  async getUsuariosLiquidacion(queryRunner: QueryRunner, periodo_id: Number, anio: number, mes: number, personalId: number, fecha: Date) {

    let createSelect = `SELECT
    per.PersonalId, per.PersonalNroLegajo, 
    CONCAT(TRIM(per.PersonalNombre), ' ', TRIM(per.PersonalApellido)) AS PersonalNombre,
  
    cuit.PersonalCUITCUILCUIT,
    TRIM(CONCAT(
      TRIM(dom.DomicilioDomCalle), ' ',
      TRIM(dom.DomicilioDomNro), ' ',
      TRIM(dom.DomicilioDomPiso), ' ',
      TRIM(dom.DomicilioDomDpto), ' (',
      TRIM(dom.DomicilioCodigoPostal), ') ',
      TRIM(loc.LocalidadDescripcion), ' ',
      IIF((loc.LocalidadDescripcion!=pro.ProvinciaDescripcion),TRIM(pro.ProvinciaDescripcion),''), ' '
    )) AS DomicilioCompleto,
   act.GrupoActividadNumero,
   act.GrupoActividadDetalle,
   suc.SucursalDescripcion,
    1
    
    FROM Personal per
    LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
    LEFT JOIN NexoDomicilio AS nex ON nex.PersonalId = per.PersonalId AND nex.NexoDomicilioActual = 1 AND nex.NexoDomicilioId = (SELECT MAX(nexmax.NexoDomicilioId) FROM NexoDomicilio nexmax WHERE nexmax.PersonalId=per.PersonalId AND nex.NexoDomicilioActual = 1)
    LEFT JOIN Domicilio AS dom ON dom.DomicilioId = nex.DomicilioId 
    LEFT JOIN Localidad loc ON loc.LocalidadId  =  dom.DomicilioLocalidadId AND loc.PaisId = dom.DomicilioPaisId AND loc.ProvinciaId = dom.DomicilioProvinciaId
    LEFT JOIN Provincia pro ON pro.ProvinciaId  =  dom.DomicilioProvinciaId AND pro.PaisId = dom.DomicilioPaisId
    LEFT JOIN PersonalSucursalPrincipal sucper ON sucper.PersonalId = per.PersonalId AND sucper.PersonalSucursalPrincipalId = (SELECT MAX(a.PersonalSucursalPrincipalId) PersonalSucursalPrincipalId FROM PersonalSucursalPrincipal a WHERE a.PersonalId = per.PersonalId)

    LEFT JOIN Sucursal suc ON suc.SucursalId=sucper.PersonalSucursalPrincipalSucursalId
    LEFT JOIN (SELECT grp.GrupoActividadPersonalPersonalId, MAX(grp.GrupoActividadPersonalDesde) AS GrupoActividadPersonalDesde, MAX(ISNULL(grp.GrupoActividadPersonalHasta,'9999-12-31')) GrupoActividadPersonalHasta FROM GrupoActividadPersonal AS grp WHERE @4 >= grp.GrupoActividadPersonalDesde AND @4 <= ISNULL(grp.GrupoActividadPersonalHasta, '9999-12-31') GROUP BY grp.GrupoActividadPersonalPersonalId) as grupodesde ON grupodesde.GrupoActividadPersonalPersonalId = per.PersonalId
    LEFT JOIN GrupoActividadPersonal grupo ON grupo.GrupoActividadPersonalPersonalId = per.PersonalId AND grupo.GrupoActividadPersonalDesde = grupodesde.GrupoActividadPersonalDesde AND ISNULL(grupo.GrupoActividadPersonalHasta,'9999-12-31') = grupodesde.GrupoActividadPersonalHasta 
        
    
    LEFT JOIN GrupoActividad act ON act.GrupoActividadId= grupo.GrupoActividadId
    WHERE per.PersonalId IN ( 
  
      SELECT DISTINCT liq.persona_id
      FROM lige.dbo.liqmamovimientos liq

      WHERE liq.tipocuenta_id = 'G' AND liq.periodo_id = @0`

    if (personalId != 0 && personalId != undefined)
      createSelect += ` AND per.PersonalId = @3`

    createSelect += `)ORDER BY per.PersonalId ASC`

    return queryRunner.query(createSelect, [periodo_id, anio, mes, personalId, fecha])
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
    tip.indicador_recibo AS indicador,
    cli.ClienteDenominacion,
    liq.custodia_id
    FROM  lige.dbo.liqmamovimientos AS liq
    JOIN  lige.dbo.liqcotipomovimiento AS tip ON tip.tipo_movimiento_id = liq.tipo_movimiento_id
    LEFT JOIN Objetivo obj ON obj.ObjetivoId = liq.objetivo_id
    LEFT JOIN lige.dbo.objetivocustodia cus ON cus.objetivo_custodia_id = liq.custodia_id
    LEFT JOIN Cliente cli ON cli.ClienteId = ISNULL(obj.ClienteId, cus.cliente_id)
    
    WHERE  liq.periodo_id = @0 AND  liq.tipocuenta_id = 'G' AND  liq.persona_id = @1
    GROUP BY 
    liq.persona_id, 
	 obj.ClienteId,
    obj.ClienteElementoDependienteId,
    liq.custodia_id,
    liq.detalle,
    liq.tipo_movimiento_id, 
    tip.des_movimiento, 
    tip.indicador_recibo,
    cli.ClienteDenominacion`
      , [periodo_id, user_id])

  }

  async setUsuariosLiquidacionDocumento(
    queryRunner: any,
    DocumentoId: number,
    anio: number,
    mes: number,
    fecha: Date,
    persona_id: number,
    objetivo_id: number,
    nombre_archivo: string,
    path: string,
    usuario: string,
    ip: string,
    audfecha: Date,
    doctipo_id: string,
    den_documento: number

  ) {
    return queryRunner.query(
      `INSERT INTO Documento(DocumentoId, 
        DocumentoTipoCodigo, 
        PersonalId, 
        ObjetivoId, 
        DocumentoDenominadorDocumento, 
        DocumentoNombreArchivo, 
        DocumentoFecha, 
        DocumentoFechaDocumentoVencimiento, 
        DocumentoPath, 
        DocumentoDetalleDocumento, 
        DocumentoIndividuoDescargaBot, 
        DocumentoAudFechaIng, 
        DocumentoAudUsuarioIng, 
        DocumentoAudIpIng, 
        DocumentoAudFechaMod, 
        DocumentoAudUsuarioMod, 
        DocumentoAudIpMod, 
        DocumentoClienteId, 
        DocumentoAnio, 
        DocumentoMes, 
        DocumentoVersion)
      
        VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15, @16, @17, @18, @19, @20)
      `,
      [DocumentoId,
        doctipo_id,
        persona_id,
        objetivo_id,
        den_documento,
        nombre_archivo,
        fecha,
        null,
        path,
        null,
        1,
        fecha, usuario, ip,
        audfecha, usuario, ip,
        null, //ClienteId
        anio, // DocumentoAnio 
        mes, // DocumentoMes 
        0 // DocumentoVersion
    ]
    )
  }

  async downloadComprobantesByPeriodo(
    year: string,
    month: string,
    PersonalId: string,
    res: Response,
    req: Request,
    next: NextFunction
  ) {
    let usuario = res.locals.userName
    let ip = this.getRemoteAddress(req)
    const queryRunner = dataSource.createQueryRunner();


    try {
      await queryRunner.connect();
      const data = await queryRunner.query(`SELECT doc.DocumentoId, doc.DocumentoPath, doc.DocumentoNombreArchivo
        from Documento doc
          WHERE doc.DocumentoAnio =@1 AND doc.DocumentoMes=@2 AND doc.PersonalId = @0 AND doc.DocumentoTipoCodigo = 'REC'
    `,
        [PersonalId, year, month]
      )


      if (!data[0])
        throw new ClientException(`Recibo no generado`)

      req.params.id = data[0].DocumentoId
      req.params.filename = 'original'
      req.params.tableForSearch = 'Documento'

      const fileUploadController = new FileUploadController();
      await fileUploadController.getByDownloadFile(req, res, next);




      /*
            res.download(this.directoryRecibo + '/' + data[0].path, data[0].nombre_archivo, async (error) => {
              if (error) {
                console.error('Error al descargar el archivo:', error);
                return next(error)
              }
            });
      */
    } catch (error) {
      return next(error)
    }
  }


  async bindPdf(req: Request, res: Response, next: NextFunction) {

    const queryRunner = dataSource.createQueryRunner()
    const {
      Usuario,
      Anio,
      Mes,
      isfull,
      lista,
      isDuplicate,
      ObjetivoIdWithSearch,
      ClienteIdWithSearch,
      SucursalIdWithSearch,
      PersonalIdWithSearch,
      SeachField
    } = req.body


    const user = (res.locals.userName) ? res.locals.userName : Usuario
    if (!user)
      throw new ClientException(`Usuario no identificado`)

    const ip = this.getRemoteAddress(req)
    const fechaActual = new Date();

    try {
      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, Anio, parseInt(Mes), user, ip);
      let recibosListaFiltroSuc = []
      const recibosLista = (lista)
        ? await this.getparthFile(queryRunner, Number(Anio), Number(Mes), lista)
        : await this.getGrupFilterDowload(queryRunner, periodo_id, ObjetivoIdWithSearch, ClienteIdWithSearch, SucursalIdWithSearch, PersonalIdWithSearch, SeachField)
      
      if (res.locals.filterSucursal && res.locals.filterSucursal.length > 0) {
        recibosListaFiltroSuc = recibosLista.filter((r: { PersonalSucursalPrincipalSucursalId: number })=>res.locals.filterSucursal.includes(r.PersonalSucursalPrincipalSucursalId))
      } else {
        recibosListaFiltroSuc = recibosLista
      }
      const sucursalesFiltroMsg = (res.locals.filterSucursal && res.locals.filterSucursal.length > 0) ? 'Sucursales: '+res.locals.filterSucursal.join(',') :''
      if (recibosListaFiltroSuc.length == 0)
        throw new ClientException(`No se encontraron recibos para el periodo ${Mes}/${Anio} y los filtros seleccionados. (${recibosLista.length}) ${sucursalesFiltroMsg}`);


      const mergedPdf = await PDFDocument.create();


      //      pathFile= [pathFile[0]]
      for (const filterDowload of recibosListaFiltroSuc) {
        let origpath = ''
        try {
          origpath = this.directoryRecibo + '/' + filterDowload.DocumentoPath
          if (!fs.existsSync(origpath))
            throw new ClientException(`Error al generar el recibo unificado ${origpath}`);

          const pdfBytes = await fs.promises.readFile(origpath);
          const pdfDoc = await PDFDocument.load(pdfBytes);
          const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());

          for (const pg of copiedPages) mergedPdf.addPage(pg)
          //          copiedPages.forEach((page) => mergedPdf.addPage(page));

          if (isDuplicate) {
            const headerText = "DUPLICADO";
            const pages = pdfDoc.getPages();
            for (let i = 0; i < pages.length; i++) {
              const { height } = pages[i].getSize();
              const fontSize = 12;

              // Agregar encabezado - para center colocar 260 
              pages[i].drawText(headerText, {
                x: 400,
                y: height - 30,
                size: fontSize,
              });
            }

            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            for (const pg of copiedPages) mergedPdf.addPage(pg)
            //            copiedPages.forEach((page) => mergedPdf.addPage(page));

          }

        } catch (error) {
          console.error(`Error al procesar el archivo ${origpath}:`, error.message);
        }
      }


      const resBuffer = Buffer.from(await mergedPdf.save());

      res.attachment(`Recibos-${Anio}-${Mes}.pdf`);
      res.setHeader('Content-Length', resBuffer.length);
      res.write(resBuffer, 'binary');
      res.end();
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    }

  }

  async getGrupFilterDowload(queryRunner: QueryRunner, periodo_id: number, ObjetivoIdWithSearch: number, ClienteIdWithSearch: number, SucursalIdWithSearch: number, PersonalIdWithSearch: number, SeachField: string
  ) {

    let filterExtraIN = 'SELECT DISTINCT mov.persona_id FROM lige.dbo.liqmamovimientos mov WHERE mov.periodo_id=@0'

    switch (SeachField) {
      case 'T':

        break;
      case 'P':
        filterExtraIN = 'SELECT @4'

        break;
      case 'S':
        filterExtraIN = `SELECT DISTINCT mov.persona_id FROM lige.dbo.liqmamovimientos mov 
        LEFT JOIN (SELECT per.PersonalId, ISNULL(suc.PersonalSucursalPrincipalSucursalId,1) PersonalSucursalPrincipalSucursalId, suc.PersonalSucursalPrincipalUltimaActualizacion
          FROM Personal per
          JOIN PersonalSucursalPrincipal suc ON suc.PersonalId=per.PersonalId AND suc.PersonalSucursalPrincipalId = (SELECT MAX(a.PersonalSucursalPrincipalId) PersonalSucursalPrincipalId FROM PersonalSucursalPrincipal a WHERE a.PersonalId = per.PersonalId)) suc ON suc.PersonalId = mov.persona_id


        JOIN Sucursal i ON i.SucursalId =  suc.PersonalSucursalPrincipalSucursalId
        WHERE mov.periodo_id=@0 AND i.SucursalId = @3`

        break;
      case 'O':
        filterExtraIN = 'SELECT DISTINCT mov.persona_id FROM lige.dbo.liqmamovimientos mov WHERE mov.periodo_id=@0 AND mov.objetivo_id=@1'

        break;
      case 'C':
        filterExtraIN = 'SELECT DISTINCT mov.persona_id FROM lige.dbo.liqmamovimientos mov JOIN Objetivo obj ON obj.ObjetivoId = mov.objetivo_id WHERE mov.periodo_id=@0 AND obj.ClienteId = @2'

        break;

      default:
        break;
    }

    const listPers = await queryRunner.query(filterExtraIN, [periodo_id, ObjetivoIdWithSearch, ClienteIdWithSearch, SucursalIdWithSearch, PersonalIdWithSearch])
    

    if (listPers.length == 0) listPers.push({ persona_id: 0 })
    return queryRunner.query(`
    SELECT DISTINCT i.SucursalDescripcion, g.GrupoActividadDetalle, per.PersonalApellido, per.PersonalNombre, per.PersonalId, doc.DocumentoPath, h.PersonalSucursalPrincipalSucursalId
        FROM Documento doc 
       JOIN Personal per ON per.PersonalId=doc.PersonalId
       JOIN lige.dbo.liqmaperiodo peri ON peri.anio = doc.DocumentoAnio AND peri.mes = doc.DocumentoMes AND peri.periodo_id = @0 
       LEFT JOIN GrupoActividadPersonal gaprel ON gaprel.GrupoActividadPersonalPersonalId = per.PersonalId  AND doc.DocumentoFecha > gaprel.GrupoActividadPersonalDesde  AND doc.DocumentoFecha < ISNULL(gaprel.GrupoActividadPersonalHasta , '9999-12-31')
        LEFT JOIN GrupoActividad g ON g.GrupoActividadId = gaprel.GrupoActividadId
        LEFT JOIN PersonalSucursalPrincipal h ON h.PersonalId = per.PersonalId AND h.PersonalSucursalPrincipalId = (SELECT MAX(a.PersonalSucursalPrincipalId) PersonalSucursalPrincipalId FROM PersonalSucursalPrincipal a WHERE a.PersonalId = per.PersonalId)

        LEFT JOIN Sucursal i ON i.SucursalId = ISNULL(h.PersonalSucursalPrincipalSucursalId,1)
        WHERE doc.DocumentoTipoCodigo = 'REC' AND per.PersonalId IN (${listPers.map(o => o.persona_id).join(',')})
    ORDER BY i.SucursalDescripcion, g.GrupoActividadDetalle, per.PersonalApellido, per.PersonalNombre, per.PersonalId`,
      [periodo_id, ObjetivoIdWithSearch, ClienteIdWithSearch, SucursalIdWithSearch, PersonalIdWithSearch])
  }

  async getparthFile(queryRunner: QueryRunner, anio:number,mes:number, perosonalIds: number[]) {
    const personalIdsString = perosonalIds.join(', ');
    return queryRunner.query(`SELECT * FROM Documento doc WHERE doc.DocumentoAnio = @1 AND doc.DocumentoMes=@2 AND doc.DocumentoTipoCodigo = 'REC' AND doc.PersonalId IN (${personalIdsString})`, [,anio,mes])
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

  async setReciboConfig(req: Request, res: Response, next: NextFunction) {
    const header = req.body.header
    const body = req.body.body
    const footer = req.body.footer

    try {

      if (body == "")
        throw new ClientException(`El cuerpo no puede estar vacio`)

      if (header == "")
        throw new ClientException(`La cabecera no puede estar vacia`)

      try {
        fs.renameSync(this.PathReciboTemplate.header, this.PathReciboTemplate.header + '.old')
        fs.renameSync(this.PathReciboTemplate.body, this.PathReciboTemplate.body + '.old')
        fs.renameSync(this.PathReciboTemplate.footer, this.PathReciboTemplate.footer + '.old')
      } catch (_e) { }

      fs.mkdirSync(path.dirname(this.PathReciboTemplate.header), { recursive: true })
      fs.writeFileSync(this.PathReciboTemplate.header, header)
      fs.writeFileSync(this.PathReciboTemplate.body, body)
      fs.writeFileSync(this.PathReciboTemplate.footer, footer)

      this.jsonRes([], res, `Se guardo el nuevo formato de recibo`);

    } catch (error) {
      console.log('capturo', error)
      return next(error)
    }
  }

  async getReciboConfig(req: Request, res: Response, next: NextFunction) {
    const prev: boolean = (req.params.prev === 'true')
    try {
      const htmlContent = await this.getReciboHtmlContentGeneral(new Date(), 0, 0, '', '', '', true, prev)
      this.jsonRes({ header: htmlContent.header, body: htmlContent.body, footer: htmlContent.footer }, res);

    } catch (error) {
      return next(error)
    }
  }

  async downloadReciboPRueba(req: Request, res: Response, next: NextFunction) {
    const header = req.body.header
    const body = req.body.body
    const footer = req.body.footer
    const PersonalId = Number(req.body.PersonalId)
    const periodo = new Date(req.body.periodo)
    const queryRunner = dataSource.createQueryRunner()
    const fechaActual = new Date();
    let persona_id = 0
    let usuario = res.locals.userName
    let ip = this.getRemoteAddress(req)
    let filesPath = ""

    const anio = periodo.getFullYear()
    const mes = periodo.getMonth() + 1
    try {
      if (!PersonalId)
        throw new ClientException(`Debe selccionar persona`)

      const waterMark = `<div style="position: fixed; bottom: 500px; left: 50px; z-index: 10000; font-size:200px; color: red; transform:rotate(-60deg);
                        opacity: 0.6;">PRUEBA</div>`
      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, anio, mes, usuario, ip)
      const movimientosPendientes = await this.getUsuariosLiquidacion(queryRunner, periodo_id, anio, mes, PersonalId, fechaActual)

      const htmlContent = await this.getReciboHtmlContentGeneral(fechaActual, anio, mes, header, body, footer)

      const browser = await puppeteer.launch({ headless: 'new' })
      const page = await browser.newPage();

      if (movimientosPendientes.length == 0)
        throw new ClientException(`La persona seleccionada no tiene datos en el período seleccionado`)


      for (const movimiento of movimientosPendientes) {
        persona_id = movimiento.PersonalId
        filesPath = (process.env.PATH_RECIBO_HTML_TEST) ? process.env.PATH_RECIBO_HTML_TEST : 'tmp' + '/' + persona_id + '-' + String(anio) + "-" + String(mes) + ".pdf"
        const den_documento = Math.floor(10000 + Math.random() * 90000);
        await this.createPdf(queryRunner, filesPath, persona_id, den_documento, movimiento.PersonalNombre, movimiento.PersonalCUITCUILCUIT, movimiento.DomicilioCompleto, movimiento.SucursalDescripcion, movimiento.PersonalNroLegajo,
          movimiento.GrupoActividadDetalle, periodo_id, page, htmlContent.body + waterMark, htmlContent.header, htmlContent.footer)
      }


      await page.close();
      await browser.close();

      let nameFile = `ReciboTest-${anio}-${mes}.pdf`
      console.log('filesPath', filesPath)
      await this.dowloadPdfBrowser(res, next, filesPath, anio, mes, nameFile)

    } catch (error) {
      return next(error)
    }
  }

  async dowloadPdfBrowser(res: Response, next: NextFunction, filesPath: any, year: any, month: any, nameFile: any) {
    res.download(filesPath, nameFile, async (err) => {
      if (err) {
        console.error(`Error al descargar el PDF: ${filesPath}`, err);
        return next(err);
      } else {
        //console.log('PDF descargado con éxito');
        fs.unlinkSync(filesPath);
        // console.log('PDF eliminado del servidor');
      }
    });
  }
}
