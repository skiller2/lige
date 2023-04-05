import { Response } from "express";
import { BaseController } from "./baseController";
import { dataSource } from "../data-source";


export class AsistenciaController extends BaseController {


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
