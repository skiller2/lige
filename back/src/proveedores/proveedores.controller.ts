import type { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import type { QueryRunner } from "typeorm";
import { filtrosToSql, isOptions, orderToSQL, getOptionsSINO } from "../impuestos-afip/filtros-utils/filtros.ts";
import type { Options } from "../schemas/filtro.ts";
import { logger } from "../logger/logger.ts";

const getInactivo: any[] = [
  { label: 'Si', value: '0' },
  { label: 'No', value: '1' },
]

const proveedorColumns: any[] = [
  {
    id: "id",
    name: "id",
    field: "id",
    fieldName: "ProveedorId",
    type: "number",
    sortable: false,
    hidden: true,
    searchHidden: true
  },
  {
    name: "Razón Social",
    type: "string",
    id: "ProveedorRazonSocial",
    field: "ProveedorRazonSocial",
    fieldName: "ProveedorRazonSocial",
    // searchComponent: "inputForClientSearch",
    // searchType: "number",
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    name: "CUIT",
    id: "CUIT",
    field: "CUIT",
    fieldName: "CUIT",
    type: "number",
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: "Domicilio",
    name: "Domicilio",
    field: "Domicilio",
    fieldName: "Domicilio",
    type: "string",
    sortable: true,
    searchHidden: true,
    hidden: false,
  },
  {
    name: "Contacto",
    id: "Contacto",
    field: "Contacto",
    fieldName: "",
    type: "string",
    sortable: true,
    searchHidden: true,
    hidden: false,
  },
  {
    name: "Activo",
    id: "ProveedorInactivo",
    field: "ProveedorInactivo",
    fieldName: "ProveedorInactivo",
    type: "string",
    formatter: 'collectionFormatter',
    params: { collection: getInactivo },
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
];

export class ProveedoresController extends BaseController {

  async getGridCols(req, res) {
    this.jsonRes(proveedorColumns, res);
  }

  async listProveedores(req: any, res: any, next: any) {
    const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null };
    const filterSql = filtrosToSql(options.filtros, proveedorColumns);
    const orderBy = orderToSQL(options.sort)
    const queryRunner = await getConnection(res.locals.userName);

    try {
      const proveedor = await queryRunner.query(
        `SELECT ProveedorId id, CONVERT(VARCHAR(1), ISNULL(ProveedorInactivo, 0)) ProveedorInactivo, ProveedorRazonSocial, CUIT
        FROM Proveedor
        WHERE ${filterSql} ${orderBy}`)

      this.jsonRes(proveedor, res);

    } catch (error) {
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

}