import { NextFunction, Response } from "express";
import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";

const columnsAyudaAsistencial: any[] = [
    {
      id: "cuit",
      name: "CUIT",
      field: "cuit",
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
      searchComponent: "inpurForPersonalSearch",
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
    {
      id: "sitRevDescripcion",
      name: "SituacionRevistaDescripcion",
      field: "sitRevDescripcion",
      type: "string",
      fieldName: "sit.SituacionRevistaDescripcion",
      sortable: true,
      hidden: true,
      searchHidden: false
    },
    {
      id: "personalPrestamoMonto",
      name: "Importe",
      field: "personalPrestamoMonto",
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
      field: "PersonalAdelantoCantidadCuotas",
      fieldName: "pc.PersonalAdelantoCantidadCuotas",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      id: "tipo",
      name: "Tipo de Prestado",
      type: "string",
      field: "FormaPrestamoId",
      fieldName: "pp.FormaPrestamoId",
      searchType: "number",
      sortable: true,
      searchHidden: false
    },
    {
      id: "liquidoFinanzas",
      name: "Liquido Finanzas",
      type: "string",
      field: "PersonalPrestamoLiquidoFinanzas",
      fieldName: "pp.PersonalPrestamoLiquidoFinanzas",
      searchType: "string",
      sortable: true,
      searchHidden: false
    },
    {
      id: "aplicaEl",
      name: "Aplica El",
      type: "string",
      field: "PersonalPrestamoAplicaEl",
      fieldName: "pp.PersonalPrestamoAplicaEl",
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

  async listAyudaAsistencialQuery(queryRunner:any, filterSql:any, orderBy:any, responsableId?:number){

  }

  async getGridColumns(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(columnsAyudaAsistencial, res)
  }

  async getAyudaAsistencialList(req: any, res: Response, next: NextFunction) {
    const anio = String(req.body.anio);
    const mes = String(req.body.mes);
    const options: Options = isOptions(req.body.options)? req.body.options : { filtros: [], sort: null };
    if (options.filtros.length == 0) { 
      return this.jsonRes([], res);
    }
    const filterSql = filtrosToSql(options.filtros, columnsAyudaAsistencial);
    const orderBy = orderToSQL(options.sort)
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction()

      let list = await this.listAyudaAsistencialQuery(queryRunner, filterSql, orderBy)

      await queryRunner.commitTransaction()
      return this.jsonRes(list, res, 'Carga Exitosa');
    }catch (error) {
        this.rollbackTransaction(queryRunner)
        return next(error)
    } finally {
        await queryRunner.release()
    }
  }
}