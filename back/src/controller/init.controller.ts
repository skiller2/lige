import { Request, Response, NextFunction } from "express";
import { BaseController, ClientException } from "./baseController";
import { getConnection } from "../data-source";
import { CategoriasController } from "../categorias-cambio/categorias-cambio.controller";
import { objetivosPendasisController } from "./controller.module";
import { ObjetivosPendasisController } from "src/objetivos-pendasis/objetivos-pendasis.controller";
import { isNumberObject } from "util/types";
import { AsistenciaController } from "./asistencia.controller";
import { CustodiaController } from "./custodia.controller";

export class InitController extends BaseController {
  getCategoriasPendientes(req: Request, res: Response, next: NextFunction) {
    CategoriasController.listCambiosPendCategoria({}).then((records: Array<any>) => {
      let data: { x: string; y: any; }[] = []
      let total = 0

      //        if (records.length ==0) throw new ClientException('Data not found')
      records.forEach(rec => {
        //        data.push({ x: rec.SucursalDescripcion, y: rec.CantidadObjetivos })
        //        total += rec.CantidadObjetivos
        total++
      })

      this.jsonRes({ data, total }, res);

    })
      .catch((error) => {
        return next(error);
      });
  }


  async getObjetivosSinAsistencia(req: Request, res: Response, next: NextFunction) {
    const anio = req.params.anio
    const mes = req.params.mes

    try {
      const result = await ObjetivosPendasisController.listObjetivosAsis({
        filtros: [
          { index: 'anio', operador: '=', condition: 'AND', valor: anio },
          { index: 'mes', operador: '=', condition: 'AND', valor: mes }
        ],
        sort: null,
        extra: null
      })

      let porGrupo: { GrupoActividadDetalle: string; CantidadObjetivos: number; }[] = []
      let data: { x: string; y: any; }[] = []
      let total = 0


      result.forEach(rec => {
        const cant: number = (Number(porGrupo[rec.GrupoActividadId]?.CantidadObjetivos) > 0) ? porGrupo[rec.GrupoActividadId].CantidadObjetivos : 0
        const GrupoActividadId = (rec.GrupoActividadId) ? rec.GrupoActividadId : 0
        const GrupoActividadDetalle = (rec.GrupoActividadDetalle) ? rec.GrupoActividadDetalle : 'Sin Grupo'
        porGrupo[GrupoActividadId] = { GrupoActividadDetalle, CantidadObjetivos: cant + 1 }
        total++
      })


      for (const row of porGrupo) {
        if (row)
          data.push({ x: row.GrupoActividadDetalle, y: row.CantidadObjetivos })
      }
      data.sort((a, b) => b.y - a.y);


      this.jsonRes({ objetivosSinAsistencia: data, objetivosSinAsistenciaTotal: total, anio: anio, mes: mes }, res);
    } catch (error) {
      return next(error);
    }
  }

  async getCustodiasPendientes(req: Request, res: Response, next: NextFunction) {
    const anio = Number(req.params.anio)
    const mes = Number(req.params.mes)

    try {
      const result = await CustodiaController.listCustodiasPendientesLiqui(anio, mes, 3)

      let porGrupo: { ResponsableDetalle: string; CantidadCustodias: number; }[] = []
      let data: { x: string; y: any; }[] = []
      let total = 0


      result.forEach(rec => {
        const PersonalId = (rec.responsable_id) ? rec.responsable_id : 0
        const cant: number = (Number(porGrupo[PersonalId]?.CantidadCustodias) > 0) ? porGrupo[PersonalId].CantidadCustodias : 0
        const ResponsableDetalle = (rec.ResponsableDetalle) ? rec.ResponsableDetalle : 'Sin Grupo'
        porGrupo[PersonalId] = { ResponsableDetalle, CantidadCustodias: cant + 1 }
        total++
      })


      for (const row of porGrupo) {
        if (row)
          data.push({ x: row.ResponsableDetalle, y: row.CantidadCustodias })
      }
      data.sort((a, b) => b.y - a.y);


      this.jsonRes({ custodiasPendientes: data, custodiasPendientesTotal: total, anio: anio, mes: mes }, res);
    } catch (error) {
      return next(error);
    }
  }



  async getObjetivosSinGrupo(req: Request, res: Response, next: NextFunction) {
    const con = await getConnection()
    const stmactual = new Date()
    con
      .query(
        `SELECT DISTINCT
                 
        obj.ObjetivoId, 
        obj.ClienteId,
        obj.ClienteElementoDependienteId,
        obj.ObjetivoDescripcion,
    gru.GrupoActividadObjetivoId,
    gru.GrupoActividadId,
        
        gru.GrupoActividadObjetivoHasta,
        1
        
    FROM Objetivo obj

  LEFT JOIN GrupoActividadObjetivo gru  ON gru.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId

    LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
    LEFT JOIN ClienteElementoDependienteContrato eledepcon ON eledepcon.ClienteId = obj.ClienteId AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId 
    AND @0 >= eledepcon.ClienteElementoDependienteContratoFechaDesde AND ISNuLL(eledepcon.ClienteElementoDependienteContratoFechaHasta,'9999-12-31') >= @0 AND ISNuLL(eledepcon.ClienteElementoDependienteContratoFechaFinalizacion,'9999-12-31') >= @0
    
    LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId 

        
        
    WHERE 
  
gru.GrupoActividadObjetivoId IS null
AND eledepcon.ClienteElementoDependienteContratoFechaDesde IS NOT NULL
`,
        [stmactual]
      )
      .then((records: Array<any>) => {
        let data: { x: string; y: any; }[] = []
        let total = 0

        records.forEach(rec => {

          //          data.push({ x: rec.totalpersonas, y: rec.PersonalPrestamoMonto })
          //          total += rec.totalpersonas
          total++
        })

        this.jsonRes({ objetivossingrupo: data, objetivossingrupoTotal: total }, res);

      })
      .catch((error) => {
        return next(error);
      });
  }


  async getRecibosPendDescarga(req: Request, res: Response, next: NextFunction){
    try {
      const con = await getConnection()
      const rec = await con.query(
          `SELECT TOP 1 COUNT(DISTINCT dc.doc_id) total, COUNT(DISTINCT lg.doc_id) descargados, pe.anio, pe.mes 
          FROM lige.dbo.docgeneral dc
          JOIN lige.dbo.liqmaperiodo pe ON pe.periodo_id = dc.periodo
          LEFT JOIN lige.dbo.doc_descaga_log lg ON lg.doc_id = dc.doc_id
          WHERE dc.doctipo_id='REC' -- AND pe.anio = @1 AND pe.mes = @2
          GROUP BY pe.anio, pe.mes
          ORDER BY pe.anio desc, pe.mes desc
          `)
      this.jsonRes({ total: rec[0].total, descargados: rec[0].descargados, anio:rec[0].anio, mes:rec[0].mes }, res);

    } catch (error){ 
      return next(error);

    }

  }


  async getAdelantosPendientes(req: Request, res: Response, next: NextFunction) {
    const con = await getConnection()
    const stmactual = new Date()
    try {
      const records = await con
        .query(
          `SELECT COUNT(pre.PersonalPrestamoId) as totalpersonas, SUM(pre.PersonalPrestamoMonto) as totalimporte 
        FROM PersonalPrestamo pre
        WHERE pre.PersonalPrestamoAprobado IS NULL AND ISNULL(pre.PersonalPrestamoLiquidoFinanzas,0) <> 1
        `,
          [stmactual]
        )

      let data: { x: string; y: any; }[] = []
      let total = 0
      //      if (records.length ==0) throw new ClientException('Data not found')
      records.forEach(rec => {

        data.push({ x: rec.totalpersonas, y: rec.PersonalPrestamoMonto })
        total += rec.totalpersonas

        this.jsonRes({ adelantos: data, adelantosTotal: total }, res);

      })
    } catch (error) {
      return next(error);

    }
  }

  async getExcepcionesPendientes(req: Request, res: Response, next: NextFunction) {
    const con = await getConnection()
    const stmactual = new Date()
    con
      .query(
        `SELECT suc.SucursalId, suc.SucursalDescripcion, COUNT(art14.PersonalId) AS totalpersonas 
        FROM PersonalArt14 art14 
        JOIN Objetivo obj ON obj.ObjetivoId = art14.PersonalArt14ObjetivoId

        LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
        LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
        
        
        LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)

        WHERE art14.PersonalArt14Autorizado IS NULL
        GROUP BY suc.SucursalId, suc.SucursalDescripcion
        
        `,
        [stmactual]
      )
      .then((records: Array<any>) => {
        let data: { x: string; y: any; }[] = []
        let total = 0
        //      if (records.length ==0) throw new ClientException('Data not found')
        records.forEach(rec => {

          data.push({ x: rec.SucursalDescripcion, y: rec.totalpersonas })
          total += rec.totalpersonas
        })

        this.jsonRes({ Excepciones: data, excepcionesTotal: total }, res);

      })
      .catch((error) => {
        return next(error);
      });
  }



  async getObjetivosActivos(req: Request, res: Response, next: NextFunction) {
    const con = await getConnection()
    const stmactual = new Date()
    con
      .query(
        `SELECT DISTINCT
        suc.SucursalId, TRIM(suc.SucursalDescripcion) SucursalDescripcion,  
        COUNT (DISTINCT obj.ObjetivoId) CantidadObjetivos, COUNT(DISTINCT obj.ClienteId) CantidadClientes,
        
--        obj.ObjetivoId,  obj.ClienteId, obj.ClienteElementoDependienteId, obj.ObjetivoDescripcion,
        
--	CONCAT(obj.ClienteId,'/',ISNULL(obj.ClienteElementoDependienteId,0)) as codObjetivo,

        1
        
        
        From Objetivo obj
        
        LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
        LEFT JOIN ClienteElementoDependienteContrato eledepcon ON eledepcon.ClienteId = obj.ClienteId AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId 
          AND @0 >= eledepcon.ClienteElementoDependienteContratoFechaDesde AND ISNuLL(eledepcon.ClienteElementoDependienteContratoFechaHasta,'9999-12-31') >= @0 AND ISNuLL(eledepcon.ClienteElementoDependienteContratoFechaFinalizacion,'9999-12-31') >= @0
            
        LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId 
    
        LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(eledep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
        

        WHERE 
        eledepcon.ClienteElementoDependienteContratoFechaDesde IS NOT NULL

GROUP BY suc.SucursalId, suc.SucursalDescripcion
        `,
        [stmactual]
      )
      .then((records: Array<any>) => {
        let data: { x: string; y: any; }[] = []
        let total = 0
        //      if (records.length ==0) throw new ClientException('Data not found')
        records.forEach(rec => {

          data.push({ x: rec.SucursalDescripcion, y: rec.CantidadObjetivos })
          total += rec.CantidadObjetivos
        })

        this.jsonRes({ objetivosActivos: data, objetivosActivosTotal: total }, res);

      })
      .catch((error) => {
        return next(error);
      });
  }


  async getClientesActivos(req: Request, res: Response, next: NextFunction) {
    const con = await getConnection()
    const stmactual = new Date()
    con
      .query(
        `SELECT DISTINCT  
        suc.SucursalId, TRIM(suc.SucursalDescripcion) SucursalDescripcion,  
        COUNT (DISTINCT obj.ObjetivoId) CantidadObjetivos, COUNT(DISTINCT obj.ClienteId) CantidadClientes,
        
--        obj.ObjetivoId,  obj.ClienteId, obj.ClienteElementoDependienteId, obj.ObjetivoDescripcion,
        
--	CONCAT(obj.ClienteId,'/',ISNULL(obj.ClienteElementoDependienteId,0)) as codObjetivo,

--        eledepcon.ClienteElementoDependienteContratoFechaDesde, eledepcon.ClienteElementoDependienteContratoFechaHasta, eledepcon.ClienteElementoDependienteContratoFechaFinalizacion,
        
        1
        
        
        From Objetivo obj
        
        LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
        LEFT JOIN ClienteElementoDependienteContrato eledepcon ON eledepcon.ClienteId = obj.ClienteId AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId 
          AND @0 >= eledepcon.ClienteElementoDependienteContratoFechaDesde AND ISNuLL(eledepcon.ClienteElementoDependienteContratoFechaHasta,'9999-12-31') >= @0 AND ISNuLL(eledepcon.ClienteElementoDependienteContratoFechaFinalizacion,'9999-12-31') >= @0
            
        LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId 

        LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(eledep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)

        WHERE 

          eledepcon.ClienteElementoDependienteContratoFechaDesde IS NOT NULL
        
GROUP BY suc.SucursalId, suc.SucursalDescripcion
        `,
        [stmactual]
      )
      .then((records: Array<any>) => {
        let data: { x: string; y: any; }[] = []
        //if (records.length ==0) throw new ClientException('Data not found')
        let total = 0
        records.forEach(rec => {
          data.push({ x: rec.SucursalDescripcion, y: rec.CantidadClientes })
          total += rec.CantidadClientes
        })

        this.jsonRes({ clientesActivos: data, clientesActivosTotal: total }, res);

      })
      .catch((error) => {
        return next(error);
      });
  }

  async getLicenciasInconsistentes(req: Request, res: Response, next: NextFunction) {
    const anio = Number(req.params.anio)
    const mes = Number(req.params.mes)
    const queryRunner = await getConnection()


    const licencias = await AsistenciaController.getAsistenciaAdminArt42(anio, mes, queryRunner, [], null, false, false)
    const licerror = licencias.filter((r: any) => r.PersonalLicenciaSePaga == null || (r.PersonalLicenciaSePaga == 'S' && Number(r.PersonalLicenciaAplicaPeriodoHorasMensuales) == 0) || (r.PersonalLicenciaSePaga == 'N' && Number(r.PersonalLicenciaAplicaPeriodoHorasMensuales) > 0))
    this.jsonRes({ total: licerror.length, anio, mes }, res);
  }


  async getHorasTrabajadas(req: Request, res: Response, next: NextFunction) {
    const con = await getConnection()

    const anio = Number(req.params.anio)

    con
      .query(
        `SELECT 

        obja.ObjetivoAsistenciaAnoAno, 
        objm.ObjetivoAsistenciaAnoMesMes, 
		  objd.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras,
        SUM (
          ((
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias1Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias1Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias2Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias2Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias3Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias3Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias4Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias4Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias5Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias5Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias6Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias6Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias7Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias7Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias8Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias8Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias9Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias9Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias10Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias10Gral),2) AS INT),0)+
        
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias11Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias11Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias12Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias12Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias13Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias13Gral),2) AS INT),0)+
          ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias14Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias14Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias15Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias15Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias16Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias16Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias17Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias17Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias18Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias18Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias19Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias19Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias20Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias20Gral),2) AS INT),0)+
        
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias21Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias21Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias22Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias22Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias23Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias23Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias24Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias24Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias25Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias25Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias26Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias26Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias27Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias27Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias28Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias28Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias29Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias29Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias30Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias30Gral),2) AS INT),0)+
        
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias31Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias31Gral),2) AS INT),0) )/ 60
        )) AS totalhorascalc
        
        
        
        
        
        FROM ObjetivoAsistenciaAnoMesPersonalDias objd
        JOIN ObjetivoAsistenciaAnoMes objm ON objm.ObjetivoAsistenciaAnoMesId = objd.ObjetivoAsistenciaAnoMesId AND objm.ObjetivoAsistenciaAnoId = objd.ObjetivoAsistenciaAnoId AND objm.ObjetivoId = objd.ObjetivoId
        JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objm.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objm.ObjetivoId
        JOIN Objetivo obj ON obj.ObjetivoId = obja.ObjetivoId
        JOIN Personal persona ON persona.PersonalId = objd.ObjetivoAsistenciaMesPersonalId
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = persona.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = persona.PersonalId) 

        -- JOIN CategoriaPersonal cat ON cat.CategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId AND cat.TipoAsociadoId=objd.ObjetivoAsistenciaTipoAsociadoId
        
        LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
        LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
        LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)

        LEFT JOIN ValorLiquidacion val ON val.ValorLiquidacionSucursalId = suc.SucursalId AND val.ValorLiquidacionTipoAsociadoId = objd.ObjetivoAsistenciaTipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId 
        AND  DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') BETWEEN 
        val.ValorLiquidacionDesde and COALESCE (val.ValorLiquidacionHasta, '9999-01-01')
        
        
        WHERE obja.ObjetivoAsistenciaAnoAno = @1 OR obja.ObjetivoAsistenciaAnoAno = @2
        GROUP BY obja.ObjetivoAsistenciaAnoAno, objm.ObjetivoAsistenciaAnoMesMes, objd.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras
        ORDER BY obja.ObjetivoAsistenciaAnoAno, objm.ObjetivoAsistenciaAnoMesMes, objd.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras
        `,
        [, anio, anio - 1]
      )
      .then((records: Array<any>) => {
        let horasTrabajadas: any[] = []

        if (records.length > 0) {
          const lastrecord = records.slice(-1)[0]
          const lastmonth = lastrecord.ObjetivoAsistenciaAnoMesMes
          const lastyear = lastrecord.ObjetivoAsistenciaAnoAno


          records.forEach(rec => {
            if (rec.ObjetivoAsistenciaAnoAno == lastyear || (rec.ObjetivoAsistenciaAnoAno < lastyear && rec.ObjetivoAsistenciaAnoMesMes >= lastmonth)) {
              let color = '#f80'
              switch (rec.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras) {
                case 'C':
                  color = '#f50'
                  break;
                case 'N':
                  color = '#e30'
                  break;
                case 'R':
                  color = '#d10'
                  break;
                default:
                  break;
              }
              horasTrabajadas.push({ x: rec.ObjetivoAsistenciaAnoAno + '-' + rec.ObjetivoAsistenciaAnoMesMes, y: rec.totalhorascalc, type: rec.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras, color: color, })
            }
          })
        }

        this.jsonRes({ horasTrabajadas: horasTrabajadas, anio: anio }, res);

      })
      .catch((error) => {
        return next(error);
      });
  }

  async search(
    req: any,
    res: Response,
    next: NextFunction
  ) {
    const { fieldName, value } = req.body;


    let query: string =
      `SELECT per.PersonalId, CONCAT(TRIM(per.PersonalNombre) , ' ', TRIM(per.PersonalApellido), ' CUIT:' , cuit.PersonalCUITCUILCUIT) fullName FROM dbo.Personal per 
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 

      WHERE`
    switch (fieldName) {
      case 'Nombre':
        const valueArray: Array<string> = value.split(" ");
        valueArray.forEach((element, index) => {
          query += `(per.PersonalNombre LIKE '%${element}%' OR per.PersonalApellido LIKE '%${element}%') AND `;
        });
        break;
      case 'CUIT':
        query += ` cuit.PersonalCUITCUILCUIT LIKE '%${value}%' AND `
      default:
        break;
    }

    const queryRunner = await getConnection()

    queryRunner
      .query((query += " 1=1"))
      .then((records) => {
        this.jsonRes({ recordsArray: records }, res);
      })
      .catch((error) => {
        return next(error);
      });
  }

  async execProcedure(someParam: number) {
    /*
        const result = await this.connection.query(
          'EXEC procedures.MyProcedure @0', [someParam]
        );
        */
    // ... do something with the result
  }
}
