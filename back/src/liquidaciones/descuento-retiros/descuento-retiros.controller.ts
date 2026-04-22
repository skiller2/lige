import { BaseController, ClientException } from "../../controller/base.controller.ts";
import { dataSource } from "../../data-source.ts";
import type { NextFunction, Request, Response } from "express";


export class DescuentoRetirosController extends BaseController {

 
  async procesaCambios(req: any, res: Response, next: NextFunction) {
    const options = {}

    const queryRunner = dataSource.createQueryRunner();
    let fechaActual = new Date()
    fechaActual.setHours(0, 0, 0, 0)
    let cantRegistros = 0

    try {
      throw new ClientException(`No implementado`)
      this.jsonRes({ list: {} }, res, (`Se procesaron ${cantRegistros} registros`));
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
        return next(`Se procesaron cambios `)
    //   await queryRunner.release();
    }
  }
}
