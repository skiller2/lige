import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { QueryResult } from "typeorm";


export class ClientesController extends BaseController {

    listaColumnas: any[] = [
        {
            id: "id",
            name: "id",
            field: "id",
            fieldName: "cli.ClienteId",
            type: "number",
            sortable: false,
            hidden: true
        },
        {
            name: "CUIT",
            type: "number",
            id: "ClienteFacturacionCUIT",
            field: "ClienteFacturacionCUIT",
            fieldName: "fac.ClienteFacturacionCUIT",
            sortable: true,
            hidden: false,
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
            name: "Nombre Fantasía",
            type: "string",
            id: "CLienteNombreFantasia",
            field: "CLienteNombreFantasia",
            fieldName: "cli.CLienteNombreFantasia",
            searchType: "string",
            searchHidden: false
        },
        {
            name: "Fecha de Alta",
            type: "date",
            id: "ClienteFechaAlta",
            field: "ClienteFechaAlta",
            fieldName: "cli.ClienteFechaAlta",
            sortable: true,
            hidden: false,
            searchHidden: false
        },

        {
            name: "Domicilio",
            type: "string",
            id: "domicilio",
            field: "domicilio",
            fieldName: "domcli.ClienteDomicilioDomCalle",
            sortable: true,
            searchHidden: true
        },
        {
            name: "Cantidad de objetivos activos",
            type: "number",
            id: "CantidadObjetivos",
            field: "CantidadObjetivos",
            fieldName: "CantidadObjetivos",
            sortable: true,
            hidden: false,
            searchHidden: false
        },
    ];

    async getGridCols(req, res) {
        this.jsonRes(this.listaColumnas, res);
    }


    async listClientes(req: any, res: Response, next: NextFunction) {

        const filterSql = filtrosToSql(req.body.options.filtros, this.listaColumnas);
        const orderBy = orderToSQL(req.body.options.sort)
        const queryRunner = dataSource.createQueryRunner();
        const fechaActual = new Date()

        try {

            const clientes = await queryRunner.query(
                `SELECT 
        cli.ClienteId AS id, 
        cli.ClienteId,
        fac.ClienteFacturacionCUIT,
        con.CondicionAnteIVADescripcion,
        cli.ClienteDenominacion, 
        cli.CLienteNombreFantasia, 
        cli.ClienteFechaAlta,
        CONCAT_WS(' ', 
            TRIM(domcli.ClienteDomicilioDomCalle), 
            TRIM(domcli.ClienteDomicilioDomNro)
        ) AS domicilio,
        COUNT(DISTINCT obj.ObjetivoId) AS CantidadObjetivos
    FROM 
        Cliente cli
        LEFT JOIN ClienteFacturacion fac ON fac.ClienteId = cli.ClienteId 
            AND fac.ClienteFacturacionDesde <= @0 
            AND ISNULL(fac.ClienteFacturacionHasta, '9999-12-31') >= @0
        LEFT JOIN CondicionAnteIVA con ON con.CondicionAnteIVAId = fac.CondicionAnteIVAId
        LEFT JOIN Objetivo obj ON obj.ClienteId = cli.ClienteId
        LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId 
            AND eledep.ClienteId = obj.ClienteId
        LEFT JOIN ClienteElementoDependienteContrato eledepcon ON eledepcon.ClienteId = obj.ClienteId 
            AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId 
            AND @0 >= eledepcon.ClienteElementoDependienteContratoFechaDesde 
            AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaHasta, '9999-12-31') >= @0 
            AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaFinalizacion, '9999-12-31') >= @0
        LEFT JOIN ClienteContrato clicon ON clicon.ClienteId = obj.ClienteId 
            AND obj.ClienteElementoDependienteId IS NULL 
            AND @0 >= clicon.ClienteContratoFechaDesde 
            AND ISNULL(clicon.ClienteContratoFechaHasta, '9999-12-31') >= @0 
            AND ISNULL(clicon.ClienteContratoFechaFinalizacion, '9999-12-31') >= @0
        LEFT JOIN (
            SELECT 
                domcli.ClienteId, 
                domcli.ClienteDomicilioDomCalle, 
                domcli.ClienteDomicilioDomNro
            FROM 
                ClienteDomicilio domcli
            WHERE 
                domcli.ClienteDomicilioActual = 1
            AND domcli.ClienteDomicilioId = (
                SELECT MAX(ClienteDomicilioId) 
                FROM ClienteDomicilio 
                WHERE ClienteId = domcli.ClienteId 
                AND ClienteDomicilioActual = 1
            )
        ) AS domcli ON domcli.ClienteId = cli.ClienteId
    WHERE 
        ${filterSql}
    GROUP BY 
        cli.ClienteId,
        fac.ClienteFacturacionCUIT,
        con.CondicionAnteIVADescripcion,
        cli.ClienteDenominacion, 
        cli.CLienteNombreFantasia, 
        cli.ClienteFechaAlta,
        domcli.ClienteDomicilioDomCalle,
        domcli.ClienteDomicilioDomNro ${orderBy}`, [fechaActual])

            this.jsonRes(
                {
                    total: clientes.length,
                    list: clientes,
                },
                res
            );

        } catch (error) {
            return next(error)
        }

    }

    async infoCliente(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.startTransaction()
            const clienteId = req.params.id

            let infoCliente = await this.getObjetivoClienteQuery(queryRunner, clienteId)
            let infoClienteContacto = await this.getClienteContactoQuery(queryRunner, clienteId)

            infoCliente = infoCliente[0]
            infoCliente.infoClienteContacto = infoClienteContacto

            await queryRunner.commitTransaction()
            return this.jsonRes(infoCliente, res)
        } catch (error) {
            this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async getClienteContactoQuery(queryRunner: any, clienteId: any) {
        return await queryRunner.query(`SELECT 
            cc.ClienteContactoNombre AS nombre,
            cc.ClienteContactoApellido,
            cc.ClienteContactoArea AS area,
            cce.ClienteContactoEmailEmail AS correo ,
            cct.ClienteContactoTelefonoNro AS telefono
        FROM 
            ClienteContacto cc
        LEFT JOIN 
            ClienteContactoEmail cce
        ON 
            cc.ClienteId = cce.ClienteId
            AND cc.ClienteContactoId = cce.ClienteContactoId
            AND cc.ClienteContactoEmailUltNro = cce.ClienteContactoEmailId
        LEFT JOIN 
            ClienteContactoTelefono cct
        ON 
            cc.ClienteId = cct.ClienteId
            AND cc.ClienteContactoId = cct.ClienteContactoId
            AND cct.ClienteContactoTelefonoId = cct.ClienteContactoTelefonoId
        WHERE  
                cc.ClienteId= @0`,
            [clienteId])
    }


    async getObjetivoClienteQuery(queryRunner: any, clienteId: any) {
        return await queryRunner.query(`SELECT cli.ClienteId AS id
        ,cli.ClienteId
        ,fac.ClienteFacturacionCUIT
        ,fac.ClienteFacturacionId
        ,fac.CondicionAnteIVAId
        ,con.CondicionAnteIVADescripcion
        ,cli.ClienteDenominacion
        ,cli.CLienteNombreFantasia
        ,cli.ClienteFechaAlta
        ,domcli.ClienteDomicilioId
        ,domcli.ClienteDomicilioDomCalle
        ,domcli.ClienteDomicilioDomNro
        ,domcli.ClienteDomicilioCodigoPostal
        ,domcli.ClienteDomicilioPaisId AS domiciliopais
        ,domcli.ClienteDomicilioProvinciaId
        ,domcli.ClienteDomicilioLocalidadId
        ,domcli.ClienteDomicilioBarrioId
        ,adm.AdministradorApellidoNombre
        ,adm.AdministradorId
    FROM Cliente cli
    LEFT JOIN ClienteFacturacion fac ON fac.ClienteId = cli.ClienteId
        AND fac.ClienteFacturacionDesde <= '2024-07-30'
        AND ISNULL(fac.ClienteFacturacionHasta, '9999-12-31') >= '2024-07-30'
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
        FROM ClienteDomicilio AS domcli
        WHERE domcli.ClienteId = @0
            AND domcli.ClienteDomicilioActual = 1
        ORDER BY domcli.ClienteDomicilioId DESC
        ) AS domcli ON domcli.ClienteId = cli.ClienteId
    LEFT JOIN (
        SELECT TOP 1 ca.ClienteId
            ,ca.ClienteAdministradorAdministradorId AS AdministradorId
            ,adm.AdministradorApellidoNombre
        FROM ClienteAdministrador ca
        JOIN Administrador adm ON adm.AdministradorId = ca.ClienteAdministradorAdministradorId
        WHERE ca.ClienteId = @0
        ORDER BY ca.ClienteAdministradorId DESC
        ) AS adm ON adm.ClienteId = cli.ClienteId
    WHERE cli.ClienteId = @0;`,
            [clienteId])
    }

    async getCondicionQuery(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            const CondicionAnteIva = await queryRunner.query(`SELECT CondicionAnteIVAId,CondicionAnteIVADescripcion from CondicionAnteIVA`)
            console.log(CondicionAnteIva)
            return this.jsonRes(CondicionAnteIva, res);
        } catch (error) {
            return next(error)
        } finally {

        }

    }

    async getProvinciasQuery(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            const provincias = await queryRunner.query(`SELECT ProvinciaId,ProvinciaDescripcion FROM Provincia WHERE PaisId  = 1`)
            return this.jsonRes(provincias, res);
        } catch (error) {
            return next(error)
        } finally {

        }

    }

    async getLocalidadQuery(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            const provincias = await queryRunner.query(`SELECT LocalidadId, ProvinciaId, localidadDescripcion FROM Localidad  WHERE PaisId = 1`)
            return this.jsonRes(provincias, res);
        } catch (error) {
            return next(error)
        } finally {

        }

    }

    async getBarrioQuery(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            const provincias = await queryRunner.query(`SELECT BarrioId,ProvinciaId,LocalidadId,BarrioDescripcion FROM Barrio WHERE PaisId = 1 `)
            return this.jsonRes(provincias, res);
        } catch (error) {
            return next(error)
        } finally {

        }

    }


    async updateCliente(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
    
        try {
            await queryRunner.startTransaction()
            const usuario = res.locals.userName
            const ip = this.getRemoteAddress(req)
            const ClienteId = req.params.id
            const ObjCliente = {...req.body }
            
            console.log("ObjCliente ", ObjCliente)
            console.log("ClienteId ", ClienteId)

            //validaciones


            //update

            await this.updateClienteTable(queryRunner,ClienteId,ObjCliente.CLienteNombreFantasia,ObjCliente.ClienteDenominacion,ObjCliente.ClienteFechaAlta)
            await this.updateFacturaTable(queryRunner,ClienteId,ObjCliente.ClienteFacturacionId,ObjCliente.ClienteFacturacionCUIT,ObjCliente.CondicionAnteIVAId)
            
            await this.updateClienteDomicilioTable(
                 queryRunner
                ,ClienteId
                ,ObjCliente.ClienteDomicilioId
                ,ObjCliente.ClienteDomicilioDomCalle
                ,ObjCliente.ClienteDomicilioDomNro
                ,ObjCliente.ClienteDomicilioCodigoPostal
                ,ObjCliente.ClienteDomicilioProvinciaId 
                ,ObjCliente.ClienteDomicilioLocalidadId 
                ,ObjCliente.ClienteDomicilioBarrioId)

            await this.updateAdministradorTable(queryRunner,ObjCliente.AdministradorId,ObjCliente.AdministradorApellidoNombre)

            
            await queryRunner.commitTransaction()
            return this.jsonRes([], res, 'Carga Exitosa');
        }catch (error) {
            this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }
    

    async updateClienteDomicilioTable(
         queryRunner: any
        ,ClienteId: number
        ,ClienteDomicilioId: number
        ,ClienteDomicilioDomCalle: string
        ,ClienteDomicilioDomNro: string
        ,ClienteDomicilioCodigoPostal: string
        ,ClienteDomicilioProvinciaId: number
        ,ClienteDomicilioLocalidadId: number
        ,ClienteDomicilioBarrioId: number){

        await queryRunner.query(`UPDATE ClienteDomicilio
        SET ClienteDomicilioDomCalle = @2,ClienteDomicilioDomNro = @3, ClienteDomicilioCodigoPostal = @4, 
        ClienteDomicilioProvinciaId = @5,ClienteDomicilioLocalidadId = @6,ClienteDomicilioBarrioId = @7
        WHERE ClienteId = @0 AND ClienteDomicilioId = @1`,[
            ClienteId,
            ClienteDomicilioId,
            ClienteDomicilioDomCalle,
            ClienteDomicilioDomNro,
            ClienteDomicilioCodigoPostal,
            ClienteDomicilioProvinciaId,ClienteDomicilioLocalidadId,ClienteDomicilioBarrioId])
     }

    async updateFacturaTable(queryRunner:any,ClienteId:number,ClienteFacturacionId:string,ClienteFacturacionCUIT:string,CondicionAnteIVAId:number){


       await queryRunner.query(`UPDATE ClienteFacturacion
        SET ClienteFacturacionCUIT = @2,CondicionAnteIVAId = @3
        WHERE ClienteId = @0 AND ClienteFacturacionId = @1`,[ClienteId,ClienteFacturacionId,ClienteFacturacionCUIT,CondicionAnteIVAId])
    }
    
    async updateClienteTable(queryRunner:any,ClienteId:number,CLienteNombreFantasia:string,ClienteDenominacion:string,ClienteFechaAlta:Date){

        await queryRunner.query(`UPDATE Cliente
         SET CLienteNombreFantasia = @1, ClienteDenominacion = @2, ClienteFechaAlta= @3
         WHERE ClienteId = @0`,[ClienteId,CLienteNombreFantasia,ClienteDenominacion,ClienteFechaAlta])
     }

     async updateAdministradorTable(queryRunner:any,AdministradorId:number,AdministradorApellidoNombre:string){

        await queryRunner.query(`
         UPDATE Administrador
         SET AdministradorApellidoNombre = @1
         WHERE AdministradorId = @0`,[AdministradorId,AdministradorApellidoNombre])

     }



}
