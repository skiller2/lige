import { Request, Response } from "express";
import { BaseController } from "./baseController";
import { dataSource } from "../data-source";

export class InitController extends BaseController {
  getObjetivosSinAsistencia(req: Request, res: Response) {
    const con = dataSource;
    const stmactual = new Date()
    const anio = req.params.anio
    const mes = req.params.mes
    con
      .query(
        `SELECT DISTINCT suc.ObjetivoSucursalSucursalId, 
        sucdes.SucursalDescripcion,
        COUNT(obj.ObjetivoId) totalobjetivos,
        -- obj.ObjetivoId, obj.ClienteId, obj.ClienteElementoDependienteId, obj.ObjetivoDescripcion,
        
        -- CONCAT(obj.ClienteId,'/' ,ISNULL(obj.ClienteElementoDependienteId,0)) as codObjetivo, 
        
        -- obja.ObjetivoAsistenciaAnoAno, objm.ObjetivoAsistenciaAnoMesMes,
        
        -- perjer.PersonalNombre AS NombreCoordinadorZona, perjer.PersonalApellido AS ApellidoCoordinadorZona,
        
        
        -- eledepcon.ClienteElementoDependienteContratoFechaDesde,  eledepcon.ClienteElementoDependienteContratoFechaHasta, eledepcon.ClienteElementoDependienteContratoFechaFinalizacion,
        -- clicon.ClienteContratoFechaDesde, clicon.ClienteContratoFechaHasta, clicon.ClienteContratoFechaFinalizacion,
        
        
        1
        
        FROM Objetivo obj 
        
        LEFT JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoId = obj.ObjetivoId AND obja.ObjetivoAsistenciaAnoAno = @0
        LEFT JOIN ObjetivoAsistenciaAnoMes objm ON objm.ObjetivoAsistenciaAnoId  = obja.ObjetivoAsistenciaAnoId AND  objm.ObjetivoId = obja.ObjetivoId AND objm.ObjetivoAsistenciaAnoMesMes = @1
        LEFT JOIN ObjetivoAsistenciaAnoMesPersonalDias objd ON objd.ObjetivoId = obj.ObjetivoId AND objd.ObjetivoAsistenciaAnoMesId = objm.ObjetivoAsistenciaAnoMesId AND objd.ObjetivoAsistenciaAnoId = objm.ObjetivoAsistenciaAnoId
        
        
        LEFT JOIN Personal persona ON persona.PersonalId = objd.ObjetivoAsistenciaMesPersonalId
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = persona.PersonalId AND cuit.PersonalCUITCUILId = persona.PersonalCUITCUILUltNro
        
        
        LEFT JOIN ObjetivoSucursal suc ON suc.ObjetivoId = obj.ObjetivoId AND suc.ObjetivoSucursalId = obj.ObjetivoSucursalUltNro
        LEFT JOIN Sucursal sucdes ON sucdes.SucursalId = suc.ObjetivoSucursalSucursalId
        
        
        LEFT JOIN ObjetivoPersonalJerarquico opj ON opj.ObjetivoId = obj.ObjetivoId AND  DATEFROMPARTS(@0,@1,'28')  BETWEEN opj.ObjetivoPersonalJerarquicoDesde  AND ISNULL(opj.ObjetivoPersonalJerarquicoHasta,'9999-12-31') AND opj.ObjetivoPersonalJerarquicoComo = 'J'
        LEFT JOIN Personal perjer ON perjer.PersonalId = opj.ObjetivoPersonalJerarquicoPersonalId
        
        LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
        LEFT JOIN ClienteElementoDependienteContrato eledepcon ON eledepcon.ClienteId = obj.ClienteId AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledepcon.ClienteElementoDependienteContratoId = eledep.ClienteElementoDependienteContratoUltNro
        
        LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId 
        LEFT JOIN ClienteContrato clicon ON clicon.ClienteId = obj.ClienteId AND clicon.ClienteContratoId = cli.ClienteContratoUltNro AND obj.ClienteElementoDependienteId IS NULL
        
        WHERE 
        --	obja.ObjetivoAsistenciaAnoAno = 2023 AND objm.ObjetivoAsistenciaAnoMesMes = 3 AND 
        objd.ObjetivoId IS NULL AND	 
               ( (clicon.ClienteContratoFechaDesde <= DATETIMEFROMPARTS ( @0, @1, 28, 0, 0, 0, 0 )  
         AND ISNULL(clicon.ClienteContratoFechaHasta,'9999-12-31') >= DATETIMEFROMPARTS ( @0, @1, 1, 0, 0, 0, 0 ) AND ISNULL(clicon.ClienteContratoFechaFinalizacion,'9999-12-31') >= DATETIMEFROMPARTS ( @0, @1, 1, 0, 0, 0, 0 ) ) OR (
                eledepcon.ClienteElementoDependienteContratoFechaDesde <= DATETIMEFROMPARTS ( @0, @1, 28, 0, 0, 0, 0 ) AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaHasta,'9999-12-31') >= DATETIMEFROMPARTS ( @0, @1, 1, 0, 0, 0, 0 ) AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaFinalizacion,'9999-12-31') >= DATETIMEFROMPARTS ( @0, @1, 1, 0, 0, 0, 0 )) 
        --		  OR ClienteContratoFechaDesde IS NULL AND clicon.ClienteContratoFechaHasta IS NULL AND eledepcon.ClienteElementoDependienteContratoFechaDesde IS NULL AND eledepcon.ClienteElementoDependienteContratoFechaHasta IS NULL)        
                
              
              
              )
              
        GROUP BY suc.ObjetivoSucursalSucursalId, sucdes.SucursalDescripcion
        `,
        [anio,mes]
      )
      .then((records: Array<any>) => {
        let objetivosSinAsistencia: { x: string; y: any; }[] = []
        let objetivosSinAsistenciaTotal = 0
//        if (records.length ==0) throw new Error('Data not found')
        records.forEach(rec => { 
          objetivosSinAsistencia.push({ x: rec.SucursalDescripcion, y: rec.totalobjetivos })
          objetivosSinAsistenciaTotal += rec.totalobjetivos
        })

        this.jsonRes({ objetivosSinAsistencia: objetivosSinAsistencia, objetivosSinAsistenciaTotal:objetivosSinAsistenciaTotal },res);
      
      })
      .catch((err) => {
        this.errRes(err, res, "Error accediendo a la base de datos", 409);
      });
  }


  getObjetivosActivos(req: Request, res: Response) {
    const con = dataSource;
    const stmactual = new Date()
    con
      .query(
        `SELECT 
        suc.ObjetivoSucursalSucursalId, TRIM(sucdes.SucursalDescripcion) AS SucursalDescripcion,  
        COUNT(obj.ObjetivoId) as totalobjetivos,
        -- obj.ObjetivoId,  obj.ClienteId, obj.ClienteElementoDependienteId, obj.ObjetivoDescripcion,
        
        -- eledepcon.ClienteElementoDependienteContratoFechaDesde, eledepcon.ClienteElementoDependienteContratoFechaHasta, eledepcon.ClienteElementoDependienteContratoFechaFinalizacion,
        -- clicon.ClienteContratoFechaDesde, clicon.ClienteContratoFechaHasta, clicon.ClienteContratoFechaFinalizacion,
        
        1
        
        
        From Objetivo obj
        LEFT JOIN ObjetivoSucursal suc ON suc.ObjetivoId = obj.ObjetivoId AND suc.ObjetivoSucursalId = obj.ObjetivoSucursalUltNro
        LEFT JOIN Sucursal sucdes ON sucdes.SucursalId=  suc.ObjetivoSucursalSucursalId
        
        LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
        LEFT JOIN ClienteElementoDependienteContrato eledepcon ON eledepcon.ClienteId = obj.ClienteId AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledepcon.ClienteElementoDependienteContratoId = eledep.ClienteElementoDependienteContratoUltNro
        
        LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId 
        LEFT JOIN ClienteContrato clicon ON clicon.ClienteId = obj.ClienteId AND clicon.ClienteContratoId = cli.ClienteContratoUltNro AND obj.ClienteElementoDependienteId IS NULL
        
        WHERE 

        (clicon.ClienteContratoFechaDesde <= @0 AND ISNULL(clicon.ClienteContratoFechaHasta,'9999-12-31') >= @0 AND ISNULL(clicon.ClienteContratoFechaFinalizacion,'9999-12-31') >= @0 ) OR (
          eledepcon.ClienteElementoDependienteContratoFechaDesde <= @0 AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaHasta,'9999-12-31') >= @0  AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaFinalizacion,'9999-12-31') >= @0)
        GROUP BY ObjetivoSucursalSucursalId, sucdes.SucursalDescripcion
        `,
        [stmactual]
      )
      .then((records: Array<any>) => {
        let objetivosActivos: { x: string; y: any; }[]=[]
        if (records.length ==0) throw new Error('Data not found')
        records.forEach(rec => { 
          objetivosActivos.push({x: rec.SucursalDescripcion, y:rec.totalobjetivos})
        })

        this.jsonRes({ objetivosActivos: objetivosActivos },res);
      
      })
      .catch((err) => {
        this.errRes(err, res, "Error accediendo a la base de datos", 409);
      });
  }


  getClientesActivos(req: Request, res: Response) {
    const con = dataSource;
    const stmactual = new Date()
    con
      .query(
        `SELECT
        suc.ObjetivoSucursalSucursalId, TRIM(sucdes.SucursalDescripcion) AS SucursalDescripcion,  
        COUNT (DISTINCT obj.ClienteId) as totalclientes,
        -- obj.ObjetivoId,  obj.ClienteId, obj.ClienteElementoDependienteId, obj.ObjetivoDescripcion,
        
        -- eledepcon.ClienteElementoDependienteContratoFechaDesde, eledepcon.ClienteElementoDependienteContratoFechaHasta, eledepcon.ClienteElementoDependienteContratoFechaFinalizacion,
        -- clicon.ClienteContratoFechaDesde, clicon.ClienteContratoFechaHasta, clicon.ClienteContratoFechaFinalizacion,
        
        1
        
        
        From Objetivo obj
        LEFT JOIN ObjetivoSucursal suc ON suc.ObjetivoId = obj.ObjetivoId AND suc.ObjetivoSucursalId = obj.ObjetivoSucursalUltNro
        LEFT JOIN Sucursal sucdes ON sucdes.SucursalId=  suc.ObjetivoSucursalSucursalId
        
        LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
        LEFT JOIN ClienteElementoDependienteContrato eledepcon ON eledepcon.ClienteId = obj.ClienteId AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledepcon.ClienteElementoDependienteContratoId = eledep.ClienteElementoDependienteContratoUltNro
        
        LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
        LEFT JOIN ClienteContrato clicon ON clicon.ClienteId = obj.ClienteId AND clicon.ClienteContratoId = cli.ClienteContratoUltNro AND obj.ClienteElementoDependienteId IS NULL
        
        WHERE 

        (clicon.ClienteContratoFechaDesde <= @0 AND ISNULL(clicon.ClienteContratoFechaHasta,'9999-12-31') >= @0 AND ISNULL(clicon.ClienteContratoFechaFinalizacion,'9999-12-31') >= @0 ) OR (
          eledepcon.ClienteElementoDependienteContratoFechaDesde <= @0 AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaHasta,'9999-12-31') >= @0  AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaFinalizacion,'9999-12-31') >= @0)
          GROUP BY ObjetivoSucursalSucursalId, sucdes.SucursalDescripcion
        `,
        [stmactual]
      )
      .then((records: Array<any>) => {
        let clientesActivos: { x: string; y: any; }[]=[]
        if (records.length ==0) throw new Error('Data not found')
        records.forEach(rec => { 
          clientesActivos.push({x: rec.SucursalDescripcion, y:rec.totalclientes})
        })

        this.jsonRes({ clientesActivos: clientesActivos },res);
      
      })
      .catch((err) => {
        this.errRes(err, res, "Error accediendo a la base de datos", 409);
      });
  }


  getStats(req: Request, res: Response) {
    const con = dataSource;
    con
      .query(
        `SELECT 

        obja.ObjetivoAsistenciaAnoAno, 
        objm.ObjetivoAsistenciaAnoMesMes, 
        -- cuit.PersonalCUITCUILCUIT, 
        -- persona.PersonalApellido, 
        -- persona.PersonalNombre, 
        -- obj.ObjetivoId, 
        -- obj.ClienteId,
        -- obj.ClienteElementoDependienteId,
        -- obj.ObjetivoDescripcion,
        
        -- perjer.PersonalNombre AS NombreCoordinadorZona, perjer.PersonalApellido AS ApellidoCoordinadorZona,
        -- objd.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras,
        -- cat.CategoriaPersonalDescripcion,
        -- val.ValorLiquidacionHoraNormal,
        -- CAST (objd.ObjetivoAsistenciaAnoMesPersonalDiasTotalGral AS FLOAT) AS HorasMensuales,
        -- CAST (objd.ObjetivoAsistenciaAnoMesPersonalDiasTotalGral AS FLOAT)*val.ValorLiquidacionHoraNormal AS HorasMensualesImporte,
        
        -- objd.ObjetivoAsistenciaTipoAsociadoId,
        -- objd.ObjetivoAsistenciaCategoriaPersonalId,
        -- suc.ObjetivoSucursalSucursalId,
        -- obj.ObjetivoSucursalUltNro,
        
        SUM ((ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias1Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias1Gral),2) AS INT),0)+
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
        ) AS totalhorascalc
        
        
        
        
        
        FROM ObjetivoAsistenciaAnoMesPersonalDias objd
        JOIN ObjetivoAsistenciaAnoMes objm ON objm.ObjetivoAsistenciaAnoMesId = objd.ObjetivoAsistenciaAnoMesId AND objm.ObjetivoAsistenciaAnoId = objd.ObjetivoAsistenciaAnoId AND objm.ObjetivoId = objd.ObjetivoId
        JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objm.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objm.ObjetivoId
        JOIN Objetivo obj ON obj.ObjetivoId = obja.ObjetivoId
        JOIN Personal persona ON persona.PersonalId = objd.ObjetivoAsistenciaMesPersonalId
        JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = persona.PersonalId AND cuit.PersonalCUITCUILId = persona.PersonalCUITCUILUltNro
        JOIN CategoriaPersonal cat ON cat.CategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId AND cat.TipoAsociadoId=objd.ObjetivoAsistenciaTipoAsociadoId
        
        
        LEFT JOIN ObjetivoSucursal suc ON suc.ObjetivoId = obj.ObjetivoId AND suc.ObjetivoSucursalId = obj.ObjetivoSucursalUltNro
        
        
        LEFT JOIN ValorLiquidacion val ON val.ValorLiquidacionSucursalId = ISNULL(suc.ObjetivoSucursalSucursalId,1) AND val.ValorLiquidacionTipoAsociadoId = objd.ObjetivoAsistenciaTipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId 
        AND  DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') BETWEEN 
          val.ValorLiquidacionDesde and COALESCE (val.ValorLiquidacionHasta, '9999-01-01')
        
        LEFT JOIN ObjetivoPersonalJerarquico opj ON opj.ObjetivoId = obj.ObjetivoId AND  DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') BETWEEN 
          opj.ObjetivoPersonalJerarquicoDesde and COALESCE (opj.ObjetivoPersonalJerarquicoHasta, '9999-01-01')
        LEFT JOIN Personal perjer ON perjer.PersonalId = opj.ObjetivoPersonalJerarquicoPersonalId
        
        WHERE obja.ObjetivoAsistenciaAnoAno = @0   -- AND cuit.PersonalCUITCUILCUIT = '20241355471'
        GROUP BY obja.ObjetivoAsistenciaAnoAno, objm.ObjetivoAsistenciaAnoMesMes`,
        [2023]
      )
      .then((records: Array<any>) => {
        let horasTrabajadas: { x: string; y: any; }[]=[]
        if (records.length ==0) throw new Error('Data not found')
        records.forEach(rec => { 
          horasTrabajadas.push({x: rec.ObjetivoAsistenciaAnoAno+'-'+rec.ObjetivoAsistenciaAnoMesMes, y:rec.totalhorascalc})
        })

        this.jsonRes({ horasTrabajadas: horasTrabajadas },res);
      
      })
      .catch((err) => {
        this.errRes(err, res, "Error accediendo a la base de datos", 409);
      });
  }

  search(
    req: any,
    res: Response
  ) {
    const { fieldName, value } = req.body;


    let query: string =
    `SELECT per.PersonalId, CONCAT(TRIM(per.PersonalNombre) , ' ', TRIM(per.PersonalApellido), ' CUIT:' , cuit.PersonalCUITCUILCUIT) fullName FROM dbo.Personal per 
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = per.PersonalCUITCUILUltNro
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
    

    dataSource
      .query((query += " 1=1"))
      .then((records) => {
        this.jsonRes({ recordsArray: records }, res);
      })
      .catch((err) => {
        this.errRes(err, res, "Error accediendo a la base de datos", 409);
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
