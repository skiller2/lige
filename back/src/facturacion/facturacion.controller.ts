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
        searchComponent: "inputForClientSearch",
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
        searchComponent: "inputForObjetivoSearch",

        sortable: true,
        hidden: false,
        searchHidden: false
    },
    
    {
        name: "Razón Social",
        type: "string",
        id: "ClienteDenominacion",
        field: "ClienteDenominacion",
        fieldName: "cli.ClienteDenominacion",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Producto",
        type: "string",
        id: "Nombre",
        field: "Nombre",
        fieldName: "pro.Nombre",
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
        type: "float",
        id: "PrecioUnitario",
        field: "PrecioUnitario",
        fieldName: "fac.PrecioUnitario",
        searchType: "float",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Cantidad",
        type: "float",
        id: "Cantidad",
        field: "Cantidad",
        fieldName: "fac.Cantidad",
        searchType: "float",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Importe Total",
        type: "float",
        id: "ImporteTotal",
        field: "ImporteTotal",
        fieldName: "fac.ImporteTotal",
        searchType: "float",
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


const listaColumnasDetail: any[] = [
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
        name: "FacturacionCodigo",
        type: "number",
        id: "FacturacionCodigo",
        field: "FacturacionCodigo",
        fieldName: "fac.FacturacionCodigo",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
    {
        name: "Cod Objetivo",
        type: "number",
        id: "ObjetivoCodigo",
        field: "ObjetivoCodigo",
        fieldName: "obj.ObjetivoCodigo",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Cod Producto",
        type: "string",
        id: "ProductoCodigo",
        field: "ProductoCodigo",
        fieldName: "fac.ProductoCodigo",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Periodo",
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
        type: "float",
        id: "PrecioUnitario",
        field: "PrecioUnitario",
        fieldName: "fac.PrecioUnitario",
        searchType: "float",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Cantidad",
        type: "float",
        id: "Cantidad",
        field: "Cantidad",
        fieldName: "fac.Cantidad",
        searchType: "float",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Importe Total",
        type: "float",
        id: "ImporteTotal",
        field: "ImporteTotal",
        fieldName: "fac.ImporteTotal",
        searchType: "float",
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
        hidden: true,
        searchHidden: false
    }
];

export class FacturacionController extends BaseController {


    async getGridCols(req, res) {
        this.jsonRes(listaColumnas, res);
    }

    async getGridColsDetail(req, res) {
        this.jsonRes(listaColumnasDetail, res);
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
                     fac.FacturacionCodigo AS id,
                    fac.FacturacionCodigo,
                    clif.ClienteFacturacionCUIT,
                    CONCAT(eledep.ClienteId,'/', ISNULL(eledep.ClienteElementoDependienteId,0)) AS ObjetivoCodigo,
                    fac.ProductoCodigo,
                    pro.Nombre,
                    fac.Mes,
                    fac.Anio,
                    CONCAT(fac.Mes,'/',fac.Anio) AS Periodo,
                    fac.Descripcion,
                    fac.PrecioUnitario,
                    fac.Cantidad,
                    fac.ImporteTotal,
                    fac.ComprobanteNro,
                    fac.ComprobanteTipoCodigo,
                    ctp.Descripcion AS ComprobanteDescripcion,
                    cli.ClienteApellidoNombre,
                    cli.ClienteDenominacion
                    FROM Facturacion fac
                    Left JOIN ClienteElementoDependiente eledep ON eledep.ClienteId=fac.ClienteId and eledep.ClienteElementoDependienteId=fac.ClienteElementoDependienteId
                    LEFT JOIN Cliente cli ON cli.ClienteId=eledep.ClienteId
                    LEFT JOIN Producto pro ON pro.ProductoCodigo = fac.ProductoCodigo
                    LEFT JOIN ComprobanteTipo ctp ON ctp.ComprobanteTipoCodigo = fac.ComprobanteTipoCodigo
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


        // const filterSql = filtrosToSql(req.body.options.filtros, listaColumnas);
        // const orderBy = orderToSQL(req.body.options.sort)
        const queryRunner = dataSource.createQueryRunner();

        const ComprobanteNro = req.params.ComprobanteNro
        const FacturacionCodigo = req.params.FacturacionCodigo
        console.log("ComprobanteNro ", req.params)
        console.log("FacturacionCodigo ", FacturacionCodigo)
        let comprobanteCondicion = '';

        if (ComprobanteNro !== 'null') {
            comprobanteCondicion = `= '${ComprobanteNro}'`
        } else {
            comprobanteCondicion = 'IS NULL';
        }

        try {
            const facturacionDetail = await queryRunner.query(
                `
          SELECT 
            fac.FacturacionCodigo AS id,
            fac.FacturacionCodigo,
            fac.ComprobanteNro,
            fac.ComprobanteTipoCodigo,
            fac.ImporteTotal,
            fac.Descripcion,
            fac.PrecioUnitario,
            fac.ProductoCodigo,
            pro.Nombre,
            CONCAT(fac.Mes,'/',fac.Anio) AS Periodo,
            fac.Cantidad,
            CONCAT(eledep.ClienteId,'/', ISNULL(eledep.ClienteElementoDependienteId,0)) AS ObjetivoCodigo
          FROM Facturacion fac
          LEFT JOIN Producto pro ON pro.ProductoCodigo = fac.ProductoCodigo
          LEFT JOIN ClienteElementoDependiente eledep 
            ON eledep.ClienteId = fac.ClienteId 
           AND eledep.ClienteElementoDependienteId = fac.ClienteElementoDependienteId
          WHERE fac.ComprobanteNro ${comprobanteCondicion}
      
            ${ComprobanteNro == 'null' ? `AND fac.FacturacionCodigo in (${FacturacionCodigo})` : ''}
        `,)
            this.jsonRes(
                {
                    total: facturacionDetail.length,
                    list: facturacionDetail,
                },
                res
            );

        } catch (error) {
            return next(error)
        }
    }

    async saveFacturacion(req: any, res: Response, next: NextFunction) {

        const queryRunner = dataSource.createQueryRunner()
        await queryRunner.connect();
        

        try {
            await queryRunner.startTransaction();
            console.log("req.body", req.body)
            //throw new ClientException("test")
            const { ComprobanteNro, comprobanteNroold, ComprobanteTipoCodigo, ClienteId, ClienteElementoDependienteId } = req.body[0]

            
            if (!ComprobanteTipoCodigo) {
                throw new ClientException("El tipo de comprobante es requerido")
            }


            if (!ComprobanteNro) {
                throw new ClientException("El nro de comprobante es requerido")
            }

            const validateFacturacion = await dataSource.query(` SELECT ComprobanteNro FROM Facturacion WHERE ComprobanteNro = @0`, [ComprobanteNro]);

            if (validateFacturacion.length > 0) {
                throw new ClientException("El nro de comprobante ya existe")
            }

            if (ComprobanteNro == comprobanteNroold) {
                throw new ClientException("El nro de comprobante no puede ser el mismo")
            }


            
            for (const registro of req.body[1]) {
                const { id } = registro

                console.log("id", id)
                console.log("ComprobanteNro", ComprobanteNro)
                console.log("ComprobanteTipoCodigo", ComprobanteTipoCodigo)
                await dataSource.query(`UPDATE Facturacion SET ComprobanteNro = @0, ComprobanteTipoCodigo = @1  WHERE FacturacionCodigo = @2`, 
                  [ComprobanteNro, ComprobanteTipoCodigo, id])

                
            }
           
            //throw new ClientException("todo ok")
            await queryRunner.commitTransaction()
            this.jsonRes({}, res, 'Actualización de registro exitoso');
        } catch (error) {

            await queryRunner.rollbackTransaction();
            await queryRunner.release();
            return next(error);
        }




    }


}
