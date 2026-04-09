import type { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/base.controller.ts";
import { dataSource } from "../data-source.ts";
import { filtrosToSql, isOptions, orderToSQL, getOptionsSINO } from "../impuestos-afip/filtros-utils/filtros.ts";


export class ValorHoraController extends BaseController {
  

  listaColumnas: any[] = [
    {
      id: "id",
      name: "id",
      field: "id",
      fieldName: "vl.ValorLiquidacionId",
      type: "number",
      sortable: true,
      searchHidden: true,
      hidden: true
    }, {
      name: "Sucursal",
      type: "string",
      id: "SucursalDescripcion",
      field: "SucursalDescripcion",
      fieldName: "s.SucursalDescripcion",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Tipo Asociado",
      type: "string",
      id: "TipoAsociadoDescripcion",
      field: "TipoAsociadoDescripcion",
      fieldName: "ta.TipoAsociadoDescripcion",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Categoría",
      type: "string",
      id: "CategoriaPersonalDescripcion",
      field: "CategoriaPersonalDescripcion",
      fieldName: "cp.CategoriaPersonalDescripcion",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Importe",
      type: "currency",
      id: "ValorLiquidacionHoraNormal",
      field: "ValorLiquidacionHoraNormal",
      fieldName: "vl.ValorLiquidacionHoraNormal",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },

  ];

  async getValorHoraCols(req: Request, res: Response) {
    this.jsonRes(this.listaColumnas, res);
  }

  async getValorHoraData(req: Request, res: Response, next: NextFunction) {

     const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await this.getValorHoraQuery(queryRunner)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

  private async getValorHoraQuery(queryRunner: any) {
    return await queryRunner.query(`
        declare @0 int = 2026;
      declare @1 int = 3;

      select vl.ValorLiquidacionId, vl.ValorLiquidacionSucursalId, vl.ValorLiquidacionTipoAsociadoId, 
             ta.TipoAsociadoDescripcion, vl.ValorLiquidacionCategoriaPersonalId, vl.ValorLiquidacionHoraNormal, 
             cp.CategoriaPersonalDescripcion, s.SucursalDescripcion,
             vl.ValorLiquidacionDesde, vl.ValorLiquidacionHasta
      from ValorLiquidacion vl
      left join TipoAsociado ta on ta.TipoAsociadoId = vl.ValorLiquidacionTipoAsociadoId
      left join CategoriaPersonal cp on cp.CategoriaPersonalId = vl.ValorLiquidacionCategoriaPersonalId 
                                      and vl.ValorLiquidacionTipoAsociadoId = cp.TipoAsociadoId
      left join Sucursal s on s.SucursalId = vl.ValorLiquidacionSucursalId
      where vl.ValorLiquidacionDesde <= eomonth(datefromparts(@0,@1,1)) 
        and isnull(vl.ValorLiquidacionHasta, '9999-12-31') >= datefromparts(@0,@1,1);`)
  }
}

