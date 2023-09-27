import { BaseController, ClientException } from "../../controller/baseController";
import { dataSource } from "../../data-source";
import { QueryFailedError } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { ParsedQs } from "qs";
import { Utils } from "../liquidaciones.utils";
import { AsistenciaController } from "../../controller/asistencia.controller";


export class IngresoAsistenciaAdministrativosArt42Controller extends BaseController {

 
  async procesaCambios(req: any, res: Response, next: NextFunction) {
    let fechaActual = new Date()
    let anio = Number(req.body.anio)
    let mes = Number(req.body.mes)
    let ip = this.getRemoteAddress(req)
    let usuario = res.locals.userName
    const tipo_movimiento_id = Number(process.env.MOV_ASISTENCIA_ADMINISTRA)
    const queryRunner = dataSource.createQueryRunner();

    try {
      if (tipo_movimiento_id == 0 || Number.isNaN(tipo_movimiento_id))
        throw new ClientException("Tipo de monvimiento 'MOV_ASISTENCIA_ADMINISTRA' no definindo en .env ")


        if (anio < 2000 || isNaN(anio))
        throw new ClientException(`Año ${anio} no válido `)

      if (mes > 12 || mes < 1 || isNaN(mes))
        throw new ClientException(`Mes ${mes} no válido `)





      await queryRunner.connect();
      await queryRunner.startTransaction();

      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, anio, mes, usuario, ip)

      await queryRunner.query(
        `DELETE FROM lige.dbo.liqmamovimientos WHERE periodo_id=@0 AND tipo_movimiento_id=@1 `,[ periodo_id, tipo_movimiento_id ])

      const result = await AsistenciaController.getAsistenciaAdminArt42(anio,mes,queryRunner,[])


      let movimiento_id = await Utils.getMovimientoId(queryRunner)

      for (const row of result) {
//        if (row.total == 0)
//          continue 
          
        const detalle= (row.ValorLiquidacionSumaFija>0)? `Suma Fija`: `Horas ${(row.horas_fijas>0)?row.horas_fijas:row.horas_reales}` + `Categoría ${row.CategoriaPersonalDescripcion.trim()} ${(row.SucursalAsistenciaAnoMesPersonalDiasCualArt42>0)? 'AP'+row.SucursalAsistenciaAnoMesPersonalDiasCualArt42:''} ` 
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
            null,
            row.SucursalAsistenciaMesPersonalId,
            row.total,
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
