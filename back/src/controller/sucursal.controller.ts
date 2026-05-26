import { BaseController } from "./base.controller.ts";
import { getConnection } from "../data-source.ts";
import type { NextFunction, Response } from "express";
import type { Request } from "express";
import type { QueryRunner } from "typeorm";

export class SucursalController extends BaseController {
  static async listSucursalesQuery(queryRunner: QueryRunner) {
    return await queryRunner.query(
      'SELECT SucursalId, SucursalDescripcion, SucursalId as value, SucursalDescripcion as label FROM Sucursal '
    )
  }

  async getAllSucursales(res: Response, req: Request, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);

    try {
      const result = await SucursalController.listSucursalesQuery(queryRunner)
      this.jsonRes(result, res)
    }
    catch (error) {
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }
}
