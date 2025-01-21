import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";


const getOptions: any[] = [
    { label: 'No', value: '0' },
    { label: 'Si', value: '1' },
  ]

export class GrupoActividadController extends BaseController {

     columnasGrillaGrupos: any[] = [
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
            id: "PersonalId",
            field: "PersonalId",
            fieldName: "suc.PersonalId",
            formatter: 'collectionFormatter',
            searchComponent: "inpurForPersonalSearch",
            sortable: true,
            searchHidden: false
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
            field: "GrupoActividadSucursalId",
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
                    CONCAT(grup.GrupoActividadId, '-', suc.PersonalId) AS id,
                    grup.GrupoActividadId,
                    grup.GrupoActividadNumero,
                    grup.GrupoActividadDetalle,
                    IIF(grup.GrupoActividadInactivo=1, '1', '0') as GrupoActividadInactivo,
                    grup.GrupoActividadSucursalId,
                    suc.PersonalId
                    FROM GrupoActividad grup
                   LEFT JOIN Personal suc 
                    ON CONCAT(TRIM(suc.PersonalApellido), ' ', TRIM(suc.PersonalNombre)) = TRIM(grup.GrupoActividadDetalle)
                    
                    WHERE ${filterSql} ORDER BY   grup.GrupoActividadId ASC	`)

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
        const usuarioId = res.locals.PersonalId == 0 ? null : res.locals.PersonalId
        //const usuarioId = 119
        const ip = this.getRemoteAddress(req)
         const queryRunner = dataSource.createQueryRunner();
         const fechaActual = new Date()
         let message = ""
         const params = req.body
 
         try {
             console.log("params ", params)
             //throw new ClientException(`test`)
             await queryRunner.connect();
             await queryRunner.startTransaction();
    
             
             const codigoExist = await queryRunner.query( `SELECT *  FROM GrupoActividad WHERE GrupoActividadId = @0`, [params.GrupoActividadId])
             let dataResultado = {}
 
             if ( codigoExist.length > 0) { //Entro en update
                 //Validar si cambio el código
                 console.log(" voy a hacer update")
 
                 await this.validateFormGrupo(params)
                 let personalidquery = await queryRunner.query( `SELECT *  FROM Personal WHERE PersonalId = @0`, [params.PersonalId])
                 let GrupoActividadDetalle  = `${personalidquery[0].PersonalApellido.trim()} ${personalidquery[0].PersonalNombre.trim()}`

                 await queryRunner.query( `UPDATE GrupoActividad SET GrupoActividadNumero = @1,GrupoActividadDetalle = @2,GrupoActividadInactivo=@3,GrupoActividadSucursalId=@4
                    WHERE GrupoActividadId = @0`, [params.GrupoActividadId,params.GrupoActividadNumero,GrupoActividadDetalle,params.GrupoActividadInactivo,params.GrupoActividadSucursalId]) 
              
                dataResultado = {action:'U'}
                message = "Actualizacion exitosa"
               
             } else {  //Es un nuevo registro
              
 
                 console.log('El código no existe - es nuevo')
                 await this.validateFormGrupo(params)

                 let personalidquery = await queryRunner.query( `SELECT *  FROM Personal WHERE PersonalId = @0`, [params.PersonalId])
                
                 let GrupoActividadDetalle  = `${personalidquery[0].PersonalApellido.trim()} ${personalidquery[0].PersonalNombre.trim()}`

                 let GrupoActividadPersonalUltNro = 0
                 let GrupoActividadJerarquicoUltNro = 0
                 let GrupoActividadUsuarioId = usuarioId
                 let GrupoActividadObjetivoUltNro = 0

                 let day = new Date()
                 day.setHours(0, 0, 0, 0)
                 let time = day.toTimeString().split(' ')[0]


                 await queryRunner.query(`
                    INSERT INTO "GrupoActividad" (
                        "GrupoActividadNumero", 
                        "GrupoActividadDetalle", 
                        "GrupoActividadPersonalUltNro", 
                        "GrupoActividadJerarquicoUltNro", 
                        "GrupoActividadInactivo", 
                        "GrupoActividadPuesto", 
                        "GrupoActividadDia", 
                        "GrupoActividadTiempo", 
                        "GrupoActividadUsuarioId", 
                        "GrupoActividadSucursalId", 
                        "GrupoActividadObjetivoUltNro"
                    ) 
                    VALUES ( @0,@1,@2, @3, @4, @5,@6, @7,@8, @9,@10 )`, 
                    [params.GrupoActividadNumero,
                     GrupoActividadDetalle,
                     GrupoActividadPersonalUltNro,
                     GrupoActividadJerarquicoUltNro,
                     params.GrupoActividadInactivo,
                     ip,
                     day,
                     time,
                     GrupoActividadUsuarioId,
                     params.GrupoActividadSucursalId,
                     GrupoActividadObjetivoUltNro
                    ]
                  );
               
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

     async deleteGrupo(req: any, res: Response, next: NextFunction){

        let cod_grupo_actividad = req.query[0]
        console.log("cod_grupo_actividad ", cod_grupo_actividad)
        //throw new ClientException(`test`)
        const queryRunner = dataSource.createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction()
        try {

            await queryRunner.query( `DELETE FROM GrupoActividad WHERE GrupoActividadId = @0`, [cod_grupo_actividad])
          
            await queryRunner.commitTransaction()
            return this.jsonRes( "", res, "Borrado Exitoso")
        } catch (error) {
           await this.rollbackTransaction(queryRunner)
            return next(error)
        }
    }

     async validateFormGrupo(params:any){
        if(!params.GrupoActividadDetalle && !params.PersonalId) {
            throw new ClientException(`Debe completar el campo Detalle.`)
        }
        if(!params.GrupoActividadInactivo) {
            throw new ClientException(`Debe completar el campo Inactivo.`)
        }
        if(!params.GrupoActividadSucursalId) {
            throw new ClientException(`Debe completar el campo Sucursal.`)
        }
     }

}
