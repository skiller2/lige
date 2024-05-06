import { NextFunction, Response } from "express";
import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { QueryRunner } from "typeorm";
import { ObjetivoController } from "./objetivo.controller";
import { filtrosToSql, orderToSQL } from "src/impuestos-afip/filtros-utils/filtros";

export class CustodiaController extends BaseController {

    async addObjetivoCustodiaQuery(queryRunner: any, objetivoCustodia:any){
        const responsable_id = objetivoCustodia.responsable_id
        const cliente_id = objetivoCustodia.cliente_id
        const descripcion = objetivoCustodia.descripcion
        const fecha_inicio = objetivoCustodia.fecha_inicio
        const origen = objetivoCustodia.origen
        const fecha_fin = objetivoCustodia.fecha_fin
        const destino = objetivoCustodia.destino
        const monto_paga_personal = objetivoCustodia.monto_paga_personal
        const monto_paga_vehiculo = objetivoCustodia.monto_paga_vehiculo
        const monto_facturacion_cliente = objetivoCustodia.monto_facturacion_cliente
        const kilometros = objetivoCustodia.kilometros
        const estado = objetivoCustodia.estado
        return await queryRunner.query(`INSERT objetivocustodia(responsable_id, cliente_id, descripcion, fecha_inicio, origen, fecha_fin, destino, monto_paga_personal, monto_paga_vehiculo, monto_facturacion_cliente, kilometros, estado)
        VALUES ()`, 
        [responsable_id, cliente_id, descripcion, fecha_inicio, origen, fecha_fin, destino, monto_paga_personal, monto_paga_vehiculo, monto_facturacion_cliente, kilometros, estado])
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
          const data = req.body

        }catch (error) {
            this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }
}