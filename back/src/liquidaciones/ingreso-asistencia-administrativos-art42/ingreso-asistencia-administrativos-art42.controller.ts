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
    let  tipo_movimiento_id = 0
    const tipo_movimiento_id_normadmi = Number(process.env.MOV_ASISTENCIA_ADMINISTRA)
    const tipo_movimiento_id_art42vigi = Number(process.env.MOV_ART42VIGI)
    const tipo_movimiento_id_art42admi = Number(process.env.MOV_ART42ADMI)
    const queryRunner = dataSource.createQueryRunner();

    try {
      if (tipo_movimiento_id_normadmi == 0 || Number.isNaN(tipo_movimiento_id_normadmi))
        throw new ClientException("Tipo de monvimiento 'MOV_ASISTENCIA_ADMINISTRA' no definindo en .env ")
      if (tipo_movimiento_id_art42vigi == 0 || Number.isNaN(tipo_movimiento_id_art42vigi))
        throw new ClientException("Tipo de monvimiento 'MOV_ART42VIGI' no definindo en .env ")
      if (tipo_movimiento_id_art42admi == 0 || Number.isNaN(tipo_movimiento_id_art42admi))
        throw new ClientException("Tipo de monvimiento 'MOV_ART42ADMI' no definindo en .env ")


        if (anio < 2000 || isNaN(anio))
        throw new ClientException(`Año ${anio} no válido `)

      if (mes > 12 || mes < 1 || isNaN(mes))
        throw new ClientException(`Mes ${mes} no válido `)





      await queryRunner.connect();
      await queryRunner.startTransaction();

      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, anio, mes, usuario, ip)

      await queryRunner.query(
        `DELETE FROM lige.dbo.liqmamovimientos WHERE periodo_id=@0 AND tipo_movimiento_id=@1 `,[ periodo_id, tipo_movimiento_id_normadmi ])
      await queryRunner.query(
        `DELETE FROM lige.dbo.liqmamovimientos WHERE periodo_id=@0 AND tipo_movimiento_id=@1 `,[ periodo_id, tipo_movimiento_id_art42vigi ])
      await queryRunner.query(
        `DELETE FROM lige.dbo.liqmamovimientos WHERE periodo_id=@0 AND tipo_movimiento_id=@1 `,[ periodo_id, tipo_movimiento_id_art42admi ])
      
      
      
      const result = await AsistenciaController.getAsistenciaAdminArt42(anio,mes,queryRunner,[])


      let movimiento_id = await Utils.getMovimientoId(queryRunner)

      for (const row of result) {
//        if (row.total == 0)
//          continue 
        
        switch (row.SucursalAsistenciaAnoMesPersonalDiasCualArt42) {
          case "0":
          case "":
            tipo_movimiento_id = tipo_movimiento_id_normadmi 
            break;
          case "4":
            tipo_movimiento_id = tipo_movimiento_id_art42vigi 
            break;
          case "5":
            tipo_movimiento_id = tipo_movimiento_id_art42admi
            break;
          
          default:
            throw new ClientException(`Tipo SucursalAsistenciaAnoMesPersonalDiasCualArt42=${row.SucursalAsistenciaAnoMesPersonalDiasCualArt42} no válido `)
            break;
        }

        const detalle= ((row.ValorLiquidacionSumaFija>0)? `Suma Fija `: `Horas ${row.horas} `) + `Categoría ${row.CategoriaPersonalDescripcion.trim()} ${(row.SucursalAsistenciaAnoMesPersonalDiasCualArt42>0)? 'AP'+row.SucursalAsistenciaAnoMesPersonalDiasCualArt42:''} ` 
        await queryRunner.query(
          `INSERT INTO lige.dbo.liqmamovimientos (movimiento_id, periodo_id, tipo_movimiento_id, fecha, detalle, objetivo_id, persona_id, importe, horas,
             aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
              VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13,@14)
                     `,
          [
            ++movimiento_id,
            periodo_id,
            tipo_movimiento_id,
            fechaActual,
            detalle,
            null,
            row.SucursalAsistenciaMesPersonalId,
            Number(row.total),
            row.horas,
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
