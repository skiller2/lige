import { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { QueryRunner } from "typeorm";

export class SegurosController extends BaseController {
  private async getPersonalBySitRev(queryRunner: any, anio: number, mes: number) {
    return queryRunner.query(`SELECT persr.PersonalId, STRING_AGG(TRIM(sitrev.SituacionRevistaDescripcion),', ') detalle,
--persr.PersonalSituacionRevistaId, 
--						persr.PersonalSituacionRevistaDesde,
	--					persr.PersonalSituacionRevistaHasta,
		--				sitrev.SituacionRevistaDescripcion,
		DATEADD(MONTH,-1,DATEFROMPARTS(@1,@2,1)) desde,
		EOMONTH(DATEFROMPARTS(@1,@2,1)) hasta,
						1
	FROM PersonalSituacionRevista persr
	LEFT JOIN SituacionRevista sitrev  ON sitrev.SituacionRevistaId = persr.PersonalSituacionRevistaSituacionId 
	 WHERE  persr.PersonalSituacionRevistaDesde <= DATEADD(MONTH,-1,DATEFROMPARTS(@1,@2,1)) AND
			ISNULL(persr.PersonalSituacionRevistaHasta, '9999-12-31') >= EOMONTH(DATEFROMPARTS(@1,@2,1))
							
						AND sitrev.SituacionRevistaId IN (2, 10, 11)
	-- 1=1					
GROUP BY persr.PersonalId
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

      WHERE seg.cod_tip_seguro = @0 AND seg.fec_desde <= DATEFROMPARTS(@1,@2,1) AND ISNULL(seg.fec_hasta,'9999-12-31') >= EOMONTH(DATEFROMPARTS(@1,@2,1))
    `, [cod_tip_seguro, anio, mes])
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



  async updateSeguros(anio: number, mes: number) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction();
      const personalCoto = await this.getPersonalHorasByClientId(queryRunner, 1, anio, mes)
      const personalEdesur = await this.getPersonalHorasByClientId(queryRunner, 798, anio, mes)
      const personalSitRev = await this.getPersonalBySitRev(queryRunner, anio, mes)
      const personalEnSeguroCoto = await this.getPersonalEnSeguro(queryRunner, 'APC', anio, mes)
      const personalEnSeguroEdesur = await this.getPersonalEnSeguro(queryRunner, 'APE', anio, mes)
      const fec_desde = new Date(anio, mes - 1, 1)
      const fec_hasta = new Date(anio, mes, 0)
      console.log('loop coto', personalCoto)
      for (const row of personalCoto) {
        const rowEnSeguro = personalEnSeguroCoto.find(r => r.PersonalId == row.PersonalId)
        if (rowEnSeguro) {
          await this.queryUpdSeguros(queryRunner, row.PersonalId, rowEnSeguro.fec_desde, rowEnSeguro.cod_tip_seguro, row.detalle)
        } else {
          await this.queryAddSeguros(queryRunner, row.PersonalId, fec_desde, 'APC', row.detalle)
        }
        await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'AP', 'En COTO ' + row.detalle)
      }

      console.log('loop edesur',)

      for (const row of personalEdesur) {
        const rowEnSeguro = personalEnSeguroEdesur.find(r => r.PersonalId == row.PersonalId)
        if (rowEnSeguro) {
          await this.queryUpdSeguros(queryRunner, row.PersonalId, rowEnSeguro.fec_desde, rowEnSeguro.cod_tip_seguro, row.detalle)
        } else {
          await this.queryAddSeguros(queryRunner, row.PersonalId, fec_desde, 'APE', row.detalle)
        }
        await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'APG', 'En Edesur ' + row.detalle)
      }
      //TODO: Falta sacer los de coto y edesur

      const personalEnSeguroGeneral = await this.getPersonalEnSeguro(queryRunner, 'APG', anio, mes)

      for (const row of personalSitRev) {
        if (personalEdesur.find(r => r.PersonalId == row.PersonalId) || personalCoto.find(r => r.PersonalId == row.PersonalId))
          continue
        const rowEnSeguro = personalEnSeguroGeneral.find(r => r.PersonalId == row.PersonalId)
        if (rowEnSeguro) {
          await this.queryUpdSeguros(queryRunner, row.PersonalId, rowEnSeguro.fec_desde, 'APG', row.detalle)
        } else {
          await this.queryAddSeguros(queryRunner, row.PersonalId, fec_desde, 'APG', row.detalle)
        }
      }

      for (const row of personalEnSeguroCoto) {
        if (!personalCoto.find(r => r.PersonalId == row.PersonalId) && row.SituacionRevistaId!=10) {
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'APC', 'No esta mas en COTO')
        }
      }

      for (const row of personalEnSeguroEdesur) {
        if (!personalEdesur.find(r => r.PersonalId == row.PersonalId) && row.SituacionRevistaId!=10) {
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'APE', 'No esta mas en Edesur')
        }
      }

      for (const row of personalEnSeguroGeneral) {
        if (!personalSitRev.find(r => r.PersonalId == row.PersonalId)) {
          await this.queryUpdSegurosFin(queryRunner, row.PersonalId, fec_hasta, 'APG', 'No tiene situación revista (2,10,11)')
        }
      }      


      await queryRunner.commitTransaction()
    } catch (error) {
      await this.rollbackTransaction(queryRunner)

    }

    console.log('fin')
    return true
  }
  queryUpdSeguros(queryRunner: QueryRunner, PersonalId: any, fec_desde: Date, cod_tip_seguro: string, mot_adh_seguro: string) {
    const stm_now = new Date()
    const usuario = 'server'
    const ip = '127.0.0.1'

    return queryRunner.query(`UPDATE lige.dbo.seg_personal_seguro SET mot_adh_seguro=@3, fec_hasta=@4, aud_fecha_mod=@5, aud_usuario_mod=@6, aud_ip_mod=@7 
      WHERE PersonalId=@0 AND fec_desde=@1 AND cod_tip_seguro = @2
    `, [PersonalId, fec_desde, cod_tip_seguro, mot_adh_seguro, null, stm_now, usuario, ip])
  }

  queryUpdSegurosFin(queryRunner: QueryRunner, PersonalId: number, fec_hasta: Date, cod_tip_seguro: string, mot_baj_seguro: string) {
    const stm_now = new Date()
    const usuario = 'server'
    const ip = '127.0.0.1'

    return queryRunner.query(`UPDATE lige.dbo.seg_personal_seguro SET mot_baj_seguro=@2, fec_hasta=@3, aud_fecha_mod=@4, aud_usuario_mod=@5, aud_ip_mod=@6 
      WHERE PersonalId=@0 AND cod_tip_seguro = @1
    `, [PersonalId, cod_tip_seguro, mot_baj_seguro, fec_hasta, stm_now, usuario, ip])
  }


  queryAddSeguros(queryRunner: QueryRunner, PersonalId: number, fec_desde: Date, cod_tip_seguro: string, mot_adh_seguro: string) {
    const stm_now = new Date()
    const usuario = 'server'
    const ip = '127.0.0.1'
    return queryRunner.query(`INSERT lige.dbo.seg_personal_seguro (PersonalId, cod_tip_seguro, fec_desde, fec_hasta, mot_adh_seguro, mot_baj_seguro, aud_fecha_ing, aud_usuario_ing, aud_ip_ing, aud_fecha_mod, aud_usuario_mod, aud_ip_mod) 
      VALUES  (@0,@1, @2, @3,@4, @5, @6, @7, @8, @9, @10, @11)
    `, [PersonalId, cod_tip_seguro, fec_desde, null, mot_adh_seguro, null, stm_now, usuario, ip, stm_now, usuario, ip])
  }

}

