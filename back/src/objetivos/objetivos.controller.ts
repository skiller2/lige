import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { ClientesController } from "../clientes/clientes.controller"
import { FileUploadController } from "../controller/file-upload.controller"
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
        searchComponent:"inpurForSucursalSearch",
        sortable: true,
        hidden: false,
        searchHidden: false
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
        if(ClienteElementoDependienteId != "null"){
            return await queryRunner.query(`SELECT obj.ObjetivoId
                ,obj.ObjetivoId AS id
                ,obj.ClienteId
                ,obj.ClienteElementoDependienteId
                ,ISNULL(eledep.ClienteElementoDependienteDescripcion, cli.ClienteDenominacion) AS Descripcion
                ,suc.SucursalDescripcion
                ,suc.SucursalId
                ,ISNULL(eledepcon.ClienteElementoDependienteContratoFechaDesde, clicon.ClienteContratoFechaDesde) AS ContratoFechaDesde
                ,ISNULL(eledepcon.ClienteElementoDependienteContratoFechaHasta, clicon.ClienteContratoFechaHasta) AS ContratoFechaHasta
                ,eledepcon.ClienteElementoDependienteContratoId AS ContratoId
                ,domcli.ClienteElementoDependienteDomicilioDomCalle AS DomicilioDomCalle
                ,domcli.ClienteElementoDependienteDomicilioDomNro AS DomicilioDomNro
                ,domcli.ClienteElementoDependienteDomicilioCodigoPostal AS DomicilioCodigoPostal
                ,domcli.ClienteElementoDependienteDomicilioPaisId AS DomicilioPaisId
                ,domcli.ClienteElementoDependienteDomicilioProvinciaId AS DomicilioProvinciaId
                ,domcli.ClienteElementoDependienteDomicilioLocalidadId AS DomicilioLocalidadId
                ,domcli.ClienteElementoDependienteDomicilioBarrioId AS DomicilioBarrioId
                ,domcli.ClienteElementoDependienteDomicilioDomLugar AS DomicilioDomLugar
                ,domcli.ClienteElementoDependienteDomicilioId AS DomicilioId
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
                    AND domcli.ClienteElementoDependienteDomicilioDomicilioActual = 1
                ORDER BY domcli.ClienteElementoDependienteDomicilioId DESC
                ) AS domcli ON domcli.ClienteId = cli.ClienteId
                AND domcli.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
            WHERE obj.ObjetivoId = @0;`,
                [ObjetivoId,ClienteId,ClienteElementoDependienteId,anio,mes])
        }else{
            return await queryRunner.query(`
                SELECT cli.ClienteId AS id
                ,cli.ClienteId
                ,fac.ClienteFacturacionCUIT
                ,fac.ClienteFacturacionId
                ,fac.CondicionAnteIVAId
                ,TRIM(con.CondicionAnteIVADescripcion) AS CondicionAnteIVADescripcion
                ,TRIM(cli.ClienteDenominacion) AS Descripcion 
                ,TRIM(cli.CLienteNombreFantasia) AS CLienteNombreFantasia
                ,cli.ClienteFechaAlta AS ContratoFechaDesde
                ,cli.ClienteAdministradorUltNro
                ,cli.ClienteSucursalId AS SucursalId
                ,clicon.ClienteContratoFechaDesde AS ContratoFechaDesde
	            ,clicon.ClienteContratoFechaHasta AS ContratoFechaHasta
                ,clicon.ClienteContratoId = ContratoId
                ,domcli.ClienteDomicilioId AS DomicilioId
                ,TRIM(domcli.ClienteDomicilioDomCalle) AS DomicilioDomCalle
                ,TRIM(domcli.ClienteDomicilioDomNro) AS DomicilioDomNro
                ,TRIM(domcli.ClienteDomicilioCodigoPostal) AS DomicilioCodigoPostal
                ,domcli.ClienteDomicilioPaisId AS DomicilioPaisId
                ,domcli.ClienteDomicilioProvinciaId AS DomicilioProvinciaId
                ,domcli.ClienteDomicilioLocalidadId AS DomicilioLocalidadId
                ,domcli.ClienteDomicilioBarrioId AS DomicilioBarrioId
                ,TRIM(domcli.ClienteDomicilioDomLugar) AS DomicilioDomLugar
                ,TRIM(adm.AdministradorNombre) AS AdministradorNombre
                ,TRIM(adm.AdministradorApellido) AS AdministradorApellido
                ,adm.AdministradorId
            FROM Cliente cli
            LEFT JOIN ClienteFacturacion fac ON fac.ClienteId = cli.ClienteId
                AND fac.ClienteFacturacionDesde <=  DATEFROMPARTS(@1,@2, 1)
                AND ISNULL(fac.ClienteFacturacionHasta, '9999-12-31') >=  DATEFROMPARTS(@1,@2, 1)
            LEFT JOIN CondicionAnteIVA con ON con.CondicionAnteIVAId = fac.CondicionAnteIVAId
            LEFT JOIN (
                SELECT TOP 1 domcli.ClienteDomicilioId
                    ,domcli.ClienteId
                    ,domcli.ClienteDomicilioDomCalle
                    ,domcli.ClienteDomicilioDomNro
                    ,domcli.ClienteDomicilioCodigoPostal
                    ,domcli.ClienteDomicilioPaisId
                    ,domcli.ClienteDomicilioProvinciaId
                    ,domcli.ClienteDomicilioLocalidadId
                    ,domcli.ClienteDomicilioBarrioId
                    ,domcli.ClienteDomicilioDomLugar
                FROM ClienteDomicilio AS domcli
                WHERE domcli.ClienteId = @0
                    AND domcli.ClienteDomicilioActual = 1
                ORDER BY domcli.ClienteDomicilioId DESC
                ) AS domcli ON domcli.ClienteId = cli.ClienteId
            LEFT JOIN (
                SELECT cc.ClienteId
                    ,MAX(cc.ClienteContratoId) AS ClienteContratoId
                FROM ClienteContrato cc
                WHERE EOMONTH(DATEFROMPARTS(@1, @2, 1)) >= cc.ClienteContratoFechaDesde
                    AND ISNULL(cc.ClienteContratoFechaHasta, '9999-12-31') >= DATEFROMPARTS(@1, @2, 1)
                    AND ISNULL(cc.ClienteContratoFechaFinalizacion, '9999-12-31') >= DATEFROMPARTS(@1, @2, 1)
                GROUP BY cc.ClienteId
                ) clicon2 ON clicon2.ClienteId = cli.ClienteId
            LEFT JOIN ClienteContrato clicon ON clicon.ClienteId = cli.ClienteId
                AND clicon.ClienteContratoId = clicon2.ClienteContratoId     
            LEFT JOIN (
                SELECT TOP 1 ca.ClienteId
                    ,ca.ClienteAdministradorAdministradorId AS AdministradorId
                    ,adm.AdministradorNombre
                    ,adm.AdministradorApellido
                FROM ClienteAdministrador ca
                JOIN Administrador adm ON adm.AdministradorId = ca.ClienteAdministradorAdministradorId
                WHERE ca.ClienteId = @0
                ORDER BY ca.ClienteAdministradorId DESC
                ) AS adm ON adm.ClienteId = cli.ClienteId


            WHERE cli.ClienteId = @0;`,
                [ClienteId,anio,mes])
        }
       
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

            if(Obj.ClienteElementoDependienteId != "null") {

                //SI EL ELEMENTO DEPENDIENTE ES DIFERENTE NULL SOLO ACTUALIZA TABLAS DE ELEMENTO DEPENDIENTE
                await this.updateClienteElementoDependienteContratoTable(queryRunner,Obj.ClienteId,Obj.ClienteElementoDependienteId,Obj.ContratoId,Obj.ContratoFechaDesde,Obj.ContratoFechaHasta)
                
                let domicilioString = `${Obj.DomicilioDomCalle}, ${Obj.DomicilioDomNro}, ${Obj.DomicilioCodigoPostal}, ${Obj.DomicilioProvinciaId}, ${Obj.DomicilioLocalidadId}, ${Obj.DomicilioBarrioId}, ${Obj.DomicilioDomLugar}`.toLowerCase();

                if(Obj.DomicilioFulllAdress != domicilioString){

                    await this.updateObjetivoDomicilioTable(
                        queryRunner
                       ,Obj.ClienteId
                       ,Obj.DependienteId
                       ,Obj.DomicilioId
                       ,Obj.DomicilioDomCalle
                       ,Obj.DomicilioDomNro
                       ,Obj.DomicilioCodigoPostal
                       ,Obj.DomicilioProvinciaId 
                       ,Obj.DomicilioLocalidadId 
                       ,Obj.DomicilioBarrioId
                       ,Obj.DomicilioDomLugar)

                }

                await this.updateClienteElementoDependienteTable(queryRunner,ObjetivoId,Obj.ClienteId,Obj.Descripcion,Obj.SucursalId)  
    
    
            }else{
                //SI EL ELEMENTO DEPENDIENTE ES NULL SOLO ACTUALIZA TABLAS DE CLIENTE
                await  ClientesController.updateClienteDomicilioTable( queryRunner
                    ,Obj.ClienteId
                    ,Obj.DomicilioId
                    ,Obj.DomicilioDomCalle
                    ,Obj.DomicilioDomNro
                    ,Obj.DomicilioCodigoPostal
                    ,Obj.DomicilioProvinciaId 
                    ,Obj.DomicilioLocalidadId 
                    ,Obj.DomicilioBarrioId
                    ,Obj.DomicilioDomLugar)

                await this.updateClienteContratoTable(queryRunner,Obj.ClienteId,Obj.ContratoId,Obj.ContratoFechaDesde,Obj.ContratoFechaHasta)

                await this.updateClienteTable(queryRunner,ObjetivoId,Obj.ClienteId,Obj.Descripcion,Obj.SucursalId) 
                    
            }
            

            const infoObjetivo = await this.getCoordinadorCuentaQuery(queryRunner, ObjetivoId)
            const ObjetivoCoordinadorIds = infoObjetivo.map(row => row.ObjetivoId)

            //ACA SE EVALUA Y SE ELIMINA EL CASO QUE SE BORRE ALGUN REGISTRO DE COORDINADOR DE CUENTA EXISTENTE

            const numerosQueNoPertenecen = ObjetivoCoordinadorIds.filter(num => {
                return !Obj.infoCoordinadorCuenta.some(value => value.ObjetivoId === num && value.ObjetivoId !== 0);
            });
           
            for (const objetivo of Obj.infoCoordinadorCuenta) {

                 if(numerosQueNoPertenecen?.length > 0) {

                    await this.deleteCoordinadorCuentaQuery(queryRunner,ObjetivoId,objetivo.PersonaId)

                }else{
                    if (ObjetivoCoordinadorIds.includes(objetivo.ObjetivoId) && objetivo.ObjetivoId !== 0) {
                        //update
                          await this.updateCoordinadorCuentaQuery(
                            queryRunner,
                            ObjetivoId,
                            objetivo.PersonaId,
                            objetivo.ObjetivoPersonalJerarquicoComision, 
                            objetivo.ObjetivoPersonalJerarquicoDescuentos)

                      } else {
                         // Insert

                         const ObjetivoPersonalJerarquico = await queryRunner.query(`SELECT MAX(ObjetivoPersonalJerarquicoId) AS ObjetivoPersonalJerarquicoId FROM ObjetivoPersonalJerarquico`)
                         console.log("ObjetivoPersonalJerarquico ", ObjetivoPersonalJerarquico)
                         let maxObjetivoPersonalJerarquico = ObjetivoPersonalJerarquico[0].ObjetivoPersonalJerarquicoId + 1 
      
                         await this.insertCoordinadorCuentaQuery(queryRunner,maxObjetivoPersonalJerarquico,
                            ObjetivoId,
                            objetivo.PersonaId,
                            objetivo.ObjetivoPersonalJerarquicoComision, 
                            objetivo.ObjetivoPersonalJerarquicoDescuentos)
      
                      }
               }    

             }

            if(req.body.length > 1){
             const [, ...newArray] = req.body;
             await FileUploadController.handlePDFUpload(ObjetivoId,'Objetivo',newArray,usuario,ip ) 
            }

            await queryRunner.commitTransaction()
            return this.jsonRes([], res, 'Modificación  Exitosa');
        }catch (error) {
            this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async deleteCoordinadorCuentaQuery(queryRunner: any, ObjetivoId: any, PersonaId:any) {
        return await queryRunner.query(`DELETE FROM ObjetivoPersonalJerarquico WHERE ObjetivoId = @0 AND PersonaId = @1;`,
            [ObjetivoId,PersonaId])
    }

    async insertCoordinadorCuentaQuery(
        queryRunner: any,
        maxObjetivoPersonalJerarquico: any,
        ObjetivoId: number,
        PersonaId:any,
        ObjetivoPersonalJerarquicoComision:any, 
        ObjetivoPersonalJerarquicoDescuentos:any
    ) {

        const Fecha = new Date()
        Fecha.setHours(0, 0, 0, 0)

        return await queryRunner.query(`
           INSERT INTO ObjetivoPersonalJerarquico (
           	ObjetivoPersonalJerarquicoId,
            ObjetivoId,
            ObjetivoPersonalJerarquicoPersonalId,
            ObjetivoPersonalJerarquicoDesde,
            ObjetivoPersonalJerarquicoHasta,
            ObjetivoPersonalJerarquicoComo,
            ObjetivoPersonalJerarquicoComision,
            ObjetivoPersonalJerarquicoDescuentos)
           VALUES (@0, @1,@2,@3,@4,@5,@6,@7); `,
           [maxObjetivoPersonalJerarquico,
            ObjetivoId,
            PersonaId,
            Fecha,
            null,
            'C',
            ObjetivoPersonalJerarquicoComision,
            ObjetivoPersonalJerarquicoDescuentos])
    }
    
    async updateCoordinadorCuentaQuery(
        queryRunner: any,
        ObjetivoId: number,
        PersonaId:any,
        ObjetivoPersonalJerarquicoComision:any, 
        ObjetivoPersonalJerarquicoDescuentos:any
    ) {

        return await queryRunner.query(`
            UPDATE ObjetivoPersonalJerarquico
            SET ObjetivoPersonalJerarquicoComision = @2, ObjetivoPersonalJerarquicoDescuentos = @3
            WHERE  ObjetivoPersonalJerarquicoComo = 'C' AND PersonaId = @0 AND ObjetivoId = @1 `,
            [PersonaId,ObjetivoId,ObjetivoPersonalJerarquicoComision,ObjetivoPersonalJerarquicoDescuentos])
    }

    async updateClienteElementoDependienteTable(
        queryRunner: any,
        ClienteId: number,
        ClienteElementoDependienteId:any,
        SucursalId:any, 
        SucursalDescripcion:any
    ) {

        return await queryRunner.query(`
            UPDATE ClienteElementoDependiente
            SET ClienteElementoDependienteSucursalId = @2, ClienteElementoDependienteDescripcion = @3
            WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1 `,
            [ClienteId,ClienteElementoDependienteId,SucursalId,SucursalDescripcion])
    }

    async updateClienteTable(
        queryRunner: any,
        ClienteId: number,
        ClienteElementoDependienteId:any,
        SucursalId:any, 
        SucursalDescripcion:any
    ) {

        return await queryRunner.query(`
            UPDATE Cliente
            SET ClienteSucursalId = @1, ClienteNombreFantasia = @2
            WHERE ClienteId = @0 `,
            [ClienteId,SucursalId,SucursalDescripcion])
    }

    async updateClienteElementoDependienteContratoTable(queryRunner: any, 
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

    async updateClienteContratoTable(queryRunner: any, 
        ClienteId:any, 
        ClienteContratoId:any,
        ClienteContratoFechaDesde:any,
        ClienteContratoFechaHasta:any
    ) {

        const FechaDesde = new Date(ClienteContratoFechaDesde)
        FechaDesde.setHours(0, 0, 0, 0)

        const FechaHasta = new Date(ClienteContratoFechaHasta)
        FechaHasta.setHours(0, 0, 0, 0)

        return await queryRunner.query(`
            UPDATE ClienteContrato
            SET ClienteContratoFechaDesde = @2, ClienteContratoFechaHasta @3
            WHERE ClienteId = @0 AND ClienteContratoId = @1`,
            [ClienteId,ClienteContratoId,FechaDesde, FechaHasta])
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

    async deleteObjetivo(req: Request, res: Response, next: NextFunction) {

        let { ClienteId,ObjetivoId,ClienteElementoDependienteId,DomicilioId,ContratoId} = req.query
        console.log("req.query ", req.query)
        const queryRunner = dataSource.createQueryRunner();

        try {
          await queryRunner.connect();
          await queryRunner.startTransaction();

          await this.deleteObjetivoQuery(queryRunner,Number(ObjetivoId),Number(ClienteId))
          await this.deletePersonalJerarquicoQuery(queryRunner,Number(ObjetivoId))

          if(ClienteElementoDependienteId != 'null'){

            await this.deleteObjetivoQuery(queryRunner,Number(ObjetivoId),Number(ClienteId))
            await this.deleteClienteElementoDependienteQuery(queryRunner,Number(ClienteId),Number(ClienteElementoDependienteId))
            await this.deleteClienteElementoDependienteDomicilioQuery(queryRunner,Number(ClienteId),Number(ClienteElementoDependienteId),Number(DomicilioId))
            await this.deleteClienteElementoDependienteContratoQuery(queryRunner,Number(ClienteId),Number(ClienteElementoDependienteId),Number(ContratoId))
          }
    
          await queryRunner.commitTransaction();
    
        } catch (error) {
          this.rollbackTransaction(queryRunner)
          return next(error)
        }
    
    }

    async deleteObjetivoQuery(queryRunner: any, ObjetivoId: number, ClienteId:number ) {

        return await queryRunner.query(`DELETE FROM objetivo WHERE ObjetivoId = @0 AND ClienteId = @1;`,
            [ObjetivoId,ClienteId])
    }

    async deleteClienteElementoDependienteQuery(queryRunner: any, ClienteId: number, ClienteElementoDependienteId:number ) {

        return await queryRunner.query(`DELETE FROM ClienteElementoDependiente WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1;`,
            [ClienteId,ClienteElementoDependienteId])
    }

    async deleteClienteElementoDependienteDomicilioQuery(queryRunner: any, ClienteId: number, ClienteElementoDependienteId:number,DomicilioId:number ) {

        return await queryRunner.query(`DELETE FROM ClienteElementoDependienteDomicilio  WHERE 
             ClienteId = @0
             AND ClienteElementoDependienteId = @1 
             AND ClienteElementoDependienteDomicilioDomicilioId=@2;`,
            [ClienteId,ClienteElementoDependienteId,DomicilioId])
    }
    async deleteClienteElementoDependienteContratoQuery(queryRunner: any, ClienteId: number, ClienteElementoDependienteId:number,ContratoId:number ) {

        return await queryRunner.query(`DELETE FROM ClienteElementoDependienteContrato  WHERE 
             ClienteId = @0
             AND ClienteElementoDependienteId = @1 
             AND ClienteElementoDependienteContratoId=@2;`,
            [ClienteId,ClienteElementoDependienteId,ContratoId])
    }

    async deletePersonalJerarquicoQuery(queryRunner: any, ObjetivoId: number ) {

        return await queryRunner.query(`DELETE FROM ObjetivoPersonalJerarquico WHERE 
             ObjetivoId = @0
             AND ObjetivoPersonalJerarquicoComo='C';`,
            [ObjetivoId])
    }
}
