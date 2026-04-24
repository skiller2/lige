import { BaseController, ClientException, ClientWarning } from "../controller/base.controller.ts";
import { dataSource } from "../data-source.ts";
import type { NextFunction, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros.ts";
import type { Options } from "../schemas/filtro.ts";
import xlsx from 'node-xlsx';
import { FileUploadController } from "../controller/file-upload.controller.ts";
import { copyFileSync, existsSync, mkdirSync, readFileSync, unlinkSync } from "node:fs";
import { Utils } from "../liquidaciones/liquidaciones.utils.ts";

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
            type: "currency",
            id: "Importe",
            field: "Importe",
            fieldName: "pp.Importe",
            searchType: "numberAdvanced",
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
                    prod.des_producto AS descripcion,
                    prod.nom_producto AS nombre,
                    tip.cod_tipo_producto AS TipoProductoId,
                    tip.des_tipo_producto AS TipoProductoDescripcion,
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
    ROW_NUMBER() OVER (ORDER BY pp.PeriodoDesdeAplica, pp.ProductoCodigo, pp.ClienteId) AS id,
    CONCAT(pp.ProductoCodigo, '-', pp.ClienteId) AS idTable,
    pp.ProductoCodigo,
    pp.ClienteId,
    c.ClienteDenominacion,
    pp.PeriodoDesdeAplica,
    pp.Importe,
    pp.AudFechaIng,
    pp.AudUsuarioIng,
    pp.AudFechaMod,
    pp.AudUsuarioMod,
    fac.ClienteFacturacionCUIT
FROM ProductoPrecio pp
INNER JOIN (
    SELECT ProductoCodigo, ClienteId, MAX(PeriodoDesdeAplica) AS UltimaFecha
    FROM ProductoPrecio
    WHERE PeriodoDesdeAplica <= DATEFROMPARTS(@0, @1, 1)
    GROUP BY ProductoCodigo, ClienteId
) ult ON pp.ProductoCodigo = ult.ProductoCodigo 
      AND pp.ClienteId = ult.ClienteId 
      AND pp.PeriodoDesdeAplica = ult.UltimaFecha
LEFT JOIN Cliente c ON pp.ClienteId = c.ClienteId
LEFT JOIN Producto p ON p.ProductoCodigo = pp.ProductoCodigo
LEFT JOIN ProductoTipo pt ON pt.ProductoTipoCodigo = p.ProductoTipoCodigo
LEFT JOIN ClienteFacturacion fac 
    ON fac.ClienteId = c.ClienteId 
    AND fac.ClienteFacturacionDesde = (
        SELECT MAX(ClienteFacturacionDesde) 
        FROM ClienteFacturacion fac2 
        WHERE fac2.ClienteId = c.ClienteId
    )
     where  ${filterSql}`, [anio, mes])

            const formattedData = precios.map((item: any) => ({
                ...item,
                Cliente: {
                    id: item.ClienteId,
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

    async addProductoPrecioQuery(
        queryRunner:any,
        ProductoCodigo:string,
        ClienteId:number, 
        PeriodoDesdeAplica:Date, 
        Importe:number,
        fecha:Date,
        usuario:string,
        ip:string,
        docId?: number
    ){
        await queryRunner.query(`
        INSERT INTO ProductoPrecio (
            ProductoCodigo, 
            ClienteId,
            PeriodoDesdeAplica,
            Importe,
            AudFechaIng, AudFechaMod,
            AudUsuarioIng, AudUsuarioMod,
            AudIpIng, AudIpMod,
            ImportDocumentoId
        ) VALUES ( @0, @1, @2, @3, @4, @4, @5, @5, @6, @6, @7)
        `, [ProductoCodigo, ClienteId,  PeriodoDesdeAplica , Importe, fecha, usuario, ip, docId?docId:null])
    }

    async updateProductoPrecioQuery(
        queryRunner:any,
        ProductoCodigo:string,
        ClienteId:number, 
        PeriodoDesdeAplicaActual:Date,
        PeriodoDesdeAplicaNueva:Date,
        Importe:number,
        fecha:Date,
        usuario:string,
        ip:string
    ){
        await queryRunner.query(`
        UPDATE ProductoPrecio SET 
            PeriodoDesdeAplica = @3,
            Importe = @4,
            AudFechaMod = @5,
            AudUsuarioMod = @6,
            AudIpMod = @7
        WHERE ProductoCodigo = @0 AND ClienteId = @1 AND PeriodoDesdeAplica = @2
        `, [ProductoCodigo, ClienteId, PeriodoDesdeAplicaActual, PeriodoDesdeAplicaNueva, Importe, fecha, usuario, ip])
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
        const Importe = Number(req.body.Importe)
        const PeriodoDesdeAplica = new Date(req.body.PeriodoDesdeAplica)

        // Validaciones previas
        if (!ClienteId) throw new ClientException('Cliente es requerido')
        if (!ProductoCodigo) throw new ClientException('Producto es requerido')
        if (Importe <= 0) throw new ClientException('El importe debe ser mayor a 0')

        // instanciar el primer dia del mes
        PeriodoDesdeAplica.setDate(1)
        PeriodoDesdeAplica.setHours(0,0,0,0)

        const fechaActual = new Date()
        fechaActual.setHours(0,0,0,0)

        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            const anio = PeriodoDesdeAplica.getFullYear()
            const mes = PeriodoDesdeAplica.getMonth()+1

            if (idTable != null && idTable.length > 0) { 
                // UPDATE: existe registro anterior
                
                // Obtener el período anterior del registro
                const registroAnterior = await queryRunner.query(`
                    SELECT PeriodoDesdeAplica, Importe FROM ProductoPrecio 
                    WHERE ProductoCodigo = @0 AND ClienteId = @1
                    ORDER BY PeriodoDesdeAplica DESC
                `, [ProductoCodigo, ClienteId])

                if (!registroAnterior.length) {
                    throw new ClientException('El registro a actualizar no existe')
                }

                const PeriodoAnterior = new Date(registroAnterior[0].PeriodoDesdeAplica)
                PeriodoAnterior.setHours(0,0,0,0)

            //   validar que el registro nuevo , en dicho periodo no exista ya un precio para ese producto y cliente
                const checkExistente = await queryRunner.query(`
                    SELECT PeriodoDesdeAplica FROM ProductoPrecio WHERE ProductoCodigo = @0 AND ClienteId = @1 AND PeriodoDesdeAplica = @2 AND NOT (PeriodoDesdeAplica = @3)
                `, [ProductoCodigo, ClienteId, PeriodoDesdeAplica, PeriodoAnterior])
                if (checkExistente.length) throw new ClientException('Ya existe un registro con los mismos datos')
                                 

                // Actualizar registro anterior
                await this.updateProductoPrecioQuery(queryRunner, ProductoCodigo, ClienteId, PeriodoAnterior, PeriodoDesdeAplica, Importe, fechaActual, usuario, ip)

                // Generar idTable consistente con frontend
                const idTableResponse = `${ProductoCodigo}-${ClienteId}`
                dataResultado = {action:'U', idTable: idTableResponse}
                message = "Actualización exitosa"
              
            } else {  
                // INSERT: nuevo registro de ProductoPrecio

                // Validar que no exista duplicado
                const checkExistente = await queryRunner.query(`
                    SELECT PeriodoDesdeAplica FROM ProductoPrecio WHERE ProductoCodigo = @0 AND ClienteId = @1 AND PeriodoDesdeAplica = @2 
                `, [ProductoCodigo, ClienteId, PeriodoDesdeAplica])
                
                if (checkExistente.length) throw new ClientException('Ya existe un registro con los mismos datos')
                
                // Insertar el nuevo registro
                await this.addProductoPrecioQuery(queryRunner, ProductoCodigo, ClienteId, PeriodoDesdeAplica, Importe, fechaActual, usuario, ip)

                // Generar idTable consistente con frontend
                const idTableResponse = `${ProductoCodigo}-${ClienteId}`
                dataResultado = {action:'I', idTable: idTableResponse}
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

    async deleteProductoPrecioQuery(
        queryRunner:any,
        ProductoCodigo:string,
        ClienteId:number, 
        PeriodoDesdeAplica:Date,
    ){
        await queryRunner.query(`
        DELETE FROM ProductoPrecio WHERE ProductoCodigo = @0 AND ClienteId = @1 AND PeriodoDesdeAplica = @2
        `, [ProductoCodigo, ClienteId,  PeriodoDesdeAplica])
    }

    async deleteProductos(req: any, res: Response, next: NextFunction){

        const list = req.body.list
        const queryRunner = dataSource.createQueryRunner()
        let messageError:string[] = []
        try {
            
            await queryRunner.connect()
            await queryRunner.startTransaction()

            for (const producto of list) {
                
                const id = producto.id
                // const CUIT = producto.ClienteFacturacionCUIT
                const ClienteId = producto.Cliente?.id
                const ProductoCodigo = producto.ProductoCodigo
                const PeriodoDesdeAplica = new Date(producto.PeriodoDesdeAplica)
                const anio = PeriodoDesdeAplica.getFullYear()
                const mes = PeriodoDesdeAplica.getMonth()+1

                const checkComprobante = await queryRunner.query(`
                    SELECT ComprobanteNro FROM Facturacion WHERE ProductoCodigo = @0 AND ClienteId = @1 AND Anio = @2 AND Mes = @3
                `, [ProductoCodigo, ClienteId, anio, mes])
                if (checkComprobante[0]?.ComprobanteNro?.length) messageError.push(`FILA ${id}: El precio del producto ya fue facturados`)
                
                await this.deleteProductoPrecioQuery(queryRunner, ProductoCodigo, ClienteId, PeriodoDesdeAplica)
                
            }
            // throw new ClientException(`DEBUG`)
            if (messageError.length) throw new ClientException(messageError)
            await queryRunner.commitTransaction()
            return this.jsonRes( "", res, "Borrado Exitoso")
        } catch (error) {
           await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
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

    async getPeriodoQuery(queryRunner: any, anio: number, mes: number) {
        return await queryRunner.query(`
        SELECT periodo_id, anio, mes, ind_recibos_generados
        FROM lige.dbo.liqmaperiodo
        WHERE anio = @1 AND mes = @2
        `, [, anio, mes])
    }

    async handleXLSUpload(req: any, res: Response, next: NextFunction) {
        const usuario = res.locals.userName
        const ip = this.getRemoteAddress(req)

        const anioRequest = Number(req.body.anio)
        const mesRequest = Number(req.body.mes)
        const PeriodoDesdeAplica = new Date(anioRequest, mesRequest-1, 1, 0, 0, 0, 0)
        const productoCodigoRequest = req.body.ProductoCodigo
        const file = req.body.files
        
        const tableNameRequest = 'ProductoPrecio'
        let den_documento: string = ''
        const fechaActual: Date = new Date()
        let columnsnNotFound = []
        let dataset: any = []
        let idError: number = 0
        let altaProductoPrecios = 0
        let result: any
        let docFilePath: string | null = null
        let docId: number | null = null
        let ProcesoAutomaticoLogCodigo = 0

        const queryRunner = dataSource.createQueryRunner();
        try {
            let campos_vacios: any[] = [];

            ({ ProcesoAutomaticoLogCodigo } = await this.procesoAutomaticoLogInicio(
                queryRunner,
                `Importación xls Precios Producto ${productoCodigoRequest} - ${tableNameRequest} - ${mesRequest}/${anioRequest}`,
                { anioRequest, mesRequest, productoCodigoRequest, tableNameRequest, usuario, ip },
                usuario,
                ip
            ))


            if (!anioRequest || !mesRequest) campos_vacios.push(`- Periodo`);
            if (!productoCodigoRequest.length) campos_vacios.push(`- Producto`);

            if (campos_vacios.length) {
                campos_vacios.unshift('Debe completar los siguientes campos: ')
                throw new ClientException(campos_vacios)
            }

            await queryRunner.connect();
            await queryRunner.startTransaction();

            //Valida que el período no tenga el indicador de recibos generado
            const periodo_id = await Utils.getPeriodoId(queryRunner, new Date(), anioRequest, mesRequest, usuario, ip)
            const getRecibosGenerados = await queryRunner.query(`SELECT ind_recibos_generados FROM lige.dbo.liqmaperiodo WHERE periodo_id = @0`, [periodo_id])

            if (getRecibosGenerados[0]?.ind_recibos_generados == 1) {
                throw new ClientException(`Ya se encuentran generados los recibos para el período ${anioRequest}/${mesRequest}, no se puede hacer modificaciones`)
            }
            
            const workSheetsFromBuffer = xlsx.parse(readFileSync(FileUploadController.getTempPath() + '/' + file[0].tempfilename))
            const sheet1 = workSheetsFromBuffer[0];
            const columnsName: Array<string> = sheet1.data[0]

            //Tranformo el array en un objeto con claves como los elementos del array y valores como sus índices
            const columnsXLS: any = columnsName.reduce((acc, column, index) => {
                acc[column] = index;
                return acc;
            }, {} as Record<string, number>);

            sheet1.data.splice(0, 1)

            //Obtengo el nombre del producto
            const Producto: any = await queryRunner.query(`
                SELECT ProductoCodigo, TRIM(Nombre) AS Nombre FROM Producto WHERE ProductoCodigo IN (@0)
            `, [productoCodigoRequest])
            const ProductoNombre = Producto[0].Nombre

            //Validar que esten las columnas nesesarias
            if (isNaN(columnsXLS['CUIT'])) columnsnNotFound.push('- CUIT')
            if (isNaN(columnsXLS['Importe Unitario'])) columnsnNotFound.push('- Importe Unitario')

            if (columnsnNotFound.length) {
                columnsnNotFound.unshift('Faltan las siguientes columnas:')
                throw new ClientException(columnsnNotFound)
            }

            den_documento = `Precios-Producto-${ProductoNombre}-${mesRequest}-${anioRequest}`
            const docProductoPrecios = await FileUploadController.handleDOCUpload(null, null, null, null, fechaActual, null, den_documento, anioRequest, mesRequest, file[0], usuario, ip, queryRunner)
            docFilePath = docProductoPrecios?.newFilePath
            docId = docProductoPrecios.doc_id ? docProductoPrecios.doc_id : null
            let CUITs:number[] = []

            for (const row of sheet1.data) {
                //Finaliza cuando la fila esta vacia
                if (
                !row[columnsXLS['CUIT']]
                && !row[columnsXLS['Importe Unitario']]
                ) break

                const CUIT = row[columnsXLS['CUIT']]
                const Importe = row[columnsXLS['Importe Unitario']]
                
                //Validaciones del CUIT del cliente
                //Verifico que tenga 11 digitos
                if (!/^\d{11}$/.test(CUIT)) {
                    dataset.push({ id: idError++, CUIT: row[columnsXLS['CUIT']], Detalle: 'El CUIT no tiene el formato correcto.' })
                    continue
                }
                //Verifico que exista el CUIT del cliente
                const cliente = await queryRunner.query(`
                    SELECT cli.ClienteId, TRIM(cli.ClienteDenominacion) ClienteDenominacion FROM Cliente cli 
                    LEFT JOIN ClienteFacturacion clif ON clif.ClienteId = cli.ClienteId AND clif.ClienteFacturacionDesde <= @0 
                        AND ISNULL(clif.ClienteFacturacionHasta, '9999-12-31') >= @0
                    WHERE clif.ClienteFacturacionCUIT = @1
                `, [fechaActual, CUIT])

                if (cliente.length == 0) {
                    dataset.push({ id: idError++, CUIT: row[columnsXLS['CUIT']], Detalle: `El CUIT no existe en la base de datos.` })
                    continue
                }
                const ClienteId = cliente[0].ClienteId
                const RazonSocial = cliente[0].ClienteDenominacion

                //Verifico que el cliente no este duplicado
                if (CUITs.find((num:number) => num == CUIT )) {
                    dataset.push({ id: idError++, CUIT: row[columnsXLS['CUIT']], Detalle: `El CUIT esta duplicado`, RazonSocial })
                    continue
                }

                //Validaciones del Importe Unitario
                //Verifico que el importe sea mayor a 0
                if (!Importe || Importe <= 0) {
                    dataset.push({ id: idError++, CUIT: row[columnsXLS['CUIT']], Detalle: 'Importe Unitario invalido.', RazonSocial })
                    continue
                }

                //Verifico si ya existe el registro
                const checkNewCodigo = await queryRunner.query(`
                    SELECT PeriodoDesdeAplica, Importe FROM ProductoPrecio WHERE ProductoCodigo = @0 AND ClienteId = @1 AND PeriodoDesdeAplica = @2 
                `, [productoCodigoRequest, ClienteId, PeriodoDesdeAplica])

                if (checkNewCodigo.length){ //En caso de que exista
                    //Compruebo si fue facturado
                    const checkComprobante = await queryRunner.query(`
                        SELECT ComprobanteNro FROM Facturacion WHERE ProductoCodigo = @0 AND ClienteId = @1 AND Anio = @2 AND Mes = @3
                    `, [productoCodigoRequest, ClienteId, anioRequest, mesRequest])

                    if (checkComprobante[0]?.ComprobanteNro?.length && checkNewCodigo[0].Importe != Importe){//Fue facturado y el Importe es diferente al de la base de datos
                        dataset.push({ id: idError++, CUIT: row[columnsXLS['CUIT']], Detalle: `El precio del producto del periodo ${anioRequest}/${mesRequest} existe y fue facturado. No se puede modificar`, RazonSocial })
                        continue
                    } else if (!checkComprobante[0] && checkNewCodigo[0].Importe != Importe) {//No fue facturado y el Importe es diferente al de la base de datos
                        await this.deleteProductoPrecioQuery(queryRunner, productoCodigoRequest, ClienteId, PeriodoDesdeAplica)
                    }
                }
                CUITs.push(CUIT)
                
                if (Importe <= 0) {
                    dataset.push({ id: idError++, CUIT: row[columnsXLS['CUIT']], Detalle: 'El Importe Unitario debe ser mayor a 0.', RazonSocial })
                    continue
                }
                await this.addProductoPrecioQuery(queryRunner, productoCodigoRequest, ClienteId, PeriodoDesdeAplica, Importe, fechaActual, usuario, ip, docId)

                altaProductoPrecios++
            }

            if (dataset.length > 0) {
                throw new ClientException(`Hubo ${dataset.length} errores que no permiten importar el archivo.`, { list: dataset })
            }
            
            await queryRunner.commitTransaction();
            await this.procesoAutomaticoLogFin(
                queryRunner,
                ProcesoAutomaticoLogCodigo,
                'COM',
                { res: `Procesado correctamente`, altaProductoPrecios },
                usuario,
                ip
            );

            this.jsonRes([], res, `XLS Recibido y procesado! Se procesaron ${altaProductoPrecios} registros correctamente`);
        } catch (error) {
            await this.rollbackTransaction(queryRunner)

            if (docFilePath) await FileUploadController.deletePhysicalFile(docFilePath);

            await this.procesoAutomaticoLogFin(queryRunner,
                ProcesoAutomaticoLogCodigo,
                'ERR',
                { res: error.message || error, list: JSON.stringify(dataset) },
                usuario,
                ip
            );
            return next(error)
        } finally {
            await queryRunner.release();
        }
    }

    async getImportacionesPreciosAnteriores(req: any, res: Response, next: NextFunction) {
        const anio = req.params.anio
        const mes = req.params.mes
        const queryRunner = dataSource.createQueryRunner()

        try {
        await queryRunner.connect()
        await queryRunner.startTransaction()

        const importacionesDescuentosAnteriores = await queryRunner.query(
            `SELECT doc.DocumentoId, DocumentoTipoCodigo, doc.DocumentoAnio,doc.DocumentoMes, doc.DocumentoDenominadorDocumento, FORMAT(DocumentoAudFechaIng, 'dd/MM/yyyy HH:mm:ss') AS DocumentoAudFechaIng
            FROM documento doc
            WHERE doc.DocumentoAnio = @0 AND doc.DocumentoMes = @1 AND doc.DocumentoTipoCodigo = 'PRO'`,
            [Number(anio), Number(mes)])

        this.jsonRes(
            {
            total: importacionesDescuentosAnteriores.length,
            list: importacionesDescuentosAnteriores,
            },

            res
        );
        await queryRunner.commitTransaction()

        } catch (error) {
        await queryRunner.rollbackTransaction()
        return next(error)
        } finally {
        await queryRunner.release()
        }
    }
 
}

