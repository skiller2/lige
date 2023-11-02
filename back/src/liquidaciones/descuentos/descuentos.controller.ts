import { BaseController, ClientException } from "../../controller/baseController";
import { dataSource } from "../../data-source";
import { QueryFailedError } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { ParsedQs } from "qs";
import { Utils } from "../liquidaciones.utils";
import { AsistenciaController } from "../../controller/asistencia.controller";


export class DescuentosController extends BaseController {


  async procesaCambios(req: any, res: Response, next: NextFunction) {
    let fechaActual = new Date()
    let anio = Number(req.body.anio)
    let mes = Number(req.body.mes)
    let ip = this.getRemoteAddress(req)
    let usuario = res.locals.userName
    //const tipo_movimiento_id = Number(process.env.MOV_DESCUENTO)
    const queryRunner = dataSource.createQueryRunner();

    try {
      //if (tipo_movimiento_id == 0 || Number.isNaN(tipo_movimiento_id))
      //  throw new ClientException("Tipo de monvimiento 'MOV_DESCUENTO' no definindo en .env ")

      if (anio < 2000 || isNaN(anio))
        throw new ClientException(`Año ${anio} no válido `)

      if (mes > 12 || mes < 1 || isNaN(mes))
        throw new ClientException(`Mes ${mes} no válido `)





      await queryRunner.connect();
      await queryRunner.startTransaction();

      const result = await AsistenciaController.getDescuentos(anio, mes, [])

      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, anio, mes, usuario, ip)

      await queryRunner.query(
        `DELETE FROM lige.dbo.liqmamovimientos WHERE periodo_id=@0 AND tipo_movimiento_id IN (4,5,15,7,14,6,16,17) `, [periodo_id])


      let movimiento_id = await Utils.getMovimientoId(queryRunner)





      for (const row of result) {
        let detalle = `${row.tipomov} ${row.desmovimiento2.trim()}`
        let tipo_movimiento_id
        switch (row.tipoint) {
          case "DESC":
            tipo_movimiento_id = 4  
            break;
          case "OTRO":
            tipo_movimiento_id = 5
            break;
          case "ADEL":
            tipo_movimiento_id = 15
            break;
          case "AYUD":
            tipo_movimiento_id = 7
            break;
          case "PREP":
            tipo_movimiento_id = 14
            break;
          case "RENT":
            tipo_movimiento_id = 6
            break;
          case "DDJJ":
            tipo_movimiento_id = 16
            break;
          case "TELE":
            tipo_movimiento_id = 17
            break;

          default:
            throw new ClientException(`Identificador de descuento ${row.tipoint} desconocido`)
            break;
        }

        if (row.cantcuotas > 1)
          detalle += ` cuota ${row.cuotanro}/${row.cantcuotas}, total $ ${row.importetotal} `

        await queryRunner.query(
          `INSERT INTO lige.dbo.liqmamovimientos (movimiento_id, periodo_id, tipo_movimiento_id, fecha, detalle, objetivo_id, persona_id, importe,horas,
             aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
              VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14)
                     `,
          [
            ++movimiento_id,
            periodo_id,
            tipo_movimiento_id,
            fechaActual,
            detalle,
            row.ObjetivoId,
            row.PersonalId,
            row.importe,
            0,
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
      await queryRunner.release();
    }
  }
}
