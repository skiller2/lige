import { NextFunction, Response } from "express";
import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";
import { QueryRunner } from "typeorm";

export class DomicilioController extends BaseController {
  private async getPaisesQuery(queryRunner:any){
    return await queryRunner.query(`
      SELECT pais.PaisId value, TRIM(pais.PaisDescripcion) label
      FROM Pais pais`)
  }
  
  async getPaises(req: any, res: Response, next: NextFunction){
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await this.getPaisesQuery(queryRunner)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
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
      const options = await this.getProvinciasByPaisQuery(queryRunner, paisId)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
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
      const options = await this.getLocalidadesByProvinciaQuery(queryRunner, paisId, provinciaId)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
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
      const options = await this.getBarrioByLocalidadQuery(queryRunner, paisId, provinciaId, localidadId)
      
      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }
  
  async getProvincias(req: any, res: Response, next: NextFunction){
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await queryRunner.query(`
      SELECT pro.ProvinciaId, pro.PaisId, TRIM(pro.ProvinciaDescripcion) label
        , pro.ProvinciaId AS value
        , CONCAT(TRIM(pro.ProvinciaDescripcion), ', ', TRIM(pais.PaisDescripcion)) address
      FROM Provincia pro
      INNER JOIN Pais pais ON pais.PaisId = pro.PaisId
      `,)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }
  
  async getLocalidad(req: any, res: Response, next: NextFunction){
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await queryRunner.query(`
        SELECT loc.LocalidadId, loc.PaisId, loc.ProvinciaId, TRIM(loc.LocalidadDescripcion) label
          , loc.LocalidadId value
          , CONCAT_WS(', ', TRIM(loc.LocalidadDescripcion), TRIM(pro.ProvinciaDescripcion), TRIM(pais.PaisDescripcion)) address
        FROM Localidad loc
        INNER JOIN Provincia pro ON pro.ProvinciaId = loc.ProvinciaId AND pro.PaisId = loc.PaisId
        INNER JOIN Pais pais ON pais.PaisId = loc.PaisId
        `)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

  async getBarrio(req: any, res: Response, next: NextFunction){
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await await queryRunner.query(`
      SELECT bar.BarrioId, bar.LocalidadId, bar.PaisId, bar.ProvinciaId, TRIM(bar.BarrioDescripcion) label
        , bar.BarrioId value
        , CONCAT_WS(', ', TRIM(bar.BarrioDescripcion), TRIM(loc.LocalidadDescripcion), TRIM(pro.ProvinciaDescripcion), TRIM(pais.PaisDescripcion)) address
      FROM Barrio bar
      INNER JOIN Localidad loc ON loc.LocalidadId = bar.LocalidadId AND loc.ProvinciaId = bar.ProvinciaId AND loc.PaisId = bar.PaisId
      INNER JOIN Provincia pro ON pro.ProvinciaId = bar.ProvinciaId AND pro.PaisId = bar.PaisId
      INNER JOIN Pais pais ON pais.PaisId = bar.PaisId
      `)
      
      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

}