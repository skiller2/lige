import { BaseController, ClientException } from "../../controller/baseController";
import { dataSource } from "../../data-source";
import { QueryFailedError, QueryRunner } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { ParsedQs } from "qs";
import { Client } from "ldapts";
import { Utils } from "../liquidaciones.utils";
import { AsistenciaController } from "src/controller/asistencia.controller";
import { recibosController } from "src/controller/controller.module";


export class IngresoPorAsistenciaController extends BaseController {


  async procesaCambios(req: any, res: Response, next: NextFunction) {
    let fechaActual = new Date()
    let anio = Number(req.body.anio)
    let mes = Number(req.body.mes)
    let ip = this.getRemoteAddress(req)
    let usuario = res.locals.userName
    const tipo_movimiento_id = Number(process.env.MOV_ASISTENCIA_VIGILANCIA)
    const queryRunner = dataSource.createQueryRunner();

    try {

      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, anio, mes, usuario, ip)

      const getRecibosGenerados = await recibosController.getRecibosGenerados(queryRunner, periodo_id)

      if (getRecibosGenerados[0].ind_recibos_generados == 1)
          throw new ClientException(`Los recibos para este periodo ya se generaron`)

      if (tipo_movimiento_id == 0 || Number.isNaN(tipo_movimiento_id))
        throw new ClientException("Tipo de monvimiento 'MOV_ASISTENCIA_VIGILANCIA' no definindo en .env ")


      if (anio < 2000)
        throw new ClientException(`Año ${anio} no válido `)

      if (mes > 12 || mes < 1)
        throw new ClientException(`Mes ${mes} no válido `)

      const resPendAsisCierre = await AsistenciaController.objetivosPendAsis(anio,mes)
      if (resPendAsisCierre.length > 0)
        throw new ClientException(`Existen ${resPendAsisCierre.length} objetivos pendientes de cierre o sin asistencia para el período ${mes}/${anio}`)
      
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const result = await AsistenciaController.getObjetivoAsistencia(anio,mes,[],queryRunner)

      await queryRunner.query(
        `DELETE FROM lige.dbo.liqmamovimientos WHERE periodo_id=@0 AND tipo_movimiento_id=@1 `,[ periodo_id, tipo_movimiento_id ])

      let movimiento_id = await Utils.getMovimientoId(queryRunner)

      for (const row of result) {
 //        const detalle = `Horas ${row.totalhorascalc}, Categoría ${((row.rt14CategoriaDescripcion != undefined) ? row.rt14CategoriaDescripcion : row.CategoriaPersonalDescripcion).trim()}  `

        const detalle = `Horas ${row.totalhorascalc}, Categoría ${row.CategoriaPersonalDescripcion.trim()}`
        await queryRunner.query(
          `INSERT INTO lige.dbo.liqmamovimientos (movimiento_id, periodo_id, tipo_movimiento_id, fecha, detalle, objetivo_id, persona_id, importe,horas, tipo_asociado_id, categoria_personal_id,
             aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
              VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13,@14,@15,@16)
                     `,
          [
            ++movimiento_id,
            periodo_id,
            tipo_movimiento_id,
            fechaActual,
            detalle,
            row.ObjetivoId,
            row.PersonalId,
            row.totalhorascalc * row.ValorHoraNorm,
            row.totalhorascalc,
            row.ObjetivoAsistenciaTipoAsociadoId,
            row.ObjetivoAsistenciaCategoriaPersonalId,
            usuario, ip, fechaActual, usuario, ip, fechaActual,
          ]
        );

        if (row.PersonalArt14Horas) {
          const detalle = `Art.17 Horas adicionales ${row.PersonalArt14Horas}`
          await queryRunner.query(
            `INSERT INTO lige.dbo.liqmamovimientos (movimiento_id, periodo_id, tipo_movimiento_id, fecha, detalle, objetivo_id, persona_id, importe,horas, tipo_asociado_id, categoria_personal_id,
             aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
              VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13,@14,@15,@16)
                     `,
            [
              ++movimiento_id,
              periodo_id,
              tipo_movimiento_id,
              fechaActual,
              detalle,
              row.ObjetivoId,
              row.PersonalId,
              row.PersonalArt14Horas*row.ValorHoraNorm,
              row.PersonalArt14Horas,
              row.ObjetivoAsistenciaTipoAsociadoId,
              row.ObjetivoAsistenciaCategoriaPersonalId,
              usuario, ip, fechaActual, usuario, ip, fechaActual,
            ]
          );
        }


        if (row.ValorHoraArt14Categoria > 0) {
          //console.log('Dif categoria',row.art14CategoriaDescripcion,row.ValorHoraArt14Categoria)
          const detalle = `Art.17 Equivalencia ${row.art14CategoriaDescripcion.trim()}, horas:${row.totalhorascalc+row.PersonalArt14Horas}`
          await queryRunner.query(
            `INSERT INTO lige.dbo.liqmamovimientos (movimiento_id, periodo_id, tipo_movimiento_id, fecha, detalle, objetivo_id, persona_id, importe,horas,tipo_asociado_id, categoria_personal_id,
             aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
              VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13,@14,@15,@16)
                     `,
            [
              ++movimiento_id,
              periodo_id,
              tipo_movimiento_id,
              fechaActual,
              detalle,
              row.ObjetivoId,
              row.PersonalId,
              (row.totalhorascalc+row.PersonalArt14Horas) * (row.ValorHoraArt14Categoria-row.ValorHoraNorm),
              row.totalhorascalc + row.PersonalArt14Horas,
              row.PersonalArt14TipoAsociadoId,
              row.PersonalArt14CategoriaId,
              usuario, ip, fechaActual, usuario, ip, fechaActual,
            ]
          );
        }


        if (row.PersonalArt14AdicionalHora) {
          const detalle = `Art.17 Importe Adicional Horas ${row.totalhorascalc+row.PersonalArt14Horas}`
          await queryRunner.query(
            `INSERT INTO lige.dbo.liqmamovimientos (movimiento_id, periodo_id, tipo_movimiento_id, fecha, detalle, objetivo_id, persona_id, importe,horas,tipo_asociado_id, categoria_personal_id,
             aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
              VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13,@14,@15,@16)
                     `,
            [
              ++movimiento_id,
              periodo_id,
              tipo_movimiento_id,
              fechaActual,
              detalle,
              row.ObjetivoId,
              row.PersonalId,
              (row.totalhorascalc+row.PersonalArt14Horas)*row.PersonalArt14AdicionalHora,
              row.totalhorascalc + row.PersonalArt14Horas,
              row.ObjetivoAsistenciaTipoAsociadoId,
              row.ObjetivoAsistenciaCategoriaPersonalId,
              usuario, ip, fechaActual, usuario, ip, fechaActual,
            ]
          );
        }

        if (row.PersonalArt14SumaFija) {
          const detalle = `Art.17 Suma fija`
          await queryRunner.query(
            `INSERT INTO lige.dbo.liqmamovimientos (movimiento_id, periodo_id, tipo_movimiento_id, fecha, detalle, objetivo_id, persona_id, importe,horas,tipo_asociado_id, categoria_personal_id,
             aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
              VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13,@14,@15,@16)
                     `,
            [
              ++movimiento_id,
              periodo_id,
              tipo_movimiento_id,
              fechaActual,
              detalle,
              row.ObjetivoId,
              row.PersonalId,
              row.PersonalArt14SumaFija,
              0,
              row.ObjetivoAsistenciaTipoAsociadoId,
              row.ObjetivoAsistenciaCategoriaPersonalId,
              usuario, ip, fechaActual, usuario, ip, fechaActual,
            ]
          );
        }

        

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
