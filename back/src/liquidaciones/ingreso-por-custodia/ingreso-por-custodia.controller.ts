import { BaseController, ClientException } from "../../controller/basecontroller.ts";
import { dataSource } from "../../data-source.ts";
import type { NextFunction, Request, Response } from "express";
import { Utils } from "../liquidaciones.utils.ts";
import { recibosController } from "../../controller/controller.module.ts";
import { CustodiaController } from "../../controller/custodia.controller.ts";


export class IngresoPorCustodiaController extends BaseController {


  async procesaCambios(req: any, res: Response, next: NextFunction) {
    let fechaActual = new Date()
    let anio = Number(req.body.anio)
    let mes = Number(req.body.mes)
    let ip = this.getRemoteAddress(req)
    let usuario = res.locals.userName
    const tipo_movimiento_id = Number(process.env.MOV_ASISTENCIA_CUSTODIA)
    const queryRunner = dataSource.createQueryRunner();

    try {

      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, anio, mes, usuario, ip)

      const getRecibosGenerados = await recibosController.getRecibosGenerados(queryRunner, periodo_id)

      if (getRecibosGenerados[0].ind_recibos_generados == 1)
          throw new ClientException(`Los recibos para este periodo ya se generaron`)

      if (tipo_movimiento_id == 0 || Number.isNaN(tipo_movimiento_id))
        throw new ClientException("Tipo de monvimiento 'MOV_ASISTENCIA_CUSTODIA' no definindo en .env ")


      if (anio < 2000)
        throw new ClientException(`Año ${anio} no válido `)

      if (mes > 12 || mes < 1)
        throw new ClientException(`Mes ${mes} no válido `)



      const resPendLiq = await CustodiaController.listCustodiasPendientesLiqui(anio,mes,3)
      if (resPendLiq.length > 0) {
        const FechaLimite = resPendLiq[0].FechaLimite
       throw new ClientException(`Existen ${resPendLiq.length} custodias pendientes con fecha de inicio anterior o igual al ${this.dateOutputFormat(FechaLimite)}`)
      }

      await queryRunner.connect();
      await queryRunner.startTransaction();

      const result = await CustodiaController.listPersonalCustodiaQuery({}, queryRunner, anio, mes,0)

      await queryRunner.query(
        `DELETE FROM lige.dbo.liqmamovimientos WHERE periodo_id=@0 AND tipo_movimiento_id=@1 `,[ periodo_id, tipo_movimiento_id ])

      let movimiento_id = await Utils.getMovimientoId(queryRunner)

      for (const row of result) {
        const detalle = `${row.tipo_importe} ${row.patente}`
        await queryRunner.query(
          `INSERT INTO lige.dbo.liqmamovimientos (movimiento_id, periodo_id, tipo_movimiento_id, fecha, detalle, objetivo_id, persona_id, custodia_id, importe,horas, tipo_asociado_id, categoria_personal_id,
             aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
              VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13,@14,@15,@16,@17)
                     `,
          [
            ++movimiento_id,
            periodo_id,
            tipo_movimiento_id,
            fechaActual,
            detalle,
            null,
            row.PersonalId,
            row.CustodiaCodigo,
            row.Importe,
            row.Horas, //horas
            0, //TipoAsociadoId,
            0, //CategoriaPersonalId,
            usuario, ip, fechaActual, usuario, ip, fechaActual,
          ]
        );
      }

      await queryRunner.commitTransaction();
      this.jsonRes({ list: [] }, res, `Se procesaron ${result.length} registros `);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      //   await queryRunner.release();
    }
  }
}
