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
        const monto_paga_personal = objetivoCustodia.montoPagaPersonal? objetivoCustodia.montoPagaPersonal : null
        const monto_paga_vehiculo = objetivoCustodia.montoPagaVehiculo? objetivoCustodia.montoPagaVehiculo : null
        const monto_facturacion_cliente = objetivoCustodia.facturacion? objetivoCustodia.facturacion : null
        const kilometros = objetivoCustodia.kilometros
        const estado = 0
        const fechaActual = new Date()
        return await queryRunner.query(`
            INSERT objetivocustodia(objetivo_custodia_id, responsable_id, cliente_id, descripcion, fecha_inicio, origen, fecha_fin, destino, monto_paga_personal, monto_paga_vehiculo, monto_facturacion_cliente, kilometros, estado, aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
            VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15, @13, @14, @15)`, 
            [objetivo_custodia_id, responsable_id, cliente_id, descripcion, fecha_inicio, origen, fecha_fin, destino, monto_paga_personal, monto_paga_vehiculo, monto_facturacion_cliente, kilometros, estado, usuario, usuarioIp, fechaActual]
        )
    }

    async addRegistroPersonalCustodiaQuery(queryRunner: any, personalId:any, objetivoCustodiaId: any){
        return await queryRunner.query(`INSERT registropersonalcustodia(personal_id, objetivo_custodia_id)
        VALUES ()`, 
        [personalId, objetivoCustodiaId])
    }

    async addRegistroVehiculoCustodiaQuery(queryRunner: any, patente:any, objetivoCustodiaId: any){
        return await queryRunner.query(`INSERT registrovehiculocustodia(objetivo_custodia_id, patente)
        VALUES ()`, 
        [objetivoCustodiaId, patente])
    }

    async addRegistroArmaCustodiaQuery(queryRunner: any, arma_id:any, objetivoCustodiaId: any){
        return await queryRunner.query(`INSERT registroarmacustodia(objetivo_custodia_id, arma_id)
        VALUES ()`, 
        [objetivoCustodiaId, arma_id])
    }

    async addVehiculoQuery(queryRunner: any, patente:any, duenoId: any){
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
        const queryRunner = dataSource.createQueryRunner();
    
        try {
            await queryRunner.startTransaction()
            if (!req.body.clienteId || !req.body.fechaInicial || !req.body.origen)
                throw new ClientException(`Los campos de Cliente, Fecha Inicial y Origen NO pueden estar vacios`)

            const usuario = res.locals.userName
            const ip = this.getRemoteAddress(req)
            let result = await queryRunner.query(`SELECT usu.UsuarioPersonalId PersonalId FROM Usuario usu WHERE usu.UsuarioNombre = @0`, [usuario])
            const responsableId = result[0] ? result[0]['PersonalId'] : 0
            const objetivoCustodiaId = await this.getProxNumero(queryRunner, `objetivocustodia`, usuario, ip)

            // console.log('usuario', usuario);
            // console.log('ip', ip);
            // console.log('responsableId', responsableId);
            // console.log('objetivoCustodiaId', objetivoCustodiaId);
            const objetivoCustodia = {...req.body, responsableId, objetivoCustodiaId}

            await this.addObjetivoCustodiaQuery(queryRunner, objetivoCustodia, usuario, ip)
            await queryRunner.commitTransaction()
            return
        }catch (error) {
            this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

}