import { NextFunction, Response } from "express";
import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";

const columnsObjCustodia: any[] = [
    {
        id:'id' , name:'Codigo' , field:'id',
        fieldName: "obj.objetivo_custodia_id",
        sortable: true,
        type: 'number',
        minWidth: 50,
        // minWidth: 10,
    },
    {
        id:'responsable' , name:'Responsable' , field:'responsable',
        fieldName: "obj.responsable_id",
        sortable: true,
        type: 'string',
        formatter: 'complexObject',
        params: {
            complexFieldLabel: 'responsable.fullName',
        },
        searchComponent:"inpurForPersonalSearch",
        searchType:"number",
        // maxWidth: 170,
        minWidth: 100,
    },
    {
        id:'cliente' , name:'Cliente' , field:'cliente',
        fieldName: "cli.ClienteId",
        sortable: true,
        type: 'string',
        formatter: 'complexObject',
        params: {
            complexFieldLabel: 'cliente.fullName',
        },
        searchComponent:"inpurForClientSearch",
        searchType:"number",
        // maxWidth: 170,
        minWidth: 100,
    },
    {
        id:'requirente' , name:'Solicitado por' , field:'requirente',
        fieldName: "obj.desc_requirente",
        sortable: true,
        type: 'string',
        // formatter: 'complexObject',
        // params: {
        //     complexFieldLabel: 'desc_requirente.fullName',
        // },
        searchComponent:"inpurForRequirenteSearch",
        searchType:"string",
        // maxWidth: 150,
        minWidth: 110,
    },
    {
        id:'descripcion' , name:'Descripcion' , field:'descripcion',
        fieldName: "obj.descripcion",
        sortable: true,
        type: 'text',
        // maxWidth: 300,
        minWidth: 230,
    },
    {
        id:'fechaI' , name:'Fecha Inicio' , field:'fechaI',
        fieldName: "obj.fecha_inicio",
        sortable: true,
        type: 'date',
        // maxWidth: 150,
        minWidth: 90,
    },
    {
        id:'origen' , name:'Origen' , field:'origen',
        fieldName: "obj.origen",
        sortable: true,
        type: 'string',
        // maxWidth: 180,
        minWidth: 140,
    },
    {
        id:'fechaF' , name:'Fecha Final' , field:'fechaF',
        fieldName: "obj.fecha_fin",
        sortable: true,
        type: 'date',
        // maxWidth: 150,
        minWidth: 90,
    },
    {
        id:'destino' , name:'Destino' , field:'destino',
        fieldName: "obj.destino",
        sortable: true,
        type: 'string',
        // maxWidth: 180,
        minWidth: 140,
    },
    {
        id:'facturacion' , name:'Importe a Facturar' , field:'facturacion',
        fieldName: "obj.impo_facturar",
        sortable: true,
        type: 'currency',
        //maxWidth: 110,
        minWidth: 110,
        searchType:"number",
    },
    {
        id:'estado' , name:'Estado' , field:'estado',
        fieldName: "obj.estado",
        sortable: true,
        type: 'string',
        formatter: 'complexObject',
        params: {
            complexFieldLabel: 'estado.descripcion',
        },
        searchComponent:"inpurForEstadoCustSearch",
        searchType:"number",
        //maxWidth: 110,
        minWidth: 70,
    },
    {
        name: "Apellido Nombre",
        type: "string",
        id: "ApellidoNombre",
        field: "ApellidoNombre",
        fieldName: "regper.personal_id",
        searchComponent:"inpurForPersonalSearch",
        searchType:"number",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
    {
        name: "Patente",
        type: "string",
        id: "Patente",
        field: "Patente",
        fieldName: "regveh.patente",
        // searchComponent:"inpurForPatenteSearch",
        searchType:"string",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
]

const estados : any[] = [
    { tipo: 0, descripcion: 'Pendiente' },
    { tipo: 1, descripcion: 'Finalizado' },
    { tipo: 2, descripcion: 'Cancelado' },
    { tipo: 3, descripcion: 'A facturar' },
    { tipo: 4, descripcion: 'Facturado' },
]

export class CustodiaController extends BaseController {

    async addObjetivoCustodiaQuery(queryRunner: any, objetivoCustodia:any, usuario: any, ip: any){
        const objetivo_custodia_id = objetivoCustodia.objetivoCustodiaId
        const responsable_id = objetivoCustodia.responsableId
        const cliente_id = objetivoCustodia.clienteId
        const desc_requirente = objetivoCustodia.descRequirente? objetivoCustodia.descRequirente : null
        const descripcion = objetivoCustodia.descripcion? objetivoCustodia.descripcion : null
        const fecha_inicio = objetivoCustodia.fechaInicio.slice(0, 16).replace('T', ' ')
        const origen = objetivoCustodia.origen
        const fecha_fin = objetivoCustodia.fechaFinal? objetivoCustodia.fechaFinal.slice(0, 16).replace('T', ' ') : null
        const destino = objetivoCustodia.destino? objetivoCustodia.destino : null
        const cant_modulos = objetivoCustodia.cant_modulos? objetivoCustodia.cantModulos : null
        const importe_modulos = objetivoCustodia.impoModulos? objetivoCustodia.impoModulos : null
        const cant_horas_exced = objetivoCustodia.cantHorasExced? objetivoCustodia.cantHorasExced : null
        const impo_horas_exced = objetivoCustodia.impoHorasExced? objetivoCustodia.impoHorasExced : null
        const cant_km_exced = objetivoCustodia.cantKmExced? objetivoCustodia.cantKmExced : null
        const impo_km_exced = objetivoCustodia.impoKmExced? objetivoCustodia.impoKmExced : null
        const impo_peaje = objetivoCustodia.impoPeaje? objetivoCustodia.impoPeaje : null
        const impo_facturar= objetivoCustodia.facturacion? objetivoCustodia.facturacion : null
        const num_factura= objetivoCustodia.numFactura? objetivoCustodia.numFactura : null
        const desc_facturacion= objetivoCustodia.desc_facturacion? objetivoCustodia.desc_facturacion : null
        const estado = objetivoCustodia.estado? objetivoCustodia.estado : 0
        const fechaActual = new Date()
        return await queryRunner.query(`
            INSERT lige.dbo.objetivocustodia(objetivo_custodia_id, responsable_id, cliente_id, desc_requirente, 
                descripcion, fecha_inicio, origen, fecha_fin, destino, cant_modulos, importe_modulos, cant_horas_exced,
                impo_horas_exced, cant_km_exced, impo_km_exced, impo_peaje, impo_facturar, desc_facturacion, num_factura, estado, 
                aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
            VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15, @16, @17, @18, @19, @20, @21, @19, @20, @21, @22)`, 
            [objetivo_custodia_id, responsable_id, cliente_id, desc_requirente, descripcion, fecha_inicio, origen, 
                fecha_fin, destino, cant_modulos, importe_modulos, cant_horas_exced, impo_horas_exced, 
                cant_km_exced, impo_km_exced, impo_peaje, impo_facturar, desc_facturacion, num_factura, estado, 
                usuario, ip, fechaActual]
        )
    }

    async addRegistroPersonalCustodiaQuery(queryRunner: any, infoPersonal:any, usuario:any, ip:any){
        const personal_id = infoPersonal.personalId
        const objetivo_custodia_id = infoPersonal.objetivoCustodiaId
        const importe_personal = infoPersonal.importe? infoPersonal.importe : null
        const fechaActual = new Date()
        return await queryRunner.query(`INSERT lige.dbo.regpersonalcustodia(
            personal_id, objetivo_custodia_id, importe_personal, 
            aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod
        )
        VALUES (@0, @1, @2, @3, @4, @5, @3, @4, @5)`, 
        [personal_id, objetivo_custodia_id, importe_personal, usuario, ip, fechaActual])
    }

    async addRegistroVehiculoCustodiaQuery(queryRunner: any, infoVehiculo:any, usuario:any, ip:any){
        const objetivo_custodia_id = infoVehiculo.objetivoCustodiaId
        const patente = infoVehiculo.patente
        const personal_id = infoVehiculo.duenoId
        const importe_vehiculo = infoVehiculo.importe? infoVehiculo.importe : null
        const peaje_vehiculo = infoVehiculo.peaje? infoVehiculo.peaje : null
        const fechaActual = new Date()
        return await queryRunner.query(`INSERT lige.dbo.regvehiculocustodia(
            patente, objetivo_custodia_id, personal_id, importe_vehiculo, peaje_vehiculo, 
            aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod
        )
        VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @5, @6, @7)`, 
        [patente, objetivo_custodia_id, personal_id, importe_vehiculo, peaje_vehiculo, usuario, ip, fechaActual])
    }

    async addRegistroArmaCustodiaQuery(queryRunner: any, arma_id:any, objetivoCustodiaId: any){
        return await queryRunner.query(`INSERT regarmacustodia(objetivo_custodia_id, arma_id)
        VALUES ()`, 
        [objetivoCustodiaId, arma_id])
    }

    async addArmaQuery(queryRunner: any, armaId:any, detalle:any){
        return await queryRunner.query(`INSERT arma(arma_id, detalle)
        VALUES ()`, 
        [armaId, detalle])
    }

    async listObjetivoCustodiaByResponsableQuery(queryRunner:any, filterSql:any, orderBy:any, responsableId?:number){
        let search = ''
        if (responsableId === undefined) {
            search = `1=1`
        } else {
            search = `obj.responsable_id = ${responsableId}`
        }
        return await queryRunner.query(`
            SELECT DISTINCT obj.objetivo_custodia_id id, obj.responsable_id responsableId,
            obj.cliente_id clienteId, obj.desc_requirente, obj.descripcion, obj.fecha_inicio, 
            obj.origen, obj.fecha_fin, obj.destino, obj.estado, TRIM(cli.ClienteApellidoNombre) cliente,
            CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) responsable, obj.impo_facturar facturacion
            FROM lige.dbo.objetivocustodia obj
            JOIN Personal per ON per.PersonalId = obj.responsable_id
            JOIN Cliente cli ON cli.ClienteId = obj.cliente_id
            LEFT JOIN lige.dbo.regvehiculocustodia regveh ON regveh.objetivo_custodia_id = obj.objetivo_custodia_id
            LEFT JOIN lige.dbo.regpersonalcustodia regper ON regper.objetivo_custodia_id = obj.objetivo_custodia_id
            WHERE (${search}) AND (${filterSql}) 
            ${orderBy}`)
    }

    async updateObjetivoCustodiaQuery(queryRunner: any, objetivoCustodia:any, usuario:any, ip:any){
        const objetivo_custodia_id = objetivoCustodia.objetivoCustodiaId
        const cliente_id = objetivoCustodia.clienteId
        const desc_requirente = objetivoCustodia.descRequirente? objetivoCustodia.descRequirente : null
        const descripcion = objetivoCustodia.descripcion? objetivoCustodia.descripcion : null
        const fecha_inicio = objetivoCustodia.fechaInicio.slice(0, 16).replace('T', ' ')
        const origen = objetivoCustodia.origen
        const fecha_fin = objetivoCustodia.fechaFinal? objetivoCustodia.fechaFinal.slice(0, 16).replace('T', ' ') : null
        const destino = objetivoCustodia.destino
        const cant_modulos = objetivoCustodia.cantModulos? objetivoCustodia.cantModulos : null
        const importe_modulos = objetivoCustodia.impoModulos? objetivoCustodia.impoModulos  :null
        const cant_horas_exced = objetivoCustodia.cantHorasExced? objetivoCustodia.cantHorasExced : null
        const impo_horas_exced = objetivoCustodia.impoHorasExced? objetivoCustodia.impoHorasExced : null
        const cant_km_exced = objetivoCustodia.cantKmExced? objetivoCustodia.cantKmExced : null
        const impo_km_exced = objetivoCustodia.impoKmExced? objetivoCustodia.impoKmExced : null
        const impo_peaje = objetivoCustodia.impoPeaje? objetivoCustodia.impoPeaje : null
        const impo_facturar = objetivoCustodia.facturacion? objetivoCustodia.facturacion : null
        const num_factura = objetivoCustodia.numFactura? objetivoCustodia.numFactura : null
        const desc_facturacion = objetivoCustodia.desc_facturacion? objetivoCustodia.desc_facturacion : null
        const estado = objetivoCustodia.estado? objetivoCustodia.estado : 0
        const fechaActual = new Date()
        return await queryRunner.query(`
        UPDATE lige.dbo.objetivocustodia 
        SET cliente_id = @1, desc_requirente = @2, descripcion = @3, fecha_inicio = @4, origen = @5, 
        fecha_fin = @6, destino = @7, cant_modulos = @8, importe_modulos = @9, cant_horas_exced = @10, 
        impo_horas_exced = @11, cant_km_exced = @12, impo_km_exced = @13, impo_peaje = @14,  
        impo_facturar = @15, desc_facturacion = @16, num_factura = @17, estado = @18, 
        aud_usuario_mod = @19, aud_ip_mod = @20, aud_fecha_mod = @21
        WHERE objetivo_custodia_id = @0`, 
        [objetivo_custodia_id, cliente_id, desc_requirente, descripcion, fecha_inicio, origen, fecha_fin, destino, 
            cant_modulos, importe_modulos, cant_horas_exced, impo_horas_exced, cant_km_exced, impo_km_exced, 
            impo_peaje, impo_facturar, desc_facturacion, num_factura, estado, usuario, ip, fechaActual
        ])
    }

    async updateRegistroPersonalCustodiaQuery(queryRunner: any, infoPersonal:any, usuario:any, ip:any){
        const personal_id = infoPersonal.personalId
        const objetivo_custodia_id = infoPersonal.objetivoCustodiaId
        const importe_personal = infoPersonal.importe? infoPersonal.importe : null
        const fechaActual = new Date()
        return await queryRunner.query(`
        UPDATE lige.dbo.regpersonalcustodia
        SET personal_id = @1, importe_personal =@2, aud_usuario_mod = @3, aud_ip_mod = @4, aud_fecha_mod = @5
        WHERE objetivo_custodia_id = @0`, 
        [objetivo_custodia_id, personal_id, importe_personal, usuario, ip, fechaActual])
    }

    async updateRegistroVehiculoCustodiaQuery(queryRunner: any, infoVehiculo:any, usuario:any, ip:any){
        const objetivo_custodia_id = infoVehiculo.objetivoCustodiaId
        const patente = infoVehiculo.patente
        const personal_id = infoVehiculo.duenoId
        const importe_vehiculo = infoVehiculo.importe? infoVehiculo.importe : null
        const peaje_vehiculo = infoVehiculo.peaje? infoVehiculo.peaje : null
        const fechaActual = new Date()
        return await queryRunner.query(`
        UPDATE lige.dbo.regvehiculocustodia
        SET patente = @1, personal_id = @2, importe_vehiculo = @3, peaje_vehiculo = @4, aud_usuario_mod = @5, aud_ip_mod = @6, aud_fecha_mod = @7
        WHERE objetivo_custodia_id = @0`, 
        [objetivo_custodia_id, patente, personal_id, importe_vehiculo, peaje_vehiculo, usuario, ip, fechaActual])
    }

    async getObjetivoCustodiaQuery(queryRunner: any, custodiaId: any){
        return await queryRunner.query(`
        SELECT obj.objetivo_custodia_id id, obj.responsable_id responsableId, TRIM(per.PersonalApellidoNombre) responsable,
        obj.cliente_id clienteId, obj.desc_requirente descRequirente, obj.descripcion, obj.fecha_inicio fechaInicio, obj.origen, 
        obj.fecha_fin fechaFinal, obj.destino, obj.cant_modulos cantModulos, obj.importe_modulos impoModulos, 
        obj.cant_horas_exced cantHorasExced, obj.impo_horas_exced impoHorasExced, obj.cant_km_exced cantKmExced, 
        obj.impo_km_exced impoKmExced, obj.impo_peaje impoPeaje, obj.impo_facturar facturacion, obj.estado, obj.num_factura numFactura
        FROM lige.dbo.objetivocustodia obj
        INNER JOIN Cliente cli ON cli.ClienteId = obj.cliente_id
        INNER JOIN Personal per ON per.PersonalId = obj.responsable_id
        WHERE objetivo_custodia_id = @0`, 
        [custodiaId])
    }

    async getRegPersonalObjCustodiaQuery(queryRunner: any, custodiaId: any){
        return await queryRunner.query(`
        SELECT reg.personal_id personalId, reg.importe_personal importe
        FROM lige.dbo.regpersonalcustodia reg
        INNER JOIN Personal per ON per.PersonalId = reg.personal_id
        WHERE objetivo_custodia_id = @0`, 
        [custodiaId])
    }

    async getRegVehiculoObjCustodiaQuery(queryRunner: any, custodiaId: any){
        return await queryRunner.query(`
        SELECT reg.patente , reg.importe_vehiculo importe, reg.peaje_vehiculo peaje, reg.personal_id duenoId
        FROM lige.dbo.regvehiculocustodia reg
        INNER JOIN Personal per ON per.PersonalId = reg.personal_id
        WHERE objetivo_custodia_id = @0`, 
        [custodiaId])
    }

    async deleteRegPersonalObjCustodiaQuery(queryRunner: any, custodiaId: any, personalId:any){
        return await queryRunner.query(`
        DELETE lige.dbo.regpersonalcustodia 
        WHERE objetivo_custodia_id = @0
        AND personal_id = @1`, 
        [custodiaId, personalId])
    }

    async deleteRegVehiculoObjCustodiaQuery(queryRunner: any, custodiaId: any, patente:any){
        return await queryRunner.query(`
        DELETE lige.dbo.regvehiculocustodia 
        WHERE objetivo_custodia_id = @0
        AND patente = @1`, 
        [custodiaId, patente])
    }

    async addObjetivoCustodia(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
    
        try {
            await queryRunner.startTransaction()
            if (!req.body.clienteId || !req.body.fechaInicio || !req.body.origen)
                throw new ClientException(`Los campos de Cliente, Fecha Inicial y Origen NO pueden estar vacios.`)

            const usuario = res.locals.userName
            const ip = this.getRemoteAddress(req)
            // const responsableId = 699
            const responsableId = res.locals.PersonalId
            if (!responsableId) 
                throw new ClientException(`No se a encontrado al personal responsable.`)

            const valCustodiaForm = this.valCustodiaForm(req.body)
            if (valCustodiaForm instanceof ClientException)
                throw valCustodiaForm

            const objetivoCustodiaId = await this.getProxNumero(queryRunner, `objetivocustodia`, usuario, ip)

            const objetivoCustodia = {...req.body, responsableId, objetivoCustodiaId}
            
            await this.addObjetivoCustodiaQuery(queryRunner, objetivoCustodia, usuario, ip)

            let repPersonal = [], repVehiculo = [], errores = []
            let vehiculoError = 0, personalError = 0
            
            for (const obj of objetivoCustodia.personal) {
                if( obj.personalId ){
                    let infoPersonal = {
                        ...obj,
                        objetivoCustodiaId
                    }

                    //En caso de FINALIZAR custodia verificar los campos Importe de Personal
                    if(this.valByEstado(objetivoCustodia.estado) && !infoPersonal.importe){
                        personalError++
                    }

                    let rep = repPersonal.find((obj:any) => obj.personalId == infoPersonal.personalId)
                    if (rep) {
                        errores.push(`El personal ya tiene un registro existente en el formulario.`)
                    }else{
                        await this.addRegistroPersonalCustodiaQuery(queryRunner, infoPersonal, usuario, ip)
                        repPersonal.push(infoPersonal)
                    }
                }
            }

            for (const obj of objetivoCustodia.vehiculos) {
                if( obj.patente ){
                    let infoVehiculo = {
                        ... obj,
                        objetivoCustodiaId
                    }

                    //En caso de FINALIZAR custodia verificar los campos Importe de Vehiculos
                    if(this.valByEstado(objetivoCustodia.estado) && !infoVehiculo.importe){
                        vehiculoError++
                    }
                    if(this.valByEstado(objetivoCustodia.estado) && !infoVehiculo.duenoId){
                        errores.push(`El campo Dueño de la patente ${obj.patente} NO pueden estar vacios.`)
                    }

                    let rep = repVehiculo.find((obj:any) => obj.patente == infoVehiculo.patente)
                    if (rep) {
                        errores.push(`La patente ${rep.patente} ya tiene un registro existente en el formulario.`)
                    }else{
                        await this.addRegistroVehiculoCustodiaQuery(queryRunner, infoVehiculo, usuario, ip)
                        repVehiculo.push(infoVehiculo)
                    }
                }
            }
                
            if (repVehiculo.length == 0 && repPersonal.length == 0) {
                errores.push(`Debe de haber por lo menos una persona y un vehículo (Patente y Dueño) por custodia.`)
            }

            if(personalError) {
                errores.push(`Los campos Importe de cada Personal NO pueden estar vacios.`)
            }

            if(vehiculoError) {
                errores.push(`Los campos Importe de cada Vehiculo NO pueden estar vacios.`)
            }

            if (errores.length) {
                throw new ClientException(errores.join(`\n`))
            }
 //           throw new ClientException("LLego todo ")
            await queryRunner.commitTransaction()
            return this.jsonRes({ custodiaId: objetivoCustodiaId }, res, 'Carga Exitosa');
        }catch (error) {
            this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async listObjetivoCustodiaByResponsable(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try{
            await queryRunner.startTransaction()
            // const responsableId = 699
            const responsableId = res.locals.PersonalId
            const options: Options = isOptions(req.body.options)? req.body.options : { filtros: [], sort: null };
            
            const filterSql = filtrosToSql(options.filtros, columnsObjCustodia);
            const orderBy = orderToSQL(options.sort)
            
            let result : any
            if (await this.hasGroup(req, 'liquidaciones') || await this.hasGroup(req, 'administrativo')){
                result = await this.listObjetivoCustodiaByResponsableQuery(queryRunner, filterSql, orderBy)
            }else{
                result = await this.listObjetivoCustodiaByResponsableQuery(queryRunner, filterSql, orderBy, responsableId)
            }

            let list = result.map((obj : any) => {
                return {
                    id: obj.id,
                    responsable:{ id: obj.responsableId, fullName: obj.responsable},
                    cliente:{ id: obj.clienteId, fullName: obj.cliente},
                    requirente: obj.desc_requirente,
                    descripcion: obj.descripcion,
                    fechaI: obj.fecha_inicio,
                    origen: obj.origen,
                    fechaF: obj.fecha_fin? obj.fecha_fin : null,
                    destino: obj.destino,
                    facturacion: obj.facturacion,
                    estado: estados[obj.estado]
                }
            })
            await queryRunner.commitTransaction()
            return this.jsonRes(list, res)
        }catch (error) {
            this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async infoObjCustodia(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try{
            await queryRunner.startTransaction()
            const custodiaId = req.params.id
            let infoCustodia = await this.getObjetivoCustodiaQuery(queryRunner, custodiaId)
            let listPersonal = await this.getRegPersonalObjCustodiaQuery(queryRunner, custodiaId)
            let listVehiculo = await this.getRegVehiculoObjCustodiaQuery(queryRunner, custodiaId)

            infoCustodia= infoCustodia[0]
            // delete infoCustodia.id
            delete infoCustodia.responsableId
            // delete infoCustodia.estado

            infoCustodia.personal = listPersonal
            infoCustodia.vehiculos = listVehiculo
            
            await queryRunner.commitTransaction()
            return this.jsonRes(infoCustodia, res)
        }catch (error) {
            this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async updateObjetivoCustodia(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
    
        try {
            await queryRunner.startTransaction()
            const usuario = res.locals.userName
            const ip = this.getRemoteAddress(req)
            // const responsableId = 699
            const responsableId = res.locals.PersonalId
            const custodiaId = req.params.id
            const objetivoCustodia = {...req.body }
            let infoCustodia = await this.getObjetivoCustodiaQuery(queryRunner, custodiaId)
            infoCustodia= infoCustodia[0]
            delete infoCustodia.id
            // delete infoCustodia.responsableId
            delete infoCustodia.responsable
            // delete infoCustodia.estado
            
            if (!(await this.hasGroup(req, 'liquidaciones') || await this.hasGroup(req, 'administrativo')) && responsableId != infoCustodia.responsableId){
                throw new ClientException(`Únicamente puede modificar el registro ${infoCustodia.responsable} o pertenecer al grupo 'Administracion'/'Liquidaciones'.`)
            }
            
            const valCustodiaForm = this.valCustodiaForm(objetivoCustodia)
            if (valCustodiaForm instanceof ClientException)
                throw valCustodiaForm
            
            let listPersonal = await this.getRegPersonalObjCustodiaQuery(queryRunner, custodiaId)
            let listVehiculo = await this.getRegVehiculoObjCustodiaQuery(queryRunner, custodiaId)
            
            infoCustodia.fechaInicio = infoCustodia.fechaInicio.toISOString()
            infoCustodia.fechaFinal = infoCustodia.fechaFinal? infoCustodia.fechaFinal.toISOString() : infoCustodia.fechaFinal
            let cantCambios = 0, personalError = 0, vehiculoError = 0
            let repPersonal = [], repVehiculo = [], errores = []
            
            for (const key in objetivoCustodia) {
                //Verifico si hubo cambios
                if ( infoCustodia[key] !== undefined && (infoCustodia[key] != objetivoCustodia[key])){
                    cantCambios++
                }
            }

            for (const obj of objetivoCustodia.personal) {
                if( obj.personalId ){
                    let infoPersonal = {
                        ...obj,
                        objetivoCustodiaId: custodiaId
                    }
                    //En caso de FINALIZAR custodia verificar los campos Importe de Personal
                    if(this.valByEstado(objetivoCustodia.estado) && !infoPersonal.importe){
                        personalError++
                    }
                    //Verifico que el personal no se repita
                    let persona = null
                    for (let index = 0; index < listPersonal.length; index++) {
                        if(listPersonal[index].personalId == infoPersonal.personalId){
                            persona = listPersonal[index]
                            listPersonal.splice(index, 1)
                            break
                        }
                    }
                    if (!persona) { //Si el personal es nuevo AGREGAR
                        let rep = repPersonal.find((obj:any) => obj.personalId == infoPersonal.personalId)
                        if (rep) {
                            errores.push(`El personal ya tiene un registro existente en el formulario.`)
                        }else{
                            await this.addRegistroPersonalCustodiaQuery(queryRunner, infoPersonal, usuario, ip)
                        }
                    } else if (persona.importe != infoPersonal.importe) { //Si hubo un cambio en regpersonalcustodia ACTUALIZA
                        await this.updateRegistroPersonalCustodiaQuery(queryRunner, infoPersonal, usuario, ip)
                    }
                    repPersonal.push(infoPersonal)
                }
            }
            for (const obj of objetivoCustodia.vehiculos) {
                if( obj.patente ){
                    let infoVehiculo = {
                        ...obj,
                        objetivoCustodiaId: custodiaId
                    }
                    //En caso de FINALIZAR custodia verificar los campos Importe de Vehiculos
                    if(this.valByEstado(objetivoCustodia.estado) && !infoVehiculo.importe){
                        vehiculoError++
                    }
                    if(this.valByEstado(objetivoCustodia.estado) && !infoVehiculo.duenoId){
                        errores.push(`El campo Dueño de la patente ${obj.patente} NO pueden estar vacios.`)
                    }
                    //Verifico que la patente no se repita
                    let vehiculo = null
                    for (let index = 0; index < listVehiculo.length; index++) {
                        if(listVehiculo[index].patente == infoVehiculo.patente){
                            vehiculo = listVehiculo[index]
                            listVehiculo.splice(index, 1)
                            break
                        }
                    }
                    if (!vehiculo) {
                        let rep = repVehiculo.find((obj:any) => obj.patente == infoVehiculo.patente)
                        if (rep) {
                            errores.push(`La patente ${rep.patente} ya tiene un registro existente en el formulario.`)
                        }else{
                            await this.addRegistroVehiculoCustodiaQuery(queryRunner, infoVehiculo, usuario, ip)
                        }
                    } else if (vehiculo.duenoId != infoVehiculo.duenoId || vehiculo.importe != infoVehiculo.importe || vehiculo.peaje != infoVehiculo.peaje){
                        await this.updateRegistroVehiculoCustodiaQuery(queryRunner, infoVehiculo, usuario, ip)
                    }
                    repVehiculo.push(infoVehiculo)
                }
            }
            if (repVehiculo.length == 0 && repPersonal.length == 0) {
                errores.push(`Debe de haber por lo menos una persona y un vehículo (Patente y Dueño) por custodia.`)
            }

            if(personalError) {
                errores.push(`Los campos Importe de cada Personal NO pueden estar vacios.`)
            }

            if(vehiculoError) {
                errores.push(`Los campos Importe de cada Vehiculo NO pueden estar vacios.`)
            }

            if (errores.length) {
                throw new ClientException(errores.join(`\n`))
            }

            //Si hubo un cambio en objetivocustodia ACTUALIZA
            //if (cantCambios) {
                await this.updateObjetivoCustodiaQuery(queryRunner, {...objetivoCustodia, objetivoCustodiaId: custodiaId}, usuario, ip)
            //}

            //Elimino los vehiculos y el personal que ya no pertenecen a este objetivo custodia
            for (const obj of listPersonal) {
                await this.deleteRegPersonalObjCustodiaQuery(queryRunner, custodiaId, obj.personalId)
            }
            for (const obj of listVehiculo) {
                await this.deleteRegVehiculoObjCustodiaQuery(queryRunner, custodiaId, obj.patente)
            }
            
            await queryRunner.commitTransaction()
            return this.jsonRes([], res, 'Carga Exitosa');
        }catch (error) {
            this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async getGridColumns(req: any, res: Response, next: NextFunction) {
        return this.jsonRes(columnsObjCustodia, res)
    }

    async getEstados(req: any, res: Response, next: NextFunction) {
        return this.jsonRes(estados, res)
    }

    valCustodiaForm(custodiaForm: any){
        let errores : any[] = []
        if (!Number.isInteger(custodiaForm.estado)){
            errores.push(`El campo Estado NO pueden estar vacio`)
        }
        if (!custodiaForm.clienteId || !custodiaForm.fechaInicio || !custodiaForm.origen){
            errores.push(`Los campos de Cliente, Fecha Inicial y Origen NO pueden estar vacios.`)
        }
        if ((!custodiaForm.cantModulos && custodiaForm.impoModulos) || (custodiaForm.cantModulos && !custodiaForm.impoModulos)) {
            errores.push(`Los campos pares Cant. e Importe de Modulos deben de llenarse al mismo tiempo.`)
        }
        if ((!custodiaForm.cantHorasExced && custodiaForm.impoHorasExced) || (custodiaForm.cantHorasExced && !custodiaForm.impoHorasExced)) {
            errores.push(`Los campos pares Cant. e Importe de Horas Excedentes deben de llenarse al mismo tiempo.`)
        }
        if ((!custodiaForm.cantKmExced && custodiaForm.impoKmExced) || (custodiaForm.cantKmExced && !custodiaForm.impoKmExced)) {
            errores.push(`Los campos pares Cant. e Importe de Km Excedentes deben de llenarse al mismo tiempo.`)
        }
        //En caso de FINALIZAR custodia verificar los campos
        if(this.valByEstado(custodiaForm.estado) && (!custodiaForm.facturacion || !custodiaForm.fechaFinal || !custodiaForm.destino)){
            errores.push(`Los campos de Destino, Fecha Final y Importe a Facturar NO pueden estar vacios.`)
        }

        if(custodiaForm.estado == 4 && !custodiaForm.numFactura){
            errores.push(`El campo Num de Factura NO puede estar vacio.`)
        }

        if (errores.length) {
            return new ClientException(errores.join(`\n`))
        }
    }
    
    async searhPatente(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.startTransaction()
            const patente = req.body.patente
            const list = await queryRunner.query(`
                SELECT reg.patente, reg.personal duenoId
                FROM lige.dbo.regvehiculocustodia reg
                WHERE patente LIKE '%${patente}%'`)
            await queryRunner.commitTransaction()
            return this.jsonRes(list, res);
        } catch (error) {
            this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async getPersonalByPatente(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.startTransaction()
            const patente = req.body.patente
            const list = await queryRunner.query(`
                SELECT reg.patente, reg.personal_id duenoId
                FROM lige.dbo.regvehiculocustodia reg
                WHERE patente LIKE '%${patente}%'
                ORDER BY aud_fecha_ins DESC`,
            [patente])
            
            await queryRunner.commitTransaction()
            return this.jsonRes(list, res);
        } catch (error) {
            this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async getRequirenteByCliente(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.startTransaction()
            const clienteId = req.body.clienteId
            const list = await queryRunner.query(`
                SELECT DISTINCT obj.desc_requirente descRequirente
                FROM lige.dbo.objetivocustodia obj
                WHERE obj.cliente_id = @0`,
            [clienteId])
            
            await queryRunner.commitTransaction()
            return this.jsonRes(list, res);
        } catch (error) {
            this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async searchRequirente(req: any, res: Response, next:NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.startTransaction()
            const { value } = req.body;
            const list = await queryRunner.query(`
                SELECT DISTINCT obj.desc_requirente fullName
                FROM lige.dbo.objetivocustodia obj
                WHERE obj.desc_requirente LIKE '%${value}%'`)
                
            await queryRunner.commitTransaction()
            return this.jsonRes(list, res);
        } catch (error) {
            this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    //Devuelve TRUE si el estado es 
    //[{ tipo: 1, descripcion: 'Finalizado' },{ tipo: 3, descripcion: 'A facturar' },{ tipo: 4, descripcion: 'Facturado' },]
    valByEstado(estado:any):boolean {
        switch (typeof estado) {
            case 'string':
                if (estado === 'Finalizado' || estado === 'A facturar' || estado === 'Facturado') 
                    return true
                else
                    return false
            case 'number':
                if (estado === 1 || estado === 3 || estado === 4)
                    return true
                else
                    return false
            default:
                return false
        }
    }
}
