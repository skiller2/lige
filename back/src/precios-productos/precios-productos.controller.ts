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
            name: "CUIT",
            type: "string",
            id: "ClienteFacturacionCUIT",
            field: "ClienteFacturacionCUIT",
            fieldName: "fac.ClienteFacturacionCUIT",
            sortable: true,
            searchHidden: false,
            editable: false
        },
        {
            name: "Razón Social",
            type: "string",
            id: "Cliente",
            field: "Cliente",
            fieldName: "c.ClienteId",
            searchComponent: "inputForClientSearch",
            searchType: "number",
            formatter: 'complexObject',
            sortable: true,
            hidden: false,
            searchHidden: false,
            editable: true
        },
        {
            id: "ProductoCodigo",
            name: "Producto",
            field: "ProductoCodigo",
            fieldName: "pp.ProductoCodigo",
            type: "string",
            formatter: 'collectionFormatter',
            sortable: true,
            searchHidden: false,
            hidden: false,
            editable: true
        },
        {
            name: "Nombre",
            type: "string",
            id: "Nombre",
            field: "Nombre",
            fieldName: "p.Nombre",
            sortable: true,
            searchHidden: true,
            hidden: true,
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
            editable: true
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
            editable: true
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
        } finally {
            await queryRunner.release()
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

            const precios = await queryRunner.query(`
                SELECT 
                    ROW_NUMBER() OVER (ORDER BY pp.PeriodoDesdeAplica,pp.ProductoCodigo,pp.ClienteId) AS id,
                    CONCAT(pp.ProductoCodigo, c.ClienteId) AS idTable,
                    pp.ProductoCodigo,
                    pp.ProductoCodigo AS ProductoCodigoOLD,
                    c.ClienteId AS c.ClienteIdOLD,
                    --c.ClienteDenominacion,
                    pp.PeriodoDesdeAplica,
                    pp.PeriodoDesdeAplica AS c.PeriodoDesdeAplicaOLD,
                    pp.Importe,
                    --pp.ImportDocumentoId,
                    --pp.AudFechaIng,
                    --pp.AudUsuarioIng,
                    --pp.AudFechaMod,
                    --pp.AudUsuarioMod,

                    --p.Nombre,
                    --p.ProductoTipoCodigo,
                    --pt.Descripcion,
                    fac.ClienteFacturacionCUIT

                FROM Producto p
                LEFT JOIN ProductoTipo pt ON pt.ProductoTipoCodigo=p.ProductoTipoCodigo

                LEFT JOIN ProductoPrecio pp ON p.ProductoCodigo=pp.ProductoCodigo AND pp.PeriodoDesdeAplica=(
                        SELECT max(PeriodoDesdeAplica) FROM ProductoPrecio pp WHERE pp.PeriodoDesdeAplica <= DATEFROMPARTS(@0, @1, 1))

                JOIN Cliente c on pp.ClienteId = c.ClienteId
                LEFT JOIN ClienteFacturacion fac ON fac.ClienteId = c.ClienteId AND fac.ClienteFacturacionDesde <= DATEFROMPARTS(@0, @1, 1) AND ISNULL(fac.ClienteFacturacionHasta, '9999-12-31') >= DATEFROMPARTS(@0, @1, 1)
                WHERE ${filterSql}`, [anio, mes])

            const formattedData = precios.map((item: any) => ({
                ...item,
                Cliente: {
                    id: item.ClienteIdOLD,
                    fullName: item.ClienteDenominacion
                }
            }));

            this.jsonRes(
                {
                    total: formattedData.length,
                    list: formattedData,
                },
                res
            );

        } catch (error) {
            return next(error)
        } finally {
            await queryRunner.release()
        }

    }


    
    async changecell(req: any, res: Response, next: NextFunction) {
        const usuario = res.locals.userName
        const ip = this.getRemoteAddress(req)
        const queryRunner = dataSource.createQueryRunner();

        let dataResultado = {}
        let message = ""

        const idTable = req.body.idTable
        const ClienteId = req.body.Cliente?.id
        const ProductoCodigo = req.body.ProductoCodigo
        const Importe = req.body.Importe
        const PeriodoDesdeAplica = new Date(req.body.PeriodoDesdeAplica)

        const fechaActual = new Date()
        fechaActual.setHours(0,0,0,0)

        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            if ( idTable?.length > 0) { //Entro en update
                throw new ClientException('DEBUG')
                const ProductoCodigoOLD = req.body.ProductoCodigoOLD
                const ClienteIdOLD = req.body.ClienteIdOLD
                const PeriodoDesdeAplicaOLD = new Date(req.body.PeriodoDesdeAplicaOLD)
                const ProductoPrecio = await queryRunner.query(`
                    SELECT Importe FROM ProductoPrecio WHERE ProductoCodigo = @0 AND ClienteId = @1 AND PeriodoDesdeAplica = @2 
                `, [ProductoCodigoOLD, ClienteIdOLD, PeriodoDesdeAplicaOLD])

                const ImporteOLD = ProductoPrecio[0].Importe
                //Validar si cambio hubo cambios
                if (ProductoCodigoOLD != ProductoCodigo || ClienteIdOLD != ClienteId || PeriodoDesdeAplicaOLD != PeriodoDesdeAplica || ImporteOLD != Importe) {
                    await queryRunner.query(`
                    UPDATE ProductoPrecio SET 
                        ProductoCodigo = @3, 
                        ClienteId = @4,
                        PeriodoDesdeAplica = @5,
                        Importe = @6,
                        AudFechaMod = @7,
                        AudUsuarioMod = @8,
                        AudIpMod = @9
                    WHERE ProductoCodigo = @0 AND ClienteId = @1 AND PeriodoDesdeAplica = @2
                    `, [
                        ProductoCodigoOLD, ClienteIdOLD,  PeriodoDesdeAplicaOLD,
                        ProductoCodigo, ClienteId, PeriodoDesdeAplica, Importe, fechaActual, usuario, ip
                    ])
                }
                
                dataResultado = {action:'U'}
                message = "Actualizacion exitosa"
              
            } else {  //Es un nuevo registro de ProductoPrecio
                const checkNewCodigo = await queryRunner.query(`
                    SELECT PeriodoDesdeAplica FROM ProductoPrecio WHERE ProductoCodigo = @0 AND ClienteId = @1 AND PeriodoDesdeAplica = @2 
                    `, [ProductoCodigo, ClienteId, PeriodoDesdeAplica])
                if (checkNewCodigo.length) throw new ClientException('Ya existe un registros con los mismos datos')
                // await this.validateForm(false, params, queryRunner,null)
                
                console.log('El código no existe - es nuevo')
                await queryRunner.query(`
                INSERT INTO ProductoPrecio (
                    ProductoCodigo, 
                    ClienteId,
                    PeriodoDesdeAplica,
                    Importe,
                    AudFechaIng, AudFechaMod,
                    AudUsuarioIng, AudUsuarioMod,
                    AudIpIng, AudIpMod
                ) VALUES ( @0, @1, @2, @3, @4, @4, @5, @5, @6, @6)
                `, [ProductoCodigo, ClienteId,  PeriodoDesdeAplica , Importe, fechaActual, usuario, ip]
                )

                dataResultado = {action:'I'}
                message = "Carga de nuevo Registro exitoso"
            }

            await queryRunner.commitTransaction()
            return this.jsonRes( dataResultado, res, message)
        } catch (error) {
           await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
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
        try {
            await queryRunner.connect()
            await queryRunner.startTransaction()

            let result = await queryRunner.query( `SELECT * FROM lige.dbo.lpv_precio_venta WHERE precio_venta_id = @0`, [cod_producto_venta])

            if(result[0].importe_desde < new Date() && result[0].importe_hasta < new Date())
             throw new ClientException(`No se puede borrar registros con fechas anteriores a hoy`)

            await queryRunner.query( `DELETE FROM lige.dbo.lpv_precio_venta WHERE precio_venta_id = @0`, [cod_producto_venta])
          
            await queryRunner.commitTransaction()
            return this.jsonRes( "", res, "Borrado Exitoso")
        } catch (error) {
           await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
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

    async getProductos(req: any, res: Response, next: NextFunction) {
 
        const queryRunner = dataSource.createQueryRunner();
        try {
            const productos = await queryRunner.query(`
                SELECT ProductoCodigo value, Nombre label
                FROM Producto
            `)

            this.jsonRes({
                total: productos.length,
                list: productos,
            }, res );

        } catch (error) {
            return next(error)
        } finally {
            await queryRunner.release()
        }

    }


 
}

