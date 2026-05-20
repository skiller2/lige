import type { QueryRunner } from "typeorm";
import { BaseController, ClientException } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import { filtrosToSql, getOptionsFromRequest } from "../impuestos-afip/filtros-utils/filtros.ts";
import type { NextFunction, Request, Response } from "express";


const columnasGrilla: any[] = [
  {
    id: "CUIT",
    name: "CUIT",
    field: "CUIT",
    fieldName: "cuit2.PersonalCUITCUILCUIT",
    type: "number",
    sortable: true,
  },
  {
    name: "Apellido Nombre",
    type: "string",
    id: "ApellidoNombre",
    field: "ApellidoNombre",
    fieldName: "ApellidoNombre",
    sortable: true,
    customTooltip: {
      useRegularTooltip: true, // note regular tooltip will try to find a "title" attribute in the cell formatter (it won't work without a cell formatter)
    },
  },
  {
    name: "Sit Revista",
    type: "string",
    id: "SituacionRevistaDescripcion",
    field: "SituacionRevistaDescripcion",
    fieldName: "sit.SituacionRevistaDescripcion",
    sortable: true,
    hidden: false
  },
  {
    name: "Fecha de Ingreso",
    type: "date",
    id: "PersonalFechaIngreso",
    field: "PersonalFechaIngreso",
    fieldName: "ing.PersonalFechaIngreso",
    sortable: true,
  },
  {
    name: "Categoría Actual",
    type: "string",
    id: "CategoriaPersonalDescripcion",
    field: "CategoriaPersonalDescripcion",
    fieldName: "cat.CategoriaPersonalDescripcion",
    sortable: true,
  },
  {
    name: "Categoría actual hasta",
    type: "date",
    id: "PersonalCategoriaHasta",
    field: "PersonalCategoriaHasta",
    fieldName: "rel.PersonalCategoriaHasta",
    sortable: true,
  },
  {
    name: "Meses desde",
    type: "number",
    id: "meses",
    field: "meses",
    fieldName: "meses",
    sortable: true,
    hidden: false
  },
  {
    name: "Años Desde",
    type: "number",
    id: "anios",
    field: "anios",
    fieldName: "anios",
    sortable: false,
    hidden: false
  },
  {
    name: "Fecha Cambio",
    type: "date",
    id: "fechaCambio",
    field: "fechaCambio",
    fieldName: "fechaCambio",
    hidden: false
  },
  {
    name: "Categoria Cambio",
    type: "string",
    id: "CategoriaCambio",
    field: "CategoriaCambio",
    fieldName: "CategoriaCambio",
    hidden: false
  },
];


export class CategoriasController extends BaseController {
  async getGridCols(req, res) {
    this.jsonRes(columnasGrilla, res);
  }

  static async listCambiosPendCategoria(
    res: Response,
    options: any,
    queryRunner: QueryRunner
  ) {
    const filtros = options.filtros;
    const filterSql = filtrosToSql(filtros, columnasGrilla);
    const fecha = options.extra?.fecProcesoCambio || new Date()
    return queryRunner.query(
      `SELECT per.PersonalId, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) ApellidoNombre, ing.PersonalFechaIngreso, 
        cat.CategoriaPersonalDescripcion, cat.TipoAsociadoId, cat.CategoriaPersonalId,
        rel.PersonalCategoriaDesde, rel.PersonalCategoriaHasta, 
        sit.SituacionRevistaDescripcion,
        DATEDIFF("m",ing.PersonalFechaIngreso,@1) AS meses,
        DATEDIFF("m",ing.PersonalFechaIngreso,@1)/12 AS anios,
        pas.CategoriaPersonalPasaAAnos, pas.CategoriaPersonalPasaAMeses,
        DATEADD(YEAR,ISNULL(pas.CategoriaPersonalPasaAAnos,0),DATEADD(MONTH,ISNULL(pas.CategoriaPersonalPasaAMeses,0),ing.PersonalFechaIngreso)) fechaCambio,
        catpas.TipoAsociadoId TipoAsociadoIdCambio, catpas.CategoriaPersonalId CategoriaPersonalIdCambio,  catpas.CategoriaPersonalDescripcion CategoriaCambio,
        CONCAT(per.PersonalId,'-',cat.TipoAsociadoId) as id,
        1
        FROM Personal per
        JOIN PersonalIngresoEgreso ing ON ing.PersonalId = per.PersonalId
        JOIN PersonalCategoria rel ON rel.PersonalCategoriaPersonalId = per.PersonalId AND rel.PersonalCategoriaDesde <= @1 AND ISNULL(rel.PersonalCategoriaHasta,'9999-12-31') >= @1
        JOIN CategoriaPersonal cat ON cat.TipoAsociadoId = rel.PersonalCategoriaTipoAsociadoId AND cat.CategoriaPersonalId = rel.PersonalCategoriaCategoriaPersonalId
        JOIN CategoriaPersonalPasaA pas ON pas.TipoAsociadoId = cat.TipoAsociadoId AND pas.CategoriaPersonalId = cat.CategoriaPersonalId AND (pas.CategoriaPersonalPasaAAnos>0 OR pas.CategoriaPersonalPasaAMeses >0) AND @1 >=  pas.CategoriaPersonalPasaADesde AND  @1 <= ISNULL(pas.CategoriaPersonalPasaAHasta,'9999-12-31')
        JOIN CategoriaPersonal catpas ON catpas.TipoAsociadoId = pas.TipoAsociadoId AND catpas.CategoriaPersonalId = pas.CategoriaPersonalPasaACategoriaPersonalId
        
        
        LEFT JOIN PersonalSituacionRevista sitrev ON sitrev.PersonalId = per.PersonalId AND @1 >=  sitrev.PersonalSituacionRevistaDesde AND  @1 <= ISNULL(sitrev.PersonalSituacionRevistaHasta,'9999-12-31')
        LEFT JOIN SituacionRevista sit ON sit.SituacionRevistaId = sitrev.PersonalSituacionRevistaSituacionId
        
        WHERE 
          1=1
          
          AND DATEDIFF("m",ing.PersonalFechaIngreso,@1) >= ISNULL(pas.CategoriaPersonalPasaAMeses,0) 
          AND DATEDIFF("m",ing.PersonalFechaIngreso,@1)/12 >= ISNULL(pas.CategoriaPersonalPasaAAnos,0)
          AND sit.SituacionRevistaId  IN (2,4,5,6,9,10,11,12,20,23,26)
          AND DATEADD(YEAR,ISNULL(pas.CategoriaPersonalPasaAAnos,0),DATEADD(MONTH,ISNULL(pas.CategoriaPersonalPasaAMeses,0),ing.PersonalFechaIngreso)) <= @1
          
          `,
      ['', fecha])

  }



  async getCambiosPendCategoria(
    req: any,
    res: Response,
    next: NextFunction
  ) {
    const queryRunner = await getConnection(res.locals.userName);
    const options = getOptionsFromRequest(req);
    try {



      const pendCambioCategoria = await CategoriasController.listCambiosPendCategoria(res,options,queryRunner)
      this.jsonRes({ list: pendCambioCategoria }, res);
    } catch (error) {
      return next(error)
    }
  }

  async jobCambioCategoria(req: any, res: Response, next: NextFunction) {
    const options = {}
    const usuario = this.getUser(res)
    const ip = this.getRemoteAddress(req)

    const queryRunner = await getConnection(usuario);
    const fechaActual = new Date()
    fechaActual.setHours(0, 0, 0, 0)
    const anio = fechaActual.getFullYear()
    const mes = fechaActual.getMonth() + 1

    const fechaAyer = new Date()
    fechaAyer.setDate(fechaAyer.getDate() - 1);
    fechaAyer.setHours(0, 0, 0, 0)

    let EventoLogCodigo = 0


    try {

      ({ EventoLogCodigo } = await this.eventoLogInicio(
        queryRunner,
        `Cambio Categoría`,
        { usuario, ip },
        usuario,
        ip,
        "JOB"
      ));

      
      await queryRunner.startTransaction();

      //            throw new ClientException("Ups")

      const pendientes = await CategoriasController.listCambiosPendCategoria(res,options,queryRunner)

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
            null,
            null,
          ]
        );

      }

      const actualizarAsistencia = await queryRunner.query(
        `
      SELECT DISTINCT obja.ObjetivoAsistenciaAnoAno, objm.ObjetivoAsistenciaAnoMesMes, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(persona.PersonalApellido),', ',TRIM(persona.PersonalNombre)) PersonaDes,
      persona.PersonalId,
      -- obj.ObjetivoId, 
      -- CONCAT(obj.ClienteId,'/', ISNULL(obj.ClienteElementoDependienteId,0)) AS ObjetivoCodigo,
      -- clidep.ClienteElementoDependienteDescripcion,

      objd.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras,
      
      objd.ObjetivoAsistenciaTipoAsociadoId,
      objd.ObjetivoAsistenciaCategoriaPersonalId,
      cat.CategoriaPersonalDescripcion,
      
      percat.PersonalCategoriaCategoriaPersonalId,
		  catdes.CategoriaPersonalDescripcion,
      objd.ObjetivoAsistenciaAnoMesId,
		  objd.ObjetivoAsistenciaAnoId,

      1 as last
      
      
      FROM ObjetivoAsistenciaAnoMesPersonalDias objd
      JOIN ObjetivoAsistenciaAnoMes objm ON objm.ObjetivoAsistenciaAnoMesId = objd.ObjetivoAsistenciaAnoMesId AND objm.ObjetivoAsistenciaAnoId = objd.ObjetivoAsistenciaAnoId AND objm.ObjetivoId = objd.ObjetivoId
      JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objm.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objm.ObjetivoId
      JOIN Objetivo obj ON obj.ObjetivoId = obja.ObjetivoId
      JOIN Personal persona ON persona.PersonalId = objd.ObjetivoAsistenciaMesPersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = persona.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = persona.PersonalId) 
      JOIN CategoriaPersonal cat ON cat.CategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId AND cat.TipoAsociadoId=objd.ObjetivoAsistenciaTipoAsociadoId
      
      LEFT JOIN PersonalCategoria percat ON percat.PersonalCategoriaTipoAsociadoId=objd.ObjetivoAsistenciaTipoAsociadoId AND percat.PersonalCategoriaPersonalId = persona.PersonalId AND percat.PersonalCategoriaDesde < DATEFROMPARTS(@1,@2,15) AND ISNULL(percat.PersonalCategoriaHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,15)
      
      LEFT JOIN CategoriaPersonal catdes ON catdes.CategoriaPersonalId = percat.PersonalCategoriaCategoriaPersonalId AND catdes.TipoAsociadoId=percat.PersonalCategoriaTipoAsociadoId
      
      
      LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
      LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
      WHERE obja.ObjetivoAsistenciaAnoAno = @1 
      AND objm.ObjetivoAsistenciaAnoMesMes = @2
AND objd.ObjetivoAsistenciaCategoriaPersonalId <> percat.PersonalCategoriaCategoriaPersonalId`,
        [,anio, mes]
      )

      for (const reg of actualizarAsistencia) {
        const CategoriaPersonalId= reg.PersonalCategoriaCategoriaPersonalId
        const PersonalId = reg.PersonalId
        const ObjetivoAsistenciaAnoId = reg.ObjetivoAsistenciaAnoId
        const ObjetivoAsistenciaAnoMesId = reg.ObjetivoAsistenciaAnoMesId
        const ObjetivoAsistenciaTipoAsociadoId = reg.ObjetivoAsistenciaTipoAsociadoId
        await queryRunner.query(`UPDATE ObjetivoAsistenciaAnoMesPersonalDias SET ObjetivoAsistenciaCategoriaPersonalId = @0 
          WHERE ObjetivoAsistenciaAnoId = @1 AND ObjetivoAsistenciaAnoMesId = @2 AND ObjetivoAsistenciaMesPersonalId = @3 AND ObjetivoAsistenciaTipoAsociadoId=@4`,
          [
            CategoriaPersonalId,
            ObjetivoAsistenciaAnoId,
            ObjetivoAsistenciaAnoMesId,
            PersonalId,
            ObjetivoAsistenciaTipoAsociadoId,
          ]
        )

        await queryRunner.query(`UPDATE ObjetivoAsistenciaAnoMesPersonalAsignado SET ObjetivoAsistenciaCategoriaPersonalId = @0 
          WHERE ObjetivoAsistenciaAnoId = @1 AND ObjetivoAsistenciaAnoMesId = @2 AND ObjetivoAsistenciaMesPersonalId = @3 AND ObjetivoAsistenciaTipoAsociadoId=@4`,
          [
            CategoriaPersonalId,
            ObjetivoAsistenciaAnoId,
            ObjetivoAsistenciaAnoMesId,
            PersonalId,
            ObjetivoAsistenciaTipoAsociadoId,
          ]
        )

        await queryRunner.query(`UPDATE ObjetivoAsistenciaMesDiasPersonal SET ObjetivoAsistenciaCategoriaPersonalId = @0 
          WHERE ObjetivoAsistenciaAnoId = @1 AND ObjetivoAsistenciaAnoMesId = @2 AND ObjetivoAsistenciaMesPersonalId = @3 AND ObjetivoAsistenciaTipoAsociadoId=@4`,
          [
            CategoriaPersonalId,
            ObjetivoAsistenciaAnoId,
            ObjetivoAsistenciaAnoMesId,
            PersonalId,
            ObjetivoAsistenciaTipoAsociadoId,
          ]
        )



      }


      await queryRunner.commitTransaction();

      const resp = `Se procesaron ${pendientes.length} ascensos, se actualizaron ${actualizarAsistencia.length} registros de asistencia`
      await this.eventoLogFin(
        queryRunner,
        EventoLogCodigo,
        'COM',
        {
          res: resp,
          pendientes,
          actualizarAsistencia
        },
        usuario,
        ip
      );

      if (res)
        this.jsonRes({ list: [] }, res, resp);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      await this.eventoLogFin(queryRunner,
        EventoLogCodigo,
        'ERR',
        { res: error },
        usuario,
        ip
      );

      return next(error)
    } finally {
      await queryRunner.release();
    }
  }
}
