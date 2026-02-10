import { BaseController, ClientException } from "../../controller/basecontroller.ts";
import { dataSource } from "../../data-source.ts";
import { QueryFailedError } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { ParsedQs } from "qs";


export class MovimientosAutomaticosController extends BaseController {

 
  async procesaCambios(req: any, res: Response, next: NextFunction) {
    const options = {}

    const queryRunner = dataSource.createQueryRunner();
    let fechaActual = new Date()
    fechaActual.setHours(0, 0, 0, 0)

    let fechaAyer = new Date()
    fechaAyer.setDate(fechaAyer.getDate() - 1);
    fechaAyer.setHours(0, 0, 0, 0)

    try {
      return next(`Se procesaron cambios `)
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
//      return next(error)
    return next(`Se procesaron cambios `)
    } finally {
        return next(`Se procesaron cambios `)
    //   await queryRunner.release();
    }
  }
}
