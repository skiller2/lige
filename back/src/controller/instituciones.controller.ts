import { NextFunction, Response } from "express";
import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";
import { QueryRunner } from "typeorm";
import { FileUploadController } from "./file-upload.controller"

const listaColumnas: any[] = [
  {
    id: "id",
    name: "id",
    field: "id",
    fieldName: "id",
    type: "number",
    sortable: false,
    hidden: true,
    searchHidden: true
  },
  {
    name: "Centro de Capacitación",
    type: "number",
    id: "CentroCapacitacionId",
    field: "CentroCapacitacionId",
    fieldName: "cencap.CentroCapacitacionId",
    searchComponent:"inpurForCentroCapacitacionSearch",
    sortable: true,
    hidden: true,
    searchHidden: false
  },
  {
    name: "Nombre",
    type: "string",
    id: "CentroCapacitacionRazonSocial",
    field: "CentroCapacitacionRazonSocial",
    fieldName: "cencap.CentroCapacitacionRazonSocial",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    name: "CUIT",
    type: "string",
    id: "CentroCapacitacionCuit",
    field: "CentroCapacitacionCuit",
    fieldName: "cencap.CentroCapacitacionCuit",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    name: "Activo",
    type: "boolean",
    id: "CentroCapacitacionInactivo",
    field: "CentroCapacitacionInactivo",
    fieldName: "cencap.CentroCapacitacionInactivo",
    searchComponent: "inpurForInactivoBoolean",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    name: "Sede ID",
    type: "number",
    id: "CentroCapacitacionSedeId",
    field: "CentroCapacitacionSedeId",
    fieldName: "sede.CentroCapacitacionSedeId",
    sortable: true,
    hidden: true,
    searchHidden: true
  },
  {
    name: "Descripción de Sede",
    type: "string",
    id: "CentroCapacitacionSedeDescripcion",
    field: "CentroCapacitacionSedeDescripcion",
    fieldName: "sede.CentroCapacitacionSedeDescripcion",
    sortable: true,
    hidden: true,
    searchHidden: true
  }
];

export class InstitucionesController extends BaseController {


  async getGridCols(req, res) {
    this.jsonRes(listaColumnas, res);
  }

  async list(req: any, res: Response, next: NextFunction) {

    const filterSql = filtrosToSql(req.body.options.filtros, listaColumnas);
    const orderBy = orderToSQL(req.body.options.sort)
    const queryRunner = dataSource.createQueryRunner();
    const fechaActual = new Date()
    const anio = fechaActual.getFullYear()
    const mes = fechaActual.getMonth() + 1

    try {
      const instituciones = await queryRunner.query(
        `SELECT 
          ROW_NUMBER() OVER (ORDER BY cencap.CentroCapacitacionId) as id,
          cencap.CentroCapacitacionId

        ,cencap.CentroCapacitacionRazonSocial
        ,cencap.CentroCapacitacionCuit
        ,cencap.CentroCapacitacionInactivo

        ,sede.CentroCapacitacionSedeId
        ,sede.CentroCapacitacionSedeDescripcion

        FROM CentroCapacitacion cencap
        LEFT JOIN CentroCapacitacionSede sede ON sede.CentroCapacitacionId=cencap.CentroCapacitacionId
        WHERE ${filterSql} ${orderBy}`
      )

      this.jsonRes(
        {
          total: instituciones.length,
          list: instituciones,
        },
        res
      );

    } catch (error) {
      return next(error)
    }

  }

}