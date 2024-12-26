import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Response } from "express";
import { filtrosToSql, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";



export class PreciosProductosController extends BaseController {

    listaColumnas: any[] = [
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
            name: "Sucursal",
            type: "string",
            id: "SucursalId",
            field: "SucursalId",
            fieldName: "suc.SucursalId",
            formatter: 'collectionFormatter',
            searchComponent: "inpurForSucursalSearch",
            sortable: true,
            searchHidden: false
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
            name: "Tipo",
            type: "string",
            id: "TipoProductoId",
            field: "TipoProductoId",
            fieldName: "tip.cod_tipo_producto",
            formatter: 'collectionFormatter',
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
            type: "currency",
            id: "importe",
            field: "importe",
            fieldName: "vent.importe",
            sortable: false,
            hidden: false,
            searchHidden: false
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
            type: "date",
            id: "hasta",
            field: "hasta",
            fieldName: "vent.importe_hasta",
            searchComponent: "inpurForFechaSearch",
            sortable: true,
            hidden: false,
            searchHidden: false
        }
    ];


    async getGridCols(req, res) {
        this.jsonRes(this.listaColumnas, res);
    }

    async colsHistory(req, res) {
        this.jsonRes(this.listaColumnas, res);
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
                    CONCAT(prod.cod_producto,'-',vent.precio_venta_id) AS id,
                    prod.cod_producto AS codigo, 
                     prod.cod_producto AS codigoOld,
                    prod.des_producto AS descripcion,
                    prod.nom_producto AS nombre, 
                    prod.cod_tipo_producto AS TipoProductoId,
                    vent.importe AS importe,
                    vent.precio_venta_id as  precioVentaId,
                    FORMAT(vent.importe_desde, 'yyyy-MM-dd') AS desde,
                    FORMAT(vent.importe_hasta, 'yyyy-MM-dd') AS hasta,
                    vent.SucursalId
                FROM lige.dbo.lpv_productos prod
                LEFT JOIN lige.dbo.lpv_precio_venta vent ON prod.cod_producto = vent.cod_producto
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

            
            const codigoExist = await queryRunner.query( `SELECT *  FROM lige.dbo.lpv_productos WHERE cod_producto = @0`, [params.codigoOld])
            let dataResultado = {}
            let importeDesde = params.desde == undefined ? fechaActual : params.desde
            let importeHasta = params.hasta == undefined ? '9999-31-12' : params.hasta

            if ( codigoExist.length > 0) { //Entro en update
                //Validar si cambio el código
                const importeOld = codigoExist[0].importe 

                if (params.codigoOld != params.codigo) { 
                    const checkNewCodigo = await queryRunner.query( `SELECT *  FROM lige.dbo.lpv_productos WHERE cod_producto = @0`, [params.codigo])
                    if ( checkNewCodigo.length > 0) throw new ClientException('El nuevo código ingresado ya existe')
                }

                await this.validateForm(false, params, queryRunner)
 
                await queryRunner.query( `UPDATE lige.dbo.lpv_productos SET 
                    nom_producto = @1, des_producto = @2, aud_fecha_mod = @3, aud_usuario_mod = @4, aud_ip_mod = @5,
                    cod_tipo_producto = @6 WHERE cod_producto = @0
                    `, [params.codigo, params.nombre,  params.descripcion, fechaActual, usuario, ip, params.TipoProductoId])

                await queryRunner.query( `UPDATE lige.dbo.lpv_precio_venta SET 
                    aud_fecha_mod = @1, aud_usuario_mod = @2, aud_ip_mod = @3, sucursalId = @4, importe_desde = @5, importe_hasta = @6  WHERE precio_venta_id = @0
                    `, [params.precioVentaId, fechaActual, usuario, ip, params.SucursalId, importeDesde, importeHasta])
                    
                
                if(importeOld !== params.importe){
                    // el importe es diferente se agrega un registro
                    console.log("update -  agrego nuevo registro")

                    await this.addRecord(queryRunner,params,fechaActual, usuario, ip, params.SucursalId,importeHasta,importeDesde)

                    await queryRunner.query( `UPDATE lige.dbo.lpv_precio_venta SET importe_hasta = @1 WHERE precio_venta_id = @0
                        `, [params.precioVentaId, fechaActual])
                    
                }
                dataResultado = {action:'U'}
                message = "Actualizacion exitosa"
              
            } else {  //Es un nuevo registro
                const checkNewCodigo = await queryRunner.query( `SELECT *  FROM lige.dbo.lpv_productos WHERE cod_producto = @0`, [params.codigo])
                if ( checkNewCodigo.length > 0) throw new ClientException('El nuevo código ingresado ya existe')

                console.log('El código no existe - es nuevo')
                await this.validateForm(false, params, queryRunner)
                await queryRunner.query( `INSERT INTO lige.dbo.lpv_productos 
                    (cod_producto, 
                    nom_producto,
                    des_producto,
                    aud_fecha_ing, aud_usuario_ing,aud_ip_ing,
                    aud_fecha_mod,aud_usuario_mod, aud_ip_mod,
                    cod_tipo_producto )
                    VALUES ( @0, @1, @2, @3, @4, @5, @3, @4, @5, @6)
                    `, [params.codigo, params.nombre,  params.descripcion , fechaActual, usuario, ip, params.TipoProductoId])

                await this.addRecord(queryRunner,params,fechaActual, usuario, ip, params.SucursalId,importeHasta,importeDesde)
                dataResultado = {action:'I'}
              message = "Carga de nuevo Registro exitoso"
            }

            await queryRunner.commitTransaction()
            return this.jsonRes( dataResultado, res, message)
        } catch (error) {
           await this.rollbackTransaction(queryRunner)
            return next(error)
        }
      
    }


    async addRecord(queryRunner:any,params:any,fechaActual:any, usuario:any, ip:any, SucursalId:any,fechaHasta:any,fechaDede:any){
        await queryRunner.query( `INSERT INTO lige.dbo.lpv_precio_venta
            ( importe, importe_desde, importe_hasta,
             aud_fecha_ing, aud_usuario_ing, aud_ip_ing, aud_fecha_mod, aud_usuario_mod, aud_ip_mod, 
             cod_Producto, SucursalId)
            VALUES ( @0, @1, @2, @3, @4, @5, @3, @4, @5, @6, @7) 
            `, [params.importe, fechaDede, fechaHasta, fechaActual, usuario, ip, params.codigo, SucursalId])
    }

    async deleteProducto(req: any, res: Response, next: NextFunction){

        const queryRunner = dataSource.createQueryRunner();
    
        try {
           let cod_producto_venta = req.query[0]

            await queryRunner.connect();
            await queryRunner.startTransaction();

        
            await queryRunner.query( `DELETE FROM lige.dbo.lpv_precio_venta WHERE precio_venta_id = @0`, [cod_producto_venta])
          
            await queryRunner.commitTransaction()
            return this.jsonRes( "", res, "Borrado Exitoso")
        } catch (error) {
           await this.rollbackTransaction(queryRunner)
            return next(error)
        }
    }

    async validateForm(isNew:boolean, params:any, queryRunner:any){

        if(isNew){
        // true es Nuevo

        }else{
            
        // false es Edit
        if (params.codigoOld && params.codigoOld !== "" && params.codigoOld !== params.codigo) 
            throw new ClientException(`No puede modificar el codigo de un registro ya cargado`)
            
        }

        if (params.SucursalId == null || params.SucursalId == "")
            throw new ClientException(`Debe seleccionar la Sucursal`)


        let resultSucursalCodigo = await queryRunner.query( `SELECT * FROM lige.dbo.lpv_precio_venta WHERE cod_Producto = @0 AND SucursalId = @1`, [params.codigo,params.SucursalId])
        
        // Validar si hay registros
            if (resultSucursalCodigo.length > 0) 
                throw new ClientException(`El codigo ingresado ya existe en la sucursal seleccionada`)


        if (params.nombre == null || params.nombre == "")
            throw new ClientException(`Debe completar el nombre del producto`)

        if (params.TipoProductoId == null || params.TipoProductoId == "")
            throw new ClientException(`Debe completar el tipo de producto`)

        if (params.descripcion == null || params.descripcion == "")
            throw new ClientException(`Debe completar la descripcion del producto`)

        if (params.importe == null || params.importe == "")
            throw new ClientException(`Debe completar el Importe`)

        // if (params.desde == null || params.desde == "")
        //     throw new ClientException(`Debe seleccionar la fecha desde`)

      


        
    }


 
}

