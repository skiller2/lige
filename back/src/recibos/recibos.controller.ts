import { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Utils } from "../liquidaciones/liquidaciones.utils";
import { promises as fsPromises } from 'fs';
import { mkdirSync, existsSync, readFileSync, unlinkSync, copyFileSync } from "fs";
import xlsx from 'node-xlsx';
import puppeteer from 'puppeteer';
import { NumerosALetras } from 'numero-a-letras';
import {NumeroALetras,setSingular,setPlural, setCentsPlural, setCentsSingular} from "numeros_a_palabras/numero_to_word"
import {
  SendFileToDownload,
  getPeriodoFromRequest,
} from "../liquidaciones/liquidaciones-banco/liquidaciones-banco.utils";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { promises as fs } from 'fs';
import { QueryRunner } from "typeorm";

export class RecibosController extends BaseController {
  directory = process.env.PATH_LIQUIDACIONES || "tmp";
  
  directoryRecibo = process.env.PATH_RECIBO || "tmp";
  constructor() {
    super();
    if (!existsSync(this.directoryRecibo)) {
      mkdirSync(this.directoryRecibo, { recursive: true });
    }
  }

  async downloadArchivoRecibo(req: Request, res: Response, next: NextFunction) {

    let usuario = res.locals.userName
    let ip = this.getRemoteAddress(req)
    const queryRunner = dataSource.createQueryRunner();
    try {
      const periodo = getPeriodoFromRequest(req);
      let fechaActual = new Date();
      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, periodo.year, periodo.month, usuario, ip)
      console.log("mes " + periodo.month)
      console.log("anio " + periodo.year)

      console.log("periodo " + periodo_id)

      const movimientosPendientes = await this.getUsuariosLiquidacion(queryRunner,periodo_id)

      var directorPath = this.directoryRecibo+ '/' + String(periodo.year) + String(periodo.month).padStart(2,'0') + '/' + periodo_id
      if (!existsSync(directorPath)) {
        mkdirSync(directorPath, { recursive: true }); 
      }
      for (const movimiento of movimientosPendientes) {

        const filesPath = directorPath + '/' + movimiento.persona_id + '-' + String(periodo.month) +"-"+ String(periodo.year) + ".pdf"
        var doc_id =  await this.getProxNumero(queryRunner, `docgeneral`, usuario, ip)

        if(movimiento.persona_id != null){

        //el objetivo_id para este caso es 0

        await this.setUsuariosLiquidacionDocGeneral(
            queryRunner,
            doc_id,
            periodo_id, 
            fechaActual,
            movimiento.persona_id,
            0,
            directorPath,
            filesPath,
            usuario,
            ip, 
            fechaActual,
            "REC"
            
            )
        }

        const PersonalNombre = movimiento.PersonalNombre
        const Cuit = movimiento.PersonalCUITCUILCUIT
        const Domicilio = movimiento.DomicilioCompleto
       

      this.createPdf(queryRunner,filesPath,movimiento.persona_id,doc_id,fechaActual,PersonalNombre,Cuit,Domicilio,periodo_id)

        
      }

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
    return NumeroALetras(numero).toLowerCase()
  }

  async createPdf(queryRunner:QueryRunner,
                  filesPath:string,
                  persona_id:number,
                  doc_id:number,
                  fechaActual:Date,
                  PersonaNombre:string,
                  Cuit:string,
                  Domicilio:string,
                  periodo_id:number) {


       const dia = fechaActual.getDate();
       const mes = fechaActual.getMonth() + 1; // Suma 1 ya que los meses van de 0 a 11
       const anio = fechaActual.getFullYear();

       const fechaFormateada = `${dia}/${mes}/${anio}`
       
      const liquidacionInfo = await this.getUsuariosLiquidacionMovimientos(queryRunner,periodo_id,persona_id)
       let ingreso = []
        let egreso = []
        let textegreso = []
        let textingreso = []
        let neto = 0
        let retribucion = 0
        let retenciones = 0
        let deposito = []
        let textDeposito = []

        for (const liquidacionElement of liquidacionInfo ) {
          
        
          if(liquidacionElement.indicador =="R"){

            let varEgresoTxt = `${liquidacionElement.des_movimiento} - ${liquidacionElement.detalle},`
             textegreso = [...textegreso, varEgresoTxt]
            //  `${liquidacionElement.des_movimiento}:${liquidacionElement.SumaImporte}`
            let varEgresoNumber = `${liquidacionElement.SumaImporte},`
              egreso = [...egreso, varEgresoNumber]

            //neto = neto + parseFloat(liquidacionElement.SumaImporte)
            retribucion = retribucion + parseFloat(liquidacionElement.SumaImporte)
          }

          if(liquidacionElement.indicador =="D"){
            let DepositoTxt = `${liquidacionElement.detalle},`
            textDeposito = [...textDeposito, DepositoTxt]

            deposito = [...deposito, `${liquidacionElement.SumaImporte},`]
          }
            

          if(liquidacionElement.indicador =="I"){
            let varIngresoTxt = `${liquidacionElement.detalle},`
            textingreso = [...textingreso, varIngresoTxt]
            // let textIngreso = `${liquidacionElement.des_movimiento}:${liquidacionElement.SumaImporte}`
            let varIngresoNumber = `${liquidacionElement.SumaImporte},`
            ingreso = [...ingreso, varIngresoNumber]
            //neto = neto - parseFloat(liquidacionElement.SumaImporte);
            retenciones = retenciones + parseFloat(liquidacionElement.SumaImporte)
          }
          
        }
    
        neto = retenciones - retribucion;
        const textneto = this.convertirNumeroALetras(neto);
        //let textneto = `cien cien cien  `
        const basePath = (process.env.PATH_ASSETS) ? process.env.PATH_ASSETS : './assets' 

        const imgPath = `${basePath}/icons/icon-lince-96x96.png`
        const imgBuffer = await fsPromises.readFile(imgPath);
        const imgBase64 = imgBuffer.toString('base64');

        const imgPathinaes = `${basePath}/icons/inaes.png`
        const imgBufferinaes = await fsPromises.readFile(imgPathinaes);
        const imgBase64inaes = imgBufferinaes.toString('base64');
 

      const htmlFilePath = `${basePath}/html/inaes.html`; 
     
       
      let htmlContent = await fsPromises.readFile(htmlFilePath, 'utf-8');

      htmlContent = htmlContent.replace(/\${imgBase64}/g, imgBase64);
      htmlContent = htmlContent.replace(/\${doc_id}/g, doc_id.toString());
      htmlContent = htmlContent.replace(/\${fechaFormateada}/g, fechaFormateada);
      htmlContent = htmlContent.replace(/\${PersonaNombre}/g, PersonaNombre);
      htmlContent = htmlContent.replace(/\${Cuit}/g, Cuit.toString());
      htmlContent = htmlContent.replace(/\${Domicilio}/g, Domicilio);
      htmlContent = htmlContent.replace(/\${retribucion}/g, retribucion.toFixed(2).toString());
      htmlContent = htmlContent.replace(/\${retenciones}/g, retenciones.toFixed(2).toString()); 

      let VarEgresoTextForHtml = textegreso.map(item => item.toString().replace(/,/g, '<br>')).join().replace(',','')
      htmlContent = htmlContent.replace(/\${textegreso}/g, VarEgresoTextForHtml);
      let varEgreso = egreso.map(item => item.toString().replace(/,/g, '<br>')).join().replace(',','')
      htmlContent = htmlContent.replace(/\${egreso}/g, varEgreso);
      let varIngresoText = textingreso.map(item => item.toString().replace(/,/g, '<br>')).join().replace(',','')
      htmlContent = htmlContent.replace(/\${textingreso}/g, varIngresoText);
      let varIngreso = ingreso.map(item => item.toString().replace(/,/g, '<br>')).join().replace(',','')
      htmlContent = htmlContent.replace(/\${ingreso}/g, varIngreso);

      let varDepositoTxt = textDeposito.map(item => item.toString().replace(/,Banco:/g, '<br>Banco')).join('<br>')
      htmlContent = htmlContent.replace(/\${textDeposito}/g, varDepositoTxt);
      let varDeposito = deposito.map(item => item.toString().replace(/,/g, '<br>')).join().replace(',','')
      htmlContent = htmlContent.replace(/\${deposito}/g, varDeposito);

      htmlContent = htmlContent.replace(/\${textneto}/g, textneto.toString())
      htmlContent = htmlContent.replace(/\${neto}/g, neto.toString());
      htmlContent = htmlContent.replace(/\${imgBase64inaes}/g, imgBase64inaes);
  
      // Inicializa Puppeteer
      const browser = await puppeteer.launch({headless:'new'});
      const page = await browser.newPage();
  
      // Establece el contenido HTML en la página
      await page.setContent(htmlContent);
       await page.pdf({ path: filesPath,  
        margin: { top: '30px', right: '50px', bottom: '100px', left: '50px' },
        printBackground: true,
        format: 'A4', });
     
       await browser.close();
  
  }

 

    
  async getUsuariosLiquidacion(queryRunner:QueryRunner,periodo_id: Number) {
   
    return queryRunner.query( `SELECT DISTINCT
    liq.persona_id,
    CONCAT(TRIM(per.PersonalNombre), ' ', TRIM(per.PersonalApellido)) AS PersonalNombre,
  
    cuit.PersonalCUITCUILCUIT,
    CONCAT(
      TRIM(dom.PersonalDomicilioDomCalle), ' ',
      TRIM(dom.PersonalDomicilioDomNro), ' ',
      TRIM(dom.PersonalDomicilioDomPiso), ' ',
      TRIM(dom.PersonalDomicilioDomDpto)
    ) AS DomicilioCompleto
  FROM lige.dbo.liqmamovimientos AS liq
  JOIN Personal AS per ON per.PersonalId = liq.persona_id
  JOIN PersonalCUITCUIL AS cuit ON cuit.PersonalId = liq.persona_id
  LEFT JOIN PersonalDomicilio AS dom ON dom.PersonalId = liq.persona_id AND dom.PersonalDomicilioActual = 1
  WHERE liq.tipocuenta_id = 'G' AND liq.periodo_id = @0 AND liq.tipo_movimiento_id = 11
  ORDER BY liq.persona_id ASC`, [periodo_id])

  }


  async getUsuariosLiquidacionMovimientos(queryRunner:QueryRunner,periodo_id: Number,user_id: Number) {
   
    return queryRunner.query( `SELECT 
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
    tip.indicador_recibo;`, [periodo_id,user_id])

  }

  
  async setUsuariosLiquidacionDocGeneral(
    queryRunner:any,
    doc_id:number,
    periodo:number, 
    fecha:Date,
    persona_id:number,
    objetivo_id:number,
    path:string,
    nombre_archivo:string,
    usuario:string,
    ip:string,
    audfecha: Date,
    doctipo_id:string
    
    ) {

    return queryRunner.query( `INSERT INTO lige.dbo.docgeneral ("doc_id", "periodo", "fecha", "persona_id", "objetivo_id", "path", "nombre_archivo", "aud_usuario_ins", "aud_ip_ins", "aud_fecha_ins", "aud_usuario_mod", "aud_ip_mod", "aud_fecha_mod", "doctipo_id")
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
      usuario,ip,audfecha,
      usuario,ip,audfecha,
      doctipo_id
      ])

  }

  

}

