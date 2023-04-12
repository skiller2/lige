import { Response } from "express";
import { BaseController } from "./baseController";
import { dataSource } from "../data-source";


export class AsistenciaController extends BaseController {


    async getCategoria(
        req: any,
        res: Response
    ) {
        try {
            const result = await dataSource.query(
                `SELECT val.ValorLiquidacionSucursalId, tip.TipoAsociadoDescripcion, tip.TipoAsociadoId, cat.CategoriaPersonalId, cat.CategoriaPersonalDescripcion, val.ValorLiquidacionHoraNormal
                FROM CategoriaPersonal cat
                JOIN TipoAsociado tip ON tip.TipoAsociadoId = cat.TipoAsociadoId
                JOIN ValorLiquidacion val ON val.ValorLiquidacionTipoAsociadoId = tip.TipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId=cat.CategoriaPersonalId
                WHERE GETDATE() BETWEEN val.ValorLiquidacionDesde AND COALESCE(val.ValorLiquidacionHasta, '9999-12-31')
                `
            )
            this.jsonRes(result, res)
        }
        catch (err) {
            this.errRes(err, res, "Error accediendo a la base de datos", 409)
        }
    }

    async getMetodologia(
        req: any,
        res: Response
    ) {
        const recordSet = new Array()
        recordSet.push({id: 'S', descripcion: 'Monto Fijo'})
        recordSet.push({id: 'E', descripcion: 'Equivalencia'})
        recordSet.push({id: 'A', descripcion: 'Monto Adicional por Hora'})
        recordSet.push({id: 'H', descripcion: 'Horas Adicionales'})

        this.jsonRes(recordSet, res)
    }

}
