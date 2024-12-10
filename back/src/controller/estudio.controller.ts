import { NextFunction, Response } from "express";
import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";
import { QueryRunner } from "typeorm";

export class EstudioController extends BaseController {
    private async geEstadosEstudioQuery(queryRunner:any){
        return await queryRunner.query(`
            SELECT est.EstadoEstudioId value, TRIM(est.EstadoEstudioDescripcion) label
            FROM EstadoEstudio est`)
      }
    
    async geEstadosEstudio(req: any, res: Response, next: NextFunction){
        const queryRunner = dataSource.createQueryRunner();
        try {
          const options = await this.geEstadosEstudioQuery(queryRunner)

          this.jsonRes(options, res);
        } catch (error) {
          return next(error)
        }
    }

    private async getTiposEstudioQuery(queryRunner:any){
        return await queryRunner.query(`
            SELECT tipo.TipoEstudioId value, TRIM(tipo.TipoEstudioDescripcion) label
            FROM TipoEstudio tipo`)
      }
    
    async getTiposEstudio(req: any, res: Response, next: NextFunction){
        const queryRunner = dataSource.createQueryRunner();
        try {
          const options = await this.getTiposEstudioQuery(queryRunner)

          this.jsonRes(options, res);
        } catch (error) {
          return next(error)
        } 
    }
}