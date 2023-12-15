import { NextFunction, Response } from "express";
import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { Any, QueryRunner, QueryRunnerAlreadyReleasedError } from "typeorm";
import { exit } from "process";

export class AsistenciaController extends BaseController {

  static async getIngresosExtra(anio: number, mes: number, queryRunner: QueryRunner, personalId: number[]) { 
    const listPersonaId = (personalId.length == 0) ? '' : 'AND ingext.persona_id IN (' + personalId.join(',') + ')'
    let ingesosExtra = await queryRunner.query(`SELECT peri.anio, peri.mes, ingext.persona_id, tipo.des_movimiento, ingext.tipocuenta_id, ingext.importe
    FROM lige.dbo.liqmamovimientos ingext 
    JOiN lige.dbo.liqmaperiodo peri ON peri.periodo_id = ingext.periodo_id
    JOIN lige.dbo.liqcotipomovimiento tipo ON tipo.tipo_movimiento_id = ingext.tipo_movimiento_id
    WHERE tipo.tipo_movimiento = 'I' AND peri.anio =@0 AND peri.mes=@1 ${listPersonaId} `, [anio, mes])    
    return ingesosExtra
  }


  static async getAsistenciaAdminArt42(anio: number, mes: number, queryRunner: QueryRunner, personalId: number[]) {
    const listPersonaId = (personalId.length == 0) ? '' : 'AND persona.PersonalId IN (' + personalId.join(',') + ')'

    let asisadmin = await queryRunner.query(`
    SELECT suc.SucursalId, suc.SucursalDescripcion, 
    asisa.SucursalAsistenciaAnoAno, asism.SucursalAsistenciaAnoMesMes, 
    asis.SucursalAsistenciaMesPersonalId, cuit.PersonalCUITCUILCUIT, persona.PersonalApellido, persona.PersonalNombre, 
    persona.PersonalId,    
    
    asis.SucursalAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras,
    cat.CategoriaPersonalDescripcion,
    
    (
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias1Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias1Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias2Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias2Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias3Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias3Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias4Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias4Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias5Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias5Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias6Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias6Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias7Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias7Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias8Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias8Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias9Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias9Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias10Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias10Gral),2) AS INT),0)+
    
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias11Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias11Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias12Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias12Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias13Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias13Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias14Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias14Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias15Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias15Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias16Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias16Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias17Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias17Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias18Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias18Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias19Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias19Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias20Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias20Gral),2) AS INT),0)+
    
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias21Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias21Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias22Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias22Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias23Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias23Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias24Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias24Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias25Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias25Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias26Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias26Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias27Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias27Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias28Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias28Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias29Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias29Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias30Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias30Gral),2) AS INT),0)+
    
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias31Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias31Gral),2) AS INT),0)
    ) / 60 AS horas,
    ISNULL(val.ValorLiquidacionHorasTrabajoHoraNormal,0) AS horas_fijas,
    
    val.ValorLiquidacionHoraNormal,
    
    IIF(val.ValorLiquidacionHorasTrabajoHoraNormal>0,0, (
    ((
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias1Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias1Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias2Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias2Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias3Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias3Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias4Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias4Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias5Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias5Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias6Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias6Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias7Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias7Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias8Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias8Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias9Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias9Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias10Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias10Gral),2) AS INT),0)+
    
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias11Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias11Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias12Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias12Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias13Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias13Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias14Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias14Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias15Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias15Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias16Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias16Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias17Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias17Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias18Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias18Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias19Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias19Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias20Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias20Gral),2) AS INT),0)+
    
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias21Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias21Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias22Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias22Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias23Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias23Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias24Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias24Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias25Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias25Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias26Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias26Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias27Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias27Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias28Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias28Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias29Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias29Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias30Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias30Gral),2) AS INT),0)+
    ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias31Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias31Gral),2) AS INT),0) 
    ))
    / 60 * val.ValorLiquidacionHoraNormal
    
    
    ) ) AS total,
    
    asis.SucursalAsistenciaAnoMesPersonalDiasCualArt42,
    
    1
    
    
    FROM SucursalAsistenciaAnoMesPersonalDias asis
    JOIN SucursalAsistenciaAnoMes asism ON asism.SucursalAsistenciaAnoMesId = asis.SucursalAsistenciaAnoMesId AND asism.SucursalAsistenciaAnoId = asis.SucursalAsistenciaAnoId AND asism.SucursalId = asis.SucursalId
    JOIN SucursalAsistenciaAno asisa ON asisa.SucursalAsistenciaAnoId = asism.SucursalAsistenciaAnoId AND asisa.SucursalId = asism.SucursalId
    JOIN Sucursal suc ON suc.SucursalId = asisa.SucursalId
    JOIN Personal persona ON persona.PersonalId = asis.SucursalAsistenciaMesPersonalId
    
    JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = persona.PersonalId AND cuit.PersonalCUITCUILId = persona.PersonalCUITCUILUltNro
    
    LEFT JOIN CategoriaPersonal cat ON cat.TipoAsociadoId = asis.SucursalAsistenciaTipoAsociadoId AND cat.CategoriaPersonalId = asis.SucursalAsistenciaCategoriaPersonalId
    
    LEFT JOIN ValorLiquidacion val ON val.ValorLiquidacionSucursalId = asisa.SucursalId AND val.ValorLiquidacionTipoAsociadoId = asis.SucursalAsistenciaTipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId = asis.SucursalAsistenciaCategoriaPersonalId AND val.ValorLiquidacionDesde <= DATEFROMPARTS(asisa.SucursalAsistenciaAnoAno,asism.SucursalAsistenciaAnoMesMes,'28') AND ISNULL(val.ValorLiquidacionHasta,'9999-12-31') >= DATEFROMPARTS(asisa.SucursalAsistenciaAnoAno,asism.SucursalAsistenciaAnoMesMes,'1')
    
    WHERE asisa.SucursalAsistenciaAnoAno = @1 AND asism.SucursalAsistenciaAnoMesMes = @2 ${listPersonaId} `, [, anio, mes])
    
    for (const [index, value] of asisadmin.entries()) { 
      if (value.horas >= value.horas_fijas && value.horas_fijas>0) { 
        asisadmin[index].total = value.horas_fijas * value.ValorLiquidacionHoraNormal
      } 
    }

    /*
    let persart42:any[] = []

    for (const [index, value] of asisadmin.entries()) {
      if (value.ValorLiquidacionSumaFija) {
        asisadmin[index].total = value.ValorLiquidacionSumaFija
        asisadmin[index].horas = 0
      } else if (value.SucursalAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras == 'N') {
        if (value.horas_fijas > 0 ) { //&& value.horas_reales +8 >=value.horas_fijas
          asisadmin[index].total = value.horas_fijas * value.ValorLiquidacionHoraNormal
          asisadmin[index].horas = value.horas_fijas
        } else {
          asisadmin[index].total = value.horas_reales * value.ValorLiquidacionHoraNormal
          asisadmin[index].horas = value.horas_reales
        }
      } else if (value.SucursalAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras == 'X') {
        asisadmin[index].total = value.horas_reales * value.ValorLiquidacionHoraNormal
        asisadmin[index].horas = value.horas_reales
      }

      if (value.SucursalAsistenciaAnoMesPersonalDiasCualArt42 > 0) {
        asisadmin[index].total = value.horas_reales * value.ValorLiquidacionHoraNormal
        asisadmin[index].horas = value.horas_reales
        persart42[value.SucursalAsistenciaMesPersonalId] = asisadmin[index].horas
      }

    }


    for (const [index, value] of asisadmin.entries()) {
      if (value.SucursalAsistenciaAnoMesPersonalDiasCualArt42 > 0 || value.SucursalAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras == 'X' || value.horas_fijas == 0)
        continue

      if (persart42[value.SucursalAsistenciaMesPersonalId] > 0) {
//        if (asisadmin[index].horas + persart42[value.SucursalAsistenciaMesPersonalId] > value.horas_fijas)
//          asisadmin[index].horas =  value.horas_fijas - persart42[value.SucursalAsistenciaMesPersonalId]
        asisadmin[index].horas = asisadmin[index].horas - persart42[value.SucursalAsistenciaMesPersonalId]
        asisadmin[index].total = asisadmin[index].horas * value.ValorLiquidacionHoraNormal
      }
    }
*/
    return asisadmin
  }
  async getCategoria(req: any, res: Response, next: NextFunction) {
    try {
      const result = await dataSource.query(
        `SELECT val.ValorLiquidacionSucursalId, tip.TipoAsociadoId, tip.TipoAsociadoDescripcion, cat.CategoriaPersonalId, cat.CategoriaPersonalDescripcion, val.ValorLiquidacionHoraNormal
                FROM CategoriaPersonal cat
                JOIN TipoAsociado tip ON tip.TipoAsociadoId = cat.TipoAsociadoId
                JOIN ValorLiquidacion val ON val.ValorLiquidacionTipoAsociadoId = tip.TipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId=cat.CategoriaPersonalId
                WHERE GETDATE() BETWEEN val.ValorLiquidacionDesde AND COALESCE(val.ValorLiquidacionHasta, '9999-12-31') 
                AND val.ValorLiquidacionHoraNormal > 0
                AND ISNULL(cat.CategoriaPersonalInactivo,0) <> 1
                AND tip.TipoAsociadoId = 3
                `
      );
      this.jsonRes(result, res);
    } catch (error) {
      return next(error)
    }
  }

  static async checkAsistenciaObjetivo(ObjetivoId: number, anio: number, mes: number, queryRunner: any) {
    let resultObjs = await queryRunner.query(
      `SELECT anio.ObjetivoAsistenciaAnoAno, anio.ObjetivoId, mes.ObjetivoAsistenciaAnoMesMes, mes.ObjetivoAsistenciaAnoMesDesde, mes.ObjetivoAsistenciaAnoMesHasta
    FROM ObjetivoAsistenciaAno anio
    JOIN ObjetivoAsistenciaAnoMes mes ON mes.ObjetivoAsistenciaAnoId = anio.ObjetivoAsistenciaAnoId AND mes.ObjetivoId = anio.ObjetivoId
    WHERE anio.ObjetivoId = @0 AND anio.ObjetivoAsistenciaAnoAno = @1 AND mes.ObjetivoAsistenciaAnoMesMes = @2`,
      [ObjetivoId, anio, mes]
    );

    if (resultObjs.length == 0)
      return new ClientException(`El objetivo seleccionado no tiene habilitada la carga de asistencia para el período ${anio}/${mes}`)
    if (resultObjs[0].ObjetivoAsistenciaAnoMesHasta != null)
      return new ClientException(`El objetivo seleccionado tiene cerrada la carga de asistencia para el período ${anio}/${mes} el ${new Date(resultObjs[0].ObjetivoAsistenciaAnoMesHasta).toLocaleDateString('en-GB')}`)

      return true
  }


  async setExcepcion(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    let ConceptoId:number|null = null
    try {
      let {
        SucursalId,
        anio,
        mes,
        ObjetivoId,
        PersonalId,
        metodo,
        Equivalencia,
        SumaFija,
        AdicionalHora,
        Horas,
        metodologiaId,
      } = req.body;
      const persona_cuit = req.persona_cuit;
      const fechaDesde = new Date(anio, mes - 1, 1);
      let fechaHasta = new Date(anio, mes, 1);
      fechaHasta.setDate(fechaHasta.getDate() - 1);

      if (!Equivalencia) {
        Equivalencia = {
          TipoAsociadoId: null,
          CategoriaPersonalId: null,
        };
      }

      if (SumaFija == undefined) SumaFija = null;

      if (AdicionalHora == undefined) AdicionalHora = null;
      if (Horas == undefined) Horas = null;


      if (Number(PersonalId) == 0)
        throw new ClientException("Debe seleccionar una persona")

      if (Number(ObjetivoId) == 0)
        throw new ClientException("Debe seleccionar un objetivo")

      switch (metodo) {
        case "E":
          if (!Equivalencia.TipoAsociadoId)
            throw new ClientException("Debe seleccionar una categoria");

          break;
        case "S":
          if (!SumaFija)
            throw new ClientException("Debe ingresar una monto");

          break;
        case "H":
          if (!Horas)
            throw new ClientException("Debe ingresar horas adicionales");

          break;
        case "A":
          if (!AdicionalHora)
            throw new ClientException("Debe ingresar una monto adicional por hora");

          break;

        default:
          throw new ClientException("Debe seleccionar metodología");
          break;
      }
      await queryRunner.connect();
      await queryRunner.startTransaction();

      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasGroup(req, 'administrativo') && !await this.hasAuthObjetivo(anio, mes, res, Number(ObjetivoId), queryRunner))
        throw new ClientException(`No tiene permisos para grabar la excepción`)

      if (metodologiaId == "F")
        ConceptoId = 3


      let result = await queryRunner.query(
        `SELECT percat.PersonalCategoriaTipoAsociadoId,percat.PersonalCategoriaCategoriaPersonalId, cat.CategoriaPersonalDescripcion, percat.PersonalCategoriaDesde, percat.PersonalCategoriaHasta
                FROM Personal per
                JOIN PersonalCategoria percat ON percat.PersonalCategoriaPersonalId = per.PersonalId
                JOIN CategoriaPersonal cat ON cat.TipoAsociadoId = percat.PersonalCategoriaTipoAsociadoId AND  cat.CategoriaPersonalId = percat.PersonalCategoriaCategoriaPersonalId
                WHERE per.PersonalId = @0 AND percat.PersonalCategoriaDesde <= @1 AND (percat.PersonalCategoriaHasta >= @1 OR percat.PersonalCategoriaHasta IS NULL)
                `,
        [Number(PersonalId), fechaDesde]
      );

      let row: any;
      if ((row = result[0])) {
        if (metodo == "E") {
          if (
            Equivalencia.CategoriaPersonalId ==
            row["PersonalCategoriaCategoriaPersonalId"] &&
            Equivalencia.TipoAsociadoId ==
            row["PersonalCategoriaTipoAsociadoId"]
          ) {
            throw new ClientException("Categoría de equivalencia, debe ser distinta a la vigente de la persona")
          }
        } else {

          Equivalencia.CategoriaPersonalId =
            row["PersonalCategoriaCategoriaPersonalId"]
          Equivalencia.TipoAsociadoId =
            row["PersonalCategoriaTipoAsociadoId"]
        }
      }

      const val= await AsistenciaController.checkAsistenciaObjetivo(ObjetivoId, anio, mes, queryRunner)
      if (val !== true)
        throw val
          
      
      //Traigo el Art14 para analizarlo

      let resultAutoriz = await queryRunner.query(
        `SELECT art.PersonalArt14Id, art.Personalid, art.PersonalArt14ObjetivoId, art.PersonalArt14Autorizado, art.PersonalArt14FormaArt14, art.PersonalArt14CategoriaId, art.PersonalArt14TipoAsociadoId, art.PersonalArt14SumaFija, art.PersonalArt14AdicionalHora, art.PersonalArt14Horas, 
                art.PersonalArt14AutorizadoDesde, art.PersonalArt14Desde, art.PersonalArt14AutorizadoHasta, art.PersonalArt14Hasta,
                1
                
                FROM PersonalArt14 art
                WHERE art.Personalid = @0 AND art.PersonalArt14ObjetivoId=@1 
                --AND art.PersonalArt14FormaArt14 = @2
                AND art.PersonalArt14Autorizado = 'S'
                AND ISNULL(art.PersonalArt14ConceptoId,0) = ISNULL(@4,0)
                AND art.PersonalArt14AutorizadoDesde <= @3 AND (ISNULL(art.PersonalArt14AutorizadoHasta,'9999-12-31') >= @3) AND art.PersonalArt14Anulacion is null`,
        [PersonalId, ObjetivoId, metodo, fechaDesde, ConceptoId]
      );

      let resultNoAutoriz = await queryRunner.query(
        `SELECT art.PersonalArt14Id, art.Personalid, art.PersonalArt14ObjetivoId, art.PersonalArt14Autorizado, art.PersonalArt14FormaArt14, art.PersonalArt14CategoriaId, art.PersonalArt14TipoAsociadoId, art.PersonalArt14SumaFija, art.PersonalArt14AdicionalHora, art.PersonalArt14Horas, 
                art.PersonalArt14AutorizadoDesde, art.PersonalArt14Desde, art.PersonalArt14AutorizadoHasta, art.PersonalArt14Hasta,
                
                1
                
                FROM PersonalArt14 art
                WHERE art.Personalid = @0 AND art.PersonalArt14ObjetivoId=@1
                --AND art.PersonalArt14FormaArt14 = @2 
                AND art.PersonalArt14Autorizado is null
                AND ISNULL(art.PersonalArt14ConceptoId,0) = ISNULL(@4,0)
                AND art.PersonalArt14Desde <= @3 AND (ISNULL(art.PersonalArt14Hasta,'9999-12-31') >= @3) AND art.PersonalArt14Anulacion is null`,
        [PersonalId, ObjetivoId, metodo, fechaDesde,ConceptoId]
      );

      for (row of resultAutoriz) {
        //            resultAutoriz.forEach(row => {
        //Actualizo la fecha de los registros autorizados para finalizarlos.
        const PersonalArt14FormaArt14 = row["PersonalArt14FormaArt14"];
        const PersonalArt14CategoriaId = row["PersonalArt14CategoriaId"];
        const PersonalArt14TipoAsociadoId = row["PersonalArt14TipoAsociadoId"];
        const PersonalArt14SumaFija = row["PersonalArt14SumaFija"];
        const PersonalArt14Horas = row["PersonalArt14Horas"];
        const PersonalArt14AdicionalHora = row["PersonalArt14AdicionalHora"];

        if (
          PersonalArt14FormaArt14 == metodo &&
          PersonalArt14CategoriaId == Equivalencia.CategoriaPersonalId &&
          PersonalArt14TipoAsociadoId == Equivalencia.TipoAsociadoId &&
          PersonalArt14SumaFija == SumaFija &&
          PersonalArt14AdicionalHora == AdicionalHora &&
          PersonalArt14Horas == Horas
        ) {
          throw new ClientException("Ya se encuentra cargada la información")
        }




        let hasta: Date = new Date(fechaDesde);
        hasta.setDate(fechaDesde.getDate() - 1);

        switch (metodo) {
          case "A":
            if (PersonalArt14FormaArt14 == "E") {
              await queryRunner.query(
                `UPDATE PersonalArt14 SET PersonalArt14AutorizadoHasta=@2
                            WHERE PersonalArt14Id = @0 AND PersonalId=@1 `,
                [row["PersonalArt14Id"], PersonalId, hasta]
              );
            }
            break;
          case "E":
            if (PersonalArt14FormaArt14 == "A") {
              await queryRunner.query(
                `UPDATE PersonalArt14 SET PersonalArt14AutorizadoHasta=@2
                                WHERE PersonalArt14Id = @0 AND PersonalId=@1 `,
                [row["PersonalArt14Id"], PersonalId, hasta]
              );
            }
            break;

          default:
            break;
        }
        if (PersonalArt14FormaArt14 == metodo) {
          await queryRunner.query(
            `UPDATE PersonalArt14 SET PersonalArt14AutorizadoHasta=@2
                    WHERE PersonalArt14Id = @0 AND PersonalId=@1 `,
            [row["PersonalArt14Id"], PersonalId, hasta]
          );
        }
      }

      //resultNoAutoriz.forEach(row => {
      for (row of resultNoAutoriz) {
        const PersonalArt14FormaArt14 = row["PersonalArt14FormaArt14"];
        const PersonalArt14CategoriaId = row["PersonalArt14CategoriaId"];
        const PersonalArt14TipoAsociadoId = row["PersonalArt14TipoAsociadoId"];
        const PersonalArt14SumaFija = row["PersonalArt14SumaFija"];
        const PersonalArt14Horas = row["PersonalArt14Horas"];
        const PersonalArt14AdicionalHora = row["PersonalArt14AdicionalHora"];

        if (
          PersonalArt14FormaArt14 == metodo &&
          PersonalArt14CategoriaId == Equivalencia.CategoriaPersonalId &&
          PersonalArt14TipoAsociadoId == Equivalencia.TipoAsociadoId &&
          PersonalArt14SumaFija == SumaFija &&
          PersonalArt14AdicionalHora == AdicionalHora &&
          PersonalArt14Horas == Horas
        ) {
          throw new ClientException("Ya se encuentra cargada la información");
        }

        //Borro los registros que no están autorizados.
        switch (metodo) {
          case "A":
            if (PersonalArt14FormaArt14 == "E") {
              await queryRunner.query(
                `DELETE FROM PersonalArt14 
                                WHERE PersonalArt14Id = @0 AND PersonalId=@1 `,
                [row["PersonalArt14Id"], PersonalId]
              );
            }
            break;
          case "E":
            if (PersonalArt14FormaArt14 == "A") {
              await queryRunner.query(
                `DELETE FROM PersonalArt14 
                                WHERE PersonalArt14Id = @0 AND PersonalId=@1 `,
                [row["PersonalArt14Id"], PersonalId]
              );
            }
            break;

          default:
            break;
        }
        if (PersonalArt14FormaArt14 == metodo) {
          await queryRunner.query(
            `DELETE FROM PersonalArt14 
                    WHERE PersonalArt14Id = @0 AND PersonalId=@1 `,
            [row["PersonalArt14Id"], PersonalId]
          );
        }
      }

      result = await queryRunner.query(
        `SELECT MAX(art14.PersonalArt14Id) PersonalArt14UltNro, art14.PersonalId 
        FROM PersonalArt14 art14 
        WHERE art14.Personalid = @0
        GROUP BY art14.PersonalId
            `,
        [PersonalId]
      );

      let PersonalArt14UltNro: number = 0;
      if ((row = result[0])) {
        if (row["PersonalArt14UltNro"] > 0)
          PersonalArt14UltNro = row["PersonalArt14UltNro"];
      }
      PersonalArt14UltNro++;
      if (Equivalencia.TipoAsociadoId == "NULL")
        Equivalencia.TipoAsociadoId = null;

      if (Equivalencia.CategoriaPersonalId == "NULL")
        Equivalencia.CategoriaPersonalId = null;


      result = await queryRunner.query(
        `INSERT INTO PersonalArt14(PersonalArt14Id, PersonalArt14FormaArt14, PersonalArt14SumaFija, PersonalArt14AdicionalHora, PersonalArt14Horas, PersonalArt14Porcentaje, PersonalArt14Desde, 
                    PersonalArt14Hasta, PersonalArt14Autorizado, PersonalArt14AutorizadoDesde, PersonalArt14AutorizadoHasta, PersonalArt14Anulacion, PersonalArt14Puesto, PersonalArt14Dia, PersonalArt14Tiempo, PersonalId, 
                    PersonalArt14TipoAsociadoId, PersonalArt14CategoriaId, PersonalArt14ConceptoId, PersonalArt14ObjetivoId, PersonalArt14QuienAutorizoId, PersonalArt14UsuarioId) 
                    VALUES(@0, @1, 
                    @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15, @16, @17, @18, @19, @20, @21)
                `,
        [
          PersonalArt14UltNro,
          metodo,
          SumaFija,
          AdicionalHora,
          Horas,
          null,
          fechaDesde,
          fechaHasta,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          PersonalId,
          Equivalencia.TipoAsociadoId,
          Equivalencia.CategoriaPersonalId,
          ConceptoId,
          ObjetivoId,
          null,
          null,
        ]
      );

      result = await queryRunner.query(
        `UPDATE Personal SET PersonalArt14UltNro=@1  WHERE PersonalId = @0
                `,
        [PersonalId, PersonalArt14UltNro]
      );

      await queryRunner.commitTransaction();

      this.jsonRes([], res);
    } catch (error) {
      if (queryRunner.isTransactionActive)
        await queryRunner.rollbackTransaction();
      return next(error)
    } finally {
      // you need to release query runner which is manually created:
      await queryRunner.release();
    }
  }

  async deleteExcepcion(req: any, res: Response, next: NextFunction) {
    const anio: number = req.params.anio;
    const mes: number = req.params.mes;
    const ObjetivoId: number = Number(req.params.ObjetivoId);
    const PersonalId: number = (isNaN(Number(req.params.PersonalId))) ? 0 : Number(req.params.PersonalId);
    const metodologiaId: string = req.params.metodologiaId;
    const metodo: string = req.params.metodo;
    const persona_cuit = req.persona_cuit;
    let ConceptoId:number|null = null

    if (metodologiaId == "F")
    ConceptoId = 3


    const queryRunner = dataSource.createQueryRunner();
    try {

      const fechaDesde = new Date(anio, mes - 1, 1);

      if (PersonalId == 0)
        throw new ClientException("Debe ingresar una persona")



      await queryRunner.connect();
      await queryRunner.startTransaction();

      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasGroup(req, 'administrativo') && !await this.hasAuthObjetivo(anio, mes, res, Number(ObjetivoId), queryRunner))
        throw new ClientException(`No tiene permisos para eliminar la excepción`)

      const val= await AsistenciaController.checkAsistenciaObjetivo(ObjetivoId, anio, mes, queryRunner)
      if (val !== true)
        throw val

      //Traigo el Art14 para analizarlo
      let resultAutoriz = await queryRunner.query(
        `SELECT art.PersonalArt14Id, art.Personalid, art.PersonalArt14ObjetivoId, art.PersonalArt14Autorizado, art.PersonalArt14FormaArt14, art.PersonalArt14CategoriaId, art.PersonalArt14TipoAsociadoId, art.PersonalArt14SumaFija, art.PersonalArt14AdicionalHora, art.PersonalArt14Horas, 
                art.PersonalArt14AutorizadoDesde, art.PersonalArt14Desde, art.PersonalArt14AutorizadoHasta, art.PersonalArt14Hasta,
                1
                
                FROM PersonalArt14 art
                WHERE art.Personalid = @0 AND art.PersonalArt14ObjetivoId=@1 
                AND art.PersonalArt14FormaArt14 = @2
                AND art.PersonalArt14Autorizado = 'S'
                AND ISNULL(art.PersonalArt14ConceptoId,0) = ISNULL(@4,0)

                AND art.PersonalArt14AutorizadoDesde <= @3 AND (ISNULL(art.PersonalArt14AutorizadoHasta,'9999-12-31') >= @3) AND art.PersonalArt14Anulacion is null`,
        [PersonalId, ObjetivoId, metodo, fechaDesde,ConceptoId]
      );

      let resultNoAutoriz = await queryRunner.query(
        `SELECT art.PersonalArt14Id, art.Personalid, art.PersonalArt14ObjetivoId, art.PersonalArt14Autorizado, art.PersonalArt14FormaArt14, art.PersonalArt14CategoriaId, art.PersonalArt14TipoAsociadoId, art.PersonalArt14SumaFija, art.PersonalArt14AdicionalHora, art.PersonalArt14Horas, 
                art.PersonalArt14AutorizadoDesde, art.PersonalArt14Desde, art.PersonalArt14AutorizadoHasta, art.PersonalArt14Hasta,
                
                1
                
                FROM PersonalArt14 art
                WHERE art.Personalid = @0 AND art.PersonalArt14ObjetivoId=@1
                AND art.PersonalArt14FormaArt14 = @2
                AND ISNULL(art.PersonalArt14ConceptoId,0) = ISNULL(@4,0) 
                AND art.PersonalArt14Autorizado is null
                AND art.PersonalArt14Desde <= @3 AND (art.PersonalArt14Hasta >= @3) AND art.PersonalArt14Anulacion is null`,
        [PersonalId, ObjetivoId, metodo, fechaDesde,ConceptoId]
      );

      let hasta: Date = new Date(fechaDesde);
      hasta.setDate(fechaDesde.getDate() - 1);
      let recupdate = 0;
      let recdelete = 0;
      for (const row of resultAutoriz) {
        recupdate++;
        await queryRunner.query(
          `UPDATE PersonalArt14 SET PersonalArt14AutorizadoHasta=@2 WHERE PersonalArt14Id = @0 AND PersonalId=@1 `,
          [row["PersonalArt14Id"], PersonalId, hasta]
        );
      }

      for (const row of resultNoAutoriz) {
        recdelete++;
        await queryRunner.query(
          `DELETE FROM PersonalArt14 
                                  WHERE PersonalArt14Id = @0 AND PersonalId=@1 `,
          [row["PersonalArt14Id"], PersonalId]
        );
      }

      if (recdelete + recupdate == 0)
        throw new ClientException("No se localizaron registros para finalizar para la persona y metodología indicados");

      await queryRunner.commitTransaction();
      this.jsonRes([], res);
    } catch (error) {
      if (queryRunner.isTransactionActive)
        await queryRunner.rollbackTransaction();
      return next(error)
    } finally {
      // you need to release query runner which is manually created:
      await queryRunner.release();
    }
  }

  async getExcepAsistenciaPorObjetivo(req: any, res: Response, next: NextFunction) {
    try {
      const objetivoId = req.params.objetivoId;
      const anio = req.params.anio;
      const mes = req.params.mes;
      var desde = new Date(anio, mes - 1, 1);
      
      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasGroup(req, 'administrativo') && !await this.hasAuthObjetivo(anio, mes, res, Number(objetivoId), dataSource))
        throw new ClientException(`No tiene permisos para listar asistencia del objetivo`)

      const result = await dataSource.query(
        `SELECT per.PersonalId, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, art.PersonalArt14Autorizado, art.PersonalArt14FormaArt14, art.PersonalArt14CategoriaId, art.PersonalArt14TipoAsociadoId, art.PersonalArt14SumaFija, art.PersonalArt14AdicionalHora, art.PersonalArt14Horas, TRIM(cat.CategoriaPersonalDescripcion) AS CategoriaPersonalDescripcion,
                suc.SucursalId, 
                IIF(art.PersonalArt14Autorizado ='S',art.PersonalArt14AutorizadoDesde, art.PersonalArt14Desde) AS Desde,
                IIF(art.PersonalArt14Autorizado ='S',art.PersonalArt14AutorizadoHasta, art.PersonalArt14Hasta) AS Hasta,
                art.PersonalArt14ConceptoId,con.ConceptoArt14Descripcion,
                IIF(art.PersonalArt14FormaArt14='S','Suma fija',IIF(art.PersonalArt14FormaArt14='E','Equivalencia',IIF(art.PersonalArt14FormaArt14='A','Adicional hora',IIF(art.PersonalArt14FormaArt14='H','Horas adicionales','')))) AS FormaDescripcion,
                1
                FROM PersonalArt14 art
                JOIN Personal per ON per.PersonalId = art.PersonalId
                JOIN Objetivo obj ON obj.ObjetivoId = art.PersonalArt14ObjetivoId
                LEFT JOIN ConceptoArt14 con ON con.ConceptoArt14Id = art.PersonalArt14ConceptoId
                LEFT JOIN CategoriaPersonal cat ON cat.TipoAsociadoId = art.PersonalArt14TipoAsociadoId  AND cat.CategoriaPersonalId = art.PersonalArt14CategoriaId
                LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 

                LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
                LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
                
                
                LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
                


                WHERE obj.ObjetivoId = @0 
                -- AND (art.PersonalArt14AutorizadoDesde <= @1 OR art.PersonalArt14AutorizadoDesde IS NULL) AND (art.PersonalArt14Desde <= @1 OR art.PersonalArt14Desde IS NULL) 
                AND ((art.PersonalArt14AutorizadoDesde <= @1  AND (ISNULL(art.PersonalArt14AutorizadoHasta,'9999-12-31') >= @1)) OR (art.PersonalArt14Autorizado is null AND (art.PersonalArt14Desde <= @1  AND (art.PersonalArt14Hasta >= @1))) )
                AND art.PersonalArt14Anulacion is null

                `,
        [objetivoId, desde]
      );

      this.jsonRes(result, res);
    } catch (error) {
      // if (queryRunner.isTransactionActive)
      //            await queryRunner.rollbackTransaction()
      return next(error)
    }
  }

  static async getDescuentos(anio: number, mes: number, personalId: number[]) {
    const listPersonaId = (personalId.length == 0) ? '' : 'AND per.PersonalId IN (' + personalId.join(',') + ')'

    let descuentos= await dataSource.query(
      `             
      SELECT gap.GrupoActividadId, 0 as ObjetivoId,per.PersonalId, 'G' as tipocuenta_id, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, 
      @1 AS anio, @2 AS mes, 'Adelanto' AS tipomov, '' AS desmovimiento,
      '' AS desmovimiento2, 'ADEL' tipoint,
      ade.PersonalAdelantoMontoAutorizado AS importe, 1 AS cuotanro, 1 AS cantcuotas, 0 AS importetotal
      FROM PersonalAdelanto ade 
              JOIN Personal per ON per.PersonalId = ade.PersonalId
              LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
              
              LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31')
        WHERE ade.PersonalAdelantoAplicaEl= CONCAT(FORMAT(CONVERT(INT, @2), '00'),'/',@1) AND ade.PersonalAdelantoAprobado ='S' ${listPersonaId}
      
      UNION
             
      SELECT gap.GrupoActividadId, 0 as ObjetivoId, per.PersonalId, 'G' as tipocuenta_id, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, 
      @1 AS anio, @2 AS mes, det.DescuentoDescripcion AS tipomov, 
      '' AS desmovimiento, 
      '' AS desmovimiento2, 'OTRO' tipoint,
      des.PersonalOtroDescuentoImporteVariable AS importe, 1 AS cuotanro, des.PersonalOtroDescuentoCantidadCuotas  AS cantcuotas, 0 AS importetotal
      
      FROM PersonalOtroDescuento des 
      JOIN Descuento det ON det.DescuentoId = des.PersonalOtroDescuentoDescuentoId
              JOIN Personal per ON per.PersonalId = des.PersonalId
              LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
              LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31')
      
      WHERE des.PersonalOtroDescuentoAnoAplica = @1 AND des.PersonalOtroDescuentoMesesAplica = @2 ${listPersonaId}
      
      UNION
             
      SELECT gap.GrupoActividadId, 0 as ObjetivoId, per.PersonalId, 'G' as tipocuenta_id, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, 
      @1 AS anio, @2 AS mes, 'Efecto' AS tipomov, 
      efe.EfectoDescripcion AS desmovimiento,
      efe.EfectoDescripcion AS desmovimiento2, 'DESC' tipoint,
      cuo.PersonalDescuentoCuotaImporte*des.PersonalDescuentoCantidadEfectos AS importe, des.PersonalDescuentoCuotasPagas AS cuotanro, des.PersonalDescuentoCuotas AS cantcuotas, des.PersonalDescuentoImporte - (des.PersonalDescuentoImporte * des.PersonalDescuentoPorcentajeDescuento /100)   AS importetotal
      FROM PersonalDescuento des 
      JOIN PersonalDescuentoCuota cuo ON cuo.PersonalDescuentoId = des.PersonalDescuentoId AND cuo.PersonalDescuentoPersonalId = des.PersonalDescuentoPersonalId
      JOIN Efecto efe ON efe.EfectoId = des.PersonalDescuentoEfectoId
              JOIN Personal per ON per.PersonalId = des.PersonalDescuentoPersonalId
              LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
              LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31')
      
      WHERE cuo.PersonalDescuentoCuotaAno = @1 AND cuo.PersonalDescuentoCuotaMes = @2 ${listPersonaId}
      
      UNION
      
      SELECT gap.GrupoActividadId, 0 as ObjetivoId, per.PersonalId, 'G' as tipocuenta_id, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, 
      @1 AS anio, @2 AS mes, 'Ayuda Asistencial' AS tipomov, 
      '' AS desmovimiento, 
      '' AS desmovimiento2, 'AYUD' tipoint,
      cuo.PersonalPrestamoCuotaImporte AS importe, cuo.PersonalPrestamoCuotaCuota AS cuotanro, des.PersonalPrestamoCantidadCuotas AS cantcuotas, des.PersonalPrestamoMonto importetotal
      
      FROM PersonalPrestamo des 
      JOIN PersonalPrestamoCuota cuo ON cuo.PersonalPrestamoId = des.PersonalPrestamoId AND cuo.PersonalId = des.PersonalId
              JOIN Personal per ON per.PersonalId = des.PersonalId
              LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
              LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31')
      
      WHERE cuo.PersonalPrestamoCuotaAno = @1 AND cuo.PersonalPrestamoCuotaMes = @2 ${listPersonaId}
      
      UNION
      
      SELECT gap.GrupoActividadId, 0 as ObjetivoId, per.PersonalId, 'G' as tipocuenta_id, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, 
      -- pre.PrepagaDescripcion, pla.PrepagaPlanDescripcion, dis.PersonalPrepagaDescuentoDiscriminadoCUITCUIL,  dis.PersonalPrepagaDescuentoDiscriminadoGravado, dis.PersonalPrepagaDescuentoDiscriminadoExento, dis.PersonalPrepagaDescuentoDiscriminadoTipo,
      
      @1 AS anio, @2 AS mes, 'Prepaga' AS tipomov, 
      CONCAT(TRIM(pre.PrepagaDescripcion), ' ', TRIM(pla.PrepagaPlanDescripcion), ' ' ,dis.PersonalPrepagaDescuentoDiscriminadoCUITCUIL, ' ',dis.PersonalPrepagaDescuentoDiscriminadoTipo) AS desmovimiento, 
      CONCAT(TRIM(pre.PrepagaDescripcion), ' ', TRIM(pla.PrepagaPlanDescripcion), ' ' ,dis.PersonalPrepagaDescuentoDiscriminadoCUITCUIL, ' ',dis.PersonalPrepagaDescuentoDiscriminadoTipo) AS desmovimiento2, 
      'PREP' tipoint,
     
      IIF(dis.PersonalPrepagaDescuentoDiscriminadoTipo='C',(dis.PersonalPrepagaDescuentoDiscriminadoExento+dis.PersonalPrepagaDescuentoDiscriminadoGravado)*-1,(dis.PersonalPrepagaDescuentoDiscriminadoExento+dis.PersonalPrepagaDescuentoDiscriminadoGravado)) AS importe,  1 AS cuotanro, 1 AS cantcuotas, 0 AS importetotal

      FROM PersonalPrepagaDescuento des
      JOIN Prepaga pre ON pre.PrepagaId = des.PrepagaId
      JOIN PrepagaPlan pla ON pla.PrepagaPlanId = des.PrepagaPlanId AND pla.PrepagaId = des.PrepagaId
      JOIN PersonalPrepagaDescuentoDiscriminado dis ON dis.PersonalId = des.PersonalId AND dis.PersonalPrepagaDescuentoId = des.PersonalPrepagaDescuentoId
      
        JOIN Personal per ON per.PersonalId = des.PersonalId
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
        LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31')
      
      WHERE des.PersonalPrepagaDescuentoPeriodo=CONCAT(FORMAT(CONVERT(INT, @2), '00'),'/',@1) ${listPersonaId}

      UNION

      SELECT gap.GrupoActividadId, 0 as ObjetivoId, per.PersonalId, 'G' as tipocuenta_id, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, 
      -- pre.PrepagaDescripcion, pla.PrepagaPlanDescripcion, dis.PersonalPrepagaDescuentoDiscriminadoCUITCUIL,  dis.PersonalPrepagaDescuentoDiscriminadoGravado, dis.PersonalPrepagaDescuentoDiscriminadoExento, dis.PersonalPrepagaDescuentoDiscriminadoTipo,
      
      @1 AS anio, @2 AS mes, 'Rentas' AS tipomov, 
      '' AS desmovimiento, 
      '' AS desmovimiento2, 'RENT' tipoint, 
     
     	ren.PersonalRentasPagosImporte AS importe,  1 AS cuotanro, 1 AS cantcuotas, 0 AS importetotal

      FROM PersonalRentasPagos ren
      JOIN Personal per ON per.PersonalId = ren.PersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31')
      
      WHERE ren.PersonalRentasPagosPeriodo=CONCAT(FORMAT(CONVERT(INT, @2), '00'),'/',@1) ${listPersonaId}

      UNION

      SELECT gap.GrupoActividadId, 0 as ObjetivoId, per.PersonalId, 'G' as tipocuenta_id, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, 
      
      @1 AS anio, @2 AS mes, 'Honorarios DDJJ' AS tipomov, 
      '' AS desmovimiento, 
      '' AS desmovimiento2, 'DDJJ' tipoint,
     
     	vdj.ValorDDJJImporte AS importe,  1 AS cuotanro, 1 AS cantcuotas, 0 AS importetotal

      FROM PersonalRentasPagos ren
      JOIN ValorDDJJ vdj ON vdj.ValorDDJJDesde <= DATEFROMPARTS(@1,@2,1) AND ISNULL(vdj.ValorDDJJHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,28)
      JOIN Personal per ON per.PersonalId = ren.PersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31')
      
      WHERE ren.PersonalRentasPagosPeriodo=CONCAT(FORMAT(CONVERT(INT, @2), '00'),'/',@1) ${listPersonaId}

      UNION

      SELECT gap.GrupoActividadId, des.ObjetivoId, per.PersonalId, IIF(des.ObjetivoId>0,'C','G') tipocuenta_id,   cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, 
@1 AS anio, @2 AS mes, det.DescuentoDescripcion AS tipomov, 
CONCAT(des.ObjetivoDescuentoDetalle,' ',CONCAT(' ',obj.ClienteId,'/',ISNULL(obj.ClienteElementoDependienteId,0),' ',obj.ObjetivoDescripcion)) AS desmovimiento, 
'' AS desmovimiento2, 'OTRO' tipoint,
des.ObjetivoDescuentoImporteVariable AS importe, 1 AS cuotanro, des.ObjetivoDescuentoCantidadCuotas  AS cantcuotas, 0 AS importetotal

FROM ObjetivoDescuento des 
LEFT JOIN ObjetivoDescuentoCuota cuo ON cuo.ObjetivoDescuentoId = des.ObjetivoDescuentoId AND cuo.ObjetivoId = des.ObjetivoId
LEFT JOIN ObjetivoPersonalJerarquico coo ON coo.ObjetivoId = des.ObjetivoId AND DATEFROMPARTS(@1,@2,28) > coo.ObjetivoPersonalJerarquicoDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(coo.ObjetivoPersonalJerarquicoHasta, '9999-12-31') AND coo.ObjetivoPersonalJerarquicoComo = 'C' AND coo.ObjetivoPersonalJerarquicoDescuentos = 1
JOIN Descuento det ON det.DescuentoId = des.ObjetivoDescuentoDescuentoId
JOIN Objetivo obj ON obj.ObjetivoId = des.ObjetivoId
        JOIN Personal per ON per.PersonalId = coo.ObjetivoPersonalJerarquicoPersonalId
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
        LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31')

WHERE des.ObjetivoDescuentoAnoAplica = @1 AND des.ObjetivoDescuentoMesesAplica = @2 ${listPersonaId}

      UNION

      SELECT gap.GrupoActividadId, obj.ObjetivoId, per.PersonalId, IIF(obj.ObjetivoId>0,'C','G') tipocuenta_id,
      cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, 
      anio.ConsumoTelefoniaAnoAno, mes.ConsumoTelefoniaAnoMesMes, 'Telefonía' AS tipomov, 
      CONCAT(TRIM(tel.TelefoniaNro), IIF(tel.TelefoniaObjetivoId>0,CONCAT(' ',obj.ClienteId,'/',ISNULL(obj.ClienteElementoDependienteId,0),' ',obj.ObjetivoDescripcion),'')) AS desmovimiento,
      TRIM(tel.TelefoniaNro) AS desmovimiento2, 'TELE' tipoint, 
       con.ConsumoTelefoniaAnoMesTelefonoConsumoImporte+ (con.ConsumoTelefoniaAnoMesTelefonoConsumoImporte * imp.ImpuestoInternoTelefoniaImpuesto / 100 ) AS importe, 1 AS cuotanro, 1 AS cantcuotas, 0 AS importetotal
      FROM ConsumoTelefoniaAno anio
      JOIN ConsumoTelefoniaAnoMes mes ON mes.ConsumoTelefoniaAnoId = anio.ConsumoTelefoniaAnoId
      JOIN ConsumoTelefoniaAnoMesTelefonoAsignado asi ON asi.ConsumoTelefoniaAnoMesId=mes.ConsumoTelefoniaAnoMesId AND asi.ConsumoTelefoniaAnoId = anio.ConsumoTelefoniaAnoId
      JOIN ConsumoTelefoniaAnoMesTelefonoConsumo con ON con.ConsumoTelefoniaAnoMesId = mes.ConsumoTelefoniaAnoMesId AND con.ConsumoTelefoniaAnoId = anio.ConsumoTelefoniaAnoId AND con.ConsumoTelefoniaAnoMesTelefonoAsignadoId= asi.ConsumoTelefoniaAnoMesTelefonoAsignadoId
      JOIN ImpuestoInternoTelefonia imp ON DATEFROMPARTS(@1,@2,28) > imp.ImpuestoInternoTelefoniaDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(imp.ImpuestoInternoTelefoniaHasta ,'9999-12-31') 
      JOIN Telefonia tel ON tel.TelefoniaId = asi.TelefoniaId
      
      LEFT JOIN Objetivo obj ON obj.ObjetivoId = asi.TelefonoConsumoFacturarAObjetivoId
      
      JOIN Personal per ON per.PersonalId = asi.TelefonoConsumoFacturarAPersonalId
      LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31')
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      
      WHERE anio.ConsumoTelefoniaAnoAno = @1 AND mes.ConsumoTelefoniaAnoMesMes = @2 ${listPersonaId}

      ORDER BY ApellidoNombre
      `,
      //      [personalId.join(','), anio,mes]
      ['', anio, mes]
    );
    //TODO customizacion personal 
    descuentos.forEach((row, index) => {
      if (row.PersonalId == 3032 || row.PersonalId == 1278 || row.PersonalId == 3530)
        descuentos[index].tipocuenta_id = 'G'
    });

    return descuentos
  }

  async getCategoriasPorPersona(req: any, res: Response, next: NextFunction) {
    try {
      const personalId = req.params.personalId;
      const anio = req.params.anio;
      const mes = req.params.mes;
      const queryRunner = dataSource.createQueryRunner();

      if (!await this.hasGroup(req, 'liquidaciones') && await this.hasAuthPersona(res, anio, mes, personalId, queryRunner) == false)
        throw new ClientException(`No tiene permiso para obtener información de descuentos`)
        
        const categorias = await queryRunner.query(
          `SELECT cat.TipoAsociadoId, catrel.PersonalCategoriaCategoriaPersonalId, catrel.PersonalCategoriaPersonalId, catrel.PersonalCategoriaDesde, catrel.PersonalCategoriaHasta, tip.TipoAsociadoDescripcion,cat.CategoriaPersonalDescripcion
          FROM PersonalCategoria catrel
            JOIN CategoriaPersonal cat ON cat.TipoAsociadoId = catrel.PersonalCategoriaTipoAsociadoId AND cat.CategoriaPersonalId = catrel.PersonalCategoriaCategoriaPersonalId
           JOIN TipoAsociado tip ON tip.TipoAsociadoId = cat.TipoAsociadoId
        WHERE ((DATEPART(YEAR,catrel.PersonalCategoriaDesde)=@1 AND  DATEPART(MONTH, catrel.PersonalCategoriaDesde)=@2) OR (DATEPART(YEAR,catrel.PersonalCategoriaHasta)=@1 AND  DATEPART(MONTH, catrel.PersonalCategoriaHasta)=@2) OR (catrel.PersonalCategoriaDesde <= DATEFROMPARTS(@1,@2,28) AND ISNULL(catrel.PersonalCategoriaHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,28))
        ) AND catrel.PersonalCategoriaPersonalId=@0`, [personalId, anio,mes])
  
        this.jsonRes({ categorias: categorias }, res);
      } catch (error) {
        return next(error)
      }
    }
  

  async getDescuentosPorPersona(req: any, res: Response, next: NextFunction) {
    try {
      const personalId = req.params.personalId;
      const anio = req.params.anio;
      const mes = req.params.mes;
      const queryRunner = dataSource.createQueryRunner();

      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasGroup(req, 'administrativo') && await this.hasAuthPersona(res, anio, mes, personalId, queryRunner) == false)
        throw new ClientException(`No tiene permiso para obtener información de descuentos`)


      const result = await AsistenciaController.getDescuentos(anio, mes, [personalId])

      let totalG = 0
      let totalC = 0

      for (const row of result) { 
        if (row.tipocuenta_id == 'G')
          totalG += row.importe
        if (row.tipocuenta_id == 'C')
          totalC += row.importe
      }

      this.jsonRes({ descuentos: result, totalG, totalC }, res);
    } catch (error) {
      return next(error)
    }
  }

  async getPersonalxResponsable(req: any, res: Response, next: NextFunction) {
    //ACA
    try {
      const personalId = req.params.personalId;
      const anio = req.params.anio;
      const mes = req.params.mes;
      const queryRunner = dataSource.createQueryRunner();
      if (!await this.hasGroup(req, 'liquidaciones') && res.locals.PersonalId != req.params.personalId)
        throw new ClientException(`No tiene permisos para listar la información`)

      //Busco la lista de PersonalId que le corresponde al responsable
      let personalIdList:number[]=[]
      const personal = await queryRunner.query(
        `SELECT gap.GrupoActividadId, ga.GrupoActividadNumero, ga.GrupoActividadDetalle, per.PersonalId, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS PersonaDes,
        cuit.PersonalCUITCUILCUIT,
         0 as ingresosG_importe,
         0 as ingresosC_importe,
         0 as ingresos_horas,
         0 as egresosG_importe,
         0 as egresosC_importe,
         1
         FROM Personal per
			LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)
         
         JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31')
         JOIN GrupoActividadJerarquico gaj ON gaj.GrupoActividadId=gap.GrupoActividadId AND DATEFROMPARTS(@1,@2,28) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31')
         JOIN GrupoActividad ga ON ga.GrupoActividadId = gap.GrupoActividadId
         
         WHERE gaj.GrupoActividadJerarquicoPersonalId = @0 AND per.PersonalId <> @0
         UNION
         
         SELECT 0,0,'', per.PersonalId, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS PersonaDes,
         cuit.PersonalCUITCUILCUIT,
          0 as ingresosG_importe,
          0 as ingresosC_importe,
          0 as ingresos_horas,
          0 as egresosG_importe,
          0 as egresosC_importe,
          1
          FROM Personal per
          LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
        WHERE per.PersonalId=@0
         ORDER BY PersonaDes
         `, [personalId, anio, mes])

      for (let ds of personal)
        personalIdList.push(ds.PersonalId)

      const resDescuentos = await AsistenciaController.getDescuentos(anio, mes, personalIdList)

      const resAsisObjetiv = await AsistenciaController.getAsistenciaObjetivos(anio, mes, personalIdList)

      const resAsisAdmArt42 = await AsistenciaController.getAsistenciaAdminArt42(anio, mes, queryRunner, personalIdList)
      const resIngreExtra = await AsistenciaController.getIngresosExtra(anio, mes, queryRunner, personalIdList)



      for (const row of resAsisObjetiv) {
        const key=personal.findIndex(i=> i.PersonalId == row.PersonalId)
        personal[key].ingresosG_importe += row.totalminutoscalcimporteconart14
        personal[key].ingresos_horas += row.totalhorascalc
        personal[key].retiroG_importe = personal[key].ingresosG_importe
      }

      for (const row of resAsisAdmArt42) {
        const key=personal.findIndex(i=> i.PersonalId == row.PersonalId)
        personal[key].ingresosG_importe += row.total
        personal[key].ingresos_horas += row.horas
        personal[key].retiroG_importe = personal[key].ingresosG_importe 
      }

      for (const row of resIngreExtra) {
        const key=personal.findIndex(i=> i.PersonalId == row.persona_id)
        personal[key].ingresos_horas += 0
        if (row.tipocuenta_id == 'C') {
          personal[key].ingresosC_importe += row.importe
          personal[key].retiroC_importe = personal[key].ingresosC_importe - personal[key].egresosC_importe
        } else if (row.tipocuenta_id == 'G') {
          personal[key].ingresosG_importe += row.importe
          personal[key].retiroG_importe = personal[key].ingresosG_importe - personal[key].egresosG_importe
        } 
      }

      for (const row of resDescuentos) {
        const key = personal.findIndex(i => i.PersonalId == row.PersonalId)
        if (row.tipocuenta_id == 'C') {
          personal[key].egresosC_importe += row.importe
          personal[key].retiroC_importe = personal[key].ingresosC_importe - personal[key].egresosC_importe
        } else if (row.tipocuenta_id == 'G') {
          personal[key].egresosG_importe += row.importe
          personal[key].retiroG_importe = personal[key].ingresosG_importe - personal[key].egresosG_importe
        } 
      }

//      const total = result.map(row => row.importe).reduce((prev, curr) => prev + curr, 0)

      this.jsonRes({ persxresp: personal, total:0 }, res);
    } catch (error) {
      return next(error)
    }
  }

  async getIngresosPorPersona(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const personalId = req.params.personalId;
      const anio = req.params.anio;
      const mes = req.params.mes;

      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasGroup(req, 'administrativo') && await this.hasAuthPersona(res, anio, mes, personalId, queryRunner) == false)
        throw new ClientException(`No tiene permiso para obtener información de ingresos`)

      const result = await AsistenciaController.getAsistenciaAdminArt42(anio, mes, queryRunner, [personalId])

      const total = result.map(row => row.total).reduce((prev, curr) => prev + curr, 0)
      const totalHoras = result.map(row => row.horas).reduce((prev, curr) => prev + curr, 0)

      this.jsonRes({ ingresos: result, total, totalHoras }, res);
    } catch (error) {
      return next(error)
    }
  }
  async getIngresosExtraPorPersona(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const personalId = req.params.personalId;
      const anio = req.params.anio;
      const mes = req.params.mes;

      if (!await this.hasGroup(req, 'liquidaciones') && await this.hasAuthPersona(res, anio, mes, personalId, queryRunner) == false)
        throw new ClientException(`No tiene permiso para obtener información de ingresos`)

      const result = await AsistenciaController.getIngresosExtra(anio, mes, queryRunner, [personalId])
      let totalG = 0
      let totalC = 0

      for (const row of result) { 
        if (row.tipocuenta_id == 'G')
          totalG += row.importe
        if (row.tipocuenta_id == 'C')
          totalC += row.importe
      }

      const totalHoras = 0

      this.jsonRes({ ingresos: result, totalG, totalC, totalHoras }, res);
    } catch (error) {
      return next(error)
    }
  }


  async getExcepAsistenciaPorPersona(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();

    try {
      const personalId = req.params.personalId;
      const anio = req.params.anio;
      const mes = req.params.mes;
      var desde = new Date(anio, mes - 1, 1);

      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasGroup(req, 'administrativo') && await this.hasAuthPersona(res, anio, mes, personalId, queryRunner) == false)
        throw new ClientException(`No tiene permiso para obtener información de art14`)

      const result = await queryRunner.query(
        `SELECT per.PersonalId, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, art.PersonalArt14Autorizado, art.PersonalArt14FormaArt14, art.PersonalArt14CategoriaId, art.PersonalArt14TipoAsociadoId, art.PersonalArt14SumaFija, art.PersonalArt14AdicionalHora, art.PersonalArt14Horas, TRIM(cat.CategoriaPersonalDescripcion) AS CategoriaPersonalDescripcion,
                IIF(art.PersonalArt14Autorizado ='S',art.PersonalArt14AutorizadoDesde, art.PersonalArt14Desde) AS Desde,
                IIF(art.PersonalArt14Autorizado ='S',art.PersonalArt14AutorizadoHasta, art.PersonalArt14Hasta) AS Hasta,
                CONCAT(obj.ClienteId,'/',ISNULL(obj.ClienteElementoDependienteId,0)) ObjetivoCodigo,
                obj.ObjetivoId,
                obj.ObjetivoDescripcion,
                art.PersonalArt14ConceptoId,con.ConceptoArt14Descripcion,
                IIF(art.PersonalArt14FormaArt14='S','Suma fija',IIF(art.PersonalArt14FormaArt14='E','Equivalencia',IIF(art.PersonalArt14FormaArt14='A','Adicional hora',IIF(art.PersonalArt14FormaArt14='H','Horas adicionales','')))) AS FormaDescripcion,
                
                1 id
                FROM PersonalArt14 art 
                JOIN Personal per ON per.PersonalId = art.PersonalId
                JOIN Objetivo obj ON obj.ObjetivoId = art.PersonalArt14ObjetivoId
                LEFT JOIN ConceptoArt14 con ON con.ConceptoArt14Id = art.PersonalArt14ConceptoId
                LEFT JOIN CategoriaPersonal cat ON cat.TipoAsociadoId = art.PersonalArt14TipoAsociadoId  AND cat.CategoriaPersonalId = art.PersonalArt14CategoriaId
                LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
                WHERE art.PersonalId = @0 
                -- AND (art.PersonalArt14AutorizadoDesde <= @1 OR art.PersonalArt14AutorizadoDesde IS NULL) AND (art.PersonalArt14Desde <= @1 OR art.PersonalArt14Desde IS NULL) 
                AND ((art.PersonalArt14AutorizadoDesde <= @1  AND (ISNULL(art.PersonalArt14AutorizadoHasta,'9999-12-31') >= @1)) OR (art.PersonalArt14Autorizado is null AND (art.PersonalArt14Desde <= @1  AND (art.PersonalArt14Hasta >= @1) )) )
                AND art.PersonalArt14Anulacion is null

                `,
        [personalId, desde]
      );
      this.jsonRes(result, res);
    } catch (error) {
      if (queryRunner.isTransactionActive)
        await queryRunner.rollbackTransaction()
      return next(error)
    }
  }

  static async getObjetivoAsistencia(anio: number, mes: number, extraFilters: string[],queryRunner:any) {
    const extraFiltersStr = `${(extraFilters.length>0)?'AND':''} ${extraFilters.join(' AND ')}`
    const result = await queryRunner.query(
      `SELECT suc.SucursalId, obja.ObjetivoAsistenciaAnoAno, objm.ObjetivoAsistenciaAnoMesMes, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(persona.PersonalApellido),', ',TRIM(persona.PersonalNombre)) PersonaDes,
      persona.PersonalId,
      obj.ObjetivoId, 
      CONCAT(obj.ClienteId,'/', ISNULL(obj.ClienteElementoDependienteId,0)) AS ObjetivoCodigo,
      obj.ObjetivoDescripcion,

      ga.GrupoActividadId, ga.GrupoActividadNumero, ga.GrupoActividadDetalle,
      gap.GrupoActividadObjetivoDesde, gap.GrupoActividadObjetivoHasta,
                      
      objd.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras,
      cat.CategoriaPersonalDescripcion,
      val.ValorLiquidacionHoraNormal,
      
      objd.ObjetivoAsistenciaTipoAsociadoId,
      objd.ObjetivoAsistenciaCategoriaPersonalId,
      
      
      IIF(val.ValorLiquidacionHorasTrabajoHoraNormal>1,val.ValorLiquidacionHorasTrabajoHoraNormal,((
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
      ) / CAST(60 AS FLOAT))) AS totalhorascalc ,
      
      IIF(val.ValorLiquidacionHorasTrabajoHoraNormal>1,val.ValorLiquidacionHorasTrabajoHoraNormal,((
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
      ) / CAST(60 AS FLOAT)) + ISNULL(art14H.PersonalArt14Horas,0)) * (COALESCE (valart14cat.ValorLiquidacionHoraNormal, val.ValorLiquidacionHoraNormal)+ISNULL(art14A.PersonalArt14AdicionalHora,0)) + ISNULL(art14S.PersonalArt14SumaFija,0)
      AS totalminutoscalcimporteconart14,
      art14S.PersonalArt14SumaFija,
      art14H.PersonalArt14Horas,
      art14A.PersonalArt14AdicionalHora,
      art14E.PersonalArt14TipoAsociadoId,
      art14E.PersonalArt14CategoriaId,
      val.ValorLiquidacionHoraNormal AS ValorHoraNorm,
      art14cat.CategoriaPersonalDescripcion as art14CategoriaDescripcion,
      val.ValorLiquidacionHorasTrabajoHoraNormal,
      valart14cat.ValorLiquidacionHoraNormal AS ValorHoraArt14Categoria,
      
      -- ISNULL(CAST(Substring(objd.ObjetivoAsistenciaAnoMesPersonalDiasTotalGral, 1,CHARINDEX('.', objd.ObjetivoAsistenciaAnoMesPersonalDiasTotalGral)-1) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDiasTotalGral),2) AS INT),0) as MinutosMensuales,
      
--                objhab.ObjetivoHabilitacionVigenteDesde, objhab.ObjetivoHabilitacionVigenteHasta,
      
      1 as last
      
      
      FROM ObjetivoAsistenciaAnoMesPersonalDias objd
      JOIN ObjetivoAsistenciaAnoMes objm ON objm.ObjetivoAsistenciaAnoMesId = objd.ObjetivoAsistenciaAnoMesId AND objm.ObjetivoAsistenciaAnoId = objd.ObjetivoAsistenciaAnoId AND objm.ObjetivoId = objd.ObjetivoId
      JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objm.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objm.ObjetivoId
      JOIN Objetivo obj ON obj.ObjetivoId = obja.ObjetivoId
      JOIN Personal persona ON persona.PersonalId = objd.ObjetivoAsistenciaMesPersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = persona.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = persona.PersonalId) 
      JOIN CategoriaPersonal cat ON cat.CategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId AND cat.TipoAsociadoId=objd.ObjetivoAsistenciaTipoAsociadoId
      
      LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
      LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
      
      -- aca3
      LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
      LEFT JOIN ValorLiquidacion val ON val.ValorLiquidacionSucursalId = suc.SucursalId AND val.ValorLiquidacionTipoAsociadoId = objd.ObjetivoAsistenciaTipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId AND 

      DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,1)BETWEEN 
          val.ValorLiquidacionDesde AND ISNULL(val.ValorLiquidacionHasta,'9999-12-31')
      
      LEFT JOIN GrupoActividadObjetivo gap ON gap.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND  DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'28')  BETWEEN gap.GrupoActividadObjetivoDesde AND ISNULL(gap.GrupoActividadObjetivoHasta,'9999-12-31')

      LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId

      LEFT JOIN (
		SELECT art14SX.PersonalArt14ObjetivoId, art14SX.PersonalId, SUM(art14SX.PersonalArt14SumaFija) PersonalArt14SumaFija FROM 
			PersonalArt14 art14SX 
			WHERE art14SX.PersonalArt14FormaArt14 = 'S' AND art14SX.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(@1,@2,'01') >= art14SX.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(@1,@2,'02') <= ISNULL(art14SX.PersonalArt14AutorizadoHasta,'9999-12-31') ) AND  art14SX.PersonalArt14Anulacion IS NULL
			GROUP BY art14SX.PersonalArt14ObjetivoId, art14SX.PersonalId
		) art14s ON art14S.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14S.PersonalId = objd.ObjetivoAsistenciaMesPersonalId
      LEFT JOIN PersonalArt14 art14E ON art14E.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14E.PersonalId = objd.ObjetivoAsistenciaMesPersonalId   AND art14E.PersonalArt14FormaArt14 = 'E' AND art14E.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') >= art14E.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') <= ISNULL(art14E.PersonalArt14AutorizadoHasta,'9999-12-31') ) AND  art14E.PersonalArt14Anulacion IS NULL
      LEFT JOIN PersonalArt14 art14H ON art14H.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14H.PersonalId = objd.ObjetivoAsistenciaMesPersonalId   AND art14H.PersonalArt14FormaArt14 = 'H' AND art14H.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') >= art14H.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') <= ISNULL(art14H.PersonalArt14AutorizadoHasta,'9999-12-31') ) AND  art14H.PersonalArt14Anulacion IS NULL
      LEFT JOIN PersonalArt14 art14A ON art14A.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14A.PersonalId = objd.ObjetivoAsistenciaMesPersonalId   AND art14A.PersonalArt14FormaArt14 = 'A' AND art14A.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') >= art14A.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') <= ISNULL(art14A.PersonalArt14AutorizadoHasta,'9999-12-31') ) AND  art14A.PersonalArt14Anulacion IS NULL
      
      LEFT JOIN ValorLiquidacion valart14cat ON valart14cat.ValorLiquidacionSucursalId = suc.SucursalId AND valart14cat.ValorLiquidacionTipoAsociadoId = art14E.PersonalArt14TipoAsociadoId AND valart14cat.ValorLiquidacionCategoriaPersonalId = art14E.PersonalArt14CategoriaId AND 
      DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,1)BETWEEN 
      valart14cat.ValorLiquidacionDesde AND ISNULL(valart14cat.ValorLiquidacionHasta,'9999-12-31')
      
      LEFT JOIN CategoriaPersonal art14cat ON art14cat.TipoAsociadoId = art14E.PersonalArt14TipoAsociadoId AND art14cat.CategoriaPersonalId  = art14E.PersonalArt14CategoriaId 
--                LEFT JOIN ObjetivoHabilitacion objhab ON objhab.ObjetivoHabilitacionObjetivoId = obj.ObjetivoId
      
      WHERE obja.ObjetivoAsistenciaAnoAno = @1 
      AND objm.ObjetivoAsistenciaAnoMesMes = @2

      ${extraFiltersStr}
`,
      [, anio, mes]
    );

    return result
  }

  static async getAsistenciaObjetivos(anio: number, mes: number, personalId: number[]) {
    const listPersonaId = (personalId.length == 0) ? '' : 'objd.ObjetivoAsistenciaMesPersonalId IN (' + personalId.join(',') + ')'
    const queryRunner = dataSource.createQueryRunner();
    const result = await AsistenciaController.getObjetivoAsistencia(anio,mes,[listPersonaId],queryRunner)
    return result
  }

  async getAsistenciaPorPersona(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const personalId = req.params.personalId;
      const anio = req.params.anio;
      const mes = req.params.mes;
      var desde = new Date(anio, mes - 1, 1);

      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasGroup(req, 'administrativo') && await this.hasAuthPersona(res, anio, mes, personalId, queryRunner) == false)
        throw new ClientException(`No tiene permiso para obtener información de asistencia`)

      const result = await AsistenciaController.getAsistenciaObjetivos(anio, mes, [personalId])

      const totalImporte = result.map(row => row.totalminutoscalcimporteconart14).reduce((prev, curr) => prev + curr, 0)
      const totalHoras = result.map(row => row.totalhorascalc).reduce((prev, curr) => prev + curr, 0)


      this.jsonRes({ asistencia: result, totalImporte, totalHoras }, res);
    } catch (error) {
      if (queryRunner.isTransactionActive)
        await queryRunner.rollbackTransaction()
      return next(error)
    }
  }

  async getDescuentosPorObjetivo(req: any, res: Response, next: NextFunction) {
    try {
      const objetivoId = req.params.objetivoId;
      const anio = req.params.anio;
      const mes = req.params.mes;
      let personalId:number[] =[] 

      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasGroup(req, 'administrativo') && !await this.hasAuthObjetivo(anio, mes, res, Number(objetivoId), dataSource))
        throw new ClientException(`No tiene permisos para listar descuentos de personal del objetivo`)

      const personas = await dataSource.query(
        `SELECT DISTINCT 
                persona.PersonalId,
                1 as last
                FROM ObjetivoAsistenciaAnoMesPersonalDias objd
                JOIN ObjetivoAsistenciaAnoMes objm ON objm.ObjetivoAsistenciaAnoMesId = objd.ObjetivoAsistenciaAnoMesId AND objm.ObjetivoAsistenciaAnoId = objd.ObjetivoAsistenciaAnoId AND objm.ObjetivoId = objd.ObjetivoId
                JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objm.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objm.ObjetivoId
                JOIN Objetivo obj ON obj.ObjetivoId = obja.ObjetivoId
                JOIN Personal persona ON persona.PersonalId = objd.ObjetivoAsistenciaMesPersonalId
                LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = persona.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = persona.PersonalId) 
                JOIN CategoriaPersonal cat ON cat.CategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId AND cat.TipoAsociadoId=objd.ObjetivoAsistenciaTipoAsociadoId
                
                LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
                LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
                
-- aca2
                LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
                LEFT JOIN ValorLiquidacion val ON val.ValorLiquidacionSucursalId = suc.SucursalId AND val.ValorLiquidacionTipoAsociadoId = objd.ObjetivoAsistenciaTipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId AND 
                
                DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,1)BETWEEN 
                    val.ValorLiquidacionDesde AND ISNULL(val.ValorLiquidacionHasta,'9999-12-31')
                
                LEFT JOIN GrupoActividadObjetivo gap ON gap.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND  DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'28')  BETWEEN gap.GrupoActividadObjetivoDesde AND ISNULL(gap.GrupoActividadObjetivoHasta,'9999-12-31') 
                LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId
                
                
                WHERE obja.ObjetivoAsistenciaAnoAno = @1 
                AND objm.ObjetivoAsistenciaAnoMesMes = @2 
                AND obj.ObjetivoId = @0 

                `,
        [objetivoId, anio, mes]
      )

      for (const row of personas)
        personalId.push(row.PersonalId)


      if (personalId.length > 0) {

        const result = await AsistenciaController.getDescuentos(anio, mes, personalId)
        this.jsonRes(result, res);
      } else
        this.jsonRes([], res)


    } catch (error) {
      // if (queryRunner.isTransactionActive)
      //await queryRunner.rollbackTransaction()
      return next(error)
    }
  }

  async getAsistenciaPorObjetivo(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();

    try {
      const objetivoId = req.params.objetivoId;
      const anio = req.params.anio;
      const mes = req.params.mes;
      var desde = new Date(anio, mes - 1, 1);


      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasGroup(req, 'administrativo') && !await this.hasAuthObjetivo(anio, mes, res, Number(objetivoId), queryRunner))
        throw new ClientException(`No tiene permisos para realizar consulta de asistencia por objetivo`)

      const result = await AsistenciaController.getObjetivoAsistencia(anio,mes,[`obj.ObjetivoId = ${objetivoId}`],queryRunner)

      const totalImporte = result.map(row => row.totalminutoscalcimporteconart14).reduce((prev, curr) => prev + curr, 0)
      const totalHoras = result.map(row => row.totalhorascalc).reduce((prev, curr) => prev + curr, 0)


      this.jsonRes({ asistencia: result, totalImporte, totalHoras }, res);

    } catch (error) {
      if (queryRunner.isTransactionActive)
        await queryRunner.rollbackTransaction()
      return next(error)
    }
  }

  async getMetodologia(req: any, res: Response, next: NextFunction) {
    const recordSet = new Array();
    recordSet.push({
      id: "F",
      metodo: "S",
      descripcion: "Fiestas Importe Adicional",
      etiqueta: "Imp. Adicional Fiesta",
    });

    recordSet.push({
      id: "S",
      metodo: "S",
      descripcion: "Monto fijo a sumar",
      etiqueta: "Imp. Adicional",
    });
    recordSet.push({
      id: "E",
      metodo: "E",
      descripcion: "Equivalencia de categoría",
      etiqueta: "Equivalencia",
    });
    recordSet.push({
      id: "A",
      metodo: "A",
      descripcion: "Monto adicional por hora",
      etiqueta: "Imp. Adicional Hora",
    });
    recordSet.push({
      id: "H",
      metodo: "H",
      descripcion: "Se suman a las cargadas",
      etiqueta: "Horas adicionales",
    });

    this.jsonRes(recordSet, res);
  }
}
