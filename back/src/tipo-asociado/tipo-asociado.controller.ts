import { BaseController, ClientException, ClientWarning } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import type { NextFunction, Request, Response } from "express";
import { filtrosToSql, getOptionsFromRequest, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros.ts";
import type { Options } from "../schemas/filtro.ts";

const listaColumnas: any[] = [
  {
    id: 'id',
    name: 'id',
    field: 'id',
    type: 'number',
    fieldName: 'TipoAsociadoId',
    searchType: 'number',
    sortable: true,
    hidden: true,
    searchHidden: true
  },
  {
    id: 'TipoAsociadoDescripcion',
    name: 'Descripcion',
    field: 'TipoAsociadoDescripcion',
    type: 'string',
    fieldName: 'TipoAsociadoDescripcion',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'TipoAsociadoAsigna ',
    name: 'Asigna ',
    field: 'TipoAsociadoAsigna ',
    fieldName: 'TipoAsociadoAsigna ',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
  {
    id: 'TipoAsociadoTieneAsistencia',
    name: 'Tiene Asistencia',
    field: 'TipoAsociadoTieneAsistencia',
    fieldName: 'TipoAsociadoTieneAsistencia',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
];

export class TipoAsociadoController extends BaseController {

  async getGridCols(req, res) {
    this.jsonRes(listaColumnas, res);
  }

  async list(req: any, res: Response, next: NextFunction) {
    const filterSql = filtrosToSql(req.body.options.filtros, listaColumnas);
    const orderBy = orderToSQL(req.body.options.sort)
    const queryRunner = await getConnection(res.locals.userName);


    try {
      const objetivos = await queryRunner.query(
          `SELECT TipoAsociadoId AS id, TipoAsociadoDescripcion, TipoAsociadoAsigna, TipoAsociadoTieneAsistencia
          FROM TipoAsociado
          WHERE ${filterSql} ${orderBy}`)

      this.jsonRes(
        {
          total: objetivos.length,
          list: objetivos,
        },
        res
      );

    } catch (error) {
        return next(error)
    } finally {
        await queryRunner.release();
    }

}
}