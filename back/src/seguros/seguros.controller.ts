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
    id: "nom_tip_seguro",
    field: "nom_tip_seguro",
    fieldName: "tipseg.nom_tip_seguro",
    sortable: true,
    searchHidden: true
  },
  {
    name: "Tipo seguro ",
    type: "string",
    id: "cod_tip_seguro",
    field: "cod_tip_seguro",
    fieldName: "tipseg.cod_tip_seguro",
    searchComponent: "inpurForTipoSeguroSearch",
    sortable: false,
    hidden: true,
    searchHidden: false
  },
  {
    name: "Motivo adhesión",
    type: "string",
    id: "mot_adh_seguro",
    field: "mot_adh_seguro",
    fieldName: "seg.mot_adh_seguro",
    sortable: true,
    searchHidden: true
  },
  {
    name: "Motivo baja",
    type: "string",
    id: "mot_baj_seguro",
    field: "mot_baj_seguro",
    fieldName: "seg.mot_baj_seguro",
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
    id: "fec_desde",
    field: "fec_desde",
    fieldName: "seg.fec_desde",
    searchComponent: "inpurForFechaSearch",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    name: "Fecha de baja",
    type: "date",
    id: "fec_hasta",
    field: "fec_hasta",
    fieldName: "seg.fec_hasta",
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


  private async getPersonalEnSeguro(queryRunner: any, cod_tip_seguro: string, anio: number, mes: number) {
    return queryRunner.query(`SELECT seg.PersonalId, seg.fec_desde, seg.fec_hasta, seg.cod_tip_seguro, sitrev.PersonalSituacionRevistaSituacionId SituacionRevistaId, sitrev.SituacionRevistaDescripcion, sitrev.PersonalSituacionRevistaDesde
      FROM lige.dbo.seg_personal_seguro seg
        LEFT JOIN (
          SELECT p.PersonalId, p.PersonalSituacionRevistaSituacionId, s.SituacionRevistaDescripcion,p.PersonalSituacionRevistaDesde
          FROM PersonalSituacionRevista p
          JOIN SituacionRevista s
          ON p.PersonalSituacionRevistaSituacionId = s.SituacionRevistaId AND p.PersonalSituacionRevistaDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND ISNULL(p.PersonalSituacionRevistaHasta,'9999-12-31') >= EOMONTH(DATEFROMPARTS(@1,@2,1))
			 ) sitrev ON sitrev.PersonalId = seg.PersonalId

      WHERE seg.cod_tip_seguro = @0 AND seg.fec_desde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND ISNULL(seg.fec_hasta,'9999-12-31') >= EOMONTH(DATEFROMPARTS(@1,@2,1))
    `, [cod_tip_seguro, anio, mes])
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

      const fec_desde = new Date(anio, mes - 1, 1)
      const fec_hasta = new Date(anio, mes - 1, 0)

      const maxfechas = (await queryRunner.query(`SELECT MAX(fec_desde) fec_desde_max, MAX(fec_hasta) fec_hasta_max FROM lige.dbo.seg_personal_seguro`))[0]
      const fec_desde_max = new Date(maxfechas.fec_desde_max)
      const fec_hasta_max = new Date(maxfechas.fec_hasta_max)
    
      if (fec_desde_max > fec_desde || fec_hasta_max > fec_hasta) {
        throw new ClientException("El período seleccionado es menor al ya procesado", { fec_desde_max, fec_hasta_max })
      }
      await queryRunner.query(`UPDATE lige.dbo.seg_personal_seguro SET mot_baj_seguro=NULL, fec_hasta= NULL WHERE fec_hasta >= @0`,
        [fec_hasta])
  
      await queryRunner.query(`DELETE lige.dbo.seg_personal_seguro WHERE fec_desde >= @0`,
        [fec_desde])

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
          await this.queryUpdSeguros(queryRunner, row.PersonalId, rowEnSeguro.fec_desde, rowEnSeguro.cod_tip_seguro, row.detalle,stm_now, usuario, ip)
        } else {
          await this.queryAddSeguros(queryRunner, row.PersonalId, fec_desde, 'APC', row.detalle,stm_now, usuario, ip)
        }
        await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'AP', 'En COTO ' + row.detalle,stm_now, usuario, ip)
      }

      for (const row of personalEdesur) {
        const rowEnSeguro = personalEnSeguroEdesur.find(r => r.PersonalId == row.PersonalId)
        if (rowEnSeguro) {
          await this.queryUpdSeguros(queryRunner, row.PersonalId, rowEnSeguro.fec_desde, rowEnSeguro.cod_tip_seguro, row.detalle,stm_now, usuario, ip)
        } else {
          await this.queryAddSeguros(queryRunner, row.PersonalId, fec_desde, 'APE', row.detalle,stm_now, usuario, ip)
        }
        await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'APG', 'En Edesur ' + row.detalle,stm_now, usuario, ip)
      }

      for (const row of personalEnergiaArgentina) {
        const rowEnSeguro = personalEnSeguroEnergiaArgentina.find(r => r.PersonalId == row.PersonalId)
        if (rowEnSeguro) {
          await this.queryUpdSeguros(queryRunner, row.PersonalId, rowEnSeguro.fec_desde, rowEnSeguro.cod_tip_seguro, row.detalle,stm_now, usuario, ip)
        } else {
          await this.queryAddSeguros(queryRunner, row.PersonalId, fec_desde, 'APEA', row.detalle,stm_now, usuario, ip)
        }
        await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'APG', 'En EnergiaArgentina ' + row.detalle,stm_now, usuario, ip)
      }




      //TODO: Falta sacer los de coto y edesur

      const personalEnSeguroGeneral = await this.getPersonalEnSeguro(queryRunner, 'APG', anio, mes)


      for (const row of personalEnSeguroCoto) {
        if (!personalCoto.find(r => r.PersonalId == row.PersonalId) && row.SituacionRevistaId != 10) {
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'APC', 'No está mas en COTO',stm_now, usuario, ip)
        }
      }

      for (const row of personalEnSeguroEdesur) {
        if (!personalEdesur.find(r => r.PersonalId == row.PersonalId) && row.SituacionRevistaId != 10) {
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'APE', 'No está mas en Edesur',stm_now, usuario, ip)
        }
      }

      for (const row of personalEnSeguroEnergiaArgentina) {
        if (!personalEnergiaArgentina.find(r => r.PersonalId == row.PersonalId) && row.SituacionRevistaId != 10) {
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'APEA', 'No está mas en Energia Argentina',stm_now, usuario, ip)
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
          await this.queryUpdSeguros(queryRunner, row.PersonalId, rowEnSeguro.fec_desde, 'APG', row.detalle,stm_now, usuario, ip)
        } else {
          if ([7].includes(row.SituacionRevistaId) && row.month_diff > 3)
            continue
          if ([3,13,19,24, 8, 29, 36, 30, 31].includes(row.SituacionRevistaId) )
            continue
          
          await this.queryAddSeguros(queryRunner, row.PersonalId, fec_desde, 'APG', row.detalle,stm_now, usuario, ip)
        }
      }

      for (const row of personalEnSeguroGeneral) {
        if (personalEnSeguroCoto2.find(r => r.PersonalId == row.PersonalId))
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'APG', 'Paso a Coto',stm_now, usuario, ip)

        if (personalEnSeguroEdesur2.find(r => r.PersonalId == row.PersonalId))
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'APG', 'Paso a Edesur',stm_now, usuario, ip)

        if (personalEnSeguroEnergiaArgentna2.find(r => r.PersonalId == row.PersonalId))
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'APG', 'Paso a Energia Argentina',stm_now, usuario, ip)

        const rowEnSitRev = personalSitRev.find(r => r.PersonalId == row.PersonalId)

        if (!personalSitRev.find(r => r.PersonalId == row.PersonalId)) {
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'APG', 'No tiene situación revista (2,10,11,20,12,7)',stm_now, usuario, ip)
        } else {
          if ([7].includes(rowEnSitRev.SituacionRevistaId) && rowEnSitRev.month_diff > 3)
            await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'APG', rowEnSitRev.detalle + ' mayor a 3 meses', stm_now, usuario, ip)
          if ([3,13,19,24, 8, 29, 36, 30, 31].includes(row.SituacionRevistaId) )
            await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'APG', rowEnSitRev.detalle + ' baja',stm_now, usuario, ip)
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
          await this.queryUpdSeguros(queryRunner, row.PersonalId, rowEnSeguro.fec_desde, 'VC', row.detalle,stm_now, usuario, ip)
        } else {
          await this.queryAddSeguros(queryRunner, row.PersonalId, fec_desde, 'VC', row.detalle,stm_now, usuario, ip)
        }
      }

      for (const row of personalEnSeguroVidCol) {
        const rowEnSitRev = personalSitRev.find(r => r.PersonalId == row.PersonalId)
        if (!personalSitRev.find(r => r.PersonalId == row.PersonalId)) {
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'VC', 'No tiene situación revista (2,10,11,20,12,8,29,36,30,31,7)',stm_now, usuario, ip)
        } else {
          if ([7].includes(rowEnSitRev.SituacionRevistaId) && rowEnSitRev.month_diff > 3)
            await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'VC', rowEnSitRev.detalle + ' mayor a 3 meses', stm_now, usuario, ip)
          if ([3,13,19,24,8, 29, 36, 30, 31].includes(row.SituacionRevistaId) )
            await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'VC', rowEnSitRev.detalle + ' baja', stm_now, usuario, ip)
          
        }
      }

      await queryRunner.commitTransaction()
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    }
    return (res)? this.jsonRes(true, res, "Procesado correctamente"): true
  }

  queryUpdSeguros(queryRunner: QueryRunner, PersonalId: any, fec_desde: Date, cod_tip_seguro: string, mot_adh_seguro: string,stm_now:Date, usuario:string, ip:string) {
    return queryRunner.query(`UPDATE lige.dbo.seg_personal_seguro SET mot_adh_seguro=@3, fec_hasta=@4, aud_fecha_mod=@5, aud_usuario_mod=@6, aud_ip_mod=@7 
      WHERE PersonalId=@0 AND fec_desde=@1 AND cod_tip_seguro = @2
    `, [PersonalId, fec_desde, cod_tip_seguro, mot_adh_seguro, null, stm_now, usuario, ip])
  }

  queryUpdSegurosFin(queryRunner: QueryRunner, PersonalId: number, fec_hasta: Date, cod_tip_seguro: string, mot_baj_seguro: string, stm_now:Date, usuario:string, ip:string) {
    return queryRunner.query(`UPDATE lige.dbo.seg_personal_seguro SET mot_baj_seguro=@2, fec_hasta=@3, aud_fecha_mod=@4, aud_usuario_mod=@5, aud_ip_mod=@6 
      WHERE PersonalId=@0 AND cod_tip_seguro = @1 AND fec_desde <= @3 AND fec_hasta IS NULL
    `, [PersonalId, cod_tip_seguro, mot_baj_seguro, fec_hasta, stm_now, usuario, ip])
  }

  queryAddSeguros(queryRunner: QueryRunner, PersonalId: number, fec_desde: Date, cod_tip_seguro: string, mot_adh_seguro: string,stm_now:Date, usuario:string, ip:string) {
    return queryRunner.query(`INSERT lige.dbo.seg_personal_seguro (PersonalId, cod_tip_seguro, fec_desde, fec_hasta, mot_adh_seguro, mot_baj_seguro, aud_fecha_ing, aud_usuario_ing, aud_ip_ing, aud_fecha_mod, aud_usuario_mod, aud_ip_mod) 
      VALUES  (@0,@1, @2, @3,@4, @5, @6, @7, @8, @9, @10, @11)
    `, [PersonalId, cod_tip_seguro, fec_desde, null, mot_adh_seguro, null, stm_now, usuario, ip, stm_now, usuario, ip])
  }


  async getGridCols(req, res) {
    this.jsonRes(listaColumnas, res);
  }


  async getGridColsPoliza(req, res) {
    this.jsonRes(listaColumnasPoliza, res);
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
            per.PersonalApellidoNombre,
            seg.cod_tip_seguro,
            tipseg.nom_tip_seguro,
            seg.mot_adh_seguro,
            seg.mot_baj_seguro,
            seg.fec_desde,
            seg.fec_hasta,
            sitrev.PersonalSituacionRevistaSituacionId,
            sitrev.SituacionRevistaDescripcion,
            sitrev.PersonalSituacionRevistaDesde
        FROM Personal per
        LEFT JOIN lige.dbo.seg_personal_seguro seg ON per.PersonalId = seg.PersonalId     
         LEFT JOIN lige.dbo.seg_tipo_seguro tipseg ON seg.cod_tip_seguro = tipseg.cod_tip_seguro
       
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
        ps.Periodo_id
      FROM PolizaSeguroNew ps
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
        ps.Periodo_id
      FROM PolizaSeguroNew ps
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
      files

    } = req.body

    let result = []

    console.log("req.body", req.body)
    
    let resultFile = null
    const usuario = res.locals.userName
    const ip = this.getRemoteAddress(req)
    let resultPolizaSeguroCodigo
    //throw new ClientException(`test.`)
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



      const dniRegex = new RegExp(regex.DNILista, "mg");
      const polizaRegex = new RegExp(regex.Poliza, "m");
      const endosoRegex = new RegExp(regex.Endoso, "m");
      const fechaDesdeRegex = new RegExp(regex.FechaDesde, "m");

      //const dniRegex = new RegExp(/DNI ([\d.]{9,10})$/mg);
      //const polizaRegex = new RegExp(/(\d{9}) (?=\d{6})/m);
      //const endosoRegex = new RegExp(/\d{9} (\d{6})/m);
      //const fechaDesdeRegex = new RegExp(/^(\d{2}\.\d{2}\.\d{4})/m);


      const dni = detalle_documento.match(dniRegex).map(match => match.replace('DNI ', ''))
      const polizaEndoso = detalle_documento.match(polizaRegex)
      const endoso = detalle_documento.match(endosoRegex)
      const fechaDesdeEndoso = detalle_documento.match(fechaDesdeRegex)

      const fechaTexto = fechaDesdeEndoso[0];
      const [dia, mes, anio] = fechaTexto.split(".")
      let fechaDesde = new Date(Date.UTC(parseInt(anio), parseInt(mes) - 1, parseInt(dia)))

  
      if (!dni || !polizaEndoso) {
        throw new ClientException(`Error al procesar el Documento.`)
      }

      //throw new ClientException(`test`)
      //optiene periodo del documento
      const periodo_id = await Utils.getPeriodoId(queryRunner, new Date(), parseInt(anio), parseInt(mes), usuario, ip);
      console.log("periodo_id", periodo_id)

      //busca si el periodo esta cerrado
      const ind_recibos_generados = await queryRunner.query(`SELECT ind_recibos_generados,EOMONTH(DATEFROMPARTS(anio, mes, 1)) AS FechaCierre FROM lige.dbo.liqmaperiodo WHERE periodo_id = @0`, [periodo_id])
      const FechaCierre = new Date(ind_recibos_generados[0].FechaCierre)

      //No se podrá reprocesar datos de pólizas las cuales sean de un periodo el cual la liquidación fue cerrada.
      if (ind_recibos_generados[0].ind_recibos_generados == 1) {

        const existPolizaInPeriodo = await queryRunner.query(`SELECT DocumentoId FROM PolizaSeguroNew WHERE Periodo_id = @0 and TipoSeguroCodigo = @1`, [periodo_id, TipoSeguroCodigo])
        const polizaDocumentoId = existPolizaInPeriodo[0]?.DocumentoId

        //si existe un documento en el periodo cerrado, no se puede reprocesar
        if (polizaDocumentoId) {
          throw new ClientException(`No se puede reprocesar datos de pólizas las cuales sean de un periodo el cual la liquidación fue cerrada. ${this.dateOutputFormat(FechaCierre)}`)
        }
        
      }

      // Validar que no exista una póliza del mismo tipo en el periodo
      const polizaExistente = await queryRunner.query(`SELECT COUNT(*) as count FROM PolizaSeguroNew WHERE TipoSeguroCodigo = @0 AND Periodo_id = @1`, [TipoSeguroCodigo, periodo_id])

      if (polizaExistente[0].count > 0) {
        throw new ClientException(`Ya existe una póliza de tipo ${TipoSeguroCodigo} para el periodo seleccionado. Solo se permite una póliza por tipo por periodo.`)
      }


      
      if (PolizaSeguroCodigo) {
        // is edit
      console.log("is edit")

      resultFile = await this.fileSeguroUpload(files, queryRunner, usuario, ip)

        await queryRunner.query(`
          UPDATE PolizaSeguroNew SET
            TipoSeguroCodigo = @0,
            DocumentoId = @1,
            PolizaSeguroNroPoliza = @2,
            PolizaSeguroNroEndoso = @3,
            PolizaSeguroFechaEndoso = @4,
            CompaniaSeguroId = @5,
            PolizaSeguroAudFechaMod = @6,
            PolizaSeguroAudUsuarioMod = @7,
            PolizaSeguroAudIpMod = @8,
            Periodo_id = @10
          WHERE PolizaSeguroCodigo = @9
        `, [
          TipoSeguroCodigo,
          resultFile.doc_id,
          polizaEndoso[0],
          endoso[1],
          fechaDesde.toISOString().replace('Z', '') ,
          CompaniaSeguroId,
          new Date(),
          usuario,
          ip,
          PolizaSeguroCodigo,
          periodo_id
        ]);
        


      } else {
        // is new

      console.log("is new")


      // Solo se podrá cargar un tipo de póliza en cada periodo (1 VC, 1 AP COTO, 1 AP EDESUR y 1 AP ENERGIA ARGENTINA)
      const result = await queryRunner.query(`
        SELECT COUNT(*) as count 
        FROM PolizaSeguroNew ps
        WHERE ps.TipoSeguroCodigo = @0 
        AND ps.PolizaSeguroFechaEndoso = @1`, 
        [TipoSeguroCodigo, PolizaSeguroFechaEndoso])

      if(result[0].count > 0) {
        throw new ClientException(`Ya existe una póliza de este tipo para el periodo seleccionado.`)
      }

        resultFile = await this.fileSeguroUpload(files, queryRunner, usuario, ip)

 //'CompaniaSeguroId'-'TipoSeguroCod'-'PolizaSeguroNroPoliza'-'PolizaSeguroNroEndoso'

         resultPolizaSeguroCodigo = `${CompaniaSeguroId}-${TipoSeguroCodigo}-${polizaEndoso[0]}-${endoso[1]}`

        const existPoliza = await queryRunner.query(`SELECT PolizaSeguroCodigo FROM PolizaSeguroNew WHERE PolizaSeguroCodigo = @0`, [resultPolizaSeguroCodigo])

        if(existPoliza[0]?.PolizaSeguroCodigo) {
          throw new ClientException(`Ya existe una póliza con este documento.`)
        }

        await queryRunner.query(`
          INSERT INTO PolizaSeguroNew (
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
            Periodo_id
          ) VALUES (
            @0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13
          )
        `, [
          resultPolizaSeguroCodigo.trim(),
          TipoSeguroCodigo,
          resultFile.doc_id,
          polizaEndoso[0],
          endoso[1],
          fechaDesde.toISOString().replace('Z', ''),
          CompaniaSeguroId,
          new Date(),
          usuario,
          ip,
          new Date(),
          usuario,
          ip,
          periodo_id
        ]);

      }

      const validationDniResults = await this.validateAnInsertDni(dni, queryRunner, TipoSeguroCodigo)

      console.log("validationDniResults", validationDniResults)
      console.log("resultFile", resultFile)

      resultPolizaSeguroCodigo  = PolizaSeguroCodigo ? PolizaSeguroCodigo : resultPolizaSeguroCodigo

      if(validationDniResults)
          await queryRunner.query(`UPDATE PolizaSeguroNew SET PolizaSeguroResultado = @0 WHERE PolizaSeguroCodigo = @1`, [JSON.stringify(validationDniResults), resultPolizaSeguroCodigo])
    
      result = await queryRunner.query(`SELECT ts.TipoSeguroNombre, ps.TipoSeguroCodigo, ps.PolizaSeguroCodigo, ps.PolizaSeguroNroPoliza, ps.PolizaSeguroNroEndoso,
         ps.PolizaSeguroFechaEndoso, ps.PolizaSeguroResultado, ps.DocumentoId FROM PolizaSeguroNew ps LEFT JOIN TipoSeguro ts ON ts.TipoSeguroCodigo = ps.TipoSeguroCodigo WHERE ps.PolizaSeguroCodigo = @0`, 
         [resultPolizaSeguroCodigo])

      if (resultFile) 
        result[0].files = resultFile.ArchivosAnteriores;
      
      if(validationDniResults)
        result[0].notFound = validationDniResults
      
      ///throw new ClientException(`test.`)
      await queryRunner.commitTransaction();
      this.jsonRes({ list: result[0] }, res, (req.body.PolizaSeguroCod > 0) ? `se Actualizó con exito el registro` : `se Agregó con exito el registro`);
    } catch (error) {
      await queryRunner.rollbackTransaction()
      return next(error)
    } finally {
      await queryRunner.release()
    }


  }

  async validateAnInsertDni( dni:any, queryRunner:QueryRunner, tipoSeguroCodigo:string){


    const notFoundInPersonalTable: number[] = [];
    const notFoundInPersonalSeguro: number[] = [];
    const shouldNotBeInSeguro: number[] = [];


    const dniNumeros = dni.map(d => parseInt(d.replace(/\./g, '')));

    const personalRows = await queryRunner.query(`
      SELECT per.PersonalId, Nro.PersonalDocumentoNro
      FROM dbo.Personal per
      INNER JOIN PersonalDocumento Nro ON Nro.PersonalId = per.PersonalId
    `);

    const documentoToPersonalId = new Map<number, number>();
    personalRows.forEach(row => {
      documentoToPersonalId.set(row.PersonalDocumentoNro, row.PersonalId);
    });


    const personalSeguroRows = await queryRunner.query(`
      SELECT ps.PersonalId, pd.PersonalDocumentoNro
      FROM PersonalSeguro ps
      INNER JOIN PersonalDocumento pd ON pd.PersonalId = ps.PersonalId
      WHERE ps.TipoSeguroCodigo = @0 AND (ps.PersonalSeguroHasta IS NULL OR ps.PersonalSeguroHasta > GETDATE())
    `, [tipoSeguroCodigo]);

    const aseguradosSet = new Set<number>();
    const documentoAseguradosSet = new Set<number>();

    personalSeguroRows.forEach(row => {
      aseguradosSet.add(row.PersonalId);
      documentoAseguradosSet.add(row.PersonalDocumentoNro);
    });

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
      }
    }

    // 4. Validar asegurados que no deberían estarlo
    for (const doc of documentoAseguradosSet) {
      if (!dniNumeros.includes(doc)) {
        shouldNotBeInSeguro.push(doc);
      }
    }

    return {
      notFoundInPersonalTable,
      notFoundInPersonalSeguro,
      shouldNotBeInSeguro
    }

  }


  async fileSeguroUpload(files: any, queryRunner: QueryRunner, usuario: string, ip: string) {

    
    let resultFile = null

    if (files?.length > 0) {
      // hacer for para cada archivo
      for (const file of files) {
        let fec_doc_ven = null
        let PersonalId = 0

        let cliente_id = file.cliente_id > 0 ? file.cliente_id : null
        let objetivo_id = file.objetivo_id > 0 ? file.objetivo_id : null
   
         resultFile = await FileUploadController.handleDOCUpload(
          PersonalId, 
          objetivo_id, 
          cliente_id, 
          file.id, 
          new Date(), 
          fec_doc_ven, 
          file.den_documento, 
          file, 
          usuario,
          ip,
          queryRunner)

       //maxId = await queryRunner.query(`SELECT MAX(doc_id) AS doc_id FROM lige.dbo.docgeneral`)
       
      
      }
      return resultFile

    }
  }

  search(req: any, res: Response, next: NextFunction) {

    const { fieldName, value } = req.body;
    let buscar = false;
    let query: string = `SELECT cod_tip_seguro as SeguroId ,nom_tip_seguro as SeguroDescripcion from lige.dbo.seg_tipo_seguro WHERE 1=1 AND `;
    switch (fieldName) {
      case "SeguroDescripcion":
        const valueArray: Array<string> = value.split(/[\s,.]+/);
        valueArray.forEach((element, index) => {
          if (element.trim().length >= 1) {
            query += ` nom_tip_seguro LIKE '%${element.trim()}%' AND `;
            buscar = true;
          }
        });
        break;
      case "SeguroId":
        if (value > 0) {
          query += ` cod_tip_seguro = '${value}' AND `;
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


      // No se podrá reprocesar datos de pólizas las cuales sean de un periodo el cual la liquidación fue cerrada.
      // en caso de que el periodo que desea cargar el endoso tenga cerrada la liquidación pero no tenga póliza asociada, se podrá cargada el endoso de la poliza (esto para cada tipo)
      
    }

}

