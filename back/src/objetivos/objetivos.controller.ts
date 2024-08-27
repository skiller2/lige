import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { QueryResult } from "typeorm";
import { AnyError } from "typeorm/browser";

const getOptions: any[] = [
    { label: 'Si', value: 'True' },
    { label: 'No', value: 'False' },
    { label: 'Indeterminado', value: null }
  ]

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
        name: "Codigo",
        type: "number",
        id: "Codigo",
        field: "Codigo",
        fieldName: "Codigo",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Cliente",
        type: "number",
        id: "ClienteId",
        field: "ClienteId",
        fieldName: "obj.ClienteId",
        searchComponent: "inpurForClientSearch",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
    {
        name: "Objetivo",
        type: "number",
        id: "ObjetivoId",
        field: "ObjetivoId",
        fieldName: " obj.ObjetivoId",
        searchComponent: "inpurForObjetivoSearch",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
    
    {
        name: "Razón Social",
        type: "string",
        id: "ClienteDenominacion",
        field: "ClienteDenominacion",
        fieldName: "cli.ClienteDenominacion",
        searchType: "string",
        sortable: true,

        searchHidden: false,
        hidden: false,
    },
    {
        name: "Descripcion Objetivo",
        type: "string",
        id: "Descripcion",
        field: "Descripcion",
        fieldName: "Descripcion",
        searchType: "string",
        searchHidden: false
    },
    {
        name: "Grupo Actividad",
        type: "string",
        id: "GrupoActividadDetalle",
        field: "GrupoActividadDetalle",
        fieldName: " gruac.GrupoActividadDetalle",
        sortable: true,
        searchHidden: true
    },
    {
        name: "Sucursal",
        type: "string",
        id: "SucursalDescripcion",
        field: "SucursalDescripcion",
        fieldName: "suc.SucursalDescripcion",
        sortable: true,
        searchHidden: true
    },
    {
        name: "Contrato Desde",
        type: "date",
        id: "ContratoFechaDesde",
        field: "ContratoFechaDesde",
        fieldName: "ContratoFechaDesde",
        searchComponent: "inpurForFechaSearch",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Contrato Hasta",
        type: "date",
        id: "ContratoFechaHasta",
        field: "ContratoFechaHasta",
        fieldName: "ContratoFechaHasta",
        searchComponent: "inpurForFechaSearch",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
];


export class ObjetivosController extends BaseController {

    
    async getGridCols(req, res) {
        this.jsonRes(listaColumnas, res);
    }

    async list(req: any, res: Response, next: NextFunction) {

        const filterSql = filtrosToSql(req.body.options.filtros, listaColumnas);
        const orderBy = orderToSQL(req.body.options.sort)
        const queryRunner = dataSource.createQueryRunner();
        const fechaActual = new Date()
        const anio = fechaActual.getFullYear()
        const mes = fechaActual.getMonth()+1

        try {
            const objetivos = await queryRunner.query(
                `SELECT 
-- DISTINCT
                obj.ObjetivoId,
                obj.ObjetivoId id, 
                obj.ClienteId,
                obj.ClienteElementoDependienteId,
                CONCAT(obj.ClienteId, '/', ISNULL(obj.ClienteElementoDependienteId,0)) AS Codigo, 
                cli.ClienteDenominacion,
                ISNULL(eledep.ClienteElementoDependienteDescripcion,cli.ClienteDenominacion) Descripcion,                
--                obj.ObjetivoDescripcion AS Descripcion2, --Basura
                gap.GrupoActividadId,
                ga.GrupoActividadDetalle,
                suc.SucursalDescripcion,
                ISNULL(eledepcon.ClienteElementoDependienteContratoFechaDesde, clicon.ClienteContratoFechaDesde) AS ContratoFechaDesde,
                ISNULL(eledepcon.ClienteElementoDependienteContratoFechaHasta, clicon.ClienteContratoFechaHasta) AS ContratoFechaHasta,
 1
                FROM Objetivo obj 
                LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
                LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteId = obj.ClienteId AND eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
					 
					 

					LEFT JOIN (SELECT cc.ClienteId, MAX(cc.ClienteContratoId) ClienteContratoId FROM  ClienteContrato cc WHERE EOMONTH(DATEFROMPARTS(@0,@1,1)) >= cc.ClienteContratoFechaDesde 
                    AND ISNULL(cc.ClienteContratoFechaHasta, '9999-12-31') >= DATEFROMPARTS(@0,@1,1)
                    AND ISNULL(cc.ClienteContratoFechaFinalizacion, '9999-12-31') >= DATEFROMPARTS(@0,@1,1)
					GROUP BY cc.ClienteId) clicon2 ON clicon2.ClienteId = cli.ClienteId AND obj.ClienteElementoDependienteId IS null

					 LEFT JOIN  ClienteContrato clicon ON clicon.ClienteId = cli.ClienteId AND clicon.ClienteContratoId = clicon2.ClienteContratoId
					 
					 
					LEFT JOIN (SELECT ec.ClienteId, ec.ClienteElementoDependienteId, MAX(ec.ClienteElementoDependienteContratoId) ClienteElementoDependienteContratoId FROM ClienteElementoDependienteContrato ec WHERE  EOMONTH(DATEFROMPARTS(@0,@1,1)) >= ec.ClienteElementoDependienteContratoFechaDesde 
                    AND ISNULL(ec.ClienteElementoDependienteContratoFechaHasta, '9999-12-31') >= DATEFROMPARTS(@0,@1,1)
                    AND ISNULL(ec.ClienteElementoDependienteContratoFechaFinalizacion, '9999-12-31') >= DATEFROMPARTS(@0,@1,1)
                GROUP BY ec.ClienteId, ec.ClienteElementoDependienteId
						
					) eledepcon2 ON eledepcon2.ClienteId = obj.ClienteId AND eledepcon2.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
					 
					 
					 LEFT JOIN ClienteElementoDependienteContrato eledepcon ON eledepcon.ClienteId = obj.ClienteId  AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId  AND eledepcon.ClienteElementoDependienteContratoId = eledepcon2.ClienteElementoDependienteContratoId
                          
   				LEFT JOIN (SELECT GrupoActividadObjetivoObjetivoId, MAX(GrupoActividadObjetivoId) GrupoActividadObjetivoId FROM GrupoActividadObjetivo
   				WHERE EOMONTH(DATEFROMPARTS(@0,@1,1)) >= GrupoActividadObjetivoDesde AND DATEFROMPARTS(@0,@1,1) <= ISNULL(GrupoActividadObjetivoHasta,'9999-12-31') 
   				GROUP BY GrupoActividadObjetivoObjetivoId
					) gap2 ON gap2.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId 
      
                LEFT JOIN GrupoActividadObjetivo gap ON gap.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND gap.GrupoActividadObjetivoId=gap2.GrupoActividadObjetivoId
                LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId
		                    
                LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(eledep.ClienteElementoDependienteSucursalId ,cli.ClienteSucursalId)
                

                WHERE ${filterSql} ${orderBy}`, [anio,mes])

            console.log("..............." , objetivos.length)

            this.jsonRes(
                {
                    total: objetivos.length,
                    list: objetivos,
                },
                res
            );

        } catch (error) {
            return next(error)
        }

    }

    async getDescuento(req, res) {
        this.jsonRes(getOptions, res);
      }

    async infObjetivo(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.startTransaction()
            const ObjetivoId = req.params.ObjetivoId
            const ClienteId = req.params.ClienteId
            const ClienteElementoDependienteId = req.params.ClienteElementoDependienteId
            let infObjetivo = await this.getObjetivoQuery(queryRunner, ObjetivoId,ClienteId,ClienteElementoDependienteId)
            let infoCoordinadorCuenta = await this.getCoordinadorCuentaQuery(queryRunner, ObjetivoId)

            infObjetivo = infObjetivo[0]
            infObjetivo.infoCoordinadorCuenta = infoCoordinadorCuenta

            await queryRunner.commitTransaction()
            return this.jsonRes(infObjetivo, res)
        } catch (error) {
            this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    

    async getCoordinadorCuentaQuery(queryRunner: any, ObjetivoId: any) {
        return await queryRunner.query(`SELECT
                ObjetivoId,
                ObjetivoPersonalJerarquicoId,
                ObjetivoPersonalJerarquicoPersonalId as PersonaId,
                ObjetivoPersonalJerarquicoComision,
                ObjetivoPersonalJerarquicoDescuentos FROM ObjetivoPersonalJerarquico

                WHERE 
                ObjetivoPersonalJerarquicoComo = 'C' 
                AND ObjetivoId = @0`,
            [ObjetivoId])
    }


    async getObjetivoQuery(queryRunner: any, ObjetivoId: any, ClienteId:any,ClienteElementoDependienteId: any) {
        const fechaActual = new Date()
        const anio = fechaActual.getFullYear()
        const mes = fechaActual.getMonth()+1
        return await queryRunner.query(`SELECT obj.ObjetivoId
            ,obj.ObjetivoId AS id
            ,obj.ClienteId
            ,obj.ClienteElementoDependienteId
            ,ISNULL(eledep.ClienteElementoDependienteDescripcion, cli.ClienteDenominacion) AS Descripcion
            ,suc.SucursalDescripcion
            ,suc.SucursalId
            ,ISNULL(eledepcon.ClienteElementoDependienteContratoFechaDesde, clicon.ClienteContratoFechaDesde) AS ContratoFechaDesde
            ,ISNULL(eledepcon.ClienteElementoDependienteContratoFechaHasta, clicon.ClienteContratoFechaHasta) AS ContratoFechaHasta
            ,eledepcon.ClienteElementoDependienteContratoId
            ,domcli.ClienteElementoDependienteDomicilioDomCalle
            ,domcli.ClienteElementoDependienteDomicilioDomNro
            ,domcli.ClienteElementoDependienteDomicilioCodigoPostal
            ,domcli.ClienteElementoDependienteDomicilioPaisId
            ,domcli.ClienteElementoDependienteDomicilioProvinciaId
            ,domcli.ClienteElementoDependienteDomicilioLocalidadId
            ,domcli.ClienteElementoDependienteDomicilioBarrioId
            ,domcli.ClienteElementoDependienteDomicilioDomLugar
            ,domcli.ClienteElementoDependienteDomicilioId
        FROM Objetivo obj
        LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
        LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteId = obj.ClienteId
            AND eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
        LEFT JOIN (
            SELECT cc.ClienteId
                ,MAX(cc.ClienteContratoId) AS ClienteContratoId
            FROM ClienteContrato cc
            WHERE EOMONTH(DATEFROMPARTS(@3, @4, 1)) >= cc.ClienteContratoFechaDesde
                AND ISNULL(cc.ClienteContratoFechaHasta, '9999-12-31') >= DATEFROMPARTS(@3,  @4, 1)
                AND ISNULL(cc.ClienteContratoFechaFinalizacion, '9999-12-31') >= DATEFROMPARTS(@3,  @4, 1)
            GROUP BY cc.ClienteId
            ) clicon2 ON clicon2.ClienteId = cli.ClienteId
            AND obj.ClienteElementoDependienteId IS NULL
        LEFT JOIN (
            SELECT ec.ClienteId
                ,ec.ClienteElementoDependienteId
                ,MAX(ec.ClienteElementoDependienteContratoId) AS ClienteElementoDependienteContratoId
            FROM ClienteElementoDependienteContrato ec
            WHERE EOMONTH(DATEFROMPARTS(@3, @4, 1)) >= ec.ClienteElementoDependienteContratoFechaDesde
                AND ISNULL(ec.ClienteElementoDependienteContratoFechaHasta, '9999-12-31') >= DATEFROMPARTS(@3, @4, 1)
                AND ISNULL(ec.ClienteElementoDependienteContratoFechaFinalizacion, '9999-12-31') >= DATEFROMPARTS(@3,  @4, 1)
            GROUP BY ec.ClienteId
                ,ec.ClienteElementoDependienteId
            ) eledepcon2 ON eledepcon2.ClienteId = obj.ClienteId
            AND eledepcon2.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
        LEFT JOIN ClienteElementoDependienteContrato eledepcon ON eledepcon.ClienteId = obj.ClienteId
            AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
            AND eledepcon.ClienteElementoDependienteContratoId = eledepcon2.ClienteElementoDependienteContratoId
        LEFT JOIN ClienteContrato clicon ON clicon.ClienteId = cli.ClienteId
            AND clicon.ClienteContratoId = clicon2.ClienteContratoId
        LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(eledep.ClienteElementoDependienteSucursalId, cli.ClienteSucursalId)
        LEFT JOIN (
            SELECT TOP 1 domcli.ClienteElementoDependienteDomicilioId
                ,domcli.ClienteId
                ,domcli.ClienteElementoDependienteId
                ,domcli.ClienteElementoDependienteDomicilioDomCalle
                ,domcli.ClienteElementoDependienteDomicilioDomNro
                ,domcli.ClienteElementoDependienteDomicilioCodigoPostal
                ,domcli.ClienteElementoDependienteDomicilioPaisId
                ,domcli.ClienteElementoDependienteDomicilioProvinciaId
                ,domcli.ClienteElementoDependienteDomicilioLocalidadId
                ,domcli.ClienteElementoDependienteDomicilioBarrioId
                ,domcli.ClienteElementoDependienteDomicilioDomLugar
            FROM ClienteElementoDependienteDomicilio AS domcli
            WHERE domcli.ClienteId = @1
                AND domcli.ClienteElementoDependienteId = @2
            ORDER BY domcli.ClienteElementoDependienteDomicilioId DESC
            ) AS domcli ON domcli.ClienteId = cli.ClienteId
            AND domcli.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
        WHERE obj.ObjetivoId = @0;`,
            [ObjetivoId,ClienteId,ClienteElementoDependienteId,anio,mes])
    }


    
    async updateObjetivo(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
    
        try {
            await queryRunner.startTransaction()
            const usuario = res.locals.userName
            const ip = this.getRemoteAddress(req)
            const ObjetivoId = Number(req.params.id)
            const Obj =  {...req.body[0]}

            console.log("voy a hacer update ", Obj)

            //validaciones

            //await this.FormValidations(Obj)

            const ClienteFechaAlta = new Date(Obj.ClienteFechaAlta)
            ClienteFechaAlta.setHours(0, 0, 0, 0)

            //update


            await this.updateContratoTable(queryRunner,Obj.ClienteId,Obj.ClienteElementoDependienteId,Obj.ClienteElementoDependienteContratoId,Obj.ContratoFechaDesde,Obj.ContratoFechaHasta)

            await this.updateObjetivoDomicilioTable(
                 queryRunner
                ,Obj.ClienteId
                ,Obj.ClienteElementoDependienteId
                ,Obj.ClienteElementoDependienteDomicilioId
                ,Obj.ClienteElementoDependienteDomicilioDomCalle
                ,Obj.ClienteElementoDependienteDomicilioDomNro
                ,Obj.ClienteElementoDependienteDomicilioCodigoPostal
                ,Obj.ClienteElementoDependienteDomicilioProvinciaId 
                ,Obj.ClienteElementoDependienteDomicilioLocalidadId 
                ,Obj.ClienteElementoDependienteDomicilioBarrioId
                ,Obj.ClienteElementoDependienteDomicilioDomLugar)

            await this.updateClienteElementoDependiente(queryRunner,Obj.ClienteId,Obj.ClienteElementoDependienteId,Obj.SucursalId,Obj.SucursalDescripcion)    

            // let ClienteAdministradorId = null

            // if (ObjCliente.AdministradorId != null && ObjCliente.AdministradorId != "")
            //     {
            //         if (ObjCliente.ClienteAdministradorUltNro != null)
            //         {
            //             ClienteAdministradorId = ObjCliente.ClienteAdministradorUltNro
            //             await this.updateAdministradorTable(queryRunner,ClienteId,ObjCliente.ClienteAdministradorUltNro,ObjCliente.AdministradorId)
            //         }
            //          else
            //         {
            //              ClienteAdministradorId = 1   
            //             await this.insertClienteAdministrador(queryRunner,ClienteId,ClienteAdministradorId,ObjCliente.ClienteFechaAlta,ObjCliente.AdministradorId) 
            //         }
            //     }else if (ObjCliente.ClienteAdministradorUltNro != null){
            //             // delete
            //           await this.DeleteClienteAdministrador(queryRunner,ObjCliente,ClienteId)
            // }

            // await this.updateClienteTable(queryRunner,ClienteId,ObjCliente.CLienteNombreFantasia,ObjCliente.ClienteDenominacion,ClienteFechaAlta,ClienteAdministradorId)
            // await this.updateFacturaTable(queryRunner,ClienteId,ObjCliente.ClienteFacturacionId,ObjCliente.ClienteFacturacionCUIT,ObjCliente.ClienteCondicionAnteIVAId)   

            
            //ACA SE EVALUA Y SE ELIMINA EL CASO QUE SE BORRE ALGUN REGISTRO DE CLIENTE CONTACTO EXISTENTE
            // const numerosQueNoPertenecen = clienteContactoIds.filter(num => {
            //     return !ObjCliente.infoClienteContacto.some(obj => obj.ClienteContactoId === num && obj.ClienteContactoId !== 0);
            // });

            // for (const obj of ObjCliente.infoClienteContacto) {

            //     if(numerosQueNoPertenecen?.length > 0) {

            //         await this.deleteClienteContactoTable(queryRunner,ClienteId, obj.ClienteContactoId)
            //         await this.deleteClienteContactoEmailTable(queryRunner,ClienteId,obj.ClienteContactoEmailId,obj.ClienteContactoId)
            //         await this.deleteClienteContactoTelefonoTable(queryRunner,ClienteId,obj.ClienteContactoTelefonoId,obj.ClienteContactoId)

            //     }else{
            //         if (clienteContactoIds.includes(obj.ClienteContactoId) && obj.ClienteContactoId !== 0) {
            //             //update
            //               await this.updateClienteContactoTable(queryRunner,ClienteId,obj.ClienteContactoId,obj.nombre,obj.ClienteContactoApellido,obj.area)
      
            //               if(obj.ClienteContactoEmailUltNro != null){
      
            //                   await this.updateClienteContactoEmailTable(queryRunner,ClienteId,obj.ClienteContactoId,obj.ClienteContactoEmailUltNro,obj.correo)
            //               }
      
            //               if(obj.ClienteContactoTelefonoUltNro != null){
      
            //                   await this.updateClienteContactoTelefonoTable(queryRunner,ClienteId,obj.ClienteContactoId,obj.ClienteContactoTelefonoUltNro,obj.telefono)
            //               }
                         
            //           } else {
            //              // Insert
            //              maxClienteContactoId += 1
            //              maxClienteContactoTelefonoId += 1
            //              maxClienteContactoEmailId += 1
      
            //              await this.insertClienteContactoTable(queryRunner,ClienteId,maxClienteContactoId,obj.nombre,obj.ClienteContactoApellido,obj.area,maxClienteContactoTelefonoId,maxClienteContactoEmailId)
      
            //              await this.insertClienteContactoEmailTable(queryRunner,ClienteId,maxClienteContactoId,maxClienteContactoEmailId,obj.correo)
      
            //              await this.insertClienteContactoTelefonoTable(queryRunner,ClienteId,maxClienteContactoId,maxClienteContactoTelefonoId,obj.telefono,obj.TipoTelefonoId,
            //               obj.ClienteContactoTelefonoCodigoArea)
      
            //           }
            //     }    

            // }

            // if(req.body.length > 1){
            //  const [, ...newArray] = req.body;
            //  await FileUploadController.handlePDFUpload(ClienteId,'Cliente',newArray,usuario,ip ) 
            // }

            await queryRunner.commitTransaction()
            return this.jsonRes([], res, 'Modificación  Exitosa');
        }catch (error) {
            this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async updateClienteElementoDependiente(
        queryRunner: any,
        ClienteId: number,
        ClienteElementoDependienteId:any,
        SucursalId:any, 
        SucursalDescripcion:any
    ) {

        return await queryRunner.query(`
            UPDATE ClienteElementoDependiente
            SET ClienteElementoDependienteSucursalId = @2, ClienteElementoDependienteDescripcion = @3,ClienteId =@4
            WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1 `,
            [ClienteId,ClienteElementoDependienteId,SucursalId,SucursalDescripcion,ClienteId])
    }

    async updateContratoTable(queryRunner: any, 
        ClienteId:any, 
        ClienteElementoDependienteId:any,
        ClienteElementoDependienteContratoId:any,
        ClienteElementoDependienteContratoFechaDesde:any,
        ClienteElementoDependienteContratoFechaHasta:any
    ) {

        const FechaDesde = new Date(ClienteElementoDependienteContratoFechaDesde)
        FechaDesde.setHours(0, 0, 0, 0)

        const FechaHasta = new Date(ClienteElementoDependienteContratoFechaHasta)
        FechaHasta.setHours(0, 0, 0, 0)

        return await queryRunner.query(`
            UPDATE ClienteElementoDependienteContrato
            SET ClienteElementoDependienteContratoFechaDesde = @3, ClienteElementoDependienteContratoFechaHasta @4
            WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1 AND ClienteElementoDependienteContratoId = @2`,
            [ClienteId,ClienteElementoDependienteId,ClienteElementoDependienteContratoId,FechaDesde, FechaHasta])
    }


    async updateObjetivoDomicilioTable(
        queryRunner: any
       ,ClienteId: number
       ,ClienteElementoDependienteId:any
       ,ClienteElementoDependienteDomicilioId: number
       ,ClienteElementoDependienteDomicilioDomCalle: string
       ,ClienteElementoDependienteDomicilioDomNro: string
       ,ClienteElementoDependienteDomicilioCodigoPostal: string
       ,ClienteElementoDependienteDomicilioProvinciaId: any
       ,ClienteElementoDependienteDomicilioLocalidadId: any
       ,ClienteElementoDependienteDomicilioBarrioId: any
       ,ClienteElementoDependienteDomicilioDomLugar:any){

       await queryRunner.query(`UPDATE ClienteElementoDependienteDomicilio
       SET ClienteElementoDependienteDomicilioDomCalle = @2,ClienteElementoDependienteDomicilioDomNro = @3, ClienteElementoDependienteDomicilioCodigoPostal = @4, 
       ClienteElementoDependienteDomicilioProvinciaId = @5,ClienteElementoDependienteDomicilioLocalidadId = @6,ClienteElementoDependienteDomicilioBarrioId = @7,
       ClienteElementoDependienteDomicilioDomLugar=@8
       WHERE ClienteId = @0 AND ClienteDomicilioId = @1 AND ClienteElementoDependienteId = @9`,[
           ClienteId,
           ClienteElementoDependienteDomicilioId,
           ClienteElementoDependienteDomicilioDomCalle,
           ClienteElementoDependienteDomicilioDomNro,
           ClienteElementoDependienteDomicilioCodigoPostal,
           ClienteElementoDependienteDomicilioProvinciaId,ClienteElementoDependienteDomicilioLocalidadId,
           ClienteElementoDependienteDomicilioBarrioId,ClienteElementoDependienteDomicilioDomLugar,ClienteElementoDependienteId
        ])
    }


    async FormValidations(form:any){
    
    
        if(!form.ClienteId) {
           throw new ClientException(`El campo Cliente NO pueden estar vacio.`)
        }

        if(!form.Descripcion) {
           throw new ClientException(`El campo Descripcion NO pueden estar vacio.`)
        }

        if(!form.SucursalId) {
            throw new ClientException(`El campo Sucursal NO pueden estar vacio.`)
        } 

        if(!form.ContratoFechaDesde) {
           throw new ClientException(`El campo Contrato Desde NO pueden estar vacio.`)
        }

        if(!form.ContratoFechaHasta) {
            throw new ClientException(`El campo Contrato Hasta NO pueden estar vacio.`)
         }

        //Domicilio

        if(!form.ClienteElementoDependienteDomicilioDomCalle) {
            throw new ClientException(`El campo Dirección Calle NO pueden estar vacio.`)
         }
 
         if(!form.ClienteElementoDependienteDomicilioDomNro) {
            throw new ClientException(`El campo Nro NO pueden estar vacio.`)
         }
 
         if(!form.ClienteElementoDependienteDomicilioCodigoPostal) {
             throw new ClientException(`El campo Cod Postal NO pueden estar vacio.`)
         }
 
         if(!form.ClienteElementoDependienteDomicilioProvinciaId) {
            throw new ClientException(`El campo Provincia Ante IVA NO pueden estar vacio.`)
         }

         if(!form.ClienteElementoDependienteDomicilioLocalidadId) {
            throw new ClientException(`El campo Localidad NO pueden estar vacio.`)
         }

         

        // Coordinador de cuenta

         for(const obj of form.infoCoordinadorContacto){

            if(!obj.PersonaId) {
                throw new ClientException(`El campo Nombre en cliente contacto NO pueden estar vacio.`)
             }

             if(!obj.ObjetivoPersonalJerarquicoComision) {
                throw new ClientException(`El campo Comision NO pueden estar vacio.`)
             }

             if(!obj.ObjetivoPersonalJerarquicoDescuentos) {
                throw new ClientException(`El campo Descuento NO pueden estar vacio.`)
 
             }

         }

        

    } 
}
