import { BaseController, ClientException } from "../../controller/baseController";
import { dataSource } from "../../data-source";
import { QueryFailedError, QueryRunner } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { Utils } from "../liquidaciones.utils";
import { AsistenciaController } from "src/controller/asistencia.controller";
import { recibosController } from "src/controller/controller.module";


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

      for (const row of cuentasGnegativo) {
        const PersonalId = row.PersonalId
        const totalImporteGeneral = row.totalImporte
        const ApellidoNombre = row.ApellidoNombre

        const saldoCuentaCoordinador = await queryRunner.query(
          `SELECT per.anio, per.mes, pers.PersonalId, mov.tipocuenta_id, SUM(mov.importe*tip.signo ) totalImporte
        FROM lige.dbo.liqmamovimientos mov
        JOIN lige.dbo.liqmaperiodo per ON per.periodo_id = mov.periodo_id
        JOIN lige.dbo.liqcotipomovimiento tip ON tip.tipo_movimiento_id = mov.tipo_movimiento_id
        JOIN Personal pers ON pers.PersonalId = mov.persona_id
        WHERE per.anio = @1 AND per.mes=@2 AND mov.tipocuenta_id='C' AND pers.PersonalId = @0 AND tip.tipo_movimiento_id NOT IN (11,24) 
        GROUP BY per.anio, per.mes, pers.PersonalId, mov.tipocuenta_id
        
        `, [PersonalId, anio, mes])

        const totalImporteCoordinador = saldoCuentaCoordinador[0]?.totalImporte || 0

        if (totalImporteCoordinador > 0) {
          movimientos.push({PersonalId, totalImporteGeneral, totalImporteCoordinador,ApellidoNombre})
          cantRegistros++
        }

      }

      await queryRunner.commitTransaction();

      console.log('movimientos',movimientos)


      this.jsonRes({ list: movimientos }, res, `Se procesaron ${cantRegistros} registros `);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      //   await queryRunner.release();
    }
  }
}
