import { BaseController } from "./base.controller.ts";
import { dataSource } from "../data-source.ts";
import type { NextFunction, Response, Request } from "express";

export class DepositoController extends BaseController {

  async getAllDepositos(res: Response, req: Request, next: NextFunction) {
    try {
      const queryRunner = dataSource.createQueryRunner();
      const result = await queryRunner.query(
        'SELECT DepositoId, DepositoNombre, DepositoId as value, DepositoNombre as label FROM Deposito'
      )
      this.jsonRes(result, res)
    }
    catch (error) {
      return next(error)
    }
  }
}
