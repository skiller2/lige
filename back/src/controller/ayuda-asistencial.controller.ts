import { NextFunction, Response } from "express";
import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";

const getOptions: any[] = [
    { label: 'Si', value: true },
    { label: 'No', value: false },
    { label: 'Indeterminado', value: null }
]

const columnsAyudaAsistencial: any[] = [
    {
      id: "cuit",
      name: "CUIT",
      field: "PersonalCUITCUILCUIT",
      type: "number",
      fieldName: "cuit.PersonalCUITCUILCUIT",
      sortable: true,
      searchHidden: false
    },
    {
      id: "apellidoNombre",
      name: "Apellido Nombre",
      field: "apellidoNombre",
      type: "string",
      fieldName: "per.PersonalId",
      searchComponent: "inpurformersonalSearch",
      searchType: "number",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      id: "personalId",
      name: "PersonalId",
      field: "personalId",
      type: "number",
      fieldName: "per.PersonalId",
      sortable: true,
      searchHidden: true,
      hidden: true,
    },
    // {
    //   id: "sitRevDescripcion",
    //   name: "SituacionRevistaDescripcion",
    //   field: "sitRevDescripcion",
    //   type: "string",
    //   fieldName: "sit.SituacionRevistaDescripcion",
    //   sortable: true,
    //   hidden: true,
    //   searchHidden: false
    // },
    {
      id: "PersonalPrestamoMonto",
      name: "Importe",
      field: "PersonalPrestamoMonto",
      type: "currency",
      fieldName: "pre.PersonalPrestamoMonto",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      id: "PersonalPrestamoDia",
      name: "Fecha Solicitud",
      field: "PersonalPrestamoDia",
      type: "date",
      fieldName: "pre.PersonalPrestamoDia",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      id: "PersonalPrestamoFechaAprobacion",
      name: "Fecha Aprobado",
      field: "PersonalPrestamoFechaAprobacion",
      type: "date",
      fieldName: "pre.PersonalPrestamoFechaAprobacion",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      id: "cantCuotas",
      name: "Cant Cuotas",
      type: "number",
      field: "PersonalPrestamoCantidadCuotas",
      fieldName: "pre.PersonalPrestamoCantidadCuotas",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      id: "tipo",
      name: "Tipo de Prestado",
      type: "string",
      field: "FormaPrestamoDescripcion",
      fieldName: "form.FormaPrestamoDescripcion",
      searchType: "string",
      sortable: true,
      searchHidden: false
    },
    {
      id: "tipoId",
      name: "TipoId",
      type: "number",
      field: "FormaPrestamoId",
      fieldName: "form.FormaPrestamoId",
      searchType: "number",
      sortable: true,
      searchHidden: false,
      hidden: true
    },
    {
      id: "liquidoFinanzas",
      name: "Liquido Finanzas",
      type: "boolean",
      field: "PersonalPrestamoLiquidoFinanzas",
      fieldName: "pre.PersonalPrestamoLiquidoFinanzas",
      formatter: 'collectionFormatter',
      params: { collection: getOptions, },
      searchType: "boolean",
      sortable: true,
      searchHidden: false
    },
    {
      id: "aplicaEl",
      name: "Aplica El",
      type: "string",
      field: "PersonalPrestamoAplicaEl",
      fieldName: "pre.PersonalPrestamoAplicaEl",
      searchType: "string",
      sortable: true,
      searchHidden: false
    },
    {
      name: "Grupo Número",
      type: "number",
      id: "GrupoActividadNumero",
      field: "GrupoActividadNumero",
      fieldName: "g.GrupoActividadNumero",
      sortable: true,
      searchHidden: false,
      hidden: true,
    },
];

export class AyudaAsistencialController extends BaseController {

  async listAyudaAsistencialQuery(queryRunner:any, filterSql:any, orderBy:any, anio:number, mes:number){
    return await queryRunner.query(`
      SELECT DISTINCT CONCAT(per.PersonalId, '-', pres.PersonalPrestamoId, '-', g.GrupoActividadId) id,
      TRIM(per.PersonalApellidoNombre) apellidoNombre, cuit.PersonalCUITCUILCUIT, pres.PersonalId, pres.PersonalPrestamoMonto,
      pres.PersonalPrestamoDia, pres.PersonalPrestamoFechaAprobacion, pres.PersonalPrestamoCantidadCuotas,
      pres.PersonalPrestamoAplicaEl, form.FormaPrestamoId, form.FormaPrestamoDescripcion, pres.PersonalPrestamoLiquidoFinanzas
      FROM PersonalPrestamo pres
      LEFT JOIN Personal per ON per.PersonalId = pres.PersonalId 
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = pres.PersonalId 
      LEFT JOIN FormaPrestamo form ON form.FormaPrestamoId = pres.FormaPrestamoId
      LEFT JOIN GrupoActividadPersonal ga ON ga.GrupoActividadPersonalPersonalId = per.PersonalId AND DATEFROMPARTS(@0,@1,28) > ga.GrupoActividadPersonalDesde AND DATEFROMPARTS(@0,@1,1) <  ISNULL(ga.GrupoActividadPersonalHasta, '9999-12-31')
      LEFT JOIN GrupoActividad g ON g.GrupoActividadId = ga.GrupoActividadId
      WHERE ((pres.PersonalPrestamoFechaProceso BETWEEN DATEFROMPARTS(@0, @1, 1) AND EOMONTH(DATEFROMPARTS(@0, @1, 1))) OR (pres.PersonalPrestamoAplicaEl IS NULL AND pres.PersonalPrestamoAprobado IS NULL))
      AND (${filterSql})
      ${orderBy}
    `,[anio, mes])
  }

  async getGridColumns(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(columnsAyudaAsistencial, res)
  }

  async getAyudaAsistencialList(req: any, res: Response, next: NextFunction) {
    const anio = req.body.anio
    const mes = req.body.mes
    const options: Options = isOptions(req.body.options)? req.body.options : { filtros: [], sort: null };
    // if (options.filtros.length == 0) { 
    //   return this.jsonRes([], res);
    // }
    const filterSql = filtrosToSql(options.filtros, columnsAyudaAsistencial);
    const orderBy = orderToSQL(options.sort)
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction()

      let list = await this.listAyudaAsistencialQuery(queryRunner, filterSql, orderBy, anio, mes)
      
      await queryRunner.commitTransaction()
      return this.jsonRes(list, res);
    }catch (error) {
        this.rollbackTransaction(queryRunner)
        return next(error)
    } finally {
        await queryRunner.release()
    }
  }
}