import { BaseController, ClientException, ClientWarning } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";



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
            name: "Cliente",
            type: "number",
            id: "ClienteId",
            field: "ClienteId",
            fieldName: "pp.ClienteId",
            searchComponent: "inputForClienteSearch",
            sortable: true,
            searchHidden: false
        },
        {
            id: "ProductoCodigo",
            name: "ProductoCodigo",
            field: "ProductoCodigo",
            fieldName: "pp.ProductoCodigo",
            type: "string",
            sortable: true,
            searchHidden: false,
            hidden: false,
        },
        {
            name: "Producto",
            type: "string",
            id: "Nombre",
            field: "Nombre",
            fieldName: "p.Nombre",
            searchType: "string",
            sortable: true,
            searchHidden: false,
            hidden: false,
        },
        {
            name: "Importe Unitario",
            type: "number",
            id: "Importe",
            field: "Importe",
            fieldName: "pp.Importe",
            sortable: true,
            searchHidden: false,
            hidden: false,
        },
        {
            name: "Aplica Desde",
            type: "date",
            id: "PeriodoDesdeAplica",
            field: "PeriodoDesdeAplica",
            fieldName: "pp.PeriodoDesdeAplica",
            searchComponent: "inputForFechaSearch",
            sortable: true,
            hidden: false,
            searchHidden: false,
        },
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
                    vent.importe_desde AS desde,
                    vent.importe_hasta AS hasta,
                    suc.SucursalId, 
                    suc.SucursalDescripcion
                FROM ProductoPrecio pp
                LEFT JOIN Producto p ON prod.cod_producto = vent.cod_producto
                LEFT JOIN ProductoTipo pt ON prod.cod_tipo_producto = tip.cod_tipo_producto
                LEFT JOIN Cliente c on pp.ClienteId = c.ClienteId
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
 
        const options: Options = isOptions(req.body.options)? req.body.options : { filtros: [], sort: null };
        const filterSql = filtrosToSql(options.filtros, this.listaColumnas);
        const orderBy = orderToSQL(options.sort)
        const queryRunner = dataSource.createQueryRunner();

        const anio:number = Number(req.body.anio)
        const mes:number = Number(req.body.mes)

        // todo: Cambiar para recibir como parametro el año y mes

        try {

            const precios = await queryRunner.query(
                `
                SELECT 
                    ROW_NUMBER() OVER (ORDER BY pp.PeriodoDesdeAplica,pp.ProductoCodigo,pp.ClienteId) AS id,
                    pp.ProductoCodigo,
                    pp.ClienteId,
                    pp.PeriodoDesdeAplica,
                    pp.Importe,
                    pp.ImportDocumentoId,
                    pp.AudFechaIng,
                    pp.AudUsuarioIng,
                    pp.AudFechaMod,
                    pp.AudUsuarioMod,

                    p.Nombre,
                    p.ProductoTipoCodigo,
                    pt.Descripcion

                FROM Producto p
                LEFT JOIN ProductoTipo pt ON pt.ProductoTipoCodigo=p.ProductoTipoCodigo

                LEFT JOIN ProductoPrecio pp ON p.ProductoCodigo=pp.ProductoCodigo AND pp.PeriodoDesdeAplica=(
                        SELECT max(PeriodoDesdeAplica) FROM ProductoPrecio pp WHERE pp.PeriodoDesdeAplica <= DATEFROMPARTS(@0, @1, 1))

                JOIN Cliente c on pp.ClienteId = c.ClienteId
                WHERE ${filterSql}`, [anio, mes])

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
        fechaActual.setHours(0,0,0,0)

        try {
            console.log("params ", params)
            await queryRunner.connect();
            await queryRunner.startTransaction();
   
            
            const codigoExist = await queryRunner.query( `SELECT *  FROM lige.dbo.lpv_precio_venta WHERE precio_venta_id = @0`, [params.precioVentaId])
            let dataResultado = {}
            let importeDesde = (!params.desde)  ? fechaActual : params.desde
            let importeHasta = (!params.hasta)  ? new Date('9999-12-31') : params.hasta;

            if ( codigoExist.length > 0) { //Entro en update
                //Validar si cambio el código
                const importe_hasta = new Date(codigoExist[0].importe_hasta)
                if (importe_hasta <= fechaActual) throw new ClientException('No se puede modificar registros anteriores a la fecha de hoy.')

                if (params.codigoOld != params.codigo) { 
                    const checkNewCodigo = await queryRunner.query( `SELECT *  FROM lige.dbo.lpv_productos WHERE cod_producto = @0`, [params.codigo])
                    if ( checkNewCodigo.length > 0) throw new ClientException('El nuevo código ingresado ya existe')
                }
            
                const importeOld = codigoExist[0].importe 
                await this.validateForm(false, params, queryRunner,importeOld)
 
                await queryRunner.query( `UPDATE lige.dbo.lpv_productos SET 
                    nom_producto = @1, des_producto = @2, aud_fecha_mod = @3, aud_usuario_mod = @4, aud_ip_mod = @5,
                    cod_tipo_producto = @6 WHERE cod_producto = @0
                    `, [params.codigo, params.nombre,  params.descripcion, fechaActual, usuario, ip, params.TipoProductoId])

                await queryRunner.query( `UPDATE lige.dbo.lpv_precio_venta SET 
                   importe_desde = @1, importe_hasta = @2 , aud_fecha_mod = @3, aud_usuario_mod = @4, aud_ip_mod = @5, sucursalId = @6 WHERE precio_venta_id = @0
                    `, [ params.precioVentaId,importeDesde, importeHasta, fechaActual, usuario, ip, params.SucursalId,])
                
                const desde = new Date (params.desde)
                desde.setHours(0,0,0,0)
                desde.setDate(desde.getDate()+1)
                if(importeOld != params.importe && desde < fechaActual){
                    // el importe es diferente se agrega un registro
                    console.log("update -  agrego nuevo registro")

                    await this.addRecord(queryRunner,params,fechaActual, usuario, ip, params.SucursalId,importeHasta,importeDesde)
                    
                }else{
                    await queryRunner.query( `UPDATE lige.dbo.lpv_precio_venta SET importe = @1 WHERE precio_venta_id = @0`,
                         [ params.precioVentaId,params.importe]) 
                }
                dataResultado = {action:'U'}
                message = "Actualizacion exitosa"
              
            } else {  //Es un nuevo registro de lpv_precio_venta
                const checkNewCodigo = await queryRunner.query( `SELECT *  FROM lige.dbo.lpv_productos WHERE cod_producto = @0`, [params.codigo])
                // if ( checkNewCodigo.length > 0) throw new ClientException('El nuevo código ingresado ya existe')
                await this.validateForm(false, params, queryRunner,null)
                if (!checkNewCodigo.length){ //Es un nuevo registro de lpv_productos
                    console.log('El código no existe - es nuevo')
                    await queryRunner.query(`INSERT INTO lige.dbo.lpv_productos 
                        (cod_producto, 
                        nom_producto,
                        des_producto,
                        aud_fecha_ing, aud_usuario_ing,aud_ip_ing,
                        aud_fecha_mod,aud_usuario_mod, aud_ip_mod,
                        cod_tipo_producto )
                        VALUES ( @0, @1, @2, @3, @4, @5, @3, @4, @5, @6)
                        `, [params.codigo, params.nombre,  params.descripcion , fechaActual, usuario, ip, params.TipoProductoId]
                    )
                }
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


    async addRecord(queryRunner:any,params:any,fechaActual:any, usuario:any, ip:any, SucursalId:any,fechaHasta:any,fechaDesde:any){
        let fechaDesdeNew:Date = new Date(fechaDesde)
        let fechaHastaNew:Date = new Date(fechaHasta)
        const now:Date = new Date()
        now.setHours(0, 0, 0, 0)
        fechaDesdeNew.setHours(0, 0, 0, 0)
        fechaHastaNew.setHours(0, 0, 0, 0)
        fechaDesdeNew.setDate(fechaDesdeNew.getDate()+1)
        fechaHastaNew.setDate(fechaHastaNew.getDate()+1)
        const anio = fechaDesdeNew.getFullYear()
        const mes = fechaDesdeNew.getMonth()+1
        const dia = fechaDesdeNew.getDate()

        const codigoExist = await queryRunner.query( `
            SELECT importe_desde, importe_hasta, precio_venta_id
            FROM lige.dbo.lpv_precio_venta
            WHERE cod_Producto = @0 AND (DATEFROMPARTS(@1, @2, @3) <= importe_desde OR (DATEFROMPARTS(@1, @2, @3) <= importe_hasta AND DATEFROMPARTS(@1, @2, @3) >= importe_desde))
            ORDER BY importe_desde
            `, [params.codigo, anio, mes, dia]
        )
        
        if (codigoExist.length) {
            let index = 0
            let find = false
            for (let i = 0; i < codigoExist.length - 1; i++) {
                const desde = new Date(codigoExist[i].importe_hasta);
                const hasta = new Date(codigoExist[i+1].importe_desde);
                desde.setDate(desde.getDate() + 1)
                hasta.setDate(hasta.getDate() - 1)
                const precioVentaId = codigoExist[i+1].precio_venta_id
                if (params.precio_venta_id == precioVentaId) {
                    index = i
                }else if (desde.getTime() < hasta.getTime()) {
                    find = true
                    fechaDesdeNew = desde
                    fechaHastaNew = hasta
                    break
                }
            }
            if (!find) {
                const hasta = new Date(codigoExist[index].importe_hasta)
                const desde = new Date(codigoExist[index].importe_desde)
                desde.setDate(desde.getDate() - 1);
                if(hasta.getTime() == fechaHastaNew.getTime() || (desde < now && now < hasta)){
                    let NewDate = ((hasta.getTime() == fechaHastaNew.getTime()) && (hasta.toISOString().startsWith('9999-12-31')))? new Date(fechaDesdeNew) : new Date(now); 
                    NewDate.setDate(NewDate.getDate() - 1)

                    await queryRunner.query( `
                        UPDATE lige.dbo.lpv_precio_venta SET importe_hasta = @1 WHERE precio_venta_id = @0
                        `, [params.precioVentaId, NewDate]
                    )
                    fechaDesdeNew = ((hasta.getTime() == fechaHastaNew.getTime()) && (hasta.toISOString().startsWith('9999-12-31')))? fechaDesdeNew : now;
                }else if (fechaDesdeNew < desde) {
                    fechaHastaNew = desde
                }else {
                    hasta.setDate(hasta.getDate() + 1);
                    fechaDesdeNew = hasta
                }
            }
            
        }

        await queryRunner.query( `INSERT INTO lige.dbo.lpv_precio_venta
            ( importe, importe_desde, importe_hasta,
             aud_fecha_ing, aud_usuario_ing, aud_ip_ing, aud_fecha_mod, aud_usuario_mod, aud_ip_mod, 
             cod_Producto, SucursalId)
            VALUES ( @0, @1, @2, @3, @4, @5, @3, @4, @5, @6, @7) 
             `, [params.importe, fechaDesdeNew, fechaHastaNew, fechaActual, usuario, ip, params.codigo, params.SucursalId])
    }

    async deleteProducto(req: any, res: Response, next: NextFunction){

        let cod_producto_venta = req.query[0]

        const queryRunner = dataSource.createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction()
        try {

        let result = await queryRunner.query( `SELECT * FROM lige.dbo.lpv_precio_venta WHERE precio_venta_id = @0`, [cod_producto_venta])

            if(result[0].importe_desde < new Date() && result[0].importe_hasta < new Date())
             throw new ClientException(`No se puede borrar registros con fechas anteriores a hoy`)

            await queryRunner.query( `DELETE FROM lige.dbo.lpv_precio_venta WHERE precio_venta_id = @0`, [cod_producto_venta])
          
            await queryRunner.commitTransaction()
            return this.jsonRes( "", res, "Borrado Exitoso")
        } catch (error) {
           await this.rollbackTransaction(queryRunner)
            return next(error)
        }
    }

    async validateForm(isNew:boolean, params:any, queryRunner:any,importeOld:any){
        const now = new Date()
        const desde = new Date(params.desde)
        const hasta = new Date(params.hasta)
        now.setHours(0, 0, 0, 0)
        desde.setHours(0, 0, 0, 0)
        hasta.setHours(0, 0, 0, 0)
        desde.setDate(desde.getDate()+1)
        hasta.setDate(hasta.getDate()+1)
        if(isNew){
        // true es Nuevo

        }else{
        // false es Edit
        if (params.codigoOld && params.codigoOld !== "" && params.codigoOld !== params.codigo) 
            throw new ClientException(`No puede modificar el codigo de un registro ya cargado`)
            
        }

        if (params.SucursalId == null || params.SucursalId == "")
            throw new ClientWarning(`Debe seleccionar la Sucursal`)

        let resultSucursalCodigo = await queryRunner.query( `SELECT * FROM lige.dbo.lpv_precio_venta WHERE cod_Producto = @0 AND SucursalId = @1 AND precio_venta_id != @2`, [params.codigo, params.SucursalId, params.precioVentaId])
        const codigoExist = await queryRunner.query( `SELECT *  FROM lige.dbo.lpv_precio_venta WHERE precio_venta_id = @0`, [params.precioVentaId])

        if(params.codigoOld && params.codigo != params.codigoOld){
        
            // Validar si hay registros
            if (resultSucursalCodigo.length > 0) 
                throw new ClientException(`El codigo ingresado ya existe en la sucursal seleccionada`)
        }


        if (params.nombre == null || params.nombre == "")
            throw new ClientWarning(`Debe completar el nombre del producto`)

        if (params.TipoProductoId == null || params.TipoProductoId == "")
            throw new ClientWarning(`Debe completar el tipo de producto`)

        if (params.descripcion == null || params.descripcion == "")
            throw new ClientWarning(`Debe completar la descripcion del producto`)

        if (params.importe == null || params.importe == "")
            throw new ClientWarning(`Debe completar el Importe`)

        if (params.hasta && hasta < desde)
            throw new ClientException(`La fecha "hasta" no puede ser menor que la fecha "desde".`)

        if (params.hasta && hasta < now)
            throw new ClientException(`La fecha "hasta" no puede ser menor que hoy.`)

        if (desde < now && !(codigoExist.length && codigoExist[0].importe_desde < now && now < codigoExist[0].importe_hasta))
            throw new ClientException(`La fecha "desde" no puede ser menor que hoy.`)

        if (params.precioVentaId && params.codigo && params.hasta) {
            const codigoExist = await queryRunner.query( `
                SELECT a.importe_desde
                FROM lige.dbo.lpv_precio_venta a
                JOIN lige.dbo.lpv_precio_venta b ON b.precio_venta_id IN (@0) AND b.importe_hasta < a.importe_desde
                WHERE a.cod_Producto = @1
                ORDER BY a.importe_desde
                `, [params.precioVentaId, params.codigo]
            )
            if (codigoExist.length && codigoExist[0].importe_desde && new Date(params.hasta) > new Date(codigoExist[0].importe_desde)) {
                const fechaMaxima = new Date(codigoExist[0].importe_desde)
                throw new ClientException(`La fecha "hasta" no puede ser mayor ${fechaMaxima.getDate()}/${fechaMaxima.getMonth()}/${fechaMaxima.getFullYear()}.`)
            }
        }

        await this.validarRangoFechas(params.desde, params.hasta, resultSucursalCodigo)

        if(importeOld == params.importe){

            let result = await queryRunner.query( `SELECT TOP 1 importe_hasta FROM lige.dbo.lpv_precio_venta WHERE cod_producto = @0 ORDER BY importe_hasta DESC`, [params.codigo])
            
            if (result && result.length > 1) {

                const fechaEspecial = new Date('9999-12-31');

                if (new Date(result[0].importe_hasta).getTime() !== fechaEspecial.getTime())
                    if( desde < new Date(result[0].importe_hasta))
                        throw new ClientException(`'No se podra modificar precios que no sean vigentes`);

            }
        } 
  
    }


    async validarRangoFechas(fechaDesde:any, fechaHasta:any, registros:any) {
        const now = new Date()
        const fechaD = new Date(fechaDesde)
        const fechaH = new Date(fechaHasta)
        fechaD.setDate(fechaD.getDate()+1)
        fechaH.setDate(fechaH.getDate()+1)
        fechaD.setHours(0,0,0,0)
        fechaH.setHours(0,0,0,0)
        now.setHours(0,0,0,0)
        for (const registro of registros) {
            const desde = registro.importe_desde
            const hasta = registro.importe_hasta
            const precio_venta_id = registro.precio_venta_id
          // Validar si hay interseccion de rangos
        //   if (
        //     (fechaD >= desde && fechaD <= hasta) || 
        //     (fechaH >= desde && fechaH <= hasta) || 
        //     (fechaD <= desde && fechaD >= hasta)   
        //   ) {
        //     throw new ClientException(`Ya existe una fecha vigente para el rango de fechas`)
        //   }
            if (
                ((fechaD >= desde && fechaD <= hasta) || 
                (fechaH >= desde && fechaH <= hasta))
                // && (now >= fechaD)
            ) {
                throw new ClientException(`Ya existe una fecha vigente para el rango de fechas`)
            }
        }
      }


 
}

