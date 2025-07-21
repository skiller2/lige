import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { FileUploadController } from "../controller/file-upload.controller"
import { QueryRunner } from "typeorm";
import { ObjectId } from "typeorm/browser";


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
        name: "Cuit Cliente",
        type: "string",
        id: "CuitCliente",
        field: "CuitCliente",
        fieldName: "cli.CuitCliente",
        searchType: "string",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Cod Objetivo",
        type: "number",
        id: "CodigoObjetivo",
        field: "CodigoObjetivo",
        fieldName: "obj.CodigoObjetivo",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Cod Producto",
        type: "string",
        id: "CodigoProducto",
        field: "CodigoProducto",
        fieldName: "prod.CodigoProducto",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Periodo (Mes/Año)",
        type: "string",
        id: "Periodo",
        field: "Periodo",
        fieldName: "fact.Periodo",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Descripción",
        type: "string",
        id: "Descripcion",
        field: "Descripcion",
        fieldName: "fact.Descripcion",
        searchType: "string",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Precio Unitario",
        type: "number",
        id: "PrecioUnitario",
        field: "PrecioUnitario",
        fieldName: "fact.PrecioUnitario",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Cantidad",
        type: "number",
        id: "Cantidad",
        field: "Cantidad",
        fieldName: "fact.Cantidad",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Importe Total",
        type: "number",
        id: "ImporteTotal",
        field: "ImporteTotal",
        fieldName: "fact.ImporteTotal",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Fecha",
        type: "date",
        id: "Fecha",
        field: "Fecha",
        fieldName: "fact.Fecha",
        searchComponent: "inpurForFechaSearch",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Nro Comprobante",
        type: "string",
        id: "NroComprobante",
        field: "NroComprobante",
        fieldName: "fact.NroComprobante",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Tipo Comprobante",
        type: "string",
        id: "TipoComprobante",
        field: "TipoComprobante",
        fieldName: "fact.TipoComprobante",
        sortable: true,
        hidden: false,
        searchHidden: false
    }
];


export class FacturacionController extends BaseController {


    async getGridCols(req, res) {
        this.jsonRes(listaColumnas, res);
    }

    async list(req: any, res: Response, next: NextFunction) {

        const filterSql = filtrosToSql(req.body.options.filtros, listaColumnas);
        const orderBy = orderToSQL(req.body.options.sort)
        const queryRunner = dataSource.createQueryRunner();
        const fechaActual = new Date()
        const anio = fechaActual.getFullYear()
        const mes = fechaActual.getMonth() + 1
       
        try {
            const objetivos = await queryRunner.query(
                ` ${filterSql} ${orderBy}`, [anio, mes, fechaActual])

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


   

}
