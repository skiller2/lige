import { BaseController, ClientException } from "../../controller/base.controller.ts";
import { getConnection } from "../../data-source.ts";
import type  { NextFunction, Request, Response } from "express";

export class MovimientosAutomaticosController extends BaseController {

 
  async procesaCambios(req: any, res: Response, next: NextFunction) {
    const options = {}

    const queryRunner = await getConnection(res.locals.userName);
    let fechaActual = new Date()
    fechaActual.setHours(0, 0, 0, 0)

    let fechaAyer = new Date()
    fechaAyer.setDate(fechaAyer.getDate() - 1);
    fechaAyer.setHours(0, 0, 0, 0)

    try {
      return next(`Se procesaron cambios `)
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
       await queryRunner.release();
    }
  }
}
