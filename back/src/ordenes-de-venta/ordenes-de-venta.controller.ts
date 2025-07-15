import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, orderToSQL, isOptions } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";
import { NextFunction, Request, Response } from "express";
// import { ObjetivoController } from "src/controller/objetivo.controller";

const columnasGrilla: any[] = [
  {
    name: "id",
    type: "string",
    id: "id",
    field: "id",
    fieldName: "id",
    sortable: false,
    searchHidden: true,
    hidden: true,
    editable: false
  },
  {
    name: "Cliente",
    type: "number",
    id: "ClienteId",
    field: "ClienteId",
    fieldName: "obj.ClienteId",
    searchComponent: "inpurForClientSearch",
    searchType: "number",
    sortable: true,
    searchHidden: false,
    hidden: true,
    editable: false
  },
  {
    name: "CUIT Cliente",
    type: "string",
    id: "ClienteFacturacionCUIT",
    field: "ClienteFacturacionCUIT",
    fieldName: "cli.ClienteFacturacionCUIT",
    sortable: true,
    searchHidden: true,
    hidden: false,
    editable: false
  },
  {
    name: "Razon social",
    type: "string",
    id: "ClienteDenominacion",
    field: "ClienteDenominacion",
    fieldName: "cli.ClienteDenominacion",
    sortable: true,
    searchHidden: true,
    hidden: false,
    editable: false
  },
  {
    name: "Cod Obj",
    type: "string",
    id: "codObjetivo",
    field: "codObjetivo",
    fieldName: "codObjetivo",
    sortable: true,
    searchHidden: true,
    hidden: false,
    editable: false
  },
  {
    name: "Objetivo",
    type: "number",
    id: "ObjetivoId",
    field: "ObjetivoId",
    fieldName: "obj.ObjetivoId",
    searchComponent: "inpurForObjetivoSearch",
    searchType: "number",
    hidden: true,
    searchHidden: false,
    editable: false
  },
  {
    name: "Nombre Obj",
    type: "string",
    id: "ClienteElementoDependienteDescripcion",
    field: "ClienteElementoDependienteDescripcion",
    fieldName: "eledep.ClienteElementoDependienteDescripcion",
    sortable: true,
    searchHidden: true,
    hidden: false,
    editable: false
  },
  {
    name: "Grupo Actividad",
    type: "number",
    id: "GrupoActividadId",
    field: "GrupoActividadId",
    fieldName: "ga.GrupoActividadId",
    searchComponent: 'inpurForGrupoActividadSearch',
    searchType: "number",
    sortable: false,
    hidden: true,
    searchHidden: false,
    editable: false
  },
  {
    name: "Grupo Actividad",
    type: "string",
    id: "GrupoActividadDetalle",
    field: "GrupoActividadDetalle",
    fieldName: "ga.GrupoActividadDetalle",
    sortable: true,
    searchHidden: true,
    hidden: false,
    editable: false
  },
  {
    name: "Mes",
    type: "number",
    id: "mes",
    field: "mes",
    fieldName: "mes",
    sortable: true,
    hidden: false,
    searchHidden: true,
    editable: false
  },
  {
    name: "Año",
    type: "number",
    id: "anio",
    field: "anio",
    fieldName: "anio",
    sortable: true,
    hidden: false,
    searchHidden: true,
    editable: false
  },
  {
    name: "Total Horas Normales",
    type: "float",
    id: "AsistenciaHorasN",
    field: "AsistenciaHorasN",
    fieldName: "objasissub.sumtotalhorascalc",
    searchType: "float",
    sortable: true,
    hidden: false,
    editable: false
  },
  {
    name: "Horas a facturar A",
    type: "float",
    id: "TotalHoraA",
    field: "TotalHoraA",
    fieldName: "ven.TotalHoraA",
    searchType: "float",
    sortable: true,
    hidden: false,
    editable: true
  },
  {
    name: "Horas a facturar B",
    type: "float",
    id: "TotalHoraB",
    field: "TotalHoraB",
    fieldName: "ven.TotalHoraB",
    searchType: "float",
    sortable: true,
    hidden: false,
    editable: true
  },  
  {
    name: "Diferencia Horas",
    type: "float",
    id: "DiferenciaHoras",
    field: "DiferenciaHoras",
    fieldName: "DiferenciaHoras",
    searchType: "float",
    sortable: true,
    hidden: false,
    editable: false
  },
  {
    name: "Importe Hora A",
    id: "ImporteHoraA",
    field: "ImporteHoraA",
    type: 'currency',
    fieldName: "ven.ImporteHoraA",
    searchType: "float",
    sortable: true,
    hidden: false,
  },
  {
    name: "Importe Hora B",
    id: "ImporteHoraB",
    field: "ImporteHoraB",
    type: 'currency',
    fieldName: "ven.ImporteHoraB",
    searchType: "float",
    sortable: true,
    hidden: false,
  },
  {
    name: "Total a Facturar",
    type: "currency",
    id: "TotalAFacturar",
    field: "TotalAFacturar",
    fieldName: "TotalAFacturar",
    searchType: "float",
    sortable: true,
    hidden: false,
    editable: false
  },
  {
    name: "Estado Carga",
    type: "string",
    id: "EstadoAsistencia",
    field: "EstadoAsistencia",
    fieldName: "EstadoAsistencia",
    searchType: "string",
    sortable: true,
    hidden: false,
    editable: false
  }
];


export class OrdenesDeVentaController extends BaseController {
  async getGridCols(req, res) {
    this.jsonRes(columnasGrilla, res);
  }

  async getListOrdenesDeVenta(req: Request, res: Response, next: NextFunction) {

    const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null };
    
    const filterSql = filtrosToSql(options.filtros, columnasGrilla);
    const orderBy = orderToSQL(options.sort)
    const anio = req.body.anio
    const mes = req.body.mes
    const queryRunner = dataSource.createQueryRunner();
    try {

      const listCargaLicenciaHistory = await queryRunner.query(`
        SELECT DISTINCT
          @1 anio,
          @2 mes,
          CONCAT(obj.ClienteId,'/' ,ISNULL(obj.ClienteElementoDependienteId,0)) as id, 
          suc.SucursalId, suc.SucursalDescripcion, obj.ObjetivoId, obj.ClienteId, obj.ClienteElementoDependienteId,fac.ClienteFacturacionCUIT,
          cli.ClienteDenominacion, eledep.ClienteElementoDependienteDescripcion,
          CONCAT(obj.ClienteId,'/' ,ISNULL(obj.ClienteElementoDependienteId,0)) as codObjetivo, IIF((obj.ObjetivoId IS NULL OR objm.ObjetivoAsistenciaAnoMesHasta IS NULL),'Pendiente','Cerrado') AS EstadoAsistencia,
          obja.ObjetivoAsistenciaAnoAno, objm.ObjetivoAsistenciaAnoMesMes,
          ga.GrupoActividadId, ga.GrupoActividadNumero, ga.GrupoActividadDetalle,
          gap.GrupoActividadObjetivoDesde, gap.GrupoActividadObjetivoHasta,
          objasissub.sumtotalhorascalc AS AsistenciaHorasN,
          objm.ObjetivoAsistenciaAnoMesHasta,

          ven.TotalHoraA, ven.TotalHoraB, ven.ImporteHoraA, ven.ImporteHoraB,
          
          (ISNULL(ven.TotalHoraA,0)+ISNULL(ven.TotalHoraB,0) -ISNULL( ven.TotalHorasReal,0)) AS DiferenciaHoras,
          ISNULL(ven.TotalHoraA,0)*ISNULL(ven.ImporteHoraA,0)+ISNULL(ven.TotalHoraB,0)*ISNULL(ven.ImporteHoraB,0) AS TotalAFacturar,

          1
        FROM Objetivo obj 
        LEFT JOIN ObjetivoImporteVenta ven ON ven.ClienteId =  obj.ClienteId AND ven.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND  ven.Anio = @1 AND ven.Mes = @2
        LEFT JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoId = obj.ObjetivoId AND obja.ObjetivoAsistenciaAnoAno = @1
        LEFT JOIN ObjetivoAsistenciaAnoMes objm ON objm.ObjetivoAsistenciaAnoId  = obja.ObjetivoAsistenciaAnoId AND  objm.ObjetivoId = obja.ObjetivoId AND objm.ObjetivoAsistenciaAnoMesMes = @2
        -- LEFT JOIN ObjetivoAsistenciaAnoMesPersonalDias objd ON objd.ObjetivoId = obj.ObjetivoId AND objd.ObjetivoAsistenciaAnoMesId = objm.ObjetivoAsistenciaAnoMesId AND objd.ObjetivoAsistenciaAnoId = objm.ObjetivoAsistenciaAnoId
        LEFT JOIN ClienteFacturacion fac ON fac.ClienteId = obj.ClienteId  AND fac.ClienteFacturacionDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1))  AND ISNULL(fac.ClienteFacturacionHasta, '9999-12-31') >= EOMONTH(DATEFROMPARTS(@1,@2,1))
        LEFT JOIN ( 
          SELECT objd.ObjetivoId, objd.ObjetivoAsistenciaAnoMesId, objd.ObjetivoAsistenciaAnoId,
            SUM(((
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
            ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias31Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias31Gral),2) AS INT),0) 
            ) / CAST(60 AS FLOAT)))  AS sumtotalhorascalc
          FROM ObjetivoAsistenciaAnoMesPersonalDias objd
          JOIN ObjetivoAsistenciaAnoMes objm ON objm.ObjetivoAsistenciaAnoMesId = objd.ObjetivoAsistenciaAnoMesId AND objm.ObjetivoAsistenciaAnoId = objd.ObjetivoAsistenciaAnoId AND objm.ObjetivoId = objd.ObjetivoId
          JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objm.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objm.ObjetivoId
          JOIN Objetivo obj ON obj.ObjetivoId = obja.ObjetivoId
          -- JOIN Personal persona ON persona.PersonalId = objd.ObjetivoAsistenciaMesPersonalId
          -- LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = persona.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = persona.PersonalId) 
          -- JOIN CategoriaPersonal cat ON cat.CategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId AND cat.TipoAsociadoId=objd.ObjetivoAsistenciaTipoAsociadoId
          JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
          JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId

          -- aca3
          LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
          LEFT JOIN ValorLiquidacion val ON val.ValorLiquidacionSucursalId = suc.SucursalId AND val.ValorLiquidacionTipoAsociadoId = objd.ObjetivoAsistenciaTipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId
            AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,1)BETWEEN val.ValorLiquidacionDesde AND ISNULL(val.ValorLiquidacionHasta,'9999-12-31')
          WHERE objd.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras = 'N' 
          GROUP BY objd.ObjetivoId, objd.ObjetivoAsistenciaAnoMesId, objd.ObjetivoAsistenciaAnoId

        ) objasissub ON objasissub.ObjetivoId = obj.ObjetivoId AND objasissub.ObjetivoAsistenciaAnoMesId = objm.ObjetivoAsistenciaAnoMesId AND objasissub.ObjetivoAsistenciaAnoId = objm.ObjetivoAsistenciaAnoId

        -- LEFT JOIN Personal persona ON persona.PersonalId = objd.ObjetivoAsistenciaMesPersonalId
        -- LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = persona.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = persona.PersonalId) 

        LEFT JOIN (
          SELECT gao.GrupoActividadObjetivoObjetivoId, MAX(ISNULL(gao.GrupoActividadObjetivoHasta,'9999-12-31')) AS GrupoActividadObjetivoHasta FROM GrupoActividadObjetivo gao WHERE EOMONTh(DATEFROMPARTS(@1,@2,1)) >=   gao.GrupoActividadObjetivoDesde  AND DATEFROMPARTS(@1,@2,1) <  ISNULL(gao.GrupoActividadObjetivoHasta,'9999-12-31') GROUP BY gao.GrupoActividadObjetivoObjetivoId
        ) AS gas ON gas.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId

        LEFT JOIN GrupoActividadObjetivo gap ON gap.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND EOMONTh(DATEFROMPARTS(@1,@2,1)) >=   gap.GrupoActividadObjetivoDesde  AND DATEFROMPARTS(@1,@2,1) <  ISNULL(gap.GrupoActividadObjetivoHasta,'9999-12-31')  AND ISNULL(gap.GrupoActividadObjetivoHasta,'9999-12-31') = gas.GrupoActividadObjetivoHasta

        LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId

        LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
        LEFT JOIN ClienteElementoDependienteContrato eledepcon ON eledepcon.ClienteId = obj.ClienteId AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId 
          AND EOMONTH(DATEFROMPARTS(@1,@2,1)) >= eledepcon.ClienteElementoDependienteContratoFechaDesde AND ISNuLL(eledepcon.ClienteElementoDependienteContratoFechaHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1) AND ISNuLL(eledepcon.ClienteElementoDependienteContratoFechaFinalizacion,'9999-12-31') >= DATEFROMPARTS(@1,@2,1)

        LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId 

        LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(eledep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)

        WHERE eledepcon.ClienteElementoDependienteContratoFechaDesde IS NOT NULL
        AND (${filterSql})
        ${orderBy}
        `, [ , anio, mes])
      this.jsonRes(
        {
          total: listCargaLicenciaHistory.length,
          list: listCargaLicenciaHistory,
        },
        res
      );

    } catch (error) {
      return next(error)
    }
  }
}
