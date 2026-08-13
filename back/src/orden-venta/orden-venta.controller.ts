import { BaseController } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import { AsistenciaController } from "../controller/asistencia.controller.ts";
import type { NextFunction, Request, Response } from "express";

const columnasGrilla: any[] = [];

export class OrdenVentaController extends BaseController {

  async getGridCols(req: Request, res: Response) {
    this.jsonRes(columnasGrilla, res);
  }

  async getListOrdenVenta(req: Request, res: Response, next: NextFunction) {
    try {
      this.jsonRes(
        {
          total: 0,
          list: [],
        },
        res
      );
    } catch (error) {
      return next(error);
    }
  }

  async getCabecera(req: Request, res: Response, next: NextFunction) {
    const ObjetivoId = Number(req.params.ObjetivoId);
    const anio = Number(req.params.anio);
    const mes = Number(req.params.mes);
    const queryRunner = await getConnection(res.locals.userName);

    try {
      const cabecera = await queryRunner.query(`
        SELECT
          @1 AS Anio,
          @2 AS Mes,
          obj.ObjetivoId, obj.ClienteId, obj.ClienteElementoDependienteId,
          CONCAT(obj.ClienteId,'/',ISNULL(obj.ClienteElementoDependienteId,0),' ',TRIM(ISNULL(cli.ClienteDenominacion,'')),' ',TRIM(ISNULL(eledep.ClienteElementoDependienteDescripcion,''))) AS ObjetivoNombre,
          ord.NroOrdenVenta,
          ord.EstadoOrdenVentaCod,
          est.Descripcion AS EstadoOrdenVenta
        FROM Objetivo obj
        LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
        LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteId = obj.ClienteId AND eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
        LEFT JOIN ItemOrdenVenta item ON item.ClienteId = obj.ClienteId AND item.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND item.Anio = @1 AND item.Mes = @2
        LEFT JOIN OrdenVenta ord ON ord.NroOrdenVenta = item.NroOrdenVenta AND ord.ClienteId = item.ClienteId
        LEFT JOIN EstadoOrdenVenta est ON est.EstadoOrdenVentaCod = ord.EstadoOrdenVentaCod
        WHERE obj.ObjetivoId = @0
      `, [ObjetivoId, anio, mes]);

      const asistencia = await AsistenciaController.getObjetivoAsistencia(anio, mes, [`obj.ObjetivoId = ${ObjetivoId}`], queryRunner)

      this.jsonRes(
        {
          ...(cabecera[0] ?? {}),
          TotalHorasNormales: Number(asistencia.TotalHorasReal ?? 0)
        },
        res
      );

    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }
}
