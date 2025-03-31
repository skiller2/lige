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
  },
  {
    name: "Sede ID",
    type: "number",
    id: "CentroCapacitacionSedeId",
    field: "CentroCapacitacionSedeId",
    fieldName: "sede.CentroCapacitacionSedeId",
    sortable: true,
    hidden: true,
    searchHidden: true
  },
  {
    name: "Descripción de Sede",
    type: "string",
    id: "CentroCapacitacionSedeDescripcion",
    field: "CentroCapacitacionSedeDescripcion",
    fieldName: "sede.CentroCapacitacionSedeDescripcion",
    sortable: true,
    hidden: true,
    searchHidden: true
  }
];

export class InstitucionesController extends BaseController {


  async getGridCols(req, res) {
    this.jsonRes(listaColumnas, res);
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

        ,sede.CentroCapacitacionSedeId
        ,sede.CentroCapacitacionSedeDescripcion

        FROM CentroCapacitacion cencap
        LEFT JOIN CentroCapacitacionSede sede ON sede.CentroCapacitacionId=cencap.CentroCapacitacionId
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

  async listHistory(req: any, res: Response, next: NextFunction) {


    const {CentroCapacitacionId} = req.body
    const queryRunner = dataSource.createQueryRunner();
 

    try {
      const instituciones = await queryRunner.query(
        `SELECT 
          ROW_NUMBER() OVER (ORDER BY cencap.CentroCapacitacionId) as id,
          cencap.CentroCapacitacionId

        ,cencap.CentroCapacitacionRazonSocial
        ,cencap.CentroCapacitacionCuit
        ,cencap.CentroCapacitacionInactivo

        ,sede.CentroCapacitacionSedeId
        ,sede.CentroCapacitacionSedeDescripcion

        FROM CentroCapacitacion cencap
        LEFT JOIN CentroCapacitacionSede sede ON sede.CentroCapacitacionId=cencap.CentroCapacitacionId
        WHERE cencap.CentroCapacitacionId = ${CentroCapacitacionId}`
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

  async setInstitucion(req: any, res: Response, next: NextFunction) {

    let { CentroCapacitacionId, CentroCapacitacionCuit, CentroCapacitacionRazonSocial, CentroCapacitacionInactivo,CentroCapacitacionIdForEdit } 
    = req.body

    console.log("req.body", req.body)
    let result = []
    const usuario = res.locals.userName;
    const ip = this.getRemoteAddress(req);

    //throw new ClientException(`test.`)
    CentroCapacitacionInactivo = CentroCapacitacionInactivo ? CentroCapacitacionInactivo : false

    console.log("CentroCapacitacionInactivo", CentroCapacitacionInactivo)

    await this.validateFormInstituciones(CentroCapacitacionCuit, CentroCapacitacionRazonSocial, CentroCapacitacionInactivo)
    const queryRunner = dataSource.createQueryRunner()
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
   
      if(CentroCapacitacionId > 0){
        // is edit

        await queryRunner.query(`
          UPDATE CentroCapacitacion SET
            CentroCapacitacionCuit = @0,
            CentroCapacitacionRazonSocial = @1,
            CentroCapacitacionInactivo = @2
          WHERE CentroCapacitacionId = @3
        `, [
          CentroCapacitacionCuit,
          CentroCapacitacionRazonSocial, 
          CentroCapacitacionInactivo,
          CentroCapacitacionId
        ]);

      }else{
        // is new
      console.log("estoy agregando")


      await queryRunner.query(`
        INSERT INTO CentroCapacitacion (
          CentroCapacitacionCuit,
          CentroCapacitacionRazonSocial,
          CentroCapacitacionInactivo,
          CentroCapacitacionSedeUltNro
        ) VALUES (
          @0, @1, @2, @3
        )`, [
          CentroCapacitacionCuit,
          CentroCapacitacionRazonSocial, 
          CentroCapacitacionInactivo,
          null
        ]);
      
        } 

      await queryRunner.commitTransaction();
      this.jsonRes({ list: result }, res, (CentroCapacitacionId > 0) ? `se Actualizó con exito el registro` : `se Agregó con exito el registro`);
    } catch (error) {
      await queryRunner.rollbackTransaction()
      return next(error)
    } finally {
      await queryRunner.release()
    }

  }

  async setSede(req: any, res: Response, next: NextFunction) {

    console.log("req.body", req.body)
    let result = []
    const usuario = res.locals.userName;
    const ip = this.getRemoteAddress(req);

    throw new ClientException(`test.`)
    // const queryRunner = dataSource.createQueryRunner()
    // await queryRunner.connect();
    // await queryRunner.startTransaction();

    // try {
   
    //   if( > 0){
    //     // is edit

    //     await queryRunner.query(``, []);

    //   }else{
    //     // is new
    //   console.log("estoy agregando")


    //   await queryRunner.query(``, [ ]);
      
    //     } 

    //   await queryRunner.commitTransaction();
    //   this.jsonRes({ list: result }, res, ( > 0) ? `se Actualizó con exito el registro` : `se Agregó con exito el registro`);
    // } catch (error) {
    //   await queryRunner.rollbackTransaction()
    //   return next(error)
    // } finally {
    //   await queryRunner.release()
    // }

  }

  async validateFormInstituciones(CentroCapacitacionCuit:any, CentroCapacitacionRazonSocial:any, CentroCapacitacionInactivo:any) {

 

    if (!CentroCapacitacionCuit) {
      throw new ClientException(`Debe completar el campo Código.`)
    }
    if (!CentroCapacitacionRazonSocial) {
      throw new ClientException(`Debe completar el campo Razón Social.`)
    }
    
  }

}