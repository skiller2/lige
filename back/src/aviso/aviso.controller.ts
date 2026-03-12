import { BaseController, ClientException } from "../controller/basecontroller.ts";
import { dataSource } from "../data-source.ts";
import type { NextFunction, Response } from "express";

export class AvisoController extends BaseController {

  async getAvisos(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const userName = res.locals.userName;
      const grupos: string[] = req.groups || [];
      let gruposCondition = '1=0';

      if (grupos.length > 0) {
        gruposCondition = `Grupo IN ('${grupos.join("','")}')`;
      }
      const avisos = await queryRunner.query(
        `SELECT AvisoId, Usuario, Grupo, ClaseMensaje, TextoMensaje, EnlaceUrl, FechaVisualizacion, AudFechaIng
         FROM Aviso
         WHERE (Visible = 1 OR Visible IS NULL) AND AudFechaIng >= DATEADD(DAY, -30, GETDATE()) AND (${gruposCondition} OR Usuario = @0)
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
      const ip = this.getRemoteAddress(req)
      const now = new Date()
      const { AvisoId } = req.body;
      if (!AvisoId) throw new ClientException("AvisoId es requerido");

      await queryRunner.query(
        `UPDATE Aviso SET FechaVisualizacion = @0, AudFechaMod = @0, AudUsuarioMod = @3, AudIpMod = @2
         WHERE AvisoId = @1 AND FechaVisualizacion IS NULL`,
        [now, AvisoId, ip, userName]
      );
      this.jsonRes({ message: "Aviso marcado como visto" }, res);
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async ocultarAviso(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const userName = res.locals.userName;
      const ip = this.getRemoteAddress(req)
      const now = new Date()
      const { AvisoId } = req.body;
      if (!AvisoId) throw new ClientException("AvisoId es requerido");

      await queryRunner.query(
        `UPDATE Aviso SET Visible = 0, FechaVisualizacion = ISNULL(FechaVisualizacion, @0), AudFechaMod = @0, AudIpMod=@2, AudUsuarioMod = @3
        WHERE AvisoId = @1`,
        [now, AvisoId, ip, userName]
      );
      this.jsonRes({ message: "Aviso ocultado" }, res);
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
      const now = new Date()
      const ip = this.getRemoteAddress(req)
      await queryRunner.query(
        `UPDATE Aviso SET FechaVisualizacion = @0, AudFechaMod = @0, AudIpMod=@2, AudUsuarioMod = @1
         WHERE Usuario = @1 AND FechaVisualizacion IS NULL`,
        [now, userName, ip]
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
