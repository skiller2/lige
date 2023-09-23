import { BaseController, ClientException } from "../../controller/baseController";
import { dataSource } from "../../data-source";
import { QueryFailedError } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { ParsedQs } from "qs";
import { Utils } from "../liquidaciones.utils";


export class IngresoArticulo42Controller extends BaseController {

 
  async procesaCambios(req: any, res: Response, next: NextFunction) {
    let fechaActual = new Date()
    let anio = Number(req.body.anio)
    let mes = Number(req.body.mes)
    let ip = this.getRemoteAddress(req)
    let usuario = res.locals.userName
    const tipo_movimiento_id = Number(process.env.MOV_ART42)
    const queryRunner = dataSource.createQueryRunner();

    try {
      if (tipo_movimiento_id == 0 || Number.isNaN(tipo_movimiento_id))
        throw new ClientException("Tipo de monvimiento 'MOV_ART42' no definindo en .env ")


      if (anio < 2000)
        throw new ClientException(`Año ${anio} no válido `)

      if (mes > 12 || mes < 1)
        throw new ClientException(`Mes ${mes} no válido `)





      await queryRunner.connect();
      await queryRunner.startTransaction();

      const result = []

      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, anio, mes, usuario, ip)

      let movimiento_id = await Utils.getMovimientoId(queryRunner)

      for (const row of result) {
        const detalle = `Horas ${row.totalhorascalc}, Categoría ${((row.rt14CategoriaDescripcion != undefined) ? row.rt14CategoriaDescripcion : row.CategoriaPersonalDescripcion).trim()}  `
        await queryRunner.query(
          `INSERT INTO lige.dbo.liqmamovimientos (movimiento_id, periodo_id, tipo_movimiento_id, fecha, detalle, objetivo_id, persona_id, importe,
             aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
              VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13)
                     `,
          [
            ++movimiento_id,
            periodo_id,
            tipo_movimiento_id,
            fechaActual,
            detalle,
            row.ObjetivoId,
            row.PersonalId,
            row.totalminutoscalcimporteconart14,
            usuario, ip, fechaActual, usuario, ip, fechaActual,
          ]
        );
      }

      await queryRunner.commitTransaction();
      this.jsonRes({ list: [] }, res, `Se procesaron ${result.length} registros `);
    } catch (error) {
      if (queryRunner.isTransactionActive)
        await queryRunner.rollbackTransaction();
      return next(error)
    } finally {
      //   await queryRunner.release();
    }
  }
}
