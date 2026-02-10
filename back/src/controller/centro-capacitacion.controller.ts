import { NextFunction, Response } from "express";
import { BaseController, ClientException } from "./basecontroller.ts";
import { dataSource } from "../data-source.ts";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros.ts";
import { Options } from "../schemas/filtro";
import { QueryRunner } from "typeorm";


export class CentroCapacitacionController extends BaseController {


      async search(req: any, res: Response, next: NextFunction) {

        const queryRunner = dataSource.createQueryRunner();
        try {
            const Curso = await queryRunner.query(`SELECT CentroCapacitacionId, CentroCapacitacionRazonSocial FROM CentroCapacitacion`)
            return this.jsonRes(Curso, res);
        } catch (error) {
            return next(error)
        } finally {
    
        }
      
      }
    
      async searchId(req: any, res: Response, next: NextFunction) {
        const { id } = req.params
        const queryRunner = dataSource.createQueryRunner();
        try {
            const Curso = await queryRunner.query(`SELECT CentroCapacitacionId, CentroCapacitacionRazonSocial FROM CentroCapacitacion WHERE CentroCapacitacionId = ${id}`)
            return this.jsonRes(Curso, res);
        } catch (error) {
            return next(error)
        } finally {
    
        }
      }

     
      async searchSede(req: any, res: Response, next: NextFunction) {

        const queryRunner = dataSource.createQueryRunner();
        try {
            const Curso = await queryRunner.query(` SELECT CentroCapacitacionSedeId, CentroCapacitacionId,CentroCapacitacionSedeDescripcion FROM CentroCapacitacionSede`)
            return this.jsonRes(Curso, res);
        } catch (error) {
            return next(error)
        } finally {
    
        }
      
      }


}