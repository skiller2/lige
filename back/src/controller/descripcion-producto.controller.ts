import { BaseController } from "./baseController";
import { dataSource } from "../data-source";
import { NextFunction, Response } from "express";
import { Request } from "express-serve-static-core";
import { ParsedQs } from "qs";

export class DescripcionProductoController extends BaseController {

  async getAllProductos(res: Response, req: Request, next:NextFunction) {
    try {
      const result = await dataSource.query(
        'SELECT cod_tipo_producto as TipoProductoId ,des_tipo_producto as TipoProductoDescripcion, cod_tipo_producto as value, des_tipo_producto as label  FROM  lige.dbo.lpv_tipo_producto '
      )
      this.jsonRes(result, res)
    }
    catch (error) {
      return next(error)
    }
  }
}