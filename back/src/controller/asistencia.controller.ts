import { NextFunction, Response } from "express";
import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { Any, QueryRunner } from "typeorm";

export class AsistenciaController extends BaseController {
  static async getAsistenciaAdminArt42(anio: number, mes: number, queryRunner: QueryRunner, personalId: number[]) {
    const listPersonaId = (personalId.length == 0) ? '' : 'AND persona.PersonalId IN (' + personalId.join(',') + ')'

    let asisadmin = await queryRunner.query(`SELECT suc.SucursalId, suc.SucursalDescripcion, 
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
    ) / 60 AS horas_reales,
    ISNULL(val.ValorLiquidacionHorasTrabajoHoraNormal,0) AS horas_fijas,
    
    val.ValorLiquidacionHoraNormal,
    
    IIF((val.ValorLiquidacionSumaFija>0),val.ValorLiquidacionSumaFija,IIF(val.ValorLiquidacionHorasTrabajoHoraNormal>0,val.ValorLiquidacionHorasTrabajoHoraNormal*val.ValorLiquidacionHoraNormal, (
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
    
    
    ) )) AS total1,
    
    asis.SucursalAsistenciaAnoMesPersonalDiasCualArt42,
    val.ValorLiquidacionSumaFija,
    
    1
    
    
    FROM SucursalAsistenciaAnoMesPersonalDias asis
    JOIN SucursalAsistenciaAnoMes asism ON asism.SucursalAsistenciaAnoMesId = asis.SucursalAsistenciaAnoMesId AND asism.SucursalAsistenciaAnoId = asis.SucursalAsistenciaAnoId AND asism.SucursalId = asis.SucursalId
    JOIN SucursalAsistenciaAno asisa ON asisa.SucursalAsistenciaAnoId = asism.SucursalAsistenciaAnoId AND asisa.SucursalId = asism.SucursalId
    JOIN Sucursal suc ON suc.SucursalId = asisa.SucursalId
    JOIN Personal persona ON persona.PersonalId = asis.SucursalAsistenciaMesPersonalId
    
    JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = persona.PersonalId AND cuit.PersonalCUITCUILId = persona.PersonalCUITCUILUltNro
    
    LEFT JOIN CategoriaPersonal cat ON cat.TipoAsociadoId = asis.SucursalAsistenciaTipoAsociadoId AND cat.CategoriaPersonalId = asis.SucursalAsistenciaCategoriaPersonalId
    
    LEFT JOIN ValorLiquidacion val ON val.ValorLiquidacionSucursalId = asisa.SucursalId AND val.ValorLiquidacionTipoAsociadoId = asis.SucursalAsistenciaTipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId = asis.SucursalAsistenciaCategoriaPersonalId AND val.ValorLiquidacionDesde <= DATEFROMPARTS(asisa.SucursalAsistenciaAnoAno,asism.SucursalAsistenciaAnoMesMes,'28') AND ISNULL(val.ValorLiquidacionHasta,'9999-12-31') >= DATEFROMPARTS(asisa.SucursalAsistenciaAnoAno,asism.SucursalAsistenciaAnoMesMes,'1')
    
    WHERE asisa.SucursalAsistenciaAnoAno = @0 AND asism.SucursalAsistenciaAnoMesMes = @1 ${listPersonaId} `, [anio, mes])
    let persart42 = []

    for (const [index, value] of asisadmin.entries()) {
      if (value.ValorLiquidacionSumaFija) {
        asisadmin[index].total = value.ValorLiquidacionSumaFija
        asisadmin[index].horas = 0
      } else if (value.SucursalAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras == 'N') {
        if (value.horas_fijas > 0) {
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
        asisadmin[index].horas = asisadmin[index].horas - persart42[value.SucursalAsistenciaMesPersonalId]
        asisadmin[index].total = asisadmin[index].horas * value.ValorLiquidacionHoraNormal
      }
    }

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
  async setExcepcion(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();

    try {
      let {
        SucursalId,
        anio,
        mes,
        ObjetivoId,
        PersonalId,
        metodologia,
        Equivalencia,
        SumaFija,
        AdicionalHora,
        Horas,
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

      switch (metodologia) {
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

      const auth = await this.hasAuthObjetivo(
        anio,
        mes,
        req,
        Number(ObjetivoId),
        queryRunner
      );

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
        if (metodologia == "E") {
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

      //Traigo el Art14 para analizarlo

      let resultAutoriz = await queryRunner.query(
        `SELECT art.PersonalArt14Id, art.Personalid, art.PersonalArt14ObjetivoId, art.PersonalArt14Autorizado, art.PersonalArt14FormaArt14, art.PersonalArt14CategoriaId, art.PersonalArt14TipoAsociadoId, art.PersonalArt14SumaFija, art.PersonalArt14AdicionalHora, art.PersonalArt14Horas, 
                art.PersonalArt14AutorizadoDesde, art.PersonalArt14Desde, art.PersonalArt14AutorizadoHasta, art.PersonalArt14Hasta,
                1
                
                FROM PersonalArt14 art
                WHERE art.Personalid = @0 AND art.PersonalArt14ObjetivoId=@1 
                --AND art.PersonalArt14FormaArt14 = @2
                AND art.PersonalArt14Autorizado = 'S'
                AND art.PersonalArt14AutorizadoDesde <= @3 AND (art.PersonalArt14AutorizadoHasta >= @3 OR art.PersonalArt14AutorizadoHasta is null)`,
        [PersonalId, ObjetivoId, metodologia, fechaDesde]
      );

      let resultNoAutoriz = await queryRunner.query(
        `SELECT art.PersonalArt14Id, art.Personalid, art.PersonalArt14ObjetivoId, art.PersonalArt14Autorizado, art.PersonalArt14FormaArt14, art.PersonalArt14CategoriaId, art.PersonalArt14TipoAsociadoId, art.PersonalArt14SumaFija, art.PersonalArt14AdicionalHora, art.PersonalArt14Horas, 
                art.PersonalArt14AutorizadoDesde, art.PersonalArt14Desde, art.PersonalArt14AutorizadoHasta, art.PersonalArt14Hasta,
                
                1
                
                FROM PersonalArt14 art
                WHERE art.Personalid = @0 AND art.PersonalArt14ObjetivoId=@1
                --AND art.PersonalArt14FormaArt14 = @2 
                AND art.PersonalArt14Autorizado is null
                AND art.PersonalArt14Desde <= @3 AND (art.PersonalArt14Hasta >= @3 OR art.PersonalArt14Hasta is null)`,
        [PersonalId, ObjetivoId, metodologia, fechaDesde]
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
          PersonalArt14FormaArt14 == metodologia &&
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

        switch (metodologia) {
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
        if (PersonalArt14FormaArt14 == metodologia) {
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
          PersonalArt14FormaArt14 == metodologia &&
          PersonalArt14CategoriaId == Equivalencia.CategoriaPersonalId &&
          PersonalArt14TipoAsociadoId == Equivalencia.TipoAsociadoId &&
          PersonalArt14SumaFija == SumaFija &&
          PersonalArt14AdicionalHora == AdicionalHora &&
          PersonalArt14Horas == Horas
        ) {
          throw new ClientException("Ya se encuentra cargada la información");
        }

        //Borro los registros que no están autorizados.
        switch (metodologia) {
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
        if (PersonalArt14FormaArt14 == metodologia) {
          await queryRunner.query(
            `DELETE FROM PersonalArt14 
                    WHERE PersonalArt14Id = @0 AND PersonalId=@1 `,
            [row["PersonalArt14Id"], PersonalId]
          );
        }
      }

      result = await queryRunner.query(
        `SELECT per.Personalid, per.PersonalArt14UltNro
                FROM Personal per WHERE per.Personalid = @0   
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
          metodologia,
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
          null,
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
    const metodologia: string = req.params.metodologia;
    const persona_cuit = req.persona_cuit;



    const queryRunner = dataSource.createQueryRunner();
    try {
      const fechaDesde = new Date(anio, mes - 1, 1);

      if (PersonalId == 0)
        throw new ClientException("Debe ingresar una persona")



      await queryRunner.connect();
      await queryRunner.startTransaction();

      await this.hasAuthObjetivo(
        anio,
        mes,
        req,
        Number(ObjetivoId),
        queryRunner
      );


      //Traigo el Art14 para analizarlo
      let resultAutoriz = await queryRunner.query(
        `SELECT art.PersonalArt14Id, art.Personalid, art.PersonalArt14ObjetivoId, art.PersonalArt14Autorizado, art.PersonalArt14FormaArt14, art.PersonalArt14CategoriaId, art.PersonalArt14TipoAsociadoId, art.PersonalArt14SumaFija, art.PersonalArt14AdicionalHora, art.PersonalArt14Horas, 
                art.PersonalArt14AutorizadoDesde, art.PersonalArt14Desde, art.PersonalArt14AutorizadoHasta, art.PersonalArt14Hasta,
                1
                
                FROM PersonalArt14 art
                WHERE art.Personalid = @0 AND art.PersonalArt14ObjetivoId=@1 
                AND art.PersonalArt14FormaArt14 = @2
                AND art.PersonalArt14Autorizado = 'S'
                AND art.PersonalArt14AutorizadoDesde <= @3 AND (art.PersonalArt14AutorizadoHasta >= @3 OR art.PersonalArt14AutorizadoHasta is null)`,
        [PersonalId, ObjetivoId, metodologia, fechaDesde]
      );

      let resultNoAutoriz = await queryRunner.query(
        `SELECT art.PersonalArt14Id, art.Personalid, art.PersonalArt14ObjetivoId, art.PersonalArt14Autorizado, art.PersonalArt14FormaArt14, art.PersonalArt14CategoriaId, art.PersonalArt14TipoAsociadoId, art.PersonalArt14SumaFija, art.PersonalArt14AdicionalHora, art.PersonalArt14Horas, 
                art.PersonalArt14AutorizadoDesde, art.PersonalArt14Desde, art.PersonalArt14AutorizadoHasta, art.PersonalArt14Hasta,
                
                1
                
                FROM PersonalArt14 art
                WHERE art.Personalid = @0 AND art.PersonalArt14ObjetivoId=@1
                AND art.PersonalArt14FormaArt14 = @2 
                AND art.PersonalArt14Autorizado is null
                AND art.PersonalArt14Desde <= @3 AND (art.PersonalArt14Hasta >= @3 OR art.PersonalArt14Hasta is null)`,
        [PersonalId, ObjetivoId, metodologia, fechaDesde]
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


      const auth = await this.hasAuthObjetivo(
        anio,
        mes,
        req,
        Number(objetivoId),
        dataSource
      );

      const result = await dataSource.query(
        `SELECT per.PersonalId, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, art.PersonalArt14Autorizado, art.PersonalArt14FormaArt14, art.PersonalArt14CategoriaId, art.PersonalArt14TipoAsociadoId, art.PersonalArt14SumaFija, art.PersonalArt14AdicionalHora, art.PersonalArt14Horas, TRIM(cat.CategoriaPersonalDescripcion) AS CategoriaPersonalDescripcion,
                suc.SucursalId, 
                IIF(art.PersonalArt14Autorizado ='S',art.PersonalArt14AutorizadoDesde, art.PersonalArt14Desde) AS Desde,
                IIF(art.PersonalArt14Autorizado ='S',art.PersonalArt14AutorizadoHasta, art.PersonalArt14Hasta) AS Hasta
                
                FROM PersonalArt14 art 
                JOIN Personal per ON per.PersonalId = art.PersonalId
                JOIN Objetivo obj ON obj.ObjetivoId = art.PersonalArt14ObjetivoId
                LEFT JOIN CategoriaPersonal cat ON cat.TipoAsociadoId = art.PersonalArt14TipoAsociadoId  AND cat.CategoriaPersonalId = art.PersonalArt14CategoriaId
                LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 

                LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
                LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
                
                
                LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
                


                WHERE obj.ObjetivoId = @0 
                -- AND (art.PersonalArt14AutorizadoDesde <= @1 OR art.PersonalArt14AutorizadoDesde IS NULL) AND (art.PersonalArt14Desde <= @1 OR art.PersonalArt14Desde IS NULL) 
                AND ((art.PersonalArt14AutorizadoDesde <= @1  AND (art.PersonalArt14AutorizadoHasta >= @1 OR art.PersonalArt14AutorizadoHasta is null)) OR (art.PersonalArt14Autorizado is null AND (art.PersonalArt14Desde <= @1  AND (art.PersonalArt14Hasta >= @1 OR art.PersonalArt14Hasta is null))) )


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

    return dataSource.query(
      `             
      SELECT perrel.PersonalCategoriaPersonalId PersonalIdJ, 0 as ObjetivoId,per.PersonalId, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, 
      @1 AS anio, @2 AS mes, 'Adelanto' AS tipomov, '' AS desmovimiento,
      '' AS desmovimiento2, 'ADEL' tipoint,
      ade.PersonalAdelantoMontoAutorizado AS importe, 1 AS cuotanro, 1 AS cantcuotas, 0 AS importetotal
      FROM PersonalAdelanto ade 
              JOIN Personal per ON per.PersonalId = ade.PersonalId
              LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
              LEFT JOIN OperacionesPersonalAsignarAJerarquico perrel ON perrel.OperacionesPersonalAAsignarPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > perrel.OperacionesPersonalAsignarAJerarquicoDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(perrel.OperacionesPersonalAsignarAJerarquicoHasta, '9999-12-31')
      
        WHERE ade.PersonalAdelantoAplicaEl= CONCAT(FORMAT(CONVERT(INT, @2), '00'),'/',@1) AND ade.PersonalAdelantoAprobado ='S' ${listPersonaId}
      
      UNION
             
      SELECT perrel.PersonalCategoriaPersonalId PersonalIdJ, 0 as ObjetivoId, per.PersonalId, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, 
      @1 AS anio, @2 AS mes, det.DescuentoDescripcion AS tipomov, 
      '' AS desmovimiento, 
      '' AS desmovimiento2, 'OTRO' tipoint,
      des.PersonalOtroDescuentoImporteVariable AS importe, 1 AS cuotanro, des.PersonalOtroDescuentoCantidadCuotas  AS cantcuotas, 0 AS importetotal
      
      FROM PersonalOtroDescuento des 
      JOIN Descuento det ON det.DescuentoId = des.PersonalOtroDescuentoDescuentoId
              JOIN Personal per ON per.PersonalId = des.PersonalId
              LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
              LEFT JOIN OperacionesPersonalAsignarAJerarquico perrel ON perrel.OperacionesPersonalAAsignarPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > perrel.OperacionesPersonalAsignarAJerarquicoDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(perrel.OperacionesPersonalAsignarAJerarquicoHasta, '9999-12-31')
      
      WHERE des.PersonalOtroDescuentoAnoAplica = @1 AND des.PersonalOtroDescuentoMesesAplica = @2 ${listPersonaId}
      
      UNION
             
      SELECT perrel.PersonalCategoriaPersonalId PersonalIdJ, 0 as ObjetivoId, per.PersonalId, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, 
      @1 AS anio, @2 AS mes, 'Efecto' AS tipomov, 
      efe.EfectoDescripcion AS desmovimiento,
      efe.EfectoDescripcion AS desmovimiento2, 'DESC' tipoint,
      cuo.PersonalDescuentoCuotaImporte*des.PersonalDescuentoCantidadEfectos AS importe, des.PersonalDescuentoCuotasPagas AS cuotanro, des.PersonalDescuentoCuotas AS cantcuotas, des.PersonalDescuentoImporte - (des.PersonalDescuentoImporte * des.PersonalDescuentoPorcentajeDescuento /100)   AS importetotal
      FROM PersonalDescuento des 
      JOIN PersonalDescuentoCuota cuo ON cuo.PersonalDescuentoId = des.PersonalDescuentoId AND cuo.PersonalDescuentoPersonalId = des.PersonalDescuentoPersonalId
      JOIN Efecto efe ON efe.EfectoId = des.PersonalDescuentoEfectoId
              JOIN Personal per ON per.PersonalId = des.PersonalDescuentoPersonalId
              LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
              LEFT JOIN OperacionesPersonalAsignarAJerarquico perrel ON perrel.OperacionesPersonalAAsignarPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > perrel.OperacionesPersonalAsignarAJerarquicoDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(perrel.OperacionesPersonalAsignarAJerarquicoHasta, '9999-12-31')
      
      WHERE cuo.PersonalDescuentoCuotaAno = @1 AND cuo.PersonalDescuentoCuotaMes = @2 ${listPersonaId}
      
      UNION
      
      SELECT perrel.PersonalCategoriaPersonalId PersonalIdJ, 0 as ObjetivoId, per.PersonalId, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, 
      @1 AS anio, @2 AS mes, 'Ayuda Asistencial' AS tipomov, 
      '' AS desmovimiento, 
      '' AS desmovimiento2, 'AYUD' tipoint,
      cuo.PersonalPrestamoCuotaImporte AS importe, cuo.PersonalPrestamoCuotaCuota AS cuotanro, des.PersonalPrestamoCantidadCuotas AS cantcuotas, des.PersonalPrestamoMonto importetotal
      
      FROM PersonalPrestamo des 
      JOIN PersonalPrestamoCuota cuo ON cuo.PersonalPrestamoId = des.PersonalPrestamoId AND cuo.PersonalId = des.PersonalId
              JOIN Personal per ON per.PersonalId = des.PersonalId
              LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
              LEFT JOIN OperacionesPersonalAsignarAJerarquico perrel ON perrel.OperacionesPersonalAAsignarPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > perrel.OperacionesPersonalAsignarAJerarquicoDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(perrel.OperacionesPersonalAsignarAJerarquicoHasta, '9999-12-31')
      
      WHERE cuo.PersonalPrestamoCuotaAno = @1 AND cuo.PersonalPrestamoCuotaMes = @2 ${listPersonaId}
      
      UNION
      
      SELECT perrel.PersonalCategoriaPersonalId PersonalIdJ, 0 as ObjetivoId, per.PersonalId, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, 
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
        LEFT JOIN OperacionesPersonalAsignarAJerarquico perrel ON perrel.OperacionesPersonalAAsignarPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > perrel.OperacionesPersonalAsignarAJerarquicoDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(perrel.OperacionesPersonalAsignarAJerarquicoHasta, '9999-12-31')
      
      WHERE des.PersonalPrepagaDescuentoPeriodo=CONCAT(FORMAT(CONVERT(INT, @2), '00'),'/',@1) ${listPersonaId}

      UNION

      SELECT perrel.PersonalCategoriaPersonalId PersonalIdJ, 0 as ObjetivoId, per.PersonalId, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, 
      -- pre.PrepagaDescripcion, pla.PrepagaPlanDescripcion, dis.PersonalPrepagaDescuentoDiscriminadoCUITCUIL,  dis.PersonalPrepagaDescuentoDiscriminadoGravado, dis.PersonalPrepagaDescuentoDiscriminadoExento, dis.PersonalPrepagaDescuentoDiscriminadoTipo,
      
      @1 AS anio, @2 AS mes, 'Rentas' AS tipomov, 
      '' AS desmovimiento, 
      '' AS desmovimiento2, 'RENT' tipoint, 
     
     	ren.PersonalRentasPagosImporte AS importe,  1 AS cuotanro, 1 AS cantcuotas, 0 AS importetotal

      FROM PersonalRentasPagos ren
      JOIN Personal per ON per.PersonalId = ren.PersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN OperacionesPersonalAsignarAJerarquico perrel ON perrel.OperacionesPersonalAAsignarPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > perrel.OperacionesPersonalAsignarAJerarquicoDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(perrel.OperacionesPersonalAsignarAJerarquicoHasta, '9999-12-31')
      
      WHERE ren.PersonalRentasPagosPeriodo=CONCAT(FORMAT(CONVERT(INT, @2), '00'),'/',@1) ${listPersonaId}

      UNION

      SELECT perrel.PersonalCategoriaPersonalId PersonalIdJ, 0 as ObjetivoId, per.PersonalId, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, 
      
      @1 AS anio, @2 AS mes, 'Honorarios DDJJ' AS tipomov, 
      '' AS desmovimiento, 
      '' AS desmovimiento2, 'DDJJ' tipoint,
     
     	vdj.ValorDDJJImporte AS importe,  1 AS cuotanro, 1 AS cantcuotas, 0 AS importetotal

      FROM PersonalRentasPagos ren
      JOIN ValorDDJJ vdj ON vdj.ValorDDJJDesde <= DATEFROMPARTS(@1,@2,1) AND ISNULL(vdj.ValorDDJJHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,28)
      JOIN Personal per ON per.PersonalId = ren.PersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN OperacionesPersonalAsignarAJerarquico perrel ON perrel.OperacionesPersonalAAsignarPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > perrel.OperacionesPersonalAsignarAJerarquicoDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(perrel.OperacionesPersonalAsignarAJerarquicoHasta, '9999-12-31')
      
      WHERE ren.PersonalRentasPagosPeriodo=CONCAT(FORMAT(CONVERT(INT, @2), '00'),'/',@1) ${listPersonaId}

      UNION

      SELECT perrel.PersonalCategoriaPersonalId PersonalIdJ, obj.ObjetivoId, per.PersonalId, 
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
      LEFT JOIN OperacionesPersonalAsignarAJerarquico perrel ON perrel.OperacionesPersonalAAsignarPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > perrel.OperacionesPersonalAsignarAJerarquicoDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(perrel.OperacionesPersonalAsignarAJerarquicoHasta, '9999-12-31')
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      
      WHERE anio.ConsumoTelefoniaAnoAno = @1 AND mes.ConsumoTelefoniaAnoMesMes = @2 ${listPersonaId}

      ORDER BY ApellidoNombre
      `,
      //      [personalId.join(','), anio,mes]
      ['', anio, mes]
    );

  }

  async getDescuentosPorPersona(req: any, res: Response, next: NextFunction) {
    try {
      const personalId = req.params.personalId;
      const anio = req.params.anio;
      const mes = req.params.mes;
      const queryRunner = dataSource.createQueryRunner();

      if (!this.hasGroup(req, 'liquidaciones') && await this.hasAuthPersona(res, anio, mes, personalId, queryRunner) == false)
        throw new ClientException(`No tiene permiso para obtener información de descuentos`)


      const result = await AsistenciaController.getDescuentos(anio, mes, [personalId])

      const total = result.map(row => row.importe).reduce((prev, curr) => prev + curr, 0)

      this.jsonRes({ descuentos: result, total }, res);
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

      if (!this.hasGroup(req, 'liquidaciones') && res.locals.PersonalId != req.params.personalId)
        throw new ClientException(`No tiene permisos para listar la información`)

      //Busco la lista de PersonalId que le corresponde al responsable
      let personalIdList=[]
      const personal = await queryRunner.query(
        `SELECT perrel.PersonalCategoriaPersonalId PersonalIdJ, per.PersonalId, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS PersonaDes,
        cuit.PersonalCUITCUILCUIT,
         0 as ingresos_importe,
         0 as ingresos_horas,
         0 as egresos_importe,
         1
         FROM Personal per
         LEFT JOIN OperacionesPersonalAsignarAJerarquico perrel ON perrel.OperacionesPersonalAAsignarPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > perrel.OperacionesPersonalAsignarAJerarquicoDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(perrel.OperacionesPersonalAsignarAJerarquicoHasta, '9999-12-31')
         LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 

         WHERE perrel.PersonalCategoriaPersonalId = @0
         UNION
         
         SELECT per.PersonalId PersonalIdJ, per.PersonalId, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS PersonaDes,
         cuit.PersonalCUITCUILCUIT,
          0 as ingresos_importe,
          0 as ingresos_horas,
          0 as egresos_importe,
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

      for (const row of resAsisObjetiv) {
        const key=personal.findIndex(i=> i.PersonalId == row.PersonalId)
        personal[key].ingresos_importe += row.totalminutoscalcimporteconart14
        personal[key].ingresos_horas += row.totalhorascalc
        personal[key].retiro_importe = personal[key].ingresos_importe
      }

      for (const row of resAsisAdmArt42) {
        const key=personal.findIndex(i=> i.PersonalId == row.PersonalId)
        personal[key].ingresos_importe += row.total
        personal[key].ingresos_horas += row.horas
        personal[key].retiro_importe = personal[key].ingresos_importe 
      }

      for (const row of resDescuentos) {
        const key=personal.findIndex(i=> i.PersonalId == row.PersonalId)
        personal[key].egresos_importe += row.importe
        personal[key].retiro_importe = personal[key].ingresos_importe - personal[key].egresos_importe
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

      if (!this.hasGroup(req, 'liquidaciones') && await this.hasAuthPersona(res, anio, mes, personalId, queryRunner) == false)
        throw new ClientException(`No tiene permiso para obtener información de ingresos`)

      const result = await AsistenciaController.getAsistenciaAdminArt42(anio, mes, queryRunner, [personalId])

      const total = result.map(row => row.total).reduce((prev, curr) => prev + curr, 0)
      const totalHoras = result.map(row => row.horas).reduce((prev, curr) => prev + curr, 0)

      this.jsonRes({ ingresos: result, total, totalHoras }, res);
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

      if (!this.hasGroup(req, 'liquidaciones') && await this.hasAuthPersona(res, anio, mes, personalId, queryRunner) == false)
        throw new ClientException(`No tiene permiso para obtener información de art14`)

      const result = await queryRunner.query(
        `SELECT per.PersonalId, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, art.PersonalArt14Autorizado, art.PersonalArt14FormaArt14, art.PersonalArt14CategoriaId, art.PersonalArt14TipoAsociadoId, art.PersonalArt14SumaFija, art.PersonalArt14AdicionalHora, art.PersonalArt14Horas, TRIM(cat.CategoriaPersonalDescripcion) AS CategoriaPersonalDescripcion,
                IIF(art.PersonalArt14Autorizado ='S',art.PersonalArt14AutorizadoDesde, art.PersonalArt14Desde) AS Desde,
                IIF(art.PersonalArt14Autorizado ='S',art.PersonalArt14AutorizadoHasta, art.PersonalArt14Hasta) AS Hasta,
                CONCAT(obj.ClienteId,'/',ISNULL(obj.ClienteElementoDependienteId,0)) ObjetivoCodigo,
                obj.ObjetivoId,
                obj.ObjetivoDescripcion,
                1 id
                FROM PersonalArt14 art 
                JOIN Personal per ON per.PersonalId = art.PersonalId
                JOIN Objetivo obj ON obj.ObjetivoId = art.PersonalArt14ObjetivoId
                LEFT JOIN CategoriaPersonal cat ON cat.TipoAsociadoId = art.PersonalArt14TipoAsociadoId  AND cat.CategoriaPersonalId = art.PersonalArt14CategoriaId
                LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
                WHERE art.PersonalId = @0 
                -- AND (art.PersonalArt14AutorizadoDesde <= @1 OR art.PersonalArt14AutorizadoDesde IS NULL) AND (art.PersonalArt14Desde <= @1 OR art.PersonalArt14Desde IS NULL) 
                AND ((art.PersonalArt14AutorizadoDesde <= @1  AND (art.PersonalArt14AutorizadoHasta >= @1 OR art.PersonalArt14AutorizadoHasta is null)) OR (art.PersonalArt14Autorizado is null AND (art.PersonalArt14Desde <= @1  AND (art.PersonalArt14Hasta >= @1 OR art.PersonalArt14Hasta is null))) )


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


  static async getAsistenciaObjetivos(anio: number, mes: number, personalId: number[]) {
    const listPersonaId = (personalId.length == 0) ? '' : 'AND objd.ObjetivoAsistenciaMesPersonalId IN (' + personalId.join(',') + ')'
    const queryRunner = dataSource.createQueryRunner();
    const result = await queryRunner.query(
      `SELECT suc.SucursalId, obja.ObjetivoAsistenciaAnoAno, objm.ObjetivoAsistenciaAnoMesMes, cuit.PersonalCUITCUILCUIT, persona.PersonalId, CONCAT(TRIM(persona.PersonalApellido),', ',TRIM(persona.PersonalNombre)) PersonaDes,
            
              obj.ObjetivoId, 
              CONCAT(obj.ClienteId,'/', ISNULL(obj.ClienteElementoDependienteId,0)) AS ObjetivoCodigo,
              obj.ObjetivoDescripcion,
              CONCAT (TRIM(perjer.PersonalApellido),', ',TRIM(perjer.PersonalNombre)) AS CoordinadorZonaDes, 
              perjer.PersonalNombre AS NombreCoordinadorZona, 
              perjer.PersonalApellido AS ApellidoCoordinadorZona,
              objd.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras,
              cat.CategoriaPersonalDescripcion,
              val.ValorLiquidacionHoraNormal,
              -- CAST (objd.ObjetivoAsistenciaAnoMesPersonalDiasTotalGral AS FLOAT) AS HorasMensuales,
              --CAST (objd.ObjetivoAsistenciaAnoMesPersonalDiasTotalGral AS FLOAT)*val.ValorLiquidacionHoraNormal AS HorasMensualesImporte,
              
              objd.ObjetivoAsistenciaTipoAsociadoId,
              objd.ObjetivoAsistenciaCategoriaPersonalId,
              
              
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
              ) / CAST(60 AS FLOAT)) AS totalhorascalc ,
              
              
              
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
              ) / CAST(60 AS FLOAT) + ISNULL(art14H.PersonalArt14Horas,0)) * (COALESCE (valart14cat.ValorLiquidacionHoraNormal, val.ValorLiquidacionHoraNormal)+ISNULL(art14A.PersonalArt14AdicionalHora,0)) + ISNULL(art14S.PersonalArt14SumaFija,0)
              AS totalminutoscalcimporteconart14,
              art14S.PersonalArt14SumaFija,
              art14H.PersonalArt14Horas,
              art14A.PersonalArt14AdicionalHora,
              art14E.PersonalArt14TipoAsociadoId,
              art14E.PersonalArt14CategoriaId,
              val.ValorLiquidacionHoraNormal AS ValorHoraNorm,
              art14cat.CategoriaPersonalDescripcion as art14CategoriaDescripcion,
              valart14cat.ValorLiquidacionHoraNormal AS ValorHoraArt14Categoria,
              
              -- ISNULL(CAST(Substring(objd.ObjetivoAsistenciaAnoMesPersonalDiasTotalGral, 1,CHARINDEX('.', objd.ObjetivoAsistenciaAnoMesPersonalDiasTotalGral)-1) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDiasTotalGral),2) AS INT),0) as MinutosMensuales,
              
              objhab.ObjetivoHabilitacionVigenteDesde, objhab.ObjetivoHabilitacionVigenteHasta,
              
              
              
              
              
              
              
              
              
              
              
              
              
              
              
              
              1 as last
              
              
              FROM ObjetivoAsistenciaAnoMesPersonalDias objd
              JOIN ObjetivoAsistenciaAnoMes objm ON objm.ObjetivoAsistenciaAnoMesId = objd.ObjetivoAsistenciaAnoMesId AND objm.ObjetivoAsistenciaAnoId = objd.ObjetivoAsistenciaAnoId AND objm.ObjetivoId = objd.ObjetivoId
              JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objm.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objm.ObjetivoId
              JOIN Objetivo obj ON obj.ObjetivoId = obja.ObjetivoId
              JOIN Personal persona ON persona.PersonalId = objd.ObjetivoAsistenciaMesPersonalId
              JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = persona.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = persona.PersonalId) 

              JOIN CategoriaPersonal cat ON cat.CategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId AND cat.TipoAsociadoId=objd.ObjetivoAsistenciaTipoAsociadoId
              
              LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
              LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
              
              
              LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
                              
              
              
              LEFT JOIN ValorLiquidacion val ON val.ValorLiquidacionSucursalId = suc.SucursalId AND val.ValorLiquidacionTipoAsociadoId = objd.ObjetivoAsistenciaTipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId AND 
              
              DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,1)BETWEEN 
                  val.ValorLiquidacionDesde AND ISNULL(val.ValorLiquidacionHasta,'9999-12-31')

              
              LEFT JOIN ObjetivoPersonalJerarquico opj ON opj.ObjetivoId = obj.ObjetivoId AND  DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'28')  BETWEEN opj.ObjetivoPersonalJerarquicoDesde  AND ISNULL(opj.ObjetivoPersonalJerarquicoHasta,'9999-12-31') AND opj.ObjetivoPersonalJerarquicoComo = 'J'
              LEFT JOIN Personal perjer ON perjer.PersonalId = opj.ObjetivoPersonalJerarquicoPersonalId
              
              
              
              
              LEFT JOIN PersonalArt14 art14S ON art14S.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14S.PersonalId = objd.ObjetivoAsistenciaMesPersonalId   AND art14S.PersonalArt14FormaArt14 = 'S' AND art14S.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') >= art14S.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14S.PersonalArt14AutorizadoHasta OR art14S.PersonalArt14AutorizadoHasta IS NULL) AND  ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14S.PersonalArt14Anulacion   OR art14S.PersonalArt14Anulacion IS NULL)
              LEFT JOIN PersonalArt14 art14E ON art14E.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14E.PersonalId = objd.ObjetivoAsistenciaMesPersonalId   AND art14E.PersonalArt14FormaArt14 = 'E' AND art14E.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') >= art14E.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14E.PersonalArt14AutorizadoHasta OR art14E.PersonalArt14AutorizadoHasta IS NULL) AND  ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14E.PersonalArt14Anulacion   OR art14E.PersonalArt14Anulacion IS NULL)
              LEFT JOIN PersonalArt14 art14H ON art14H.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14H.PersonalId = objd.ObjetivoAsistenciaMesPersonalId   AND art14H.PersonalArt14FormaArt14 = 'H' AND art14H.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') >= art14H.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14H.PersonalArt14AutorizadoHasta OR art14H.PersonalArt14AutorizadoHasta IS NULL) AND  ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14H.PersonalArt14Anulacion   OR art14H.PersonalArt14Anulacion IS NULL)
              LEFT JOIN PersonalArt14 art14A ON art14A.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14A.PersonalId = objd.ObjetivoAsistenciaMesPersonalId   AND art14A.PersonalArt14FormaArt14 = 'A' AND art14A.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') >= art14A.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14A.PersonalArt14AutorizadoHasta OR art14A.PersonalArt14AutorizadoHasta IS NULL) AND  ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14A.PersonalArt14Anulacion   OR art14A.PersonalArt14Anulacion IS NULL)
              
              LEFT JOIN ValorLiquidacion valart14cat ON valart14cat.ValorLiquidacionSucursalId = suc.SucursalId AND valart14cat.ValorLiquidacionTipoAsociadoId = art14E.PersonalArt14TipoAsociadoId AND valart14cat.ValorLiquidacionCategoriaPersonalId = art14E.PersonalArt14CategoriaId AND 
              DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,1)BETWEEN 
              valart14cat.ValorLiquidacionDesde AND ISNULL(valart14cat.ValorLiquidacionHasta,'9999-12-31')
              
              LEFT JOIN CategoriaPersonal art14cat ON art14cat.TipoAsociadoId = art14E.PersonalArt14TipoAsociadoId AND art14cat.CategoriaPersonalId  = art14E.PersonalArt14CategoriaId 
              LEFT JOIN ObjetivoHabilitacion objhab ON objhab.ObjetivoHabilitacionObjetivoId = obj.ObjetivoId
              
              WHERE obja.ObjetivoAsistenciaAnoAno = @1 
              AND objm.ObjetivoAsistenciaAnoMesMes = @2
              ${listPersonaId}
              `,
      [, anio, mes]
    );

    return result
  }

  async getAsistenciaPorPersona(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const personalId = req.params.personalId;
      const anio = req.params.anio;
      const mes = req.params.mes;
      var desde = new Date(anio, mes - 1, 1);

      if (!this.hasGroup(req, 'liquidaciones') && await this.hasAuthPersona(res, anio, mes, personalId, queryRunner) == false)
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
      let personalId = []

      const auth = await this.hasAuthObjetivo(
        anio,
        mes,
        req,
        Number(objetivoId),
        dataSource
      );

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
                
                
                LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
                
                LEFT JOIN ValorLiquidacion val ON val.ValorLiquidacionSucursalId = suc.SucursalId AND val.ValorLiquidacionTipoAsociadoId = objd.ObjetivoAsistenciaTipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId AND 
                
                DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,1)BETWEEN 
                    val.ValorLiquidacionDesde AND ISNULL(val.ValorLiquidacionHasta,'9999-12-31')
                
                LEFT JOIN ObjetivoPersonalJerarquico opj ON opj.ObjetivoId = obj.ObjetivoId AND  DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'28')  BETWEEN opj.ObjetivoPersonalJerarquicoDesde  AND ISNULL(opj.ObjetivoPersonalJerarquicoHasta,'9999-12-31') AND opj.ObjetivoPersonalJerarquicoComo = 'J'
                LEFT JOIN Personal perjer ON perjer.PersonalId = opj.ObjetivoPersonalJerarquicoPersonalId
                
                LEFT JOIN PersonalArt14 art14S ON art14S.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14S.PersonalId = objd.ObjetivoAsistenciaMesPersonalId   AND art14S.PersonalArt14FormaArt14 = 'S' AND art14S.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') >= art14S.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14S.PersonalArt14AutorizadoHasta OR art14S.PersonalArt14AutorizadoHasta IS NULL) AND  ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14S.PersonalArt14Anulacion   OR art14S.PersonalArt14Anulacion IS NULL)
                LEFT JOIN PersonalArt14 art14E ON art14E.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14E.PersonalId = objd.ObjetivoAsistenciaMesPersonalId   AND art14E.PersonalArt14FormaArt14 = 'E' AND art14E.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') >= art14E.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14E.PersonalArt14AutorizadoHasta OR art14E.PersonalArt14AutorizadoHasta IS NULL) AND  ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14E.PersonalArt14Anulacion   OR art14E.PersonalArt14Anulacion IS NULL)
                LEFT JOIN PersonalArt14 art14H ON art14H.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14H.PersonalId = objd.ObjetivoAsistenciaMesPersonalId   AND art14H.PersonalArt14FormaArt14 = 'H' AND art14H.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') >= art14H.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14H.PersonalArt14AutorizadoHasta OR art14H.PersonalArt14AutorizadoHasta IS NULL) AND  ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14H.PersonalArt14Anulacion   OR art14H.PersonalArt14Anulacion IS NULL)
                LEFT JOIN PersonalArt14 art14A ON art14A.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14A.PersonalId = objd.ObjetivoAsistenciaMesPersonalId   AND art14A.PersonalArt14FormaArt14 = 'A' AND art14A.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') >= art14A.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14A.PersonalArt14AutorizadoHasta OR art14A.PersonalArt14AutorizadoHasta IS NULL) AND  ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14A.PersonalArt14Anulacion   OR art14A.PersonalArt14Anulacion IS NULL)
                
                LEFT JOIN ValorLiquidacion valart14cat ON valart14cat.ValorLiquidacionSucursalId = suc.SucursalId AND valart14cat.ValorLiquidacionTipoAsociadoId = art14E.PersonalArt14TipoAsociadoId AND valart14cat.ValorLiquidacionCategoriaPersonalId = art14E.PersonalArt14CategoriaId AND 
                DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,1)BETWEEN 
                valart14cat.ValorLiquidacionDesde AND ISNULL(valart14cat.ValorLiquidacionHasta,'9999-12-31')
                
                LEFT JOIN CategoriaPersonal art14cat ON art14cat.TipoAsociadoId = art14E.PersonalArt14TipoAsociadoId AND art14cat.CategoriaPersonalId  = art14E.PersonalArt14CategoriaId 
                LEFT JOIN ObjetivoHabilitacion objhab ON objhab.ObjetivoHabilitacionObjetivoId = obj.ObjetivoId
                
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
    try {
      const objetivoId = req.params.objetivoId;
      const anio = req.params.anio;
      const mes = req.params.mes;
      var desde = new Date(anio, mes - 1, 1);

      const auth = await this.hasAuthObjetivo(
        anio,
        mes,
        req,
        Number(objetivoId),
        dataSource
      );

      const result = await dataSource.query(
        `SELECT suc.SucursalId, obja.ObjetivoAsistenciaAnoAno, objm.ObjetivoAsistenciaAnoMesMes, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(persona.PersonalApellido),', ',TRIM(persona.PersonalNombre)) PersonaDes,
                persona.PersonalId,
                obj.ObjetivoId, 
                CONCAT(obj.ClienteId,'/', ISNULL(obj.ClienteElementoDependienteId,0)) AS ObjetivoCodigo,
                obj.ObjetivoDescripcion,
                CONCAT (TRIM(perjer.PersonalApellido),', ',TRIM(perjer.PersonalNombre)) AS CoordinadorZonaDes, 
                perjer.PersonalNombre AS NombreCoordinadorZona, 
                perjer.PersonalApellido AS ApellidoCoordinadorZona,
                objd.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras,
                cat.CategoriaPersonalDescripcion,
                val.ValorLiquidacionHoraNormal,
                -- CAST (objd.ObjetivoAsistenciaAnoMesPersonalDiasTotalGral AS FLOAT) AS HorasMensuales,
                --CAST (objd.ObjetivoAsistenciaAnoMesPersonalDiasTotalGral AS FLOAT)*val.ValorLiquidacionHoraNormal AS HorasMensualesImporte,
                
                objd.ObjetivoAsistenciaTipoAsociadoId,
                objd.ObjetivoAsistenciaCategoriaPersonalId,
                
                
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
                ) / CAST(60 AS FLOAT)) AS totalhorascalc ,
                
                
                
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
                ) / CAST(60 AS FLOAT) + ISNULL(art14H.PersonalArt14Horas,0)) * (COALESCE (valart14cat.ValorLiquidacionHoraNormal, val.ValorLiquidacionHoraNormal)+ISNULL(art14A.PersonalArt14AdicionalHora,0)) + ISNULL(art14S.PersonalArt14SumaFija,0)
                AS totalminutoscalcimporteconart14,
                art14S.PersonalArt14SumaFija,
                art14H.PersonalArt14Horas,
                art14A.PersonalArt14AdicionalHora,
                art14E.PersonalArt14TipoAsociadoId,
                art14E.PersonalArt14CategoriaId,
                val.ValorLiquidacionHoraNormal AS ValorHoraNorm,
                art14cat.CategoriaPersonalDescripcion as art14CategoriaDescripcion,
                valart14cat.ValorLiquidacionHoraNormal AS ValorHoraArt14Categoria,
                
                -- ISNULL(CAST(Substring(objd.ObjetivoAsistenciaAnoMesPersonalDiasTotalGral, 1,CHARINDEX('.', objd.ObjetivoAsistenciaAnoMesPersonalDiasTotalGral)-1) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDiasTotalGral),2) AS INT),0) as MinutosMensuales,
                
                objhab.ObjetivoHabilitacionVigenteDesde, objhab.ObjetivoHabilitacionVigenteHasta,
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
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
                
                
                LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
                
                LEFT JOIN ValorLiquidacion val ON val.ValorLiquidacionSucursalId = suc.SucursalId AND val.ValorLiquidacionTipoAsociadoId = objd.ObjetivoAsistenciaTipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId AND 
                
                DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,1)BETWEEN 
                    val.ValorLiquidacionDesde AND ISNULL(val.ValorLiquidacionHasta,'9999-12-31')
                
                LEFT JOIN ObjetivoPersonalJerarquico opj ON opj.ObjetivoId = obj.ObjetivoId AND  DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'28')  BETWEEN opj.ObjetivoPersonalJerarquicoDesde  AND ISNULL(opj.ObjetivoPersonalJerarquicoHasta,'9999-12-31') AND opj.ObjetivoPersonalJerarquicoComo = 'J'
                LEFT JOIN Personal perjer ON perjer.PersonalId = opj.ObjetivoPersonalJerarquicoPersonalId
                
                LEFT JOIN PersonalArt14 art14S ON art14S.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14S.PersonalId = objd.ObjetivoAsistenciaMesPersonalId   AND art14S.PersonalArt14FormaArt14 = 'S' AND art14S.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') >= art14S.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14S.PersonalArt14AutorizadoHasta OR art14S.PersonalArt14AutorizadoHasta IS NULL) AND  ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14S.PersonalArt14Anulacion   OR art14S.PersonalArt14Anulacion IS NULL)
                LEFT JOIN PersonalArt14 art14E ON art14E.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14E.PersonalId = objd.ObjetivoAsistenciaMesPersonalId   AND art14E.PersonalArt14FormaArt14 = 'E' AND art14E.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') >= art14E.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14E.PersonalArt14AutorizadoHasta OR art14E.PersonalArt14AutorizadoHasta IS NULL) AND  ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14E.PersonalArt14Anulacion   OR art14E.PersonalArt14Anulacion IS NULL)
                LEFT JOIN PersonalArt14 art14H ON art14H.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14H.PersonalId = objd.ObjetivoAsistenciaMesPersonalId   AND art14H.PersonalArt14FormaArt14 = 'H' AND art14H.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') >= art14H.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14H.PersonalArt14AutorizadoHasta OR art14H.PersonalArt14AutorizadoHasta IS NULL) AND  ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14H.PersonalArt14Anulacion   OR art14H.PersonalArt14Anulacion IS NULL)
                LEFT JOIN PersonalArt14 art14A ON art14A.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14A.PersonalId = objd.ObjetivoAsistenciaMesPersonalId   AND art14A.PersonalArt14FormaArt14 = 'A' AND art14A.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') >= art14A.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14A.PersonalArt14AutorizadoHasta OR art14A.PersonalArt14AutorizadoHasta IS NULL) AND  ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14A.PersonalArt14Anulacion   OR art14A.PersonalArt14Anulacion IS NULL)
                
                LEFT JOIN ValorLiquidacion valart14cat ON valart14cat.ValorLiquidacionSucursalId = suc.SucursalId AND valart14cat.ValorLiquidacionTipoAsociadoId = art14E.PersonalArt14TipoAsociadoId AND valart14cat.ValorLiquidacionCategoriaPersonalId = art14E.PersonalArt14CategoriaId AND 
                DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,1)BETWEEN 
                valart14cat.ValorLiquidacionDesde AND ISNULL(valart14cat.ValorLiquidacionHasta,'9999-12-31')
                
                LEFT JOIN CategoriaPersonal art14cat ON art14cat.TipoAsociadoId = art14E.PersonalArt14TipoAsociadoId AND art14cat.CategoriaPersonalId  = art14E.PersonalArt14CategoriaId 
                LEFT JOIN ObjetivoHabilitacion objhab ON objhab.ObjetivoHabilitacionObjetivoId = obj.ObjetivoId
                
                WHERE obja.ObjetivoAsistenciaAnoAno = @1 
                AND objm.ObjetivoAsistenciaAnoMesMes = @2 
                AND obj.ObjetivoId = @0 

                `,
        [objetivoId, anio, mes]
      );

      const totalImporte = result.map(row => row.totalminutoscalcimporteconart14).reduce((prev, curr) => prev + curr, 0)
      const totalHoras = result.map(row => row.totalhorascalc).reduce((prev, curr) => prev + curr, 0)


      this.jsonRes({ asistencia: result, totalImporte, totalHoras }, res);

    } catch (error) {
      // if (queryRunner.isTransactionActive)
      //await queryRunner.rollbackTransaction()
      return next(error)
    }
  }

  async getMetodologia(req: any, res: Response, next: NextFunction) {
    const recordSet = new Array();
    recordSet.push({
      id: "S",
      descripcion: "Monto fijo a sumar",
      etiqueta: "Imp. Adicional",
    });
    recordSet.push({
      id: "E",
      descripcion: "Equivalencia de categoría",
      etiqueta: "Equivalencia",
    });
    recordSet.push({
      id: "A",
      descripcion: "Monto adicional por hora",
      etiqueta: "Imp. Adicional Hora",
    });
    recordSet.push({
      id: "H",
      descripcion: "Se suman a las cargadas",
      etiqueta: "Horas adicionales",
    });

    this.jsonRes(recordSet, res);
  }
}
