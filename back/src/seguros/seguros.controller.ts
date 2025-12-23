import { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { QueryRunner } from "typeorm";
import { filtrosToSql, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { FileUploadController } from "src/controller/file-upload.controller";
import { Utils } from "src/liquidaciones/liquidaciones.utils";

const listaColumnas: any[] = [
  {
    id: "id",
    name: "id",
    field: "id",
    fieldName: "id",
    type: "number",
    sortable: false,
    hidden: true,
    searchHidden: true
  },
  {
    name: "Apellido Nombre",
    type: "string",
    id: "PersonalApellidoNombre",
    field: "PersonalApellidoNombre",
    fieldName: "PersonalApellidoNombre",
    sortable: true,
    searchHidden: true
  },
  {
    name: "Apellido Nombre",
    type: "string",
    id: "PersonalId",
    field: "PersonalId",
    fieldName: "per.PersonalId",
    searchComponent: "inputForPersonalSearch",
    sortable: false,
    hidden: true,
    searchHidden: false
  },
  {
    name: "Tipo seguro",
    type: "string",
    id: "TipoSeguroNombre",
    field: "TipoSeguroNombre",
    fieldName: "tipseg.TipoSeguroNombre",
    sortable: true,
    searchHidden: true
  },
  {
    name: "Tipo seguro ",
    type: "string",
    id: "TipoSeguroCodigo",
    field: "TipoSeguroCodigo",
    fieldName: "tipseg.TipoSeguroCodigo",
    searchComponent: "inputForTipoSeguroSearch",
    sortable: false,
    hidden: true,
    searchHidden: false
  },
  {
    name: "Motivo adhesión",
    type: "string",
    id: "PersonalSeguroMotivoAdhesion",
    field: "PersonalSeguroMotivoAdhesion",
    fieldName: "seg.PersonalSeguroMotivoAdhesion",
    sortable: true,
    searchHidden: true
  },
  {
    name: "Motivo baja",
    type: "string",
    id: "PersonalSeguroMotivoBaja",
    field: "PersonalSeguroMotivoBaja",
    fieldName: "seg.PersonalSeguroMotivoBaja",
    sortable: true,
    searchHidden: true
  },
  {
    id: "SituacionRevistaId",
    name: "Situacion Revista",
    field: "SituacionRevistaId",
    type: "number",
    fieldName: "sitrev.PersonalSituacionRevistaSituacionId",
    searchComponent: "inputForSituacionRevistaSearch",
    searchType: "number",
    sortable: true,
    searchHidden: false,
    hidden: true,
  },
  {
    name: "Fecha de adhesión",
    type: "date",
    id: "PersonalSeguroDesde",
    field: "PersonalSeguroDesde",
    fieldName: "seg.PersonalSeguroDesde",
    searchComponent: "inputForFechaSearch",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    name: "Fecha de baja",
    type: "date",
    id: "PersonalSeguroHasta",
    field: "PersonalSeguroHasta",
    fieldName: "seg.PersonalSeguroHasta",
    searchComponent: "inputForFechaSearch",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    name: "Última situación de Revista",
    type: "string",
    id: "SituacionRevistaDescripcion",
    field: "SituacionRevistaDescripcion",
    fieldName: " sitrev.SituacionRevistaDescripcion ",
    sortable: true,
    searchHidden: true
  },
  {
    name: "Desde",
    type: "date",
    id: "PersonalSituacionRevistaDesde",
    field: "PersonalSituacionRevistaDesde",
    fieldName: "sitrev.PersonalSituacionRevistaDesde",
    searchComponent: "inputForFechaSearch",
    sortable: true,
    hidden: false,
    searchHidden: false
  }
];


const listaColumnasPoliza: any[] = [
  {
    id: "id",
    name: "id",
    field: "id",
    fieldName: "id",
    type: "number",
    sortable: false,
    hidden: true,
    searchHidden: true
  },
  {
    id: "TipoSeguroCodigo",
    name: "Tipo de Seguro",
    field: "TipoSeguroCodigo",
    fieldName: "seg.TipoSeguroCodigo",
    type: "string",
    sortable: true,
    hidden: true,
    searchHidden: true
  },
   {
    name: "Tipo seguro",
    type: "string",
    id: "TipoSeguroNombre",
    field: "TipoSeguroNombre",
    fieldName: "tipseg.TipoSeguroNombre",
    sortable: true,
    searchHidden: true
  },
  {
    name: "Tipo seguro ",
    type: "string",
    id: "TipoSeguroCodigo",
    field: "TipoSeguroCodigo",
    fieldName: "tipseg.TipoSeguroCodigo",
    searchComponent: "inputForTipoSeguroSearch",
    sortable: false,
    hidden: true,
    searchHidden: false
  },
  {
    id: "PolizaSeguroNroPoliza",
    name: "Número de Poliza",
    field: "PolizaSeguroNroPoliza",
    fieldName: "seg.PolizaSeguroNroPoliza",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    id: "PolizaSeguroNroEndoso",
    name: "Número de Endoso",
    field: "PolizaSeguroNroEndoso",
    fieldName: "seg.PolizaSeguroNroEndoso",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    id: "PolizaSeguroFechaEndoso",
    name: "Fecha de Endoso",
    field: "PolizaSeguroFechaEndoso",
    fieldName: "seg.PolizaSeguroFechaEndoso",
    type: "date",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    id: "CompaniaSeguroId",
    name: "Compañía",
    field: "CompaniaSeguroId",
    fieldName: "seg.CompaniaSeguroId",
    type: "number",
    sortable: true,
    hidden: true,
    searchHidden: true
  },
  {
    id: "CompaniaSeguroDescripcion",
    name: "Compañía",
    field: "CompaniaSeguroDescripcion",
    fieldName: "cs.CompaniaSeguroDescripcion",
    searchComponent: "inputForCompaniaSeguroSearch",
    searchType: "string",
    sortable: true,
    searchHidden: false,
    hidden: false,
  }

];

const listaColumnasPersonalSeguro: any[] = [
  {
    id: "id",
    name: "id",
    field: "id",
    fieldName: "id",
    type: "number",
    sortable: false,
    hidden: true,
    searchHidden: true
  },
  {
    name: "Apellido Nombre ",
    type: "string",
    id: "PersonalId",
    field: "PersonalId",
    fieldName: "per.PersonalId",
    searchComponent: "inputForPersonalSearch",
    sortable: false,
    hidden: true,
    searchHidden: false
  },
  {
    id: "PersonalApellidoNombre",
    name: "Apellido y Nombre",
    field: "PersonalApellidoNombre",
    fieldName: "per.PersonalApellidoNombre",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: "PersonalCUITCUILCUIT",
    name: "CUIL/CUIT",
    field: "PersonalCUITCUILCUIT",
    fieldName: "cuit.PersonalCUITCUILCUIT",
    type: "string",
    sortable: false,
    hidden: true,
    searchHidden: true
  },
  {
    id: "TipoSeguroCodigo",
    name: "Código Tipo Seguro",
    field: "TipoSeguroCodigo",
    fieldName: "poliz.TipoSeguroCodigo",
    type: "string",
    hidden: true,
    searchHidden: false,
    sortable: true
  },
  {
    id: "PolizaSeguroNroEndoso",
    name: "Número de Endoso",
    field: "PolizaSeguroNroEndoso",
    fieldName: "poliz.PolizaSeguroNroEndoso",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    id: "PolizaSeguroNroPoliza",
    name: "Número de Póliza",
    field: "PolizaSeguroNroPoliza",
    fieldName: "poliz.PolizaSeguroNroPoliza",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    id: "TipoSeguroNombre",
    name: "Tipo de Seguro",
    field: "TipoSeguroNombre",
    fieldName: "ts.TipoSeguroNombre",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: "CompaniaSeguroDescripcion",
    name: "Compañía",
    field: "CompaniaSeguroDescripcion",
    fieldName: "cs.CompaniaSeguroDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    name: "Tipo seguro ",
    type: "string",
    id: "TipoSeguroCodigo",
    field: "TipoSeguroCodigo",
    fieldName: "tipseg.TipoSeguroCodigo",
    searchComponent: "inputForTipoSeguroSearch",
    sortable: false,
    hidden: true,
    searchHidden: false
  },
]



export class SegurosController extends BaseController {


  private async getPersonalBySitRev(queryRunner: any, anio: number, mes: number) {
    return queryRunner.query(`SELECT 
          psr.*,
          persr.PersonalSituacionRevistaDesde,
          persr.PersonalSituacionRevistaSituacionId AS SituacionRevistaId,
          DATEDIFF(MONTH, persr.PersonalSituacionRevistaDesde, EOMONTH(DATEFROMPARTS(@1,@2,1))) AS month_diff
      FROM (
          SELECT 
              persr.PersonalId,
              STRING_AGG(
                  CONCAT(TRIM(sitrev.SituacionRevistaDescripcion), ' ', FORMAT(persr.PersonalSituacionRevistaDesde,'dd-MM-yyyy')),
                  ', '
              ) AS detalle,
              DATEADD(MONTH, -1, DATEFROMPARTS(@1,@2,1)) AS desde,
              EOMONTH(DATEFROMPARTS(@1,@2,1)) AS hasta
          FROM PersonalSituacionRevista persr
          LEFT JOIN SituacionRevista sitrev  
              ON sitrev.SituacionRevistaId = persr.PersonalSituacionRevistaSituacionId 
          WHERE persr.PersonalSituacionRevistaDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1))
            AND ISNULL(persr.PersonalSituacionRevistaHasta, '9999-12-31') >= DATEADD(MONTH,-1,DATEFROMPARTS(@1,@2,1))
          GROUP BY persr.PersonalId
      ) AS psr
      OUTER APPLY (
          SELECT TOP 1 *
          FROM PersonalSituacionRevista p2
          WHERE p2.PersonalId = psr.PersonalId
            AND p2.PersonalSituacionRevistaDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1))
            AND ISNULL(p2.PersonalSituacionRevistaHasta, '9999-12-31') >= DATEFROMPARTS(@1,@2,1)
          ORDER BY 
              CASE WHEN p2.PersonalSituacionRevistaSituacionId IN (2,10,12) THEN 0 ELSE 1 END, -- prioridad
              p2.PersonalSituacionRevistaDesde DESC
      ) persr
      `, [, anio, mes])

  }


  private async getPersonalEnSeguro(queryRunner: any, TipoSeguroNombre: string, anio: number, mes: number) {
    return queryRunner.query(`SELECT seg.PersonalId, seg.PersonalSeguroDesde, seg.PersonalSeguroHasta, seg.TipoSeguroCodigo, sitrev.PersonalSituacionRevistaSituacionId AS SituacionRevistaId, s.SituacionRevistaDescripcion, sitrev.PersonalSituacionRevistaDesde
      FROM PersonalSeguro seg
      OUTER APPLY (
          SELECT TOP 1 
                p.PersonalSituacionRevistaSituacionId, 
                p.PersonalSituacionRevistaDesde, 
                p.PersonalId
          FROM PersonalSituacionRevista p
          WHERE p.PersonalId = seg.PersonalId
            AND p.PersonalSituacionRevistaDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1))
            AND ISNULL(p.PersonalSituacionRevistaHasta,'9999-12-31') >= (DATEFROMPARTS(@1,@2,1))
          ORDER BY 
              CASE WHEN p.PersonalSituacionRevistaSituacionId IN (2,10,12) THEN 0 ELSE 1 END, -- prioridad
              p.PersonalSituacionRevistaDesde DESC
      ) sitrev
      LEFT JOIN SituacionRevista s 
            ON s.SituacionRevistaId = sitrev.PersonalSituacionRevistaSituacionId
      WHERE seg.TipoSeguroCodigo = @0
        AND seg.PersonalSeguroDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) 
        AND ISNULL(seg.PersonalSeguroHasta,'9999-12-31') >= EOMONTH(DATEFROMPARTS(@1,@2,1))`, [TipoSeguroNombre, anio, mes])
  }

  private async getPersonalResponableByClientId(queryRunner: any, ClientId: number, anio: number, mes: number) {
    return queryRunner.query(`SELECT DISTINCT gaj.GrupoActividadJerarquicoPersonalId PersonalId, 'Responsable' detalle  
      FROM Objetivo obj 
        JOIN GrupoActividadObjetivo gao ON gao.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND gao.GrupoActividadObjetivoDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND ISNULL(gao.GrupoActividadObjetivoHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1)
        JOIN ClienteElementoDependienteContrato con ON con.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND con.ClienteId = obj.ClienteId AND con.ClienteElementoDependienteContratoFechaDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND ISNULL(con.ClienteElementoDependienteContratoFechaHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1)
        JOIN GrupoActividadJerarquico gaj ON gaj.GrupoActividadId = gao.GrupoActividadId AND  gaj.GrupoActividadJerarquicoDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND ISNULL(gaj.GrupoActividadJerarquicoHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1) AND gaj.GrupoActividadJerarquicoComo='J'
      WHERE obj.ClienteId = @0 
    `, [ClientId, anio, mes])
  }


  private async getPersonalHorasByClientId(queryRunner: any, ClientId: number, anio: number, mes: number) {
    //Incluye Horas de Vigilancia y Custodia
    return queryRunner.query(`
        SELECT  
		-- obja.ObjetivoAsistenciaAnoAno, 
		-- objm.ObjetivoAsistenciaAnoMesMes, 
		objd.ObjetivoAsistenciaMesPersonalId PersonalId,
		-- CONCAT(TRIM(per.PersonalApellido),', ',TRIM(per.PersonalNombre)) PersonaDes,

		--objetivo
		-- obj.ObjetivoId, 
		STRING_AGG(CONCAT(obj.ClienteId,'/', ISNULL(obj.ClienteElementoDependienteId,0),' ',  



		--Calculo de horas
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
		ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias31Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias31Gral),2) AS INT),0) 
		) / CAST(60 AS FLOAT)) 
		
		, 'hs'),', ') detalle





FROM ObjetivoAsistenciaAnoMesPersonalDias objd
		JOIN ObjetivoAsistenciaAnoMes objm ON objm.ObjetivoAsistenciaAnoMesId = objd.ObjetivoAsistenciaAnoMesId 
					AND objm.ObjetivoAsistenciaAnoId = objd.ObjetivoAsistenciaAnoId 
					AND objm.ObjetivoId = objd.ObjetivoId

		JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objm.ObjetivoAsistenciaAnoId 
					AND obja.ObjetivoId = objm.ObjetivoId

		JOIN Objetivo obj ON obj.ObjetivoId = obja.ObjetivoId
		JOIN Personal per ON per.PersonalId = objd.ObjetivoAsistenciaMesPersonalId

WHERE obja.ObjetivoAsistenciaAnoAno = @1 
		AND objm.ObjetivoAsistenciaAnoMesMes = @2 
		AND obj.ClienteId = @0

GROUP BY objd.ObjetivoAsistenciaMesPersonalId

UNION 

            SELECT per.PersonalId, CONCAT('Custodia/s ',STRING_AGG(obj.objetivo_custodia_id,', ')) detalle
            -- SUM(ABS(CEILING(CONVERT(FLOAT,DATEDIFF(minute, obj.fecha_inicio,obj.fecha_fin)) / 60))) AS detalle
            FROM dbo.Personal AS per
            INNER JOIN lige.dbo.regpersonalcustodia regp ON per.PersonalId= regp.personal_id
            INNER JOIN lige.dbo.objetivocustodia obj ON regp.objetivo_custodia_id= obj.objetivo_custodia_id
            INNER JOIN lige.dbo.Cliente cli ON cli.ClienteId = obj.cliente_id
            INNER JOIN lige.dbo.Personal perres ON perres.PersonalId = obj.responsable_id
            WHERE (DATEPART(YEAR,obj.fecha_liquidacion)=@1 AND  DATEPART(MONTH, obj.fecha_liquidacion)=@2) AND obj.cliente_id = @0
				GROUP BY per.PersonalId



`, [ClientId, anio, mes])
  }



  async updateSeguros(req: any, res: any, anio: number, mes: number, next: NextFunction) {
    const stm_now = new Date()
    const usuario = res?.locals.userName || 'server'
    const ip = this.getRemoteAddress(req)

    let segAltas = 0, segBajas = 0
    const queryRunner = dataSource.createQueryRunner();


    const { ProcesoAutomaticoLogCodigo } = await this.procesoAutomaticoLogInicio(
      queryRunner,
      `Actualización de Seguros ${mes}/${anio}`,
      { anio, mes, usuario, ip },
      usuario,
      ip
    );

    let seguro: any[] = []
    try {
      // Log de inicio


      await queryRunner.startTransaction();

      const PersonalSeguroDesde = new Date(anio, mes - 1, 1)
      const PersonalSeguroHasta = new Date(anio, mes - 1, 0)

      const maxfechas = (await queryRunner.query(`SELECT MAX(seg.PersonalSeguroDesde) PersonalSeguroDesde_max, MAX(seg.PersonalSeguroHasta) PersonalSeguroHasta_max FROM PersonalSeguro seg`))[0]
      const PersonalSeguroDesde_max = new Date(maxfechas.PersonalSeguroDesde_max)
      const PersonalSeguroHasta_max = new Date(maxfechas.PersonalSeguroHasta_max)

      if (PersonalSeguroDesde_max > PersonalSeguroDesde || PersonalSeguroHasta_max > PersonalSeguroHasta) {
        throw new ClientException("El período seleccionado es menor al ya procesado", { PersonalSeguroDesde_max, PersonalSeguroHasta_max })
      }
      await queryRunner.query(`UPDATE PersonalSeguro SET PersonalSeguroMotivoBaja=NULL, PersonalSeguroHasta= NULL WHERE PersonalSeguroHasta >= @0`,
        [PersonalSeguroHasta])

      await queryRunner.query(`DELETE PersonalSeguro WHERE PersonalSeguroDesde >= @0`,
        [PersonalSeguroDesde])

      //  throw new ClientException("stop")
      const personalCoto = [...await this.getPersonalHorasByClientId(queryRunner, 1, anio, mes), ...await this.getPersonalResponableByClientId(queryRunner, 1, anio, mes)]

      const personalEdesur = [...await this.getPersonalHorasByClientId(queryRunner, 798, anio, mes), ...await this.getPersonalResponableByClientId(queryRunner, 798, anio, mes)]

      const personalEnergiaArgentina = [...await this.getPersonalHorasByClientId(queryRunner, 866, anio, mes), ...await this.getPersonalResponableByClientId(queryRunner, 866, anio, mes), ...await this.getPersonalHorasByClientId(queryRunner, 867, anio, mes), ...await this.getPersonalResponableByClientId(queryRunner, 867, anio, mes)]

      const personalSitRev = await this.getPersonalBySitRev(queryRunner, anio, mes)

      const personalEnSeguroCoto = await this.getPersonalEnSeguro(queryRunner, 'APC', anio, mes)

      const personalEnSeguroEdesur = await this.getPersonalEnSeguro(queryRunner, 'APE', anio, mes)

      const personalEnSeguroVidCol = await this.getPersonalEnSeguro(queryRunner, 'VC', anio, mes)

      const personalEnSeguroEnergiaArgentina = await this.getPersonalEnSeguro(queryRunner, 'APEA', anio, mes)

      for (const row of personalCoto) {
        const rowEnSeguro = personalEnSeguroCoto.find(r => r.PersonalId == row.PersonalId)
        if (rowEnSeguro) {
          await this.queryUpdSeguros(queryRunner, row.PersonalId, rowEnSeguro.PersonalSeguroDesde, rowEnSeguro.TipoSeguroNombre, row.detalle, stm_now, usuario, ip)
        } else {
          segAltas++
          await this.queryAddSeguros(queryRunner, row.PersonalId, PersonalSeguroDesde, 'APC', row.detalle, stm_now, usuario, ip)
        }
        segBajas++
        await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'AP', 'En COTO ' + row.detalle, stm_now, usuario, ip)
      }

      for (const row of personalEdesur) {
        const rowEnSeguro = personalEnSeguroEdesur.find(r => r.PersonalId == row.PersonalId)
        if (rowEnSeguro) {
          await this.queryUpdSeguros(queryRunner, row.PersonalId, rowEnSeguro.PersonalSeguroDesde, rowEnSeguro.TipoSeguroNombre, row.detalle, stm_now, usuario, ip)
        } else {
          segAltas++
          await this.queryAddSeguros(queryRunner, row.PersonalId, PersonalSeguroDesde, 'APE', row.detalle, stm_now, usuario, ip)
        }
        segBajas++
        await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'APG', 'En Edesur ' + row.detalle, stm_now, usuario, ip)
      }

      for (const row of personalEnergiaArgentina) {
        const rowEnSeguro = personalEnSeguroEnergiaArgentina.find(r => r.PersonalId == row.PersonalId)
        if (rowEnSeguro) {
          await this.queryUpdSeguros(queryRunner, row.PersonalId, rowEnSeguro.PersonalSeguroDesde, rowEnSeguro.TipoSeguroNombre, row.detalle, stm_now, usuario, ip)
        } else {
          segAltas++
          await this.queryAddSeguros(queryRunner, row.PersonalId, PersonalSeguroDesde, 'APEA', row.detalle, stm_now, usuario, ip)
        }
        segBajas++
        await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'APG', 'En EnergiaArgentina ' + row.detalle, stm_now, usuario, ip)
      }




      //TODO: Falta sacer los de coto y edesur

      const personalEnSeguroGeneral = await this.getPersonalEnSeguro(queryRunner, 'APG', anio, mes)

      for (const row of personalEnSeguroCoto) {
        if (!personalCoto.find(r => r.PersonalId == row.PersonalId) && row.SituacionRevistaId != 10) {
          segBajas++
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'APC', `Sin horas en COTO (${mes}/${anio})`, stm_now, usuario, ip)
        }
      }

      for (const row of personalEnSeguroEdesur) {
        if (!personalEdesur.find(r => r.PersonalId == row.PersonalId) && row.SituacionRevistaId != 10) {
          segBajas++
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'APE', `Sin horas en Edesur (${mes}/${anio})`, stm_now, usuario, ip)
        }
      }

      for (const row of personalEnSeguroEnergiaArgentina) {
        if (!personalEnergiaArgentina.find(r => r.PersonalId == row.PersonalId) && row.SituacionRevistaId != 10) {
          segBajas++
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'APEA', `Sin horas en Energia Argentina (${mes}/${anio})`, stm_now, usuario, ip)
        }
      }

      const personalEnSeguroCoto2 = await this.getPersonalEnSeguro(queryRunner, 'APC', anio, mes)
      const personalEnSeguroEdesur2 = await this.getPersonalEnSeguro(queryRunner, 'APE', anio, mes)
      const personalEnSeguroEnergiaArgentna2 = await this.getPersonalEnSeguro(queryRunner, 'APEA', anio, mes)

      for (const row of personalSitRev) {
        if (personalEnSeguroCoto2.find(r => r.PersonalId == row.PersonalId) || personalEnSeguroEdesur2.find(r => r.PersonalId == row.PersonalId) || personalEnSeguroEnergiaArgentna2.find(r => r.PersonalId == row.PersonalId)) {
          continue
        }
        const rowEnSeguro = personalEnSeguroGeneral.find(r => r.PersonalId == row.PersonalId)
        if (rowEnSeguro) {
          await this.queryUpdSeguros(queryRunner, row.PersonalId, rowEnSeguro.PersonalSeguroDesde, 'APG', row.detalle, stm_now, usuario, ip)
        } else {
          if ([7].includes(row.SituacionRevistaId) && row.month_diff > 3)
            continue
          if ([3, 4, 5, 6, 8, 11, 13, 14, 15, 17, 19, 21, 22, 24, 26, 27, 29, 30, 31, 36].includes(row.SituacionRevistaId))
            continue

          segAltas++
          await this.queryAddSeguros(queryRunner, row.PersonalId, PersonalSeguroDesde, 'APG', row.detalle, stm_now, usuario, ip)
        }
      }

      for (const row of personalEnSeguroGeneral) {
        if (personalEnSeguroCoto2.find(r => r.PersonalId == row.PersonalId)) {
          segBajas++
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'APG', 'Paso a Coto', stm_now, usuario, ip)
        }
        if (personalEnSeguroEdesur2.find(r => r.PersonalId == row.PersonalId)) {
          segBajas++
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'APG', 'Paso a Edesur', stm_now, usuario, ip)
        }
        if (personalEnSeguroEnergiaArgentna2.find(r => r.PersonalId == row.PersonalId)) {
          segBajas++
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'APG', 'Paso a Energia Argentina', stm_now, usuario, ip)
        }
        const rowEnSitRev = personalSitRev.find(r => r.PersonalId == row.PersonalId)

        if (!personalSitRev.find(r => r.PersonalId == row.PersonalId)) {
          segBajas++
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'APG', 'No tiene situación revista (2,10,11,20,12,7)', stm_now, usuario, ip)
        } else {
          if ([7].includes(rowEnSitRev.SituacionRevistaId) && rowEnSitRev.month_diff > 3) {
            segBajas++
            await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'APG', rowEnSitRev.detalle + ' mayor a 3 meses', stm_now, usuario, ip)
          }
          if ([3, 4, 5, 6, 8, 11, 13, 14, 15, 17, 19, 21, 22, 24, 26, 27, 29, 30, 31, 36].includes(rowEnSitRev.SituacionRevistaId)) {
            segBajas++
            await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'APG', rowEnSitRev.detalle + ' baja', stm_now, usuario, ip)
          }
        }
      }

      //Vida Colectivo
      for (const row of personalSitRev) {
        if ([7].includes(row.SituacionRevistaId) && row.month_diff > 3)
          continue
        if ([3, 4, 5, 6, 8, 11, 13, 14, 15, 17, 19, 21, 22, 24, 26, 27, 29, 30, 31, 36].includes(row.SituacionRevistaId))
          continue

        const rowEnSeguro = personalEnSeguroVidCol.find(r => r.PersonalId == row.PersonalId)
        if (rowEnSeguro) {
          await this.queryUpdSeguros(queryRunner, row.PersonalId, rowEnSeguro.PersonalSeguroDesde, 'VC', row.detalle, stm_now, usuario, ip)
        } else {
          segAltas++
          await this.queryAddSeguros(queryRunner, row.PersonalId, PersonalSeguroDesde, 'VC', row.detalle, stm_now, usuario, ip)
        }
      }

      for (const row of personalEnSeguroVidCol) {
        const rowEnSitRev = personalSitRev.find(r => r.PersonalId == row.PersonalId)
        if (!personalSitRev.find(r => r.PersonalId == row.PersonalId)) {
          segBajas++
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'VC', 'No tiene situación revista (2,10,11,20,12,8,29,36,30,31,7)', stm_now, usuario, ip)
        } else {
          if ([7].includes(rowEnSitRev.SituacionRevistaId) && rowEnSitRev.month_diff > 3) {
            segBajas++
            await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'VC', rowEnSitRev.detalle + ' mayor a 3 meses', stm_now, usuario, ip)
          }
          if ([3, 4, 5, 6, 8, 11, 13, 14, 15, 17, 19, 21, 22, 24, 26, 27, 29, 30, 31, 36].includes(rowEnSitRev.SituacionRevistaId)) {
            segBajas++
            await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'VC', rowEnSitRev.detalle + ' baja', stm_now, usuario, ip)
          }
        }
      }

      await queryRunner.commitTransaction()

      await this.procesoAutomaticoLogFin(
        queryRunner,
        ProcesoAutomaticoLogCodigo,
        'COM',
        { res: `Procesado correctamente`,segAltas,segBajas },
        usuario,
        ip
      );
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      await this.procesoAutomaticoLogFin( queryRunner,
        ProcesoAutomaticoLogCodigo,
        'ERR',
        { res: error },
        usuario,
        ip
      );

      return next(error)
    }

    return (res) ? this.jsonRes(true, res, `Procesado correctamente altas:${segAltas}, bajas:${segBajas}`) : true
  }

  queryUpdSeguros(queryRunner: QueryRunner, PersonalId: any, PersonalSeguroDesde: Date, TipoSeguroNombre: string, PersonalSeguroMotivoAdhesion: string, stm_now: Date, usuario: string, ip: string) {
    return queryRunner.query(`UPDATE PersonalSeguro SET PersonalSeguroMotivoAdhesion=@3, PersonalSeguroHasta=@4, PersonalSeguroAudFechaMod=@5, PersonalSeguroAudUsuarioMod=@6, PersonalSeguroAudIpMod=@7 
      WHERE PersonalId=@0 AND PersonalSeguroDesde=@1 AND TipoSeguroCodigo = @2
    `, [PersonalId, PersonalSeguroDesde, TipoSeguroNombre, PersonalSeguroMotivoAdhesion, null, stm_now, usuario, ip])
  }

  queryUpdSegurosFin(queryRunner: QueryRunner, PersonalId: number, PersonalSeguroHasta: Date, TipoSeguroNombre: string, PersonalSeguroMotivoBaja: string, stm_now: Date, usuario: string, ip: string) {
    return queryRunner.query(`UPDATE PersonalSeguro SET PersonalSeguroMotivoBaja=@2, PersonalSeguroHasta=@3, PersonalSeguroAudFechaMod=@4, PersonalSeguroAudUsuarioMod=@5, PersonalSeguroAudIpMod=@6 
      WHERE PersonalId=@0 AND TipoSeguroCodigo = @1 AND PersonalSeguroDesde <= @3 AND PersonalSeguroHasta IS NULL
    `, [PersonalId, TipoSeguroNombre, PersonalSeguroMotivoBaja, PersonalSeguroHasta, stm_now, usuario, ip])
  }

  queryAddSeguros(queryRunner: QueryRunner, PersonalId: number, PersonalSeguroDesde: Date, TipoSeguroNombre: string, PersonalSeguroMotivoAdhesion: string, stm_now: Date, usuario: string, ip: string) {
    return queryRunner.query(`INSERT PersonalSeguro (PersonalId, TipoSeguroCodigo, PersonalSeguroDesde, PersonalSeguroHasta, PersonalSeguroMotivoAdhesion, PersonalSeguroMotivoBaja, PersonalSeguroAudFechaIng, PersonalSeguroAudUsuarioIng, PersonalSeguroAudIpIng, PersonalSeguroAudFechaMod, PersonalSeguroAudUsuarioMod, PersonalSeguroAudIpMod) 
      VALUES  (@0,@1, @2, @3,@4, @5, @6, @7, @8, @9, @10, @11)
    `, [PersonalId, TipoSeguroNombre, PersonalSeguroDesde, null, PersonalSeguroMotivoAdhesion, null, stm_now, usuario, ip, stm_now, usuario, ip])
  }


  async getGridCols(req, res) {
    this.jsonRes(listaColumnas, res);
  }


  async getGridColsPoliza(req, res) {
    this.jsonRes(listaColumnasPoliza, res);
  }

  async getColsPersonalSeguro(req, res, next) {
    this.jsonRes(listaColumnasPersonalSeguro, res);
  }


  async getSegurosList(
    req: any,
    res: Response, next: NextFunction
  ) {
    console.log("req.body.options.filtros ", req.body.options.filtros)
    const filterSql = filtrosToSql(req.body.options.filtros, listaColumnas);
    const orderBy = orderToSQL(req.body.options.sort)
    const anio: number = req.body.anio
    const mes: number = req.body.mes
    try {
      const result = await dataSource.query(`
       SELECT
            ROW_NUMBER() OVER (ORDER BY per.PersonalId) AS id,
            per.PersonalId,
            CONCAT(per.PersonalApellido,' ',per.PersonalNombre) PersonalApellidoNombre,
            seg.TipoSeguroCodigo,
            tipseg.TipoSeguroNombre,
            seg.PersonalSeguroMotivoAdhesion,
            seg.PersonalSeguroMotivoBaja,
            seg.PersonalSeguroDesde,
            seg.PersonalSeguroHasta,
            sitrev.PersonalSituacionRevistaSituacionId,
            sitrev.SituacionRevistaDescripcion,
            sitrev.PersonalSituacionRevistaDesde
        FROM Personal per
        LEFT JOIN PersonalSeguro seg ON per.PersonalId = seg.PersonalId
         LEFT JOIN TipoSeguro tipseg ON seg.TipoSeguroCodigo = tipseg.TipoSeguroCodigo
       
        LEFT JOIN (
				SELECT p.PersonalId, p.PersonalSituacionRevistaSituacionId, s.SituacionRevistaDescripcion,p.PersonalSituacionRevistaDesde
				FROM PersonalSituacionRevista p
				JOIN SituacionRevista s
				ON p.PersonalSituacionRevistaSituacionId = s.SituacionRevistaId 
			    AND ISNULL(p.PersonalSituacionRevistaHasta, '9999-12-31') >= GETDATE()
				) sitrev ON sitrev.PersonalId = per.PersonalId	
           WHERE (1=1)
         AND ${filterSql}
        ${orderBy}
      `)
      this.jsonRes(
        {
          total: result.length,
          list: result,
        },
        res
      );

    } catch (error) {
      return next(error)
    }
  }


  async getListPolizaSeguro(
    req: any,
    res: Response, next: NextFunction
  ) {
    //console.log("req.body.options.filtros ", req.body.options.filtros)
    const filterSql = filtrosToSql(req.body.options.filtros, listaColumnasPoliza);
    const orderBy = orderToSQL(req.body.options.sort)
    try {
      let result = await dataSource.query(`
      SELECT 
        ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS id,
        seg.TipoSeguroNombre,
        seg.TipoSeguroCodigo,
        ps.PolizaSeguroNroPoliza,
        ps.PolizaSeguroNroEndoso,
        ps.PolizaSeguroFechaEndoso,
        cs.CompaniaSeguroDescripcion,
        ps.PolizaSeguroAnio,
        ps.CompaniaSeguroId,
        ps.PolizaSeguroMes
      FROM PolizaSeguro ps
      LEFT JOIN TipoSeguro seg ON seg.TipoSeguroCodigo = ps.TipoSeguroCodigo
      LEFT JOIN CompaniaSeguro cs ON cs.CompaniaSeguroId = ps.CompaniaSeguroId
      WHERE (1=1)
       AND ${filterSql}
       ${orderBy}
      `)
      this.jsonRes(
        {
          total: result.length,
          list: result,
        },
        res
      );

    } catch (error) {
      return next(error)
    }
  }



  async getListPersonalSeguro(
    req: any,
    res: Response, next: NextFunction
  ) {
    //console.log("req.body.options.filtros ", req.body.options.filtros)
    const filterSql = filtrosToSql(req.body.options.filtros, listaColumnasPersonalSeguro);
    const orderBy = orderToSQL(req.body.options.sort)
    try {
      let result = await dataSource.query(`
      SELECT  ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS id, perpoliz.PolizaSeguroNroPoliza,
      perpoliz.PolizaSeguroNroEndoso,perpoliz.CompaniaSeguroId,perpoliz.TipoSeguroCodigo,per.PersonalId,per.PersonalApellidoNombre,
      cuit.PersonalCUITCUILCUIT, poliz.polizaSeguroNroEndoso,tipseg.TipoSeguroNombre,cs.CompaniaSeguroDescripcion
      FROM PersonalPolizaSeguro AS perpoliz
      JOIN Personal per ON per.PersonalId = perpoliz.PersonalPolizaSeguroPersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId     
      AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)
      LEFT JOIN PolizaSeguro poliz ON poliz.PolizaSeguroNroPoliza =  perpoliz.PolizaSeguroNroPoliza
       AND poliz.PolizaSeguroNroEndoso =  perpoliz.PolizaSeguroNroEndoso 
       AND poliz.CompaniaSeguroId =  perpoliz.CompaniaSeguroId 
       AND poliz.TipoSeguroCodigo =  perpoliz.TipoSeguroCodigo
      LEFT JOIN TipoSeguro tipseg ON tipseg.TipoSeguroCodigo = poliz.TipoSeguroCodigo
      LEFT JOIN CompaniaSeguro cs ON cs.CompaniaSeguroId = poliz.CompaniaSeguroId
      WHERE (1=1)
      AND ${filterSql}
       ${orderBy}
      `)
      this.jsonRes(
        {
          total: result.length,
          list: result,
        },
        res
      );

    } catch (error) {
      return next(error)
    }
  }

  async getPolizaSeguro(req: any, res: Response, next: NextFunction) {

    try {
      //acomodar select para que sea el correcto
      const result = await dataSource.query(`
      SELECT
        ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS id,
        ts.TipoSeguroNombre,
        ps.TipoSeguroCodigo,
        ps.DocumentoId,
        ps.PolizaSeguroNroPoliza,
        ps.PolizaSeguroNroEndoso,
        ps.PolizaSeguroFechaEndoso,
        ps.PolizaSeguroResultado,
        ps.CompaniaSeguroId, 
        cs.CompaniaSeguroDescripcion,
        ps.PolizaSeguroAnio,
        ps.PolizaSeguroMes
      FROM PolizaSeguro ps
      LEFT JOIN TipoSeguro ts ON ts.TipoSeguroCodigo = ps.TipoSeguroCodigo
      LEFT JOIN CompaniaSeguro cs ON cs.CompaniaSeguroId = ps.CompaniaSeguroId
      WHERE ps.PolizaSeguroNroPoliza = @0 AND ps.PolizaSeguroNroEndoso = @1 AND ps.CompaniaSeguroId = @2 AND ps.TipoSeguroCodigo = @3`, [req.params.PolizaSeguroNroPoliza, req.params.PolizaSeguroNroEndoso, req.params.CompaniaSeguroId, req.params.TipoSeguroCodigo])

      this.jsonRes(result, res);
    } catch (error) {
      return next(error)
    }

  }

  async setPolizaSeguro(req: any, res: Response, next: NextFunction) {

    let {
      PolizaSeguroNroPoliza,
      PolizaSeguroNroEndoso,
      CompaniaSeguroId,
      TipoSeguroCodigo,
      PolizaSeguroFechaEndoso,
      PolizaSeguroAnio,
      PolizaSeguroMes,
      files

    } = req.body

    let result = []

    console.log("req.body", req.body)

    let resultFile = null
    const usuario = res.locals.userName
    const ip = this.getRemoteAddress(req)
    // throw new ClientException(`test.`)
    const queryRunner = dataSource.createQueryRunner()
    await queryRunner.connect();
    await queryRunner.startTransaction();

    //const periodo_id = await Utils.getPeriodoId(queryRunner, new Date(), anio, mes, usuario, ip);


    try {

      await this.validateFormPolizaSeguro(req.body, queryRunner)

      //#Crear validacion para periodo

      const getRegex = await queryRunner.query(`SELECT CompaniaSeguroFiltroDocumento FROM CompaniaSeguro WHERE CompaniaSeguroId = @0`, [CompaniaSeguroId])
      const regex = JSON.parse(getRegex[0].CompaniaSeguroFiltroDocumento)

      const detalle_documento = await FileUploadController.FileData(files[0].tempfilename)



      //const dniRegex = new RegExp(regex.DNILista, "mg")
      const polizaRegex = new RegExp(regex.Poliza, "m")
      const endosoRegex = new RegExp(regex.Endoso, "m")
      const fechaDesdeRegex = new RegExp(regex.FechaDesde, "m")

      const dniRegex = new RegExp(/DNI\s+([\d.]+)(?!\d)/g);
      //const polizaRegex = new RegExp(/(\d{9}) (?=\d{6})/m);
      //const endosoRegex = new RegExp(/\d{9} (\d{6})/m);
      //const fechaDesdeRegex = new RegExp(/^(\d{2}\.\d{2}\.\d{4})/m);

      //console.log("detalle_documento", detalle_documento)
      //const dni = detalle_documento.match(dniRegex).map(match => match.replace('DNI ', ''))
      const dnis = [...detalle_documento.matchAll(dniRegex)].map(m => m[1]);

      const dnisLimpios = dnis.map(dni => {
        const soloNumeros = dni.replace(/\./g, '');
        const recortado = soloNumeros.slice(0, 8); // solo 8 dígitos
        return (
          recortado.length === 8
            ? `${recortado.slice(0, -6)}.${recortado.slice(-6, -3)}.${recortado.slice(-3)}`
            : dni // deja como estaba si no son 8 dígitos
        );
      });

      const polizaEndoso = detalle_documento.match(polizaRegex)
      const endoso = detalle_documento.match(endosoRegex)


      let fechaDesde = new Date(PolizaSeguroFechaEndoso)
      const anio = fechaDesde.getFullYear()
      const mes = fechaDesde.getMonth() + 1


      if (!dnisLimpios || !polizaEndoso) {
        throw new ClientException(`Error al procesar el Documento.`)
      }

      const periodo_id = await Utils.getPeriodoId(queryRunner, new Date(), anio, mes, usuario, ip);


      if (PolizaSeguroNroPoliza && PolizaSeguroNroEndoso && CompaniaSeguroId && TipoSeguroCodigo) {
        // is edit
        console.log("is edit")

        resultFile = await this.fileSeguroUpload(files, queryRunner, usuario, ip, polizaEndoso[0], endoso[1]);



        await queryRunner.query(`
          UPDATE PolizaSeguro SET
            TipoSeguroCodigo = @0,
            DocumentoId = @1,
            PolizaSeguroFechaEndoso = @4,
            PolizaSeguroAudFechaMod = @6,
            PolizaSeguroAudUsuarioMod = @7,
            PolizaSeguroAudIpMod = @8,
            PolizaSeguroAnio = @9,
            PolizaSeguroMes = @10
          WHERE PolizaSeguroNroPoliza = @2 AND PolizaSeguroNroEndoso = @3 AND CompaniaSeguroId = @5 AND TipoSeguroCodigo = @11
        `, [
          TipoSeguroCodigo,
          resultFile.doc_id,
          polizaEndoso[0],
          endoso[1],
          fechaDesde,
          CompaniaSeguroId,
          new Date(),
          usuario,
          ip,
          anio,
          mes,
          TipoSeguroCodigo
        ]);



      } else {
        // is new

        console.log("is new")
        resultFile = await this.fileSeguroUpload(files, queryRunner, usuario, ip, polizaEndoso[0], endoso[1])

        const polizaExistente = await queryRunner.query(`SELECT COUNT(*) as count FROM PolizaSeguro WHERE PolizaSeguroNroPoliza = @0 AND PolizaSeguroNroEndoso = @1 AND CompaniaSeguroId = @2 AND TipoSeguroCodigo = @3`, [polizaEndoso[0], endoso[1], CompaniaSeguroId, TipoSeguroCodigo])
        if (polizaExistente[0].count > 0) {
          throw new ClientException(`Ya existe una póliza de tipo ${TipoSeguroCodigo} - ${CompaniaSeguroId} - ${polizaEndoso[0]} - ${endoso[1]}`)
        }
        //throw new ClientException(`test`)

        await queryRunner.query(`
            INSERT INTO PolizaSeguro (
              PolizaSeguroNroPoliza,
              PolizaSeguroNroEndoso,
              PolizaSeguroFechaEndoso,
              CompaniaSeguroId,
              PolizaSeguroAudFechaIng,
              PolizaSeguroAudUsuarioIng,
              PolizaSeguroAudIpIng,
              PolizaSeguroAudFechaMod,
              PolizaSeguroAudUsuarioMod,
              PolizaSeguroAudIpMod,
              TipoSeguroCodigo,
              DocumentoId,
              PolizaSeguroAnio,
              PolizaSeguroMes,
              PolizaSeguroVersion
            ) VALUES (
              @0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14
            )
          `, [
          polizaEndoso[0],                // PolizaSeguroNroPoliza
          endoso[1],                      // PolizaSeguroNroEndoso
          fechaDesde,                     // PolizaSeguroFechaEndoso
          CompaniaSeguroId,               // CompaniaSeguroId
          new Date(),                     // PolizaSeguroAudFechaIng
          usuario,                        // PolizaSeguroAudUsuarioIng
          ip,                             // PolizaSeguroAudIpIng
          new Date(),                     // PolizaSeguroAudFechaMod
          usuario,                        // PolizaSeguroAudUsuarioMod
          ip,                             // PolizaSeguroAudIpMod
          TipoSeguroCodigo,               // TipoSeguroCodigo
          resultFile.doc_id,              // DocumentoId
          anio,                           // PolizaSeguroAnio
          mes,                            // PolizaSeguroMes
          null                            // PolizaSeguroVersion
        ]);

      }

      // obtengo el primer dia del mes anterior a la fecha de la poliza
      const fechaPersonalSeguro = new Date(anio, mes - 2, 1);

      const validationDniResults = await this.validateAnInsertDni(dnisLimpios, queryRunner, TipoSeguroCodigo, usuario, ip, fechaPersonalSeguro, polizaEndoso[0], endoso[1], CompaniaSeguroId)
      //console.log("validationDniResults", validationDniResults)
      //throw new ClientException(`test.`)
      const version = await queryRunner.query(`
        SELECT PolizaSeguroVersion FROM PolizaSeguro 
        WHERE PolizaSeguroNroPoliza = @0 AND PolizaSeguroNroEndoso = @1 AND CompaniaSeguroId = @2 AND TipoSeguroCodigo = @3`,
        [polizaEndoso[0], endoso[1], CompaniaSeguroId, TipoSeguroCodigo])
      const PolizaAeguroVersion = version[0]?.PolizaSeguroVersion ? version[0]?.PolizaSeguroVersion + 1 : 1

      if (validationDniResults)
        await queryRunner.query(`
            UPDATE PolizaSeguro 
            SET PolizaSeguroResultado = @0, PolizaSeguroVersion = @1 
            WHERE PolizaSeguroNroPoliza = @2 AND PolizaSeguroNroEndoso = @3 AND CompaniaSeguroId = @4 AND TipoSeguroCodigo = @5`,
          [JSON.stringify(validationDniResults), PolizaAeguroVersion, polizaEndoso[0], endoso[1], CompaniaSeguroId, TipoSeguroCodigo])


      const result = {

        ArchivosAnteriores: resultFile.ArchivosAnteriores,
        notFound: validationDniResults,
        DocumentoId: resultFile.doc_id,
        PolizaSeguroNroPoliza: polizaEndoso[0],
        PolizaSeguroNroEndoso: endoso[1],
        PolizaSeguroFechaEndoso: fechaDesde
      }


      ///throw new ClientException(`test.`)
      await queryRunner.commitTransaction();
      this.jsonRes({ list: result }, res, (PolizaSeguroNroPoliza && PolizaSeguroNroEndoso && CompaniaSeguroId && TipoSeguroCodigo) ? `se Actualizó con exito el registro` : `se Agregó con exito el registro`);
    } catch (error) {
      await queryRunner.rollbackTransaction()
      return next(error)
    } finally {
      await queryRunner.release()
    }


  }

  async validateAnInsertDni(dni: any, queryRunner: QueryRunner, tipoSeguroCodigo: string, usuario: string, ip: string, fechaDesde: Date, polizaNroPoliza: string, polizaNroEndoso: string, companiaSeguroId: number) {

    await queryRunner.query(`DELETE FROM PersonalPolizaSeguro WHERE PolizaSeguroNroPoliza = @0 AND PolizaSeguroNroEndoso = @1 AND CompaniaSeguroId = @2 AND TipoSeguroCodigo = @3`, [polizaNroPoliza, polizaNroEndoso, companiaSeguroId, tipoSeguroCodigo])

    const notFoundInPersonalTable: number[] = [];
    const notFoundInPersonalSeguro: number[] = [];
    const shouldNotBeInSeguro: number[] = [];

    //console.log("dni", dni)
    //throw new ClientException(`test.`)
    const dniNumeros = dni.map(d => parseInt(d.replace(/\./g, '')));

    const personalRows = await queryRunner.query(`
      SELECT doc.PersonalDocumentoNro, per.PersonalId
      FROM dbo.Personal per
      JOIN PersonalDocumento doc ON doc.PersonalId = per.PersonalId
      WHERE doc.PersonalDocumentoNro IN (${dniNumeros.map((_, i) => `@${i}`).join(',')})
        AND doc.PersonalDocumentoId = (
            SELECT MAX(docmax.PersonalDocumentoId) 
            FROM PersonalDocumento docmax 
            WHERE docmax.PersonalId = per.PersonalId
        )`, dniNumeros);


    const documentoToPersonalId = new Map<number, number>();
    personalRows.forEach(row => {
      documentoToPersonalId.set(row.PersonalDocumentoNro, row.PersonalId);
    });


    const personalSeguroRows = await queryRunner.query(`
      SELECT  ps.PersonalId, doc.PersonalDocumentoNro
      FROM PersonalSeguro ps
      JOIN PersonalDocumento doc ON doc.PersonalId = ps.PersonalId
      WHERE ps.TipoSeguroCodigo = @0
        AND @1 >= ps.PersonalSeguroDesde
        AND @1 <= ISNULL(ps.PersonalSeguroHasta, '9999-12-31')
        AND doc.PersonalDocumentoId = (
            SELECT MAX(docmax.PersonalDocumentoId) 
            FROM PersonalDocumento docmax 
            WHERE docmax.PersonalId = ps.PersonalId
        )
  `, [tipoSeguroCodigo, fechaDesde]);

    const aseguradosSet = new Set<number>();
    const documentoAseguradosSet = new Set<number>();

    personalSeguroRows.forEach(row => {
      aseguradosSet.add(row.PersonalId);
      documentoAseguradosSet.add(row.PersonalDocumentoNro);
    });

    // Set para evitar duplicados al insertar
    const insertados = new Set<number>();

    for (const doc of dniNumeros) {
      const personalId = documentoToPersonalId.get(doc);

      // Si no está en la tabla Personal
      if (!personalId) {
        notFoundInPersonalTable.push(doc);
        continue;
      }

      // estan asegurados y no deberian estarlo
      if (!aseguradosSet.has(personalId)) {
        notFoundInPersonalSeguro.push(doc);
      }

      // Si ya se inserto se salta
      if (insertados.has(personalId)) {
        continue;
      }

      // EXISTE EL PERSONAL Y ESTÁ ASEGURADO → insertar
      await this.addPersonalPolizaSeguro(polizaNroPoliza, polizaNroEndoso, companiaSeguroId, tipoSeguroCodigo, personalId, queryRunner, usuario, ip);
      insertados.add(personalId);
    }

    //  Validar asegurados que no deberían estarlo
    for (const doc of documentoAseguradosSet) {
      if (doc) {
        if (dniNumeros.includes(doc)) {
          continue;
        }
        shouldNotBeInSeguro.push(doc);
      }
    }


    return {
      notFoundInPersonalTable,
      notFoundInPersonalSeguro,
      shouldNotBeInSeguro
    }

  }

  async addPersonalPolizaSeguro(polizaNroPoliza: string, polizaNroEndoso: string, companiaSeguroId: number, tipoSeguroCodigo: string, personalId: number, queryRunner: QueryRunner, usuario: string, ip: string) {


    await queryRunner.query(`INSERT INTO PersonalPolizaSeguro (
      PolizaSeguroNroPoliza,
      PolizaSeguroNroEndoso,
      CompaniaSeguroId,
      TipoSeguroCodigo,
      PersonalPolizaSeguroPersonalId,
      PersonalPolizaSeguroAudFechaIng,
      PersonalPolizaSeguroAudUsuarioIng,
      PersonalPolizaSeguroAudIpIng
    ) VALUES (@0, @1, @2, @3, @4, @5, @6, @7)`, [
      polizaNroPoliza,
      polizaNroEndoso,
      companiaSeguroId,
      tipoSeguroCodigo,
      personalId,
      new Date(),
      usuario,
      ip
    ])
  }

  async fileSeguroUpload(files: any, queryRunner: QueryRunner, usuario: string, ip: string, polizaEndoso: string, endoso: string) {


    let resultFile = null
    let denDocumento = `${polizaEndoso}-${endoso}`
    if (files?.length > 0) {
      // hacer for para cada archivo
      for (const file of files) {
        let fec_doc_ven = null
        let PersonalId = null
        let DocumentoClienteId = 934
        let cliente_id = file.cliente_id > 0 ? file.cliente_id : null
        let objetivo_id = file.objetivo_id > 0 ? file.objetivo_id : null
        //throw new ClientException(`Debe subir un solo archivo.`)
        resultFile = await FileUploadController.handleDOCUpload(
          PersonalId,
          objetivo_id,
          cliente_id,
          file.id,
          new Date(),
          fec_doc_ven,
          denDocumento,
          null, null,
          file,
          usuario,
          ip,
          queryRunner,
          DocumentoClienteId)

      }
      return resultFile

    }
  }

  search(req: any, res: Response, next: NextFunction) {

    const { fieldName, value } = req.body;
    let buscar = false;
    let query: string = `SELECT TipoSeguroCodigo, TipoSeguroNombre from TipoSeguro WHERE 1=1 AND `;
    switch (fieldName) {
      case "TipoSeguroNombre":
        const valueArray: Array<string> = value.split(/[\s,.]+/);
        valueArray.forEach((element, index) => {
          if (element.trim().length >= 1) {
            query += ` TipoSeguroNombre LIKE '%${element.trim()}%' AND `;
            buscar = true;
          }
        });
        break;
      case "TipoSeguroCodigo":
        if (value > 0) {
          query += ` TipoSeguroCodigo = '${value}' AND `;
          buscar = true;
        }
        break;
      default:
        break;
    }



    dataSource
      .query((query += " 1=1"))
      .then((records) => {
        this.jsonRes({ recordsArray: records }, res);
      })
      .catch((error) => {
        return next(error)
      });

  }


  async getCompaniaSeguroSearch(req: any, res: Response, next: NextFunction) {
    const result = await dataSource.query(`
        SELECT CompaniaSeguroId, CompaniaSeguroDescripcion FROM CompaniaSeguro  WHERE CompaniaSeguroInactivo IS NULL OR CompaniaSeguroInactivo = 0`)
    this.jsonRes(result, res);
  }

  async getCompaniaSeguroId(req: any, res: Response, next: NextFunction) {
    const result = await dataSource.query(`
        SELECT CompaniaSeguroId, CompaniaSeguroDescripcion FROM CompaniaSeguro WHERE CompaniaSeguroId = @0`, [req.params.id])
    this.jsonRes(result, res);
  }

  async getTipoSeguroSearch(req: any, res: Response, next: NextFunction) {
    const result = await dataSource.query(`
        SELECT TipoSeguroCodigo, TipoSeguroNombre FROM TipoSeguro `)
    this.jsonRes(result, res);
  }

  async getTipoSeguroId(req: any, res: Response, next: NextFunction) {
    const result = await dataSource.query(`
        SELECT TipoSeguroCodigo, TipoSeguroNombre FROM TipoSeguro WHERE TipoSeguroCodigo = @0`, [req.params.id])
    this.jsonRes(result, res);
  }

  async validateFormPolizaSeguro(params: any, queryRunner: QueryRunner) {

    if (!params.TipoSeguroCodigo) {
      throw new ClientException(`Debe completar el campo Tipo de Seguro.`)
    }

    if (!params.CompaniaSeguroId) {
      throw new ClientException(`Debe completar el campo Compañía.`)
    }

    if (params.files.length == 0) {
      throw new ClientException(`Debe subir al menos un archivo.`)
    }

    if (params.files.length > 1) {
      throw new ClientException(`Debe subir un solo archivo.`)
    }
    if (!params.PolizaSeguroFechaEndoso) {
      throw new ClientException(`Debe completar el campo Fecha de Endoso.`)
    }

    // No se podrá reprocesar datos de pólizas las cuales sean de un periodo el cual la liquidación fue cerrada.
    // en caso de que el periodo que desea cargar el endoso tenga cerrada la liquidación pero no tenga póliza asociada, se podrá cargada el endoso de la poliza (esto para cada tipo)

  }

}

