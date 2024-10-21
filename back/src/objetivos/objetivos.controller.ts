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
        id: "ClienteApellidoNombre",
        field: "ClienteApellidoNombre",
        fieldName: "cli.ClienteApellidoNombre",
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
                cli.ClienteApellidoNombre,
                ISNULL(eledep.ClienteElementoDependienteDescripcion,cli.ClienteApellidoNombre) Descripcion,                
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
                 --   AND ISNULL(cc.ClienteContratoFechaHasta, '9999-12-31') >= DATEFROMPARTS(@0,@1,1)
                  --  AND ISNULL(cc.ClienteContratoFechaFinalizacion, '9999-12-31') >= DATEFROMPARTS(@0,@1,1)
					GROUP BY cc.ClienteId) clicon2 ON clicon2.ClienteId = cli.ClienteId AND obj.ClienteElementoDependienteId IS null

				--LEFT JOIN  ClienteContrato clicon ON clicon.ClienteId = cli.ClienteId AND clicon.ClienteContratoId = clicon2.ClienteContratoId

                		LEFT JOIN (
				    SELECT 
				        cc.ClienteId, 
				        cc.ClienteContratoId, 
				        cc.ClienteContratoFechaDesde, 
				        cc.ClienteContratoFechaHasta,
				        ROW_NUMBER() OVER (PARTITION BY cc.ClienteId ORDER BY cc.ClienteContratoFechaDesde DESC) AS RowNum
				    FROM ClienteContrato cc
				    WHERE EOMONTH(DATEFROMPARTS(2024,10,1)) >= cc.ClienteContratoFechaDesde
				) clicon ON clicon.ClienteId = cli.ClienteId 
				    AND clicon.RowNum = 1   
					 
					 
					LEFT JOIN (SELECT ec.ClienteId, ec.ClienteElementoDependienteId, MAX(ec.ClienteElementoDependienteContratoId) ClienteElementoDependienteContratoId FROM ClienteElementoDependienteContrato ec WHERE  EOMONTH(DATEFROMPARTS(@0,@1,1)) >= ec.ClienteElementoDependienteContratoFechaDesde 
                 --   AND ISNULL(ec.ClienteElementoDependienteContratoFechaHasta, '9999-12-31') >= DATEFROMPARTS(@0,@1,1)
                 --   AND ISNULL(ec.ClienteElementoDependienteContratoFechaFinalizacion, '9999-12-31') >= DATEFROMPARTS(@0,@1,1)
                GROUP BY ec.ClienteId, ec.ClienteElementoDependienteId
						
					) eledepcon2 ON eledepcon2.ClienteId = obj.ClienteId AND eledepcon2.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
					 
					 
				--LEFT JOIN ClienteElementoDependienteContrato eledepcon ON eledepcon.ClienteId = obj.ClienteId  AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId  AND eledepcon.ClienteElementoDependienteContratoId = eledepcon2.ClienteElementoDependienteContratoId
                 
                	LEFT JOIN (
					    SELECT 
					        ec.ClienteId, 
					        ec.ClienteElementoDependienteId, 
					        ec.ClienteElementoDependienteContratoId, 
					        ec.ClienteElementoDependienteContratoFechaDesde, 
					        ec.ClienteElementoDependienteContratoFechaHasta,
					        ROW_NUMBER() OVER (PARTITION BY ec.ClienteId, ec.ClienteElementoDependienteId 
					                           ORDER BY ec.ClienteElementoDependienteContratoFechaDesde DESC) AS RowNum
					    FROM ClienteElementoDependienteContrato ec
					    WHERE EOMONTH(DATEFROMPARTS(2024,10,1)) >= ec.ClienteElementoDependienteContratoFechaDesde
					) eledepcon ON eledepcon.ClienteId = obj.ClienteId 
					    AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
					    AND eledepcon.RowNum = 1       
   				
                LEFT JOIN (SELECT GrupoActividadObjetivoObjetivoId, MAX(GrupoActividadObjetivoId) GrupoActividadObjetivoId FROM GrupoActividadObjetivo
   				WHERE EOMONTH(DATEFROMPARTS(@0,@1,1)) >= GrupoActividadObjetivoDesde AND DATEFROMPARTS(@0,@1,1) <= ISNULL(GrupoActividadObjetivoHasta,'9999-12-31') 
   				GROUP BY GrupoActividadObjetivoObjetivoId
					) gap2 ON gap2.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId 
      
                LEFT JOIN GrupoActividadObjetivo gap ON gap.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND gap.GrupoActividadObjetivoId=gap2.GrupoActividadObjetivoId
                LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId
		                    
                LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(eledep.ClienteElementoDependienteSucursalId ,cli.ClienteSucursalId)
                

                WHERE ${filterSql} ${orderBy}`, [anio,mes])

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
            const ClienteElementoDependienteId = req.params.ClienteElementoDependienteId === "null" ? null : req.params.ClienteElementoDependienteId
            let infObjetivo = await this.getObjetivoQuery(queryRunner, ObjetivoId,ClienteId,ClienteElementoDependienteId)  
            const infoCoordinadorCuenta = await this.getCoordinadorCuentaQuery(queryRunner, ObjetivoId)
            const infoRubro = await this.getRubroQuery(queryRunner, ObjetivoId,ClienteId,ClienteElementoDependienteId)
            const domiclio = await this.getDomicilio(queryRunner, ObjetivoId,ClienteId,ClienteElementoDependienteId)
            const facturacion = await this.getFacturacion(queryRunner,ClienteId,ClienteElementoDependienteId)

            if(!facturacion ){
                infObjetivo = {...infObjetivo[0],...domiclio[0]};
            }else{
                infObjetivo = {...infObjetivo[0],...domiclio[0],...facturacion[0]};
            }
            
            infObjetivo.infoCoordinadorCuenta = infoCoordinadorCuenta
            infObjetivo.infoRubro = infoRubro
            await queryRunner.commitTransaction()
            return this.jsonRes(infObjetivo, res)
        } catch (error) {
            this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async getFacturacion(queryRunner,ClienteId,ClienteElementoDependienteId){


        if(!ClienteElementoDependienteId){

            const fechaActual = new Date()
            const anio = fechaActual.getFullYear()
            const mes = fechaActual.getMonth()+1

            return await queryRunner.query(`
                SELECT 
                    fac.ClienteFacturacionCUIT
                    ,fac.ClienteFacturacionId
                    ,fac.CondicionAnteIVAId
                    ,TRIM(con.CondicionAnteIVADescripcion) AS CondicionAnteIVADescripcion
                FROM ClienteFacturacion fac
                LEFT JOIN CondicionAnteIVA con ON con.CondicionAnteIVAId = fac.CondicionAnteIVAId
                WHERE fac.ClienteId = @2
                AND fac.ClienteFacturacionDesde <= DATEFROMPARTS(@0, @1, 1)
                AND ISNULL(fac.ClienteFacturacionHasta, '9999-12-31') >= DATEFROMPARTS(@0, @1, 1)`,[anio,mes,ClienteId])
          
        }

    }

    async getDomicilio(queryRunner: any, ObjetivoId: any,ClienteId:any,ClienteElementoDependienteId:any){

        if(ClienteElementoDependienteId){

            return await queryRunner.query(`SELECT TOP 1 
                 domcli.ClienteElementoDependienteDomicilioId AS DomicilioId
                ,TRIM(domcli.ClienteElementoDependienteDomicilioDomCalle) AS DomicilioDomCalle
                ,TRIM(domcli.ClienteElementoDependienteDomicilioDomNro) AS DomicilioDomNro
                ,TRIM(domcli.ClienteElementoDependienteDomicilioCodigoPostal) AS DomicilioCodigoPostal
                ,domcli.ClienteElementoDependienteDomicilioPaisId AS DomicilioPaisId
                ,domcli.ClienteElementoDependienteDomicilioProvinciaId AS DomicilioProvinciaId
                ,domcli.ClienteElementoDependienteDomicilioLocalidadId AS DomicilioLocalidadId
                ,domcli.ClienteElementoDependienteDomicilioBarrioId AS DomicilioBarrioId
                ,domcli.ClienteElementoDependienteDomicilioDomLugar AS DomicilioDomLugar

            FROM ClienteElementoDependienteDomicilio AS domcli
            WHERE domcli.ClienteId = @0
                AND domcli.ClienteElementoDependienteId = @1
                AND domcli.ClienteElementoDependienteDomicilioDomicilioActual = 1
            ORDER BY domcli.ClienteElementoDependienteDomicilioId DESC`,
        [ClienteId,ClienteElementoDependienteId])
          
        }else{
            
            return await queryRunner.query(`SELECT TOP 1 
                 domcli.ClienteDomicilioId AS DomicilioId
                ,TRIM(domcli.ClienteDomicilioDomCalle) AS DomicilioDomCalle
                ,TRIM(domcli.ClienteDomicilioDomNro) AS DomicilioDomNro
                ,TRIM(domcli.ClienteDomicilioCodigoPostal) AS DomicilioCodigoPostal
                ,domcli.ClienteDomicilioPaisId AS DomicilioPaisId
                ,domcli.ClienteDomicilioProvinciaId AS DomicilioProvinciaId
                ,domcli.ClienteDomicilioLocalidadId AS DomicilioLocalidadId
                ,domcli.ClienteDomicilioBarrioId AS DomicilioBarrioId
                ,domcli.ClienteDomicilioDomLugar AS DomicilioDomLugar
            FROM ClienteDomicilio AS domcli
            WHERE domcli.ClienteId = @0
                AND domcli.ClienteDomicilioActual = 1
            ORDER BY domcli.ClienteDomicilioId DESC`,
        [ObjetivoId])
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

    async getRubroQuery(queryRunner: any, ObjetivoId: any,ClienteId:any,ClienteElementoDependienteId) {
        return await queryRunner.query(`SELECT
             ClienteElementoDependienteRubroId,ClienteElementoDependienteRubroClienteId AS RubroId FROM ClienteEleDepRubro 
             WHERE clienteId = @1 AND ClienteElementoDependienteId = @2`,
            [ObjetivoId,ClienteId,ClienteElementoDependienteId])
    }


    async getObjetivoQuery(queryRunner: any, ObjetivoId: any, ClienteId:any,ClienteElementoDependienteId: any) {
        const fechaActual = new Date()
        const anio = fechaActual.getFullYear()
        const mes = fechaActual.getMonth()+1
        if(ClienteElementoDependienteId){
            return await queryRunner.query(`SELECT obj.ObjetivoId
                ,obj.ObjetivoId AS id
                ,obj.ClienteId
                ,obj.ClienteElementoDependienteId
                ,eledep.ClienteElementoDependienteRubroUltNro as RubroUltNro
                ,ISNULL(TRIM(eledep.ClienteElementoDependienteDescripcion), TRIM(cli.ClienteApellidoNombre)) AS Descripcion
                ,suc.SucursalDescripcion
                ,suc.SucursalId
                ,ISNULL(eledepcon.ClienteElementoDependienteContratoFechaDesde, clicon.ClienteContratoFechaDesde) AS ContratoFechaDesde
                ,ISNULL(eledepcon.ClienteElementoDependienteContratoFechaHasta, clicon.ClienteContratoFechaHasta) AS ContratoFechaHasta
                ,eledepcon.ClienteElementoDependienteContratoId AS ContratoId
                ,eledep.ClienteElementoDependienteDomicilioUltNro
                ,eledep.ClienteElementoDependienteContratoUltNro

            FROM Objetivo obj
            LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
            LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteId = obj.ClienteId
                AND eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
            LEFT JOIN (
                SELECT cc.ClienteId
                    ,MAX(cc.ClienteContratoId) AS ClienteContratoId
                FROM ClienteContrato cc
                WHERE 
                EOMONTH(DATEFROMPARTS(@3, @4, 1)) >= cc.ClienteContratoFechaDesde
        
                GROUP BY cc.ClienteId
                ) clicon2 ON clicon2.ClienteId = cli.ClienteId
                AND obj.ClienteElementoDependienteId IS NULL
            LEFT JOIN (
                SELECT ec.ClienteId
                    ,ec.ClienteElementoDependienteId
                    ,MAX(ec.ClienteElementoDependienteContratoId) AS ClienteElementoDependienteContratoId
                FROM ClienteElementoDependienteContrato ec
                WHERE EOMONTH(DATEFROMPARTS(@3, @4, 1)) >= ec.ClienteElementoDependienteContratoFechaDesde
             --       AND ISNULL(ec.ClienteElementoDependienteContratoFechaHasta, '9999-12-31') >= DATEFROMPARTS(@3, @4, 1)
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
           
            WHERE obj.ObjetivoId = @0;`,
                [ObjetivoId,ClienteId,ClienteElementoDependienteId,anio,mes])

        }else{
            return await queryRunner.query(`
                SELECT cli.ClienteId AS id
                ,cli.ClienteId
                ,TRIM(cli.ClienteApellidoNombre) AS Descripcion 
                ,TRIM(cli.CLienteNombreFantasia) AS CLienteNombreFantasia
                ,cli.ClienteRubroUltNro as RubroUltNro
                ,cli.ClienteAdministradorUltNro
                ,cli.ClienteSucursalId AS SucursalId
                ,cli.ClienteContratoUltNro as ClienteContratoUltNro
                ,clicon.ClienteContratoFechaDesde AS ContratoFechaDesde
	            ,clicon.ClienteContratoFechaHasta AS ContratoFechaHasta
                ,clicon.ClienteContratoId AS ContratoId
                ,TRIM(adm.AdministradorNombre) AS AdministradorNombre
                ,TRIM(adm.AdministradorApellido) AS AdministradorApellido
                ,adm.AdministradorId
            FROM Cliente cli
    
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

    async validateDateAndCreateContrato(queryRunner:any,Obj:any){

        let createNewContrato = false
        let ContratoFechaDesde =  Obj.ContratoFechaDesde ? new Date(Obj.ContratoFechaDesde) : null
        let ContratoFechaDesdeOLD =  Obj.ContratoFechaDesdeOLD ? new Date(Obj.ContratoFechaDesdeOLD) : null
        const ContratoFechaHastaOLD = Obj.ContratoFechaHastaOLD ? new Date(Obj.ContratoFechaHastaOLD) : null
        const ContratoFechaHasta = Obj.ContratoFechaHasta ? new Date(Obj.ContratoFechaHasta) : null

        if(ContratoFechaDesde)
            ContratoFechaDesde.setHours(0, 0, 0, 0)

        if(ContratoFechaHasta)
            ContratoFechaHasta.setHours(0, 0, 0, 0)

        if(ContratoFechaDesdeOLD){
            ContratoFechaDesdeOLD.setHours(0, 0, 0, 0)
        }
           
        if(ContratoFechaHastaOLD)
            ContratoFechaHastaOLD.setHours(0, 0, 0, 0)

        if(!Obj.FechaModificada && !ContratoFechaDesdeOLD && !ContratoFechaHastaOLD)
            throw new ClientException(`Debe completar el campo Contrato Desde.`)

        if(Obj.FechaModificada)
            createNewContrato = await this.FormValidationsDate(queryRunner,ContratoFechaDesde,ContratoFechaHasta,ContratoFechaDesdeOLD,ContratoFechaHastaOLD,Obj.FechaModificada)

        //console.log("createNewContrato",createNewContrato)
        //throw new ClientException(`ESTOY TESTEANDO`)

        if(Obj.ClienteElementoDependienteId != null && Obj.ClienteElementoDependienteId != "null") {

            //SI EL ELEMENTO DEPENDIENTE ES DIFERENTE NULL SOLO ACTUALIZA TABLAS DE ELEMENTO DEPENDIENTE

            if(Obj.ContratoId && !createNewContrato){                
                await queryRunner.query(`UPDATE ClienteElementoDependienteContrato SET ClienteElementoDependienteContratoFechaDesde = @3, ClienteElementoDependienteContratoFechaHasta = @4
                    WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1 AND ClienteElementoDependienteContratoId = @2`,
                    [Obj.ClienteId,Obj.ClienteElementoDependienteId,Obj.ContratoId,ContratoFechaDesde, ContratoFechaHasta])
            }else{
           
                let ClienteElementoDependienteContratoId = Obj.ContratoId ? Obj.ContratoId + 1 : 1
    

                 await queryRunner.query(`INSERT INTO ClienteElementoDependienteContrato (ClienteElementoDependienteContratoId,
                    ClienteId,ClienteElementoDependienteId, ClienteElementoDependienteContratoFechaDesde,ClienteElementoDependienteContratoFechaHasta) VALUES(@0,@1,@2,@3,@4)`,
                    [ClienteElementoDependienteContratoId++,Obj.ClienteId,Obj.ClienteElementoDependienteId,ContratoFechaDesde, ContratoFechaHasta])
            
            }    
        }else{
      
            if(Obj.ContratoId && !createNewContrato){

                await queryRunner.query(`UPDATE ClienteContrato SET ClienteContratoFechaDesde = @2, ClienteContratoFechaHasta @3 WHERE ClienteId = @0 AND ClienteContratoId = @1`,
                    [Obj.ClienteId,Obj.ContratoId,ContratoFechaDesde, ContratoFechaHasta])
            }else{

                let ClienteContratoId = Obj.ClienteContratoUltNro == null ? 1 : Obj.ClienteContratoUltNro + 1
        
                 await queryRunner.query(`INSERT INTO ClienteContrato (ClienteContratoId,ClienteId, ClienteContratoFechaDesde, ClienteContratoFechaHasta ) VALUES (@0,@1,@2,@3)`,
                    [ClienteContratoId,Obj.ClienteId,ContratoFechaDesde,ContratoFechaHasta])
            } 
                
        }

    }

    
    async updateObjetivo(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
    
        try {
            await queryRunner.startTransaction()
            const usuario = res.locals.userName
            const ip = this.getRemoteAddress(req)
            const ObjetivoId = Number(req.params.id)
            const Obj =  {...req.body}
            let ObjObjetivoNew = { infoRubro: {}, infoCoordinadorCuenta: {} }
            let newObj = []

            console.log("voy a hacer update ", Obj)
            
            //validaciones
            await this.FormValidations(Obj)
            await this.validateDateAndCreateContrato(queryRunner,Obj)

            //update

            if(Obj.ClienteElementoDependienteId != null && Obj.ClienteElementoDependienteId != "null") {

                //SI EL ELEMENTO DEPENDIENTE ES DIFERENTE NULL SOLO ACTUALIZA TABLAS DE ELEMENTO DEPENDIENTE
                if(Obj.DireccionModificada){

                    let ClienteElementoDependienteDomicilioUltNro  = Obj.ClienteElementoDependienteDomicilioUltNro + 1

                    await this.inserClienteElementoDependienteDomicilio(
                        queryRunner
                       ,Obj.ClienteId
                       ,Obj.ClienteElementoDependienteId
                       ,ClienteElementoDependienteDomicilioUltNro
                       ,Obj.DomicilioDomLugar
                       ,Obj.DomicilioDomCalle
                       ,Obj.DomicilioDomNro
                       ,Obj.DomicilioCodigoPostal
                       ,Obj.DomicilioProvinciaId 
                       ,Obj.DomicilioLocalidadId 
                       ,Obj.DomicilioBarrioId
                       )

                }

                await this.updateClienteElementoDependienteTable(queryRunner,ObjetivoId,Obj.ClienteId,Obj.Descripcion,Obj.SucursalId)  
    
    
            }else{
                //SI EL ELEMENTO DEPENDIENTE ES NULL SOLO ACTUALIZA TABLAS DE CLIENTE
                await  ClientesController.updateClienteDomicilioTable( queryRunner,Obj.ClienteId,Obj)       
                await this.updateClienteTable(queryRunner,Obj.ClienteId,Obj.SucursalId,Obj.Descripcion) 
                    
            }
            ObjObjetivoNew.infoCoordinadorCuenta= await this.ObjetivoCoordinador(queryRunner,Obj.infoCoordinadorCuenta,ObjetivoId)
            ObjObjetivoNew.infoRubro = await this.ObjetivoRubro(queryRunner,Obj.infoRubro,ObjetivoId,Obj.ClienteId,Obj.ClienteElementoDependienteId)

            if(Obj.files?.length > 0){
             await FileUploadController.handlePDFUpload(ObjetivoId,'Objetivo','OBJ','objetivo_id', Obj.files,usuario,ip ) 
            }

            await queryRunner.commitTransaction()
            return this.jsonRes(newObj, res, 'Modificación  Exitosa');
        }catch (error) {
            this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async ObjetivoCoordinador(queryRunner,objetivos,Objetivo){
        const Fecha = new Date()
        Fecha.setHours(0, 0, 0, 0)
        const ObjetivosIds = objetivos.map((row: { ObjetivoPersonalJerarquicoId: any; }) => row.ObjetivoPersonalJerarquicoId).filter((id) => id !== null && id !== undefined);
        //console.log("ObjetivosIds ", ObjetivosIds)
        if (ObjetivosIds.length > 0)
            await queryRunner.query(`DELETE FROM ObjetivoPersonalJerarquico WHERE ObjetivoId = @0 AND ObjetivoPersonalJerarquicoId NOT IN (${ObjetivosIds.join(',')})`, [Objetivo])

        const ContactoId = await queryRunner.query(`SELECT IDENT_CURRENT('ObjetivoPersonalJerarquico')`)
        let maxObjetivoPersonalJerarquico = ContactoId[0]['']; 

        for (const [idx, objetivo] of objetivos.entries()) {

            if(objetivo.ObjetivoId && objetivo.PersonaId && objetivo.ObjetivoPersonalJerarquicoId){
                if (objetivo.ObjetivoId){
                    await queryRunner.query(`UPDATE ObjetivoPersonalJerarquico SET ObjetivoPersonalJerarquicoComision = @2, ObjetivoPersonalJerarquicoDescuentos = @3
                        WHERE  ObjetivoPersonalJerarquicoComo = 'C' AND ObjetivoPersonalJerarquicoPersonalId = @0 AND ObjetivoId = @1 `,
                        [objetivo.PersonaId,Objetivo,objetivo.ObjetivoPersonalJerarquicoComision,objetivo.ObjetivoPersonalJerarquicoDescuentos])
                } else {
                    maxObjetivoPersonalJerarquico++

                    await queryRunner.query(` INSERT INTO ObjetivoPersonalJerarquico (ObjetivoId,ObjetivoPersonalJerarquicoPersonalId,
                        ObjetivoPersonalJerarquicoDesde,ObjetivoPersonalJerarquicoHasta,ObjetivoPersonalJerarquicoComo,ObjetivoPersonalJerarquicoComision,
                        ObjetivoPersonalJerarquicoDescuentos) VALUES (@0, @1,@2,@3,@4,@5,@6); `,
                        [ Objetivo,objetivo.PersonaId,Fecha, null,'C',objetivo.ObjetivoPersonalJerarquicoComision,objetivo.ObjetivoPersonalJerarquicoDescuentos])


                    if(objetivo.ClienteElementoDependienteId != null && objetivo.ClienteElementoDependienteId != "null") {
                        await queryRunner.query(`UPDATE ClienteElementoDependiente SET ClienteElementoDependienteContactoUltNro = @2
                            WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1 `, [objetivo.ClienteId,objetivo.ClienteElementoDependienteId,maxObjetivoPersonalJerarquico])
                    }else{
                            return await queryRunner.query(`UPDATE Cliente SET ClienteContactoUltNro = @1 WHERE ClienteId = @0`,[objetivo.ClienteId,maxObjetivoPersonalJerarquico])
                    }
                    objetivos[idx].ObjetivoId = maxObjetivoPersonalJerarquico
                }  
            }       
          
        }

        return objetivos
    
        
    }

    async ObjetivoRubro(queryRunner:any,rubros:any,Objetivo:any,ClienteId:any,ClienteElementoDependienteId:any){

        let res
        const RubroIds = rubros.map((row: { ClienteElementoDependienteRubroId: any; }) => row.ClienteElementoDependienteRubroId).filter((id) => id !== null && id !== undefined);
        if (RubroIds.length > 0)
            await queryRunner.query(`DELETE FROM ClienteEleDepRubro WHERE ClienteId = @0 AND ClienteElementoDependienteId =@1 AND ClienteElementoDependienteRubroId NOT IN (${RubroIds.join(',')})`, [ClienteId,ClienteElementoDependienteId])


        if(ClienteElementoDependienteId)
            res = await queryRunner.query(`SELECT ClienteElementoDependienteRubroUltNro as RubroUltNro FROM ClienteElementoDependiente WHERE ClienteId=@0 AND ClienteElementoDependienteId=@1 `,[ClienteId,ClienteElementoDependienteId])  
        else
            res = await queryRunner.query(`SELECT ClienteRubroUltNro as RubroUltNro FROM Cliente WHERE ClienteId=@0`,[ClienteId])
            
        let RubroUltNro = (res[0].RubroUltNro) ? res[0].RubroUltNro : 0

        for (const [idx, rubro] of rubros.entries()) {
            if(rubro.ClienteElementoDependienteRubroId && rubro.RubroId){

                if (rubro.ClienteElementoDependienteRubroId) {

                    await queryRunner.query(` UPDATE ClienteEleDepRubro SET ClienteElementoDependienteRubroClienteId = @1 WHERE ClienteId = @0 AND  ClienteElementoDependienteRubroId = @2`,
                        [ClienteId,ClienteElementoDependienteId,rubro.RubroId])

                } else {

                    RubroUltNro++

                    await queryRunner.query(`INSERT INTO ClienteEleDepRubro (ClienteElementoDependienteRubroId,ClienteId,ClienteElementoDependienteId, ClienteElementoDependienteRubroClienteId )
                        VALUES (@0, @1,@2,@3); `,[RubroUltNro,ClienteId,ClienteElementoDependienteId,rubro.RubroId])

                    if(ClienteElementoDependienteId != null && ClienteElementoDependienteId != "null") {
                        await queryRunner.query(`UPDATE ClienteElementoDependiente SET ClienteElementoDependienteRubroUltNro = @2
                                WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1 `,
                                [ClienteId,ClienteElementoDependienteId,RubroUltNro])
                    }else{

                        await queryRunner.query(`UPDATE Cliente SET  ClienteRubroUltNro = @1 WHERE ClienteId = @0`,[ClienteId,RubroUltNro])
            
                    }  
                
                    rubros[idx].ClienteDomicilioId = RubroUltNro
                }
            }
        }

        return rubros

    }

    async updateClienteElementoDependienteTable(
        queryRunner: any,
        ClienteId: number,
        ClienteElementoDependienteId:any,
        SucursalDescripcion:any, 
        SucursalId:any, 
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
        SucursalId:any, 
        SucursalDescripcion:any
    ) {

        return await queryRunner.query(`
            UPDATE Cliente
            SET ClienteSucursalId = @1, ClienteNombreFantasia = @2
            WHERE ClienteId = @0 `,
            [ClienteId,SucursalId,SucursalDescripcion])
    }

    async FormValidationsDate(queryRunner: any,ContratoFechaDesde:any,ContratoFechaHasta:any,ContratoFechaDesdeOLD:any,ContratoFechaHastaOLD:any,FechaModificada:any){

        if(!ContratoFechaDesde) {
            throw new ClientException(`Debe completar el campo Contrato Desde.`)
        }

        if(ContratoFechaHasta && ContratoFechaDesde > ContratoFechaHasta  ) {
            throw new ClientException(`La fecha desde no puede ser mayor a la fecha hasta`)
        }
      
        const ValidatePeriodoAndDay = await queryRunner.query(`SELECT TOP 1 *, EOMONTH(DATEFROMPARTS(anio, mes, 1)) AS FechaCierre FROM lige.dbo.liqmaperiodo WHERE ind_recibos_generados = 1 ORDER BY anio DESC, mes DESC `)
        const FechaCierre = new Date(ValidatePeriodoAndDay[0].FechaCierre);
        const fechaFormateada = `${FechaCierre.getFullYear()}-${(FechaCierre.getMonth() + 1).toString().padStart(2, '0')}-${FechaCierre.getDate().toString().padStart(2, '0')}`;

        if(!FechaModificada)
            return false

        // Fechas desde y hasta < Fecha del último periodo cerrado no se modifican.
        if (ContratoFechaDesdeOLD && ContratoFechaDesdeOLD < FechaCierre && ContratoFechaHastaOLD && ContratoFechaHastaOLD < FechaCierre) {
            if (ContratoFechaDesde < FechaCierre) {
                throw new ClientException(`La  fecha Desde debe ser mayor que la fecha del último periodo cerrado, fecha limite ${fechaFormateada}`)
            }
            if (!ContratoFechaDesde) {
                throw new ClientException(`La fecha Desde no puede estar vacía, fecha limite ${fechaFormateada}`)
            } 
            if ( ContratoFechaHasta && ContratoFechaHasta < FechaCierre) {
                throw new ClientException(`La fecha Hasta debe ser mayor  a la fecha del último periodo cerrado, fecha limite ${fechaFormateada}`)
            }

            return true  
        }

        // validacion para cuando es un nuevo registro
        if(!ContratoFechaDesdeOLD && !ContratoFechaHastaOLD){

            if (ContratoFechaDesde.getTime() <= FechaCierre.getTime()) {
                throw new ClientException(`La  fecha Desde debe ser mayor que la fecha del último periodo cerrado, fecha limite ${fechaFormateada}`)
            }
            if (!ContratoFechaDesde) {
                throw new ClientException(`La fecha Desde no puede estar vacía, fecha limite ${fechaFormateada}`)
            } 
            if ( ContratoFechaHasta && ContratoFechaHasta < FechaCierre) {
                throw new ClientException(`La fecha de cierre debe ser igual o mayor a la fecha limit. ${fechaFormateada}`)
            }
            return true  
        }

        // validacion para no ingresar fecha desde en un periodo ya cerrado
        if (ContratoFechaDesdeOLD && ContratoFechaDesdeOLD < FechaCierre) {

            if (ContratoFechaDesdeOLD.getTime() !== ContratoFechaDesde.getTime()) {
                throw new ClientException(`No se puede modificar la fecha desde ya que pertenece a un periodo ya cerrado`);
            }
        }
        
    
        // Desde < FecUltPer y Hasta > UltPer, se puede modificar el hasta, pero el nuevo hasta >= UltPer
        if (ContratoFechaDesdeOLD < FechaCierre && (!ContratoFechaHastaOLD || ContratoFechaHastaOLD > FechaCierre)) {
   
            if (ContratoFechaHasta &&ContratoFechaHasta.getTime() <= FechaCierre.getTime()) {
                throw new ClientException(`La fecha de cierre debe ser igual o mayor a la fecha limite. ${fechaFormateada}`)
            }
            
        }

        // Desde > FecUltPer, se puede modificar si el nuevo Desde > FecUltPer y no puede quedar vacío
        if (ContratoFechaDesdeOLD > FechaCierre) {
            if (ContratoFechaDesde < FechaCierre) {
                throw new ClientException(`La  fecha Desde debe ser mayor que la fecha del último periodo cerrado, fecha limite ${fechaFormateada}`)
            }
            if (!ContratoFechaDesde) {
                throw new ClientException(`La fecha Desde no puede estar vacía, fecha limite ${fechaFormateada}`)
            }
        } 

        return false

    } 


    async FormValidations(form:any){
    
    
        if(!form.ClienteId) {
           throw new ClientException(`Debe completar el campo Cliente.`)
        }

        if(!form.Descripcion) {
           throw new ClientException(`Debe completar el campo  Descripcion.`)
        }

        if(!form.SucursalId) {
            throw new ClientException(`Debe completar el campo Sucursal.`)
        } 



        // if(!form.ContratoFechaHasta) {
        //     throw new ClientException(`El campo Contrato Hasta NO pueden estar vacio.`)
        //  }

        //Domicilio

        if(!form.DomicilioDomCalle) {
            throw new ClientException(`Debe completar el campo Dirección Calle.`)
         }
 
         if(!form.DomicilioDomNro) {
            throw new ClientException(`Debe completar el campo Nro.`)
         }
 
         if(form.DomicilioDomNro.length > 5) {
            throw new ClientException(`El campo Domicilio Nro NO puede ser mayor a 5 digitos.`)
         }
 
         if(!form.DomicilioCodigoPostal) {
             throw new ClientException(`Debe completar el campo Cod Postal.`)
         }

         if(form.DomicilioCodigoPostal.length > 8) {
            throw new ClientException(`El campo Cod Postal NO puede ser mayor a 8 digitos.`)
         }
 
         if(!form.DomicilioProvinciaId) {
            throw new ClientException(`Debe completar el campo Provincia.`)
         }

         if(!form.DomicilioLocalidadId) {
            throw new ClientException(`Debe completar el campo Localidad.`)
         }

         

        // Coordinador de cuenta

         for(const obj of form.infoCoordinadorCuenta){
            if(!obj.PersonaId &&  obj.ObjetivoPersonalJerarquicoComision && obj.ObjetivoPersonalJerarquicoDescuentos) {
                throw new ClientException(`Debe completar el campo Nombre en cliente contacto.`)
             }

         }

         // Coordinador de cuenta

         for(const obj of form.infoRubro){
            if(obj.ClienteElementoDependienteRubroId && !obj.RubroId) {
                throw new ClientException(`Debe completar el campo Rubro.`)
             }

         }


        

    } 

    async deleteObjetivo(req: Request, res: Response, next: NextFunction) {

        let { ClienteId,ObjetivoId,ClienteElementoDependienteId,DomicilioId,ContratoId} = req.query
        //console.log("req.query ", req.query)
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
            await this.deleteClienteEleDepRubroQuery(queryRunner,Number(ClienteId),Number(ClienteElementoDependienteId))
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

    async deleteClienteEleDepRubroQuery(queryRunner: any, ClienteId: number, ClienteElementoDependienteId:number ) {

        return await queryRunner.query(`DELETE FROM ClienteEleDepRubro  WHERE 
             ClienteId = @0
             AND ClienteElementoDependienteId = @1`,
            [ClienteId,ClienteElementoDependienteId])
    }

    async deletePersonalJerarquicoQuery(queryRunner: any, ObjetivoId: number ) {

        return await queryRunner.query(`DELETE FROM ObjetivoPersonalJerarquico WHERE 
             ObjetivoId = @0
             AND ObjetivoPersonalJerarquicoComo='C';`,
            [ObjetivoId])
    }

    async addObjetivo(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        const Obj = {...req.body};
        let ObjObjetivoNew = { ClienteId:0,ObjetivoNewId:0,NewClienteElementoDependienteId:0,infoRubro: {}, infoCoordinadorCuenta: {} }
        console.log("Insert ",Obj)
        let newObj = []
        try {

            await queryRunner.startTransaction()

            const usuario = res.locals.userName
            const ip = this.getRemoteAddress(req)
            ObjObjetivoNew.ClienteId = Obj.ClienteId
            //validaciones

            await this.FormValidations(Obj)

            let infoMaxObjetivo = await queryRunner.query(`SELECT MAX(ObjetivoId) AS MaxObjetivoId FROM Objetivo`)
            let { MaxObjetivoId } = infoMaxObjetivo[0]
            MaxObjetivoId++

            
            let infoMaxClienteElementoDependiente = await queryRunner.query(`SELECT ClienteElementoDependienteUltNro AS ClienteElementoDependienteUltNro FROM Cliente WHERE ClienteId = @0`,[Number(Obj.ClienteId)])
            let { ClienteElementoDependienteUltNro } = infoMaxClienteElementoDependiente[0]
            ClienteElementoDependienteUltNro = ClienteElementoDependienteUltNro == null ? 1 :ClienteElementoDependienteUltNro + 1
           
           
            //Agrego los valores al objeto original para retornar
            ObjObjetivoNew.ObjetivoNewId = MaxObjetivoId
            ObjObjetivoNew.NewClienteElementoDependienteId = ClienteElementoDependienteUltNro
            Obj.ClienteElementoDependienteId = ClienteElementoDependienteUltNro
            let ClienteElementoDependienteDomicilioId = 1

       
          
            
            await this.insertClienteElementoDependienteSql(queryRunner,Number(Obj.ClienteId),ClienteElementoDependienteUltNro,Obj.Descripcion,Obj.SucursalId,ClienteElementoDependienteDomicilioId)
            await this.updateCliente(queryRunner,Number(Obj.ClienteId),ClienteElementoDependienteUltNro)
            await this.inserClienteElementoDependienteDomicilio(queryRunner,Obj.ClienteId,ClienteElementoDependienteUltNro,ClienteElementoDependienteDomicilioId,Obj.DomicilioDomLugar,Obj.DomicilioDomCalle,Obj.DomicilioDomNro,
                Obj.DomicilioCodigoPostal,Obj.DomicilioProvinciaId,Obj.DomicilioLocalidadId,Obj.DomicilioBarrioId )

            //await this.ClienteElementoDependienteContrato(queryRunner,Number(Obj.ClienteId),ClienteElementoDependienteUltNro,Obj.ContratoFechaDesde,Obj.ContratoFechaHasta)
            await this.validateDateAndCreateContrato(queryRunner,Obj)
            await this.insertObjetivoSql(queryRunner,Number(Obj.ClienteId),Obj.Descripcion,ClienteElementoDependienteUltNro,Obj.SucursalId)


            ObjObjetivoNew.infoCoordinadorCuenta= await this.ObjetivoCoordinador(queryRunner,Obj.infoCoordinadorCuenta,MaxObjetivoId)
            ObjObjetivoNew.infoRubro = await this.ObjetivoRubro(queryRunner,Obj.infoRubro,MaxObjetivoId,Obj.ClienteId,ClienteElementoDependienteUltNro)
 
            //await this.updateMaxClienteElementoDependiente(queryRunner,Obj.ClienteId,Obj.ClienteElementoDependienteId,MaxObjetivoPersonalJerarquicoId, maxRubro)

            if(Obj.files?.length > 0){
                await FileUploadController.handlePDFUpload(Obj.ObjetivoId,'Objetivo','OBJ','objetivo_id',Obj.files,usuario,ip ) 
            }

            await queryRunner.commitTransaction()
            return this.jsonRes(ObjObjetivoNew, res, 'Carga  de nuevo registro exitoso');
        }catch (error) {
            this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async updateCliente(queryRunner: any,ClienteId:number,ClienteElementoDependienteUltNro:any){
        return await queryRunner.query(`UPDATE Cliente SET ClienteElementoDependienteUltNro = @1 WHERE ClienteId = @0`,
            [ClienteId,ClienteElementoDependienteUltNro])
    }

    async insertObjetivoPersonalJerarquico(queryRunner: any,ObjetivoId:any,ObjetivoPersonalJerarquicoPersonalId:any,
        ObjetivoPersonalJerarquicoDesde:any,ObjetivoPersonalJerarquicoComision:any,ObjetivoPersonalJerarquicoDescuentos:any
    ) {

        return await queryRunner.query(`INSERT INTO ObjetivoPersonalJerarquico (
            ObjetivoId,
            ObjetivoPersonalJerarquicoPersonalId,
            ObjetivoPersonalJerarquicoDesde,
            ObjetivoPersonalJerarquicoComo,
            ObjetivoPersonalJerarquicoComision,
            ObjetivoPersonalJerarquicoDescuentos
            ) VALUES (@0,@1,@2,@3,@4,@5)`,
            [
             ObjetivoId,
             ObjetivoPersonalJerarquicoPersonalId,
             ObjetivoPersonalJerarquicoDesde,
             'C',
             ObjetivoPersonalJerarquicoComision,
             ObjetivoPersonalJerarquicoDescuentos
            ])
    }

    async ClienteElementoDependienteContrato(queryRunner: any,ClienteId:any,ClienteElementoDependienteId:any,ClienteElementoDependienteContratoFechaDesde:any,
        ClienteElementoDependienteContratoFechaHasta:any ) {

        
        let ClienteElementoDependienteContratoUltNro = 1
        
        return await queryRunner.query(`INSERT INTO ClienteElementoDependienteContrato (
            ClienteElementoDependienteContratoId,
            ClienteId,
            ClienteElementoDependienteId,
            ClienteElementoDependienteContratoFechaDesde,
            ClienteElementoDependienteContratoFechaHasta
            ) VALUES (@0,@1,@2,@3,@4)`,
            [ClienteElementoDependienteContratoUltNro,
             ClienteId,
             ClienteElementoDependienteId,
             ClienteElementoDependienteContratoFechaDesde,
             ClienteElementoDependienteContratoFechaHasta,
            ])
    }

    async inserClienteElementoDependienteDomicilio(queryRunner:any,ClienteId:any,ClienteElementoDependienteId:any,DomicilioId:any,DomicilioDomLugar:any,DomicilioDomCalle:any,
        DomicilioDomNro:any,DomicilioCodigoPostal:any,DomicilioProvinciaId:any,DomicilioLocalidadId:any,DomicilioBarrioId:any){

        await queryRunner.query(`INSERT INTO ClienteElementoDependienteDomicilio (
            ClienteId,
            ClienteElementoDependienteId,
            ClienteElementoDependienteDomicilioId,
            ClienteElementoDependienteDomicilioDomLugar,
            ClienteElementoDependienteDomicilioDomCalle,
            ClienteElementoDependienteDomicilioDomNro,
            ClienteElementoDependienteDomicilioCodigoPostal,
            ClienteElementoDependienteDomicilioPaisId,
            ClienteElementoDependienteDomicilioProvinciaId,
            ClienteElementoDependienteDomicilioLocalidadId,
            ClienteElementoDependienteDomicilioBarrioId,
            ClienteElementoDependienteDomicilioDomicilioActual) 
            VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@11)`,
               [ClienteId,
                ClienteElementoDependienteId,
                DomicilioId,
                DomicilioDomLugar,
                DomicilioDomCalle,
                DomicilioDomNro,
                DomicilioCodigoPostal,
                1,
                DomicilioProvinciaId,
                DomicilioLocalidadId,
                DomicilioBarrioId,
                1
            ])
          }

    async insertObjetivoSql(queryRunner: any,ClienteId: number, ObjetivoDescripcion:any, ClienteElementoDependienteId:any, ObjetivoSucursalUltNro:any,) {

        return await queryRunner.query(`INSERT INTO Objetivo (
            ClienteId,
            ObjetivoDescripcion,
            ClienteElementoDependienteId,
            ObjetivoSucursalUltNro) VALUES (@0,@1,@2,@3)`,
            [ClienteId,ObjetivoDescripcion,ClienteElementoDependienteId,ObjetivoSucursalUltNro])
    }

    async insertClienteElementoDependienteSql(queryRunner: any,ClienteId:any,ClienteElementoDependienteId:any,ClienteElementoDependienteDescripcion,ClienteElementoDependienteSucursalId:any,ClienteElementoDependienteDomicilioUltNro:any) {

        //este codigo arma el ClienteElementoDependienteArmado
        let ElementoDependienteId = 1
        let infoElementoDependiente = await queryRunner.query(`SELECT ElementoDependienteDescripcion FROM ElementoDependiente WHERE ElementoDependienteId = @0`,[ElementoDependienteId])
        let ClienteElementoDependienteArmado =  `${infoElementoDependiente[0].ElementoDependienteDescripcion} - ${ClienteElementoDependienteDescripcion}`

        return await queryRunner.query(`INSERT INTO ClienteElementoDependiente (
            ClienteId,
            ClienteElementoDependienteId,
            ElementoDependienteId,
            ClienteElementoDependienteDescripcion,
            ClienteElementoDependienteArmado,
            ClienteElementoDependienteDomicilioUltNro,
            ClienteElementoDependienteSucursalId) VALUES (@0,@1,@2,@3,@4,@5,@6 )`,
            [ClienteId,
             ClienteElementoDependienteId,
             ElementoDependienteId,
             ClienteElementoDependienteDescripcion,
             ClienteElementoDependienteArmado,
             ClienteElementoDependienteDomicilioUltNro,
             ClienteElementoDependienteSucursalId])
    }
    

}
