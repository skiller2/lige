import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, isOptions, orderToSQL, getOptionsSINO } from "../impuestos-afip/filtros-utils/filtros";
import { QueryRunner, QueryResult } from "typeorm";
import { FileUploadController } from "../controller/file-upload.controller"

export class CondicionesVentaController extends BaseController {

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
            fieldName: "cli.ClienteId",
            searchComponent: "inputForClientSearch",
            sortable: true,
            hidden: true,
            searchHidden: false
        },
        {
            name: "Cliente",
            type: "string",
            id: "ClienteDenominacion",
            field: "ClienteDenominacion",
            fieldName: "cli.ClienteDenominacion",
            searchType: "string",
            sortable: false,
            hidden: false,
            searchHidden: true
        },
        {
            name: "Objetivo",
            type: "number",
            id: "ObjetivoId",
            field: "ObjetivoId",
            fieldName: "obj.ObjetivoId",
            searchComponent: "inputForObjetivoSearch",
            sortable: true,
            hidden: true,
            searchHidden: false
        },
        {
            name: "Objetivo",
            type: "string",
            id: "ClienteElementoDependienteDescripcion",
            field: "ClienteElementoDependienteDescripcion",
            fieldName: "ClienteElementoDependienteDescripcion",
            searchType: "string",
            sortable: false,
            hidden: false,
            searchHidden: true
        },
        {
            name: "Periodo Aplica Desde",
            type: "date",
            id: "PeriodoDesdeAplica",
            field: "PeriodoDesdeAplica",
            fieldName: "conven.PeriodoDesdeAplica",
            searchComponent: "inputForFechaSearch",
            sortable: true,
            hidden: false,
            searchHidden: false
        },
        {
            name: "Autorización Fecha",
            type: "date",
            id: "AutorizacionFecha",
            field: "AutorizacionFecha",
            fieldName: "conven.AutorizacionFecha",
            searchComponent: "inputForFechaSearch",
            sortable: true,
            hidden: false,
            searchHidden: false
        },
        {
            name: "Autorización Usuario",
            type: "number",
            id: "AutorizacionPersonalId",
            field: "AutorizacionPersonalId",
            fieldName: "per.PersonalId",
            searchComponent: "inputForPersonalSearch",
            sortable: true,
            hidden: true,
            searchHidden: false
        },
        {
            name: "Autorización Usuario",
            type: "string",
            id: "AutorizacionUsuarioNombre",
            field: "AutorizacionUsuarioNombre",
            fieldName: "per.ApellidoNombre",
            sortable: true,
            hidden: false,
            searchHidden: true
        },
        {
            name: "Período Facturación",
            type: "string",
            id: "PeriodoFacturacion",
            field: "PeriodoFacturacion",
            fieldName: "conven.PeriodoFacturacion",
            searchType: "string",
            sortable: true,
            hidden: false,
            searchHidden: false
        },
        {
            name: "Dia generación factura",
            type: "number",
            id: "GeneracionFacturaDia",
            field: "GeneracionFacturaDia",
            fieldName: "conven.GeneracionFacturaDia",
            searchType: "number",
            sortable: true,
            hidden: false,
            searchHidden: false,
        },
        {
            name: "Dia generación factura Complemento",
            type: "number",
            id: "GeneracionFacturaDiaComplemento",
            field: "GeneracionFacturaDiaComplemento",
            fieldName: "conven.GeneracionFacturaDiaComplemento",
            searchType: "number",
            sortable: true,
            hidden: false,
            searchHidden: false,
        },
        {
            name: "Observaciones",
            type: "string",
            id: "Observaciones",
            field: "Observaciones",
            fieldName: "conven.Observaciones",
            searchType: "string",
            sortable: true,
            hidden: false,
            searchHidden: false
        },
    ];

    async getGridCols(req, res) {
        this.jsonRes(this.listaColumnas, res);
    }

    async listCondicionesVenta(req: any, res: any, next: any) {
        const fechaActual = new Date()
        const filterSql = filtrosToSql(req.body.filters.filtros, this.listaColumnas);
        const orderBy = orderToSQL(req.body.filters.sort)
        const queryRunner = dataSource.createQueryRunner();
       console.log("req.body.periodo...", req.body.periodo)
        const periodoDate = new Date(req.body.periodo)
        const anio = periodoDate.getFullYear()
        const mes = periodoDate.getMonth() + 1

        try {

            const condicionesVenta = await queryRunner.query(
                `
                Select ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) id,
                cli.ClienteDenominacion,cli.ClienteId,CONCAT(ele.ClienteId,'/', ISNULL(ele.ClienteElementoDependienteId,0)) codobj,obj.ObjetivoId, 
                    CONCAT(ele.ClienteId,'/', ele.ClienteElementoDependienteId, ' ', TRIM(ele.ClienteElementoDependienteDescripcion)) as ClienteElementoDependienteDescripcion,
                    conven.PeriodoDesdeAplica, FORMAT(conven.PeriodoDesdeAplica,'yyyy-MM') FormatPeriodoDesdeAplica,conven.AutorizacionFecha,per.PersonalId,
                    case when per.PersonalId is null then null
                        else CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre)) end as ApellidoNombre,
                    conven.PeriodoFacturacion,conven.GeneracionFacturaDia,conven.GeneracionFacturaDiaComplemento,conven.Observaciones,

                    con.ClienteElementoDependienteContratoId, con.ClienteElementoDependienteContratoFechaDesde,con.ClienteElementoDependienteContratoFechaHasta,
                    suc.SucursalDescripcion

                from ClienteElementoDependiente ele
                join ClienteElementoDependienteContrato con on con.ClienteId=ele.ClienteId and con.ClienteElementoDependienteId=ele.ClienteElementoDependienteId and con.ClienteElementoDependienteContratoFechaDesde<=EOMONTH(DATEFROMPARTS(@0,@1,1)) AND ISNULL(con.ClienteElementoDependienteContratoFechaHasta,'9999-12-31')>=DATEFROMPARTS(@0,@1,1)
                LEFT JOIN CondicionVenta conven ON  ele.ClienteId=conven.ClienteId and ele.ClienteElementoDependienteId=conven.ClienteElementoDependienteId and conven.PeriodoDesdeAplica>=con.ClienteElementoDependienteContratoFechaDesde and conven.PeriodoDesdeAplica<=ISNULL(con.ClienteElementoDependienteContratoFechaHasta,'9999-12-31')
                    and conven.PeriodoDesdeAplica = (
                    SELECT max(PeriodoDesdeAplica) 
                        FROM CondicionVenta cv
                        WHERE cv.ClienteId = ele.ClienteId
                        AND cv.ClienteElementoDependienteId = ele.ClienteElementoDependienteId
                            and cv.PeriodoDesdeAplica <= DATEFROMPARTS(@0, @1, 1)
                    )
                Left join Cliente cli on cli.ClienteId=ele.ClienteId
                Left join Objetivo obj on obj.ClienteElementoDependienteId=ele.ClienteElementoDependienteId and obj.ClienteId=ele.ClienteId
                Left join Personal per on per.PersonalId=conven.AutorizacionPersonalId
                LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
                LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ele.ClienteElementoDependienteSucursalId ,cli.ClienteSucursalId)    AND 
             ${filterSql} ${orderBy}`, [anio, mes])

            this.jsonRes(
                {
                    total: condicionesVenta.length,
                    list: condicionesVenta,
                },
                res
            );

        } catch (error) {
            return next(error)
        }

    }

    async addCondicionVenta(req: any, res: any, next: any) {

        const queryRunner = dataSource.createQueryRunner();
        const CondicionVenta = { ...req.body };
        console.log(CondicionVenta)
       // let CondicionVentaNew = { CondicionVentaId: 0}
        try {
            //validaciones
            await this.FormValidations(CondicionVenta, queryRunner)
            //throw new ClientException('test')

            await queryRunner.startTransaction()

            const usuario = res.locals.userName
            const ip = this.getRemoteAddress(req)

            const objetivoInfo = await this.ObjetivoInfoFromId(CondicionVenta.ObjetivoId)

            await this.insertInfoProductos(queryRunner, objetivoInfo.clienteId, objetivoInfo.ClienteElementoDependienteId, CondicionVenta.PeriodoDesdeAplica, CondicionVenta.infoProductos, usuario, ip)

          await this.insertCondicionVenta(queryRunner,
             objetivoInfo.clienteId, 
             objetivoInfo.ClienteElementoDependienteId,
             CondicionVenta.PeriodoDesdeAplica,
             CondicionVenta.PeriodoFacturacion.toString(),
             CondicionVenta.GeneracionFacturaDia,
             CondicionVenta.GeneracionFacturaDiaComplemento,
             CondicionVenta.Observaciones,
             usuario,
             ip)

            await queryRunner.commitTransaction()
            return this.jsonRes({}, res, 'Carga  de nuevo registro exitoso');
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async insertInfoProductos(
        queryRunner: QueryRunner, 
        ClienteId: number, 
        ClienteElementoDependienteId: number, 
        PeriodoDesdeAplica: Date, 
        infoProductos: any, usuario: string, ip: string) {

        const FechaActual = new Date();
        
        for (const producto of infoProductos) {
            const productoResult = await queryRunner.query(
                `SELECT ProductoCodigo,Nombre FROM Producto WHERE ProductoCodigo = @0`,
                [producto.ProductoId]
            );
            
            if (productoResult.length === 0) {
                throw new ClientException(`No se encontró el producto con ID ${producto.ProductoId}`);
            }
            
            const ProductoCodigo = productoResult[0].ProductoCodigo;
            
            await queryRunner.query(
                `INSERT INTO CondicionVentaDetalle (
                    ClienteId,
                    ClienteElementoDependienteId,
                    PeriodoDesdeAplica,
                    ProductoCodigo,
                    TextoFactura,
                    Cantidad,
                    IndCantidadHorasVenta,
                    ImporteFijo,
                    IndImporteListaPrecio,
                    IndImporteAcuerdoConCliente,
                    AudFechaIng,
                    AudFechaMod,
                    AudUsuarioIng,
                    AudUsuarioMod,
                    AudIpIng,
                    AudIpMod
                ) VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@11,@12,@13,@14,@15)`,
                [
                    ClienteId,
                    ClienteElementoDependienteId,
                    PeriodoDesdeAplica,
                    ProductoCodigo,
                    producto.TextoFactura || null,
                    producto.cantidad,
                    producto.IndCantidadHorasVenta ? 1 : 0,
                    producto.importeFijo || null,
                    producto.IndImporteListaPrecio ? 1 : 0,
                    producto.IndImporteAcuerdoConCliente ? 1 : 0,
                    FechaActual,
                    FechaActual,
                    usuario,
                    usuario,
                    ip,
                    ip
                ]
            );
        }
    }

    async FormValidations(CondicionVenta: any, queryRunner: any) {

        if (!CondicionVenta.ObjetivoId) {
            throw new ClientException(`Debe completar el campo Objetivo.`)
        }
        if (!CondicionVenta.PeriodoDesdeAplica) {
            throw new ClientException(`Debe completar el campo Periodo.`)
        }
        if (!CondicionVenta.PeriodoFacturacion) {
            throw new ClientException(`Debe completar el campo Periodo Facturacion.`)
        }
        if (!CondicionVenta.GeneracionFacturaDia) {
            throw new ClientException(`Debe completar el campo Dia de Generación Factura.`)
        }
        if (!CondicionVenta.GeneracionFacturaDiaComplemento) {
            throw new ClientException(`Debe completar el campo Dia de Generación Factura Complemento.`)
        }
        
        for (const producto of CondicionVenta.infoProductos) {
            if (!producto.ProductoId) {
                throw new ClientException(`Debe completar el campo Producto.`)
            }
            if (!producto.cantidad) {
                throw new ClientException(`Debe completar el campo Cantidad.`)
            }
            if (!producto.importeFijo) {
                throw new ClientException(`Debe completar el campo Importe Fijo.`)
            }
            if (producto.IndCantidadHorasVenta == '') {
                throw new ClientException(`Debe completar el campo Cantidad horas venta.`)
            }
            if (producto.IndImporteListaPrecio == '') {
                throw new ClientException(`Debe completar el campo Importe lista de precio.`)
            }
            if (producto.IndImporteAcuerdoConCliente == '') {
                throw new ClientException(`Debe completar el campo Importe acordado con cliente.`)
            }
            if (!producto.TextoFactura) {
                throw new ClientException(`Debe completar el campo TextoFactura.`)
            }
        }
    }

    async getTipoProductoSearchOptions(req: any, res: any, next: any) {
        const result = await dataSource.query(`
        SELECT ProductoCodigo,Nombre FROM Producto `)
        this.jsonRes(result, res);
    }

    async insertCondicionVenta(queryRunner: QueryRunner,
         ClienteId: number,
          ClienteElementoDependienteId: number,
          PeriodoDesdeAplica: Date,
          PeriodoFacturacion: string,
          GeneracionFacturaDia: number,
          GeneracionFacturaDiaComplemento: number,
          Observaciones: string,
          usuario: string,
          ip: string) {
        let FechaActual = new Date()

        await queryRunner.query(`INSERT INTO CondicionVenta (
            ClienteId,
            ClienteElementoDependienteId,
            PeriodoDesdeAplica,
            AutorizacionFecha,
            AutorizacionPersonalId,
            AutorizacionEstado,
            PeriodoFacturacion,
            GeneracionFacturaDia,
            GeneracionFacturaDiaComplemento,
            Observaciones,
            AudFechaIng,
            AudUsuarioIng,
            AudIpIng,
            AudFechaMod,
            AudUsuarioMod,
            AudIpMod) VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@11,@12,@13,@14,@15)`,
             [  ClienteId,
                ClienteElementoDependienteId,
                PeriodoDesdeAplica, 
                null,
                null,
                null,
                PeriodoFacturacion, 
                GeneracionFacturaDia, 
                GeneracionFacturaDiaComplemento,
                Observaciones, FechaActual, usuario, ip, FechaActual, usuario, ip])
         
    }

    async ObjetivoInfoFromId(objetivoId: string) {
        try {
          const result = await dataSource.query(
            `SELECT obj.ObjetivoId objetivoId, obj.ClienteId clienteId, obj.ClienteElementoDependienteId,
            CONCAT(TRIM(cli.ClienteDenominacion), TRIM(ele.ClienteElementoDependienteDescripcion)) descripcion, 
            ISNULL(ISNULL(ele.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1) SucursalId
            FROM Objetivo obj 
            JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
            JOIN ClienteElementoDependiente ele ON ele.ClienteId = obj.ClienteId AND ele.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
            WHERE obj.ObjetivoId = @0`,
            [objetivoId]
          );
          const info = result[0];
          return info
            } catch (error) {
            return null
        }
      }

    async existCondicionVenta(req: any, res: any, next: any) {
      try {
        

        console.log("req.params ", req.params.codcliente)

        console.log("codcliente ", req.params.codcliente)
        console.log("codclienteelemento ", req.params.codclienteelemento)
        console.log("periodoDesdeAplica ", req.params.periodoDesdeAplica)
        const result = await dataSource.query(`SELECT ClienteId from CondicionVenta WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1 AND PeriodoDesdeAplica = @2`, [req.params.codcliente, req.params.codclienteelemento, req.params.periodoDesdeAplica])
        return result
      } catch (error) {
       // return next(error)
      }
    }


}
