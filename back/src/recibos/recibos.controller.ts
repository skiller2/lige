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
//import moment from 'moment';
import { QueryRunner } from "typeorm";
import { Readable } from "typeorm/platform/PlatformTools.js";

const PathReciboTemplate = {
  header: ((process.env.PATH_RECIBO) ? process.env.PATH_RECIBO : './recibo') + '/config/recibo-header.html',
  body: ((process.env.PATH_RECIBO) ? process.env.PATH_RECIBO : './recibo') + '/config/recibo-body.html',
  footer: ((process.env.PATH_RECIBO) ? process.env.PATH_RECIBO : './recibo') + '/config/recibo-footer.html',
  headerDef: './assets/recibo/recibo-header.def.html',
  bodyDef: './assets/recibo/recibo-body.def.html',
  footerDef: './assets/recibo/recibo-footer.def.html'
}

export class RecibosController extends BaseController {
  directoryRecibo = process.env.PATH_RECIBO || "tmp";
  constructor() {
    super();
    if (!existsSync(this.directoryRecibo)) {
      mkdirSync(this.directoryRecibo, { recursive: true });
    }
  }


  async cleanDirectories(queryRunner: QueryRunner, directorPath: string, periodo: number, isUnique: any, directorPathUnique: string, idrecibo: number) {
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
      await this.deleteDirectories(queryRunner, periodo, isUnique, idrecibo)
    } catch (error) {
      console.error("Error al limpiar el directorio:", error);
    }
  }

  async deleteDirectories(queryRunner: QueryRunner, periodo: number, isUnique: any, idrecibo: number) {

    if (isUnique) {
      await queryRunner.query(`delete from lige.dbo.docgeneral where idrecibo=@0 ; `, [idrecibo])
    } else {
      await queryRunner.query(`delete from lige.dbo.docgeneral where periodo=@0 ; `, [periodo])
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

    header = (header) ? header : (fs.existsSync(PathReciboTemplate.header) ? fs.readFileSync(PathReciboTemplate.header + ((prev) ? '.old' : ''), 'utf-8') : fs.readFileSync(PathReciboTemplate.headerDef, 'utf-8'))
    body = (body) ? body : (fs.existsSync(PathReciboTemplate.body) ? fs.readFileSync(PathReciboTemplate.body + ((prev) ? '.old' : ''), 'utf-8') : fs.readFileSync(PathReciboTemplate.bodyDef, 'utf-8'))
    footer = (footer) ? footer : (fs.existsSync(PathReciboTemplate.footer) ? fs.readFileSync(PathReciboTemplate.footer + ((prev) ? '.old' : ''), 'utf-8') : fs.readFileSync(PathReciboTemplate.footerDef, 'utf-8'))

    if (!raw) {
      header = header.replace(/\${imgBase64}/g, imgBase64);
      footer = footer.replace(/\${imgBase64inaes}/g, imgBase64inaes);
      body = body.replace(/\${imgBase64Firma}/g, imgBase64Firma);

      header = header.replace(/\${anio}/g, anio.toString());
      header = header.replace(/\${mes}/g, mes.toString());
      header = header.replace(/\${fechaFormateada}/g, this.dateFormatter.format(fechaRecibo));
    }
    return { header, body, footer }
  }


  async generaRecibos(req: Request, res: Response, next: NextFunction) {

    let usuario = res.locals.userName
    let ip = this.getRemoteAddress(req)
    let isUnique = req.body.isUnique
    const personalId = req.body?.personalId
    const queryRunner = dataSource.createQueryRunner()
    let persona_id = 0
    //estas  variables se usan solo si el recibo previamente ya existe 
    let fechaRecibo = new Date(req.body.fechaRecibo)
    let docgeneral: number
    let idrecibo: number
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

      } else {

        // codigo para cuando es unico recibo bebe validar que el recibo exista para poder regenerarlo, caso contrario arrojar error
        const existRecibo = await this.existReciboId(queryRunner, fechaActual, periodo_id, personalId);

        if (existRecibo.length <= 0)
          throw new ClientException(`Recibo no existe para el periodo seleccionado`)

        fechaRecibo = existRecibo[0].fecha;
        idrecibo = existRecibo[0].idrecibo
        docgeneral = existRecibo[0].docgeneral
        directorPathUnique = existRecibo[0].path
      }
      const movimientosPendientes = await this.getUsuariosLiquidacion(queryRunner, periodo_id, periodo.year, periodo.month, personalId, fechaRecibo)

      var directorPath = String(periodo.year) + String(periodo.month).padStart(2, '0') + '/' + periodo_id
      if (!existsSync(this.directoryRecibo + '/' + directorPath)) {
        mkdirSync(this.directoryRecibo + '/' + directorPath, { recursive: true });
      }

      await this.cleanDirectories(queryRunner, this.directoryRecibo + '/' + directorPath, periodo_id, isUnique, directorPathUnique, idrecibo)

      const htmlContent = await this.getReciboHtmlContentGeneral(fechaRecibo, periodo.year, periodo.month)

      const browser = await puppeteer.launch({ headless: 'new' })
      const page = await browser.newPage();

      for (const movimiento of movimientosPendientes) {
        persona_id = movimiento.PersonalId
        const filesPath = directorPath + '/' + persona_id + '-' + String(periodo.month) + "-" + String(periodo.year) + ".pdf"
        const nombre_archivo = persona_id + '-' + String(periodo.month) + "-" + String(periodo.year) + ".pdf"
        docgeneral = await this.getProxNumero(queryRunner, `docgeneral`, usuario, ip)

        if (!isUnique)
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

        await this.createPdf(queryRunner, this.directoryRecibo + '/' + filesPath, persona_id, idrecibo, movimiento.PersonalNombre, movimiento.PersonalCUITCUILCUIT, movimiento.DomicilioCompleto, movimiento.SucursalDescripcion, movimiento.PersonalNroLegajo,
          movimiento.GrupoActividadDetalle, periodo_id, page, htmlContent.body, htmlContent.header, htmlContent.footer)
      }

      if (!isUnique)
        await this.updateTablePeriodo(queryRunner, periodo_id, usuario, ip, fechaActual)

      await page.close()
      await browser.close()      

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
    SucursalPrincipal: string,
    Asociado: string,
    Grupo: string,
    periodo_id: number,
    page: Page,
    htmlContent: string,
    headerContent: string,
    footerContent: string,
  ) {

    Domicilio = (Domicilio) ? Domicilio : 'Sin especificar'
    Asociado = (Asociado) ? Asociado.toString() : 'Pendiente'
    Grupo = (Grupo) ? Grupo : 'Sin asignar'
    Cuit = (Cuit)?Cuit.toString():'Sin especificar'


    headerContent = headerContent.replace(/\${idrecibo}/g, idrecibo.toString());
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
      TRIM(dom.PersonalDomicilioDomCalle), ' ',
      TRIM(dom.PersonalDomicilioDomNro), ' ',
      TRIM(dom.PersonalDomicilioDomPiso), ' ',
      TRIM(dom.PersonalDomicilioDomDpto), ' (',
      TRIM(dom.PersonalDomicilioCodigoPostal), ') ',
      TRIM(loc.LocalidadDescripcion), ' ',
      IIF((loc.LocalidadDescripcion!=pro.ProvinciaDescripcion),TRIM(pro.ProvinciaDescripcion),''), ' '
    )) AS DomicilioCompleto,
   act.GrupoActividadNumero,
   act.GrupoActividadDetalle,
   suc.SucursalDescripcion,
    1
    
    FROM Personal per
    LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
    LEFT JOIN PersonalDomicilio AS dom ON dom.PersonalId = per.PersonalId AND dom.PersonalDomicilioActual = 1 AND dom.PersonalDomicilioId = ( SELECT MAX(dommax.PersonalDomicilioId) FROM PersonalDomicilio dommax WHERE dommax.PersonalId = per.PersonalId AND dom.PersonalDomicilioActual = 1)
    LEFT JOIN Localidad loc ON loc.LocalidadId  =  dom.PersonalDomicilioLocalidadId AND loc.PaisId = dom.PersonalDomicilioPaisId AND loc.ProvinciaId = dom.PersonalDomicilioProvinciaId
    LEFT JOIN Provincia pro ON pro.ProvinciaId  =  dom.PersonalDomicilioProvinciaId AND pro.PaisId = dom.PersonalDomicilioPaisId
    LEFT JOIN PersonalSucursalPrincipal sucper ON sucper.PersonalId = per.PersonalId
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
    PersonalId: string,
    res: Response,
    req: Request,
    next: NextFunction
  ) {
    let usuario = res.locals.userName
    let ip = this.getRemoteAddress(req)
    const queryRunner = dataSource.createQueryRunner();
    try {
      const data = await queryRunner.query(`SELECT doc.path, doc.nombre_archivo from lige.dbo.docgeneral doc
      JOIN lige.dbo.liqmaperiodo per ON per.periodo_id = doc.periodo
      WHERE per.anio =@0 AND per.mes=@1 AND doc.persona_id = @2 AND doctipo_id = 'REC'`,
        [year, month, PersonalId]
      )

      if (!data[0])
        throw new ClientException(`Recibo no generado`)

      res.download(this.directoryRecibo + '/' + data[0].path, data[0].nombre_archivo, async (error) => {
        if (error) {
          console.error('Error al descargar el archivo:', error);
          return next(error)
        }
      });
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

    let ip = this.getRemoteAddress(req)

    try {
      let fechaActual = new Date();
      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, Anio, parseInt(Mes), user, ip);

      let pathFile = (lista)
        ? await this.getparthFile(queryRunner, periodo_id, lista)
        : await this.getGrupFilterDowload(queryRunner, periodo_id, ObjetivoIdWithSearch, ClienteIdWithSearch, SucursalIdWithSearch, PersonalIdWithSearch, SeachField)

      const mergedPdf = await PDFDocument.create();

      if (pathFile.length == 0)
        throw new ClientException(`Recibo/s no generado/s para el periodo seleccionado`);

      //      pathFile= [pathFile[0]]
      for (const filterDowload of pathFile) {
        let origpath = ''
        try {
          origpath = this.directoryRecibo + '/' + filterDowload.path
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
        LEFT JOIN PersonalSucursalPrincipal suc ON suc.PersonalId = mov.persona_id
        JOIN Sucursal i ON i.SucursalId = ISNULL(suc.PersonalSucursalPrincipalSucursalId,1)
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



    return queryRunner.query(`
    SELECT DISTINCT i.SucursalDescripcion, g.GrupoActividadDetalle, per.PersonalApellido, per.PersonalNombre, per.PersonalId, doc.path
        FROM lige.dbo.docgeneral doc 
       JOIN Personal per ON per.PersonalId=doc.persona_id 
       LEFT JOIN GrupoActividadPersonal gaprel ON gaprel.GrupoActividadPersonalPersonalId = per.PersonalId  AND doc.fecha > gaprel.GrupoActividadPersonalDesde  AND doc.fecha < ISNULL(gaprel.GrupoActividadPersonalHasta , '9999-12-31')
        LEFT JOIN GrupoActividad g ON g.GrupoActividadId = gaprel.GrupoActividadId
        LEFT JOIN PersonalSucursalPrincipal h ON h.PersonalId = per.PersonalId
        LEFT JOIN Sucursal i ON i.SucursalId = ISNULL(h.PersonalSucursalPrincipalSucursalId,1)
        WHERE doc.periodo =  @0 AND doc.doctipo_id = 'REC' AND per.PersonalId IN (${filterExtraIN})
    ORDER BY i.SucursalDescripcion, g.GrupoActividadDetalle, per.PersonalApellido, per.PersonalNombre, per.PersonalId`, [periodo_id, ObjetivoIdWithSearch, ClienteIdWithSearch, SucursalIdWithSearch, PersonalIdWithSearch])
  }

  async getparthFile(queryRunner: QueryRunner, periodo_id: number, perosonalIds: number[]) {
    const personalIdsString = perosonalIds.join(', ');
    return queryRunner.query(`SELECT * FROM lige.dbo.docgeneral WHERE periodo = @0 AND doctipo_id = 'REC' AND persona_id IN (${personalIdsString})`, [periodo_id])
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
        fs.renameSync(PathReciboTemplate.header, PathReciboTemplate.header + '.old')
        fs.renameSync(PathReciboTemplate.body, PathReciboTemplate.body + '.old')
        fs.renameSync(PathReciboTemplate.footer, PathReciboTemplate.footer + '.old')
      } catch (_e) { }

      fs.mkdirSync(path.dirname(PathReciboTemplate.header), { recursive: true })
      fs.writeFileSync(PathReciboTemplate.header, header)
      fs.writeFileSync(PathReciboTemplate.body, body)
      fs.writeFileSync(PathReciboTemplate.footer, footer)

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
        const idrecibo = Math.floor(10000 + Math.random() * 90000);
        await this.createPdf(queryRunner, filesPath, persona_id, idrecibo, movimiento.PersonalNombre, movimiento.PersonalCUITCUILCUIT, movimiento.DomicilioCompleto, movimiento.SucursalDescripcion, movimiento.PersonalNroLegajo,
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




