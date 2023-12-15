import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { QueryFailedError } from "typeorm";
import { filtrosToSql, getOptionsFromRequest } from "../impuestos-afip/filtros-utils/filtros";
import { NextFunction, Request, Response } from "express";
import { ParsedQs } from "qs";
import { AsistenciaController } from "src/controller/asistencia.controller";
import { exit } from "process";

const columnasGrilla: any[] = [
  {
    id: "SucursalDescripcion",
    name: "Descripción Sucursal",
    field: "SucursalDescripcion",
    fieldName: "suc.SucursalDescripcion",
    type: "string",
    sortable: true,
    hidden: false
  },
  {
    name: "Sucursal",
    type: "number",
    id: "SucursalId",
    field: "SucursalId",
    fieldName: "suc.SucursalId",
    searchComponent:"inpurForSucursalSearch",

    hidden: true,
    searchHidden:false
  },
  {
    name: "Identificación Objetivo",
    type: "number",
    id: "ObjetivoId",
    field: "ObjetivoId",
    fieldName: "obj.ObjetivoId",
    sortable: true,
    hidden: true
  },
  {
    name: "Descripción Objetivo",
    type: "string",
    id: "ObjetivoDescripcion",
    field: "ObjetivoDescripcion",
    fieldName: "obj.ObjetivoDescripcion",
    sortable: true,
  },
  {
    name: "Código Objetivo",
    type: "string",
    id: "codObjetivo",
    field: "codObjetivo",
    fieldName: "CONCAT(obj.ClienteId,'/' ,ISNULL(obj.ClienteElementoDependienteId,0))",
    sortable: true,
  },
  {
    name: "Grupo Objetivo",
    type: "string",
    id: "GrupoActividadDetalle",
    field: "GrupoActividadDetalle",
    fieldName: "ga.GrupoActividadDetalle",
    sortable: true,
    searchHidden: true,
    hidden: false,
  },
  {
    name: "Grupo Objetivo ",
    type: "number",
    id: "GrupoActividadId",
    field: "GrupoActividadId",
    fieldName: "ga.GrupoActividadId",
    searchComponent: "inpurForGrupoPersonaSearch",
    sortable: true,
    searchHidden: false,
    hidden: true,
  },
  // {
  //   name: "Grupo Objetivo ID",
  //   type: "number",
  //   id: "GrupoActividadId",
  //   field: "GrupoActividadId",
  //   fieldName: "GrupoActividadId",
  //   sortable: true,
  //   hidden: true
  // },

  {
    name: "Horas cargadas",
    type: "number",
    id: "AsistenciaHoras",
    field: "AsistenciaHoras",
    fieldName: "AsistenciaHoras",
    sortable: true,
    hidden: false
  },
  {
    name: "Contrato Desde",
    type: "date",
    id: "ContratoFechaDesde",
    field: "ContratoFechaDesde",
    fieldName: "ContratoFechaDesde",
    sortable: true,
    hidden: false
  },
  {
    name: "Contrato Hasta",
    type: "date",
    id: "ContratoFechaHasta",
    field: "ContratoFechaHasta",
    fieldName: "ContratoFechaHasta",
    sortable: true,
    hidden: false
  },
  
];


export class ObjetivosPendasisController extends BaseController {
  async getGridCols(req, res) {
    this.jsonRes(columnasGrilla, res);
  }

  static async listObjetivosPendAsis(
    options: any
  ) {
    const filtros = options.filtros;
    const filterSql = filtrosToSql(filtros,columnasGrilla);

    const anio:number = filtros.filter((x: { index: string; }) => x.index === "anio")[0]?.valor;
    const mes:number = filtros.filter((x: { index: string; }) => x.index === "mes")[0]?.valor;

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();


    //const result = await AsistenciaController.getObjetivoAsistencia(anio,mes,[filterSql],queryRunner)


    return queryRunner.query(
      `SELECT DISTINCT suc.SucursalId, 
      suc.SucursalDescripcion,
      obj.ObjetivoId, obj.ClienteId, obj.ClienteElementoDependienteId, obj.ObjetivoDescripcion,
      
      CONCAT(obj.ClienteId,'/' ,ISNULL(obj.ClienteElementoDependienteId,0)) as codObjetivo,
      CONCAT(obj.ClienteId,'/' ,ISNULL(obj.ClienteElementoDependienteId,0)) as id, 
      
      obja.ObjetivoAsistenciaAnoAno, objm.ObjetivoAsistenciaAnoMesMes,
      
      -- CONCAT(TRIM(perjer.PersonalApellido),', ',TRIM(perjer.PersonalNombre)) AS ApellidoNombreObjJ,
      
		ga.GrupoActividadId, ga.GrupoActividadNumero, ga.GrupoActividadDetalle,
		gap.GrupoActividadObjetivoDesde, gap.GrupoActividadObjetivoHasta,

      
      objasissub.sumtotalhorascalc AS AsistenciaHoras,
      
      eledepcon.ClienteElementoDependienteContratoFechaDesde,  eledepcon.ClienteElementoDependienteContratoFechaHasta, eledepcon.ClienteElementoDependienteContratoFechaFinalizacion,
      clicon.ClienteContratoFechaDesde, clicon.ClienteContratoFechaHasta, clicon.ClienteContratoFechaFinalizacion,
      
      objm.ObjetivoAsistenciaAnoMesHasta,
      
      ISNULL(eledepcon.ClienteElementoDependienteContratoFechaDesde,clicon.ClienteContratoFechaDesde) as ContratoFechaDesde ,  
	    ISNULL(eledepcon.ClienteElementoDependienteContratoFechaHasta,clicon.ClienteContratoFechaHasta) as  ContratoFechaHasta ,
	  
      
      
      1
      
      FROM Objetivo obj 
      
      LEFT JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoId = obj.ObjetivoId AND obja.ObjetivoAsistenciaAnoAno = @1
      LEFT JOIN ObjetivoAsistenciaAnoMes objm ON objm.ObjetivoAsistenciaAnoId  = obja.ObjetivoAsistenciaAnoId AND  objm.ObjetivoId = obja.ObjetivoId AND objm.ObjetivoAsistenciaAnoMesMes = @2
      LEFT JOIN ObjetivoAsistenciaAnoMesPersonalDias objd ON objd.ObjetivoId = obj.ObjetivoId AND objd.ObjetivoAsistenciaAnoMesId = objm.ObjetivoAsistenciaAnoMesId AND objd.ObjetivoAsistenciaAnoId = objm.ObjetivoAsistenciaAnoId
      
      
      LEFT JOIN ( SELECT objd.ObjetivoId, objd.ObjetivoAsistenciaAnoMesId, objd.ObjetivoAsistenciaAnoId,
      
      SUM(      IIF(val.ValorLiquidacionHorasTrabajoHoraNormal>1,val.ValorLiquidacionHorasTrabajoHoraNormal,((
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
      ) / CAST(60 AS FLOAT))) ) AS sumtotalhorascalc
      
            FROM ObjetivoAsistenciaAnoMesPersonalDias objd
      JOIN ObjetivoAsistenciaAnoMes objm ON objm.ObjetivoAsistenciaAnoMesId = objd.ObjetivoAsistenciaAnoMesId AND objm.ObjetivoAsistenciaAnoId = objd.ObjetivoAsistenciaAnoId AND objm.ObjetivoId = objd.ObjetivoId
      JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objm.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objm.ObjetivoId
      JOIN Objetivo obj ON obj.ObjetivoId = obja.ObjetivoId
      -- JOIN Personal persona ON persona.PersonalId = objd.ObjetivoAsistenciaMesPersonalId
      -- LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = persona.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = persona.PersonalId) 
      -- JOIN CategoriaPersonal cat ON cat.CategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId AND cat.TipoAsociadoId=objd.ObjetivoAsistenciaTipoAsociadoId
      
      LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
      LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
      
      -- aca3
      LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
      LEFT JOIN ValorLiquidacion val ON val.ValorLiquidacionSucursalId = suc.SucursalId AND val.ValorLiquidacionTipoAsociadoId = objd.ObjetivoAsistenciaTipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId AND 

      DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,1)BETWEEN 
          val.ValorLiquidacionDesde AND ISNULL(val.ValorLiquidacionHasta,'9999-12-31')

		 
      GROUP BY objd.ObjetivoId, objd.ObjetivoAsistenciaAnoMesId, objd.ObjetivoAsistenciaAnoId
      
      ) objasissub ON objasissub.ObjetivoId = obj.ObjetivoId AND objasissub.ObjetivoAsistenciaAnoMesId = objm.ObjetivoAsistenciaAnoMesId AND objasissub.ObjetivoAsistenciaAnoId = objm.ObjetivoAsistenciaAnoId
      
      
      
      LEFT JOIN Personal persona ON persona.PersonalId = objd.ObjetivoAsistenciaMesPersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = persona.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = persona.PersonalId) 
      
      
      
      
      
      LEFT JOIN GrupoActividadObjetivo gap ON gap.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND  DATEFROMPARTS(@1,@2,'28')  BETWEEN gap.GrupoActividadObjetivoDesde  AND ISNULL(gap.GrupoActividadObjetivoHasta,'9999-12-31') 
      LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId
      
      
      
      LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
      LEFT JOIN ClienteElementoDependienteContrato eledepcon ON eledepcon.ClienteId = obj.ClienteId AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledepcon.ClienteElementoDependienteContratoId = eledep.ClienteElementoDependienteContratoUltNro
      
      LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId 
      LEFT JOIN ClienteContrato clicon ON clicon.ClienteId = obj.ClienteId AND clicon.ClienteContratoId = cli.ClienteContratoUltNro AND obj.ClienteElementoDependienteId IS NULL 
      
      LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(eledep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
       
      WHERE 
      (objd.ObjetivoId IS NULL OR objm.ObjetivoAsistenciaAnoMesHasta IS NULL) AND
             ( (clicon.ClienteContratoFechaDesde <= DATETIMEFROMPARTS ( @1, @2, 28, 0, 0, 0, 0 )  
       AND ISNULL(clicon.ClienteContratoFechaHasta,'9999-12-31') >= DATETIMEFROMPARTS ( @1, @2, 1, 0, 0, 0, 0 ) AND ISNULL(clicon.ClienteContratoFechaFinalizacion,'9999-12-31') >= DATETIMEFROMPARTS ( @1, @2, 1, 0, 0, 0, 0 ) ) OR (
          eledepcon.ClienteElementoDependienteContratoFechaDesde <= DATETIMEFROMPARTS ( @1, @2, 28, 0, 0, 0, 0 ) AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaHasta,'9999-12-31') >= DATETIMEFROMPARTS ( @1, @2, 1, 0, 0, 0, 0 ) AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaFinalizacion,'9999-12-31') >= DATETIMEFROMPARTS ( @1, @2, 1, 0, 0, 0, 0 )) 
            
            )

     AND (${filterSql})
      `,
      [,anio,mes])

  }



  async getObjetivosPendAsis(
    req: any,
    res: Response,
    next:NextFunction
  ) {
    const options = getOptionsFromRequest(req);
    try {
      const pendCambioCategoria = await ObjetivosPendasisController.listObjetivosPendAsis(options)
      this.jsonRes({ list: pendCambioCategoria }, res);
    } catch (error) {
      return next(error)
    }
  }

  async procesaCambios(req: any, res: Response) {
    const options = {}

    const queryRunner = dataSource.createQueryRunner();
    const fechaActual = new Date()
    let fechaAyer = new Date()
    fechaAyer.setDate(fechaAyer.getDate() - 1);

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const pendientes = await ObjetivosPendasisController.listObjetivosPendAsis(options)

      for (const persona of pendientes) {

        if (persona.fechaCambio > fechaActual) continue

        const catactual = await queryRunner.query(
          `
        SELECT per.PersonalCategoriaUltNro as max, cat.TipoJornadaId, cat.SucursalId, cat.SucursalAreaId
        FROM Personal per
        JOIN PersonalCategoria cat ON cat.PersonalCategoriaTipoAsociadoId=@1 AND cat.PersonalCategoriaPersonalId=per.PersonalId AND ISNULL(cat.PersonalCategoriaHasta, '9999-12-31') >= @3 AND  cat.PersonalCategoriaDesde <= @3 
        WHERE per.PersonalId = @0`,
          [persona.PersonalId, persona.TipoAsociadoIdCambio, '', fechaActual
          ]
        )


        

        if (catactual.length == 0) continue
        const PersonalCategoriaUltNro = catactual[0].max + 1;


        console.log('resultado', PersonalCategoriaUltNro, catactual[0].max)
        
        const TipoJornadaId = catactual[0].TipoJornadaId
        const SucursalId = catactual[0].SucursalId
        const SucursalAreaId = catactual[0].SucursalAreaId

        await queryRunner.query(
          `UPDATE Personal SET PersonalCategoriaUltNro=@1 WHERE PersonalId=@0 `,
          [
            persona.PersonalId,
            PersonalCategoriaUltNro,
          ]
        );

        await queryRunner.query(
          `
          UPDATE PersonalCategoria SET PersonalCategoriaHasta =@0 WHERE PersonalCategoriaTipoAsociadoId=@1 AND PersonalCategoriaPersonalId=@2 AND ISNULL(PersonalCategoriaHasta,'9999-12-31') >= @3 AND  PersonalCategoriaDesde <= @3 `,
          [
            fechaAyer,
            persona.TipoAsociadoIdCambio,
            persona.PersonalId,
            fechaActual,
          ]
        );

        await queryRunner.query(
          `INSERT INTO PersonalCategoria (PersonalCategoriaId, PersonalCategoriaPersonalId, PersonalCategoriaTipoAsociadoId, PersonalCategoriaCategoriaPersonalId, PersonalCategoriaDesde, PersonalCategoriaHasta, TipoJornadaId, SucursalId, SucursalAreaId)
             VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8)
                    `,
          [
            PersonalCategoriaUltNro,
            persona.PersonalId,
            persona.TipoAsociadoIdCambio,
            persona.CategoriaPersonalIdCambio,
            fechaActual,
            null,
            TipoJornadaId,
            SucursalId,
            SucursalAreaId,
          ]
        );

      }

      await queryRunner.commitTransaction();
      return `Se procesaron ${pendientes.length} ascensos `
    } catch (error) {
      if (queryRunner.isTransactionActive)
        await queryRunner.rollbackTransaction();
      throw error
    } finally {
      await queryRunner.release();
    }
  }
}
