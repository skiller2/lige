import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import {
  filtrosToSql,
  getOptionsFromRequest,
  isOptions,
  orderToSQL,
} from "../impuestos-afip/filtros-utils/filtros";


export class TipoDocumentoController extends BaseController {

  listaTipoDocumento: any[] = [
    {
      id: "id",
      name: "id",
      field: "id",
      fieldName: "id",
      type: "number",
      sortable: true,
      hidden: false
    },
    {
      name: "Detalle",
      type: "detalle",
      id: "detalle",
      field: "detalle",
      fieldName: "tipo.detalle",
      hidden: false,
      searchHidden:false
    },
    {
      name: "Apellido Nombre",
      type: "string",
      id: "PersonalApellidoNombre",
      field: "PersonalApellidoNombre",
      fieldName: " pers.PersonalApellidoNombre",
      searchType: "string",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Objetivo",
      type: "string",
      id: "ObjetivoDescripcion",
      field: "ObjetivoDescripcion",
      fieldName: "obj.ObjetivoDescripcion",
      searchType: "string",
      sortable: true,
      searchHidden: false
    },
    {
      name: "periodo",
      type: "periodo",
      id: "periodo",
      field: "periodo",
      fieldName: "periodo",
      hidden: false,
      searchHidden:false
    },
  ];

  async getGridCols(req, res) {
    this.jsonRes(this.listaTipoDocumento, res);
  }


  async getdocgenralListlist(filtros: any, sort: any) {
    const filterSql = filtrosToSql(filtros, this.listaTipoDocumento);
    const orderBy = orderToSQL(sort)
    const stmactual = new Date()

    return dataSource.query(
      `
      SELECT doc_id AS id, 
      tipo.detalle, 
      fecha, 
      pers.PersonalApellidoNombre,
      obj.ObjetivoDescripcion,  
      CONCAT(RTRIM(per.mes), '-', RTRIM(per.anio)) AS periodo
      FROM lige.dbo.docgeneral AS docgeneral 
      LEFT JOIN lige.dbo.doctipo AS tipo ON docgeneral.doctipo_id = tipo.doctipo_id
      LEFT JOIN Personal AS pers ON docgeneral.persona_id = pers.PersonalId 
      LEFT JOIN Objetivo AS obj ON docgeneral.objetivo_id = obj.ObjetivoId 
      LEFT JOIN lige.dbo.liqmaperiodo AS per ON docgeneral.periodo = per.periodo_id WHERE ${filterSql} ${orderBy}
    `)
  }

  async getdocgenralList(
    req: any,
    res: Response, next: NextFunction
  ) {
    const filterSql = filtrosToSql(req.body.options.filtros, this.listaTipoDocumento);
    const orderBy = orderToSQL(req.body.options.sort)


    try {
      const TipoDocumentos = await this.getdocgenralListlist(req.body.options.filtros, req.body.options.sort)
      console.log("movimientosPendientes " +  TipoDocumentos.length)
      this.jsonRes(
        {
          total: TipoDocumentos.length,
          list: TipoDocumentos,
        },
        res
      );

    } catch (error) {
      return next(error)
    }
  }
}
