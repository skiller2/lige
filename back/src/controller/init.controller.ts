import { Request, Response,NextFunction } from "express";
import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { CategoriasController } from "../categorias-cambio/categorias-cambio.controller";

export class InitController extends BaseController {
  getCategoriasPendientes(req: Request, res: Response,next:NextFunction) {
    CategoriasController.listCambiosPendCategoria({}).then((records: Array<any>) => {
      let data: { x: string; y: any; }[] = []
      let total = 0

//        if (records.length ==0) throw new ClientException('Data not found')
      records.forEach(rec => { 
//        data.push({ x: rec.SucursalDescripcion, y: rec.CantidadObjetivos })
//        total += rec.CantidadObjetivos
        total++
      })

      this.jsonRes({ data, total },res);
    
    })
    .catch((error) => {
      next(error);
    });
  }

  
  getObjetivosSinAsistencia(req: Request, res: Response,next:NextFunction) {
    const con = dataSource;
    const anio = req.params.anio
    const mes = req.params.mes
    con
      .query(
        `
        SELECT DISTINCT suc.SucursalId, suc.SucursalDescripcion,
        
        COUNT(DISTINCT obj.ObjetivoId) AS CantidadObjetivos,
        
        1
        
        FROM Objetivo obj 
        
        LEFT JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoId = obj.ObjetivoId AND obja.ObjetivoAsistenciaAnoAno = @0
        LEFT JOIN ObjetivoAsistenciaAnoMes objm ON objm.ObjetivoAsistenciaAnoId  = obja.ObjetivoAsistenciaAnoId AND  objm.ObjetivoId = obja.ObjetivoId AND objm.ObjetivoAsistenciaAnoMesMes = @1
        LEFT JOIN ObjetivoAsistenciaAnoMesPersonalDias objd ON objd.ObjetivoId = obj.ObjetivoId AND objd.ObjetivoAsistenciaAnoMesId = objm.ObjetivoAsistenciaAnoMesId AND objd.ObjetivoAsistenciaAnoId = objm.ObjetivoAsistenciaAnoId
        
        
        LEFT JOIN ( SELECT objasis.ObjetivoId, objasis.ObjetivoAsistenciaAnoMesId, objasis.ObjetivoAsistenciaAnoId,
        SUM (
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias1Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias1Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias2Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias2Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias3Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias3Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias4Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias4Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias5Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias5Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias6Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias6Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias7Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias7Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias8Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias8Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias9Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias9Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias10Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias10Gral),2) AS INT),0)+
        
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias11Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias11Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias12Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias12Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias13Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias13Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias14Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias14Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias15Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias15Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias16Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias16Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias17Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias17Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias18Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias18Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias19Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias19Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias20Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias20Gral),2) AS INT),0)+
        
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias21Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias21Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias22Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias22Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias23Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias23Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias24Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias24Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias25Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias25Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias26Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias26Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias27Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias27Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias28Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias28Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias29Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias29Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias30Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias30Gral),2) AS INT),0)+
        
        ISNULL(CAST(LEFT(objasis.ObjetivoAsistenciaAnoMesPersonalDias31Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objasis.ObjetivoAsistenciaAnoMesPersonalDias31Gral),2) AS INT),0) 
        ) AS totalminutoscalc
        
        
        FROM ObjetivoAsistenciaAnoMesPersonalDias objasis 
        GROUP BY objasis.ObjetivoId, objasis.ObjetivoAsistenciaAnoMesId, objasis.ObjetivoAsistenciaAnoId
        
        ) objasissub ON objasissub.ObjetivoId = obj.ObjetivoId AND objasissub.ObjetivoAsistenciaAnoMesId = objm.ObjetivoAsistenciaAnoMesId AND objasissub.ObjetivoAsistenciaAnoId = objm.ObjetivoAsistenciaAnoId
        
        
        
        LEFT JOIN Personal persona ON persona.PersonalId = objd.ObjetivoAsistenciaMesPersonalId
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = persona.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = persona.PersonalId) 

        
        
        
        LEFT JOIN ObjetivoPersonalJerarquico opj ON opj.ObjetivoId = obj.ObjetivoId AND  DATEFROMPARTS(@0,@1,'28')  BETWEEN opj.ObjetivoPersonalJerarquicoDesde  AND ISNULL(opj.ObjetivoPersonalJerarquicoHasta,'9999-12-31') AND opj.ObjetivoPersonalJerarquicoComo = 'J'
        LEFT JOIN Personal perjer ON perjer.PersonalId = opj.ObjetivoPersonalJerarquicoPersonalId
        
        LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
        LEFT JOIN ClienteElementoDependienteContrato eledepcon ON eledepcon.ClienteId = obj.ClienteId AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledepcon.ClienteElementoDependienteContratoId = eledep.ClienteElementoDependienteContratoUltNro
        
        LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId 
        LEFT JOIN ClienteContrato clicon ON clicon.ClienteId = obj.ClienteId AND clicon.ClienteContratoId = cli.ClienteContratoUltNro AND obj.ClienteElementoDependienteId IS NULL 
        
        LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(eledep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)

        WHERE 
        --	obja.ObjetivoAsistenciaAnoAno = 2023 AND objm.ObjetivoAsistenciaAnoMesMes = 3 AND 
        (objd.ObjetivoId IS NULL OR objm.ObjetivoAsistenciaAnoMesHasta IS NULL) AND
               ( (clicon.ClienteContratoFechaDesde <= DATETIMEFROMPARTS ( @0, @1, 28, 0, 0, 0, 0 )  
         AND ISNULL(clicon.ClienteContratoFechaHasta,'9999-12-31') >= DATETIMEFROMPARTS ( @0, @1, 1, 0, 0, 0, 0 ) AND ISNULL(clicon.ClienteContratoFechaFinalizacion,'9999-12-31') >= DATETIMEFROMPARTS ( @0, @1, 1, 0, 0, 0, 0 ) ) OR (
                eledepcon.ClienteElementoDependienteContratoFechaDesde <= DATETIMEFROMPARTS ( @0, @1, 28, 0, 0, 0, 0 ) AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaHasta,'9999-12-31') >= DATETIMEFROMPARTS ( @0, @1, 1, 0, 0, 0, 0 ) AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaFinalizacion,'9999-12-31') >= DATETIMEFROMPARTS ( @0, @1, 1, 0, 0, 0, 0 )) 
        --		  OR ClienteContratoFechaDesde IS NULL AND clicon.ClienteContratoFechaHasta IS NULL AND eledepcon.ClienteElementoDependienteContratoFechaDesde IS NULL AND eledepcon.ClienteElementoDependienteContratoFechaHasta IS NULL)        
                
              
              
              )
              
        GROUP BY suc.SucursalId, suc.SucursalDescripcion
        `,
        [anio,mes]
      )
      .then((records: Array<any>) => {
        let data: { x: string; y: any; }[] = []
        let total = 0
//        if (records.length ==0) throw new ClientException('Data not found')
        records.forEach(rec => { 
          data.push({ x: rec.SucursalDescripcion, y: rec.CantidadObjetivos })
          total += rec.CantidadObjetivos
        })

        this.jsonRes({ objetivosSinAsistencia: data, objetivosSinAsistenciaTotal:total, anio:anio, mes:mes },res);
      
      })
      .catch((error) => {
        next(error);
      });
  }

  getAdelantosPendientes(req: Request, res: Response,next:NextFunction) {
    const con = dataSource;
    const stmactual = new Date()
    con
      .query(
        `SELECT COUNT(ade.PersonalAdelantoId) as totalpersonas, SUM(ade.PersonalAdelantoMonto) as totalimporte FROM PersonalAdelanto ade WHERE ade.PersonalAdelantoAprobado IS null
        `,
        [stmactual]
      )
      .then((records: Array<any>) => {
        let data: { x: string; y: any; }[]=[]
        let total=0
  //      if (records.length ==0) throw new ClientException('Data not found')
        records.forEach(rec => {
          
          data.push({ x: rec.totalpersonas, y: rec.PersonalAdelantoMonto })
          total += rec.totalpersonas
        })

        this.jsonRes({ adelantos: data, adelantosTotal: total },res);
      
      })
      .catch((error) => {
        next(error);
      });
  }

  getExcepcionesPendientes(req: Request, res: Response,next:NextFunction) {
    const con = dataSource;
    const stmactual = new Date()
    con
      .query(
        `SELECT suc.SucursalId, suc.SucursalDescripcion, COUNT(art14.PersonalId) AS totalpersonas 
        FROM PersonalArt14 art14 
        JOIN Objetivo obj ON obj.ObjetivoId = art14.PersonalArt14ObjetivoId

        LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
        LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
        
--        LEFT JOIN ClienteElementoDependienteDomicilio domdep ON domdep.ClienteId = clidep.ClienteId AND domdep.ClienteElementoDependienteId  = clidep.ClienteElementoDependienteId
--        LEFT JOIN ClienteDomicilio domcli ON domcli.ClienteId = cli.ClienteId AND obj.ClienteElementoDependienteId IS NULL
        
        LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)

        WHERE art14.PersonalArt14Autorizado IS NULL
        GROUP BY suc.SucursalId, suc.SucursalDescripcion
        
        `,
        [stmactual]
      )
      .then((records: Array<any>) => {
        let data: { x: string; y: any; }[]=[]
        let total=0
  //      if (records.length ==0) throw new ClientException('Data not found')
        records.forEach(rec => {
          
          data.push({ x: rec.SucursalDescripcion, y: rec.totalpersonas })
          total += rec.totalpersonas
        })

        this.jsonRes({ Excepciones: data, excepcionesTotal: total },res);
      
      })
      .catch((error) => {
        next(error);
      });
  }



  getObjetivosActivos(req: Request, res: Response,next:NextFunction) {
    const con = dataSource;
    const stmactual = new Date()
    con
      .query(
        `SELECT
        suc.SucursalId, TRIM(suc.SucursalDescripcion) SucursalDescripcion,  
        COUNT (obj.ObjetivoId) CantidadObjetivos, COUNT(DISTINCT obj.ClienteId) CantidadClientes,
        
--        obj.ObjetivoId,  obj.ClienteId, obj.ClienteElementoDependienteId, obj.ObjetivoDescripcion,
        
--	CONCAT(obj.ClienteId,'/',ISNULL(obj.ClienteElementoDependienteId,0)) as codObjetivo,

--        eledepcon.ClienteElementoDependienteContratoFechaDesde, eledepcon.ClienteElementoDependienteContratoFechaHasta, eledepcon.ClienteElementoDependienteContratoFechaFinalizacion,
--        clicon.ClienteContratoFechaDesde, clicon.ClienteContratoFechaHasta, clicon.ClienteContratoFechaFinalizacion,
        
        1
        
        
        From Objetivo obj
        
        LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
        LEFT JOIN ClienteElementoDependienteContrato eledepcon ON eledepcon.ClienteId = obj.ClienteId AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledepcon.ClienteElementoDependienteContratoId = eledep.ClienteElementoDependienteContratoUltNro
        
        LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId 
        LEFT JOIN ClienteContrato clicon ON clicon.ClienteId = obj.ClienteId AND clicon.ClienteContratoId = cli.ClienteContratoUltNro AND obj.ClienteElementoDependienteId IS NULL

        LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(eledep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
        

        WHERE 

        ( 
          (clicon.ClienteContratoFechaDesde <= @0  AND ISNULL(clicon.ClienteContratoFechaHasta,'9999-12-31') >= @0 AND ISNULL(clicon.ClienteContratoFechaFinalizacion,'9999-12-31') >= @0 ) 
          OR 
          (eledepcon.ClienteElementoDependienteContratoFechaDesde <= @0 AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaHasta,'9999-12-31') >= @0 AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaFinalizacion,'9999-12-31') >= @0) 
          )

GROUP BY suc.SucursalId, suc.SucursalDescripcion
        `,
        [stmactual]
      )
      .then((records: Array<any>) => {
        let data: { x: string; y: any; }[]=[]
        let total=0
  //      if (records.length ==0) throw new ClientException('Data not found')
        records.forEach(rec => {
          
          data.push({ x: rec.SucursalDescripcion, y: rec.CantidadObjetivos })
          total += rec.CantidadObjetivos
        })

        this.jsonRes({ objetivosActivos: data, objetivosActivosTotal: total },res);
      
      })
      .catch((error) => {
        next(error);
      });
  }


  getClientesActivos(req: Request, res: Response,next:NextFunction) {
    const con = dataSource;
    const stmactual = new Date()
    con
      .query(
        `SELECT
        suc.SucursalId, TRIM(suc.SucursalDescripcion) SucursalDescripcion,  
        COUNT (obj.ObjetivoId) CantidadObjetivos, COUNT(DISTINCT obj.ClienteId) CantidadClientes,
        
--        obj.ObjetivoId,  obj.ClienteId, obj.ClienteElementoDependienteId, obj.ObjetivoDescripcion,
        
--	CONCAT(obj.ClienteId,'/',ISNULL(obj.ClienteElementoDependienteId,0)) as codObjetivo,

--        eledepcon.ClienteElementoDependienteContratoFechaDesde, eledepcon.ClienteElementoDependienteContratoFechaHasta, eledepcon.ClienteElementoDependienteContratoFechaFinalizacion,
--        clicon.ClienteContratoFechaDesde, clicon.ClienteContratoFechaHasta, clicon.ClienteContratoFechaFinalizacion,
        
        1
        
        
        From Objetivo obj
        
        LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
        LEFT JOIN ClienteElementoDependienteContrato eledepcon ON eledepcon.ClienteId = obj.ClienteId AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledepcon.ClienteElementoDependienteContratoId = eledep.ClienteElementoDependienteContratoUltNro
        
        LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId 
        LEFT JOIN ClienteContrato clicon ON clicon.ClienteId = obj.ClienteId AND clicon.ClienteContratoId = cli.ClienteContratoUltNro AND obj.ClienteElementoDependienteId IS NULL

        LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(eledep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)

        WHERE 

        ( 
          (clicon.ClienteContratoFechaDesde <= @0  AND ISNULL(clicon.ClienteContratoFechaHasta,'9999-12-31') >= @0 AND ISNULL(clicon.ClienteContratoFechaFinalizacion,'9999-12-31') >= @0 ) 
          OR 
          (eledepcon.ClienteElementoDependienteContratoFechaDesde <= @0 AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaHasta,'9999-12-31') >= @0 AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaFinalizacion,'9999-12-31') >= @0) 
          )
        
GROUP BY suc.SucursalId, suc.SucursalDescripcion
        `,
        [stmactual]
      )
      .then((records: Array<any>) => {
        let data: { x: string; y: any; }[]=[]
        //if (records.length ==0) throw new ClientException('Data not found')
        let total=0
        records.forEach(rec => { 
          data.push({ x: rec.SucursalDescripcion, y: rec.CantidadClientes })
          total+=rec.CantidadClientes
        })

        this.jsonRes({ clientesActivos: data, clientesActivosTotal:total },res);
      
      })
      .catch((error) => {
        next(error);
      });
  }


  getHorasTrabajadas(req: Request, res: Response,next:NextFunction) {
    const con = dataSource;
    const anio = req.params.anio

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
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = persona.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = persona.PersonalId) 

        -- JOIN CategoriaPersonal cat ON cat.CategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId AND cat.TipoAsociadoId=objd.ObjetivoAsistenciaTipoAsociadoId
        
        LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
        LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
        LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)

        -- LEFT JOIN ValorLiquidacion val ON val.ValorLiquidacionSucursalId = suc.SucursalId AND val.ValorLiquidacionTipoAsociadoId = objd.ObjetivoAsistenciaTipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId 
        -- AND  DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') BETWEEN 
        --  val.ValorLiquidacionDesde and COALESCE (val.ValorLiquidacionHasta, '9999-01-01')
        
        -- LEFT JOIN ObjetivoPersonalJerarquico opj ON opj.ObjetivoId = obj.ObjetivoId AND  DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') BETWEEN 
        --  opj.ObjetivoPersonalJerarquicoDesde and COALESCE (opj.ObjetivoPersonalJerarquicoHasta, '9999-01-01')
        -- LEFT JOIN Personal perjer ON perjer.PersonalId = opj.ObjetivoPersonalJerarquicoPersonalId
        
        WHERE obja.ObjetivoAsistenciaAnoAno = @0   -- AND cuit.PersonalCUITCUILCUIT = '20241355471'
        GROUP BY obja.ObjetivoAsistenciaAnoAno, objm.ObjetivoAsistenciaAnoMesMes`,
        [anio]
      )
      .then((records: Array<any>) => {
        let horasTrabajadas: { x: string; y: any; }[]=[]
        if (records.length ==0) throw new ClientException('Data not found')
        records.forEach(rec => { 
          horasTrabajadas.push({x: rec.ObjetivoAsistenciaAnoAno+'-'+rec.ObjetivoAsistenciaAnoMesMes, y:rec.totalhorascalc})
        })

        this.jsonRes({ horasTrabajadas: horasTrabajadas, anio:anio },res);
      
      })
      .catch((error) => {
        next(error);
      });
  }

  search(
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
    

    dataSource
      .query((query += " 1=1"))
      .then((records) => {
        this.jsonRes({ recordsArray: records }, res);
      })
      .catch((error) => {
        next(error);
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
