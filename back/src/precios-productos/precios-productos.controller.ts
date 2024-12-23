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
            id: "codigoOld",
            name: "codigoOld",
            field: "codigoOld",
            fieldName: " prod.cod_producto",
            type: "number",
            sortable: false,
            searchHidden: true,
            hidden: true,

        },
        {
            id: "Codigo",
            name: "codigo",
            field: "codigo",
            fieldName: "prod.cod_producto",
            type: "string",
            sortable: true,
            searchHidden: false,
            hidden: false,
        },
        {
            name: "Nombre",
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
            name: "Producto",
            type: "string",
            id: "TipoProductoDescripcion",
            field: "TipoProductoDescripcion",
            fieldName: "tip.cod_tipo_producto",
            searchComponent: "inpurForProductoSearch",
            searchType: "string",
            searchHidden: false
        },
        {
            name: "Descripcion",
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
            sortable: false,
            hidden: false,
            searchHidden: false
        },
        {
            name: "importeOld",
            type: "number",
            id: "importeOld",
            field: "importeOld",
            fieldName: "vent.importe",
            sortable: true,
            hidden: true,
            searchHidden: true
        },
        {
            name: "Activo",
            type: "number",
            id: "activo",
            field: "activo",
            fieldName: "prod.ind_activo",
            sortable: true,
            hidden: false,
            searchHidden: true
        },
        {
            name: "Desde",
            type: "date",
            id: "desde",
            field: "desde",
            fieldName: "vent.importe_desde",
            searchComponent: "inpurForFechaSearch",
            sortable: true,
            hidden: false,
            searchHidden: false
        },
        {
            name: "Hasta",
            type: "hasta",
            id: "hasta",
            field: "hasta",
            fieldName: "vent.importe_hasta",
            searchComponent: "inpurForFechaSearch",
            sortable: true,
            hidden: false,
            searchHidden: false
        },
        {
            name: "Sucursal",
            type: "string",
            id: "SucursalDescripcion",
            field: "SucursalDescripcion",
            fieldName: "suc.SucursalId",
            searchComponent: "inpurForSucursalSearch",
            sortable: true,
            searchHidden: false
        }
    ];


    listaColumnasHistory: any[] = [
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
            id: "Codigo",
            name: "codigo",
            field: "codigo",
            fieldName: " prod.cod_producto",
            type: "number",
            sortable: true,
            searchHidden: false,
            hidden: true,
        },
        {
            name: "Nombre",
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
            name: "Prod",
            type: "string",
            id: "TipoProductoDescripcion",
            field: "TipoProductoDescripcion",
            fieldName: "tip.des_tipo_product",
            searchType: "string",
            searchHidden: true
        },
        {
            name: "Activo",
            type: "number",
            id: "activo",
            field: "activo",
            fieldName: "prod.ind_activo",
            sortable: true,
            hidden: false,
            searchHidden: false
        },
        {
            name: "Descripcion",
            type: "string",
            id: "descripcion",
            field: "descripcion",
            fieldName: "prod.des_producto",
            searchType: "string",
            sortable: true,
            searchHidden: false,
            hidden: true,
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
            name: "importeOld",
            type: "number",
            id: "importeOld",
            field: "importeOld",
            fieldName: "vent.importe",
            sortable: true,
            hidden: true,
            searchHidden: false
        },
        {
            name: "Fecha Importe Desde",
            type: "date",
            id: "desde",
            field: "desde",
            fieldName: "inpurForFechaSearch",
            sortable: true,
            searchHidden: false,
            hidden: true,
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

    async colsHistory(req, res) {
        this.jsonRes(this.listaColumnasHistory, res);
    }

    async listCodigoHistory(codigoId: any, res: Response, next: NextFunction) {


        const queryRunner = dataSource.createQueryRunner()

        try {

            const precios = await queryRunner.query(
                `SELECT 
                    ROW_NUMBER() OVER (ORDER BY prod.cod_producto) AS id,
                    prod.cod_producto AS codigo, 
                     prod.cod_producto AS codigoOld,
                    prod.des_producto AS descripcion,
                    prod.nom_producto AS nombre,
                    prod.ind_activo AS activo,  
                    tip.cod_tipo_producto AS TipoProductoId,
                    tip.des_tipo_producto AS TipoProductoDescripcion,
                    vent.importe AS importeOld,
                    vent.importe AS importe,
                    vent.precio_venta_id as  precioVentaId,
                    FORMAT(vent.importe_desde, 'yyyy-MM-dd') AS desde,
                    FORMAT(vent.importe_hasta, 'yyyy-MM-dd') AS hasta,
                    suc.SucursalId, 
                    suc.SucursalDescripcion
                FROM lige.dbo.lpv_productos prod
                LEFT JOIN lige.dbo.lpv_tipo_producto tip ON prod.cod_tipo_producto = tip.cod_tipo_producto
                LEFT JOIN lige.dbo.lpv_precio_venta vent ON prod.cod_producto = vent.cod_producto
                LEFT JOIN Sucursal suc ON vent.SucursalId = suc.SucursalId  WHERE  prod.cod_producto=@0`, [codigoId])

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
                     prod.cod_producto AS codigoOld,
                    prod.des_producto AS descripcion,
                    prod.nom_producto AS nombre,
                    prod.ind_activo AS activo,  
                    tip.cod_tipo_producto AS TipoProductoId,
                    tip.des_tipo_producto AS TipoProductoDescripcion,
                    vent.importe AS importeOld,
                    vent.importe AS importe,
                    vent.precio_venta_id as  precioVentaId,
                    FORMAT(vent.importe_desde, 'yyyy-MM-dd') AS desde,
                    FORMAT(vent.importe_hasta, 'yyyy-MM-dd') AS hasta,
                    suc.SucursalId, 
                    suc.SucursalDescripcion
                FROM lige.dbo.lpv_productos prod
                LEFT JOIN lige.dbo.lpv_tipo_producto tip ON prod.cod_tipo_producto = tip.cod_tipo_producto
                LEFT JOIN lige.dbo.lpv_precio_venta vent ON prod.cod_producto = vent.cod_producto
                LEFT JOIN Sucursal suc ON vent.SucursalId = suc.SucursalId 
               WHERE CAST(GETDATE() AS DATE) BETWEEN CAST(vent.importe_desde AS DATE) AND CAST(vent.importe_hasta AS DATE)
              AND ${filterSql} 
                ${orderBy};`, [fechaActual])

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
       const usuario = res.locals.userName
       const ip = this.getRemoteAddress(req)
        const queryRunner = dataSource.createQueryRunner();
        const fechaActual = new Date()
        let message = ""
        const params = req.body

        try {
            console.log("params ", params)
            await queryRunner.connect();
            await queryRunner.startTransaction();

            
            const codigoExist = await queryRunner.query( `SELECT *  FROM lige.dbo.lpv_productos WHERE cod_producto = @0`, [params.codigo])

            let fechaDede = params.desde == undefined ? fechaActual : params.desde
            let fechaHasta = params.hasta == undefined ? '9999-12-31' : params.hasta


            if ( codigoExist.length > 0 || (params.codigoOld && params.codigoOld !== "")) {
                
                console.log('El código existe - es update')
                await this.validateForm(false, params)
                const TipoProductoDescripcion = await this.TipoProductoSearch(queryRunner,params.TipoProductoDescripcion)
                const SucursalDescripcion = await this.SucursalDescripcionSearch(queryRunner,params.SucursalDescripcion)
               
                if(params.importeOld !== params.importe){
                    // el importe es diferente se agrega un registro
                    console.log("update -  agrego nuevo registro")

                    await this.addRecord(queryRunner,params,fechaActual, usuario, ip, TipoProductoDescripcion,SucursalDescripcion,fechaHasta,fechaDede)

                    await queryRunner.query( `UPDATE lige.dbo.lpv_precio_venta SET importe_hasta = @1 WHERE precio_venta_id = @0
                        `, [params.precioVentaId, fechaActual])

                }else{
                    // se hace update
                    await queryRunner.query( `UPDATE lige.dbo.lpv_productos SET 
                        nom_producto = @1, des_producto = @2, ind_activo = @3, aud_fecha_mod = @4, aud_ip_mod = @6,
                        cod_tipo_producto = @7 WHERE cod_producto = @0
                        `, [params.codigo, params.nombre,  params.descripcion,  params.activo, fechaActual, usuario, ip, TipoProductoDescripcion])

                    await queryRunner.query( `UPDATE lige.dbo.lpv_precio_venta SET 
                        aud_fecha_mod = @1, aud_usuario_mod = @2, aud_ip_mod = @3, sucursalId = @4, importe_desde = @5, importe_hasta = @6  WHERE precio_venta_id = @0
                        `, [params.precioVentaId, fechaActual, usuario, ip, SucursalDescripcion, params.desde, fechaHasta])
            
                }

                message = "Actualizacion exitosa"
              
              } else {
                console.log('El código no existe - es nuevo')
                await this.validateForm(false, params)
                const TipoProductoDescripcion = await this.TipoProductoSearch(queryRunner,params.TipoProductoDescripcion)
                const SucursalDescripcion = await this.SucursalDescripcionSearch(queryRunner,params.SucursalDescripcion)

                const paramsActivo = params.activo == undefined ? false : params.activo 

                await queryRunner.query( `INSERT INTO lige.dbo.lpv_productos 
                    (cod_producto, nom_producto,des_producto,ind_activo,aud_fecha_ing, aud_usuario_ing,aud_ip_ing,
                    aud_fecha_mod,aud_usuario_mod, aud_ip_mod,cod_tipo_producto )
                    VALUES ( @0, @1, @2, @3, @4, @5, @3, @4, @5, @6, @7)
                    `, [params.codigo, params.nombre,  params.descripcion,  paramsActivo, fechaActual, usuario, ip, TipoProductoDescripcion])

                await this.addRecord(queryRunner,params,fechaActual, usuario, ip, TipoProductoDescripcion,SucursalDescripcion,fechaHasta,fechaDede)
              
              message = "Carga de nuevo Registro exitoso"
            }

            await queryRunner.commitTransaction()
            return this.jsonRes( "", res, message)
        } catch (error) {
           await this.rollbackTransaction(queryRunner)
            return next(error)
        }
      
    }


    async addRecord(queryRunner:any,params:any,fechaActual:any, usuario:any, ip:any, TipoProductoDescripcion:any,SucursalDescripcion:any,fechaHasta:any,fechaDede:any){


        await queryRunner.query( `INSERT INTO lige.dbo.lpv_precio_venta
            ( importe, importe_desde, importe_hasta,
             aud_fecha_ing, aud_usuario_ing, aud_ip_ing, aud_fecha_mod, aud_usuario_mod, aud_ip_mod, 
             cod_Producto, SucursalId)
            VALUES ( @0, @1, @2, @3, @4, @5, @3, @4, @5, @6, @7) 
            `, [params.importe, fechaDede, fechaHasta, fechaActual, usuario, ip, params.codigo, SucursalDescripcion])
    }

    async deleteProducto(req: any, res: Response, next: NextFunction){

        const queryRunner = dataSource.createQueryRunner();
    
        try {
           let cod_producto = req.query[0]

            await queryRunner.connect();
            await queryRunner.startTransaction();

            // await queryRunner.query( `DELETE FROM lige.dbo.lpv_productos WHERE cod_producto = @0`, [params.codigo])
            // await queryRunner.query( `DELETE FROM lige.dbo.lpv_precio_venta WHERE precio_venta_id = @1`, [params.precioVentaId])
          

            await queryRunner.commitTransaction();
        } catch (error) {
           await this.rollbackTransaction(queryRunner)
            return next(error)
        }
    }

    async TipoProductoSearch(queryRunner:any,TipoProductoDescripcion:any){
         let value
         if (typeof TipoProductoDescripcion === 'object') {
            value = TipoProductoDescripcion.id
        }else {
             let result = await queryRunner.query( `SELECT cod_tipo_producto FROM  lige.dbo.lpv_tipo_producto  WHERE des_tipo_producto = @0`, [TipoProductoDescripcion])
             value = result[0].cod_tipo_producto 
        }
        return value
    }

    async SucursalDescripcionSearch(queryRunner:any,SucursalDescripcion:any){
        let value
        if (typeof SucursalDescripcion === 'object') {
           value = SucursalDescripcion.id
       }else {
            let result = await queryRunner.query( `SELECT SucursalId FROM  sucursal  WHERE SucursalDescripcion = @0`, [SucursalDescripcion])
            value = result[0].SucursalId 
       }
       return value
   }


    async validateForm(isNew:boolean, params:any){

        if(isNew){
        // true es Nuevo

        }else{
            
        // false es Edit
        if (params.codigoOld && params.codigoOld !== "" && params.codigoOld !== params.codigo) 
            throw new ClientException(`No puede modificar el codigo de un registro ya cargado`)
            
        }

        if (params.nombre == null || params.nombre == "")
            throw new ClientException(`Debe completar el nombre del producto`)

        if (params.TipoProductoDescripcion == null || params.TipoProductoDescripcion == "")
            throw new ClientException(`Debe completar el tipo de producto`)

        if (params.descripcion == null || params.descripcion == "")
            throw new ClientException(`Debe completar la descripcion del producto`)

        if (params.importe == null || params.importe == "")
            throw new ClientException(`Debe completar el Importe`)

        // if (params.activo == null)
        //     throw new ClientException(`Debe seleccionar si el producto esta Activo`)

        // if (params.desde == null || params.desde == "")
        //     throw new ClientException(`Debe seleccionar la fecha desde`)

        if (params.SucursalDescripcion == null || params.SucursalDescripcion == "")
            throw new ClientException(`Debe seleccionar la Sucursal`)


        
    }


 
}
