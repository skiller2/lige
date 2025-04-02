import { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { QueryRunner } from "typeorm";
import { filtrosToSql, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";

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
							
						AND sitrev.SituacionRevistaId IN (2,10,11,20,12,8,29,36,30,31,7)
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
    return queryRunner.query(`
        SELECT  
		-- obja.ObjetivoAsistenciaAnoAno, 
		-- objm.ObjetivoAsistenciaAnoMesMes, 
		objd.ObjetivoAsistenciaMesPersonalId PersonalId,
		-- CONCAT(TRIM(per.PersonalApellido),', ',TRIM(per.PersonalNombre)) PersonaDes,

		--objetivo
		-- obj.ObjetivoId, 
		STRING_AGG(CONCAT(obj.ClienteId,'/', ISNULL(obj.ClienteElementoDependienteId,0),' ',  
		-- obj.ObjetivoDescripcion,


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
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'APC', 'No esta mas en COTO',stm_now, usuario, ip)
        }
      }

      for (const row of personalEnSeguroEdesur) {
        if (!personalEdesur.find(r => r.PersonalId == row.PersonalId) && row.SituacionRevistaId != 10) {
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'APE', 'No esta mas en Edesur',stm_now, usuario, ip)
        }
      }

      for (const row of personalEnSeguroEnergiaArgentina) {
        if (!personalEnergiaArgentina.find(r => r.PersonalId == row.PersonalId) && row.SituacionRevistaId != 10) {
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'APEA', 'No esta mas en Energia Argentina',stm_now, usuario, ip)
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
          if ([7, 8, 29, 36, 30, 31].includes(row.SituacionRevistaId) && row.month_diff > 3)
            continue
          if ([3,13,19,24].includes(row.SituacionRevistaId) )
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
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'APG', 'No tiene situación revista (2,10,11,20,12,8,29,36,30,31,7)',stm_now, usuario, ip)
        } else {
          if ([7, 8, 29, 36, 30, 31].includes(rowEnSitRev.SituacionRevistaId) && rowEnSitRev.month_diff > 3)
            await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'APG', rowEnSitRev.detalle + ' mayor a 3 meses', stm_now, usuario, ip)
          if ([3,13,19,24].includes(row.SituacionRevistaId) )
            await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'APG', rowEnSitRev.detalle + ' baja',stm_now, usuario, ip)
        }
      }

      //Vida Colectivo
      for (const row of personalSitRev) {
        if ([7, 8, 29, 36, 30, 31].includes(row.SituacionRevistaId) && row.month_diff > 3)
          continue
        if ([3,13,19,24].includes(row.SituacionRevistaId) )
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
          if ([7, 8, 29, 36, 30, 31].includes(rowEnSitRev.SituacionRevistaId) && rowEnSitRev.month_diff > 3)
            await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'VC', rowEnSitRev.detalle + ' mayor a 3 meses', stm_now, usuario, ip)
          if ([3,13,19,24].includes(row.SituacionRevistaId) )
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


}

