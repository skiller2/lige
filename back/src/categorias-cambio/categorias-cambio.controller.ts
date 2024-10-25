import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { QueryFailedError } from "typeorm";
import { filtrosToSql, getOptionsFromRequest } from "../impuestos-afip/filtros-utils/filtros";
import { NextFunction, Request, Response } from "express";
import { ParsedQs } from "qs";


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
    fieldName: "per.PersonalFechaIngreso",
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
    options: any
  ) {
    const filtros = options.filtros;
    const filterSql = filtrosToSql(filtros,columnasGrilla);
    const fecha = options.extra?.fecProcesoCambio || new Date()

    return dataSource.query(
      `SELECT per.PersonalId, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) ApellidoNombre, per.PersonalFechaIngreso, 
        cat.CategoriaPersonalDescripcion, cat.TipoAsociadoId, cat.CategoriaPersonalId,
        rel.PersonalCategoriaDesde, rel.PersonalCategoriaHasta, 
        sit.SituacionRevistaDescripcion,
        DATEDIFF("m",per.PersonalFechaIngreso,@1) AS meses,
        DATEDIFF("m",per.PersonalFechaIngreso,@1)/12 AS anios,
        pas.CategoriaPersonalPasaAAnos, pas.CategoriaPersonalPasaAMeses,
        DATEADD(YEAR,ISNULL(pas.CategoriaPersonalPasaAAnos,0),DATEADD(MONTH,ISNULL(pas.CategoriaPersonalPasaAMeses,0),per.PersonalFechaIngreso)) fechaCambio,
        catpas.TipoAsociadoId TipoAsociadoIdCambio, catpas.CategoriaPersonalId CategoriaPersonalIdCambio,  catpas.CategoriaPersonalDescripcion CategoriaCambio,
        CONCAT(per.PersonalId,'-',cat.TipoAsociadoId) as id,
        1
        FROM Personal per
        JOIN PersonalCategoria rel ON rel.PersonalCategoriaPersonalId = per.PersonalId AND rel.PersonalCategoriaDesde <= @1 AND ISNULL(rel.PersonalCategoriaHasta,'9999-12-31') >= @1
        JOIN CategoriaPersonal cat ON cat.TipoAsociadoId = rel.PersonalCategoriaTipoAsociadoId AND cat.CategoriaPersonalId = rel.PersonalCategoriaCategoriaPersonalId
        JOIN CategoriaPersonalPasaA pas ON pas.TipoAsociadoId = cat.TipoAsociadoId AND pas.CategoriaPersonalId = cat.CategoriaPersonalId AND (pas.CategoriaPersonalPasaAAnos>0 OR pas.CategoriaPersonalPasaAMeses >0) AND @1 >=  pas.CategoriaPersonalPasaADesde AND  @1 <= ISNULL(pas.CategoriaPersonalPasaAHasta,'9999-12-31')
        JOIN CategoriaPersonal catpas ON catpas.TipoAsociadoId = pas.TipoAsociadoId AND catpas.CategoriaPersonalId = pas.CategoriaPersonalPasaACategoriaPersonalId
        
        
        LEFT JOIN PersonalSituacionRevista sitrev ON sitrev.PersonalId = per.PersonalId AND @1 >=  sitrev.PersonalSituacionRevistaDesde AND  @1 <= ISNULL(sitrev.PersonalSituacionRevistaHasta,'9999-12-31')
        LEFT JOIN SituacionRevista sit ON sit.SituacionRevistaId = sitrev.PersonalSituacionRevistaSituacionId
        
        WHERE 
          1=1
          
          AND DATEDIFF("m",per.PersonalFechaIngreso,@1) >= ISNULL(pas.CategoriaPersonalPasaAMeses,0) 
          AND DATEDIFF("m",per.PersonalFechaIngreso,@1)/12 >= ISNULL(pas.CategoriaPersonalPasaAAnos,0)
          AND sit.SituacionRevistaId  IN (2,4,5,6,9,10,11,12,20,23,26)
          AND DATEADD(YEAR,ISNULL(pas.CategoriaPersonalPasaAAnos,0),DATEADD(MONTH,ISNULL(pas.CategoriaPersonalPasaAMeses,0),per.PersonalFechaIngreso)) <= @1
          
          `,
      ['', fecha])

  }



  async getCambiosPendCategoria(
    req: any,
    res: Response,
    next:NextFunction
  ) {
    const options = getOptionsFromRequest(req);
    try {



      const pendCambioCategoria = await CategoriasController.listCambiosPendCategoria(options)
      this.jsonRes({ list: pendCambioCategoria }, res);
    } catch (error) {
      return next(error)
    }
  }

  async procesaCambios(req: any, res: Response, next: NextFunction) {
    const options = {}

    const queryRunner = dataSource.createQueryRunner();
    let fechaActual = new Date()
    fechaActual.setHours(0, 0, 0, 0)

    let fechaAyer = new Date()
    fechaAyer.setDate(fechaAyer.getDate() - 1);
    fechaAyer.setHours(0, 0, 0, 0)

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

//            throw new ClientException("Ups")

      const pendientes = await CategoriasController.listCambiosPendCategoria(options)

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

      await queryRunner.commitTransaction();
      if (res)
        this.jsonRes({list:[] }, res, `Se procesaron ${pendientes.length} ascensos `);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release();
    }
  }
}
