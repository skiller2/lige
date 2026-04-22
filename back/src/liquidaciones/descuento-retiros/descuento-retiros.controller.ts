import { BaseController, ClientException } from "../../controller/base.controller.ts";
import { dataSource } from "../../data-source.ts";
import type { NextFunction, Request, Response } from "express";
import { Utils } from "../liquidaciones.utils.ts";
import { recibosController } from "../../controller/controller.module.ts";


type GroupedResult = {
  ObjetivoPersonalJerarquicoPersonalId: number;
  ObjetivoId: number;
  ClienteId: number;
  ClienteElementoDependienteId: number;
  totalImporte: number;
};


export class DescuentoRetirosController extends BaseController {

  groupAndSum(
    data: any[]
  ): GroupedResult[] {

    const grouped = data.reduce<Record<string, GroupedResult>>(
      (acc, item) => {

        const key = [
          item.ObjetivoPersonalJerarquicoPersonalId,
          item.ObjetivoId,
          item.ClienteId,
          item.ClienteElementoDependienteId
        ].join('|');

        if (!acc[key]) {
          acc[key] = {
            ObjetivoPersonalJerarquicoPersonalId:
              item.ObjetivoPersonalJerarquicoPersonalId,
            ObjetivoId: item.ObjetivoId,              
            ClienteId: item.ClienteId,
            ClienteElementoDependienteId:
              item.ClienteElementoDependienteId,
            totalImporte: 0
          };
        }

        acc[key].totalImporte +=
            item.PersonalArt14SumaFija +  
            (item.totalhorascalc + item.PersonalArt14Horas)   * ((item.ValorHoraArt14Categoria | item.ValorHoraNorm) + item.PersonalArt14AdicionalHora);

        return acc;
      },
      {}
    );

    return Object.values(grouped);
  }


  async procesaCambios(req: any, res: Response, next: NextFunction) {
    const options = {}

    const queryRunner = dataSource.createQueryRunner();
    const anio = Number(req.body.anio)
    const mes = Number(req.body.mes)
    const ip = this.getRemoteAddress(req)
    const usuario = res.locals.userName


    let fechaActual = new Date()
    fechaActual.setHours(0, 0, 0, 0)
    let cantRegistros = 0
    const tipo_movimiento_id = 29

    try {
      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, anio, mes, usuario, ip)

      const getRecibosGenerados = await recibosController.getRecibosGenerados(queryRunner, periodo_id)

      //      if (getRecibosGenerados[0].ind_recibos_generados == 1)
      //        throw new ClientException(`Los recibos para este periodo ya se generaron`)


      await queryRunner.query(
        `DELETE FROM lige.dbo.liqmamovimientos WHERE periodo_id=@0 AND tipo_movimiento_id=@1 `, [periodo_id, tipo_movimiento_id])



      const retiros = await queryRunner.query(
        `      SELECT  suc.SucursalId, 
		obja.ObjetivoAsistenciaAnoAno, 
		objm.ObjetivoAsistenciaAnoMesMes, 
		-- cuit.PersonalCUITCUILCUIT, 
		-- CONCAT(TRIM(persona.PersonalApellido),', ',TRIM(persona.PersonalNombre)) PersonaDes,
      -- persona.PersonalId,
      obj.ObjetivoId, 
      CONCAT(obj.ClienteId,'/', ISNULL(obj.ClienteElementoDependienteId,0)) AS ObjetivoCodigo,
      obj.ClienteId,
      obj.ClienteElementoDependienteId,
		-- clidep.ClienteElementoDependienteDescripcion,

--      ga.GrupoActividadId, ga.GrupoActividadNumero, ga.GrupoActividadDetalle,
--      gap.GrupoActividadObjetivoDesde, gap.GrupoActividadObjetivoHasta,
                      
      -- objd.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras,
      -- cat.CategoriaPersonalDescripcion,
      -- val.ValorLiquidacionHoraNormal,
      
      -- objd.ObjetivoAsistenciaTipoAsociadoId,
      -- objd.ObjetivoAsistenciaCategoriaPersonalId,
      -- oan.LugarHabilitacionIdList,
      
      (
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
      ) / CAST(60 AS FLOAT) AS totalhorascalc ,
      
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
      ) / CAST(60 AS FLOAT) + IIF(objd.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras='N',ISNULL(art14H.PersonalArt14Horas,0),0)) * (COALESCE (valart14cat.ValorLiquidacionHoraNormal, val.ValorLiquidacionHoraNormal)+ ISNULL(art14A.PersonalArt14AdicionalHora,0)) + 
		IIF(objd.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras='N',ISNULL(art14S.PersonalArt14SumaFija,0),0)
      AS totalminutoscalcimporteconart14,
      IIF(objd.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras='N',ISNULL(art14S.PersonalArt14SumaFija,0),0) AS PersonalArt14SumaFija,
      IIF(objd.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras='N',ISNULL(art14H.PersonalArt14Horas,0),0) AS PersonalArt14Horas,
      art14A.PersonalArt14AdicionalHora,
      art14E.PersonalArt14TipoAsociadoId,
      art14E.PersonalArt14CategoriaId,
      val.ValorLiquidacionHoraNormal AS ValorHoraNorm,
      art14cat.CategoriaPersonalDescripcion as art14CategoriaDescripcion,
      val.ValorLiquidacionHorasTrabajoHoraNormal,
      valart14cat.ValorLiquidacionHoraNormal AS ValorHoraArt14Categoria,
      
      -- ISNULL(CAST(Substring(objd.ObjetivoAsistenciaAnoMesPersonalDiasTotalGral, 1,CHARINDEX('.', objd.ObjetivoAsistenciaAnoMesPersonalDiasTotalGral)-1) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDiasTotalGral),2) AS INT),0) as MinutosMensuales,
      
--                objhab.ObjetivoHabilitacionVigenteDesde, objhab.ObjetivoHabilitacionVigenteHasta,
		coo.ObjetivoPersonalJerarquicoPersonalId,
      1 as last
      
      
      FROM ObjetivoAsistenciaAnoMesPersonalDias objd
      JOIN ObjetivoAsistenciaAnoMes objm ON objm.ObjetivoAsistenciaAnoMesId = objd.ObjetivoAsistenciaAnoMesId AND objm.ObjetivoAsistenciaAnoId = objd.ObjetivoAsistenciaAnoId AND objm.ObjetivoId = objd.ObjetivoId
      JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objm.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objm.ObjetivoId
      JOIN Objetivo obj ON obj.ObjetivoId = obja.ObjetivoId
      JOIN ObjetivoPersonalJerarquico coo ON coo.ObjetivoId = obj.ObjetivoId AND EOMONTH(DATEFROMPARTS(@1,@2,1)) > coo.ObjetivoPersonalJerarquicoDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(coo.ObjetivoPersonalJerarquicoHasta, '9999-12-31') AND coo.DescuentoRetiros = 1

      
      
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
      
--      LEFT JOIN GrupoActividadObjetivo gap ON gap.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND  DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'28')  BETWEEN gap.GrupoActividadObjetivoDesde AND ISNULL(gap.GrupoActividadObjetivoHasta,'9999-12-31')

--      LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId

      LEFT JOIN (
		SELECT art14SX.PersonalArt14ObjetivoId, art14SX.PersonalId, SUM(art14SX.PersonalArt14SumaFija) PersonalArt14SumaFija FROM 
			PersonalArt14 art14SX 
			WHERE art14SX.PersonalArt14FormaArt14 = 'S' AND art14SX.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(@1,@2,'01') >= art14SX.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(@1,@2,'02') <= ISNULL(art14SX.PersonalArt14AutorizadoHasta,'9999-12-31') ) AND  art14SX.PersonalArt14Anulacion IS NULL
			GROUP BY art14SX.PersonalArt14ObjetivoId, art14SX.PersonalId
		) art14s ON art14S.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14S.PersonalId = objd.ObjetivoAsistenciaMesPersonalId

      LEFT JOIN PersonalArt14 art14E ON art14E.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14E.PersonalId = objd.ObjetivoAsistenciaMesPersonalId   AND art14E.PersonalArt14FormaArt14 = 'E' AND art14E.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') >= art14E.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') <= ISNULL(art14E.PersonalArt14AutorizadoHasta,'9999-12-31') ) AND  art14E.PersonalArt14Anulacion IS NULL
      
		
		
      LEFT JOIN (
		SELECT art14SX.PersonalArt14ObjetivoId, art14SX.PersonalId, SUM(art14SX.PersonalArt14Horas) PersonalArt14Horas FROM 
			PersonalArt14 art14SX 
			WHERE art14SX.PersonalArt14FormaArt14 = 'H' AND art14SX.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(@1,@2,'01') >= art14SX.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(@1,@2,'02') <= ISNULL(art14SX.PersonalArt14AutorizadoHasta,'9999-12-31') ) AND  art14SX.PersonalArt14Anulacion IS NULL
			GROUP BY art14SX.PersonalArt14ObjetivoId, art14SX.PersonalId
		) art14H ON art14H.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14H.PersonalId = objd.ObjetivoAsistenciaMesPersonalId



      LEFT JOIN (
		SELECT art14SX.PersonalArt14ObjetivoId, art14SX.PersonalId, SUM(art14SX.PersonalArt14AdicionalHora) PersonalArt14AdicionalHora FROM 
			PersonalArt14 art14SX 
			WHERE art14SX.PersonalArt14FormaArt14 = 'A' AND art14SX.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(@1,@2,'01') >= art14SX.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(@1,@2,'02') <= ISNULL(art14SX.PersonalArt14AutorizadoHasta,'9999-12-31') ) AND  art14SX.PersonalArt14Anulacion IS NULL
			GROUP BY art14SX.PersonalArt14ObjetivoId, art14SX.PersonalId
		) art14A ON art14A.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14A.PersonalId = objd.ObjetivoAsistenciaMesPersonalId

      
      LEFT JOIN ValorLiquidacion valart14cat ON valart14cat.ValorLiquidacionSucursalId = suc.SucursalId AND valart14cat.ValorLiquidacionTipoAsociadoId = art14E.PersonalArt14TipoAsociadoId AND valart14cat.ValorLiquidacionCategoriaPersonalId = art14E.PersonalArt14CategoriaId AND 
      DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,1)BETWEEN 
      valart14cat.ValorLiquidacionDesde AND ISNULL(valart14cat.ValorLiquidacionHasta,'9999-12-31')
      
      LEFT JOIN CategoriaPersonal art14cat ON art14cat.TipoAsociadoId = art14E.PersonalArt14TipoAsociadoId AND art14cat.CategoriaPersonalId  = art14E.PersonalArt14CategoriaId 
--                LEFT JOIN ObjetivoHabilitacion objhab ON objhab.ObjetivoHabilitacionObjetivoId = obj.ObjetivoId
      
      LEFT JOIN (
		SELECT an.ObjetivoId, STRING_AGG(an.ObjetivoHabilitacionNecesariaLugarHabilitacionId,',') LugarHabilitacionIdList FROM ObjetivoHabilitacionNecesaria an
    WHERE an.ObjetivoHabilitacionNecesariaInactivo IS NULL OR an.ObjetivoHabilitacionNecesariaInactivo=0
    GROUP BY  an.ObjetivoId
		) oan ON oan.ObjetivoId = obj.ObjetivoId
      
      
      WHERE obja.ObjetivoAsistenciaAnoAno = @1 
      AND objm.ObjetivoAsistenciaAnoMesMes = @2
      AND objd.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras IN ('N','C','R')
`, [, anio, mes])


      const retirosxobj = this.groupAndSum(retiros)

//      throw new ClientException(`DEBUG`, retirosxobj)



      //Armar consulta de objetivos y sus importes totale de retiros.
      let movimiento_id = await Utils.getMovimientoId(queryRunner)




      for (const row of retirosxobj) {

        const PersonalId = row.ObjetivoPersonalJerarquicoPersonalId
        const ObjetivoId = row.ObjetivoId
        const totalImporte = row.totalImporte

        await queryRunner.query(
          `INSERT INTO lige.dbo.liqmamovimientos (movimiento_id, periodo_id, tipo_movimiento_id, tipocuenta_id, fecha, detalle, objetivo_id, persona_id, importe,
          aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
            VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14)
                  `,
          [
            ++movimiento_id,
            periodo_id,
            tipo_movimiento_id, //tipo_movimiento_id
            'C', //tipocuenta_id
            fechaActual,
            '',
            ObjetivoId,
            PersonalId,
            totalImporte,
            usuario, ip, fechaActual, usuario, ip, fechaActual,
          ]
        );
        cantRegistros++
      }





//      throw new ClientException(`Se procesaron ${cantRegistros} registros`)
      this.jsonRes({ list: {} }, res, (`Se procesaron ${cantRegistros} registros`));
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      return next(`Se procesaron cambios `)
      //   await queryRunner.release();
    }
  }
}
