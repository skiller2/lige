import { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { QueryFailedError } from "typeorm";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";

export class LiquidacionesController extends BaseController {

    listaColumnas: any[] = [
        {
          id: "MovimientoId",
          name: "Movimiento",
          field: "MovimientoId",
          fieldName: "movimiento_id",
          type: "number",
          sortable: true,
          searchHidden: true,
          hidden: true
        },
        {
          name: "Periodo",
          type: "date",
          id: "periodo",
          field: "periodo",
          fieldName: "periodo",
          sortable: true,
          searchHidden: false,
          hidden: false,
        },
        {
          name: "Tipo Movimiento",
          type: "string",
          id: "des_movimiento",
          field: "des_movimiento",
          fieldName: "tipomo.des_movimiento",
          sortable: true,
          hidden: false,
          searchHidden: false
        },
        {
         name: "Fecha",
          type: "date",
          id: "fecha",
          field: "fecha",
          fieldName: "fecha",
          sortable: true,
          searchHidden: true,
          hidden: false,
        },
        {
          name: "Detalle",
          type: "string",
          id: "detalle",
          field: "detalle",
          fieldName: "detalle",
          sortable: true,
          hidden: false,
          searchHidden: false
        },
        {
          name: "Objetivo",
          type: "string",
          id: "ObjetivoDescripcion",
          field: "ObjetivoDescripcion",
          fieldName: "obj.ObjetivoDescripcion",
          sortable: true,
          hidden: false,
          searchHidden: false
        },
        {
          name: "Persona",
          type: "string",
          id: "PersonalApellidoNombre",
          field: "PersonalApellidoNombre",
          fieldName: "pers.PersonalApellidoNombre",
          sortable: true,
          hidden: false,
          searchHidden: false
        },
        {
          name: "Importe",
          type: "currency",
          id: "importe",
          field: "importe",
          fieldName: "importe",
          sortable: true,
          searchHidden: false,
          hidden: false,
        },
    
      ];


  async getByLiquidaciones(
    req: any,
    res: Response, next: NextFunction
  ) {

    try {

      const adelantos = await dataSource.query(
        `SELECT movimiento_id, movimiento_id AS id,CONCAT(per.mes,'/',per.anio) AS periodo,tipomo.des_movimiento,fecha,detalle,obj.ObjetivoDescripcion,pers.PersonalApellidoNombre,
        importe FROM lige.dbo.liqmamovimientos AS li 
        INNER JOIN lige.dbo.liqcotipomovimiento AS tipomo ON li.tipo_movimiento_id = tipomo.tipo_movimiento_id 
        INNER JOIN lige.dbo.liqmaperiodo AS per ON li.periodo_id = per.periodo_id 
        INNER JOIN ERP_Produccion.dbo.Personal AS pers ON li.persona_id = pers.PersonalId
        INNER JOIN ERP_Produccion.dbo.Objetivo AS obj ON li.objetivo_id = obj.ObjetivoId`)

        this.jsonRes(
            {
              total: adelantos.length,
              list: adelantos,
            },
            res
          );

    } catch (error) {
      return next(error)
    }
  }

  async getLiquidacionesCols(req: Request, res: Response) {
    this.jsonRes(this.listaColumnas, res);
  }
}

