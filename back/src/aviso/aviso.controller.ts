import { BaseController, ClientException } from "../controller/basecontroller.ts";
import { dataSource } from "../data-source.ts";
import type { NextFunction, Response } from "express";

export class AvisoController extends BaseController {

  async getAvisos(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const userName = res.locals.userName;
      const avisos = await queryRunner.query(
        `SELECT AvisoId, Usuario, ClaseMensaje, TextoMensaje, EnlaceUrl, FechaVisualizacion, AudFechaIng
         FROM Aviso
         WHERE Usuario = @0 AND AudFechaIng >= DATEADD(DAY, -30, GETDATE())
         ORDER BY AudFechaIng DESC`,
        [userName]
      );
      this.jsonRes(avisos, res);
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async marcarVisto(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const userName = res.locals.userName;
      const { AvisoId } = req.body;
      if (!AvisoId) throw new ClientException("AvisoId es requerido");

      await queryRunner.query(
        `UPDATE Aviso SET FechaVisualizacion = GETDATE()
         WHERE AvisoId = @0 AND Usuario = @1 AND FechaVisualizacion IS NULL`,
        [AvisoId, userName]
      );
      this.jsonRes({ message: "Aviso marcado como visto" }, res);
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async marcarTodosVistos(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const userName = res.locals.userName;
      await queryRunner.query(
        `UPDATE Aviso SET FechaVisualizacion = GETDATE()
         WHERE Usuario = @0 AND FechaVisualizacion IS NULL`,
        [userName]
      );
      this.jsonRes({ message: "Todos los avisos marcados como vistos" }, res);
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async purgarAvisos(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.query(
        `DELETE FROM Aviso WHERE AudFechaIng < DATEADD(DAY, -30, GETDATE())`
      );
      this.jsonRes({ message: "Avisos purgados" }, res);
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }
}
