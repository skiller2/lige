import { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/baseController";

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
//import { getDocument } from "pdfjs-dist";
import { TextItem, TextMarkedContent } from "pdfjs-dist/types/src/display/api";
//import * as pdfWorker from "pdfjs-dist/build/pdf.worker.mjs";



import {
  existsSync,
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
//import path from "path";
import { DescuentoJSON } from "../schemas/ResponseJSON";
import { Filtro, Options } from "../schemas/filtro";
import { listaColumnas } from "./comprobantes-utils/lista";
import {
  filtrosToSql,
  getOptionsFromRequest,
  isOptions,
  orderToSQL,
} from "./filtros-utils/filtros";
import {
  getPeriodoFromRequest,
} from "./impuestos-afip.utils";
import { getFiltroFromRequest } from "./download-informe-utils/informe-filtro";
import { FileUploadController } from "src/controller/file-upload.controller";
import { basename, join } from "path";



//GlobalWorkerOptions.workerSrc = pdfWorker


const cuitRegex = [
  /:\d{2}\n(\d{11})$/m,
  /control\n(\d{11})$/m,
  /CUIT\/CUIL\/CDI\s(\d{11})/m,
  /^CUIT: (\d{11})$/m,
  /^Identificacion: (\d{11})$/m,
];
const periodoRegex = [
  /PERIODO FISCAL (\d*)\/(\d*)/m,
  /^Fecha Retención\/Percepción[\s]\d{2}\/(\d{2})\/(\d{4})$/m,
  /PERIODO: (\d{2})\/(\d{4})$/m,
  /PERIODO\nFISCAL\n(\d{4})\/(\d{2})$/m,
  /Nro.Factura: (\d{2})\/(\d{4})$/m,

];
const importeMontoRegex = [
  /^\$[\s*](([0-9]{1,3}[,|.]([0-9]{3}[,|.])*[0-9]{3}|[0-9]+)([.|,][0-9][0-9]))?$/m,
  /Monto de la Retención\/Percepción[\s](\d*.\d{2})/m,
  /^IMPORTE: \$(([0-9]{1,3}[,|.]([0-9]{3}[,|.])*[0-9]{3}|[0-9]+)([.|,][0-9][0-9]))$/m,
  /^Importe\n\$\n(([0-9]{1,3}[,|.]([0-9]{3}[,|.])*[0-9]{3}|[0-9]+)([.|,][0-9][0-9]))$/m,
  /^Importe:\s(([0-9]{1,3}[,|.]([0-9]{3}[,|.])*[0-9]{3}|[0-9]+)([.|,][0-9][0-9]))/m,

];

export class ImpuestosAfipController extends BaseController {
  async handleDownloadComprobantesByFiltro(req: Request, res: Response, next: NextFunction) {
    try {
      const descuentoId = process.env.OTRO_DESCUENTO_ID;

      req.body.options.sort = [{ fieldName: 'ApellidoNombre', direction: 'ASC' }]

      const periodo = getPeriodoFromRequest(req);
      const options = getOptionsFromRequest(req);
      const cantxpag = req.body.cantxpag

      const formattedMonth = String(periodo.month).padStart(2, "0");

      const descuentos: DescuentoJSON[] = await this.DescuentosByPeriodo({
        anio: String(periodo.year),
        mes: String(periodo.month),
        descuentoId: descuentoId,
        options,
      });
      const files = descuentos
        .filter(
          (descuento) => descuento.PersonalComprobantePagoAFIPId !== null
        )
        .map((descuento, index) => {
          return {
            name: `${periodo.year}-${formattedMonth}-${descuento.CUIT}-${descuento.PersonalId}.pdf`,
            DocumentoId: descuento.DocumentoId,
            DocumentoPath: descuento.DocumentoPath,
            apellidoNombre: descuento.ApellidoNombre,
            GrupoActividadDetalle: descuento.GrupoActividadDetalle,
          };
        });

      const fileUploadController = new FileUploadController()
      const responsePDFBuffer = await this.PDFmergeFromFiles(files, cantxpag);
      const filename = `${periodo.year}-${formattedMonth}-filtrado.pdf`;
      const tmpfilename = fileUploadController.getRandomTempFileName('.pdf')

      writeFileSync(tmpfilename, responsePDFBuffer);

      res.download(tmpfilename, filename, (msg) => {
        unlinkSync(tmpfilename);
      });



    } catch (error) {
      return next(error)
    }
  }

  async DescuentosByPeriodo(params: {
    anio: string;
    mes: string;
    descuentoId: string;
    options: Options;
  }) {

    const filtros = params.options.filtros;


    const orderBy = orderToSQL(params.options.sort)

    let filtrosConsulta1 = [], filtrosConsulta2 = [];
    let filter1IsActive = false;
    params.options.filtros.forEach(element => {
      switch (element.index) {
        case "Sucursal":
          filtrosConsulta1.push(element);
          filter1IsActive = true;
          break;
        case "GrupoDetalleOBJ":
          filtrosConsulta1.push(element);
          filter1IsActive = true;
          break;
        case "ClienteId":
          filtrosConsulta1.push(element);
          filter1IsActive = true;
          break;
        default:
          filtrosConsulta2.push(element)
          break;
      }
    });

    /*
      Separar filtros en 2 arreglos basándose en el fieldName.  Si fieldName corresponde a consulta1 debería ir a filtrosConsulta1 caso contrario ir a filtrosConsulta2     
    */

    let filterSql1 = filtrosToSql(filtrosConsulta1, listaColumnas);
    let filterSql2 = filtrosToSql(filtrosConsulta2, listaColumnas);


    if (filter1IsActive) {
      const personalIdArr = await dataSource.query(`SELECT 
      suc.SucursalId, 
      obja.ObjetivoAsistenciaAnoAno, objm.ObjetivoAsistenciaAnoMesMes, 
      persona.PersonalId, cuit.PersonalCUITCUILCUIT, persona.PersonalApellido, persona.PersonalNombre, 
      
      ga.GrupoActividadId, ga.GrupoActividadNumero, ga.GrupoActividadDetalle,
  
      
      
      obj.ClienteId,
      obj.ClienteElementoDependienteId, eledep.ClienteElementoDependienteDescripcion,
      cli.ClienteNombreFantasia, cli.ClienteDenominacion,
      
      1
      
      FROM ObjetivoAsistenciaAnoMesPersonalDias objd
      JOIN ObjetivoAsistenciaAnoMes objm ON objm.ObjetivoAsistenciaAnoMesId = objd.ObjetivoAsistenciaAnoMesId AND objm.ObjetivoAsistenciaAnoId = objd.ObjetivoAsistenciaAnoId AND objm.ObjetivoId = objd.ObjetivoId
      JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objm.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objm.ObjetivoId
      JOIN Objetivo obj ON obj.ObjetivoId = obja.ObjetivoId
      JOIN Personal persona ON persona.PersonalId = objd.ObjetivoAsistenciaMesPersonalId
      JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = persona.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = persona.PersonalId) 
  
      
      LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
      
      LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId 
      
      LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(eledep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
      
      LEFT JOIN GrupoActividadObjetivo gap ON gap.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND  DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01')  BETWEEN gap.GrupoActividadObjetivoDesde  AND ISNULL(gap.GrupoActividadObjetivoHasta,'9999-12-31')
      LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId
    
      WHERE obja.ObjetivoAsistenciaAnoAno = @1 AND objm.ObjetivoAsistenciaAnoMesMes = @2 AND ${filterSql1} `, [, params.anio, params.mes])
      let listPersonalId = ''

      personalIdArr.forEach(row => {
        listPersonalId += row.PersonalId + ','
      });

      listPersonalId += '0'
      filterSql2 += `AND per.PersonalId IN (${listPersonalId})`
    }

    return dataSource.query(
      `SELECT DISTINCT 
      CONCAT(per.PersonalId,'-',com.PersonalComprobantePagoAFIPId,'-',des.PersonalOtroDescuentoId,'-',doc.DocumentoId) id,
      per.PersonalId PersonalId,
      
      cuit2.PersonalCUITCUILCUIT AS CUIT, CONCAT(TRIM(per.PersonalApellido), ',', TRIM(per.PersonalNombre)) ApellidoNombre,

ga.GrupoActividadId, ga.GrupoActividadNumero, ga.GrupoActividadDetalle,
     
      com.PersonalComprobantePagoAFIPId, com.PersonalComprobantePagoAFIPAno, com.PersonalComprobantePagoAFIPMes, com.PersonalComprobantePagoAFIPImporte monto,
      des.PersonalOtroDescuentoImporteVariable montodescuento, 
    excep.PersonalExencionCUIT, 
 	 sitrev.PersonalSituacionRevistaMotivo, sit.SituacionRevistaId, sit.SituacionRevistaDescripcion, sitrev.PersonalSituacionRevistaDesde, sitrev.PersonalSituacionRevistaHasta,
 	 doc.DocumentoId, doc.DocumentoPath,
    2
     FROM PersonalImpuestoAFIP imp

      JOIN Personal per ON per.PersonalId = imp.PersonalId
     LEFT JOIN PersonalOtroDescuento des ON des.PersonalId = imp.PersonalId AND des.PersonalOtroDescuentoDescuentoId=@3 AND des.PersonalOtroDescuentoAnoAplica = @1 AND des.PersonalOtroDescuentoMesesAplica = @2
     LEFT JOIN PersonalComprobantePagoAFIP com ON com.PersonalId = per.PersonalId AND com.PersonalComprobantePagoAFIPAno =@1 AND com.PersonalComprobantePagoAFIPMes=@2

     LEFT JOIN lige.dbo.liqmaperiodo peri ON peri.anio = @1 AND peri.mes = @2
     LEFT JOIN Documento doc ON doc.PersonalId = com.PersonalId AND doc.DocumentoTipoCodigo='MONOT' AND doc.DocumentoAnio = peri.anio AND doc.DocumentoMes = peri.mes 

	LEFT JOIN 
  	( SELECT  gap2.GrupoActividadPersonalPersonalId, MAX(gap2.GrupoActividadId) GrupoActividadId FROM GrupoActividadPersonal gap2
	  WHERE 
	  EOMONTH(DATEFROMPARTS(@1,@2,1)) > gap2.GrupoActividadPersonalDesde AND EOMONTH(DATEFROMPARTS(@1,@2,1)) < ISNULL(gap2.GrupoActividadPersonalHasta , '9999-12-31')
	  GROUP BY gap2.GrupoActividadPersonalPersonalId
	  ) gap3 ON gap3.GrupoActividadPersonalPersonalId = imp.PersonalId 
  LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = imp.PersonalId AND gap.GrupoActividadId = gap3.GrupoActividadId
  LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId

  LEFT JOIN PersonalCUITCUIL cuit2 ON cuit2.PersonalId = per.PersonalId AND cuit2.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
  LEFT JOIN PersonalExencion excep ON excep.PersonalId = per.PersonalId AND EOMONTH(DATEFROMPARTS(@1,@2,1)) > excep.PersonalExencionDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(excep.PersonalExencionHasta,'9999-12-31')        

  LEFT JOIN 
		(
		SELECT sitrev2.PersonalId, MAX(sitrev2.PersonalSituacionRevistaId) PersonalSituacionRevistaId
		FROM PersonalSituacionRevista sitrev2 
		WHERE EOMONTH(DATEFROMPARTS(@1,@2,1)) >  sitrev2.PersonalSituacionRevistaDesde AND  DATEFROMPARTS(@1,@2,1) < ISNULL(sitrev2.PersonalSituacionRevistaHasta,'9999-12-31')
		GROUP BY sitrev2.PersonalId
      ) sitrev3  ON sitrev3.PersonalId = per.PersonalId
   LEFT JOIN PersonalSituacionRevista sitrev ON sitrev.PersonalId = per.PersonalId AND sitrev.PersonalSituacionRevistaId = sitrev3.PersonalSituacionRevistaId

   LEFT JOIN SituacionRevista sit ON sit.SituacionRevistaId = sitrev.PersonalSituacionRevistaSituacionId
     WHERE
   1=1

   AND EOMONTH(DATEFROMPARTS(@1,@2,1)) > imp.PersonalImpuestoAFIPDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(imp.PersonalImpuestoAFIPHasta,'9999-12-31')
--     AND excep.PersonalExencionCUIT IS NULL

	-- AND sit.SituacionRevistaId NOT IN (3,13,19,21,15,17,14,27,8,24,7)
  AND (sit.SituacionRevistaId  IN (2,4,5,6,9,10,11,12,20,23,26) OR com.PersonalComprobantePagoAFIPId IS NOT NULL)
    AND (${filterSql2}) 
    ${orderBy}
   `,
      [, params.anio, params.mes, params.descuentoId]
    );
  }

  getDescuentosByPeriodo(options: {
    anio: string;
    mes: string;
    GrupoActividadId: string;
  }) {
    const extrafilter =
      options.GrupoActividadId && options.GrupoActividadId != "0"
        ? "AND gap.GrupoActividadId = @4"
        : "";

    return dataSource.query(
      `SELECT 
      per.PersonalId PersonalId,
      
      cuit2.PersonalCUITCUILCUIT AS CUIT, CONCAT(TRIM(per.PersonalApellido), ',', TRIM(per.PersonalNombre)) ApellidoNombre,

		ga.GrupoActividadId, ga.GrupoActividadNumero, ga.GrupoActividadDetalle,

    com.PersonalComprobantePagoAFIPId, com.PersonalComprobantePagoAFIPAno, com.PersonalComprobantePagoAFIPMes, com.PersonalComprobantePagoAFIPImporte monto,
    des.PersonalOtroDescuentoImporteVariable montodescuento, 

    excep.PersonalExencionCUIT, 
 	 sitrev.PersonalSituacionRevistaMotivo, sit.SituacionRevistaId, sit.SituacionRevistaDescripcion, sitrev.PersonalSituacionRevistaDesde, sitrev.PersonalSituacionRevistaHasta,
    3
     FROM PersonalImpuestoAFIP imp

    JOIN Personal per ON per.PersonalId = imp.PersonalId
     LEFT JOIN PersonalComprobantePagoAFIP com ON com.PersonalId = per.PersonalId AND com.PersonalComprobantePagoAFIPAno =@1 AND com.PersonalComprobantePagoAFIPMes=@2
     LEFT JOIN PersonalOtroDescuento des ON des.PersonalId = imp.PersonalId AND des.PersonalOtroDescuentoDescuentoId=@3 AND des.PersonalOtroDescuentoAnoAplica = @1 AND des.PersonalOtroDescuentoMesesAplica = @2
 
	LEFT JOIN 
  	( SELECT  gap2.GrupoActividadPersonalPersonalId, MAX(gap2.GrupoActividadId) GrupoActividadId FROM GrupoActividadPersonal gap2
	  WHERE 
	  EOMONTH(DATEFROMPARTS(@1,@2,1)) > gap2.GrupoActividadPersonalDesde AND EOMONTH(DATEFROMPARTS(@1,@2,1)) < ISNULL(gap2.GrupoActividadPersonalHasta , '9999-12-31')
	  GROUP BY gap2.GrupoActividadPersonalPersonalId
	  ) gap3 ON gap3.GrupoActividadPersonalPersonalId = imp.PersonalId 
  LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = imp.PersonalId AND gap.GrupoActividadId = gap3.GrupoActividadId
	  LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId
  
     LEFT JOIN PersonalCUITCUIL cuit2 ON cuit2.PersonalId = per.PersonalId AND cuit2.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
     LEFT JOIN PersonalExencion excep ON excep.PersonalId = per.PersonalId AND EOMONTH(DATEFROMPARTS(@1,@2,1)) > excep.PersonalExencionDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(excep.PersonalExencionHasta,'9999-12-31')        



  LEFT JOIN 
		(
		SELECT sitrev2.PersonalId, MAX(sitrev2.PersonalSituacionRevistaId) PersonalSituacionRevistaId
		FROM PersonalSituacionRevista sitrev2 
		WHERE EOMONTH(DATEFROMPARTS(@1,@2,1)) >  sitrev2.PersonalSituacionRevistaDesde AND  DATEFROMPARTS(@1,@2,1) < ISNULL(sitrev2.PersonalSituacionRevistaHasta,'9999-12-31')
		GROUP BY sitrev2.PersonalId
      ) sitrev3  ON sitrev3.PersonalId = per.PersonalId
   LEFT JOIN PersonalSituacionRevista sitrev ON sitrev.PersonalId = per.PersonalId AND sitrev.PersonalSituacionRevistaId = sitrev3.PersonalSituacionRevistaId
     LEFT JOIN SituacionRevista sit ON sit.SituacionRevistaId = sitrev.PersonalSituacionRevistaSituacionId
     WHERE
   1=1

   AND EOMONTH(DATEFROMPARTS(@1,@2,1)) > imp.PersonalImpuestoAFIPDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(imp.PersonalImpuestoAFIPHasta,'9999-12-31')
   AND excep.PersonalExencionCUIT IS null
   AND sit.SituacionRevistaId  IN (2,4,5,6,9,10,11,12,20,23,26)
     ${extrafilter} 
   `,
      [, options.anio, options.mes, process.env.OTRO_DESCUENTO_ID, options.GrupoActividadId]
    );
  }

  async getDescuentosGridCols(req: Request, res: Response) {
    this.jsonRes(listaColumnas, res);
  }

  async getDescuentosGridList(req: Request, res: Response, next: NextFunction) {
    const anio = String(req.body.anio);
    const mes = String(req.body.mes);
    const options: Options = isOptions(req.body.options)
      ? req.body.options
      : { filtros: [], sort: null };

    const descuentoId = process.env.OTRO_DESCUENTO_ID;

    try {
      const listaDescuentos = await this.DescuentosByPeriodo({
        anio,
        mes,
        descuentoId,
        options,
      });

      this.jsonRes(
        {
          total: listaDescuentos.length,
          list: listaDescuentos,
        },
        res
      );
    } catch (error) {
      return next(error)
    }
  }

  async handleGetDescuentos(req: Request, res: Response, next: NextFunction) {
    const anio = req.params.anio;
    const mes = req.params.mes;
    const GrupoActividadId = req.params.GrupoActividadId;

    try {
      const result: DescuentoJSON[] = await this.getDescuentosByPeriodo({
        anio,
        mes,
        GrupoActividadId,
      });
      const sincomprobante = result.reduce(
        (total, item: any) =>
          item.PersonalComprobantePagoAFIPId == null ? total + 1 : total,
        0
      );
      this.jsonRes(
        {
          RegistrosConComprobantes: result.length - sincomprobante,
          RegistrosSinComprobantes: sincomprobante,
          Registros: result,
        },
        res
      );
    } catch (error) {
      console.log(error)
      return next(error)
    }
  }

  async insertPDF(
    queryRunner,
    CUIT,
    anioRequest,
    mesRequest,
    importeMonto: number,
    file,
    pagenum,
    forzado: boolean,
    ip: string,
    usuario: string
  ) {
    const recibosGenerados = await queryRunner.query(
      `SELECT periodo_id, anio, mes, ind_recibos_generados
      FROM lige.dbo.liqmaperiodo WHERE anio = @0 AND mes = @1 AND ind_recibos_generados = 1`,
      [anioRequest, mesRequest]
    );

    let updateFile = false

    const actual = new Date()

    const [personalIDQuery] = await queryRunner.query(
      `SELECT cuit.PersonalId, per.PersonalOtroDescuentoUltNro, per.PersonalComprobantePagoAFIPUltNro, CONCAT(per.PersonalApellido,', ',per.PersonalNombre) ApellidoNombre, excep.PersonalExencionCUIT 
      FROM PersonalCUITCUIL cuit 
      JOIN Personal per ON per.PersonalId = cuit.PersonalId
      LEFT JOIN PersonalExencion excep ON excep.PersonalId = per.PersonalId AND EOMONTH(DATEFROMPARTS(@1,@2,1)) > excep.PersonalExencionDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(excep.PersonalExencionHasta,'9999-12-31')        
 
      WHERE cuit.PersonalCUITCUILCUIT = @0`,
      [Number(CUIT), anioRequest, mesRequest]
    );

    if (!personalIDQuery?.PersonalId)
      throw new ClientException(`No se pudo encontrar el CUIT ${CUIT}`);

    if (importeMonto < 1000)
      throw new ClientException(`El importe no es válido`);

    const personalID = personalIDQuery.PersonalId;

    const PersonalExencionCUIT = personalIDQuery.PersonalExencionCUIT;
    let PersonalComprobantePagoAFIPUltNro = Number(personalIDQuery.PersonalComprobantePagoAFIPUltNro);
    let PersonalOtroDescuentoUltNro = Number(personalIDQuery.PersonalOtroDescuentoUltNro);

    const alreadyExists = await queryRunner.query(
      `SELECT pag.PersonalComprobantePagoAFIPId, pag.PersonalComprobantePagoAFIPImporte, pag.PersonalComprobantePagoAFIPAno,pag.PersonalComprobantePagoAFIPMes,doc.DocumentoId
        FROM PersonalComprobantePagoAFIP pag 
        LEFT JOIN lige.dbo.liqmaperiodo per ON per.anio = @1 AND per.mes = @2
        LEFT JOIN Documento doc ON doc.PersonalId = pag.PersonalId AND doc.DocumentoTipoCodigo='MONOT' AND doc.DocumentoAnio = per.anio AND doc.DocumentoMes = per.mes
        WHERE pag.PersonalId = @0 AND pag.PersonalComprobantePagoAFIPAno = @1 AND pag.PersonalComprobantePagoAFIPMes = @2`,
      [
        personalID,
        anioRequest,
        mesRequest,
      ]
    );


    const DocumentoId = alreadyExists[0]?.DocumentoId

    updateFile = false
    if (alreadyExists.length == 0) {
      const now = new Date();



      PersonalComprobantePagoAFIPUltNro++
      await queryRunner.query(
        `INSERT INTO PersonalComprobantePagoAFIP (PersonalComprobantePagoAFIPId, PersonalId, PersonalComprobantePagoAFIPAno,PersonalComprobantePagoAFIPMes,PersonalComprobantePagoAFIPImporte)
      VALUES (@0, @1, @2, @3, @4)`,
        [
          PersonalComprobantePagoAFIPUltNro,
          personalID,
          anioRequest,
          mesRequest,
          importeMonto
        ]
      );


      // verificar que el periodo no tenga los recibos generados

      if (PersonalExencionCUIT != 1 && recibosGenerados.length == 0) {

        PersonalOtroDescuentoUltNro++
        await queryRunner.query(
          `INSERT INTO PersonalOtroDescuento (PersonalOtroDescuentoId, PersonalId, PersonalOtroDescuentoDescuentoId, PersonalOtroDescuentoAnoAplica
          , PersonalOtroDescuentoMesesAplica, PersonalOtroDescuentoMes, PersonalOtroDescuentoCantidad, PersonalOtroDescuentoCantidadCuotas
          , PersonalOtroDescuentoImporteVariable, PersonalOtroDescuentoFechaAplica, PersonalOtroDescuentoCuotasPagas, PersonalOtroDescuentoLiquidoFinanzas
          , PersonalOtroDescuentoCuotaUltNro, PersonalOtroDescuentoUltimaLiquidacion, PersonalOtroDescuentoDetalle
          , PersonalOtroDescuentoAudFechaIng, PersonalOtroDescuentoAudUsuarioIng, PersonalOtroDescuentoAudIpIng, PersonalOtroDescuentoAudFechaMod, PersonalOtroDescuentoAudUsuarioMod, PersonalOtroDescuentoAudIpMod)
           VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15, @16, @17,@15, @16, @17)`,
          [
            PersonalOtroDescuentoUltNro,
            personalID,
            Number(process.env.OTRO_DESCUENTO_ID),
            anioRequest,
            mesRequest,
            mesRequest,
            1,
            1,
            importeMonto,
            now,
            0,
            0,
            null,
            "",
            `${mesRequest}/${anioRequest}`, //detalle
            actual,
            usuario,
            ip

          ]
        );
        const PersonalOtroDescuentoCuotaId = 1;
        await queryRunner.query(`
            INSERT INTO PersonalOtroDescuentoCuota (
          PersonalOtroDescuentoCuotaId, PersonalOtroDescuentoId, PersonalId,
          PersonalOtroDescuentoCuotaAno, PersonalOtroDescuentoCuotaMes, PersonalOtroDescuentoCuotaCuota,
          PersonalOtroDescuentoCuotaImporte, PersonalOtroDescuentoCuotaMantiene, PersonalOtroDescuentoCuotaFinalizado, PersonalOtroDescuentoCuotaProceso, 
          AudFechaIng, AudUsuarioIng, AudIpIng, AudFechaMod, AudUsuarioMod, AudIpMod)
          VALUES (@0,@1,@2, @3,@4,@5, @6,@7,@8, @9, @10,@11,@12, @10,@11,@12)
        `, [PersonalOtroDescuentoCuotaId, PersonalOtroDescuentoUltNro, personalID, anioRequest, mesRequest, 1, importeMonto, 0, 0, 'FA', actual, usuario, ip]);

        await queryRunner.query(`UPDATE PersonalOtroDescuento SET PersonalOtroDescuentoCuotaUltNro = @2 WHERE PersonalId =@0 AND PersonalOtroDescuentoId=@1`, [personalID, PersonalOtroDescuentoUltNro, PersonalOtroDescuentoCuotaId])

        await queryRunner.query(
          `UPDATE Personal SET PersonalOtroDescuentoUltNro = @0, PersonalComprobantePagoAFIPUltNro=@1 WHERE PersonalId = @2`,
          [PersonalOtroDescuentoUltNro, PersonalComprobantePagoAFIPUltNro, personalID]
        );
      }


      updateFile = true

    } else {  //Hay uno cargado
      const PersonalComprobantePagoAFIPId = alreadyExists[0].PersonalComprobantePagoAFIPId
      const PersonalComprobantePagoAFIPImporte = alreadyExists[0].PersonalComprobantePagoAFIPImporte
      if (PersonalComprobantePagoAFIPImporte != importeMonto) {
        await queryRunner.query(
          `UPDATE PersonalComprobantePagoAFIP SET PersonalComprobantePagoAFIPImporte=@2 WHERE PersonalComprobantePagoAFIPId = @0 AND PersonalId = @1`,
          [PersonalComprobantePagoAFIPId, personalID, importeMonto]
        );

        if (PersonalExencionCUIT != 1 && recibosGenerados.length == 0) {

          await queryRunner.query(
            `UPDATE PersonalOtroDescuento SET PersonalOtroDescuentoImporteVariable=@2, PersonalOtroDescuentoAudFechaMod=@6, PersonalOtroDescuentoAudUsuarioMod=@7, PersonalOtroDescuentoAudIpMod=@8 
            WHERE PersonalId = @1 AND PersonalOtroDescuentoDescuentoId=@3 AND PersonalOtroDescuentoAnoAplica=@4 AND PersonalOtroDescuentoMesesAplica=@5`,
            [PersonalComprobantePagoAFIPId, personalID, importeMonto, Number(process.env.OTRO_DESCUENTO_ID), anioRequest, mesRequest, actual, usuario, ip]
          );
          await queryRunner.query(`UPDATE cuota SET cuota.PersonalOtroDescuentoCuotaImporte=@2, cuota.AudFechaMod=@5, cuota.AudUsuarioMod=@6, cuota.AudIpMod=@7
          FROM PersonalOtroDescuentoCuota cuota
          JOIN PersonalOtroDescuento otrodes ON cuota.PersonalOtroDescuentoId = otrodes.PersonalOtroDescuentoId and cuota.PersonalId=otrodes.PersonalId
          WHERE otrodes.PersonalOtroDescuentoDescuentoId=@0 AND otrodes.PersonalId= @1 AND otrodes.PersonalOtroDescuentoAnoAplica =@3 AND otrodes.PersonalOtroDescuentoMesesAplica=@4`,
            [Number(process.env.OTRO_DESCUENTO_ID), personalID, importeMonto, anioRequest, mesRequest, actual, usuario, ip])
        }
        updateFile = true
      }

    }
    if (updateFile || forzado) {
      const fileObj = {
        doctipo_id: "MONOT",
        tableForSearch: "Documento",
        ind_descarga_bot: 0,
        tempfilename: file.filename,
        originalname: file.originalname,
        fielname: '',
        mimetype: file.mimetype
      }
      /*
            mkdirSync(`${this.directory}/${anioRequest}`, { recursive: true });
            const newFilePath = `${this.directory
              }/${anioRequest}/${anioRequest}-${mesRequest
                .toString()
                .padStart(2, "0")}-${CUIT}-${personalID}.pdf`;
      
            if (existsSync(newFilePath)) {
              unlinkSync(newFilePath)
            }
      */

      if (pagenum == null) {

        await FileUploadController.handleDOCUpload(personalID, null, null, DocumentoId, new Date(anioRequest, mesRequest - 1, 21), null, `${CUIT}-${anioRequest}-${mesRequest}`, anioRequest, mesRequest, fileObj, usuario, ip, queryRunner)
      } else {
        const currentFileBuffer = readFileSync(file.path);
        const fileUploadController = new FileUploadController()
        const pdfDoc = await PDFDocument.create();
        const srcDoc = await PDFDocument.load(currentFileBuffer);

        const copiedPages = await pdfDoc.copyPages(srcDoc, [pagenum - 1]);
        const [copiedPage] = copiedPages;

        pdfDoc.addPage(copiedPage);
        const buffer = await pdfDoc.save();

        const tempfilename = fileUploadController.getRandomTempFileName('.pdf')
        writeFileSync(tempfilename, buffer);
        fileObj.tempfilename = basename(tempfilename)
        await FileUploadController.handleDOCUpload(personalID, null, null, DocumentoId, new Date(anioRequest, mesRequest - 1, 21), null, `${CUIT}-${anioRequest}-${mesRequest}`, anioRequest, mesRequest, fileObj, usuario, ip, queryRunner)

      }
    }
  }


  removeDotsExceptLast(input: string): string {
    const lastDotIndex = input.lastIndexOf('.');
    if (lastDotIndex === -1) return input;

    const beforeLastDot = input.slice(0, lastDotIndex).replace(/\./g, '');
    const afterLastDot = input.slice(lastDotIndex);
    return beforeLastDot + afterLastDot;
  }


  async handlePDFUpload(req: Request, res: Response, next: NextFunction, forzado: boolean) {
    const file = req.file;
    const anioRequest: number = req.body.anio;
    const mesRequest: number = req.body.mes;
    const queryRunner = dataSource.createQueryRunner();

    try {
      if (!anioRequest) throw new ClientException("Faltó indicar el anio.");
      if (!anioRequest) throw new ClientException("Faltó indicar el mes.");

      await queryRunner.connect();
      //await queryRunner.startTransaction();

      let CUIT: string;
      let importeMonto: number;

      if (forzado) {
        const importeRequest = req.body.monto;
        const cuitRequest = req.body.cuit;

        if (!importeRequest) throw new ClientException("Faltó indicar el importe.");
        importeMonto = importeRequest;

        if (!cuitRequest) throw new ClientException("Faltó indicar el cuit.");
        CUIT = cuitRequest;

        //Call to writefile
        await queryRunner.startTransaction()
        const ip = this.getRemoteAddress(req)
        const usuario = res.locals.userName

        await this.insertPDF(
          queryRunner,
          CUIT,
          anioRequest,
          mesRequest,
          importeMonto,
          file,
          null,
          forzado,
          ip,
          usuario
        );
        await queryRunner.commitTransaction()

      } else {
        const loadingTask = getDocument(file.path);

        const document = await loadingTask.promise;

        let errList: Array<any> = [];
        for (let pagenum = 1; pagenum <= document.numPages; pagenum++) {
          //        for (let pagenum = 1; pagenum <= 1; pagenum++) {

          const page = await document.getPage(pagenum);

          const textContent = await page.getTextContent();

          const textContentItems: (TextItem | TextMarkedContent)[] =
            textContent.items.filter(function (value: any, index, arr) {
              return value.str.trim() != "";
            });

          let textdocument = "";

          textContent.items.forEach((item: TextItem) => {
            textdocument += item.str + '\n'
          });

          textContent.items.forEach((item: TextItem) => {
            textdocument += item.str + ((item.hasEOL) ? '\n' : '')
          });

          let [, periodoAnio, periodoMes] = this.getByRegexText(
            textdocument,
            periodoRegex,
            new ClientException("No se pudo encontrar el periodo.", textdocument)
          );

          [, CUIT] = this.getByRegexText(
            textdocument,
            cuitRegex,
            new ClientException("No se pudo encontrar el CUIT.", textdocument)
          );

          let [, importeMontoTemp] = this.getByRegexText(
            textdocument,
            importeMontoRegex,
            new ClientException("No se pudo encontrar el monto.")
          );

          importeMontoTemp = importeMontoTemp.replace(",", ".")
          importeMontoTemp = this.removeDotsExceptLast(importeMontoTemp)


          importeMonto = parseFloat(importeMontoTemp);

          let periodoIsValid =
            Number(periodoAnio) == anioRequest &&
            Number(periodoMes) == mesRequest;

          if (!periodoIsValid) {
            const tmp = periodoAnio;
            periodoAnio = periodoMes;
            periodoMes = tmp;
          }

          periodoIsValid =
            Number(periodoAnio) == anioRequest &&
            Number(periodoMes) == mesRequest;

          if (!periodoIsValid)
            throw new ClientException(
              `El periodo especificado ${anioRequest}-${mesRequest} no coincide con el contenido en el documento ${periodoAnio}-${Number(
                periodoMes
              )}.`
            );

          try {
            await queryRunner.startTransaction()
            const ip = this.getRemoteAddress(req)
            const usuario = res.locals.userName


            await this.insertPDF(
              queryRunner,
              CUIT,
              anioRequest,
              mesRequest,
              importeMonto,
              file,
              pagenum,
              forzado,
              ip, usuario
            );

            await queryRunner.commitTransaction()
          } catch (err: any) {
            await this.rollbackTransaction(queryRunner)
            errList.push(err);
          }
        }

        let errTxt = "";
        if (errList.length > 0) {
          errList.forEach((err) => {
            errTxt += err.message + "\n";
          });
          throw new ClientException(errTxt)
        }
      }
      // if (!file) throw new ClientException("File not recieved/did not pass filter.");
      // if (!anioRequest) throw new ClientException("No se especificó un año.");
      // if (!mesRequest) throw new ClientException("No se especificó un mes.");

      //await queryRunner.commitTransaction();

      this.jsonRes([], res, "PDF Recibido!");
    } catch (error) {
      console.log(error)
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release();
      unlinkSync(file.path);
    }
  }

  getByRegexText(
    txt: string,
    regexExp: RegExp[],
    err = new Error("Could not find content.")
  ): RegExpMatchArray {
    let result: RegExpMatchArray;

    for (const re of regexExp) {
      result = txt.match(re);
      if (result) break;
    }

    if (!result) throw err;
    return result;
  }

  getByRegex(
    textContentItems: (TextItem | TextMarkedContent)[],
    regex: RegExp,
    err = new Error("Could not find content.")
  ): RegExpMatchArray {
    const result = textContentItems.find((item) =>
      regex.test((item as TextItem).str)
    );
    if (!result) throw err;
    return (result as TextItem).str.match(regex);
  }

  async downloadComprobantesByPeriodo(
    year: string,
    month: string,
    personalIdRel: string,
    res: Response,
    next: NextFunction
  ) {
    try {
      const formattedMonth = month.padStart(2, "0");

      const descuentoId = process.env.OTRO_DESCUENTO_ID;

      let filtros: Filtro[] = []

      //      if (personalIdRel != '')
      //        filtros.push({ index: 'PersonalIdJ', operador: '=', condition: 'AND', valor: [personalIdRel] })

      const descuentos: DescuentoJSON[] = await this.DescuentosByPeriodo({
        anio: year,
        mes: month,
        descuentoId: descuentoId,
        options: { filtros: filtros, sort: [], extra: null }
      });

      const files = descuentos
        .filter(
          (descuento) => descuento.PersonalComprobantePagoAFIPId !== null
        )
        .map((descuento, index) => {
          return {
            name: `${year}-${formattedMonth}-${descuento.CUIT}-${descuento.PersonalId}.pdf`,
            apellidoNombre: descuento.ApellidoNombre,
            GrupoActividadDetalle: descuento.GrupoActividadDetalle,
            DocumentoPath: descuento.DocumentoPath
          };
        });

      const responsePDFBuffer = await this.PDFmergeFromFiles(files, 4);
      const fileUploadController = new FileUploadController()
      const tmpfilename = fileUploadController.getRandomTempFileName('.pdf');
      const filename = `${year}-${formattedMonth}.pdf`;

      writeFileSync(tmpfilename, responsePDFBuffer);

      res.download(tmpfilename, filename, (msg) => {
        unlinkSync(tmpfilename);
      });
    } catch (error) {
      console.log(error)
      return next(error)
    }
  }

  async PDFmergeFromFiles(
    files: {
      name: string;
      apellidoNombre: string;
      GrupoActividadDetalle: string;
      DocumentoPath: string
    }[],
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
      const fullPath = join(FileUploadController.pathDocuments, file.DocumentoPath)

      if (locationIndex === 0) lastPage = newDocument.addPage(PageSizes.A4);

      const fileExists = existsSync(fullPath);

      const pageWidth = lastPage.getWidth();
      const pageHeight = lastPage.getHeight();

      if (fileExists) {
        currentFileBuffer = readFileSync(fullPath);
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
        } else if (
          currentFilePDFPage.getWidth() == 595.32001 &&
          currentFilePDFPage.getHeight() == 841.92004
        ) {
          origenComprobante = "MANUAL"
          embeddedPage = await newDocument.embedPage(currentFilePDFPage, {
            top: 830, bottom: 450, left: 167, right: 430
          },
          );
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
          case "AFIP":
            lastPage.drawText(
              `Grupo: ${file.GrupoActividadDetalle}`,
              {
                x: positionFromIndex.x + 22,
                y: positionFromIndex.y + 25,
                size: 5,
                color: rgb(0, 0, 0),
                lineHeight: 6,
                //opacity: 0.75,
              }
            );

            lastPage.drawText(
              `COMPROBANTE DE PAGO`,
              {
                x: positionFromIndex.x + 125,
                y: positionFromIndex.y + 215,
                size: 8,
                color: rgb(0, 0, 0),
                lineHeight: 6,
                //opacity: 0.75,
              }
            );


            lastPage.drawText(
              `352-CONTRIBUCIONES OBRA SOCIAL`,
              {
                x: positionFromIndex.x + 123,
                y: positionFromIndex.y + 95,
                size: 4.5,
                color: rgb(0, 0, 0),
                lineHeight: 6,
                //opacity: 0.75,
              }
            );

            break
          case "PAGO":
          case "MANUAL":
            lastPage.drawText(
              `${file.apellidoNombre}\n\Grupo: ${file.GrupoActividadDetalle}`,
              {
                x: positionFromIndex.x + 22,
                y: positionFromIndex.y + 65,
                size: 10,
                color: rgb(0, 0, 0),
                lineHeight: 6,
                //opacity: 0.75,
              }
            );

            break
          default:
            lastPage.drawText(
              `${file.apellidoNombre}\n\Grupo: ${file.GrupoActividadDetalle}`,
              {
                x: positionFromIndex.x + 22,
                y: positionFromIndex.y + 65,
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


  async downloadPersonaF184(PersonalId: number, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const pathArchivos = (process.env.PATH_ARCHIVOS) ? process.env.PATH_ARCHIVOS : '.'
    try {
      const fechaActual = new Date();
      const ds = await queryRunner
        .query(
          `SELECT mono.PersonalId, mono.PersonalImpuestoAFIPDesde, mono.PersonalImpuestoAFIPHasta, dir.DocumentoImagenParametroDirectorioPath, pdf.DocumentoImagenImpuestoAFIPBlobNombreArchivo FROM PersonalImpuestoAFIP mono
        JOIN DocumentoImagenImpuestoAFIP pdf ON pdf.PersonalId = mono.PersonalId AND pdf.DocumentoImagenImpuestoAFIPId = mono.PersonalImpuestoAFIPDocumentoF184Id
        JOIN DocumentoImagenParametroDirectorio dir ON dir.DocumentoImagenParametroDirectorioId = pdf.DocumentoImagenParametroDirectorioId AND dir.DocumentoImagenParametroId =  pdf.DocumentoImagenParametroId
        JOIN DocumentoImagenParametro par ON par.DocumentoImagenParametroId = pdf.DocumentoImagenParametroId
        WHERE mono.PersonalId = @0 AND mono.PersonalImpuestoAFIPDesde<=@1 AND ISNULL(mono.PersonalImpuestoAFIPHasta,'9999-12-31') >= @1`,
          [PersonalId, fechaActual]
        )

      if (ds.length == 0)
        throw new ClientException(`Documento no existe para la persona`);

      const downloadPath = `${pathArchivos}/${ds[0].DocumentoImagenParametroDirectorioPath.replaceAll('\\', '/')}/${ds[0].DocumentoImagenImpuestoAFIPBlobNombreArchivo}`;

      if (!existsSync(downloadPath))
        throw new ClientException(`El archivo F184 no existe`, { 'path': downloadPath });

      res.download(downloadPath, ds[0].DocumentoImagenImpuestoAFIPBlobNombreArchivo, (msg) => { });

    } catch (error) {
      console.log(error)
      return next(error)
    }
  }



  async downloadComprobante(
    year: string,
    month: string,
    cuit: string,
    personalId: string,
    res: Response,
    next: NextFunction
  ) {
    const queryRunner = dataSource.createQueryRunner();

    const fileUploadController = new FileUploadController();
    const tmpfilename = fileUploadController.getRandomTempFileName('.pdf');
    try {
      const [comprobante] = await queryRunner.query(
        `SELECT DISTINCT
        per.PersonalId PersonalId, cuit2.PersonalCUITCUILCUIT AS CUIT, CONCAT(TRIM(per.PersonalApellido), ',', TRIM(per.PersonalNombre)) ApellidoNombre,
        com.PersonalComprobantePagoAFIPAno,com.PersonalComprobantePagoAFIPMes,com.PersonalComprobantePagoAFIPImporte,
        ga.GrupoActividadId, ga.GrupoActividadNumero, ga.GrupoActividadDetalle, doc.DocumentoId, doc.DocumentoPath, doc.DocumentoNombreArchivo,
        1
        FROM Personal per
        JOIN PersonalComprobantePagoAFIP com ON com.PersonalId=per.PersonalId AND com.PersonalComprobantePagoAFIPAno = @1 AND com.PersonalComprobantePagoAFIPMes = @2

        LEFT JOIN lige.dbo.liqmaperiodo peri ON peri.anio = @1 AND peri.mes = @2
        LEFT JOIN Documento doc ON doc.PersonalId = com.PersonalId AND doc.DocumentoTipoCodigo='MONOT' AND doc.DocumentoAnio = peri.anio AND doc.DocumentoMes = peri.mes


        LEFT JOIN PersonalCUITCUIL cuit2 ON cuit2.PersonalId = per.PersonalId AND cuit2.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)
        LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND EOMONTH(DATEFROMPARTS(@1,@2,1)) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31')
        LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId
        WHERE per.PersonalId = @0`,
        [personalId, year, month]
      );
      if (!comprobante)
        throw new ClientException(`No se pudo encontrar el comprobante`);

      const personalID = comprobante.PersonalId;
      const cuit = comprobante.CUIT;
      const fullPath = join(FileUploadController.pathDocuments, comprobante.DocumentoPath)
      const nombre_archivo = comprobante.nombre_archivo

      //const filename = `${year}-${month.padStart(2,"0")}-${cuit}-${personalId}.pdf`;

      if (!existsSync(fullPath))
        throw new ClientException(`El archivo de monotributo no se encontró ${month}/${year}, CUIT:${cuit} .`);

      const uint8Array = readFileSync(fullPath);

      if (!personalID)
        throw new ClientException(`No se pudo encontrar la persona ${personalId}`);
      const ApellidoNombre = comprobante.ApellidoNombre;
      const GrupoActividadDetalle = comprobante.GrupoActividadDetalle;

      const buffer = await this.alterPDF(
        uint8Array,
        ApellidoNombre,
        GrupoActividadDetalle
      );
      writeFileSync(tmpfilename, buffer);
      res.download(tmpfilename, nombre_archivo, (msg) => {
        unlinkSync(tmpfilename);
      });
    } catch (error) {
      console.log(error)
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

  async downloadImpuestoAFIP(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const pathArchivos = (process.env.PATH_ARCHIVOS) ? process.env.PATH_ARCHIVOS : '.'
    const DocumentoImagenImpuestoAFIPId = req.params.id
    try {
      const ds = await queryRunner
        .query(`
          SELECT pdf.PersonalId, dir.DocumentoImagenParametroDirectorioPath, pdf.DocumentoImagenImpuestoAFIPBlobNombreArchivo,
          par.DocumentoImagenParametroDe
          FROM DocumentoImagenImpuestoAFIP pdf
          JOIN DocumentoImagenParametroDirectorio dir ON dir.DocumentoImagenParametroDirectorioId = pdf.DocumentoImagenParametroDirectorioId AND dir.DocumentoImagenParametroId =  pdf.DocumentoImagenParametroId
          JOIN DocumentoImagenParametro par ON par.DocumentoImagenParametroId = pdf.DocumentoImagenParametroId
          WHERE pdf.DocumentoImagenImpuestoAFIPId IN (@0)`,
          [DocumentoImagenImpuestoAFIPId]
        )

      if (ds.length == 0)
        throw new ClientException(`Documento no existe para la persona`);

      const downloadPath = `${pathArchivos}/${ds[0].DocumentoImagenParametroDirectorioPath.replaceAll('\\', '/')}/${ds[0].DocumentoImagenImpuestoAFIPBlobNombreArchivo}`;

      if (!existsSync(downloadPath))
        throw new ClientException(`El archivo ${ds[0].DocumentoImagenParametroDe} no existe`, { 'path': downloadPath });

      res.download(downloadPath, ds[0].DocumentoImagenImpuestoAFIPBlobNombreArchivo, (msg) => { });

    } catch (error) {
      console.log(error)
      return next(error)
    }
  }
}