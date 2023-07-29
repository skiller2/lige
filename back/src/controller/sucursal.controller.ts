import { BaseController } from "./baseController";
import { dataSource } from "../data-source";
import { NextFunction, Response } from "express";
import { Request } from "express-serve-static-core";
import { ParsedQs } from "qs";

export class SucursalController extends BaseController {

  async getAllSucursales(res: Response, req: Request, next:NextFunction) {
    try {
      const result = await dataSource.query(
        'SELECT SucursalId, SucursalDescripcion FROM Sucursal '
      )




      this.jsonRes(result, res)
    }
    catch (error) {
      next(error)
    }
    /*
        const result = await this.connection.query(
          'EXEC procedures.MyProcedure @0', [someParam]
        );
        */
    // ... do something with the result
  }
}
