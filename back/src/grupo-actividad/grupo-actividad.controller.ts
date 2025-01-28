import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";


const getOptions: any[] = [
    { label: 'No', value: '1' },
    { label: 'Si', value: '0' },
  ]

const getTipos: any[] = [
    { label: 'Jerarquico', value: 'J' },
    { label: 'Administrativo', value: 'A' },
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
            name: "NumeroOld",
            type: "number",
            id: "GrupoActividadNumeroOld",
            field: "GrupoActividadNumeroOld",
            fieldName: "grup.GrupoActividadNumero,",
            sortable: false,
            hidden: true,
            searchHidden: true
        },
        {
            name: "Detalle",
            type: "string",
            id: "GrupoActividadDetalle",
            field: "GrupoActividadDetalle",
            fieldName: "grup.GrupoActividadDetalle",
            sortable: true,
            searchHidden: false
        },
        {
            name: "Activo",
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

    columnasGrillaResponsables: any[] = [
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
            name: "Grupo Actividad",
            type: "string",
            id: "GrupoActividadDetalle",
            field: "GrupoActividadDetalle",
            fieldName: "ga.GrupoActividadDetalle,",
            sortable: true,
        },
        {
            name: "TIPO",
            id: "GrupoActividadJerarquicoComo",
            field: "GrupoActividadJerarquicoComo",
            fieldName: "jer.GrupoActividadJerarquicoComo,",
            formatter: 'collectionFormatter',
            exportWithFormatter: true,
            params: { collection: getTipos, },
            type: 'string',
            searchComponent: "inpurForGrupoActividad",
  
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
        },
        {
            name: "Apellido Nombre",
            type: "string",
            id: "ApellidoNombrePersona",
            field: "ApellidoNombrePersona",
            fieldName: "ApellidoNombrePersona,",
            sortable: true,
        },
        {
            name: "Desde",
            type: "date",
            id: "GrupoActividadJerarquicoDesde",
            field: "GrupoActividadJerarquicoDesde",
            fieldName: "jer.GrupoActividadJerarquicoDesde,",
            sortable: true,
        },
        {
            name: "Hasta",
            type: "date",
            id: "GrupoActividadJerarquicoHasta",
            field: "GrupoActividadJerarquicoHasta",
            fieldName: "jer.GrupoActividadJerarquicoHasta,",
            sortable: true,
        }
    
    
    ]

    async getGridColsGrupos(req, res) {
        this.jsonRes(this.columnasGrillaGrupos, res);
    }

    async getGridColsResponsables(req, res) {
        this.jsonRes(this.columnasGrillaResponsables, res);
    }


    async getOptions(req, res) {
        this.jsonRes(getOptions, res);
    }

    async getTipos(req, res) {
        this.jsonRes(getTipos, res);
    }

    async listGrupoActividadGrupos(req: any, res: Response, next: NextFunction) {

        console.log("req.body.options.filtros ", req.body.options.filtros)
        const filterSql = filtrosToSql(req.body.options.filtros, this.columnasGrillaGrupos);
        
        const orderBy = orderToSQL(req.body.options.sort)
        const queryRunner = dataSource.createQueryRunner();
        const fechaActual = new Date()

        try {

            const GrupoActividad = await queryRunner.query(
                `SELECT 
                     ROW_NUMBER() OVER (ORDER BY grup.GrupoActividadId) AS id,
                     grup.GrupoActividadId,
                    grup.GrupoActividadNumero,
                    grup.GrupoActividadNumero AS GrupoActividadNumeroOld ,
                    grup.GrupoActividadDetalle,
                    IIF(grup.GrupoActividadInactivo=1, '1', '0') as GrupoActividadInactivo,
                    grup.GrupoActividadSucursalId
                    FROM GrupoActividad grup
                    
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


    async listGrupoActividadResponsables(req: any, res: Response, next: NextFunction) {

        console.log("req.body.options.filtros ", req.body.options.filtros)
        const filterSql = filtrosToSql(req.body.options.filtros, this.columnasGrillaGrupos);
        
        const orderBy = orderToSQL(req.body.options.sort)
        const queryRunner = dataSource.createQueryRunner();
        const fechaActual = new Date()

        try {

            const GrupoActividadResponsables = await queryRunner.query(
                `SELECT 
                    ROW_NUMBER() OVER (ORDER BY ga.GrupoActividadId) AS id,
                    ga.GrupoActividadId,
                    ga.GrupoActividadNumero,
                    ga.GrupoActividadDetalle, 
                    ga.GrupoActividadInactivo,
                    ga.GrupoActividadSucursalId,
                    jer.GrupoActividadJerarquicoId,
                    jer.GrupoActividadJerarquicoComo,
                    jer.GrupoActividadJerarquicoPersonalId,
                    per.PersonalId,
                    CONCAT(TRIM(per.PersonalApellido),', ',TRIM(per.PersonalNombre)) ApellidoNombrePersona,
                    jer.GrupoActividadJerarquicoDesde,
                    jer.GrupoActividadJerarquicoHasta

                FROM GrupoActividadJerarquico jer
                INNER JOIN GrupoActividad ga ON jer.GrupoActividadId = ga.GrupoActividadId
                INNER JOIN Personal per ON per.PersonalId = jer.GrupoActividadJerarquicoPersonalId
                 WHERE ${filterSql}`)

            this.jsonRes(
                {
                    total: GrupoActividadResponsables.length,
                    list: GrupoActividadResponsables,
                },
                res
            );

        } catch (error) {
            return next(error)
        }

    }


      
    async changecellgrupo(req: any, res: Response, next: NextFunction) {

        const ip = this.getRemoteAddress(req)
         const queryRunner = dataSource.createQueryRunner();

         const usuarioIdquery = await queryRunner.query( `SELECT * FROM Usuario WHERE UsuarioId = @0`, [res.locals.PersonalId])
         const usuarioId = usuarioIdquery > 0 ? usuarioIdquery : null

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
 
                 await this.validateFormGrupo(params,queryRunner)

                if(params.GrupoActividadNumero != params.GrupoActividadNumeroOld){

                    let validateGrupoActividadNumero = await queryRunner.query( `SELECT * FROM GrupoActividad WHERE GrupoActividadNumero = @0`, [params.GrupoActividadNumero])

                 if (validateGrupoActividadNumero.length > 0) {
                    throw new ClientException(`El Numero ingresado ya existe`)
                  }
                }

                 await queryRunner.query( `UPDATE GrupoActividad SET GrupoActividadNumero = @1,GrupoActividadDetalle = @2,GrupoActividadInactivo=@3,GrupoActividadSucursalId=@4
                    WHERE GrupoActividadId = @0`, [params.GrupoActividadId,params.GrupoActividadNumero,params.GrupoActividadDetalle,params.GrupoActividadInactivo,params.GrupoActividadSucursalId]) 
              
                dataResultado = {action:'U'}
                message = "Actualizacion exitosa"
               
             } else {  //Es un nuevo registro
              
 
                 console.log('El código no existe - es nuevo')
                 await this.validateFormGrupo(params,queryRunner)

                 let validateGrupoActividadNumero = await queryRunner.query( `SELECT * FROM GrupoActividad WHERE GrupoActividadNumero = @0`, [params.GrupoActividadNumero])

                 if (validateGrupoActividadNumero.length > 0) {
                    throw new ClientException(`El Numero ingresado ya existe`)
                  }

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
                     params.GrupoActividadDetalle,
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

     async changecellResponsable(req: any, res: Response, next: NextFunction) {

        const ip = this.getRemoteAddress(req)
         const queryRunner = dataSource.createQueryRunner();

         const usuarioIdquery = await queryRunner.query( `SELECT * FROM Usuario WHERE UsuarioId = @0`, [res.locals.PersonalId])
         const usuarioId = usuarioIdquery > 0 ? usuarioIdquery : null

         const fechaActual = new Date()
         let message = ""
         const params = req.body
 
         try {
             console.log("params ", params)
             //throw new ClientException(`test`)
             await queryRunner.connect();
             await queryRunner.startTransaction();
    
             
             const codigoExist = await queryRunner.query( `SELECT * FROM GrupoActividadJerarquico WHERE GrupoActividadJerarquicoId = @0`, [params.GrupoActividadJerarquicoId])
             let dataResultado = {}
 
             if ( codigoExist.length > 0) { //Entro en update
                 //Validar si cambio el código
                 console.log(" voy a hacer update")
 
                 await this.validateFormResponsables(params,queryRunner)

                // if(params.GrupoActividadNumero != params.GrupoActividadNumeroOld){

                //     let validateGrupoActividadNumero = await queryRunner.query( `SELECT * FROM GrupoActividad WHERE GrupoActividadNumero = @0`, [params.GrupoActividadNumero])

                //  if (validateGrupoActividadNumero.length > 0) {
                //     throw new ClientException(`El Numero ingresado ya existe`)
                //   }
                // }

                //  await queryRunner.query( `UPDATE GrupoActividad SET GrupoActividadNumero = @1,GrupoActividadDetalle = @2,GrupoActividadInactivo=@3,GrupoActividadSucursalId=@4
                //     WHERE GrupoActividadId = @0`, [params.GrupoActividadId,params.GrupoActividadNumero,params.GrupoActividadDetalle,params.GrupoActividadInactivo,params.GrupoActividadSucursalId]) 
              
                dataResultado = {action:'U'}
                message = "Actualizacion exitosa"
               
             } else {  //Es un nuevo registro
              
 
                 console.log('El código no existe - es nuevo')
                 await this.validateFormResponsables(params,queryRunner)

                //  let validateGrupoActividadNumero = await queryRunner.query( `SELECT * FROM GrupoActividad WHERE GrupoActividadNumero = @0`, [params.GrupoActividadNumero])

                //  if (validateGrupoActividadNumero.length > 0) {
                //     throw new ClientException(`El Numero ingresado ya existe`)
                //   }

                //  let GrupoActividadPersonalUltNro = 0
                //  let GrupoActividadJerarquicoUltNro = 0
                //  let GrupoActividadUsuarioId = usuarioId
                //  let GrupoActividadObjetivoUltNro = 0

                //  let day = new Date()
                //  day.setHours(0, 0, 0, 0)
                //  let time = day.toTimeString().split(' ')[0]


                //  await queryRunner.query(`
                //     INSERT INTO "GrupoActividad" (
                //         "GrupoActividadNumero", 
                //         "GrupoActividadDetalle", 
                //         "GrupoActividadPersonalUltNro", 
                //         "GrupoActividadJerarquicoUltNro", 
                //         "GrupoActividadInactivo", 
                //         "GrupoActividadPuesto", 
                //         "GrupoActividadDia", 
                //         "GrupoActividadTiempo", 
                //         "GrupoActividadUsuarioId", 
                //         "GrupoActividadSucursalId", 
                //         "GrupoActividadObjetivoUltNro"
                //     ) 
                //     VALUES ( @0,@1,@2, @3, @4, @5,@6, @7,@8, @9,@10 )`, 
                //     [params.GrupoActividadNumero,
                //      params.GrupoActividadDetalle,
                //      GrupoActividadPersonalUltNro,
                //      GrupoActividadJerarquicoUltNro,
                //      params.GrupoActividadInactivo,
                //      ip,
                //      day,
                //      time,
                //      GrupoActividadUsuarioId,
                //      params.GrupoActividadSucursalId,
                //      GrupoActividadObjetivoUltNro
                //     ]
                //   );
               
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

     async validateFormGrupo(params:any, queryRunner:any){

        if(!params.GrupoActividadNumero) {
            throw new ClientException(`Debe completar el campo Numero.`)
        }

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


     async validateFormResponsables(params:any, queryRunner:any){

        // - Fecha hasta no puede ser menor a la fecha desde. 
        // - restricciones: por grupo de actividad debe haber un solo J y los A que quieras
        // - eliminación de un a sea que se coloque una fecha hasta, no se elimina

        if(!params. GrupoActividadJerarquicoDesde) {
            throw new ClientException(`Debe completar el campo Desde.`)
        }

        if (params.GrupoActividadJerarquicoDesde > params.GrupoActividadJerarquicoHasta) {
            throw new ClientException("La fecha Hasta no puede ser menor que la fecha Desde.");
        }

     }



}
