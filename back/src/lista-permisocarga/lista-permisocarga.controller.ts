import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, getOptionsFromRequest } from "../impuestos-afip/filtros-utils/filtros";
import { NextFunction, Request, Response } from "express";
import { ObjetivoController } from "src/controller/objetivo.controller";

const columnasGrilla: any[] = [
  
  {
    name: "id",
    type: "number",
    id: "id",
    field: "id",
    fieldName: "id",
    hidden: true,
    searchHidden:true
  },
  {
    name: "Objetivo Código",
    type: "number",
    id: "ObjetivoCodigo",
    field: "ObjetivoCodigo",
    fieldName: "carg.objetivo_id",
    searchComponent: "inpurForObjetivoSearch",
    hidden: false,
    searchHidden:false
  },
  {
    name: "Objetivo Descripción",
    type: "string",
    id: "ClienteElementoDependienteDescripcion",
    field: "ClienteElementoDependienteDescripcion",
    fieldName: "carg.objetivo_id",
    searchComponent: "inpurForObjetivoSearch",
    hidden: false,
    searchHidden:false
  },
  {
    name: "Persona Descripción",
    type: "string",
    id: "PersonaDescripcion",
    field: "PersonaDescripcion",
    fieldName: "carg.persona_id",
    searchComponent: "inpurForPersonalSearch",
    hidden: false,
    searchHidden:false
  },
  {
    name: "Fecha de última modificación",
    type: "date",
    id: "Fechadeultimamodificación",
    field: "Fechadeultimamodificación",
    fieldName: "carg.aud_fecha_mod",
      searchComponent: "inpurForFechaSearch",
    hidden: false,
    searchHidden:false
  },
  {
    name: "CUIT",
    type: "number",
    id: "CUIT",
    field: "CUIT",
    fieldName: "carg.persona_id",
    searchComponent: "inpurForPersonalSearch",
    hidden: false,
    searchHidden:false
  },
];

export class ListaPermisoCargaController extends BaseController {


  async getGridCols(req, res) {
    this.jsonRes(columnasGrilla, res);
  }

  async list(
    req: any,
    res: Response,
    next:NextFunction
  ) {
   
    const filterSql = filtrosToSql(req.body.options.filtros, columnasGrilla);
    //const orderBy = orderToSQL(req.body.options.sort)
    // const anio = Number(req.body.anio)
    // const mes = Number(req.body.mes)


    try {

      const listPermisoCarga = await dataSource.query(
        `SELECT 
        ROW_NUMBER() OVER (ORDER BY carg.objetivo_id) AS id,
        objetivo_id AS ObjetivoCodigo,
        eledep.ClienteElementoDependienteDescripcion,
        per.PersonalApellidoNombre AS PersonaDescripcion ,
        cuit.personalCUITCUILCUIT AS CUIT ,
        aud_fecha_mod AS Fechadeultimamodificación
        FROM lige.dbo.percargadirecta carg
        JOIN Objetivo AS obj ON obj.ObjetivoId = carg.objetivo_id
        JOIN ClienteElementoDependiente eledep ON eledep.ElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
        JOIN personal AS per ON per.PersonalId = carg.persona_id
        JOIN personalCUITCUIL AS cuit ON cuit.PersonalId = carg.persona_id where (${filterSql}) `)

      this.jsonRes(
        {
          total: listPermisoCarga.length,
          list: listPermisoCarga,
        },
        res
      );

    } catch (error) {
      return next(error)
    }
  }

 

}
