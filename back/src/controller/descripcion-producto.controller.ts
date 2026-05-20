import { BaseController } from "./base.controller.ts";
import { getConnection } from "../data-source.ts";
import type { Request, NextFunction, Response } from "express";


export class DescripcionProductoController extends BaseController {

  async getAllProductos(res: Response, req: Request, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);

    try {
      const result = await queryRunner.query(
        'SELECT ProductoTipoCodigo as TipoProductoId ,Descripcion as TipoProductoDescripcion, ProductoTipoCodigo as value, Descripcion as label  FROM  ProductoTipo'
      )
      this.jsonRes(result, res)
    }
    catch (error) {
      return next(error)
    } finally {
      await queryRunner.release();
    }
  }
}