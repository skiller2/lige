import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";


const getOptions: any[] = [
    { label: 'Si', value: 'true'},
    { label: 'No', value: 'false ' }
  ]

export class GrupoActividadController extends BaseController {

     columnasGrillaGrupos: any[] = [
        {
            id: "id",
            name: "id",
            field: "id",
            fieldName: "id",
            type: "grup.GrupoActividadId",
            sortable: false,
            hidden: true,
            searchHidden: true
        },
        {
            name: "Numero",
            type: "number",
            id: "GrupoActividadNumero",
            field: "GrupoActividadNumero",
            fieldName: "grup.GrupoActividadNumero,",
            sortable: true,
        },
        {
            name: "Detalle",
            type: "string",
            id: "GrupoActividadDetalle",
            field: "GrupoActividadDetalle",
            fieldName: "grup.GrupoActividadDetalle,",
            sortable: true,
    
        },
        {
            name: "Inactivo",
            id: "GrupoActividadInactivo",
            field: "GrupoActividadInactivo",
            fieldName: "grup.GrupoActividadInactivo",
            formatter: 'collectionFormatter',
            exportWithFormatter: true,
            params: { collection: getOptions, },
            type: 'string',
            searchComponent: "inpurForInactivo",
  
            sortable: true
          },
        {
            name: "Sucursal",
            type: "string",
            id: "SucursalId",
            field: "SucursalId",
            fieldName: "grup.GrupoActividadSucursalId",
            formatter: 'collectionFormatter',
            searchComponent: "inpurForSucursalSearch",
            sortable: true,
            searchHidden: false
        }
    
    ]

    async getGridColsGrupos(req, res) {
        this.jsonRes(this.columnasGrillaGrupos, res);
    }

    async getOptions(req, res) {
        this.jsonRes(getOptions, res);
    }

    async listGrupoActividadGrupos(req: any, res: Response, next: NextFunction) {

        console.log("paso por aca ", req.body.options)
        const filterSql = filtrosToSql(req.body.options.filtros, this.columnasGrillaGrupos);
        const orderBy = orderToSQL(req.body.options.sort)
        const queryRunner = dataSource.createQueryRunner();
        const fechaActual = new Date()

        try {

            const GrupoActividad = await queryRunner.query(
                `SELECT 
                    grup.GrupoActividadId as id,
                    grup.GrupoActividadId,
                    grup.GrupoActividadNumero,
                    grup.GrupoActividadDetalle,
                    grup.GrupoActividadInactivo,
                    grup.GrupoActividadSucursalId,
                    suc.SucursalDescripcion
                    FROM GrupoActividad grup
                    JOIN Sucursal suc ON suc.SucursalId = grup.GrupoActividadSucursalId
                    WHERE ${filterSql} ${orderBy}`)

            this.jsonRes(
                {
                    total: GrupoActividad.length,
                    list: GrupoActividad,
                },
                res
            );

        } catch (error) {
            return next(error)
        }

    }

      
    async changecellgrupo(req: any, res: Response, next: NextFunction) {
        const usuario = res.locals.userName
        const ip = this.getRemoteAddress(req)
         const queryRunner = dataSource.createQueryRunner();
         const fechaActual = new Date()
         let message = ""
         const params = req.body
 
         try {
             console.log("params ", params)

             await queryRunner.connect();
             await queryRunner.startTransaction();
    
             
             const codigoExist = await queryRunner.query( `SELECT *  FROM GrupoActividad WHERE GrupoActividadId = @0`, [params.id])
             let dataResultado = {}
 
             if ( codigoExist.length > 0) { //Entro en update
                 //Validar si cambio el código
                 console.log(" voy a hacer update")
 
                 await this.validateFormGrupo(params)
              
                dataResultado = {action:'U'}
                message = "Actualizacion exitosa"
               
             } else {  //Es un nuevo registro
              
 
                 console.log('El código no existe - es nuevo')
                 await this.validateFormGrupo(params)
               
                dataResultado = {action:'I'}
                message = "Carga de nuevo Registro exitoso"
             }
 
             await queryRunner.commitTransaction()
             return this.jsonRes( dataResultado, res, message)
         } catch (error) {
            await this.rollbackTransaction(queryRunner)
             return next(error)
         }
       
     }

     async validateFormGrupo(params:any){

     }

}
