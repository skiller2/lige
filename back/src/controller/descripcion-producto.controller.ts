import { BaseController } from "./basecontroller.ts";
import { dataSource } from "../data-source.ts";
import { NextFunction, Response } from "express";
import { Request } from "express-serve-static-core";
import { ParsedQs } from "qs";

export class DescripcionProductoController extends BaseController {

  async getAllProductos(res: Response, req: Request, next:NextFunction) {
    try {
      const result = await dataSource.query(
        'SELECT ProductoTipoCodigo as TipoProductoId ,Descripcion as TipoProductoDescripcion, ProductoTipoCodigo as value, Descripcion as label  FROM  ProductoTipo'
      )
      this.jsonRes(result, res)
    }
    catch (error) {
      return next(error)
    }
  }
}