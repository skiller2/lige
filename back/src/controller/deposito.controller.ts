import { BaseController } from "./base.controller.ts";
import { getConnection } from "../data-source.ts";
import type { NextFunction, Response, Request } from "express";

export class DepositoController extends BaseController {

  async getAllDepositos(res: Response, req: Request, next: NextFunction) {
    try {
      const queryRunner = await getConnection(res.locals.userName);
      const result = await queryRunner.query(
        `SELECT dep.DepositoId, dep.DepositoNombre, dep.DepositoSucursalId,
                TRIM(suc.SucursalDescripcion) AS DepositoSucursalDescripcion,
                dep.DepositoId AS value, dep.DepositoNombre AS label
         FROM Deposito dep
         LEFT JOIN Sucursal suc ON suc.SucursalId = dep.DepositoSucursalId`
      )
      this.jsonRes(result, res)
    }
    catch (error) {
      return next(error)
    }
  }
}
