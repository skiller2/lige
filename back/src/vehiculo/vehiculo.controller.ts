import type { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/basecontroller.ts";
import { dataSource } from "../data-source.ts";

export class VehiculoController extends BaseController {
  
  private async getTipoVehiculoQuery(queryRunner: any) {
    return await queryRunner.query(`
        SELECT tipo.TipoVehiculoId value, TRIM(tipo.TipoVehiculoDescripcion) label
        FROM TipoVehiculo tipo`)
  }

  async getTipoVehiculo(req: Request, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await this.getTipoVehiculoQuery(queryRunner)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

  private async getMarcaVehiculoQuery(queryRunner: any, TipoVehiculoId:number) {
    return await queryRunner.query(`
        SELECT m.VehiculoMarcaId value, TRIM(m.VehiculoMarcaDescripcion) label
        FROM VehiculoMarca m
        WHERE m.TipoVehiculoId IN (@0)
      `,[TipoVehiculoId])
  }

  async getMarcaVehiculo(req: Request, res: Response, next: NextFunction) {
    const TipoVehiculoId = req.body.TipoVehiculoId
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await this.getMarcaVehiculoQuery(queryRunner, TipoVehiculoId)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

  private async getModeloVehiculoQuery(queryRunner: any, TipoVehiculoId:number, VehiculoMarcaId:number) {
    return await queryRunner.query(`
        SELECT m.VehiculoMarcaModeloId value, TRIM(m.VehiculoMarcaModeloDescripcion) label
        FROM VehiculoMarcaVehiculoMarcaModelo m
        WHERE m.TipoVehiculoId IN (@0) and m.VehiculoMarcaId IN (@1)
      `, [TipoVehiculoId, VehiculoMarcaId])
  }

  async getModeloVehiculo(req: Request, res: Response, next: NextFunction) {
    const TipoVehiculoId = req.body.TipoVehiculoId
    const VehiculoMarcaId = req.body.VehiculoMarcaId
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await this.getModeloVehiculoQuery(queryRunner, TipoVehiculoId, VehiculoMarcaId)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

}

