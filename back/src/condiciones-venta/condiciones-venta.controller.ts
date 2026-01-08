import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
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
            name: "Autorizado Por",
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
            name: "Autorizado Por",
            type: "string",
            id: "AutorizacionApellidoNombre",
            field: "AutorizacionApellidoNombre",
            fieldName: "case when per.PersonalId is null then null else CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre)) end",
            sortable: true,
            hidden: false,
            searchHidden: true
        },
        {
            name: "Fecha Ingreso",
            type: "date",
            id: "AudFechaIng",
            field: "AudFechaIng",
            fieldName: "conven.AudFechaIng",
            sortable: true,
            hidden: false,
            searchHidden: true,
            showGridColumn: false

        },
        {
            name: "Usuario Ingreso",
            type: "string",
            id: "AudUsuarioIng",
            field: "AudUsuarioIng",
            fieldName: "conven.AudUsuarioIng",
            sortable: true,
            hidden: false,
            searchHidden: true,
            showGridColumn: false

        },
        {
            name: "Fecha Modificación",
            type: "date",
            id: "AudFechaMod",
            field: "AudFechaMod",
            fieldName: "conven.AudFechaMod",
            sortable: true,
            hidden: false,
            searchHidden: true,
            showGridColumn: false

        },
        {
            name: "Usuario Modificación",
            type: "string",
            id: "AudUsuarioMod",
            field: "AudUsuarioMod",
            fieldName: "conven.AudUsuarioMod",
            sortable: true,
            hidden: false,
            searchHidden: true,
            showGridColumn: false

        }

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
                        else CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre)) end as AutorizacionApellidoNombre,
                    conven.PeriodoFacturacion,conven.GeneracionFacturaDia,conven.GeneracionFacturaDiaComplemento,conven.Observaciones,

                    con.ClienteElementoDependienteContratoId, con.ClienteElementoDependienteContratoFechaDesde,con.ClienteElementoDependienteContratoFechaHasta,
                    suc.SucursalDescripcion,

                    conven.AudFechaIng, conven.AudUsuarioIng, conven.AudIpIng,
                    conven.AudFechaMod, conven.AudUsuarioMod, conven.AudIpMod

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
                LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ele.ClienteElementoDependienteSucursalId ,cli.ClienteSucursalId)  WHERE
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

        try {

            //validaciones
            await this.FormValidations(CondicionVenta, queryRunner)
            //throw new ClientException('test')

            await queryRunner.startTransaction()
            const usuario = res.locals.userName
            const ip = this.getRemoteAddress(req)
            const objetivoInfo = await this.ObjetivoInfoFromId(CondicionVenta.ObjetivoId)

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

            for (const producto of CondicionVenta.infoProductos) {
                if (producto.ProductoCodigo) {
                    await this.CondicionVentaDetalle(queryRunner,
                        objetivoInfo.clienteId,
                        objetivoInfo.ClienteElementoDependienteId,
                        CondicionVenta.PeriodoDesdeAplica,
                        producto.ProductoCodigo,
                        producto.TextoFactura,
                        producto.Cantidad,
                        producto.IndCantidadHorasVenta,
                        producto.ImporteFijo,
                        producto.IndImporteAcuerdoConCliente,
                        producto.IndImporteListaPrecio,
                        usuario,
                        ip)
                }
            }


            const result = {
                ClienteId: objetivoInfo.clienteId,
                ClienteElementoDependienteId: objetivoInfo.ClienteElementoDependienteId,
                PeriodoDesdeAplica: CondicionVenta.PeriodoDesdeAplica
            }


            await queryRunner.commitTransaction();
            //throw new ClientException('test')
            return this.jsonRes(result, res, 'Carga  de nuevo registro exitoso');
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async CondicionVentaDetalle(
        queryRunner: QueryRunner,
        ClienteId: number,
        ClienteElementoDependienteId: number,
        PeriodoDesdeAplica: Date,
        ProductoCodigo: string,
        TextoFactura: string,
        Cantidad: number,
        IndCantidadHorasVenta: boolean,
        ImporteFijo: number,
        IndImporteListaPrecio: boolean,
        IndImporteAcuerdoConCliente: boolean,
        usuario: string,
        ip: string
    ) {
        const FechaActual = new Date();

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
            ) VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15)`,
            [
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
                FechaActual,
                FechaActual,
                usuario,
                usuario,
                ip,
                ip
            ]
        );
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

        for (const producto of CondicionVenta.infoProductos) {
            if (!producto.ProductoCodigo) {
                throw new ClientException(`Debe completar el campo Producto.`)
            }
            if (!producto.Cantidad) {
                throw new ClientException(`Debe completar el campo Cantidad.`)
            }
            if (!producto.ImporteFijo) {
                throw new ClientException(`Debe completar el campo Importe Fijo.`)
            }
            if (!producto.IndCantidadHorasVenta) {
                throw new ClientException(`Debe completar el campo Cantidad horas venta.`)
            }
            if (!producto.IndImporteListaPrecio) {
                throw new ClientException(`Debe completar el campo Importe lista de precio.`)
            }
            if (!producto.IndImporteAcuerdoConCliente) {
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
            [ClienteId,
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

    async infCondicionVenta(req: any, res: Response, next: any) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.startTransaction()
            const codobjId = Number(req.params.codobjId);
            const ClienteElementoDependienteId = Number(req.params.ClienteElementoDependienteId);
            const PeriodoDesdeAplica = new Date(req.params.PeriodoDesdeAplica);
            PeriodoDesdeAplica.setHours(0, 0, 0, 0)

            const infoCondicionVentaArr = await this.getInfoCondicionVenta(queryRunner, codobjId, ClienteElementoDependienteId, PeriodoDesdeAplica);
            const infoProductos = await this.getInfoProductos(queryRunner, codobjId, ClienteElementoDependienteId, PeriodoDesdeAplica);
            const infoCondicionVenta = infoCondicionVentaArr[0];

            if (infoCondicionVenta)
                infoCondicionVenta.infoProductos = infoProductos;

            await queryRunner.commitTransaction();
            return this.jsonRes(infoCondicionVenta, res);

        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }



    async getInfoCondicionVenta(queryRunner: any, codobjId: number, ClienteElementoDependienteId: number, PeriodoDesdeAplica: Date) {
        return await
            queryRunner.query(` SELECT  
            obj.ObjetivoId,
            Cond.ClienteId,
            Cond.ClienteElementoDependienteId,
            Cond.PeriodoDesdeAplica,
            Cond.PeriodoFacturacion,
            Cond.GeneracionFacturaDia,
            Cond.GeneracionFacturaDiaComplemento,
            Cond.Observaciones
        FROM CondicionVenta AS Cond
        INNER JOIN Objetivo AS obj 
            ON obj.ClienteId = Cond.ClienteId
        AND obj.ClienteElementoDependienteId = Cond.ClienteElementoDependienteId
        WHERE Cond.ClienteId = @0
        AND Cond.ClienteElementoDependienteId = @1
        AND Cond.PeriodoDesdeAplica = @2`,
                [codobjId, ClienteElementoDependienteId, PeriodoDesdeAplica])
    }

    async getInfoProductos(queryRunner: any, codobjId: number, ClienteElementoDependienteId: number, PeriodoDesdeAplica: Date) {
        return await
            queryRunner.query(` 
            SELECT ProductoCodigo,TextoFactura,Cantidad,IndCantidadHorasVenta,ImporteFijo,IndImporteListaPrecio,IndImporteAcuerdoConCliente
            FROM CondicionVentaDetalle 
            WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1 AND PeriodoDesdeAplica = @2`,
                [codobjId, ClienteElementoDependienteId, PeriodoDesdeAplica])
    }


    async getAutorizarCondicionVenta(req: any, res: any, next: any) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.startTransaction()
            const codobj = req.params.codobj;
            const usuario = res.locals.userName;
            const personalId = res.locals.PersonalId;
            const ip = this.getRemoteAddress(req);
            const ClienteElementoDependienteId = Number(req.params.ClienteElementoDependienteId);
            const PeriodoDesdeAplica = new Date(req.params.PeriodoDesdeAplica);
            PeriodoDesdeAplica.setHours(0, 0, 0, 0)


            const result = await queryRunner.query(`
                SELECT  ClienteId,ClienteElementoDependienteId,PeriodoDesdeAplica,AutorizacionFecha,AutorizacionPersonalId,AutorizacionEstado
                    FROM CondicionVenta 
                    WHERE ClienteId = @0
                    AND ClienteElementoDependienteId = @1
                    AND PeriodoDesdeAplica = @2`, [codobj, ClienteElementoDependienteId, PeriodoDesdeAplica])

            if (result.length > 0) {
                if (result[0].AutorizacionFecha && result[0].AutorizacionPersonalId && result[0].AutorizacionEstado) {
                    throw new ClientException(`Ya se aprobo el registro seleccionado.`)
                }
                else {
                    await this.updateAutorizacionCondicionVenta(queryRunner, codobj, ClienteElementoDependienteId, PeriodoDesdeAplica, usuario, personalId, ip)
                }
            } else {
                throw new ClientException(`No existe el registro seleccionado.`)
            }
            //throw new ClientException('test')
            await queryRunner.commitTransaction();
            return this.jsonRes({}, res, 'Autorización exitosa');
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async updateAutorizacionCondicionVenta(queryRunner: any, codobj: string, ClienteElementoDependienteId: number, PeriodoDesdeAplica: Date, usuario: string, personalId: number, ip: string) {
        let FechaActual = new Date()
        await queryRunner.query(`
        UPDATE CondicionVenta 
        SET
            AutorizacionFecha = @0,
            AutorizacionPersonalId = @1,
            AutorizacionEstado = 'A',
            AudFechaMod = @2,
            AudUsuarioMod = @3,
            AudIpMod = @4
        WHERE ClienteId = @5
        AND ClienteElementoDependienteId = @6
        AND PeriodoDesdeAplica = @7
        `, [FechaActual, personalId, FechaActual, usuario, ip, codobj, ClienteElementoDependienteId, PeriodoDesdeAplica])

    }

    async rechazarCondicionVenta(req: any, res: any, next: any) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.startTransaction()
            const codobj = req.params.codobj;
            const usuario = res.locals.PersonalId;
            const ip = this.getRemoteAddress(req);
            const ClienteElementoDependienteId = Number(req.params.ClienteElementoDependienteId);
            const PeriodoDesdeAplica = new Date(req.params.PeriodoDesdeAplica);
            PeriodoDesdeAplica.setHours(0, 0, 0, 0)

            // delete CondicionVentaDetalle
            await queryRunner.query(`DELETE FROM CondicionVentaDetalle  WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1 AND PeriodoDesdeAplica = @2`,
                [codobj, ClienteElementoDependienteId, PeriodoDesdeAplica])

            // delete CondicionVenta
            await queryRunner.query(`DELETE FROM CondicionVenta WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1 AND PeriodoDesdeAplica = @2`,
                [codobj, ClienteElementoDependienteId, PeriodoDesdeAplica])


            //throw new ClientException('test')
            await queryRunner.commitTransaction();
            return this.jsonRes({}, res, 'Rechazo exitoso');

        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async updateCondicionVenta(req: any, res: any, next: any) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.startTransaction()
            const condicionVenta = req.body.condicionVenta;
            const ClienteId = req.body.ClienteId;
            const clienteelementodependienteid = req.body.clienteelementodependienteid;
            const PeriodoDesdeAplica = new Date(req.body.PeriodoDesdeAplica);
            PeriodoDesdeAplica.setHours(0, 0, 0, 0)

            const usuario = res.locals.userName
            const ip = this.getRemoteAddress(req)

            if (!PeriodoDesdeAplica) {
                throw new ClientException("error al obtener el periodo desde aplica")
            }
            if (!ClienteId) {
                throw new ClientException("error al obtener el cliente")
            }
            if (!clienteelementodependienteid) {
                throw new ClientException("error al obtener el cliente elemento dependiente")
            }


            //actualiza CondicionVenta
            await this.updateCondicionVentaQuery(queryRunner, condicionVenta);

            //actualiza CondicionVentaDetalle
            await this.updateCondicionVentaDetalleQuery(queryRunner, condicionVenta.infoProductos, ClienteId, clienteelementodependienteid, PeriodoDesdeAplica, usuario, ip);
            //throw new ClientException('test ok')
            await queryRunner.commitTransaction();
            return this.jsonRes({}, res, 'Actualización exitosa');
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async updateCondicionVentaQuery(queryRunner: any, condicionVenta: any) {
        await queryRunner.query(`UPDATE CondicionVenta SET
            PeriodoFacturacion = @0,
            GeneracionFacturaDia = @1,
            GeneracionFacturaDiaComplemento = @2,
            Observaciones = @3
        WHERE ClienteId = @4 AND ClienteElementoDependienteId = @5 AND PeriodoDesdeAplica = @6`,
            [condicionVenta.PeriodoFacturacion, condicionVenta.GeneracionFacturaDia, condicionVenta.GeneracionFacturaDiaComplemento, condicionVenta.Observaciones, condicionVenta.ClienteId, condicionVenta.ClienteElementoDependienteId, condicionVenta.PeriodoDesdeAplica]);
    }


    async updateCondicionVentaDetalleQuery(queryRunner: any, infoProductos: any, ClienteId: number, ClienteElementoDependienteId: number, PeriodoDesdeAplica: Date, usuario: string, ip: string) {
        let FechaActual = new Date()
        const ProductoIds = infoProductos.map((row: { ProductoCodigo: any; }) => row.ProductoCodigo).filter((id) => id !== null && id !== undefined);

        if (ProductoIds.length > 0) {
            await queryRunner.query(`DELETE FROM CondicionVentaDetalle WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1 AND PeriodoDesdeAplica = @2`,
                [ClienteId, ClienteElementoDependienteId, PeriodoDesdeAplica])
        }

        for (const [idx, producto] of infoProductos.entries()) {
            if (producto.ProductoCodigo) {
                await queryRunner.query(
                    `
                    UPDATE CondicionVentaDetalle
                    SET 
                      ProductoCodigo = @3,
                      TextoFactura = @4,
                      Cantidad = @5,
                      IndCantidadHorasVenta = @6,
                      ImporteFijo = @7,
                      IndImporteListaPrecio = @8,
                      IndImporteAcuerdoConCliente = @9,
                      AudFechaIng = @10,
                      AudFechaMod = @11,
                      AudUsuarioIng = @12,
                      AudUsuarioMod = @13,
                      AudIpIng = @14,
                      AudIpMod = @15
                    WHERE 
                      ClienteId = @0 
                      AND ClienteElementoDependienteId = @1 
                      AND PeriodoDesdeAplica = @2
                    `,
                    [
                        ClienteId,
                        ClienteElementoDependienteId,
                        PeriodoDesdeAplica,
                        producto.ProductoCodigo,
                        producto.TextoFactura,
                        Number(producto.Cantidad),
                        producto.IndCantidadHorasVenta,
                        Number(producto.ImporteFijo),
                        producto.IndImporteListaPrecio,
                        producto.IndImporteAcuerdoConCliente,
                        FechaActual,
                        FechaActual,
                        usuario,
                        usuario,
                        ip,
                        ip
                    ]
                )

            } else {
                await queryRunner.query(`INSERT INTO CondicionVentaDetalle (
                    ClienteId, ClienteElementoDependienteId, PeriodoDesdeAplica, ProductoCodigo, TextoFactura, Cantidad, IndCantidadHorasVenta, ImporteFijo, IndImporteListaPrecio, IndImporteAcuerdoConCliente, AudFechaIng, AudFechaMod, AudUsuarioIng, AudUsuarioMod, AudIpIng, AudIpMod) 
                    VALUES ( @0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@11,@12,@13,@14,@15)`, [
                    ClienteId, ClienteElementoDependienteId, PeriodoDesdeAplica, producto.ProductoCodigo, producto.TextoFactura, producto.Cantidad, producto.IndCantidadHorasVenta, producto.ImporteFijo, producto.IndImporteListaPrecio, producto.IndImporteAcuerdoConCliente, FechaActual, FechaActual, usuario, usuario, ip, ip
                ])

            }
        }
    }
}
