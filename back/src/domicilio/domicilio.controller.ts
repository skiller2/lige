import type { NextFunction, Response } from "express";
import { BaseController, ClientException } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros.ts";
import type { Options } from "../schemas/filtro.ts";
import type { QueryRunner } from "typeorm";

export class DomicilioController extends BaseController {
  private async getPaisesQuery(queryRunner:any){
    return await queryRunner.query(`
      SELECT pais.PaisId value, TRIM(pais.PaisDescripcion) label
      FROM Pais pais`)
  }
  
  async getPaises(req: any, res: Response, next: NextFunction){
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const options = await this.getPaisesQuery(queryRunner)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }finally {
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
    const queryRunner = await getConnection(res.locals.userName);
    const paisId:number = req.body.paisId
    try {
      const options = await this.getProvinciasByPaisQuery(queryRunner, paisId)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }finally {
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
    const queryRunner = await getConnection(res.locals.userName);
    const provinciaId:number = req.body.provinciaId
    const paisId:number = req.body.paisId
    try {
      const options = await this.getLocalidadesByProvinciaQuery(queryRunner, paisId, provinciaId)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }finally {
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
    const queryRunner = await getConnection(res.locals.userName);
    const localidadId:number = req.body.localidadId
    const provinciaId:number = req.body.provinciaId
    const paisId:number = req.body.paisId
    try {
      const options = await this.getBarrioByLocalidadQuery(queryRunner, paisId, provinciaId, localidadId)
      
      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }finally {
      await queryRunner.release()
    }
  }
  
  async getProvincias(req: any, res: Response, next: NextFunction){
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const options = await queryRunner.query(`
      SELECT pro.ProvinciaId, pro.PaisId, TRIM(pro.ProvinciaDescripcion) label
        , pro.ProvinciaId AS value
        , CONCAT(TRIM(pro.ProvinciaDescripcion), ', ', TRIM(pais.PaisDescripcion)) address
      FROM Provincia pro
      INNER JOIN Pais pais ON pais.PaisId = pro.PaisId
      where pais.PaisId = 1
      `,)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }finally {
      await queryRunner.release()
    }
  }
  
  async getLocalidad(req: any, res: Response, next: NextFunction){
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const options = await queryRunner.query(`
        SELECT loc.LocalidadId, loc.PaisId, loc.ProvinciaId, TRIM(loc.LocalidadDescripcion) label
          , loc.LocalidadId value
          , CONCAT_WS(', ', TRIM(loc.LocalidadDescripcion), TRIM(pro.ProvinciaDescripcion), TRIM(pais.PaisDescripcion)) address
        FROM Localidad loc
        INNER JOIN Provincia pro ON pro.ProvinciaId = loc.ProvinciaId AND pro.PaisId = loc.PaisId
        INNER JOIN Pais pais ON pais.PaisId = loc.PaisId
        where pais.PaisId = 1
        `)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }finally {
      await queryRunner.release()
    }
  }

  async getBarrio(req: any, res: Response, next: NextFunction){
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const options = await queryRunner.query(`
      SELECT bar.BarrioId, bar.LocalidadId, bar.PaisId, bar.ProvinciaId, TRIM(bar.BarrioDescripcion) label
        , bar.BarrioId value
        , CONCAT_WS(', ', TRIM(bar.BarrioDescripcion), TRIM(loc.LocalidadDescripcion), TRIM(pro.ProvinciaDescripcion), TRIM(pais.PaisDescripcion)) address
      FROM Barrio bar
      INNER JOIN Localidad loc ON loc.LocalidadId = bar.LocalidadId AND loc.ProvinciaId = bar.ProvinciaId AND loc.PaisId = bar.PaisId
      INNER JOIN Provincia pro ON pro.ProvinciaId = bar.ProvinciaId AND pro.PaisId = bar.PaisId
      INNER JOIN Pais pais ON pais.PaisId = bar.PaisId
      where pais.PaisId = 1
      `)
      
      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }finally {
      await queryRunner.release()
    }
  }

  async searchProvincia(req: any, res: Response, next: NextFunction){
    const { PaisId, fieldName, value } = req.body;
    if (PaisId == "") {
      this.jsonRes({ objetivos: [] }, res);
      return;
    }
    let buscar = false;
    let query = `
      SELECT pro.ProvinciaId, TRIM(pro.ProvinciaDescripcion) Descripcion
      FROM Provincia pro
      WHERE 
    `;

    if (PaisId > 0)
      query += 'pro.PaisId IN (@0) AND '

    switch (fieldName) {
      case "Descripcion":
        if (value.trim().length > 1) {
          query += ` (pro.ProvinciaDescripcion LIKE '%${value.trim()}%') AND `;
          buscar = true;
        }
        break;
      default:
        break;
    }

    if (buscar == false) {
      this.jsonRes({ recordsArray: [] }, res);
      return;
    }

    const queryRunner = await getConnection(res.locals.userName);
    queryRunner.query((query += " 1=1"), [PaisId])
    .then(async (records) => {
      await queryRunner.release()

      this.jsonRes({ recordsArray: records }, res);
    }).catch((error) => {
      return next(error)
    });
  }
  
  async searchLocalidad(req: any, res: Response, next: NextFunction){
    const { PaisId, ProvinciaId, fieldName, value } = req.body;
    if (PaisId == "" || ProvinciaId == "") {
      this.jsonRes({ objetivos: [] }, res);
      return;
    }
    let buscar = false;
    let query = `
      SELECT loc.LocalidadId, TRIM(loc.LocalidadDescripcion) Descripcion
      FROM Localidad loc
      WHERE 
    `;

    if (PaisId > 0)
      query += 'loc.PaisId IN (@0) AND '
    if (ProvinciaId > 0)
      query += 'loc.ProvinciaId IN (@1) AND '

    switch (fieldName) {
      case "Descripcion":
        if (value.trim().length > 1) {
          query += ` (loc.LocalidadDescripcion LIKE '%${value.trim()}') AND `;
          buscar = true;
        }
        break;
      default:
        break;
    }

    if (buscar == false) {
      this.jsonRes({ recordsArray: [] }, res);
      return;
    }

    const queryRunner = await getConnection(res.locals.userName);
    queryRunner.query((query += " 1=1"), [PaisId, ProvinciaId])
    .then(async (records) => {
      await queryRunner.release()

      this.jsonRes({ recordsArray: records }, res);
    }).catch((error) => {
      return next(error)
    });
  }

  async searchBarrio(req: any, res: Response, next: NextFunction){
    const { PaisId, ProvinciaId, LocalidadId, fieldName, value } = req.body;
    if (PaisId == "" || ProvinciaId == "" || LocalidadId == "") {
      this.jsonRes({ objetivos: [] }, res);
      return;
    }
    let buscar = false;
    let query = `
      SELECT bar.BarrioId, TRIM(bar.BarrioDescripcion) Descripcion
      FROM Barrio bar
      WHERE 
    `;

    if (PaisId > 0)
      query += 'bar.PaisId IN (@0) AND '
    if (ProvinciaId > 0)
      query += 'bar.ProvinciaId IN (@1) AND '
    if (LocalidadId > 0)
      query += 'bar.LocalidadId IN (@1) AND '

    switch (fieldName) {
      case "Descripcion":
        if (value.trim().length > 1) {
          query += ` (bar.BarrioDescripcion LIKE '%${value.trim()}') AND `;
          buscar = true;
        }
        break;
      default:
        break;
    }

    if (buscar == false) {
      this.jsonRes({ recordsArray: [] }, res);
      return;
    }

    const queryRunner = await getConnection(res.locals.userName);
    queryRunner.query((query += " 1=1"), [PaisId, ProvinciaId, LocalidadId])
    .then(async (records) => {
      await queryRunner.release()

      this.jsonRes({ recordsArray: records }, res);
    }).catch((error) => {
      return next(error)
    });
  }

  // Crea las localidades que no estan registradas usando DomicilioJSON. Ver tabla de Domicilio
  async checkDomicilioJSON(queryRunner:any, domicilio:any){
    if(!domicilio.DomicilioJson.length) return null
    const address:any = JSON.parse(domicilio.DomicilioJson)
    
    if (!domicilio.DomicilioLocalidadId && (address.state_district || address.city)) {
      const LocalidadDescripcion:string = address.state_district? address.state_district : address.city

      const Provincia = await queryRunner.query(`
        SELECT ISNULL(ProvinciaLocalidadUltNro, 0) AS ProvinciaLocalidadUltNro, ProvinciaId, PaisId
        FROM Provincia
        WHERE PaisId IN (@0) AND ProvinciaId IN (@1)
      `, [domicilio.DomicilioPaisId, domicilio.DomicilioProvinciaId])
      const newLocalidadId:number = Provincia[0].ProvinciaLocalidadUltNro+1

      await queryRunner.query(`
        UPDATE Provincia
        SET ProvinciaLocalidadUltNro = @0
        WHERE PaisId IN (@1) AND ProvinciaId IN (@2)

        INSERT INTO Localidad (
          LocalidadId,
          PaisId,
          ProvinciaId,
          LocalidadDescripcion,
          LocalidadBarrioUltNro ) 
        VALUES (@0, @1, @2, @3, 0)
      `, [newLocalidadId, domicilio.DomicilioPaisId, domicilio.DomicilioProvinciaId, LocalidadDescripcion])

      domicilio.DomicilioLocalidadId = newLocalidadId
    }

    return domicilio
  }

}