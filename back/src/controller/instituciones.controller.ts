import { NextFunction, Response } from "express";
import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";
import { QueryRunner } from "typeorm";
import { FileUploadController } from "./file-upload.controller"

const listaColumnas: any[] = [
  {
    id: "id",
    name: "id",
    field: "id",
    fieldName: "id",
    type: "number",
    sortable: false,
    hidden: true,
    searchHidden: true
  },
  {
    name: "Centro de Capacitación",
    type: "number",
    id: "CentroCapacitacionId",
    field: "CentroCapacitacionId",
    fieldName: "cencap.CentroCapacitacionId",
    searchComponent:"inpurForCentroCapacitacionSearch",
    sortable: true,
    hidden: true,
    searchHidden: false
  },
  {
    name: "Nombre",
    type: "string",
    id: "CentroCapacitacionRazonSocial",
    field: "CentroCapacitacionRazonSocial",
    fieldName: "cencap.CentroCapacitacionRazonSocial",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    name: "CUIT",
    type: "string",
    id: "CentroCapacitacionCuit",
    field: "CentroCapacitacionCuit",
    fieldName: "cencap.CentroCapacitacionCuit",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    name: "Activo",
    type: "boolean",
    id: "CentroCapacitacionInactivo",
    field: "CentroCapacitacionInactivo",
    fieldName: "cencap.CentroCapacitacionInactivo",
    searchComponent: "inpurForInactivoBoolean",
    sortable: true,
    hidden: false,
    searchHidden: false
  }
];

const listaColumnasEdit: any[] = [
  {
    id: "id",
    name: "id",
    field: "id",
    fieldName: "id",
    type: "number",
    sortable: false,
    hidden: true,
    searchHidden: true
  },
  {
    id: "CentroCapacitacionSedeId",
    name: "CentroCapacitacionSedeId",
    field: "CentroCapacitacionSedeId",
    fieldName: "CentroCapacitacionSedeId",
    type: "number",
    sortable: false,
    hidden: true,
    searchHidden: true
  },
  {
    id: "CentroCapacitacionId",
    name: "CentroCapacitacionId",
    field: "CentroCapacitacionId",
    fieldName: "CentroCapacitacionId",
    type: "number",
    sortable: false,
    hidden: true,
    searchHidden: true
  },
  {
    name: "Descripción de Sede",
    type: "string",
    id: "CentroCapacitacionSedeDescripcion",
    field: "CentroCapacitacionSedeDescripcion",
    fieldName: "CentroCapacitacionSedeDescripcion",
    sortable: true,
    hidden: false,
    searchHidden: false
  
  }
];

export class InstitucionesController extends BaseController {


  async getGridCols(req, res) {
    this.jsonRes(listaColumnas, res);
  }

  async getGridColsEdit(req, res) {
    this.jsonRes(listaColumnasEdit, res);
  }

  async list(req: any, res: Response, next: NextFunction) {

    const filterSql = filtrosToSql(req.body.options.filtros, listaColumnas);
    const orderBy = orderToSQL(req.body.options.sort)
    const queryRunner = dataSource.createQueryRunner();
    const fechaActual = new Date()
    const anio = fechaActual.getFullYear()
    const mes = fechaActual.getMonth() + 1

    try {
      const instituciones = await queryRunner.query(
        `SELECT 
          ROW_NUMBER() OVER (ORDER BY cencap.CentroCapacitacionId) as id,
          cencap.CentroCapacitacionId

        ,cencap.CentroCapacitacionRazonSocial
        ,cencap.CentroCapacitacionCuit
        ,cencap.CentroCapacitacionInactivo

        FROM CentroCapacitacion cencap
     
        WHERE ${filterSql} ${orderBy}`
      )

      this.jsonRes(
        {
          total: instituciones.length,
          list: instituciones,
        },
        res
      );

    } catch (error) {
      return next(error)
    }

  }

  async listEdit(req: any, res: Response, next: NextFunction) {

  
    const {CentroCapacitacionId} = req.body
    const queryRunner = dataSource.createQueryRunner();

    try {
      const instituciones = await queryRunner.query(
        `SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS id ,CentroCapacitacionId, CentroCapacitacionSedeId, CentroCapacitacionSedeDescripcion FROM CentroCapacitacionSede
        WHERE CentroCapacitacionId = ${CentroCapacitacionId}`
      )

      this.jsonRes(
        {
          total: instituciones.length,
          list: instituciones,
        },
        res
      );

    } catch (error) {
      return next(error)
    }

  }

  async listHistory(req: any, res: Response, next: NextFunction) {


    const {CentroCapacitacionId} = req.body
    const queryRunner = dataSource.createQueryRunner();
 

    try {
      const instituciones = await queryRunner.query(
        `SELECT 
          ROW_NUMBER() OVER (ORDER BY cencap.CentroCapacitacionId) as id,
          cencap.CentroCapacitacionId,
          cencap.CentroCapacitacionRazonSocial,
          cencap.CentroCapacitacionCuit,
          cencap.CentroCapacitacionInactivo,
          sede.CentroCapacitacionSedeId,
          sede.CentroCapacitacionSedeDescripcion
        FROM CentroCapacitacion cencap
        LEFT JOIN CentroCapacitacionSede sede ON sede.CentroCapacitacionId = cencap.CentroCapacitacionId
        WHERE cencap.CentroCapacitacionId = ${CentroCapacitacionId}
        AND sede.CentroCapacitacionSedeId = (
          SELECT MAX(CentroCapacitacionSedeId) 
          FROM CentroCapacitacionSede 
          WHERE CentroCapacitacionId = ${CentroCapacitacionId}
        )`
      )

      this.jsonRes(
        {
          total: instituciones.length,
          list: instituciones,
        },
        res
      );

    } catch (error) {
      return next(error)
    }

  }

  async setSede(req: any, res: Response, next: NextFunction) {

  
    const {CentroCapacitacionId, CentroCapacitacionSedeId, CentroCapacitacionSedeDescripcion} = req.body
    let result = []
    let isNewOrEdit = true
    let maxSedeId = []
    const queryRunner = dataSource.createQueryRunner()
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
   
      if(CentroCapacitacionId > 0 && CentroCapacitacionSedeId > 0){
        // is edit

        await queryRunner.query(`
          UPDATE CentroCapacitacionSede 
          SET CentroCapacitacionSedeDescripcion = @0
          WHERE CentroCapacitacionId = @1 AND CentroCapacitacionSedeId = @2
        `, [CentroCapacitacionSedeDescripcion.trim(), CentroCapacitacionId, CentroCapacitacionSedeId]);

        isNewOrEdit = false

      }else{
        // is new
        isNewOrEdit = true

       maxSedeId = await queryRunner.query(`
        SELECT ISNULL(MAX(CentroCapacitacionSedeId), 0) + 1 AS maxSedeId
        FROM CentroCapacitacionSede
        WHERE CentroCapacitacionId = @0
      `, [CentroCapacitacionId]);
 

      await queryRunner.query(`
        INSERT INTO CentroCapacitacionSede 
        (CentroCapacitacionSedeDescripcion, CentroCapacitacionId,CentroCapacitacionSedeId)
        VALUES (@0, @1, @2)
      `, [CentroCapacitacionSedeDescripcion.trim(), CentroCapacitacionId, maxSedeId?.length > 0 ? maxSedeId[0]?.maxSedeId : CentroCapacitacionSedeId]);


      await queryRunner.query(`UPDATE CentroCapacitacion SET CentroCapacitacionSedeUltNro = @0 WHERE CentroCapacitacionId = @1`, [maxSedeId?.length > 0 ? maxSedeId[0]?.maxSedeId : CentroCapacitacionSedeId, CentroCapacitacionId]);
      
      } 

      const value = CentroCapacitacionSedeId > 0 ? CentroCapacitacionSedeId :  maxSedeId[0]?.maxSedeId 

      result = await queryRunner.query(`
        SELECT * FROM CentroCapacitacionSede 
       WHERE CentroCapacitacionId = @0 AND CentroCapacitacionSedeId = @1
      `, [CentroCapacitacionId, value]);

      await queryRunner.commitTransaction();
      this.jsonRes({ list: result[0] }, res, (!isNewOrEdit) ? `se Actualizó con exito el registro` : `se Agregó con exito el registro`);
    } catch (error) {
      await queryRunner.rollbackTransaction()
      return next(error)
    } finally {
      await queryRunner.release()
    }

  }

  async validateFormInstituciones(CentroCapacitacionCuit:any, CentroCapacitacionRazonSocial:any, CentroCapacitacionInactivo:any) {

 

    if (!CentroCapacitacionCuit) {
      throw new ClientException(`Debe completar el campo Código.`)
    }
    if (!CentroCapacitacionRazonSocial) {
      throw new ClientException(`Debe completar el campo Razón Social.`)
    }
    
  }

  async deleteSede(req: any, res: Response, next: NextFunction) {

    let CentroCapacitacionId = req.query[0]
    let CentroCapacitacionSedeId = req.query[1]
    const queryRunner = dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()
    try {

        if (CentroCapacitacionId ==0 && CentroCapacitacionSedeId == 0) {
            throw new ClientException(`Error al borrar la sede.`)
        }

        await queryRunner.query(`DELETE FROM CentroCapacitacionSede 
          WHERE CentroCapacitacionId = @0 AND CentroCapacitacionSedeId = @1`, [CentroCapacitacionId, CentroCapacitacionSedeId])

        await queryRunner.commitTransaction()
        return this.jsonRes("", res, "Borrado Exitoso")
    } catch (error) {
        await this.rollbackTransaction(queryRunner)
        return next(error)
    }
    
  
  }

}