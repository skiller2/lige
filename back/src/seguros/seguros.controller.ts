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
    name: "Nombre",
    type: "string",
    id: "PersonalId",
    field: "PersonalId",
    fieldName: "per.PersonalId",
    searchComponent: "inpurForPersonalSearch",
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
    searchComponent: "inpurForTipoSeguroSearch",
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
    searchComponent: "inpurForSituacionRevistaSearch",
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
    searchComponent: "inpurForFechaSearch",
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
    searchComponent: "inpurForFechaSearch",
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
    searchComponent: "inpurForFechaSearch",
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
    id: "PolizaSeguroCodigo",
    name: "Poliza Seguro Cod",
    field: "PolizaSeguroCodigo",
    fieldName: "seg.PolizaSeguroCodigo",
    type: "number",
    sortable: false,
    hidden: true,
    searchHidden: true
  },
  {
    id: "TipoSeguroNombre",
    name: "Tipo de Seguro",
    field: "TipoSeguroNombre",
    fieldName: "seg.TipoSeguroNombre",
    searchComponent: "inputForTipoSeguroSearch",
    type: "string", 
    sortable: true,
    hidden: false,
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
    id: "CompaniaSeguroDescripcion",
    name: "Compañía",
    field: "CompaniaSeguroDescripcion",
    fieldName: "seg.CompaniaSeguroDescripcion",
    searchComponent: "inputForCompaniaSeguroSearch",
    searchType: "string",
    sortable: true,
    searchHidden: false,
    hidden: true,
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
    id: "PolizaSeguroCod",
    name: "Código de Póliza",
    field: "PolizaSeguroCod",
    fieldName: "perpoliz.PolizaSeguroCod",
    type: "string",
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
    searchComponent: "inpurForPersonalSearch",
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
    id: "PolizaSeguroNroEndoso",
    name: "Número de Endoso",
    field: "polizaSeguroNroEndoso",
    fieldName: "poliz.polizaSeguroNroEndoso",
    type: "string",
    sortable: false,
    hidden: false,
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
    name: "Tipo seguro ",
    type: "string",
    id: "TipoSeguroCodigo",
    field: "TipoSeguroCodigo",
    fieldName: "tipseg.TipoSeguroCodigo",
    searchComponent: "inpurForTipoSeguroSearch",
    sortable: false,
    hidden: true,
    searchHidden: false
  },
]



export class SegurosController extends BaseController {


  private async getPersonalBySitRev(queryRunner: any, anio: number, mes: number) {
    return queryRunner.query(`SELECT psr.*, persr.PersonalSituacionRevistaDesde, persr.PersonalSituacionRevistaSituacionId SituacionRevistaId, DATEDIFF(month,persr.PersonalSituacionRevistaDesde,EOMONTH(DATEFROMPARTS(@1,@2,1))) month_diff FROM (


SELECT persr.PersonalId, STRING_AGG(CONCAT(TRIM(sitrev.SituacionRevistaDescripcion),' ',FORMAT(persr.PersonalSituacionRevistaDesde,'dd-MM-yyyy')),', ') detalle,
--persr.PersonalSituacionRevistaId, 
--						persr.PersonalSituacionRevistaDesde,
	--					persr.PersonalSituacionRevistaHasta,
		--				sitrev.SituacionRevistaDescripcion,
		DATEADD(MONTH,-1,DATEFROMPARTS(@1,@2,1)) desde,
		EOMONTH(DATEFROMPARTS(@1,@2,1)) hasta
	FROM PersonalSituacionRevista persr
	LEFT JOIN SituacionRevista sitrev  ON sitrev.SituacionRevistaId = persr.PersonalSituacionRevistaSituacionId 
	 WHERE  persr.PersonalSituacionRevistaDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND
			ISNULL(persr.PersonalSituacionRevistaHasta, '9999-12-31') >= DATEADD(MONTH,-1,DATEFROMPARTS(@1,@2,1))
							
						AND sitrev.SituacionRevistaId IN (2,10,11,20,12,7)
	-- 1=1					
GROUP BY persr.PersonalId ) AS psr
LEFT JOIN PersonalSituacionRevista persr ON persr.PersonalId = psr.PersonalId
WHERE  persr.PersonalSituacionRevistaDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND
			ISNULL(persr.PersonalSituacionRevistaHasta, '9999-12-31') >= EOMONTH(DATEFROMPARTS(@1,@2,1))
`, [, anio, mes])

  }


  private async getPersonalEnSeguro(queryRunner: any, TipoSeguroNombre: string, anio: number, mes: number) {
    return queryRunner.query(`SELECT seg.PersonalId, seg.PersonalSeguroDesde, seg.PersonalSeguroHasta, seg.TipoSeguroCodigo, sitrev.PersonalSituacionRevistaSituacionId SituacionRevistaId, sitrev.SituacionRevistaDescripcion, sitrev.PersonalSituacionRevistaDesde
      FROM PersonalSeguro seg
        LEFT JOIN (
          SELECT p.PersonalId, p.PersonalSituacionRevistaSituacionId, s.SituacionRevistaDescripcion,p.PersonalSituacionRevistaDesde
          FROM PersonalSituacionRevista p
          JOIN SituacionRevista s
          ON p.PersonalSituacionRevistaSituacionId = s.SituacionRevistaId AND p.PersonalSituacionRevistaDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND ISNULL(p.PersonalSituacionRevistaHasta,'9999-12-31') >= EOMONTH(DATEFROMPARTS(@1,@2,1))
			 ) sitrev ON sitrev.PersonalId = seg.PersonalId

      WHERE seg.TipoSeguroCodigo = @0 AND seg.PersonalSeguroDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND ISNULL(seg.PersonalSeguroHasta,'9999-12-31') >= EOMONTH(DATEFROMPARTS(@1,@2,1))
    `, [TipoSeguroNombre, anio, mes])
  }

  private async getPersonalResponableByClientId(queryRunner: any, ClientId: number, anio: number, mes: number) {
    return queryRunner.query(`SELECT DISTINCT gaj.GrupoActividadJerarquicoPersonalId PersonalId, 'Responsable' detalle  
      FROM Objetivo obj 
        JOIN GrupoActividadObjetivo gao ON gao.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND gao.GrupoActividadObjetivoDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND ISNULL(gao.GrupoActividadObjetivoHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1)
        JOIN ClienteElementoDependienteContrato con ON con.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND con.ClienteId = obj.ClienteId AND con.ClienteElementoDependienteContratoFechaDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND ISNULL(con.ClienteElementoDependienteContratoFechaHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1)
        JOIN GrupoActividadJerarquico gaj ON gaj.GrupoActividadId = gao.GrupoActividadId AND  gaj.GrupoActividadJerarquicoDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND ISNULL(gaj.GrupoActividadJerarquicoHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1) AND gaj.GrupoActividadJerarquicoComo='J'
      WHERE obj.ClienteId = @0 
    `,[ClientId, anio, mes])
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



  async updateSeguros(req:any,res:any, anio: number, mes: number,next:NextFunction) {
    const stm_now = new Date()
    const usuario = res?.locals.userName || 'server'
    const ip = this.getRemoteAddress(req)
  
    const queryRunner = dataSource.createQueryRunner();
    try {
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
      const personalCoto = [...await this.getPersonalHorasByClientId(queryRunner, 1, anio, mes),...await this.getPersonalResponableByClientId(queryRunner, 1, anio, mes)]

      const personalEdesur = [...await this.getPersonalHorasByClientId(queryRunner, 798, anio, mes),...await this.getPersonalResponableByClientId(queryRunner, 798, anio, mes)]

      const personalEnergiaArgentina = [...await this.getPersonalHorasByClientId(queryRunner, 866, anio, mes),...await this.getPersonalResponableByClientId(queryRunner, 866, anio, mes), ...await this.getPersonalHorasByClientId(queryRunner, 867, anio, mes),...await this.getPersonalResponableByClientId(queryRunner, 867, anio, mes)]

      const personalSitRev = await this.getPersonalBySitRev(queryRunner, anio, mes)

      
      const personalEnSeguroCoto = await this.getPersonalEnSeguro(queryRunner, 'APC', anio, mes)
      const personalEnSeguroEdesur = await this.getPersonalEnSeguro(queryRunner, 'APE', anio, mes)
      const personalEnSeguroVidCol = await this.getPersonalEnSeguro(queryRunner, 'VC', anio, mes)
      const personalEnSeguroEnergiaArgentina = await this.getPersonalEnSeguro(queryRunner, 'APEA', anio, mes)

      for (const row of personalCoto) {
        const rowEnSeguro = personalEnSeguroCoto.find(r => r.PersonalId == row.PersonalId)
        if (rowEnSeguro) {
          await this.queryUpdSeguros(queryRunner, row.PersonalId, rowEnSeguro.PersonalSeguroDesde, rowEnSeguro.TipoSeguroNombre, row.detalle,stm_now, usuario, ip)
        } else {
          await this.queryAddSeguros(queryRunner, row.PersonalId, PersonalSeguroDesde, 'APC', row.detalle,stm_now, usuario, ip)
        }
        await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'AP', 'En COTO ' + row.detalle,stm_now, usuario, ip)
      }

      for (const row of personalEdesur) {
        const rowEnSeguro = personalEnSeguroEdesur.find(r => r.PersonalId == row.PersonalId)
        if (rowEnSeguro) {
          await this.queryUpdSeguros(queryRunner, row.PersonalId, rowEnSeguro.PersonalSeguroDesde, rowEnSeguro.TipoSeguroNombre, row.detalle,stm_now, usuario, ip)
        } else {
          await this.queryAddSeguros(queryRunner, row.PersonalId, PersonalSeguroDesde, 'APE', row.detalle,stm_now, usuario, ip)
        }
        await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'APG', 'En Edesur ' + row.detalle,stm_now, usuario, ip)
      }

      for (const row of personalEnergiaArgentina) {
        const rowEnSeguro = personalEnSeguroEnergiaArgentina.find(r => r.PersonalId == row.PersonalId)
        if (rowEnSeguro) {
          await this.queryUpdSeguros(queryRunner, row.PersonalId, rowEnSeguro.PersonalSeguroDesde, rowEnSeguro.TipoSeguroNombre, row.detalle,stm_now, usuario, ip)
        } else {
          await this.queryAddSeguros(queryRunner, row.PersonalId, PersonalSeguroDesde, 'APEA', row.detalle,stm_now, usuario, ip)
        }
        await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'APG', 'En EnergiaArgentina ' + row.detalle,stm_now, usuario, ip)
      }




      //TODO: Falta sacer los de coto y edesur

      const personalEnSeguroGeneral = await this.getPersonalEnSeguro(queryRunner, 'APG', anio, mes)


      for (const row of personalEnSeguroCoto) {
        if (!personalCoto.find(r => r.PersonalId == row.PersonalId) && row.SituacionRevistaId != 10) {
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'APC', 'No está mas en COTO',stm_now, usuario, ip)
        }
      }

      for (const row of personalEnSeguroEdesur) {
        if (!personalEdesur.find(r => r.PersonalId == row.PersonalId) && row.SituacionRevistaId != 10) {
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'APE', 'No está mas en Edesur',stm_now, usuario, ip)
        }
      }

      for (const row of personalEnSeguroEnergiaArgentina) {
        if (!personalEnergiaArgentina.find(r => r.PersonalId == row.PersonalId) && row.SituacionRevistaId != 10) {
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'APEA', 'No está mas en Energia Argentina',stm_now, usuario, ip)
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
          await this.queryUpdSeguros(queryRunner, row.PersonalId, rowEnSeguro.PersonalSeguroDesde, 'APG', row.detalle,stm_now, usuario, ip)
        } else {
          if ([7].includes(row.SituacionRevistaId) && row.month_diff > 3)
            continue
          if ([3,13,19,24, 8, 29, 36, 30, 31].includes(row.SituacionRevistaId) )
            continue
          
          await this.queryAddSeguros(queryRunner, row.PersonalId, PersonalSeguroDesde, 'APG', row.detalle,stm_now, usuario, ip)
        }
      }

      for (const row of personalEnSeguroGeneral) {
        if (personalEnSeguroCoto2.find(r => r.PersonalId == row.PersonalId))
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'APG', 'Paso a Coto',stm_now, usuario, ip)

        if (personalEnSeguroEdesur2.find(r => r.PersonalId == row.PersonalId))
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'APG', 'Paso a Edesur',stm_now, usuario, ip)

        if (personalEnSeguroEnergiaArgentna2.find(r => r.PersonalId == row.PersonalId))
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'APG', 'Paso a Energia Argentina',stm_now, usuario, ip)

        const rowEnSitRev = personalSitRev.find(r => r.PersonalId == row.PersonalId)

        if (!personalSitRev.find(r => r.PersonalId == row.PersonalId)) {
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'APG', 'No tiene situación revista (2,10,11,20,12,7)',stm_now, usuario, ip)
        } else {
          if ([7].includes(rowEnSitRev.SituacionRevistaId) && rowEnSitRev.month_diff > 3)
            await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'APG', rowEnSitRev.detalle + ' mayor a 3 meses', stm_now, usuario, ip)
          if ([3,13,19,24, 8, 29, 36, 30, 31].includes(row.SituacionRevistaId) )
            await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'APG', rowEnSitRev.detalle + ' baja',stm_now, usuario, ip)
        }
      }

      //Vida Colectivo
      for (const row of personalSitRev) {
        if ([7].includes(row.SituacionRevistaId) && row.month_diff > 3)
          continue
        if ([3,13,19,24,8, 29, 36, 30, 31].includes(row.SituacionRevistaId) )
          continue

        const rowEnSeguro = personalEnSeguroVidCol.find(r => r.PersonalId == row.PersonalId)
        if (rowEnSeguro) {
          await this.queryUpdSeguros(queryRunner, row.PersonalId, rowEnSeguro.PersonalSeguroDesde, 'VC', row.detalle,stm_now, usuario, ip)
        } else {
          await this.queryAddSeguros(queryRunner, row.PersonalId, PersonalSeguroDesde, 'VC', row.detalle,stm_now, usuario, ip)
        }
      }

      for (const row of personalEnSeguroVidCol) {
        const rowEnSitRev = personalSitRev.find(r => r.PersonalId == row.PersonalId)
        if (!personalSitRev.find(r => r.PersonalId == row.PersonalId)) {
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'VC', 'No tiene situación revista (2,10,11,20,12,8,29,36,30,31,7)',stm_now, usuario, ip)
        } else {
          if ([7].includes(rowEnSitRev.SituacionRevistaId) && rowEnSitRev.month_diff > 3)
            await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'VC', rowEnSitRev.detalle + ' mayor a 3 meses', stm_now, usuario, ip)
          if ([3,13,19,24,8, 29, 36, 30, 31].includes(row.SituacionRevistaId) )
            await this.queryUpdSegurosFin(queryRunner, row.PersonalId, PersonalSeguroHasta, 'VC', rowEnSitRev.detalle + ' baja', stm_now, usuario, ip)
          
        }
      }

      await queryRunner.commitTransaction()
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    }
    return (res)? this.jsonRes(true, res, "Procesado correctamente"): true
  }

  queryUpdSeguros(queryRunner: QueryRunner, PersonalId: any, PersonalSeguroDesde: Date, TipoSeguroNombre: string, PersonalSeguroMotivoAdhesion: string,stm_now:Date, usuario:string, ip:string) {
    return queryRunner.query(`UPDATE PersonalSeguro SET PersonalSeguroMotivoAdhesion=@3, PersonalSeguroHasta=@4, PersonalSeguroAudFechaMod=@5, PersonalSeguroAudUsuarioMod=@6, PersonalSeguroAudIpMod=@7 
      WHERE PersonalId=@0 AND PersonalSeguroDesde=@1 AND TipoSeguroCodigo = @2
    `, [PersonalId, PersonalSeguroDesde, TipoSeguroNombre, PersonalSeguroMotivoAdhesion, null, stm_now, usuario, ip])
  }

  queryUpdSegurosFin(queryRunner: QueryRunner, PersonalId: number, PersonalSeguroHasta: Date, TipoSeguroNombre: string, PersonalSeguroMotivoBaja: string, stm_now:Date, usuario:string, ip:string) {
    return queryRunner.query(`UPDATE PersonalSeguro SET PersonalSeguroMotivoBaja=@2, PersonalSeguroHasta=@3, PersonalSeguroAudFechaMod=@4, PersonalSeguroAudUsuarioMod=@5, PersonalSeguroAudIpMod=@6 
      WHERE PersonalId=@0 AND TipoSeguroCodigo = @1 AND PersonalSeguroDesde <= @3 AND PersonalSeguroHasta IS NULL
    `, [PersonalId, TipoSeguroNombre, PersonalSeguroMotivoBaja, PersonalSeguroHasta, stm_now, usuario, ip])
  }

  queryAddSeguros(queryRunner: QueryRunner, PersonalId: number, PersonalSeguroDesde: Date, TipoSeguroNombre: string, PersonalSeguroMotivoAdhesion: string,stm_now:Date, usuario:string, ip:string) {
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
    const anio:number = req.body.anio
    const mes:number = req.body.mes
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
    const filterSql = filtrosToSql(req.body.options.filtros, listaColumnas);
    const orderBy = orderToSQL(req.body.options.sort)
    try {
      let result = await dataSource.query(`
      SELECT 
        ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS id,
        ts.TipoSeguroNombre,
        ps.TipoSeguroCodigo,
        ps.PolizaSeguroCodigo,
        ps.PolizaSeguroNroPoliza,
        ps.PolizaSeguroNroEndoso,
        ps.PolizaSeguroFechaEndoso,
        ps.PolizaSeguroAnio,
        ps.PolizaSeguroMes
      FROM PolizaSeguro ps
      LEFT JOIN TipoSeguro ts ON ts.TipoSeguroCodigo = ps.TipoSeguroCodigo
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
    const filterSql = filtrosToSql(req.body.options.filtros, listaColumnas);
    const orderBy = orderToSQL(req.body.options.sort)
    try {
      let result = await dataSource.query(`
      SELECT  ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS id, perpoliz.PolizaSeguroCodigo,per.PersonalId,per.PersonalApellidoNombre,
      cuit.PersonalCUITCUILCUIT, poliz.polizaSeguroNroEndoso, tipseg.TipoSeguroCodigo,poliz.PolizaSeguroNroPoliza, tipseg.TipoSeguroNombre
      FROM PersonalPolizaSeguro AS perpoliz
      JOIN Personal per ON per.PersonalId = perpoliz.PersonalPolizaSeguroPersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId     
      AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)
      LEFT JOIN PolizaSeguro poliz ON      poliz.PolizaSeguroCodigo =  perpoliz.PolizaSeguroCodigo
      LEFT JOIN TipoSeguro tipseg ON tipseg.TipoSeguroCodigo = poliz.TipoSeguroCodigo
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
        ps.PolizaSeguroCodigo,
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
      WHERE ps.PolizaSeguroCodigo = @0`, [req.params.id])
    
      this.jsonRes(result, res);
    } catch (error) {
      return next(error)
    }

  }

  async setPolizaSeguro(req: any, res: Response, next: NextFunction) {

    let {
      PolizaSeguroCodigo,
      TipoSeguroCodigo,
      CompaniaSeguroId,
      PolizaSeguroNroPoliza,
      PolizaSeguroNroEndoso,
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
    let resultPolizaSeguroCodigo
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



      const dniRegex = new RegExp(regex.DNILista, "mg")
      const polizaRegex = new RegExp(regex.Poliza, "m")
      const endosoRegex = new RegExp(regex.Endoso, "m")
      const fechaDesdeRegex = new RegExp(regex.FechaDesde, "m")

      //const dniRegex = new RegExp(/DNI ([\d.]{9,10})$/mg);
      //const polizaRegex = new RegExp(/(\d{9}) (?=\d{6})/m);
      //const endosoRegex = new RegExp(/\d{9} (\d{6})/m);
      //const fechaDesdeRegex = new RegExp(/^(\d{2}\.\d{2}\.\d{4})/m);


      const dni = detalle_documento.match(dniRegex).map(match => match.replace('DNI ', ''))
      const polizaEndoso = detalle_documento.match(polizaRegex)
      const endoso = detalle_documento.match(endosoRegex)

      //const fechaDesdeEndoso = detalle_documento.match(fechaDesdeRegex)
      //const fechaTexto = fechaDesdeEndoso[0];
      //const [dia, mes, anio] = fechaTexto.split(".")
      //let fechaDesde = new Date(Date.UTC(parseInt(anio), parseInt(mes) - 1, parseInt(dia)))
      let fechaDesde = new Date(PolizaSeguroFechaEndoso)
      const anio = fechaDesde.getFullYear()
      const mes = fechaDesde.getMonth() + 1
  
      if (!dni || !polizaEndoso) {
        throw new ClientException(`Error al procesar el Documento.`)
      }


      //throw new ClientException(`test`)
      //optiene periodo del documento
      const periodo_id = await Utils.getPeriodoId(queryRunner, new Date(), anio, mes, usuario, ip);
      console.log("periodo_id", periodo_id)

      //busca si el periodo esta cerrado
      const ind_recibos_generados = await queryRunner.query(`SELECT ind_recibos_generados,EOMONTH(DATEFROMPARTS(anio, mes, 1)) AS FechaCierre FROM lige.dbo.liqmaperiodo WHERE periodo_id = @0`, [periodo_id])
      const FechaCierre = new Date(ind_recibos_generados[0].FechaCierre)

      //No se podrá reprocesar datos de pólizas las cuales sean de un periodo el cual la liquidación fue cerrada.
      if (ind_recibos_generados[0].ind_recibos_generados == 1) {

        const existPolizaInPeriodo = await queryRunner.query(`SELECT DocumentoId FROM PolizaSeguro WHERE PolizaSeguroAnio = @0 and PolizaSeguroMes = @1 and TipoSeguroCodigo = @2`, [anio, mes, TipoSeguroCodigo])
        const polizaDocumentoId = existPolizaInPeriodo[0]?.DocumentoId

        //si existe un documento en el periodo cerrado, no se puede reprocesar
        if (polizaDocumentoId) {
          throw new ClientException(`No se puede reprocesar datos de pólizas las cuales sean de un periodo el cual la liquidación fue cerrada. ${this.dateOutputFormat(FechaCierre)}`)
        }
        
      }

      // Validar que no exista una póliza del mismo tipo en el periodo
      const polizaExistente = await queryRunner.query(`SELECT COUNT(*) as count FROM PolizaSeguro WHERE TipoSeguroCodigo = @0 AND PolizaSeguroAnio = @1 AND PolizaSeguroMes = @2`, [TipoSeguroCodigo, anio, mes])

      if (polizaExistente[0].count > 0) {
        throw new ClientException(`Ya existe una póliza de tipo ${TipoSeguroCodigo} para el periodo seleccionado. Solo se permite una póliza por tipo por periodo.`)
      }


      
      if (PolizaSeguroCodigo) {
        // is edit
      console.log("is edit")

      resultFile = await this.fileSeguroUpload(files, queryRunner, usuario, ip, polizaEndoso[0], endoso[1]);

        await queryRunner.query(`
          UPDATE PolizaSeguro SET
            TipoSeguroCodigo = @0,
            DocumentoId = @1,
            PolizaSeguroNroPoliza = @2,
            PolizaSeguroNroEndoso = @3,
            PolizaSeguroFechaEndoso = @4,
            CompaniaSeguroId = @5,
            PolizaSeguroAudFechaMod = @6,
            PolizaSeguroAudUsuarioMod = @7,
            PolizaSeguroAudIpMod = @8,
            PolizaSeguroAnio = @9,
            PolizaSeguroMes = @10
          WHERE PolizaSeguroCodigo = @11
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
          PolizaSeguroCodigo
        ]);
        


      } else {
        // is new

      console.log("is new")
      // Solo se podrá cargar un tipo de póliza en cada periodo (1 VC, 1 AP COTO, 1 AP EDESUR y 1 AP ENERGIA ARGENTINA)
      const result = await queryRunner.query(`
        SELECT COUNT(*) as count 
        FROM PolizaSeguro ps
        WHERE ps.TipoSeguroCodigo = @0 
        AND ps.PolizaSeguroFechaEndoso = @1`, 
        [TipoSeguroCodigo, PolizaSeguroFechaEndoso])

      if(result[0].count > 0) {
        throw new ClientException(`Ya existe una póliza de este tipo para el periodo seleccionado.`)
      }

        resultFile = await this.fileSeguroUpload(files, queryRunner, usuario, ip, polizaEndoso[0],endoso[1])
    

 //'CompaniaSeguroId'-'TipoSeguroCod'-'PolizaSeguroNroPoliza'-'PolizaSeguroNroEndoso'

         resultPolizaSeguroCodigo = `${CompaniaSeguroId}-${TipoSeguroCodigo}-${polizaEndoso[0]}-${endoso[1]}`.replace(/ /g, '')

        const existPoliza = await queryRunner.query(`SELECT PolizaSeguroCodigo FROM PolizaSeguro WHERE PolizaSeguroCodigo = @0`, [resultPolizaSeguroCodigo])

        if(existPoliza[0]?.PolizaSeguroCodigo) {
          throw new ClientException(`Ya existe una póliza con este documento.`)
        }


        await queryRunner.query(`
          INSERT INTO PolizaSeguro (
            PolizaSeguroCodigo,
            TipoSeguroCodigo,
            DocumentoId,
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
            PolizaSeguroAnio,
            PolizaSeguroMes
          ) VALUES (
            @0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14
          )
        `, [
          resultPolizaSeguroCodigo,
          TipoSeguroCodigo,
          resultFile.doc_id,
          polizaEndoso[0],
          endoso[1],
          fechaDesde,
          CompaniaSeguroId,
          new Date(),
          usuario,
          ip,
          new Date(),
          usuario,
          ip,
          anio,
          mes
        ]);

      }

      const validationDniResults = await this.validateAnInsertDni(dni, queryRunner, TipoSeguroCodigo,resultPolizaSeguroCodigo,usuario,ip,fechaDesde)
      const version = await queryRunner.query(`SELECT PolizaSeguroVersion FROM PolizaSeguro WHERE PolizaSeguroCodigo = @0`, [resultPolizaSeguroCodigo])
      const PolizaAeguroVersion = version[0]?.PolizaSeguroVersion ? version[0]?.PolizaSeguroVersion + 1 : 1

      resultPolizaSeguroCodigo  = PolizaSeguroCodigo ? PolizaSeguroCodigo : resultPolizaSeguroCodigo

      if(validationDniResults)
          await queryRunner.query(`UPDATE PolizaSeguro SET PolizaSeguroResultado = @0, PolizaSeguroVersion = @1 WHERE PolizaSeguroCodigo = @2`, [JSON.stringify(validationDniResults), PolizaAeguroVersion, resultPolizaSeguroCodigo])

   
  const result = {
        PolizaSeguroCodigo: resultPolizaSeguroCodigo,
        ArchivosAnteriores: resultFile.ArchivosAnteriores,
        notFound: validationDniResults,
        DocumentoId: resultFile.doc_id,
        PolizaSeguroNroPoliza: polizaEndoso[0],
        PolizaSeguroNroEndoso: endoso[1],
        PolizaSeguroFechaEndoso: fechaDesde
  }

  console.log("result", result)
      ///throw new ClientException(`test.`)
      await queryRunner.commitTransaction();
      this.jsonRes({ list: result }, res, (req.body.PolizaSeguroCod > 0) ? `se Actualizó con exito el registro` : `se Agregó con exito el registro`);
    } catch (error) {
      await queryRunner.rollbackTransaction()
      return next(error)
    } finally {
      await queryRunner.release()
    }


  }

  async validateAnInsertDni( dni:any, queryRunner:QueryRunner, tipoSeguroCodigo:string,resultPolizaSeguroCodigo:string, usuario:string, ip:string, fechaDesde:Date){

    await queryRunner.query(`DELETE FROM PersonalPolizaSeguro WHERE PolizaSeguroCodigo = @0`, [resultPolizaSeguroCodigo])

    const notFoundInPersonalTable: number[] = [];
    const notFoundInPersonalSeguro: number[] = [];
    const shouldNotBeInSeguro: number[] = [];

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
    
      // Si no está asegurado y debería estarlo
      if (!aseguradosSet.has(personalId)) {
        notFoundInPersonalSeguro.push(doc);
        continue;
      }
    
      // Si ya se inserto se salta
      if (insertados.has(personalId)) {
        continue; 
      }
    
      // EXISTE EL PERSONAL Y ESTÁ ASEGURADO → insertar
      await this.addPersonalPolizaSeguro(resultPolizaSeguroCodigo,personalId,queryRunner,usuario,ip);
      insertados.add(personalId);
    }
    
    //  Validar asegurados que no deberían estarlo
    for (const doc of documentoAseguradosSet) {
      if(doc) {
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

  async addPersonalPolizaSeguro(resultPolizaSeguroCodigo:string, personalId:number, queryRunner:QueryRunner, usuario:string, ip:string){


    await queryRunner.query(`INSERT into PersonalPolizaSeguro (
      PolizaSeguroCodigo,
      PersonalPolizaSeguroPersonalId,
      PersonalPolizaSeguroAudFechaIng,
      PersonalPolizaSeguroAudUsuarioIng,
      PersonalPolizaSeguroAudIpIng
    ) values (@0, @1, @2, @3, @4)`, [
      resultPolizaSeguroCodigo.replace(/ /g, ''),
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
        let PersonalId = 0
        
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
          queryRunner)
      
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
      
      if(!params.TipoSeguroCodigo){
        throw new ClientException(`Debe completar el campo Tipo de Seguro.`)
      }

      if(!params.CompaniaSeguroId){
        throw new ClientException(`Debe completar el campo Compañía.`)
      }

      if(params.files.length == 0){
        throw new ClientException(`Debe subir al menos un archivo.`)
      }

      if(params.files.length > 1){
        throw new ClientException(`Debe subir un solo archivo.`)
      }
      if(!params.PolizaSeguroFechaEndoso){
        throw new ClientException(`Debe completar el campo Fecha de Endoso.`)
      }

      // No se podrá reprocesar datos de pólizas las cuales sean de un periodo el cual la liquidación fue cerrada.
      // en caso de que el periodo que desea cargar el endoso tenga cerrada la liquidación pero no tenga póliza asociada, se podrá cargada el endoso de la poliza (esto para cada tipo)
      
    }

}

