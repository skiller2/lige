import { BaseController, ClientException } from "../controller/basecontroller.ts";
import { dataSource } from "../data-source.ts";
import type { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL, getOptionsSINO } from "../impuestos-afip/filtros-utils/filtros.ts";

import { Utils } from "../liquidaciones/liquidaciones.utils.ts";

const TipoCantidadOptions: any[] = [
    { label: 'Fija', value: 'F' },
    { label: 'Horas A', value: 'A' },
    { label: 'Horas B', value: 'B' },
    { label: 'Variable', value: 'V' }
]

const TipoImporteOptions: any[] = [
    { label: 'Fijo', value: 'F' },
    { label: 'Lista de Precio Cliente', value: 'LP' },
    { label: 'Variable', value: 'V' }
]

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
            sortable: true,
            hidden: false,
            searchHidden: true
        },
        {
            name: "Periodo Aplica Desde",
            type: "string",
            id: "FormatPeriodoDesdeAplica",
            field: "FormatPeriodoDesdeAplica",
            fieldName: "FormatPeriodoDesdeAplica",
            sortable: true,
            hidden: false,
            searchHidden: true,
            searchType: "date",
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
            name: "Contrato Desde",
            type: "date",
            id: "ClienteElementoDependienteContratoFechaDesde",
            field: "ClienteElementoDependienteContratoFechaDesde",
            fieldName: "ISNULL(con.ClienteElementoDependienteContratoFechaDesde,'9999-12-31')",
            searchComponent: "inputForFechaSearch",
            sortable: true,
            hidden: false,
            searchHidden: false
        },
        {
            name: "Contrato Hasta",
            type: "date",
            id: "ClienteElementoDependienteContratoFechaHasta",
            field: "ClienteElementoDependienteContratoFechaHasta",
            fieldName: "ISNULL(con.ClienteElementoDependienteContratoFechaHasta,'9999-12-31')",
            searchComponent: "inputForFechaSearch",
            sortable: true,
            hidden: false,
            searchHidden: false
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
        const periodoDate = new Date(req.body.periodo)
        const anio = periodoDate.getFullYear()
        const mes = periodoDate.getMonth() + 1

        try {

            const condicionesVenta = await queryRunner.query(
                `
                Select ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) id,
                cli.ClienteDenominacion,cli.ClienteId,CONCAT(ele.ClienteId,'/', ISNULL(ele.ClienteElementoDependienteId,0)) codobj,obj.ObjetivoId, 
                    CONCAT(ele.ClienteId,'/', ele.ClienteElementoDependienteId, ' ', TRIM(ele.ClienteElementoDependienteDescripcion)) as ClienteElementoDependienteDescripcion,
                    conven.PeriodoDesdeAplica, FORMAT(conven.PeriodoDesdeAplica,'yyyy/MM') FormatPeriodoDesdeAplica,conven.AutorizacionFecha,per.PersonalId,conven.AutorizacionEstado,
                    case when per.PersonalId is null then null
                        else CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre)) end as AutorizacionApellidoNombre,
                    conven.PeriodoFacturacion,conven.GeneracionFacturaDia,conven.GeneracionFacturaDiaComplemento,conven.Observaciones,

                    con.ClienteElementoDependienteContratoId, con.ClienteElementoDependienteContratoFechaDesde,con.ClienteElementoDependienteContratoFechaHasta,
                    suc.SucursalDescripcion,

                    conven.AudFechaIng, conven.AudUsuarioIng, conven.AudIpIng,
                    conven.AudFechaMod, conven.AudUsuarioMod, conven.AudIpMod

                from ClienteElementoDependiente ele
                --join ClienteElementoDependienteContrato con on con.ClienteId=ele.ClienteId and con.ClienteElementoDependienteId=ele.ClienteElementoDependienteId and con.ClienteElementoDependienteContratoFechaDesde<=EOMONTH(DATEFROMPARTS(@0,@1,1)) AND ISNULL(con.ClienteElementoDependienteContratoFechaHasta,'9999-12-31')>=DATEFROMPARTS(@0,@1,1)
				LEFT JOIN (
                            SELECT 
                                ec.ClienteId, 
                                ec.ClienteElementoDependienteId, 
                                ec.ClienteElementoDependienteContratoId, 
                                ec.ClienteElementoDependienteContratoFechaDesde, 
                                ec.ClienteElementoDependienteContratoFechaHasta,
                                ROW_NUMBER() OVER (PARTITION BY ec.ClienteId, ec.ClienteElementoDependienteId 
                                                    ORDER BY ec.ClienteElementoDependienteContratoFechaDesde DESC) AS RowNum
                            FROM ClienteElementoDependienteContrato ec
                            WHERE EOMONTH(DATEFROMPARTS(@0,@1,1)) >= ec.ClienteElementoDependienteContratoFechaDesde
                        ) con ON con.ClienteId = ele.ClienteId 
                            AND con.ClienteElementoDependienteId = ele.ClienteElementoDependienteId
                            AND con.RowNum = 1    

                LEFT JOIN CondicionVenta conven ON  ele.ClienteId=conven.ClienteId and ele.ClienteElementoDependienteId=conven.ClienteElementoDependienteId and conven.PeriodoDesdeAplica>=con.ClienteElementoDependienteContratoFechaDesde and conven.PeriodoDesdeAplica<=ISNULL(con.ClienteElementoDependienteContratoFechaHasta,'9999-12-31')
                    and conven.PeriodoDesdeAplica = (
                    SELECT max(PeriodoDesdeAplica) 
                        FROM CondicionVenta cv
                        WHERE cv.ClienteId = ele.ClienteId
                        AND cv.ClienteElementoDependienteId = ele.ClienteElementoDependienteId
                            and cv.PeriodoDesdeAplica <= DATEFROMPARTS(@0, @1, 1)
                    )
                Left join Cliente cli on cli.ClienteId=ele.ClienteId
                join Objetivo obj on obj.ClienteElementoDependienteId=ele.ClienteElementoDependienteId and obj.ClienteId=ele.ClienteId
                Left join Personal per on per.PersonalId=conven.AutorizacionPersonalId
                LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
                LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ele.ClienteElementoDependienteSucursalId ,cli.ClienteSucursalId)

                  WHERE
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
        } finally {
            await queryRunner.release()
        }

    }

    async addCondicionVenta(req: any, res: any, next: any) {

        const queryRunner = dataSource.createQueryRunner();
        const CondicionVenta = { ...req.body };

        try {

            //validaciones
            await this.FormValidations(CondicionVenta, queryRunner)
            //throw new ClientException('test')

            await queryRunner.startTransaction()
            const usuario = res.locals.userName
            const ip = this.getRemoteAddress(req)
            const objetivoInfo = await this.ObjetivoInfoFromId(CondicionVenta.ObjetivoId)

            const PeriodoDesdeAplica = new Date(CondicionVenta.PeriodoDesdeAplica);
            const anio = PeriodoDesdeAplica.getFullYear()
            const mes = PeriodoDesdeAplica.getMonth() + 1
            const periodo_id = await Utils.getPeriodoId(queryRunner, new Date(), anio, mes, usuario, ip)
            const getRecibosGenerados = await queryRunner.query(`SELECT ind_recibos_generados FROM lige.dbo.liqmaperiodo WHERE periodo_id = @0`, [periodo_id])

            if (getRecibosGenerados.length > 0 && getRecibosGenerados[0].ind_recibos_generados == 1) {
                throw new ClientException(`No se puede modificar una condición en un periodo con recibos generados.`)
            }
            PeriodoDesdeAplica.setHours(0, 0, 0, 0)
            let FechaActual = new Date()

            //validacion si existe

            const existeCondicionVenta =
                await queryRunner.query(`SELECT ClienteId, ClienteElementoDependienteId FROM CondicionVenta 
                    WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1 AND PeriodoDesdeAplica = @2`,
                    [objetivoInfo.clienteId, objetivoInfo.ClienteElementoDependienteId, PeriodoDesdeAplica]);

            if (existeCondicionVenta.length > 0) throw new ClientException(`Ya existe una condición de venta para el objetivo ${existeCondicionVenta[0].ClienteId}/${existeCondicionVenta[0].ClienteElementoDependienteId} en el periodo ${mes}/${anio}.`)


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
                [objetivoInfo.clienteId,
                objetivoInfo.ClienteElementoDependienteId,
                    PeriodoDesdeAplica,
                    null,
                    null,
                    null,
                CondicionVenta.PeriodoFacturacion,
                CondicionVenta.GeneracionFacturaDia,
                CondicionVenta.GeneracionFacturaDiaComplemento,
                CondicionVenta.Observaciones, FechaActual, usuario, ip, FechaActual, usuario, ip])

            for (const producto of CondicionVenta.infoProductos) {
                if (producto.ProductoCodigo) {
                    await queryRunner.query(
                        `INSERT INTO CondicionVentaDetalle (
                        ClienteId,
                        ClienteElementoDependienteId,
                        PeriodoDesdeAplica,
                        ProductoCodigo,
                        TextoFactura,
                        TipoCantidad,
                        Cantidad,
                        TipoImporte,
                        ImporteUnitario,
                        AudFechaIng,
                        AudFechaMod,
                        AudUsuarioIng,
                        AudUsuarioMod,
                        AudIpIng,
                        AudIpMod
                    ) VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14)`,
                        [
                            objetivoInfo.clienteId, // ClienteId
                            objetivoInfo.ClienteElementoDependienteId, // ClienteElementoDependienteId
                            PeriodoDesdeAplica, // PeriodoDesdeAplica
                            producto.ProductoCodigo, // ProductoCodigo
                            producto.TextoFactura, // TextoFactura
                            producto.TipoCantidad, // TipoCantidad
                            producto.Cantidad ? Number(producto.Cantidad) : null, // Cantidad
                            producto.TipoImporte, // TipoImporte
                            producto.ImporteUnitario ? Number(producto.ImporteUnitario) : null, // ImporteUnitario
                            FechaActual, // AudFechaIng
                            FechaActual, // AudFechaMod
                            usuario, // AudUsuarioIng
                            usuario, // AudUsuarioMod
                            ip, // AudIpIng
                            ip  // AudIpMod
                        ]
                    )
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

        const generacionDia = Number(CondicionVenta.GeneracionFacturaDia);
        if (!Number.isInteger(generacionDia) || generacionDia < 1 || generacionDia > 32) {
            throw new ClientException(`El Día de Generación Factura debe ser un número entero sin decimales entre 1 y 32.`)
        }

        if (CondicionVenta.GeneracionFacturaDiaComplemento != null && CondicionVenta.GeneracionFacturaDiaComplemento !== '') {
            const generacionDiaComplemento = Number(CondicionVenta.GeneracionFacturaDiaComplemento);
            if (!Number.isInteger(generacionDiaComplemento) || generacionDiaComplemento < 1 || generacionDiaComplemento > 32) {
                throw new ClientException(`El Día de Generación Factura (Complemento) debe ser un número entero sin decimales entre 1 y 32.`)
            }
        }

        for (const producto of CondicionVenta.infoProductos) {
            if (producto.ProductoCodigo) {

                if (!producto.TipoImporte) {
                    throw new ClientException(`Debe completar el campo Tipo Importe.`)
                }

                if (!producto.TipoCantidad) {
                    throw new ClientException(`Debe completar el campo Tipo Cantidad.`)
                }

                if (producto.TipoImporte === 'F' && !producto.ImporteUnitario) {
                    throw new ClientException(`Debe completar el campo Importe Unitario.`)
                }

                if (producto.TipoCantidad === 'F' && !producto.Cantidad) {
                    throw new ClientException(`Debe completar el campo Cantidad.`)
                }
            }
        }
    }

    async getTipoProductoSearchOptions(req: any, res: any, next: any) {
        const result = await dataSource.query(`
        SELECT ProductoCodigo,Nombre FROM Producto `)
        this.jsonRes(result, res);
    }

    async getTipoCantidadSearchOptions(req: any, res: any, next: any) {
        this.jsonRes(TipoCantidadOptions, res);
    }

    async getTipoImporteSearchOptions(req: any, res: any, next: any) {
        this.jsonRes(TipoImporteOptions, res);
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
            SELECT ProductoCodigo, TextoFactura, TipoCantidad, Cantidad, TipoImporte, ImporteUnitario
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
            // Modify the response to include a status field
            return this.jsonRes({ status: 'ok' }, res, 'Autorización exitosa');
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
            const ClienteId = Number(req.body.ClienteId);
            const clienteelementodependienteid = Number(req.body.clienteelementodependienteid);
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

            //validaciones
            await this.FormValidations(condicionVenta, queryRunner)

            const anio = PeriodoDesdeAplica.getFullYear()
            const mes = PeriodoDesdeAplica.getMonth() + 1
            const periodo_id = await Utils.getPeriodoId(queryRunner, new Date(), anio, mes, usuario, ip)
            const getRecibosGenerados = await queryRunner.query(`SELECT ind_recibos_generados FROM lige.dbo.liqmaperiodo WHERE periodo_id = @0`, [periodo_id])
            if (getRecibosGenerados.length > 0 && getRecibosGenerados[0].ind_recibos_generados == 1) {
                throw new ClientException(`No se puede modificar una condición en un periodo con recibos generados.`)
            }

            let FechaActual = new Date()

            //actualiza CondicionVenta
            await queryRunner.query(`UPDATE CondicionVenta SET
                PeriodoFacturacion = @0,
                GeneracionFacturaDia = @1,
                GeneracionFacturaDiaComplemento = @2,
                Observaciones = @3,
                AutorizacionFecha = @4,
                AutorizacionPersonalId = @5,
                AutorizacionEstado = @6,
                AudFechaMod = @7,
                AudUsuarioMod = @8,
                AudIpMod = @9
            WHERE ClienteId = @10 AND ClienteElementoDependienteId = @11 AND PeriodoDesdeAplica = @12`,
                [condicionVenta.PeriodoFacturacion, condicionVenta.GeneracionFacturaDia, condicionVenta.GeneracionFacturaDiaComplemento, condicionVenta.Observaciones, null, null, null, FechaActual, usuario, ip, ClienteId, clienteelementodependienteid, PeriodoDesdeAplica]);

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

    // Nuevos métodos para autorizar/rechazar múltiples condiciones de venta
    async autorizarCondicionVentaMultiple(req: any, res: any, next: any) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.startTransaction();
            const condiciones = req.body.condiciones;
            const usuario = res.locals.userName;
            const personalId = res.locals.PersonalId;
            const ip = this.getRemoteAddress(req);

            if (!condiciones || !Array.isArray(condiciones) || condiciones.length === 0) {
                throw new ClientException('Debe proporcionar al menos una condición de venta para autorizar.');
            }

            let autorizadas = 0;
            let yaAutorizadas = 0;
            const errores: string[] = [];

            for (const condicion of condiciones) {
                try {
                    const PeriodoDesdeAplica = new Date(condicion.PeriodoDesdeAplica);
                    PeriodoDesdeAplica.setHours(0, 0, 0, 0);

                    const result = await queryRunner.query(`
                        SELECT ClienteId, ClienteElementoDependienteId, PeriodoDesdeAplica, AutorizacionFecha, AutorizacionPersonalId, AutorizacionEstado
                        FROM CondicionVenta 
                        WHERE ClienteId = @0
                        AND ClienteElementoDependienteId = @1
                        AND PeriodoDesdeAplica = @2`, 
                        [condicion.ClienteId, condicion.ClienteElementoDependienteId, PeriodoDesdeAplica]
                    );

                    if (result.length > 0) {
                        if (result[0].AutorizacionFecha && result[0].AutorizacionPersonalId && result[0].AutorizacionEstado) {
                            yaAutorizadas++;
                        } else {
                            await this.updateAutorizacionCondicionVenta(
                                queryRunner, 
                                condicion.ClienteId, 
                                condicion.ClienteElementoDependienteId, 
                                PeriodoDesdeAplica, 
                                usuario, 
                                personalId, 
                                ip
                            );
                            autorizadas++;
                        }
                    } else {
                        errores.push(`No existe condición para cliente ${condicion.ClienteId}/${condicion.ClienteElementoDependienteId}`);
                    }
                } catch (error: any) {
                    errores.push(`Error en ${condicion.ClienteId}/${condicion.ClienteElementoDependienteId}: ${error.message}`);
                }
            }

            // Si no se autorizó ninguna, es un error - validar ANTES del commit
            if (autorizadas === 0) {
                let mensajeError = 'No se pudo autorizar ninguna condición de venta.';
                if (yaAutorizadas > 0) {
                    mensajeError = `Todas las condiciones seleccionadas (${yaAutorizadas}) ya estaban autorizadas.`;
                }
                if (errores.length > 0) {
                    if (yaAutorizadas > 0) {
                        mensajeError += ` Además, ${errores.length} condición(es) tuvieron errores: ${errores.join('; ')}`;
                    } else {
                        mensajeError = `No se pudo autorizar ninguna condición. ${errores.join('; ')}`;
                    }
                }
                throw new ClientException(mensajeError);
            }

            await queryRunner.commitTransaction();

            let mensaje = `Proceso completado. Autorizadas: ${autorizadas}`;
            if (yaAutorizadas > 0) {
                mensaje += `, Ya autorizadas: ${yaAutorizadas}`;
            }
            if (errores.length > 0) {
                mensaje += `. Errores: ${errores.length}`;
            }

            return this.jsonRes({ 
                status: 'ok', 
                autorizadas, 
                yaAutorizadas, 
                errores 
            }, res, mensaje);

        } catch (error) {
            await this.rollbackTransaction(queryRunner);
            return next(error);
        } finally {
            await queryRunner.release();
        }
    }

    async rechazarCondicionVentaMultiple(req: any, res: any, next: any) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.startTransaction();
            const condiciones = req.body.condiciones;

            if (!condiciones || !Array.isArray(condiciones) || condiciones.length === 0) {
                throw new ClientException('Debe proporcionar al menos una condición de venta para rechazar.');
            }

            let rechazadas = 0;
            const errores: string[] = [];

            for (const condicion of condiciones) {
                try {
                    const PeriodoDesdeAplica = new Date(condicion.PeriodoDesdeAplica);
                    PeriodoDesdeAplica.setHours(0, 0, 0, 0);

                    // Delete CondicionVentaDetalle
                    await queryRunner.query(
                        `DELETE FROM CondicionVentaDetalle WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1 AND PeriodoDesdeAplica = @2`,
                        [condicion.ClienteId, condicion.ClienteElementoDependienteId, PeriodoDesdeAplica]
                    );

                    // Delete CondicionVenta
                    const deleteResult = await queryRunner.query(
                        `DELETE FROM CondicionVenta WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1 AND PeriodoDesdeAplica = @2`,
                        [condicion.ClienteId, condicion.ClienteElementoDependienteId, PeriodoDesdeAplica]
                    );

                    rechazadas++;
                } catch (error: any) {
                    errores.push(`Error en ${condicion.ClienteId}/${condicion.ClienteElementoDependienteId}: ${error.message}`);
                }
            }

            // Si no se rechazó ninguna, es un error - validar ANTES del commit
            if (rechazadas === 0) {
                let mensajeError = 'No se pudo rechazar ninguna condición de venta.';
                if (errores.length > 0) {
                    mensajeError = `No se pudo rechazar ninguna condición. ${errores.join('; ')}`;
                } else {
                    mensajeError = 'No se encontraron condiciones de venta para rechazar.';
                }
                throw new ClientException(mensajeError);
            }

            await queryRunner.commitTransaction();

            let mensaje = `Proceso completado. Rechazadas: ${rechazadas}`;
            if (errores.length > 0) {
                mensaje += `. Errores: ${errores.length}`;
            }

            return this.jsonRes({ 
                status: 'ok', 
                rechazadas, 
                errores 
            }, res, mensaje);

        } catch (error) {
            await this.rollbackTransaction(queryRunner);
            return next(error);
        } finally {
            await queryRunner.release();
        }
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
                    `INSERT INTO CondicionVentaDetalle (
                    ClienteId,
                    ClienteElementoDependienteId,
                    PeriodoDesdeAplica,
                    ProductoCodigo,
                    TextoFactura,
                    TipoCantidad,
                    Cantidad,
                    TipoImporte,
                    ImporteUnitario,
                    AudFechaIng,
                    AudFechaMod,
                    AudUsuarioIng,
                    AudUsuarioMod,
                    AudIpIng,
                    AudIpMod
                ) VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14)`,
                    [
                        ClienteId, // ClienteId
                        ClienteElementoDependienteId, // ClienteElementoDependienteId
                        PeriodoDesdeAplica, // PeriodoDesdeAplica
                        producto.ProductoCodigo, // ProductoCodigo
                        producto.TextoFactura, // TextoFactura
                        producto.TipoCantidad, // TipoCantidad
                        producto.Cantidad ? Number(producto.Cantidad) : null, // Cantidad
                        producto.TipoImporte, // TipoImporte
                        producto.ImporteUnitario ? Number(producto.ImporteUnitario) : null, // ImporteUnitario
                        FechaActual, // AudFechaIng
                        FechaActual, // AudFechaMod
                        usuario, // AudUsuarioIng
                        usuario, // AudUsuarioMod
                        ip, // AudIpIng
                        ip  // AudIpMod
                    ]
                )
            }
        }
    }

    async getMensajeHoras(req: any, res: any, next: any) {
        const tipoHoras = req.params.tipoHoras;
        const mensaje = "ej del mes.."
        return this.jsonRes({ mensaje }, res, 'Mensaje de horas obtenido');
    }
}
