import { NextFunction, Response } from "express";
import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";
import { QueryRunner } from "typeorm";

export class ResidenciaController extends BaseController {
    private async getPaisesQuery(queryRunner:any){
        return await queryRunner.query(`
            SELECT pais.PaisId value, TRIM(pais.PaisDescripcion) label
            FROM Pais pais`)
      }
    
    async getPaises(req: any, res: Response, next: NextFunction){
        const queryRunner = dataSource.createQueryRunner();
        try {
          await queryRunner.startTransaction()
    
          const options = await this.getPaisesQuery(queryRunner)
    
          await queryRunner.commitTransaction()
          this.jsonRes(options, res);
        } catch (error) {
          await this.rollbackTransaction(queryRunner)
          return next(error)
        } finally {
          await queryRunner.release()
        }
    }

    private async getProvinciasByPaisQuery(queryRunner:any, paisId:number){
        return await queryRunner.query(`
            SELECT pro.ProvinciaId value, TRIM(pro.ProvinciaDescripcion) label
            FROM Provincia pro
            WHERE PaisId IN (@0)
            `, [paisId])
      }
    
    async getProvinciasByPais(req: any, res: Response, next: NextFunction){
        const queryRunner = dataSource.createQueryRunner();
        const paisId:number = req.body.paisId
        try {
          await queryRunner.startTransaction()
    
          const options = await this.getProvinciasByPaisQuery(queryRunner, paisId)
    
          await queryRunner.commitTransaction()
          this.jsonRes(options, res);
        } catch (error) {
          await this.rollbackTransaction(queryRunner)
          return next(error)
        } finally {
          await queryRunner.release()
        }
    }

    private async getLocalidadesByProvinciaQuery(queryRunner:any, paisId:number, provinciaId:number){
        return await queryRunner.query(`
            SELECT loc.LocalidadId value, TRIM(loc.LocalidadDescripcion) label
            FROM Localidad loc
            WHERE loc.PaisId IN (@0) AND loc.ProvinciaId IN (@1)
            `,[paisId, provinciaId])
      }
    
    async getLocalidadByProvincia(req: any, res: Response, next: NextFunction){
        const queryRunner = dataSource.createQueryRunner();
        const provinciaId:number = req.body.provinciaId
        const paisId:number = req.body.paisId
        try {
          await queryRunner.startTransaction()
    
          const options = await this.getLocalidadesByProvinciaQuery(queryRunner, paisId, provinciaId)
    
          await queryRunner.commitTransaction()
          this.jsonRes(options, res);
        } catch (error) {
          await this.rollbackTransaction(queryRunner)
          return next(error)
        } finally {
          await queryRunner.release()
        }
    }

    private async getBarrioByLocalidadQuery(queryRunner:any, paisId:number, provinciaId:number, localidadId:number){
      return await queryRunner.query(`
          SELECT bar.BarrioId value, TRIM(bar.BarrioDescripcion) label
          FROM Barrio bar
          WHERE bar.PaisId IN (@0) AND bar.ProvinciaId IN (@1) AND bar.LocalidadId IN (@2)
          `,[paisId, provinciaId, localidadId])
    }
  
  async getBarrioByLocalidad(req: any, res: Response, next: NextFunction){
      const queryRunner = dataSource.createQueryRunner();
      const localidadId:number = req.body.localidadId
      const provinciaId:number = req.body.provinciaId
      const paisId:number = req.body.paisId
      try {
        await queryRunner.startTransaction()
  
        const options = await this.getBarrioByLocalidadQuery(queryRunner, paisId, provinciaId, localidadId)
        
        await queryRunner.commitTransaction()
        this.jsonRes(options, res);
      } catch (error) {
        await this.rollbackTransaction(queryRunner)
        return next(error)
      } finally {
        await queryRunner.release()
      }
  }
}