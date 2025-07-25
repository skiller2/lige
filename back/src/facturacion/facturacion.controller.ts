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
        name: "Cliente",
        type: "string",
        id: "ClienteId",
        field: "ClienteId",
        fieldName: "cli.ClienteId",
        searchComponent: "inpurForClientSearch",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
    {
        name: "Cuit Cliente",
        type: "string",
        id: "CuitCliente",
        field: "ClienteFacturacionCUIT",
        fieldName: "clif.ClienteFacturacionCUIT",
        searchType: "string",
        sortable: true,
        hidden: false,
        searchHidden: true
    },
    {
        name: "Cod Objetivo",
        type: "number",
        id: "ObjetivoCodigo",
        field: "ObjetivoCodigo",
        fieldName: "obj.ObjetivoCodigo",
        searchComponent: "inpurForObjetivoSearch",

        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Cod Producto",
        type: "string",
        id: "CodigoProducto",
        field: "CodigoProducto",
        fieldName: "fac.CodigoProducto",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Periodo (Mes/Año)",
        type: "string",
        id: "Periodo",
        field: "Periodo",
        fieldName: "Periodo",
        sortable: true,
        hidden: false,
        searchHidden: true
    },
    {
        name: "Descripción",
        type: "string",
        id: "Descripcion",
        field: "Descripcion",
        fieldName: "fac.Descripcion",
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
        fieldName: "fac.PrecioUnitario",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Cantidad",
        type: "number",
        id: "Cantidad",
        field: "Cantidad",
        fieldName: "fac.Cantidad",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Importe Total",
        type: "number",
        id: "ImporteTotal",
        field: "ImporteTotal",
        fieldName: "fac.ImporteTotal",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Fecha",
        type: "date",
        id: "Fecha",
        field: "Fecha",
        fieldName: "fac.Fecha",
        searchComponent: "inpurForFechaSearch",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Nro Comprobante",
        type: "string",
        id: "ComprobanteNro",
        field: "ComprobanteNro",
        fieldName: "fac.ComprobanteNro",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Tipo Comprobante",
        type: "string",
        id: "ComprobanteTipoCodigo",
        field: "ComprobanteTipoCodigo",
        fieldName: "fac.ComprobanteTipoCodigo",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
    {
        name: "Tipo Comprobante",
        type: "string",
        id: "ComprobanteDescripcion",
        field: "ComprobanteDescripcion",
        fieldName: "ctp.Descripcion",
        sortable: true,
        hidden: false,
        searchHidden: true
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
            const facturacion = await queryRunner.query(
                `SELECT 
                    ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS id,
                    clif.ClienteFacturacionCUIT,
                    CONCAT(eledep.ClienteId,'/', ISNULL(eledep.ClienteElementoDependienteId,0)) AS ObjetivoCodigo,
                    fac.CodigoProducto,
                    fac.Mes,
                    fac.Anio,
                    CONCAT(fac.Mes,'/',fac.Anio) AS Periodo,
                    fac.Descripcion,
                    fac.PrecioUnitario,
                    fac.Cantidad,
                    fac.ImporteTotal,
                    fac.Fecha,
                    fac.ComprobanteNro,
                    fac.ComprobanteTipoCodigo,
                    ctp.Descripcion AS ComprobanteDescripcion,
                    cli.ClienteApellidoNombre
                    
                    FROM Facturacion fac
                    Left JOIN ClienteElementoDependiente eledep ON eledep.ClienteId=fac.ClienteId and eledep.ClienteElementoDependienteId=fac.ClienteElementoDependienteId
                    LEFT JOIN Cliente cli ON cli.ClienteId=eledep.ClienteId
                    INNER JOIN ComprobanteTipo ctp ON ctp.ComprobanteTipoCodigo = fac.ComprobanteTipoCodigo
                        LEFT JOIN ClienteFacturacion clif ON clif.ClienteId = fac.ClienteId  
                                AND clif.ClienteFacturacionDesde <= @0
                AND ISNULL(clif.ClienteFacturacionHasta, '9999-12-31') >= @0 WHERE ${filterSql} ${orderBy}`, [fechaActual])


            this.jsonRes(
                {
                    total: facturacion.length,
                    list: facturacion,
                },
                res
            );

        } catch (error) {
            return next(error)
        }

    }

    async getComprobanteTipoOptions(req: any, res: Response, next: NextFunction) {
        const result = await dataSource.query(`
          SELECT ComprobanteTipoCodigo, Descripcion FROM ComprobanteTipo`)
        this.jsonRes(result, res);
      }

    async getFacturas(req: any, res: Response, next: NextFunction) {

        const comprobantesRaw = req.params.ComprobanteNro
        const comprobantes = comprobantesRaw
          .split(',')
          .map(c => `'${c.trim().replace(/'/g, "''")}'`)
        
        const inClause = comprobantes.join(', ')
        const sql = `  SELECT 
        fac.ComprobanteNro,
        fac.ComprobanteTipoCodigo,
        fac.ImporteTotal,
        fac.Descripcion,
        fac.PrecioUnitario,
        fac.Fecha,
        fac.CodigoProducto,
        CONCAT(fac.Mes,'/',fac.Anio) AS Periodo,

        fac.Cantidad,
        CONCAT(eledep.ClienteId,'/', ISNULL(eledep.ClienteElementoDependienteId,0)) AS ObjetivoCodigo
         FROM Facturacion fac
        Left JOIN ClienteElementoDependiente eledep ON eledep.ClienteId=fac.ClienteId and eledep.ClienteElementoDependienteId=fac.ClienteElementoDependienteId
        WHERE LTRIM(RTRIM(ComprobanteNro)) IN (${inClause})`
      
        const result = await dataSource.query(sql);
        this.jsonRes(result, res);
      }
   

}
