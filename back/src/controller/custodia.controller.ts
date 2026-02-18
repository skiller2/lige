import type { NextFunction, Response } from "express";
import { BaseController, ClientException } from "./basecontroller.ts";
import { dataSource } from "../data-source.ts";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros.ts";
import type { Options } from "../schemas/filtro.ts";
import type { QueryRunner } from "typeorm";
import { AsistenciaController } from "./asistencia.controller.ts";
import { AccesoBotController } from "../acceso-bot/acceso-bot.controller.ts";

const columnsObjCustodia: any[] = [
    {
        id: 'id', name: 'Codigo', field: 'id',
        fieldName: "obj.CustodiaCodigo",
        sortable: true,
        type: 'number',
        minWidth: 50,
        // minWidth: 10,
        searchType: "number",
    },
    {
        id: 'responsable', name: 'Responsable', field: 'responsable.fullName',
        fieldName: "obj.ResponsableId",
        sortable: true,
        type: 'string',
        formatter: 'complexObject',
        params: {
            complexFieldLabel: 'Responsable.fullName',
        },
        searchComponent: "inputForPersonalSearch",
        searchType: "number",
        // maxWidth: 170,
        minWidth: 100,
    },
    {
        id: 'cliente', name: 'Cliente', field: 'cliente.fullName',
        fieldName: "cli.ClienteId",
        sortable: true,
        type: 'string',
        formatter: 'complexObject',
        params: {
            complexFieldLabel: 'Cliente.fullName',
        },
        searchComponent: "inputForClientSearch",
        searchType: "number",
        // maxWidth: 170,
        minWidth: 100,
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
        id: 'DescripcionRequirente', name: 'Solicitado por', field: 'DescripcionRequirente',
        fieldName: "obj.DescripcionRequirente",
        sortable: true,
        type: 'string',
        // formatter: 'complexObject',
        // params: {
        //     complexFieldLabel: 'desc_requirente.fullName',
        // },
        searchComponent: "inputForRequirenteSearch",
        searchType: "string",
        // maxWidth: 150,
        minWidth: 110,
        hidden: true,
        searchHidden: false

    },
    {
        id: 'Descripcion', name: 'Descripcion', field: 'Descripcion',
        fieldName: "obj.Descripcion",
        sortable: true,
        type: 'text',
        // maxWidth: 300,
        minWidth: 230,
        hidden: true,
        searchHidden: false
    },

    {
        id: 'FechaInicio', name: 'Fecha Inicio', field: 'FechaInicio',
        fieldName: "obj.FechaInicio",
        type: 'date',
        // maxWidth: 150,
        minWidth: 90,
        searchComponent: "inputForFechaSearch",
        searchType: "date",
        sortable: true,
        searchHidden: false,
        hidden: false,
    },
    {
        id: 'HoraInicio', name: 'Hora Inicio', field: 'HoraInicio',
        type: 'string',
        searchType: "string",
        sortable: true,
        searchHidden: true,
        hidden: false,
        minWidth: 70,
    },
    {
        id: 'Origen', name: 'Origen', field: 'Origen',
        fieldName: "obj.Origen",
        sortable: true,
        type: 'string',
        // maxWidth: 180,
        minWidth: 140,
    },
    {
        id: 'Destino', name: 'Destino', field: 'Destino',
        fieldName: "obj.Destino",
        sortable: true,
        type: 'string',
        // maxWidth: 180,
        minWidth: 140,
    },
    {
        id: 'FechaFin', name: 'Fecha Fin', field: 'FechaFin',
        fieldName: "obj.FechaFin",
        type: 'date',
        searchComponent: "inputForFechaSearch",
        searchType: "date",
        sortable: true,
        searchHidden: false,
        //        hidden: true,
        minWidth: 90,
    },
    {
        id: 'HoraFin', name: 'Hora Fin', field: 'HoraFin',
        type: 'string',
        searchType: "string",
        sortable: true,
        searchHidden: true,
        hidden: false,
        minWidth: 70,
    },
    {
        id: 'DescripcionFacturacion', name: 'Desp/Oper/Ref', field: 'DescripcionFacturacion',
        fieldName: "obj.DescripcionFacturacion",
        sortable: true,
        type: 'string',
        // maxWidth: 180,
        minWidth: 50,
    },

    {
        id: 'CantidadModulos', name: 'Cant. módulos', field: 'CantidadModulos',
        fieldName: "obj.CantidadModulos",
        sortable: true,
        type: 'number',
        //maxWidth: 110,
        minWidth: 60,
        searchType: "number",
    },
    {
        id: 'ImporteModulo', name: 'Importe módulo', field: 'ImporteModulo',
        fieldName: "obj.ImporteModulo",
        sortable: true,
        type: 'currency',
        //maxWidth: 110,
        minWidth: 80,
        searchType: "float",
    },
    {
        id: 'CantidadHorasExcedente', name: 'Horas excedentes', field: 'CantidadHorasExcedente',
        fieldName: "obj.CantidadHorasExcedente",
        sortable: true,
        type: 'float',
        //maxWidth: 110,
        minWidth: 60,
        searchType: "float",
    },
    {
        id: 'ImporteHorasExcedente', name: 'Importe hora excedente', field: 'ImporteHorasExcedente',
        fieldName: "obj.ImporteHorasExcedente",
        sortable: true,
        type: 'currency',
        //maxWidth: 110,
        minWidth: 80,
        searchType: "number",
    },
    {
        id: 'CantidadKmExcedente', name: 'Km excedentes', field: 'CantidadKmExcedente',
        fieldName: "obj.CantidadKmExcedente",
        sortable: true,
        type: 'float',
        //maxWidth: 110,
        minWidth: 60,
        searchType: "float",
    },
    {
        id: 'ImporteKmExcedente', name: 'Importe km excedente', field: 'ImporteKmExcedente',
        fieldName: "obj.ImporteKmExcedente",
        sortable: true,
        type: 'currency',
        //maxWidth: 110,
        minWidth: 80,
        searchType: "float",
    },
    {
        id: 'ImportePeaje', name: 'Importe Peaje', field: 'ImportePeaje',
        fieldName: "obj.ImportePeaje",
        sortable: true,
        type: 'currency',
        //maxWidth: 110,
        minWidth: 80,
        searchType: "float",
    },
    {
        id: 'ImporteFactura', name: 'Importe a Facturar', field: 'ImporteFactura',
        fieldName: "obj.ImporteFactura",
        sortable: true,
        type: 'currency',
        //maxWidth: 110,
        minWidth: 110,
        searchType: "float",
    },
    {
        id: "diferencia", name: "Diferencia", field: "diferencia",
        type: "float",
        sortable: true,
        hidden: false,
        searchHidden: true,
        minWidth: 110,
    },
    {
        id: 'FechaLiquidacion', name: 'Fecha Liquidacion', field: 'FechaLiquidacion',
        fieldName: "obj.FechaLiquidacion",
        type: 'date',
        searchComponent: "inputForFechaSearch",
        searchType: "date",
        sortable: true,
        searchHidden: false,
        hidden: false,
        minWidth: 110,
    },
    {
        id: 'Estado', name: 'Estado', field: 'Estado.label',
        fieldName: "obj.EstadoCodigo",
        sortable: true,
        type: 'string',
        formatter: 'complexObject',
        params: {
            complexFieldLabel: 'Estado.label',
        },
        searchComponent: "inputForEstadoCustSearch",
        searchType: "number",
        //maxWidth: 110,
        minWidth: 70,
    },
    {
        id: "ApellidoNombre", name: "Apellido Nombre", field: "ApellidoNombre",
        type: "string",
        fieldName: "percus.PersonalId",
        searchComponent: "inputForPersonalSearch",
        searchType: "number",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
    {
        id: "Patente", name: "Patente", field: "Patente",
        type: "string",
        fieldName: "regveh.Patente",
        // searchComponent:"inputForPatenteSearch",
        searchType: "string",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
    {
        id: "NumeroFactura", name: "Num Factura", field: "Num NumeroFactura",
        type: "number",
        fieldName: "obj.NumeroFactura",
        searchType: "number",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
]

const columnsObjCustodiaHistory: any[] = [
    {
        id: 'id', name: 'id', field: 'id',
        // fieldName: "",
        type: 'string',
        searchType: "string",
        sortable: true,
        hidden: true,
        searchHidden: true
    },
    {
        id: 'usuario_ing', name: 'Usuario Ing', field: 'usuario_ing',
        fieldName: "obj.usuario_ing",
        type: 'string',
        searchType: "string",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        id: 'fecha_ing', name: 'Fecha Ing', field: 'fecha_ing',
        fieldName: "obj.fecha_ing",
        type: 'dateTime',
        searchType: "date",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        id: 'usuario_mod', name: 'Usuario Mod', field: 'usuario_mod',
        fieldName: "obj.usuario_mod",
        type: 'string',
        searchType: "string",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        id: 'fecha_mod', name: 'Fecha Mod', field: 'fecha_mod',
        fieldName: "obj.fecha_mod",
        type: 'dateTime',
        searchType: "date",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
]

const columnsPersonalCustodia: any[] = [
    {
        id: 'id', name: 'id', field: 'id',
        // fieldName: "",
        type: 'string',
        searchType: "string",
        sortable: true,
        hidden: true,
        searchHidden: true
    },
    {
        id: "ApellidoNombre",
        name: "Apellido Nombre",
        field: "ApellidoNombre",
        type: "string",
        fieldName: "per.PersonalId",
        searchComponent: "inputForPersonalSearch",
        searchType: "number",
        sortable: true,
        searchHidden: false,
        hidden: false,
    },
    {
        id: "ApellidoNombreResponsable",
        name: "Responsable",
        field: "ApellidoNombreResponsable",
        type: "string",
        fieldName: "perres.PersonalId",
        searchComponent: "inputForPersonalSearch",
        searchType: "number",
        sortable: true,
        searchHidden: false,
        hidden: false,
    },

    {
        id: 'CustodiaCodigo', name: 'Codigo', field: 'CustodiaCodigo',
        fieldName: "obj.CustodiaCodigo",
        type: 'number',
        searchType: "number",
        sortable: true,
        searchHidden: false,
        hidden: false,
    },
    {
        id: 'cliente', name: 'Cliente', field: 'Cliente.fullName',
        fieldName: "cli.ClienteId",
        type: 'string',
        formatter: 'complexObject',
        params: {
            complexFieldLabel: 'Cliente.fullName',
        },
        searchComponent: "inputForClientSearch",
        searchType: "number",
        sortable: true,
        searchHidden: false,
        hidden: false,
        minWidth: 100,
    },
    {
        id: 'FechaInicio', name: 'Fecha Inicio', field: 'FechaInicio',
        fieldName: "obj.FechaInicio",
        type: 'date',
        searchComponent: "inputForFechaSearch",
        searchType: "date",
        sortable: true,
        searchHidden: false,
        hidden: false,
        maxWidth: 120,
    },
    {
        id: 'FechaFin', name: 'Fecha Fin', field: 'FechaFin',
        fieldName: "obj.FechaFin",
        type: 'date',
        searchComponent: "inputForFechaSearch",
        searchType: "date",
        sortable: true,
        searchHidden: false,
        hidden: false,
        maxWidth: 120,
    },
    {
        id: 'FechaLiquidacion', name: 'Fecha Liquidacion', field: 'FechaLiquidacion',
        fieldName: "obj.FechaLiquidacion",
        type: 'date',
        searchComponent: "inputForFechaSearch",
        searchType: "date",
        sortable: true,
        searchHidden: false,
        hidden: false,
        maxWidth: 120,
    },
    {
        id: 'EstadoCodigo', name: 'Estado', field: 'EstadoCodigo',
        fieldName: "obj.EstadoCodigo",
        type: 'string',
        formatter: 'complexObject',
        params: {
            complexFieldLabel: 'Estado.label',
        },
        searchComponent: "inputForEstadoCustSearch",
        searchType: "number",
        sortable: true,
        searchHidden: false,
        hidden: false,
    },
    {
        id: 'categoria', name: 'Categoria', field: 'categoria',
        // fieldName: "obj.objetivo_custodia_id",
        type: 'string',
        searchType: "string",
        sortable: true,
        searchHidden: true,
        hidden: false,
    },
    {
        id: 'tipo_importe', name: 'Tipo de Importe', field: 'tipo_importe',
        // fieldName: "obj.objetivo_custodia_id",
        type: 'string',
        searchType: "string",
        sortable: true,
        searchHidden: true,
        hidden: false,
    },
    {
        id: 'Horas', name: 'Horas', field: 'Horas',
        // fieldName: "obj.impo_facturar",
        type: 'number',
        searchType: "float",
        sortable: true,
        searchHidden: true,
        hidden: false,
    },
    {
        id: 'ImporteSumaFija', name: 'Suma Fija', field: 'ImporteSumaFija',
        // fieldName: "obj.impo_facturar",
        type: 'currency',
        searchType: "float",
        sortable: true,
        searchHidden: true,
        hidden: false,
    },
    {
        id: 'Importe', name: 'Importe', field: 'Importe',
        // fieldName: "obj.impo_facturar",
        type: 'currency',
        searchType: "float",
        sortable: true,
        searchHidden: true,
        hidden: false,
    },
]

const estados: any[] = [
    { value: 0, label: 'Pendiente' },
    { value: 1, label: 'Finalizado' },
    { value: 2, label: 'Cancelado' },
    { value: 3, label: 'A facturar' },
    { value: 4, label: 'Facturado' },
    { value: 5, label: 'No facturable' }
]// value = tipo , label = descripcion

export class CustodiaController extends BaseController {
    /*
        static async listCustodiasPendientes(anio: number, mes: number) {
            const queryRunner = dataSource.createQueryRunner();
            return queryRunner.query(`SELECT c.fecha_inicio, c.responsable_id, p.PersonalId, CONCAT (TRIM(p.PersonalApellido),', ',TRIM(p.PersonalNombre)) ResponsableDetalle
                FROM lige.dbo.objetivocustodia c 
                JOIN Personal p ON p.PersonalId = c.responsable_id 
                WHERE c.fecha_liquidacion IS NULL AND c.estado = 0
            `, [anio, mes])
        }
    */
    static async listCustodiasPendientesLiqui(anio: number, mes: number, diascorrimiento: number = 3) {
        diascorrimiento = diascorrimiento * -1
        const queryRunner = dataSource.createQueryRunner();
        //OLD TABLE
        return queryRunner.query(`SELECT obj.objetivo_custodia_id, obj.responsable_id, obj.cliente_id, obj.fecha_inicio,
            obj.Origen, obj.fecha_fin, obj.Destino, obj.estado, TRIM(cli.ClienteDenominacion) ClienteDenominacion,
            CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) ResponsableDetalle, obj.impo_facturar,
            obj.fecha_liquidacion,1, DATEADD(DAY,@0,EOMONTH(DATEFROMPARTS(@1,@2,1))) fecha_limite
            FROM lige.dbo.objetivocustodia obj
            JOIN Personal per ON per.PersonalId = obj.responsable_id
            JOIN Cliente cli ON cli.ClienteId = obj.cliente_id
            
            WHERE obj.fecha_liquidacion IS NULL AND obj.estado <>2 
            AND obj.fecha_inicio <= DATEADD(DAY,@0,EOMONTH(DATEFROMPARTS(@1,@2,1))) AND obj.fecha_inicio >= DATEADD(DAY,@0,DATEFROMPARTS(@1,@2,1))
        `, [diascorrimiento, anio, mes])
        //New Table
        // return queryRunner.query(`SELECT obj.CustodiaCodigo, obj.ResponsableId, obj.ClienteId, obj.FechaInicio,
        //     obj.Origen, obj.FechaFin, obj.Destino, obj.EstadoCodigo, TRIM(cli.ClienteDenominacion) ClienteDenominacion,
        //     CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) ResponsableDetalle, obj.ImporteFactura,
        //     obj.FechaLiquidacion,1, DATEADD(DAY,@0,EOMONTH(DATEFROMPARTS(@1,@2,1))) fecha_limite
        //     FROM Custodia obj
        //     JOIN Personal per ON per.PersonalId = obj.ResponsableId
        //     JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
            
        //     WHERE obj.FechaLiquidacion IS NULL AND obj.EstadoCodigo <>2 
        //     AND obj.FechaInicio <= DATEADD(DAY,@0,EOMONTH(DATEFROMPARTS(@1,@2,1))) AND obj.FechaInicio >= DATEADD(DAY,@0,DATEFROMPARTS(@1,@2,1))
        // `, [diascorrimiento, anio, mes])
    }

    async addObjetivoCustodiaQuery(queryRunner: any, objetivoCustodia: any, usuario: any, ip: any) {
        const CustodiaCodigo = objetivoCustodia.id
        const ResponsableId = objetivoCustodia.ResponsableId
        const ClienteId = objetivoCustodia.ClienteId
        const DescripcionRequirente = objetivoCustodia.DescripcionRequirente ? objetivoCustodia.DescripcionRequirente : null
        const Descripcion = objetivoCustodia.Descripcion ? objetivoCustodia.Descripcion : null
        const FechaInicio = new Date(objetivoCustodia.FechaInicio)
        const Origen = objetivoCustodia.Origen
        const FechaFin = objetivoCustodia.FechaFin ? new Date(objetivoCustodia.FechaFin) : null
        const Destino = objetivoCustodia.Destino ? objetivoCustodia.Destino : null
        const CantidadModulos = objetivoCustodia.CantidadModulos ? objetivoCustodia.CantidadModulos : null
        const ImporteModulo = objetivoCustodia.ImporteModulo ? objetivoCustodia.ImporteModulo : null
        const CantidadHorasExcedente = objetivoCustodia.CantidadHorasExcedente ? objetivoCustodia.CantidadHorasExcedente : null
        const ImporteHorasExcedente = objetivoCustodia.ImporteHorasExcedente ? objetivoCustodia.ImporteHorasExcedente : null
        const CantidadKmExcedente = objetivoCustodia.CantidadKmExcedente ? objetivoCustodia.CantidadKmExcedente : null
        const ImporteKmExcedente = objetivoCustodia.ImporteKmExcedente ? objetivoCustodia.ImporteKmExcedente : null
        const ImportePeaje = objetivoCustodia.ImportePeaje ? objetivoCustodia.ImportePeaje : null
        const ImporteFactura = Number(CantidadModulos) * Number(ImporteModulo) + Number(CantidadHorasExcedente) * Number(ImporteHorasExcedente) + Number(CantidadKmExcedente) * Number(ImporteKmExcedente) + Number(ImportePeaje)
        const NumeroFactura = objetivoCustodia.NumeroFactura ? objetivoCustodia.NumeroFactura : null
        const DescripcionFacturacion = objetivoCustodia.DescripcionFacturacion ? objetivoCustodia.DescripcionFacturacion : null
        const EstadoCodigo = objetivoCustodia.EstadoCodigo ? objetivoCustodia.EstadoCodigo : 0
        const fechaActual = objetivoCustodia.fechaActual ? objetivoCustodia.fechaActual : new Date()
        const fechaLiquidacionLast = new Date(objetivoCustodia.anio, objetivoCustodia.mes, 0, 20, 59, 59, 999)
        const fechaLiquidacionNew = (fechaActual > fechaLiquidacionLast) ? fechaLiquidacionLast : fechaActual

        const periodo = await queryRunner.query(`
            SELECT TOP 1 *, CAST (EOMONTH(CONCAT(anio,'-',mes,'-',1)) AS DATETIME)+'23:59:59' AS FechaCierre FROM lige.dbo.liqmaperiodo WHERE ind_recibos_generados = 1 ORDER BY anio DESC, mes DESC
        `)

        if (new Date(periodo[0].FechaCierre) > fechaLiquidacionNew && this.valByEstado(EstadoCodigo))
            throw new ClientException(`No se puede cerrar la custodia en el período ${objetivoCustodia.mes}/${objetivoCustodia.anio}`)


        const FechaLiquidacion = (this.valByEstado(EstadoCodigo)) ? fechaLiquidacionNew : null

        //NEW TABLE
        return queryRunner.query(`
            INSERT Custodia(CustodiaCodigo, ResponsableId, ClienteId, DescripcionRequirente,
                Descripcion, FechaInicio, Origen, FechaFin, Destino, CantidadModulos, ImporteModulo, CantidadHorasExcedente,
                ImporteHorasExcedente, CantidadKmExcedente, ImporteKmExcedente, ImportePeaje, ImporteFactura, DescripcionFacturacion, NumeroFactura, EstadoCodigo,
                FechaLiquidacion, AudUsuarioIng, AudIpIng, AudFechaIng, AudUsuarioMod, AudIpMod, AudFechaMod)
            VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15, @16, @17, @18, @19, @20, @21, @22, @23, @21, @22, @23)`,
            [CustodiaCodigo, ResponsableId, ClienteId, DescripcionRequirente, Descripcion, FechaInicio, Origen,
                FechaFin, Destino, CantidadModulos, ImporteModulo, CantidadHorasExcedente, ImporteHorasExcedente,
                CantidadKmExcedente, ImporteKmExcedente, ImportePeaje, ImporteFactura, DescripcionFacturacion, NumeroFactura, EstadoCodigo,
                FechaLiquidacion, usuario, ip, fechaActual]
        )
    }

    async addRegistroPersonalCustodiaQuery(queryRunner: any, CustodiaCodigo: number, infoPersonal: any, usuario: any, ip: any) {
        const PersonalId = infoPersonal.PersonalId
        const Importe = infoPersonal.Importe ? infoPersonal.Importe : null
        const HorasTrabajadas = infoPersonal.HorasTrabajadas ? infoPersonal.HorasTrabajadas : null
        const ImporteSumaFija = infoPersonal.ImporteSumaFija ? infoPersonal.ImporteSumaFija : null
        const fechaActual = new Date()
        
        //NEW TABLE
        return await queryRunner.query(`
            INSERT PersonalCustodia(
                PersonalId, CustodiaCodigo, Importe, HorasTrabajadas, ImporteSumaFija,
                AudUsuarioIng, AudIpIng, AudFechaIng, AudUsuarioMod, AudIpMod, AudFechaMod
            ) VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @5, @6, @7)`,
            [PersonalId, CustodiaCodigo, Importe, HorasTrabajadas, ImporteSumaFija, usuario, ip, fechaActual]
        )
    }

    async addRegistroVehiculoCustodiaQuery(queryRunner: any, CustodiaCodigo: number, infoVehiculo: any, usuario: any, ip: any) {
        const Patente = String(infoVehiculo.Patente)
        const PersonalId = infoVehiculo.PersonalId
        const ImporteVehiculo = infoVehiculo.ImporteVehiculo ? infoVehiculo.ImporteVehiculo : null
        const PeajeVehiculo = infoVehiculo.PeajeVehiculo ? infoVehiculo.PeajeVehiculo : null
        const fechaActual = new Date()

        //NEW TABLE
        return await queryRunner.query(`
            INSERT VehiculoCustodia(
                Patente, CustodiaCodigo, PersonalId, ImporteVehiculo, PeajeVehiculo, 
                AudUsuarioIng, AudIpIng, AudFechaIng, AudUsuarioMod, AudIpMod, AudFechaMod
            ) VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @5, @6, @7)`,
            [Patente.toUpperCase(), CustodiaCodigo, PersonalId, Number(ImporteVehiculo), Number(PeajeVehiculo), usuario, ip, fechaActual]
        )
    }

    async listObjetivoCustodiaByResponsableQuery(queryRunner: any, filterSql: any, orderBy: any, periodo: Date, ResponsableId?: number) {
        let year = 0
        let month = 0
        let condition = ''
        if (periodo) {
            condition = `(obj.FechaLiquidacion IS NULL AND obj.EstadoCodigo IN (0)) OR (DATEPART(YEAR,obj.FechaLiquidacion)=@0 AND  DATEPART(MONTH, obj.FechaLiquidacion)=@1)`
            year = periodo.getFullYear()
            month = periodo.getMonth() + 1
        } else condition = `1=1`
        let search = ''

        if (ResponsableId === undefined) search = `1=1`
        else search = `obj.ResponsableId IN (${ResponsableId})`

        //NEW TABLE
        return await queryRunner.query(`
            SELECT DISTINCT 
                obj.CustodiaCodigo AS id, obj.ResponsableId, obj.ClienteId,
                obj.DescripcionRequirente,
                obj.Descripcion,
                obj.FechaInicio,
                FORMAT(obj.FechaInicio, 'HH:mm') AS HoraInicio,
                obj.Origen,
                obj.FechaFin,
                FORMAT(obj.FechaFin, 'HH:mm') AS HoraFin,
                obj.Destino,
                obj.EstadoCodigo,
                TRIM(cli.ClienteDenominacion) AS Cliente,
                CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre)) AS Responsable,
                obj.ImporteFactura,
                obj.DescripcionFacturacion,
                obj.FechaLiquidacion,
                obj.ImportePeaje,
                obj.ImporteKmExcedente,
                obj.CantidadKmExcedente,
                obj.ImporteHorasExcedente,
                obj.CantidadHorasExcedente,
                obj.ImporteModulo,
                obj.CantidadModulos,
                IIF(
                    obj.ImporteFactura > 0,
                    100 - (ISNULL(regveh.COSTO,0) + ISNULL(regper.COSTO,0)) * 100 / obj.ImporteFactura,
                    0
                ) AS diferencia
            FROM Custodia obj
            JOIN Personal per 
                ON per.PersonalId = obj.ResponsableId
            JOIN Cliente cli 
                ON cli.ClienteId = obj.ClienteId
            LEFT JOIN (
                SELECT 
                    regveh.CustodiaCodigo,
                    SUM(ISNULL(regveh.ImporteVehiculo,0) + ISNULL(regveh.PeajeVehiculo,0)) AS COSTO
                FROM VehiculoCustodia regveh
                GROUP BY regveh.CustodiaCodigo
            ) regveh 
                ON regveh.CustodiaCodigo = obj.CustodiaCodigo
            LEFT JOIN (
                SELECT 
                    regper.CustodiaCodigo,
                    SUM(ISNULL(regper.Importe,0)) AS COSTO
                FROM PersonalCustodia regper
                GROUP BY regper.CustodiaCodigo
            ) regper 
                ON regper.CustodiaCodigo = obj.CustodiaCodigo
            LEFT JOIN PersonalCustodia percus 
                ON percus.CustodiaCodigo = obj.CustodiaCodigo
            WHERE (${condition})
            AND (${search}) AND (${filterSql}) 
            ${orderBy}`, [year, month])
    }


    getPreviousMonthYear(year: number,month: number): { year: number,month: number } {
        if (month === 1) {
            return { year: year - 1, month: 12 };
        } else {
            return { year: year, month: month - 1  };
        }
    }


    async updateObjetivoCustodiaQuery(queryRunner: any, objetivoCustodia: any, usuario: any, ip: any) {
        const CustodiaCodigo = objetivoCustodia.CustodiaCodigo
        const ClienteId = objetivoCustodia.ClienteId
        const DescripcionRequirente = objetivoCustodia.DescripcionRequirente ? objetivoCustodia.DescripcionRequirente : null
        const Descripcion = objetivoCustodia.Descripcion ? objetivoCustodia.Descripcion : null
        const fecha_inicio = new Date(objetivoCustodia.FechaInicio)
        const Origen = objetivoCustodia.Origen
        const fecha_fin = objetivoCustodia.FechaFin ? new Date(objetivoCustodia.FechaFin) : null
        const Destino = objetivoCustodia.Destino
        const CantidadModulos = Number(objetivoCustodia.CantidadModulos) ? Number(objetivoCustodia.CantidadModulos) : null
        const ImporteModulo = Number(objetivoCustodia.ImporteModulo) ? Number(objetivoCustodia.ImporteModulo) : null
        const CantidadHorasExcedente = Number(objetivoCustodia.CantidadHorasExcedente) ? Number(objetivoCustodia.CantidadHorasExcedente) : null
        const ImporteHorasExcedente = Number(objetivoCustodia.ImporteHorasExcedente) ? Number(objetivoCustodia.ImporteHorasExcedente) : null
        const CantidadKmExcedente = Number(objetivoCustodia.CantidadKmExcedente) ? Number(objetivoCustodia.CantidadKmExcedente) : null
        const ImporteKmExcedente = Number(objetivoCustodia.ImporteKmExcedente) ? Number(objetivoCustodia.ImporteKmExcedente) : null
        const ImportePeaje = Number(objetivoCustodia.ImportePeaje) ? Number(objetivoCustodia.ImportePeaje) : null
        const ImporteFactura = Number(CantidadModulos) * Number(ImporteModulo) + Number(CantidadHorasExcedente) * Number(ImporteHorasExcedente) + Number(CantidadKmExcedente) * Number(ImporteKmExcedente) + Number(ImportePeaje)
        const NumeroFactura = objetivoCustodia.NumeroFactura ? objetivoCustodia.NumeroFactura : null
        const DescripcionFacturacion = objetivoCustodia.DescripcionFacturacion ? objetivoCustodia.DescripcionFacturacion : null
        const estado = objetivoCustodia.estado ? objetivoCustodia.estado : 0
        const fechaActual = objetivoCustodia.fechaActual ? objetivoCustodia.fechaActual : new Date()
        const fechaLiquidacionLast = new Date(objetivoCustodia.anio, objetivoCustodia.mes, 0, 20, 59, 59, 999)
        const fechaLiquidacionNew = (fechaActual > fechaLiquidacionLast) ? fechaLiquidacionLast : fechaActual
        let FechaLiquidacion = (!objetivoCustodia.FechaLiquidacion && (estado == 1 || estado == 3 || estado == 4 || estado == 5)) ? fechaLiquidacionNew : objetivoCustodia.FechaLiquidacion

        if (estado != 1 && estado != 3 && estado != 4 && estado != 5)
            FechaLiquidacion = null

        const periodo = await queryRunner.query(`
            SELECT TOP 1 *, CAST (EOMONTH(CONCAT(anio,'-',mes,'-',1)) AS DATETIME)+'23:59:59' AS FechaCierre FROM lige.dbo.liqmaperiodo WHERE ind_recibos_generados = 1 ORDER BY anio DESC, mes DESC
        `)

        if (new Date(periodo[0].FechaCierre) > fechaLiquidacionNew && (estado == 1 || estado == 3 || estado == 4 || estado == 5) && objetivoCustodia.FechaLiquidacion == null)
            throw new ClientException(`No se puede cerrar la custodia en el período ${objetivoCustodia.mes}/${objetivoCustodia.anio}`)

        //NEW TABLE
        return queryRunner.query(`
            UPDATE Custodia
            SET 
                ClienteId = @1,
                DescripcionRequirente = @2,
                Descripcion = @3,
                FechaInicio = @4,
                Origen = @5,
                FechaFin = @6,
                Destino = @7,
                CantidadModulos = @8,
                ImporteModulo = @9,
                CantidadHorasExcedente = @10,
                ImporteHorasExcedente = @11,
                CantidadKmExcedente = @12,
                ImporteKmExcedente = @13,
                ImportePeaje = @14,
                ImporteFactura = @15,
                DescripcionFacturacion = @16,
                NumeroFactura = @17,
                EstadoCodigo = @18,
                FechaLiquidacion = @19,
                AudUsuarioMod = @20,
                AudIpMod = @21,
                AudFechaMod = @22
            WHERE CustodiaCodigo = @0`,
            [CustodiaCodigo, ClienteId, DescripcionRequirente, Descripcion, fecha_inicio, Origen, fecha_fin, Destino,
            CantidadModulos, ImporteModulo, CantidadHorasExcedente, ImporteHorasExcedente, CantidadKmExcedente, ImporteKmExcedente,
            ImportePeaje, ImporteFactura, DescripcionFacturacion, NumeroFactura, estado, FechaLiquidacion, usuario, ip, fechaActual]
        )
    }

    async updateRegistroPersonalCustodiaQuery(queryRunner: any, infoPersonal: any, usuario: any, ip: any) {
        const PersonalId = infoPersonal.PersonalId
        const CustodiaCodigo = infoPersonal.CustodiaCodigo
        const Importe = infoPersonal.importe ? infoPersonal.Importe : null
        const HorasTrabajadas = infoPersonal.HorasTrabajadas ? infoPersonal.HorasTrabajadas : null
        const ImporteSumaFija = infoPersonal.ImporteSumaFija ? infoPersonal.ImporteSumaFija : null
        const fechaActual = new Date()

        //NEW TABLE
        return await queryRunner.query(`
            UPDATE PersonalCustodia
            SET 
                PersonalId = @1,
                Importe = @2,
                HorasTrabajadas = @6,
                ImporteSumaFija = @7,
                AudUsuarioMod = @3,
                AudIpMod = @4,
                AudFechaMod = @5
            WHERE CustodiaCodigo = @0`,
            [CustodiaCodigo, PersonalId, Importe, usuario, ip, fechaActual, HorasTrabajadas, ImporteSumaFija]
        )
    }

    async updateRegistroVehiculoCustodiaQuery(queryRunner: any, infoVehiculo: any, usuario: any, ip: any) {
        const CustodiaCodigo = infoVehiculo.CustodiaCodigo
        const Patente = infoVehiculo.Patente
        const PersonalId = infoVehiculo.PersonalId
        const ImporteVehiculo = infoVehiculo.ImporteVehiculo ? infoVehiculo.ImporteVehiculo : null
        const PeajeVehiculo = infoVehiculo.PeajeVehiculo ? infoVehiculo.PeajeVehiculo : null
        const fechaActual = new Date()
        
        //NEW TABLE
        return await queryRunner.query(`
            UPDATE VehiculoCustodia
            SET 
                Patente = @1,
                PersonalId = @2,
                ImporteVehiculo = @3,
                PeajeVehiculo = @4,
                AudUsuarioMod = @5,
                AudIpMod = @6,
                AudFechaMod = @7
            WHERE CustodiaCodigo = @0`,
            [CustodiaCodigo, Patente, PersonalId, ImporteVehiculo, PeajeVehiculo, usuario, ip, fechaActual]
        )
        
    }

    async getObjetivoCustodiaQuery(queryRunner: any, CustodiaCodigo: any) {
        //NEW TABLE
        return await queryRunner.query(`
        SELECT 
            obj.CustodiaCodigo ,
            obj.ResponsableId ,
            CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre)) AS Responsable,
            obj.ClienteId ,
            obj.DescripcionRequirente ,
            obj.Descripcion,
            obj.FechaInicio ,
            obj.Origen,
            obj.FechaFin ,
            obj.Destino,
            obj.CantidadModulos ,
            obj.ImporteModulo ,
            obj.CantidadHorasExcedente ,
            obj.ImporteHorasExcedente ,
            obj.CantidadKmExcedente ,
            obj.DescripcionFacturacion ,
            obj.ImporteKmExcedente ,
            obj.ImportePeaje ,
            obj.ImporteFactura ,
            obj.EstadoCodigo ,
            obj.NumeroFactura ,
            obj.FechaLiquidacion,
            obj.AudUsuarioIng ,
            obj.AudFechaIng ,
            obj.AudUsuarioMod ,
            obj.AudFechaMod 
        FROM Custodia obj
        INNER JOIN Cliente cli 
            ON cli.ClienteId = obj.ClienteId
        INNER JOIN Personal per 
            ON per.PersonalId = obj.ResponsableId
        WHERE obj.CustodiaCodigo = @0`,
            [CustodiaCodigo])
    }

    async getRegPersonalObjCustodiaQuery(queryRunner: any, CustodiaCodigo: any) {
        //NEW TABLE
        return await queryRunner.query(`
        SELECT 
            reg.PersonalId ,
            reg.Importe ,
            reg.ImporteSumaFija ,
            reg.HorasTrabajadas 
        FROM PersonalCustodia reg
        INNER JOIN Personal per 
            ON per.PersonalId = reg.PersonalId
        WHERE reg.CustodiaCodigo = @0`,
                    [CustodiaCodigo])
    }

    async getRegVehiculoObjCustodiaQuery(queryRunner: any, CustodiaCodigo: any) {
        //NEW TABLE
        return await queryRunner.query(`
        SELECT 
            reg.Patente,
            reg.ImporteVehiculo ,
            reg.PeajeVehiculo ,
            reg.PersonalId
        FROM VehiculoCustodia reg
        INNER JOIN Personal per 
            ON per.PersonalId = reg.PersonalId
        WHERE reg.CustodiaCodigo = @0`,
            [CustodiaCodigo])
    }

    async deleteRegPersonalObjCustodiaQuery(queryRunner: any, custodiaId: any, personalId: any) {
        //NEW TABLE
        return await queryRunner.query(`
        DELETE PersonalCustodia 
        WHERE CustodiaCodigo = @0
        AND PersonalId = @1`,
            [custodiaId, personalId])
    }

    async deleteRegVehiculoObjCustodiaQuery(queryRunner: any, custodiaId: any, patente: any) {
        //NEW TABLE
        return await queryRunner.query(`
        DELETE FROM VehiculoCustodia
        WHERE CustodiaCodigo = @0 AND Patente = @1`,
        [custodiaId, patente])

    }

    async validPersona(PersonalId: number, fechaDesde: Date, queryRunner: QueryRunner, usuario: string, ip: string) {
        let errores: string[] = []
        fechaDesde.setHours(0, 0, 0, 0)
        const sitrev = await queryRunner.query(`SELECT per.PersonalId, CONCAT(TRIM(per.PersonalApellido),' ',TRIM(per.PersonalNombre)) ApellidoNombre, ps.PersonalSituacionRevistaSituacionId, ps.PersonalSituacionRevistaDesde, ps.PersonalSituacionRevistaHasta, sit.SituacionRevistaDescripcion
            FROM Personal per
            LEFT JOIN PersonalSituacionRevista ps  ON ps.PersonalId = per.PersonalId AND ps.PersonalSituacionRevistaDesde <= @1  AND @1 <= ISNULL(ps.PersonalSituacionRevistaHasta,'9999-12-31')
            LEFT JOIN SituacionRevista sit ON sit.SituacionRevistaId = ps.PersonalSituacionRevistaSituacionId
            WHERE per.PersonalId =@0`,
            [PersonalId, fechaDesde])
        if (sitrev.length == 0) {
            errores.push(`No se encontró la persona con PersonalId: ${PersonalId}`)
        } else {
            if (![2, 12, 11, 20].includes(sitrev[0].PersonalSituacionRevistaSituacionId))
                errores.push(`${sitrev[0].ApellidoNombre} (${PersonalId}) se encuentra en situación de revista ${(sitrev[0].SituacionRevistaDescripcion) ? sitrev[0].SituacionRevistaDescripcion : 'no registrada'} al ${this.dateOutputFormat(fechaDesde)}`)
        }

        const anio = fechaDesde.getFullYear()
        const mes = fechaDesde.getMonth() + 1
        const asistenciaController = new AsistenciaController()
        const categorias = await asistenciaController.getCategoriasPorPersonaQuery(anio, mes, PersonalId, 1, queryRunner);

        const categoria = categorias.filter((cat: any) => cat.TipoAsociadoId == 2 && new Date(cat.PersonalCategoriaDesde) <= fechaDesde && (cat.PersonalCategoriaHasta == null || new Date(cat.PersonalCategoriaHasta) >= fechaDesde)) //CUSTODIA
        if (categoria.length == 0)
            errores.push(`${sitrev[0].ApellidoNombre} (${PersonalId}) no tiene categoría de custodia vigente al ${this.dateOutputFormat(fechaDesde)}`)

        if (categoria.length > 1)  
            errores.push(`${sitrev[0].ApellidoNombre} (${PersonalId}) posee mas de una categoría vigente al ${this.dateOutputFormat(fechaDesde)}`)

        if (categoria.length ==1 && !(Number(categoria[0].ValorLiquidacionHoraNormal)>0))
            errores.push(`${sitrev[0].ApellidoNombre} (${PersonalId}) no tiene cargado importe en la categoria ${categoria[0].CategoriaPersonalDescripcion} vigente al ${this.dateOutputFormat(fechaDesde)}`)

        const perUltRecibo = await queryRunner.query(`SELECT TOP 1 *, EOMONTH(DATEFROMPARTS(anio, mes, 1)) AS FechaCierre FROM lige.dbo.liqmaperiodo WHERE ind_recibos_generados = 1 ORDER BY anio DESC, mes DESC `)
        const perAntUltimo = this.getPreviousMonthYear(perUltRecibo[0].anio, perUltRecibo[0].mes)
        const bot = await AccesoBotController.getBotStatus(perAntUltimo.year, perAntUltimo.month, queryRunner, [PersonalId])

        if (bot[0].visto != 1 && bot[0].doc_id > 0) {

            if (bot[0].registrado == 0) {
                errores.push(`${sitrev[0].ApellidoNombre} no se encuentra registro en el Bot`)
            } else {

                errores.push(`${sitrev[0].ApellidoNombre} el recibo del mes ${perUltRecibo[0].mes}/${perUltRecibo[0].anio} no ha sido visto por la persona`)

                // const sendit = await AccesoBotController.enqueBotMsg(PersonalId, `Recuerde descargar el recibo ${perUltRecibo[0].mes}/${perUltRecibo[0].anio}, se encuentra disponible`, `RECIBO${bot[0].doc_id}`, usuario, ip)
                // if (sendit) errores.push(`${sitrev[0].ApellidoNombre} Se envió notificación recordando que descargue el recibo`)
            }

        }

        return errores
    };


    async addObjetivoCustodia(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        let errores = []

        try {
            await queryRunner.startTransaction()
            if (!req.body.ClienteId || !req.body.FechaInicio || !req.body.Origen)
                throw new ClientException(`Los campos de Cliente, Fecha Inicial y Origen NO pueden estar vacios.`)

            const usuario = res.locals.userName
            const ip = this.getRemoteAddress(req)
            // const ResponsableId = 699
            const ResponsableId = res.locals.PersonalId

            const responsableQuery = await queryRunner.query(`
                SELECT per.PersonalId, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre
                FROM Personal per WHERE per.PersonalId = @0
            `, [ResponsableId])

            if (responsableQuery.length != 1)
                throw new ClientException(`No se a encontrado al personal responsable.`)


            const responsable = responsableQuery[0].ApellidoNombre


            const valCustodiaForm = this.valCustodiaForm(req.body, queryRunner)
            if (valCustodiaForm instanceof ClientException)
                throw valCustodiaForm

            // const newCustodiaCodigo = await BaseController.getProxNumero(queryRunner, `objetivocustodia`, usuario, ip)
            const newCustodiaCodigo = await BaseController.getProxNumero(queryRunner, `Custodia`, usuario, ip)

            const FechaLiquidacion = (this.valByEstado(req.body.EstadoCodigo)) ? new Date() : null

            const fechaActual = new Date()
            const objetivoCustodia = { ...req.body, ResponsableId, id: newCustodiaCodigo, fechaActual }


            const periodo = await queryRunner.query(`
                SELECT TOP 1 *, CAST (EOMONTH(CONCAT(anio,'-',mes,'-',1)) AS DATETIME)+'23:59:59' AS FechaCierre
                FROM lige.dbo.liqmaperiodo WHERE ind_recibos_generados = 1 ORDER BY anio DESC, mes DESC
            `)

            if (new Date(objetivoCustodia.FechaInicio) <= new Date(periodo[0].FechaCierre))
                errores.push(`La Fecha inicio de la custodia no puede estar comprendida en un período ya cerrado`)

            if (new Date(objetivoCustodia.FechaInicio).getFullYear() != objetivoCustodia.anio || new Date(objetivoCustodia.FechaInicio).getMonth() + 1 != objetivoCustodia.mes)
                errores.push(`La Fecha inicio debe pertenecer al período seleccionado ${objetivoCustodia.mes}/${objetivoCustodia.anio}`)



            await this.addObjetivoCustodiaQuery(queryRunner, objetivoCustodia, usuario, ip)

            var seen = {};
            var hasDupPersonal = objetivoCustodia.personal.some(function (currentObject) {
                if (!currentObject.PersonalId) return false
                return seen.hasOwnProperty(currentObject.PersonalId)
                    || (seen[currentObject.PersonalId] = false);
            });
            if (hasDupPersonal)
                errores.push(`Hay personal duplicado`)

            //NEW TABLE
            await queryRunner.query(`DELETE FROM PersonalCustodia WHERE CustodiaCodigo = @0`, [newCustodiaCodigo])

            let errorCantPersonal: boolean = true
            for (const obj of objetivoCustodia.personal) {
                if (obj.PersonalId) {
                    errorCantPersonal = false
                    //Validaciones para FechaLiquidacion
                    if (FechaLiquidacion && !obj.Importe) {
                        errores.push(`El campo Importe de Personal NO puede estar vacío.`)
                        break
                    }

                    if (FechaLiquidacion && !obj.HorasTrabajadas) {
                        errores.push(`El campo Horas de Personal NO puede estar vacío.`)
                        break
                    }


                    // if(this.valByEstado(objetivoCustodia.EstadoCodigo) && !obj.Importe)
                    //     errores.push(`El campo Importe de Personal NO pueden estar vacios.`)
                    // console.log('Validando Persona:', obj.PersonalId, new Date(objetivoCustodia.FechaInicio))
                    const erroresPersona = await this.validPersona(obj.PersonalId, new Date(objetivoCustodia.FechaInicio), queryRunner, usuario, ip);
                    // console.log('Errores Persona:', erroresPersona)
                    errores = [...errores, ...erroresPersona]

                    await this.addRegistroPersonalCustodiaQuery(queryRunner, newCustodiaCodigo, obj, usuario, ip)
                }
            }

            var hasDupVehiculos = objetivoCustodia.vehiculos.some(function (currentObject) {
                if (!currentObject.Patente) return false
                return seen.hasOwnProperty(currentObject.Patente)
                    || (seen[currentObject.Patente] = false);
            });
            if (hasDupVehiculos)
                errores.push(`Hay vehículos duplicados`)

            //NEW  TABLE
            await queryRunner.query(`DELETE VehiculoCustodia WHERE CustodiaCodigo = @0`, [newCustodiaCodigo])

            let errorCantVehiculo: boolean = true
            for (const obj of objetivoCustodia.vehiculos) {
                if (obj.Patente) {
                    if (obj.Patente.length < 6) {
                        errores.push(`La patente no puede tener menos de 6 caracteres.`)
                        continue
                    }
                    errorCantVehiculo = false
                    if (FechaLiquidacion && (!obj.ImporteVehiculo || !obj.PersonalId)) {
                        errores.push(`Los campos relacionados al vehículo ${obj.Patente} NO pueden estar vacíos.`)
                        continue
                    }
                    if (!obj.PersonalId) {
                        errores.push(`Debe completar el campo Dueño del vehículo ${obj.Patente}`)
                        continue
                    }

                    await this.addRegistroVehiculoCustodiaQuery(queryRunner, newCustodiaCodigo, obj, usuario, ip)
                }
            }

            if (errorCantVehiculo)
                errores.push(`Debe haber al menos un vehículo por custodia.`)

            if (errorCantPersonal)
                errores.push(`Debe de haber al menos una persona por custodia.`)

            if (errores.length)
                throw new ClientException(errores.join(`\n`))

            await queryRunner.commitTransaction()
            return this.jsonRes({ custodiaId: newCustodiaCodigo, responsable, AudUsuarioIng: usuario, AudFechaIng: fechaActual }, res, 'Carga Exitosa');
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async listObjetivoCustodiaByResponsable(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.startTransaction()
            // const ResponsableId = 699
            const ResponsableId = res.locals.PersonalId
            const periodo: Date = req.body.periodo ? new Date(req.body.periodo) : null
            const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null };

            const filterSql = filtrosToSql(options.filtros, columnsObjCustodia);
            const orderBy = orderToSQL(options.sort)

            let result: any
            if (await this.hasGroup(req, 'Liquidaciones') || await this.hasGroup(req, 'Liquidaciones Consultas')|| await this.hasGroup(req, 'Administrativo')) {
                result = await this.listObjetivoCustodiaByResponsableQuery(queryRunner, filterSql, orderBy, periodo)
            } else {
                result = await this.listObjetivoCustodiaByResponsableQuery(queryRunner, filterSql, orderBy, periodo, ResponsableId)
            }

            let list = result.map((obj: any) => {
                return {
                    ... obj,
                    Responsable: { id: obj.ResponsableId, fullName: obj.Responsable },
                    Cliente: { id: obj.ClienteId, fullName: obj.Cliente },
                    FechaFin: obj.FechaFin ? obj.FechaFin : null,
                    HoraFin: obj.HoraFin ? obj.HoraFin : '',
                    Estado: estados[obj.EstadoCodigo],
                }
            })

            await queryRunner.commitTransaction()
            return this.jsonRes(list, res)
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async infoObjCustodia(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.startTransaction()
            const CustodiaCodigo = req.params.id
            let infoCustodia = await this.getObjetivoCustodiaQuery(queryRunner, CustodiaCodigo)
            let listPersonal = await this.getRegPersonalObjCustodiaQuery(queryRunner, CustodiaCodigo)
            let listVehiculo = await this.getRegVehiculoObjCustodiaQuery(queryRunner, CustodiaCodigo)

            infoCustodia = infoCustodia[0]
            // delete infoCustodia.id
            delete infoCustodia.ResponsableId
            // delete infoCustodia.estado

            infoCustodia.personal = listPersonal
            infoCustodia.vehiculos = listVehiculo

            await queryRunner.commitTransaction()
            return this.jsonRes(infoCustodia, res)
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async updateObjetivoCustodia(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        let errores = []

        try {
            await queryRunner.startTransaction()
            const usuario = res.locals.userName
            const ip = this.getRemoteAddress(req)
            // const ResponsableId = 699
            const ResponsableId = res.locals.PersonalId
            const CustodiaCodigo = req.params.id
            const objetivoCustodia = { ...req.body }

            let infoCustodia = await this.getObjetivoCustodiaQuery(queryRunner, CustodiaCodigo)
            infoCustodia = infoCustodia[0]

            if (objetivoCustodia.estado == 0) {
                infoCustodia.FechaLiquidacion = null
            }

            delete infoCustodia.CustodiaCodigo
            delete infoCustodia.Responsable

            if (!(await this.hasGroup(req, 'Liquidaciones') || await this.hasGroup(req, 'Administrativo')) && ResponsableId != infoCustodia.ResponsableId) {
                throw new ClientException(`Únicamente puede modificar el registro ${infoCustodia.Responsable} o pertenecer al grupo 'Administracion'/'Liquidaciones'.`)
            }

            if (infoCustodia.EstadoCodigo == 4) {
                throw new ClientException(`No se puede modificar los registros con estado Facturado.`)
            }

            const valCustodiaForm = this.valCustodiaForm(objetivoCustodia, queryRunner)
            if (valCustodiaForm instanceof ClientException)
                throw valCustodiaForm
            if (infoCustodia.FechaLiquidacion) {
                var listPersonal = await this.getRegPersonalObjCustodiaQuery(queryRunner, CustodiaCodigo)
                var listVehiculo = await this.getRegVehiculoObjCustodiaQuery(queryRunner, CustodiaCodigo)
            }

            var seen = {};
            var hasDupPersonal = objetivoCustodia.personal.some(function (currentObject) {
                if (!currentObject.PersonalId) return false
                return seen.hasOwnProperty(currentObject.PersonalId)
                    || (seen[currentObject.PersonalId] = false);
            });
            if (hasDupPersonal)
                errores.push(`Hay personal duplicado`)

            //NEW TABLE
            await queryRunner.query(`DELETE FROM PersonalCustodia WHERE CustodiaCodigo = @0`, [CustodiaCodigo])
            let errorCantPersonal: boolean = true
            for (const obj of objetivoCustodia.personal) {
                console.log('--------------------');
                console.log('obj: ', obj);
                if (obj.PersonalId) {
                    errorCantPersonal = false
                    //Validaciones para FechaLiquidacion
                    if ((this.valByEstado(objetivoCustodia.EstadoCodigo) && !infoCustodia.FechaLiquidacion) && !obj.Importe) {
                        errores.push(`El campo Importe de Personal NO puede esta vacío.`)
                        break
                    }
                    if (infoCustodia.FechaLiquidacion && !this.comparePersonal(obj, listPersonal)) {
                        errores.push(`NO se pueden modificar los campos del Personal.`)
                        break
                    }

                    if ((this.valByEstado(objetivoCustodia.EstadoCodigo) && !infoCustodia.FechaLiquidacion) && !obj.HorasTrabajadas) {
                        errores.push(`El campo Horas de Personal NO puede estar vacío.`)
                        break
                    }

                    //
                    // if(this.valByEstado(objetivoCustodia.EstadoCodigo) && !obj.Importe)
                    //     errores.push(`El campo Importe de Personal NO pueden estar vacios.`)


                    const erroresPersona = await this.validPersona(obj.PersonalId, new Date(objetivoCustodia.FechaInicio), queryRunner, usuario, ip);
                    errores = [...errores, ...erroresPersona]

                    await this.addRegistroPersonalCustodiaQuery(queryRunner, CustodiaCodigo, obj, usuario, ip)
                }
            }

            var hasDupVehiculos = objetivoCustodia.vehiculos.some(function (currentObject) {
                if (!currentObject.Patente) return false
                return seen.hasOwnProperty(currentObject.Patente)
                    || (seen[currentObject.Patente] = false);
            });
            if (hasDupVehiculos)
                errores.push(`Hay vehículos duplicados`)
            //NEW  TABLE
            await queryRunner.query(`DELETE VehiculoCustodia WHERE CustodiaCodigo = @0`, [CustodiaCodigo])
            let errorCantVehiculo: boolean = true
            for (const obj of objetivoCustodia.vehiculos) {
                if (obj.Patente) {
                    errorCantVehiculo = false
                    if (obj.Patente.length < 6) {
                        errores.push(`La patente no puede tener menos de 6 caracteres.`)
                        continue
                    }
                    //Validaciones para FechaLiquidacion
                    if (((this.valByEstado(objetivoCustodia.EstadoCodigo) && !infoCustodia.FechaLiquidacion)) && (!obj.ImporteVehiculo || !obj.PersonalId)) {
                        errores.push(`Los campos relacionados a la Patente ${obj.Patente} NO pueden estar vacio.`)
                        continue
                    }
                    if (infoCustodia.FechaLiquidacion && !this.compareVehiculo(obj, listVehiculo)) {
                        errores.push(`NO se pueden modificar los campos de la Patente ${obj.Patente}.`)
                        continue
                    }
                    //
                    // if(this.valByEstado(objetivoCustodia.EstadoCodigo) && !obj.ImporteVehiculo)
                    //     errores.push(`El campo Importe de la Patente ${obj.Patente} NO pueden estar vacio.`)
                    if (!obj.PersonalId)
                        errores.push(`El campo Dueño de la Patente ${obj.Patente} NO pueden estar vacio.`)

                    await this.addRegistroVehiculoCustodiaQuery(queryRunner, CustodiaCodigo, obj, usuario, ip)
                }
            }

            if (errorCantVehiculo)
                errores.push(`Debe de haber por lo menos un vehículo (Patente y Dueño) por custodia.`)

            if (errorCantPersonal)
                errores.push(`Debe de haber por lo menos una persona por custodia.`)
            // console.log('errores.length', errores)
            if (errores.length)
                throw new ClientException(errores)

            objetivoCustodia.FechaLiquidacion = infoCustodia.FechaLiquidacion
            objetivoCustodia.CustodiaCodigo = CustodiaCodigo
            objetivoCustodia.fechaActual = new Date()
            await this.updateObjetivoCustodiaQuery(queryRunner, objetivoCustodia, usuario, ip)

            await queryRunner.commitTransaction()
            return this.jsonRes({ AudUsuarioMod: usuario, AudFechaMod: objetivoCustodia.fechaActual }, res, 'Carga Exitosa');
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async getGridCustodiaColumns(req: any, res: Response, next: NextFunction) {
        return this.jsonRes(columnsObjCustodia, res)
    }

    async getGridPersonalColumns(req: any, res: Response, next: NextFunction) {
        return this.jsonRes(columnsPersonalCustodia, res)
    }

    async getGridCustodiaHistoryColumns(req: any, res: Response, next: NextFunction) {
        return this.jsonRes(columnsObjCustodiaHistory, res)
    }

    async getEstados(req: any, res: Response, next: NextFunction) {
        return this.jsonRes(estados, res)
    }

    valCustodiaForm(custodiaForm: any, queryRunner: any) {
        let errores: any[] = []
        if (!Number.isInteger(custodiaForm.EstadoCodigo)) {
            errores.push(`El campo Estado NO pueden estar vacio`)
        }
        if (!custodiaForm.ClienteId || !custodiaForm.FechaInicio || !custodiaForm.Origen) {
            errores.push(`Los campos de Cliente, Fecha Inicial y Origen NO pueden estar vacios.`)
        }
        if ((!custodiaForm.CantidadModulos && custodiaForm.ImporteModulo) || (custodiaForm.CantidadModulos && !custodiaForm.ImporteModulo)) {
            errores.push(`Los campos pares Cant. e Importe de Modulos deben de llenarse al mismo tiempo.`)
        }
        if ((!custodiaForm.CantidadHorasExcedente && custodiaForm.ImporteHorasExcedente) || (custodiaForm.CantidadHorasExcedente && !custodiaForm.ImporteHorasExcedente)) {
            errores.push(`Los campos pares Cant. e Importe de Horas Excedentes deben de llenarse al mismo tiempo.`)
        }
        if ((!custodiaForm.CantidadKmExcedente && custodiaForm.ImporteKmExcedente) || (custodiaForm.CantidadKmExcedente && !custodiaForm.ImporteKmExcedente)) {
            errores.push(`Los campos pares Cant. e Importe de Km Excedentes deben de llenarse al mismo tiempo.`)
        }
        //En caso de FINALIZAR custodia verificar los campos
        /*
                switch (custodiaForm.estado) {
                    case 0:
                    break;
                    case 0:
                    break;
                    case 0:
                    break;
                    case 0:
                    break;
                }
        */
        if (this.valByEstado(custodiaForm.EstadoCodigo)) {
            if ((!custodiaForm.ImporteFactura && custodiaForm.EstadoCodigo!= 5) || !custodiaForm.FechaFin || !custodiaForm.Destino) {
                errores.push(`Los campos de Destino, Fecha Final y Importe a Facturar NO pueden estar vacios.`)
            }
            if (custodiaForm.EstadoCodigo == 4 && !custodiaForm.NumeroFactura) {
                errores.push(`El campo Num de Factura NO puede estar vacio.`)
            }
        }

        if (custodiaForm.FechaFin && custodiaForm.FechaFin <= custodiaForm.FechaInicio) {
            errores.push(`La Fecha Final no puede ser menor o igual a la Fecha Inicial.`)
        }

        if (errores.length) {
            return new ClientException(errores)
        }
    }

    async searhPatente(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.startTransaction()
            const patente = req.body.Patente
            //NEW TABLE
            const list = await queryRunner.query(`
                SELECT reg.Patente, reg.PersonalId
                FROM VehiculoCustodia reg
                WHERE reg.Patente LIKE '%${patente}%'`)
            await queryRunner.commitTransaction()
            return this.jsonRes(list, res);
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async getPersonalByPatente(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.startTransaction()
            const patente = req.body.patente

            //NEW TABLE
            const list = await queryRunner.query(`
                SELECT TOP 1 reg.Patente, reg.PersonalId
                FROM VehiculoCustodia reg
                WHERE reg.Patente = @0
                ORDER BY AudFechaIng DESC`,
                [patente])

            await queryRunner.commitTransaction()
            return this.jsonRes(list, res);
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async getRequirenteByCliente(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.startTransaction()
            const ClienteId = req.body.ClienteId

            //NEW TABLE
            const list = await queryRunner.query(`
                SELECT DISTINCT obj.DescripcionRequirente
                FROM Custodia obj
                WHERE obj.ClienteId = @0`,
                [ClienteId])

            await queryRunner.commitTransaction()
            return this.jsonRes(list, res);
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async searchRequirente(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.startTransaction()
            const { value } = req.body;
            
            //NEW TABLE
            const list = await queryRunner.query(`
                SELECT DISTINCT obj.DescripcionRequirente fullName
                FROM Custodia obj
                WHERE obj.DescripcionRequirente LIKE '%${value}%'`)

            await queryRunner.commitTransaction()
            return this.jsonRes(list, res);
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async setEstados(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            const usuario = res.locals.userName
            const ip = this.getRemoteAddress(req)
            // const ResponsableId = 699
            const ResponsableId = res.locals.PersonalId
            await queryRunner.startTransaction()
            const forms: any[] = req.body
            let errores: any[] = []
            for (const form of forms) {
                const ids: number[] = form.custodiasIds
                const EstadoCodigo: number = form.EstadoCodigo
                const NumeroFactura: number = form.NumeroFactura

                const authEditAdmin: boolean = await this.hasGroup(req, 'Liquidaciones') || await this.hasGroup(req, 'Administrativo')
                const adminEdit: boolean = await this.hasGroup(req, 'administrativo')

                if (EstadoCodigo == 4 && !adminEdit)
                    throw new ClientException(`Requiere ser miembro del grupo Administrativo`)

                if (EstadoCodigo == 4 && !NumeroFactura) {
                    throw new ClientException(`El Número de Factura es invalido.`)
                }

                for (const id of ids) {
                    let infoCustodia = await this.getObjetivoCustodiaQuery(queryRunner, id)
                    infoCustodia = infoCustodia[0]

                    if (!authEditAdmin && infoCustodia.ResponsableId != ResponsableId) {
                        errores.push(`Codigo ${id}: Solo el responsable puede modificar la custodia o grupos Administrativo/Liquidaciones.`)
                        continue
                    }

                    if (!authEditAdmin && EstadoCodigo == 4) {
                        errores.push(`Codigo ${id}: Solo los grupos Administrativo/Liquidaciones, pueden grabar estado Facturado`)
                        continue
                    }
                    //Validaciones
                    if (infoCustodia.EstadoCodigo == 4 && EstadoCodigo != infoCustodia.EstadoCodigo) {
                        errores.push(`Codigo ${id}: No se puede modificar el estado.`)
                        continue
                    }

                    let msgError: string = ''
                    if (this.valByEstado(EstadoCodigo)) {
                        let listPersonal = await this.getRegPersonalObjCustodiaQuery(queryRunner, id)
                        let listVehiculo = await this.getRegVehiculoObjCustodiaQuery(queryRunner, id)
                        for (const personal of listPersonal) {
                            if (!personal.Importe) {
                                msgError += `Revisar el Importe del personal. `
                                break
                            }
                        }
                        for (const vehiculo of listVehiculo) {
                            if (!vehiculo.ImporteVehiculo) {
                                msgError += (`Revisar el Importe del vehiculo.`)
                                break
                            }
                        }
                    }
                    if (msgError.length) {
                        errores.push(`Codigo ${id}:` + msgError)
                        continue
                    }

                    infoCustodia.EstadoCodigo = EstadoCodigo
                    if (EstadoCodigo == 4)
                        infoCustodia.NumeroFactura = NumeroFactura
                    const valCustodiaForm = this.valCustodiaForm(infoCustodia, queryRunner)
                    if (valCustodiaForm instanceof ClientException) {
                        errores.push(`Codigo ${id}: ${valCustodiaForm.messageArr}`)
                        continue
                    }

                    await this.updateObjetivoCustodiaQuery(queryRunner, infoCustodia, usuario, ip)
                }

            }

            if (errores.length) {
                throw new ClientException(errores)
            }

            await queryRunner.commitTransaction()
            return this.jsonRes({}, res, 'Carga Exitosa');
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    static async listPersonalCustodiaQuery(options: any, queryRunner: QueryRunner, anio: number, mes: number, ResponsableId?: number) {
        const filterSql = filtrosToSql(options.filtros, columnsPersonalCustodia);
        const orderBy = orderToSQL(options.sort)

        let search = ''
        if (ResponsableId == 0) {
            search = `1=1`
        } else {
            search = `obj.ResponsableId IN (${ResponsableId})`
        }

        //NEW TABLE
        return queryRunner.query(`
            SELECT 
                per.PersonalId,
                CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre)) AS ApellidoNombre,
                CONCAT(TRIM(perres.PersonalApellido), ', ', TRIM(perres.PersonalNombre)) AS ApellidoNombreResponsable,
                obj.CustodiaCodigo,
                obj.ClienteId,
                TRIM(cli.ClienteDenominacion) AS Cliente,
                obj.FechaInicio,
                obj.FechaFin,
                obj.EstadoCodigo,
                obj.FechaLiquidacion,
                regp.ImporteSumaFija,
                regp.Importe,
                regp.HorasTrabajadas AS Horas, 
                'Personal' AS tipo_importe, 
                catdes.CategoriaPersonalDescripcion AS categoria,
                '' AS patente
            FROM dbo.Personal AS per
            INNER JOIN PersonalCustodia regp 
                ON per.PersonalId = regp.PersonalId
            INNER JOIN Custodia obj 
                ON regp.CustodiaCodigo = obj.CustodiaCodigo
            INNER JOIN Cliente cli 
                ON cli.ClienteId = obj.ClienteId
            INNER JOIN Personal perres 
                ON perres.PersonalId = obj.ResponsableId
            LEFT JOIN PersonalCategoria cat 
                ON cat.PersonalCategoriaPersonalId = per.PersonalId
                AND cat.PersonalCategoriaTipoAsociadoId = 2
                AND cat.PersonalCategoriaDesde <= obj.FechaInicio
                AND ISNULL(cat.PersonalCategoriaHasta,'9999-12-31') >= obj.FechaInicio
            LEFT JOIN CategoriaPersonal catdes 
                ON catdes.TipoAsociadoId = cat.PersonalCategoriaTipoAsociadoId
                AND catdes.CategoriaPersonalId = cat.PersonalCategoriaCategoriaPersonalId
            WHERE DATEPART(YEAR,obj.FechaLiquidacion) = @0
            AND DATEPART(MONTH,obj.FechaLiquidacion) = @1
            AND (${search}) 
            AND (${filterSql}) 
            ${orderBy}

            UNION ALL

            SELECT 
                per.PersonalId,
                CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre)) AS ApellidoNombre,
                CONCAT(TRIM(perres.PersonalApellido), ', ', TRIM(perres.PersonalNombre)) AS ApellidoNombreResponsable,
                obj.CustodiaCodigo ,
                obj.ClienteId ,
                TRIM(cli.ClienteDenominacion) AS Cliente,
                obj.FechaInicio ,
                obj.FechaFin ,
                obj.EstadoCodigo ,
                obj.FechaLiquidacion ,
                0 AS ImporteSumaFija,
                (ISNULL(regv.ImporteVehiculo,0) + ISNULL(regv.PeajeVehiculo,0)) AS Importe,
                0 AS Horas,
                'Vehiculo' AS tipo_importe,
                catdes.CategoriaPersonalDescripcion AS categoria,
                regv.Patente
            FROM dbo.Personal AS per
            INNER JOIN VehiculoCustodia regv 
                ON per.PersonalId = regv.PersonalId
            INNER JOIN Custodia obj 
                ON regv.CustodiaCodigo = obj.CustodiaCodigo
            INNER JOIN Cliente cli 
                ON cli.ClienteId = obj.ClienteId
            INNER JOIN Personal perres 
                ON perres.PersonalId = obj.ResponsableId
            LEFT JOIN PersonalCategoria cat 
                ON cat.PersonalCategoriaPersonalId = per.PersonalId
                AND cat.PersonalCategoriaTipoAsociadoId = 2
                AND cat.PersonalCategoriaDesde <= obj.FechaInicio
                AND ISNULL(cat.PersonalCategoriaHasta,'9999-12-31') >= obj.FechaInicio
            LEFT JOIN CategoriaPersonal catdes 
                ON catdes.TipoAsociadoId = cat.PersonalCategoriaTipoAsociadoId
                AND catdes.CategoriaPersonalId = cat.PersonalCategoriaCategoriaPersonalId
            WHERE DATEPART(YEAR,obj.FechaLiquidacion) = @0
            AND DATEPART(MONTH,obj.FechaLiquidacion) = @1
            AND (${search}) 
            AND (${filterSql}) 
            ${orderBy}

            UNION ALL

            SELECT 
                per.PersonalId,
                CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre)) AS ApellidoNombre,
                CONCAT(TRIM(perres.PersonalApellido), ', ', TRIM(perres.PersonalNombre)) AS ApellidoNombreResponsable,
                obj.CustodiaCodigo ,
                obj.ClienteId ,
                TRIM(cli.ClienteDenominacion) AS Cliente,
                obj.FechaInicio ,
                obj.FechaFin ,
                obj.EstadoCodigo ,
                obj.FechaLiquidacion ,
                0 AS ImporteSumaFija,
                ROUND(CONVERT(FLOAT,obj.ImporteFactura * (IIF(obj.ClienteId=798,1,3.5)) / 100), 2) AS Importe,
                0 AS Horas,
                'Jefe Área' AS tipo_importe,
                catdes.CategoriaPersonalDescripcion AS categoria,
                '' AS patente
            FROM Custodia obj
            INNER JOIN Personal AS per 
                ON per.PersonalId = obj.ResponsableId
            INNER JOIN Cliente cli 
                ON cli.ClienteId = obj.ClienteId
            INNER JOIN Personal perres 
                ON perres.PersonalId = obj.ResponsableId
            LEFT JOIN PersonalCategoria cat 
                ON cat.PersonalCategoriaPersonalId = per.PersonalId
                AND cat.PersonalCategoriaTipoAsociadoId = 2
                AND cat.PersonalCategoriaDesde <= obj.FechaInicio
                AND ISNULL(cat.PersonalCategoriaHasta,'9999-12-31') >= obj.FechaInicio
            LEFT JOIN CategoriaPersonal catdes 
                ON catdes.TipoAsociadoId = cat.PersonalCategoriaTipoAsociadoId
                AND catdes.CategoriaPersonalId = cat.PersonalCategoriaCategoriaPersonalId
            WHERE DATEPART(YEAR,obj.FechaLiquidacion) = @0
            AND DATEPART(MONTH,obj.FechaLiquidacion) = @1
            AND (${search}) AND (${filterSql}) 
            ${orderBy}            
            `, [anio, mes]
        )
    }

    async listPersonalCustodia(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            const responsableId = res.locals.PersonalId
            const periodo: Date = new Date(req.body.periodo)
            const anio = periodo.getFullYear()
            const mes = periodo.getMonth() + 1
            const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null };

            let result: any
            if (await this.hasGroup(req, 'Liquidaciones') || await this.hasGroup(req, 'Liquidaciones Consultas') || await this.hasGroup(req, 'Administrativo')) {
                result = await CustodiaController.listPersonalCustodiaQuery(options, queryRunner, anio, mes, 0)
            } else {
                result = await CustodiaController.listPersonalCustodiaQuery(options, queryRunner, anio, mes, responsableId)
            }

            let list = result.map((obj: any, index: number) => {
                obj.id = index + 1
                obj.Estado = estados[obj.EstadoCodigo]
                obj.Cliente = { id: obj.ClienteId, fullName: obj.Cliente }
                delete obj.ClienteId
                return obj
            })

            return this.jsonRes(list, res)
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    //Devuelve TRUE si el estado es 
    //[{ value: 1, label: 'Finalizado' },{ value: 3, label: 'A facturar' },{ value: 4, label: 'Facturado' },]
    valByEstado(estado: any): boolean {
        switch (typeof estado) {
            case 'string':
                if (estado == 'Finalizado' || estado == 'A facturar' || estado == 'Facturado')
                    return true
                else
                    return false
            case 'number':
                if (estado == 1 || estado == 3 || estado == 4 || estado == 5)
                    return true
                else
                    return false
            default:
                return false
        }
    }

    comparePersonal(per: any, list: any[]): boolean {
        // console.log('valida',per,list)

        const result: any = list.find((obj: any) => (obj.PersonalId == per.PersonalId && obj.HorasTrabajadas == per.HorasTrabajadas && per.ImporteSumaFija == per.ImporteSumaFija))
        return result ? true : false
    }

    compareVehiculo(veh: any, list: any[]): boolean {
        let result: any = list.find((obj: any) => (obj.Patente == veh.Patente && obj.ImporteVehiculo == veh.ImporteVehiculo && obj.PersonalId == veh.PersonalId && obj.PeajeVehiculo == veh.PeajeVehiculo))
        return result ? true : false
    }

}
