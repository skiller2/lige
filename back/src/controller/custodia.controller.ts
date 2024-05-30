import { NextFunction, Response } from "express";
import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { QueryRunner } from "typeorm";
import { ObjetivoController } from "./objetivo.controller";
import { filtrosToSql, orderToSQL } from "src/impuestos-afip/filtros-utils/filtros";

const columnsObjCustodia: any[] = [
    {
        id:'id' , name:'Codigo' , field:'id',
        sortable: true,
        type: 'number',
        maxWidth: 100,
        // minWidth: 10,
    },
    {
        id:'cliente' , name:'Cliente' , field:'cliente',
        sortable: true,
        type: 'string',
        formatter: 'complexObject',
        params: {
            complexFieldLabel: 'cliente.fullName',
        },
        // maxWidth: 170,
        minWidth: 140,
    },
    {
        id:'descripcion' , name:'Descripcion' , field:'descripcion',
        sortable: true,
        type: 'text',
        // maxWidth: 300,
        minWidth: 230,
    },
    {
        id:'fechaI' , name:'Fecha Inicio' , field:'fechaI',
        sortable: true,
        type: 'dateTimeShortUs',
        maxWidth: 150,
        minWidth: 110,
    },
    {
        id:'origen' , name:'Origen' , field:'origen',
        sortable: true,
        type: 'string',
        // maxWidth: 180,
        minWidth: 140,
    },
    {
        id:'fechaF' , name:'Fecha Final' , field:'fechaF',
        sortable: true,
        type: 'dateTimeShortUs',
        maxWidth: 150,
        minWidth: 110,
    },
    {
        id:'destino' , name:'Destino' , field:'destino',
        sortable: true,
        type: 'string',
        // maxWidth: 180,
        minWidth: 140,
    },
    // {
    //     id:'montopersonal' , name:'Monto Personal' , field:'montopersonal',
    //     sortable: true,
    //     type: FieldType.string,
    //     maxWidth: 150,
    //     minWidth: 110,
    // },
    // {
    //     id:'montovehiculo' , name:'Monto Vehiculo' , field:'montovehiculo',
    //     sortable: true,
    //     type: FieldType.string,
    //     maxWidth: 150,
    //     minWidth: 110,
    // },
    // {
    //     id:'importe' , name:'Importe' , field:'importe',
    //     sortable: true,
    //     type: FieldType.string,
    //     maxWidth: 150,
    //     minWidth: 110,
    // },
    {
        id:'estado' , name:'Estado' , field:'estado',
        sortable: true,
        type: 'string',
        formatter: 'complexObject',
        params: {
            complexFieldLabel: 'estado.descripcion',
        },
        maxWidth: 180,
        minWidth: 130,
    },
]

export class CustodiaController extends BaseController {

    async addObjetivoCustodiaQuery(queryRunner: any, objetivoCustodia:any, usuario: any, ip: any){
        const objetivo_custodia_id = objetivoCustodia.objetivoCustodiaId
        const responsable_id = objetivoCustodia.responsableId
        const cliente_id = objetivoCustodia.clienteId
        const desc_requirente = objetivoCustodia.descRequirente? objetivoCustodia.descRequirente : null
        const descripcion = objetivoCustodia.descripcion? objetivoCustodia.descripcion : null
        const fecha_inicio = objetivoCustodia.fechaInicio.slice(0, 19).replace('T', ' ')
        const origen = objetivoCustodia.origen
        const fecha_fin = objetivoCustodia.fechaFinal? objetivoCustodia.fechaFinal.slice(0, 19).replace('T', ' ') : null
        const destino = objetivoCustodia.destino? objetivoCustodia.destino : null
        const cant_modulos = objetivoCustodia.cant_modulos? objetivoCustodia.cant_modulos : null
        const importe_modulos = objetivoCustodia.importeModulos? objetivoCustodia.importeModulos : null
        const cant_horas_exced = objetivoCustodia.cantHorasExced? objetivoCustodia.cantHorasExced : null
        const impo_horas_exced = objetivoCustodia.impoHorasExced? objetivoCustodia.impoHorasExced : null
        const cant_km_exced = objetivoCustodia.cantKmExced? objetivoCustodia.cantKmExced : null
        const impo_km_exced = objetivoCustodia.impoKmExced? objetivoCustodia.impoKmExced : null
        const impo_peaje = objetivoCustodia.impoPeaje? objetivoCustodia.impoPeaje : null
        const cant_horas = objetivoCustodia.cant_horas? objetivoCustodia.cant_horas : null
        const impo_facturar= objetivoCustodia.facturacion? objetivoCustodia.facturacion : null
        const kilometros = objetivoCustodia.kilometros
        const estado = objetivoCustodia.estado? objetivoCustodia.estado : 0
        const fechaActual = new Date()
        return await queryRunner.query(`
            INSERT lige.dbo.objetivocustodia(objetivo_custodia_id, responsable_id, cliente_id, desc_requirente, 
                descripcion, fecha_inicio, origen, fecha_fin, destino, cant_modulos, importe_modulos, cant_horas_exced,
                impo_horas_exced, cant_km_exced, impo_km_exced, impo_peaje, cant_horas, impo_facturar, kilometros, 
                estado, aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
            VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15, @16, @17, @18, @19, @20, @21, @22, @20, @21, @22)`, 
            [objetivo_custodia_id, responsable_id, cliente_id, desc_requirente, descripcion, fecha_inicio, origen, 
                fecha_fin, destino, cant_modulos, importe_modulos, cant_horas_exced, impo_horas_exced, 
                cant_km_exced, impo_km_exced, impo_peaje, cant_horas, impo_facturar, kilometros, estado, 
                usuario, ip, fechaActual]
        )
    }

    async addRegistroPersonalCustodiaQuery(queryRunner: any, infoPersonal:any, usuario:any, ip:any){
        const personal_id = infoPersonal.personalId
        const objetivo_custodia_id = infoPersonal.objetivoCustodiaId
        const importe_personal = infoPersonal.monto? infoPersonal.monto : null
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
        const importe_vehiculo = infoVehiculo.importe? infoVehiculo.importe : null
        const peaje_vehiculo = infoVehiculo.peaje? infoVehiculo.peaje : null
        const fechaActual = new Date()
        return await queryRunner.query(`INSERT lige.dbo.regvehiculocustodia(
            objetivo_custodia_id, patente, importe_vehiculo, peaje_vehiculo, 
            aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod
        )
        VALUES (@0, @1, @2, @3, @4, @5, @6, @4, @5, @6)`, 
        [objetivo_custodia_id, patente, importe_vehiculo, peaje_vehiculo, usuario, ip, fechaActual])
    }

    async addRegistroArmaCustodiaQuery(queryRunner: any, arma_id:any, objetivoCustodiaId: any){
        return await queryRunner.query(`INSERT regarmacustodia(objetivo_custodia_id, arma_id)
        VALUES ()`, 
        [objetivoCustodiaId, arma_id])
    }

    async addVehiculoQuery(queryRunner: any, patente:any, duenoId:any, usuario:any, ip:any){
        const fechaActual = new Date()
        return await queryRunner.query(`INSERT lige.dbo.vehiculo(patente, dueno_id, aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
        VALUES (@0, @1, @2, @3, @4, @2, @3, @4)`, 
        [patente, duenoId, usuario, ip, fechaActual])
    }

    async addArmaQuery(queryRunner: any, armaId:any, detalle:any){
        return await queryRunner.query(`INSERT arma(arma_id, detalle)
        VALUES ()`, 
        [armaId, detalle])
    }

    async getVehiculoByPatenteQuery(queryRunner: any, patente:any){
        return await queryRunner.query(`
        SELECT ve.patente, ve.dueno_id duenoId
        FROM lige.dbo.vehiculo ve
        WHERE ve.patente = @0`, 
        [patente])
    }

    async listObjetivoCustodiaByResponsableQuery(queryRunner: any, responsableId:number){
        return await queryRunner.query(`
        SELECT obj.objetivo_custodia_id id, obj.responsable_id responsableId, 
        obj.cliente_id clienteId, obj.descripcion, obj.fecha_inicio, 
        obj.origen, obj.fecha_fin, obj.destino, obj.estado, TRIM(cli.ClienteApellidoNombre) cliente
        FROM lige.dbo.objetivocustodia obj
        INNER JOIN Cliente cli ON cli.ClienteId = obj.cliente_id
        WHERE obj.responsable_id = @0`, 
        [responsableId])
    }

    async updateObjetivoCustodiaQuery(queryRunner: any, objetivoCustodia:any, usuario:any, ip:any){
        console.log('objetivoCustodia', objetivoCustodia);
        
        const objetivo_custodia_id = objetivoCustodia.objetivoCustodiaId
        const cliente_id = objetivoCustodia.clienteId
        const desc_requirente = objetivoCustodia.descRequirente? objetivoCustodia.descRequirente : null
        const descripcion = objetivoCustodia.descripcion? objetivoCustodia.descripcion : null
        const fecha_inicio = objetivoCustodia.fechaInicio.slice(0, 19).replace('T', ' ')
        const origen = objetivoCustodia.origen
        const fecha_fin = objetivoCustodia.fechaFinal? objetivoCustodia.fechaFinal.slice(0, 19).replace('T', ' ') : null
        const destino = objetivoCustodia.destino
        const cant_modulos = objetivoCustodia.cantModulos? objetivoCustodia.cantModulos : null
        const importe_modulos = objetivoCustodia.importeModulos? objetivoCustodia.importeModulos  :null
        const cant_horas_exced = objetivoCustodia.cantHorasExced? objetivoCustodia.cantHorasExced : null
        const impo_horas_exced = objetivoCustodia.impoHorasExced? objetivoCustodia.impoHorasExced : null
        const cant_km_exced = objetivoCustodia.cantKmExced? objetivoCustodia.cantKmExced : null
        const impo_km_exced = objetivoCustodia.impoKmExced? objetivoCustodia.impoKmExced : null
        const impo_peaje = objetivoCustodia.impoPeaje? objetivoCustodia.impoPeaje : null
        const cant_horas = objetivoCustodia.cantHoras? objetivoCustodia.cantHoras : null
        const impo_facturar= objetivoCustodia.facturacion? objetivoCustodia.facturacion : null
        const kilometros = objetivoCustodia.kilometros
        const estado = objetivoCustodia.estado? objetivoCustodia.estado : 0
        const fechaActual = new Date()
        return await queryRunner.query(`
        UPDATE lige.dbo.objetivocustodia 
        SET cliente_id = @1, desc_requirente = @2, descripcion = @3, fecha_inicio = @4, origen = @5, 
        fecha_fin = @6, destino = @7, cant_modulos = @8, importe_modulos = @9, cant_horas_exced = @10, 
        impo_horas_exced = @11, cant_km_exced = @12, impo_km_exced = @13, impo_peaje = @14, cant_horas = @15, 
        impo_facturar = @16, kilometros = @17, estado = @18, 
        aud_usuario_mod = @19, aud_ip_mod = @20, aud_fecha_mod = @21
        WHERE objetivo_custodia_id = @0`, 
        [objetivo_custodia_id, cliente_id, desc_requirente, descripcion, fecha_inicio, origen, fecha_fin, destino, 
            cant_modulos, importe_modulos, cant_horas_exced, impo_horas_exced, cant_km_exced, impo_km_exced, 
            impo_peaje, cant_horas, impo_facturar, kilometros, estado, usuario, ip, fechaActual
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
        const importe_vehiculo = infoVehiculo.monto? infoVehiculo.monto : null
        const peaje_vehiculo = infoVehiculo.peaje? infoVehiculo.peaje : null
        const fechaActual = new Date()
        return await queryRunner.query(`
        UPDATE lige.dbo.regvehiculocustodia
        SET patente = @1, importe_vehiculo = @2, peaje_vehiculo = @3, aud_usuario_mod = @4, aud_ip_mod = @5, aud_fecha_mod = @6
        WHERE objetivo_custodia_id = @0`, 
        [objetivo_custodia_id, patente, importe_vehiculo, peaje_vehiculo, usuario, ip, fechaActual])
    }

    async getObjetivoCustodiaQuery(queryRunner: any, custodiaId: any){
        return await queryRunner.query(`
        SELECT obj.objetivo_custodia_id id, obj.responsable_id responsableId, 
        obj.cliente_id clienteId, obj.desc_requirente descRequirente, obj.descripcion, obj.fecha_inicio fechaInicio, obj.origen, 
        obj.fecha_fin fechaFinal, obj.destino, obj.cant_modulos cantModulos, obj.importe_modulos importeModulos, 
        obj.cant_horas_exced cantHorasExced, obj.impo_horas_exced impoHorasExced, obj.cant_km_exced cantKmExced, 
        obj.impo_km_exced impoKmExced, obj.impo_peaje impoPeaje , obj.cant_horas cantHoras, obj.kilometros, 
        obj.impo_facturar facturacion, obj.estado
        FROM lige.dbo.objetivocustodia obj
        INNER JOIN Cliente cli ON cli.ClienteId = obj.cliente_id
        WHERE objetivo_custodia_id = @0`, 
        [custodiaId])
    }

    async getRegPersonalObjCustodiaQuery(queryRunner: any, custodiaId: any){
        return await queryRunner.query(`
        SELECT reg.personal_id personalId, reg.importe_personal importePersonal
        FROM lige.dbo.regpersonalcustodia reg
        INNER JOIN Personal per ON per.PersonalId = reg.personal_id
        WHERE objetivo_custodia_id = @0`, 
        [custodiaId])
    }

    async getRegVehiculoObjCustodiaQuery(queryRunner: any, custodiaId: any){
        return await queryRunner.query(`
        SELECT reg.patente , reg.importe_vehiculo importeVehiculo, reg.peaje_vehiculo peajeVehiculo, ve.dueno_id duenoId
        FROM lige.dbo.regvehiculocustodia reg
        INNER JOIN lige.dbo.vehiculo ve ON ve.patente = reg.patente
        INNER JOIN Personal per ON per.PersonalId = ve.dueno_id
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
                throw new ClientException(`Los campos de Cliente, Fecha Inicial y Origen NO pueden estar vacios`)

            const usuario = res.locals.userName
            const ip = this.getRemoteAddress(req)
            // const responsableId = 1
            const responsableId = res.locals.PersonalId
            if (!responsableId) 
                throw new ClientException(`No se a encontrado al personal responsable`)
            const objetivoCustodiaId = await this.getProxNumero(queryRunner, `objetivocustodia`, usuario, ip)
            // console.log('usuario', usuario, 'ip', ip, 'responsableId', responsableId, 'objetivoCustodiaId', objetivoCustodiaId);

            const objetivoCustodia = {...req.body, responsableId, objetivoCustodiaId}
            // console.log('objetivoCustodia', objetivoCustodia);
            await this.addObjetivoCustodiaQuery(queryRunner, objetivoCustodia, usuario, ip)

            let cantPersonal = 0
            let cantVehiculo = 0
            for (const key in req.body) {
                if( key.endsWith('personalId') && req.body[key]){
                    let i = parseInt(key)
                    let keyImporte = i.toString() + 'importePersonal'
                    let infoPersonal = {
                        personalId: req.body[key], 
                        importe: req.body[keyImporte], 
                        objetivoCustodiaId
                    }
                    await this.addRegistroPersonalCustodiaQuery(queryRunner, infoPersonal, usuario, ip)
                    cantPersonal++
                }

                if( key.endsWith('patente') && req.body[key]){
                    let i = parseInt(key)
                    let keyImporte = i.toString() + 'importeVehiculo'
                    let keyPeaje = i.toString() + 'peajeVehiculo'
                    let keyDueno = i.toString() + 'duenoId'
                    if (req.body[keyDueno]) {
                        let infoVehiculo = {
                            patente: req.body[key], 
                            importe: req.body[keyImporte], 
                            peaje: req.body[keyPeaje],
                            duenoId:req.body[keyDueno], 
                            objetivoCustodiaId
                        }
                        let result = await this.getVehiculoByPatenteQuery(queryRunner, req.body[key])
                        if (!result.length) {
                            await this.addVehiculoQuery(queryRunner, infoVehiculo.patente, infoVehiculo.duenoId, usuario, ip)
                        }
                        await this.addRegistroVehiculoCustodiaQuery(queryRunner, infoVehiculo, usuario, ip)
                        cantVehiculo++
                    }
                }
                
            }
            if (cantVehiculo == 0 && cantPersonal == 0) {
                throw new ClientException(`Debe de haber por lo menos una persona y un vehículo (Patente y Dueño) por custodia`)
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

    async listObjetivoCustodiaByResponsable(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try{
            await queryRunner.startTransaction()
            // const responsableId = 1
            const responsableId = res.locals.PersonalId
            let result = await this.listObjetivoCustodiaByResponsableQuery(queryRunner, responsableId)
            const estados= ['Pendiente', 'Finalizado', 'Cancelado']
            let list = result.map((obj : any) => {
                return {
                    id: obj.id,
                    responsable:{ id: responsableId},
                    cliente:{ id: obj.clienteId, fullName: obj.cliente},
                    descripcion: obj.descripcion,
                    fechaI: obj.fecha_inicio.toISOString().slice(0, 19).replace('T', ' '),
                    origen: obj.origen,
                    fechaF: obj.fecha_fin? obj.fecha_fin.toISOString().slice(0, 19).replace('T', ' ') : null,
                    destino: obj.destino,
                    estado: { tipo: obj.estado, descripcion: estados[obj.estado] }
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
            delete infoCustodia.id
            delete infoCustodia.responsableId
            delete infoCustodia.estado

            let listInputPersonal = []
            let listInputVehiculo = []
            listPersonal.forEach((obj:any, index:any)=>{
                const keys = Object.keys(obj)
                keys.forEach((key:any)=>{
                    let newKey = (index+1)+key
                    infoCustodia[newKey] = obj[key]
                })
                listInputPersonal.push(index+1)
            })
            listVehiculo.forEach((obj:any, index:any)=>{
                const keys = Object.keys(obj)
                keys.forEach((key:any)=>{
                    let newKey = (index+1)+key
                    infoCustodia[newKey] = obj[key]
                })
                listInputVehiculo.push(index+1)
            })
            
            let respuesta = {
                form: infoCustodia, 
                vehiculoLength: listInputVehiculo, 
                personalLength: listInputPersonal
            }
            // console.log('respuesta', respuesta);
            await queryRunner.commitTransaction()
            return this.jsonRes(respuesta, res)
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
            // const responsableId = 1
            const responsableId = res.locals.PersonalId
            const custodiaId = req.params.id
            const objetivoCustodia = {...req.body }
            let errores = []
            if (!responsableId) 
                throw new ClientException(`No se a encontrado al personal responsable`)
            let infoCustodia = await this.getObjetivoCustodiaQuery(queryRunner, custodiaId)
            infoCustodia= infoCustodia[0]

            if (responsableId != infoCustodia.responsableId) {
                throw new ClientException(`No eres el responsable de la custodia`)
            }
            
            if (!objetivoCustodia.clienteId || !objetivoCustodia.fechaInicio || !objetivoCustodia.origen){
                throw new ClientException(`Los campos de Cliente, Fecha Inicial y Origen NO pueden estar vacios`)
            }
            //En caso de FINALIZAR custodia verificar los campos
            if(objetivoCustodia.estado == 1 && ( !objetivoCustodia.fechaFinal || !objetivoCustodia.destino)){
                errores.push(`Los campos de Destino y Fecha Final NO pueden estar vacios`)
            }
            // if(objetivoCustodia.estado == 1 && (!objetivoCustodia.facturacion || !objetivoCustodia.fechaFinal || !objetivoCustodia.destino)){
            //     errores.push(`Los campos de Destino, Fecha Final y Importe a Facturar NO pueden estar vacios`)
            // }
            
            let listPersonal = await this.getRegPersonalObjCustodiaQuery(queryRunner, custodiaId)
            let listVehiculo = await this.getRegVehiculoObjCustodiaQuery(queryRunner, custodiaId)

            infoCustodia.fechaInicio = infoCustodia.fechaInicio.toISOString()
            infoCustodia.fechaFinal = infoCustodia.fechaFinal? infoCustodia.fechaFinal.toISOString() : infoCustodia.fechaFinal
            let cantPersonal = 0
            let cantVehiculo = 0
            let cantCambios = 0
            let personalError = 0
            let vehiculoError = 0
            
            // console.log( 'objetivoCustodia:', objetivoCustodia );
            // console.log( 'infoCustodia:', infoCustodia );
            // console.log( 'listPersonal:', listPersonal );
            // console.log( 'listVehiculo:', listVehiculo );
            for (const key in objetivoCustodia) {
                //Verifico si hubo cambios
                if (infoCustodia[key] != objetivoCustodia[key]){
                    cantCambios++
                }
                //Si hubo un cambio ACTUALIZA regpersonalcustodia 
                if( key.endsWith('personalId') && objetivoCustodia[key]){
                    let i = parseInt(key)
                    let keyImporte = i.toString() + 'importePersonal'
                    let infoPersonal = {
                        personalId: objetivoCustodia[key], 
                        importe: objetivoCustodia[keyImporte] , 
                        objetivoCustodiaId: custodiaId
                    }
                    //En caso de FINALIZAR custodia verificar los campos Importe de Personal
                    if(objetivoCustodia.estado == 1 && !infoPersonal.importe){
                        personalError++
                    }
                    let persona = null
                    for (let index = 0; index < listPersonal.length; index++) {
                        if(listPersonal[index].personalId == infoPersonal.personalId){
                            persona = listPersonal[index]
                            listPersonal = listPersonal.splice(i, 1)
                            break
                        }
                    }
                    if (!persona) { //Si el personal es nuevo AGREGAR
                        await this.addRegistroPersonalCustodiaQuery(queryRunner, infoPersonal, usuario, ip)
                    } else if (persona.importePersonal != infoPersonal.importe) { //Si hubo un cambio en regpersonalcustodia ACTUALIZA
                        await this.updateRegistroPersonalCustodiaQuery(queryRunner, infoPersonal, usuario, ip)
                    }
                    cantPersonal++
                }
                //Si hubo un cambio ACTUALIZA regvehiculocustodia
                if( key.endsWith('patente') && objetivoCustodia[key]){
                    let i = parseInt(key)
                    let keyImporte = i.toString() + 'importeVehiculo'
                    let keyPeaje = i.toString() + 'peajeVehiculo'
                    let keyDueno = i.toString() + 'duenoId'
                    if (objetivoCustodia[keyDueno]) {
                        let infoVehiculo = {
                            patente: objetivoCustodia[key], 
                            importe: objetivoCustodia[keyImporte], 
                            peaje: objetivoCustodia[keyPeaje], 
                            duenoId: objetivoCustodia[keyDueno], 
                            objetivoCustodiaId: custodiaId
                        }
                        let vehiculo
                        for (let index = 0; index < listVehiculo.length; index++) {
                            if(listVehiculo[index].patente == infoVehiculo.patente){
                                vehiculo = listVehiculo[index]
                                listVehiculo = listVehiculo.splice(i, 1)
                                break
                            }
                        }
                        if (!vehiculo) {
                            let result = await this.getVehiculoByPatenteQuery(queryRunner, objetivoCustodia[key])
                            if (!result.length) {
                                await this.addVehiculoQuery(queryRunner, infoVehiculo.patente, infoVehiculo.duenoId, usuario, ip)
                            } else if(result[0].duenoId != infoVehiculo.duenoId){ //Verifico que exista un dueño por patente
                                errores.push(`La patente ${infoVehiculo.patente} pertenece a otra persona`)
                            }
                            await this.addRegistroVehiculoCustodiaQuery(queryRunner, infoVehiculo, usuario, ip)
                        } else if (vehiculo.importeVehiculo != infoVehiculo.importe){
                            await this.updateRegistroVehiculoCustodiaQuery(queryRunner, infoVehiculo, usuario, ip)
                        }
                        
                        //En caso de FINALIZAR custodia verificar los campos Importe de Vehiculos
                        if(objetivoCustodia.estado == 1 && !infoVehiculo.importe){
                            vehiculoError++
                        }
                        cantVehiculo++
                    }
                }
            }
            if (cantVehiculo == 0 && cantPersonal == 0) {
                throw new ClientException(`Debe de haber por lo menos una persona y un vehículo (Patente y Dueño) por custodia`)
            }

            if(vehiculoError) {
                errores.push(`Los campos Importe de cada Personal NO pueden estar vacios.`)
            }

            if(personalError) {
                errores.push(`Los campos Importe de cada Vehiculo NO pueden estar vacios.`)
            }

            if (errores.length) {
                throw new ClientException(errores.join(`\n`))
            }

            //Si hubo un cambio en objetivocustodia ACTUALIZA
            if (cantCambios) {
                await this.updateObjetivoCustodiaQuery(queryRunner, {...objetivoCustodia, objetivoCustodiaId: custodiaId}, usuario, ip)
            }

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
    
}