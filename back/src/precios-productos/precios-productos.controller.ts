import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { QueryResult } from "typeorm";
import { FileUploadController } from "../controller/file-upload.controller"
import { info } from "pdfjs-dist/types/src/shared/util";



export class PreciosProductosController extends BaseController {

    listaColumnas: any[] = [
        {
            id: "id",
            name: "id",
            field: "id",
            fieldName: "cli.ClienteId",
            type: "number",
            sortable: false,
            hidden: true,
            searchHidden: true
        },
        {
            id: "Cod Prodcuto",
            name: "codigo",
            field: "codigo",
            fieldName: " prod.cod_producto",
            type: "number",
            sortable: true,
            searchHidden: false,
            hidden: false,
        },
        {
            name: "Nombre de Prod",
            type: "string",
            id: "nombre",
            field: "nombre",
            fieldName: "prod.nom_producto",
            searchType: "string",
            sortable: true,
            searchHidden: false,
            hidden: false,
        },
        {
            name: "Tipo de Prod",
            type: "string",
            id: "descripcionTipoProducto",
            field: "descripcionTipoProducto",
            fieldName: "tip.des_tipo_product",
            searchType: "string",
            searchHidden: false
        },
        {
            name: "Descrip de Prod",
            type: "string",
            id: "descripcion",
            field: "descripcion",
            fieldName: "prod.des_producto",
            searchType: "string",
            searchHidden: false
        },
        {
            name: "Importe",
            type: "number",
            id: "importe",
            field: "importe",
            fieldName: "vent.importe",
            sortable: true,
            hidden: false,
            searchHidden: false
        },
        {
            name: "Ind Activo Producto",
            type: "number",
            id: "activo",
            field: "activo",
            fieldName: "prod.ind_activo",
            sortable: true,
            hidden: false,
            searchHidden: false
        },
        {
            name: "Fecha Importe Desde",
            type: "date",
            id: "desde",
            field: "desde",
            fieldName: "inpurForFechaSearch",
            sortable: true,
            hidden: false,
            searchHidden: false
        },

        {
            name: "Sucursal",
            type: "string",
            id: "SucursalDescripcion",
            field: "SucursalDescripcion",
            fieldName: "suc.SucursalDescripcion",
            sortable: true,
            searchHidden: true
        }
    ];

    async getGridCols(req, res) {
        this.jsonRes(this.listaColumnas, res);
    }


    async listPrecios(req: any, res: Response, next: NextFunction) {

        const filterSql = filtrosToSql(req.body.options.filtros, this.listaColumnas);
        const orderBy = orderToSQL(req.body.options.sort)
        const queryRunner = dataSource.createQueryRunner();
        const fechaActual = new Date()

        try {

            const precios = await queryRunner.query(
                `SELECT 
                    ROW_NUMBER() OVER (ORDER BY prod.cod_producto) AS id,
                    prod.cod_producto AS codigo, 
                    prod.des_producto AS descripcion,
                    prod.nom_producto AS nombre,
                    prod.ind_activo AS activo,  
                    tip.des_tipo_producto AS descripcionTipoProducto,
                    vent.importe AS importe,
                    FORMAT(vent.importe_desde, 'yyyy-MM-dd') AS desde,
                    suc.SucursalId, 
                    suc.SucursalDescripcion
                FROM lige.dbo.lpv_productos prod
                INNER JOIN lige.dbo.lpv_tipo_producto tip ON prod.cod_tipo_producto = tip.cod_tipo_producto
                INNER JOIN lige.dbo.lpv_precio_venta vent ON prod.cod_producto = vent.cod_producto
                LEFT JOIN Sucursal suc ON vent.SucursalId = suc.SucursalId  WHERE  ${filterSql} ${orderBy}`, [fechaActual])

            this.jsonRes(
                {
                    total: precios.length,
                    list: precios,
                },
                res
            );

        } catch (error) {
            return next(error)
        }

    }


    
    async changecell(req: any, res: Response, next: NextFunction) {

        //const filterSql = filtrosToSql(req.body.options.filtros, this.listaColumnas);
       // const orderBy = orderToSQL(req.body.options.sort)
        const queryRunner = dataSource.createQueryRunner();
        const fechaActual = new Date()
        const params = req.body

        try {

            await queryRunner.connect();
            await queryRunner.startTransaction();

            const codigoExist = await queryRunner.query( `SELECT *  FROM lige.dbo.lpv_productos WHERE cod_producto = @0`, [params.codigo])

            if (codigoExist.length > 0) {
                console.log('El código existe - es update')

              } else {
                console.log('El código no existe - es nuevo')
              
            }

            await queryRunner.commitTransaction();
        } catch (error) {
           await this.rollbackTransaction(queryRunner)
            return next(error)
        }

    }


 
}
