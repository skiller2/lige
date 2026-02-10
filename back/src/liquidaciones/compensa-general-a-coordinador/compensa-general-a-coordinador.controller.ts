import { BaseController, ClientException } from "../../controller/basecontroller.ts";
import { dataSource } from "../../data-source.ts";
import type { NextFunction, Request, Response } from "express";
import { Utils } from "../liquidaciones.utils.ts";
import { recibosController } from "../../controller/controller.module.ts";


export class CompensaGeneralACordinadorController extends BaseController {


  async procesaCambios(req: any, res: Response, next: NextFunction) {
    const fechaActual = new Date()
    const anio = Number(req.body.anio)
    const mes = Number(req.body.mes)
    const ip = this.getRemoteAddress(req)
    const usuario = res.locals.userName
    const queryRunner = dataSource.createQueryRunner();
    let cantRegistros = 0
    let movimientos = []
    try {

      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, anio, mes, usuario, ip)

      const getRecibosGenerados = await recibosController.getRecibosGenerados(queryRunner, periodo_id)

      //      if (getRecibosGenerados[0].ind_recibos_generados == 1)
      //        throw new ClientException(`Los recibos para este periodo ya se generaron`)



      if (anio < 2000)
        throw new ClientException(`Año ${anio} no válido `)

      if (mes > 12 || mes < 1)
        throw new ClientException(`Mes ${mes} no válido `)


      await queryRunner.connect();
      await queryRunner.startTransaction();

      const cuentasGnegativo = await queryRunner.query(
        `SELECT per.anio, per.mes, pers.PersonalId, mov.tipocuenta_id, SUM(mov.importe*tip.signo ) totalImporte, CONCAT(TRIM(pers.PersonalApellido),', ', TRIM(pers.PersonalNombre)) AS ApellidoNombre
      FROM lige.dbo.liqmamovimientos mov
      JOIN lige.dbo.liqmaperiodo per ON per.periodo_id = mov.periodo_id
      JOIN lige.dbo.liqcotipomovimiento tip ON tip.tipo_movimiento_id = mov.tipo_movimiento_id
      JOIN Personal pers ON pers.PersonalId = mov.persona_id
      WHERE per.anio = @1 AND per.mes=@2 AND mov.tipocuenta_id='G'
      GROUP BY per.anio, per.mes, pers.PersonalId, pers.PersonalApellido, pers.PersonalNombre, mov.tipocuenta_id
      HAVING SUM(mov.importe*tip.signo )  < 0
      `, [, anio, mes])

      let movimiento_id = await Utils.getMovimientoId(queryRunner)

      for (const row of cuentasGnegativo) {
        const PersonalId = row.PersonalId
        const totalImporteGeneral = Math.abs(row.totalImporte)
        const ApellidoNombre = row.ApellidoNombre

        const saldoCuentaCoordinador = await queryRunner.query(
          `SELECT per.anio, per.mes, pers.PersonalId, mov.tipocuenta_id, SUM(mov.importe*tip.signo ) totalImporte
        FROM lige.dbo.liqmamovimientos mov
        JOIN lige.dbo.liqmaperiodo per ON per.periodo_id = mov.periodo_id
        JOIN lige.dbo.liqcotipomovimiento tip ON tip.tipo_movimiento_id = mov.tipo_movimiento_id
        JOIN Personal pers ON pers.PersonalId = mov.persona_id
        WHERE per.anio = @1 AND per.mes=@2 AND mov.tipocuenta_id='C' AND pers.PersonalId = @0  -- AND tip.tipo_movimiento_id NOT IN (11,24) 
        GROUP BY per.anio, per.mes, pers.PersonalId, mov.tipocuenta_id
        
        `, [PersonalId, anio, mes])

        const totalImporteCoordinador = saldoCuentaCoordinador[0]?.totalImporte || 0
        if (totalImporteCoordinador < 1)
          continue


        const compensaImporte= totalImporteGeneral > totalImporteCoordinador ? totalImporteCoordinador:totalImporteGeneral

        if (compensaImporte) {
          //          movimientos.push({ PersonalId, totalImporteGeneral, totalImporteCoordinador, ApellidoNombre, compensaImporte })
          movimientos.push(`${ApellidoNombre} compensa ${compensaImporte}`)
          cantRegistros++

          await queryRunner.query(
            `INSERT INTO lige.dbo.liqmamovimientos (movimiento_id, periodo_id, tipo_movimiento_id, tipocuenta_id, fecha, detalle, objetivo_id, persona_id, importe,
          aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
            VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14)
                  `,
            [
              ++movimiento_id,
              periodo_id,
              26, //tipo_movimiento_id
              'G', //tipocuenta_id
              fechaActual,
              '',
              null,
              PersonalId,
              totalImporteGeneral,
              usuario, ip, fechaActual, usuario, ip, fechaActual,
            ]
          );

          await queryRunner.query(
            `INSERT INTO lige.dbo.liqmamovimientos (movimiento_id, periodo_id, tipo_movimiento_id, tipocuenta_id, fecha, detalle, objetivo_id, persona_id, importe,
          aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
            VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14)
                  `,
            [
              ++movimiento_id,
              periodo_id,
              27, //tipo_movimiento_id
              'C', //tipocuenta_id
              fechaActual,
              '',
              null,
              PersonalId,
              totalImporteGeneral,
              usuario, ip, fechaActual, usuario, ip, fechaActual,
            ]
          );
        }
      }

      console.log('movimientos', movimientos)


     // throw new ClientException("DEBUG")
      await queryRunner.commitTransaction();


      this.jsonRes({ list: movimientos }, res, ((cantRegistros>0)? `Se procesaron ${cantRegistros} registros <BR>`+movimientos.join('<BR>'):'No hay saldos para compensar'));
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      //   await queryRunner.release();
    }
  }
}
