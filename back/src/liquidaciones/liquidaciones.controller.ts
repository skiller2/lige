import { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { QueryFailedError } from "typeorm";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";
import { ParsedQs } from "qs";

export class LiquidacionesController extends BaseController {
    async getTipoMovimiento(req: Request, res: Response, next: NextFunction) {
      try {

        const tipoMovimiento = await dataSource.query(
          `SELECT tipo.tipo_movimiento_id, tipo.des_movimiento, tipo.signo FROM lige.dbo.liqcotipomovimiento AS tipo`)
  
          this.jsonRes(
              {
                total: tipoMovimiento.length,
                list: tipoMovimiento,
              },
              res
            );
  
      } catch (error) {
        return next(error)
      }
    }
  
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
          searchHidden: true,
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
          searchHidden: false,
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
          fieldName: "li.objetivo_id",
          searchComponent: "inpurForObjetivoSearch",
          searchType: "number",
          sortable: true,
          searchHidden: false
        },
        {
          name: "Persona",
          type: "string",
          id: "ApellidoNombre",
          field: "ApellidoNombre",
          fieldName: "li.persona_id",
          searchComponent: "inpurForPersonalSearch",
          searchType: "number",
          sortable: true,
          searchHidden: false,
          hidden: false,
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

    const filterSql = filtrosToSql(req.body.options.filtros, this.listaColumnas);
    const orderBy = orderToSQL(req.body.options.sort)
    const anio = Number(req.body.anio)
    const mes = Number(req.body.mes)


    try {

      const liqudacion = await dataSource.query(
        `SELECT li.movimiento_id, li.movimiento_id AS id,CONCAT(per.mes,'/',per.anio) AS periodo,tipomo.des_movimiento,li.fecha,li.detalle,obj.ObjetivoDescripcion,CONCAT(TRIM(pers.PersonalApellido),', ', TRIM(pers.PersonalNombre)) AS ApellidoNombre,
        li.importe * tipomo.signo AS importe FROM lige.dbo.liqmamovimientos AS li 
        INNER JOIN lige.dbo.liqcotipomovimiento AS tipomo ON li.tipo_movimiento_id = tipomo.tipo_movimiento_id 
        INNER JOIN lige.dbo.liqmaperiodo AS per ON li.periodo_id = per.periodo_id 
        LEFT JOIN ERP_Produccion.dbo.Personal AS pers ON li.persona_id = pers.PersonalId
        LEFT JOIN ERP_Produccion.dbo.Objetivo AS obj ON li.objetivo_id = obj.ObjetivoId
        WHERE per.anio = @0 AND per.mes = @1 AND (${filterSql}) 
       ${orderBy}
        `,[anio,mes])

        this.jsonRes(
            {
              total: liqudacion.length,
              list: liqudacion,
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

