import { NextFunction, Response } from "express";
import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { QueryRunner } from "typeorm";
import { ObjetivoController } from "./objetivo.controller";
import { filtrosToSql, orderToSQL } from "src/impuestos-afip/filtros-utils/filtros";

export class CustodiaController extends BaseController {

    async addObjetivoCustodiaQuery(queryRunner: any, objetivoCustodia:any, usuario: any, ip: any){
        const objetivo_custodia_id = objetivoCustodia.objetivoCustodiaId
        const responsable_id = objetivoCustodia.responsableId
        const cliente_id = objetivoCustodia.clienteId
        const descripcion = objetivoCustodia.descripcion? objetivoCustodia.descripcion : null
        const fecha_inicio = objetivoCustodia.fechaInicio
        const origen = objetivoCustodia.origen
        const fecha_fin = objetivoCustodia.fechaFinal? objetivoCustodia.fechaFinal : null
        const destino = objetivoCustodia.destino? objetivoCustodia.destino :null
        const monto_facturacion_cliente = objetivoCustodia.facturacion? objetivoCustodia.facturacion : null
        const kilometros = objetivoCustodia.kilometros
        const estado = 0
        const fechaActual = new Date()
        return await queryRunner.query(`
            INSERT lige.dbo.objetivocustodia(objetivo_custodia_id, responsable_id, cliente_id, descripcion, fecha_inicio, origen, fecha_fin, destino, monto_facturacion_cliente, kilometros, estado, aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
            VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @11, @12, @13)`, 
            [objetivo_custodia_id, responsable_id, cliente_id, descripcion, fecha_inicio, origen, fecha_fin, destino, monto_facturacion_cliente, kilometros, estado, usuario, ip, fechaActual]
        )
    }

    async addRegistroPersonalCustodiaQuery(queryRunner: any, infoPersonal:any, usuario:any, ip:any){
        const personal_id = infoPersonal.personalId
        const objetivo_custodia_id = infoPersonal.objetivoCustodiaId
        const monto_paga_personal = infoPersonal.monto? infoPersonal.monto : null
        const fechaActual = new Date()
        return await queryRunner.query(`INSERT lige.dbo.regpersonalcustodia(personal_id, objetivo_custodia_id, monto_paga_personal, aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
        VALUES (@0, @1, @2, @3, @4, @5, @3, @4, @5)`, 
        [personal_id, objetivo_custodia_id, monto_paga_personal, usuario, ip, fechaActual])
    }

    async addRegistroVehiculoCustodiaQuery(queryRunner: any, infoVehiculo:any, usuario:any, ip:any){
        const objetivo_custodia_id = infoVehiculo.objetivoCustodiaId
        const patente = infoVehiculo.patente
        const monto_paga_vehiculo = infoVehiculo.monto? infoVehiculo.monto : null
        const fechaActual = new Date()
        return await queryRunner.query(`INSERT lige.dbo.regvehiculocustodia(objetivo_custodia_id, patente, monto_paga_vehiculo, aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
        VALUES (@0, @1, @2, @3, @4, @5, @3, @4, @5)`, 
        [objetivo_custodia_id, patente, monto_paga_vehiculo, usuario, ip, fechaActual])
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
        SELECT ve.patente, ve.dueno_id
        FROM lige.dbo.vehiculo ve
        WHERE ve.patente = @0`, 
        [patente])
    }

    async addObjetivoCustodia(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
    
        try {
            await queryRunner.startTransaction()
            if (!req.body.clienteId || !req.body.fechaInicial || !req.body.origen)
                throw new ClientException(`Los campos de Cliente, Fecha Inicial y Origen NO pueden estar vacios`)

            const usuario = res.locals.userName
            const ip = this.getRemoteAddress(req)
            // const responsableId = 1
            const responsableId = res.locals.PersonalId
            const objetivoCustodiaId = await this.getProxNumero(queryRunner, `objetivocustodia`, usuario, ip)
            console.log('usuario', usuario, 'ip', ip, 'responsableId', responsableId, 'objetivoCustodiaId', objetivoCustodiaId);

            const objetivoCustodia = {...req.body, responsableId, objetivoCustodiaId}
            console.log('objetivoCustodia', objetivoCustodia);
            await this.addObjetivoCustodiaQuery(queryRunner, objetivoCustodia, usuario, ip)

            let cantPersonal = 0
            let cantVehiculo = 0
            for (const key in req.body) {
                if( key.endsWith('personalId') && req.body[key]){
                    let i = parseInt(key)
                    let keyImporte = i.toString() + 'importePersonal'
                    let infoPersonal = {personalId: req.body[key], monto: req.body[keyImporte] , objetivoCustodiaId}
                    console.log('infoPersonal'+i, infoPersonal);
                    await this.addRegistroPersonalCustodiaQuery(queryRunner, infoPersonal, usuario, ip)
                    cantPersonal++
                }

                if( key.endsWith('patente') && req.body[key]){
                    let i = parseInt(key)
                    let keyImporte = i.toString() + 'importeVehiculo'
                    let keyDueno = i.toString() + 'duenoId'
                    if (req.body[keyDueno]) {
                        let infoVehiculo = {patente: req.body[key], monto: req.body[keyImporte] , duenoId:req.body[keyDueno], objetivoCustodiaId}
                        console.log('infoVehiculo'+i, infoVehiculo);
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
                throw new ClientException(`Debe de haber por lo menos una persona y un vehículo (Patente y Dueño)`)
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

}