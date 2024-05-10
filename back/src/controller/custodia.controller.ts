import { NextFunction, Response } from "express";
import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { QueryRunner } from "typeorm";
import { ObjetivoController } from "./objetivo.controller";
import { filtrosToSql, orderToSQL } from "src/impuestos-afip/filtros-utils/filtros";

export class CustodiaController extends BaseController {

    async addObjetivoCustodiaQuery(queryRunner: any, objetivoCustodia:any, usuario: any, usuarioIp: any){
        const objetivo_custodia_id = objetivoCustodia.objetivoCustodiaId
        const responsable_id = objetivoCustodia.responsableId
        const cliente_id = objetivoCustodia.clienteId
        const descripcion = objetivoCustodia.descripcion? objetivoCustodia.descripcion : null
        const fecha_inicio = objetivoCustodia.fechaInicio
        const origen = objetivoCustodia.origen
        const fecha_fin = objetivoCustodia.fechaFinal? objetivoCustodia.fechaFinal : null
        const destino = objetivoCustodia.destino? objetivoCustodia.destino :null
        // const monto_paga_personal = objetivoCustodia.montoPagaPersonal? objetivoCustodia.montoPagaPersonal : null
        // const monto_paga_vehiculo = objetivoCustodia.montoPagaVehiculo? objetivoCustodia.montoPagaVehiculo : null
        const monto_facturacion_cliente = objetivoCustodia.facturacion? objetivoCustodia.facturacion : null
        const kilometros = objetivoCustodia.kilometros
        const estado = 0
        const fechaActual = new Date()
        // return await queryRunner.query(`
        //     INSERT objetivocustodia(objetivo_custodia_id, responsable_id, cliente_id, descripcion, fecha_inicio, origen, fecha_fin, destino, monto_paga_personal, monto_paga_vehiculo, monto_facturacion_cliente, kilometros, estado, aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
        //     VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15, @13, @14, @15)`, 
        //     [objetivo_custodia_id, responsable_id, cliente_id, descripcion, fecha_inicio, origen, fecha_fin, destino, monto_paga_personal, monto_paga_vehiculo, monto_facturacion_cliente, kilometros, estado, usuario, usuarioIp, fechaActual]
        // )
        return await queryRunner.query(`
            INSERT lige.dbo.objetivocustodia(objetivo_custodia_id, responsable_id, cliente_id, descripcion, fecha_inicio, origen, fecha_fin, destino, monto_facturacion_cliente, kilometros, estado, aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
            VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @11, @12, @13)`, 
            [objetivo_custodia_id, responsable_id, cliente_id, descripcion, fecha_inicio, origen, fecha_fin, destino, monto_facturacion_cliente, kilometros, estado, usuario, usuarioIp, fechaActual]
        )
    }

    async addRegistroPersonalCustodiaQuery(queryRunner: any, infoPersonal:any, usuario:any, ip:any){
        const personal_id = infoPersonal.personalId
        const objetivo_custodia_id = infoPersonal.objetivoCustodiaId
        const monto = infoPersonal.monto? infoPersonal.monto : null
        const fechaActual = new Date()
        return await queryRunner.query(`INSERT lige.dbo.registropersonalcustodia(personal_id, objetivo_custodia_id, monto_personal, aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
        VALUES (@0, @1, @2, @3, @4, @5, @3, @4, @5)`, 
        [personal_id, objetivo_custodia_id, monto, usuario, ip, fechaActual])
    }

    async addRegistroVehiculoCustodiaQuery(queryRunner: any, infoVehiculo:any, usuario:any, ip:any){
        const objetivo_custodia_id = infoVehiculo.objetivoCustodiaId
        const patente = infoVehiculo.patente
        const monto = infoVehiculo.monto? infoVehiculo.monto : null
        const fechaActual = new Date()
        return await queryRunner.query(`INSERT lige.dbo.registrovehiculocustodia(objetivo_custodia_id, patente, monto, aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
        VALUES (@0, @1, @2, @3, @4, @5, @3, @4, @5)`, 
        [objetivo_custodia_id, patente, monto, usuario, ip, fechaActual])
    }

    async addRegistroArmaCustodiaQuery(queryRunner: any, arma_id:any, objetivoCustodiaId: any){
        return await queryRunner.query(`INSERT registroarmacustodia(objetivo_custodia_id, arma_id)
        VALUES ()`, 
        [objetivoCustodiaId, arma_id])
    }

    async addVehiculoQuery(queryRunner: any, patente:any, duenoId: any, usuario:any, ip:any){
        const fechaActual = new Date()
        return await queryRunner.query(`INSERT vehiculo(patente, dueno_id)
        VALUES ()`, 
        [patente, duenoId])
    }

    async addArmaQuery(queryRunner: any, armaId:any, detalle:any){
        return await queryRunner.query(`INSERT arma(arma_id, detalle)
        VALUES ()`, 
        [armaId, detalle])
    }

    async addObjetivoCustodia(req: any, res: Response, next: NextFunction) {
        // const queryRunner = dataSource.createQueryRunner();
    
        try {
            // await queryRunner.startTransaction()
            // if (!req.body.clienteId || !req.body.fechaInicial || !req.body.origen)
            //     throw new ClientException(`Los campos de Cliente, Fecha Inicial y Origen NO pueden estar vacios`)

            const usuario = res.locals.userName
            const ip = this.getRemoteAddress(req)
            const responsableId = res.locals.PersonalId
            const objetivoCustodiaId = 1000 //
            // const objetivoCustodiaId = await this.getProxNumero(queryRunner, `objetivocustodia`, usuario, ip)

            for (const key in req.body) {
                if( key.endsWith('personalId') ){
                    let i = parseInt(key)
                    let keyImporte = i.toString() + 'importePersonal'
                    let infoPersonal = {personalId: req.body[key], monto: req.body[keyImporte] , objetivoCustodiaId}
                    console.log('infoPersonal'+i, infoPersonal);
                    
                    // await this.addRegistroPersonalCustodiaQuery(queryRunner, infoPersonal, usuario, ip)
                }

                if( key.endsWith('patente') ){
                    let i = parseInt(key)
                    let keyImporte = i.toString() + 'importeVehiculo'
                    let infoVehiculo = {patente: req.body[key], monto: req.body[keyImporte] , objetivoCustodiaId}
                    console.log('infoVehiculo'+i, infoVehiculo);
                    // await this.addRegistroVehiculoCustodiaQuery(queryRunner, infoVehiculo, usuario, ip)
                }
                
            }
            
            const objetivoCustodia = {...req.body, responsableId, objetivoCustodiaId}
            console.log('objetivoCustodia', objetivoCustodia);

            // await this.addObjetivoCustodiaQuery(queryRunner, objetivoCustodia, usuario, ip)
            // await queryRunner.commitTransaction()
            return
        }catch (error) {
            // this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            // await queryRunner.release()
        }
    }

}