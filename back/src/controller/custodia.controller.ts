import { NextFunction, Response } from "express";
import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";
import { QueryRunner } from "typeorm";

const columnsObjCustodia: any[] = [
    {
        id: 'id', name: 'Codigo', field: 'id',
        fieldName: "obj.objetivo_custodia_id",
        sortable: true,
        type: 'number',
        minWidth: 50,
        // minWidth: 10,
        searchType: "number",
    },
    {
        id: 'responsable', name: 'Responsable', field: 'responsable.fullName',
        fieldName: "obj.responsable_id",
        sortable: true,
        type: 'string',
        formatter: 'complexObject',
        params: {
            complexFieldLabel: 'responsable.fullName',
        },
        searchComponent: "inpurForPersonalSearch",
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
            complexFieldLabel: 'cliente.fullName',
        },
        searchComponent: "inpurForClientSearch",
        searchType: "number",
        // maxWidth: 170,
        minWidth: 100,
    },
    {
        id: 'requirente', name: 'Solicitado por', field: 'requirente',
        fieldName: "obj.desc_requirente",
        sortable: true,
        type: 'string',
        // formatter: 'complexObject',
        // params: {
        //     complexFieldLabel: 'desc_requirente.fullName',
        // },
        searchComponent: "inpurForRequirenteSearch",
        searchType: "string",
        // maxWidth: 150,
        minWidth: 110,
        hidden: true,
        searchHidden: false

    },
    {
        id: 'descripcion', name: 'Descripcion', field: 'descripcion',
        fieldName: "obj.descripcion",
        sortable: true,
        type: 'text',
        // maxWidth: 300,
        minWidth: 230,
        hidden: true,
        searchHidden: false
    },

    {
        id: 'fechaI', name: 'Fecha Inicio', field: 'fechaI',
        fieldName: "obj.fecha_inicio",
        type: 'date',
        // maxWidth: 150,
        minWidth: 90,
        searchComponent: "inpurForFechaSearch",
        searchType: "date",
        sortable: true,
        searchHidden: false,
        hidden: false,
    },
    {
        id: 'origen', name: 'Origen', field: 'origen',
        fieldName: "obj.origen",
        sortable: true,
        type: 'string',
        // maxWidth: 180,
        minWidth: 140,
    },
    {
        id: 'destino', name: 'Destino', field: 'destino',
        fieldName: "obj.destino",
        sortable: true,
        type: 'string',
        // maxWidth: 180,
        minWidth: 140,
    },
    {
        id: 'desc_facturacion', name: 'Desp/Oper/Ref', field: 'desc_facturacion',
        fieldName: "obj.desc_facturacion",
        sortable: true,
        type: 'string',
        // maxWidth: 180,
        minWidth: 50,
    },

    {
        id: 'cant_modulos', name: 'Cant. módulos',
        field: 'cant_modulos',
        fieldName: "obj.cant_modulos",
        sortable: true,
        type: 'number',
        //maxWidth: 110,
        minWidth: 60,
        searchType: "number",
    },
    {
        id: 'importe_modulos', name: 'Importe módulo',
        field: 'importe_modulos',
        fieldName: "obj.importe_modulos",
        sortable: true,
        type: 'currency',
        //maxWidth: 110,
        minWidth: 80,
        searchType: "float",
    },
    {
        id: 'cant_horas_exced', name: 'Horas excedentes', field: 'cant_horas_exced',
        fieldName: "obj.cant_horas_exced",
        sortable: true,
        type: 'float',
        //maxWidth: 110,
        minWidth: 60,
        searchType: "float",
    },
    {
        id: 'impo_horas_exced', name: 'Importe hora excedente', field: 'impo_horas_exced',
        fieldName: "obj.impo_horas_exced",
        sortable: true,
        type: 'currency',
        //maxWidth: 110,
        minWidth: 80,
        searchType: "number",
    },
    {
        id: 'cant_km_exced', name: 'Km excentes', field: 'cant_km_exced',
        fieldName: "obj.cant_km_exced",
        sortable: true,
        type: 'float',
        //maxWidth: 110,
        minWidth: 60,
        searchType: "float",
    },
    {
        id: 'impo_km_exced', name: 'Importe km excedente', field: 'impo_km_exced',
        fieldName: "obj.impo_km_exced",
        sortable: true,
        type: 'currency',
        //maxWidth: 110,
        minWidth: 80,
        searchType: "float",
    },
    {
        id: 'impo_peaje', name: 'Importe Peaje', field: 'impo_peaje',
        fieldName: "obj.impo_peaje",
        sortable: true,
        type: 'currency',
        //maxWidth: 110,
        minWidth: 80,
        searchType: "float",
    },
    {
        id: 'facturacion', name: 'Importe a Facturar', field: 'facturacion',
        fieldName: "obj.impo_facturar",
        sortable: true,
        type: 'currency',
        //maxWidth: 110,
        minWidth: 110,
        searchType: "float",
    },
    {
        id: 'fecha_liquidacion', name: 'Fecha Liquidacion', field: 'fecha_liquidacion',
        fieldName: "obj.fecha_liquidacion",
        type: 'date',
        searchComponent: "inpurForFechaSearch",
        searchType: "date",
        sortable: true,
        searchHidden: false,
        hidden: false,
        minWidth: 110,
    },
    {
        id: 'estado', name: 'Estado', field: 'estado.label',
        fieldName: "obj.estado",
        sortable: true,
        type: 'string',
        formatter: 'complexObject',
        params: {
            complexFieldLabel: 'estado.label',
        },
        searchComponent: "inpurForEstadoCustSearch",
        searchType: "number",
        //maxWidth: 110,
        minWidth: 70,
    },
    {
        name: "Apellido Nombre",
        type: "string",
        id: "ApellidoNombre",
        field: "ApellidoNombre",
        fieldName: "regper.personal_id",
        searchComponent: "inpurForPersonalSearch",
        searchType: "number",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
    {
        name: "Patente",
        type: "string",
        id: "Patente",
        field: "Patente",
        fieldName: "regveh.patente",
        // searchComponent:"inpurForPatenteSearch",
        searchType: "string",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
    {
        name: "Num Factura",
        type: "number",
        id: "NumFactura",
        field: "Num Factura",
        fieldName: "obj.num_factura",
        searchType: "number",
        sortable: true,
        hidden: true,
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
        searchComponent: "inpurForPersonalSearch",
        searchType: "number",
        sortable: true,
        searchHidden: false,
        hidden: false,
    },
    {
        id: 'objetivo_custodia_id', name: 'Codigo', field: 'objetivo_custodia_id',
        fieldName: "obj.objetivo_custodia_id",
        type: 'number',
        searchType: "number",
        sortable: true,
        searchHidden: false,
        hidden: false,
    },
    {
        id: 'cliente', name: 'Cliente', field: 'cliente.fullName',
        fieldName: "cli.ClienteId",
        type: 'string',
        formatter: 'complexObject',
        params: {
            complexFieldLabel: 'cliente.fullName',
        },
        searchComponent: "inpurForClientSearch",
        searchType: "number",
        sortable: true,
        searchHidden: false,
        hidden: false,
        minWidth: 100,
    },
    {
        id: 'fecha_inicio', name: 'Fecha Inicio', field: 'fecha_inicio',
        fieldName: "obj.fecha_inicio",
        type: 'date',
        searchComponent: "inpurForFechaSearch",
        searchType: "date",
        sortable: true,
        searchHidden: false,
        hidden: false,
        maxWidth: 120,
    },
    {
        id: 'fecha_fin', name: 'Fecha Fin', field: 'fecha_fin',
        fieldName: "obj.fecha_fin",
        type: 'date',
        searchComponent: "inpurForFechaSearch",
        searchType: "date",
        sortable: true,
        searchHidden: false,
        hidden: false,
        maxWidth: 120,
    },
    {
        id: 'fecha_liquidacion', name: 'Fecha Liquidacion', field: 'fecha_liquidacion',
        fieldName: "obj.fecha_liquidacion",
        type: 'date',
        searchComponent: "inpurForFechaSearch",
        searchType: "date",
        sortable: true,
        searchHidden: false,
        hidden: false,
        maxWidth: 120,
    },
    {
        id: 'estado', name: 'Estado', field: 'estado',
        fieldName: "obj.estado",
        type: 'string',
        formatter: 'complexObject',
        params: {
            complexFieldLabel: 'estado.label',
        },
        searchComponent: "inpurForEstadoCustSearch",
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
        id: 'horas', name: 'Horas', field: 'horas',
        // fieldName: "obj.impo_facturar",
        type: 'number',
        searchType: "float",
        sortable: true,
        searchHidden: true,
        hidden: false,
    },
    {
        id: 'importe', name: 'Importe', field: 'importe',
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
    { value: 4, label: 'Facturado' }
]// value = tipo , label = descripcion

export class CustodiaController extends BaseController {

    static async listCustodiasPendientes(anio: number, mes: number) {
        const queryRunner = dataSource.createQueryRunner();
        return queryRunner.query(`SELECT c.fecha_inicio, c.responsable_id, p.PersonalId, CONCAT (TRIM(p.PersonalApellido),', ',TRIM(p.PersonalNombre)) ResponsableDetalle
            FROM lige.dbo.objetivocustodia c 
            JOIN Personal p ON p.PersonalId = c.responsable_id 
            WHERE c.fecha_liquidacion IS NULL AND c.estado = 0
        `, [anio, mes])
    }

    async addObjetivoCustodiaQuery(queryRunner: any, objetivoCustodia: any, usuario: any, ip: any) {
        const objetivo_custodia_id = objetivoCustodia.id
        const responsable_id = objetivoCustodia.responsableId
        const cliente_id = objetivoCustodia.clienteId
        const desc_requirente = objetivoCustodia.descRequirente ? objetivoCustodia.descRequirente : null
        const descripcion = objetivoCustodia.descripcion ? objetivoCustodia.descripcion : null
        const fecha_inicio = new Date(objetivoCustodia.fechaInicio)
        const origen = objetivoCustodia.origen
        const fecha_fin = objetivoCustodia.fechaFinal ? new Date(objetivoCustodia.fechaFinal) : null
        const destino = objetivoCustodia.destino ? objetivoCustodia.destino : null
        const cant_modulos = objetivoCustodia.cantModulos ? objetivoCustodia.cantModulos : null
        const importe_modulos = objetivoCustodia.impoModulos ? objetivoCustodia.impoModulos : null
        const cant_horas_exced = objetivoCustodia.cantHorasExced ? objetivoCustodia.cantHorasExced : null
        const impo_horas_exced = objetivoCustodia.impoHorasExced ? objetivoCustodia.impoHorasExced : null
        const cant_km_exced = objetivoCustodia.cantKmExced ? objetivoCustodia.cantKmExced : null
        const impo_km_exced = objetivoCustodia.impoKmExced ? objetivoCustodia.impoKmExced : null
        const impo_peaje = objetivoCustodia.impoPeaje ? objetivoCustodia.impoPeaje : null
        const impo_facturar = cant_modulos * importe_modulos + cant_horas_exced * impo_horas_exced + cant_km_exced * impo_km_exced + impo_peaje
        const num_factura = objetivoCustodia.numFactura ? objetivoCustodia.numFactura : null
        const desc_facturacion = objetivoCustodia.desc_facturacion ? objetivoCustodia.desc_facturacion : null
        const estado = objetivoCustodia.estado ? objetivoCustodia.estado : 0
        const fechaActual = new Date()
        const fechaLiquidacionLast = new Date(objetivoCustodia.anio, objetivoCustodia.mes, 0, 20, 59, 59, 999)
        const fechaLiquidacionNew = (fechaActual > fechaLiquidacionLast) ? fechaLiquidacionLast : fechaActual

        const periodo = await queryRunner.query(`
            SELECT TOP 1 *, CAST (EOMONTH(CONCAT(anio,'-',mes,'-',1)) AS DATETIME)+'23:59:59' AS FechaCierre FROM lige.dbo.liqmaperiodo WHERE ind_recibos_generados = 1 ORDER BY anio DESC, mes DESC
        `)

        if (new Date(periodo[0].FechaCierre) > fechaLiquidacionNew && this.valByEstado(estado))
            throw new ClientException(`No se puede cerrar la custodia en el período ${objetivoCustodia.mes}/${objetivoCustodia.anio}`)


        const fecha_liquidacion = (this.valByEstado(estado)) ? fechaLiquidacionNew : null

        return queryRunner.query(`
            INSERT lige.dbo.objetivocustodia(objetivo_custodia_id, responsable_id, cliente_id, desc_requirente,
                descripcion, fecha_inicio, origen, fecha_fin, destino, cant_modulos, importe_modulos, cant_horas_exced,
                impo_horas_exced, cant_km_exced, impo_km_exced, impo_peaje, impo_facturar, desc_facturacion, num_factura, estado,
                fecha_liquidacion, aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
            VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15, @16, @17, @18, @19, @20, @21, @22, @23, @21, @22, @23)`,
            [objetivo_custodia_id, responsable_id, cliente_id, desc_requirente, descripcion, fecha_inicio, origen,
                fecha_fin, destino, cant_modulos, importe_modulos, cant_horas_exced, impo_horas_exced,
                cant_km_exced, impo_km_exced, impo_peaje, impo_facturar, desc_facturacion, num_factura, estado,
                fecha_liquidacion, usuario, ip, fechaActual]
        )
    }

    async addRegistroPersonalCustodiaQuery(queryRunner: any, objetivo_custodia_id: number, infoPersonal: any, usuario: any, ip: any) {
        const personal_id = infoPersonal.personalId
        const importe_personal = infoPersonal.importe ? infoPersonal.importe : null
        const fechaActual = new Date()
        return await queryRunner.query(`INSERT lige.dbo.regpersonalcustodia(
            personal_id, objetivo_custodia_id, importe_personal, 
            aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod
        )
        VALUES (@0, @1, @2, @3, @4, @5, @3, @4, @5)`,
            [personal_id, objetivo_custodia_id, importe_personal, usuario, ip, fechaActual])
    }

    async addRegistroVehiculoCustodiaQuery(queryRunner: any, objetivo_custodia_id: number, infoVehiculo: any, usuario: any, ip: any) {
        const patente = String(infoVehiculo.patente)
        const personal_id = infoVehiculo.duenoId
        const importe_vehiculo = infoVehiculo.importe ? infoVehiculo.importe : null
        const peaje_vehiculo = infoVehiculo.peaje ? infoVehiculo.peaje : null
        const fechaActual = new Date()
        return await queryRunner.query(`INSERT lige.dbo.regvehiculocustodia(
            patente, objetivo_custodia_id, personal_id, importe_vehiculo, peaje_vehiculo, 
            aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod
        )
        VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @5, @6, @7)`,
            [patente.toUpperCase(), objetivo_custodia_id, personal_id, importe_vehiculo, peaje_vehiculo, usuario, ip, fechaActual])
    }

    async addRegistroArmaCustodiaQuery(queryRunner: any, arma_id: any, objetivoCustodiaId: any) {
        return await queryRunner.query(`INSERT regarmacustodia(objetivo_custodia_id, arma_id)
        VALUES ()`,
            [objetivoCustodiaId, arma_id])
    }

    async addArmaQuery(queryRunner: any, armaId: any, detalle: any) {
        return await queryRunner.query(`INSERT arma(arma_id, detalle)
        VALUES ()`,
            [armaId, detalle])
    }

    async listObjetivoCustodiaByResponsableQuery(queryRunner: any, filterSql: any, orderBy: any, periodo: Date, responsableId?: number) {
        const year = periodo.getFullYear()
        const month = periodo.getMonth() + 1
        let search = ''
        if (responsableId === undefined) {
            search = `1=1`
        } else {
            search = `obj.responsable_id IN (${responsableId})`
        }
        return await queryRunner.query(`
            SELECT DISTINCT obj.objetivo_custodia_id id, obj.responsable_id responsableId,
            obj.cliente_id clienteId, obj.desc_requirente, obj.descripcion, obj.fecha_inicio, 
            obj.origen, obj.fecha_fin, obj.destino, obj.estado, TRIM(cli.ClienteApellidoNombre) cliente,
            CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) responsable, obj.impo_facturar facturacion,
            obj.desc_facturacion, obj.fecha_liquidacion,
            obj.impo_peaje, obj.impo_km_exced, obj.cant_km_exced,obj.impo_horas_exced, obj.cant_horas_exced,obj.importe_modulos,obj.cant_modulos
            FROM lige.dbo.objetivocustodia obj
            JOIN Personal per ON per.PersonalId = obj.responsable_id
            JOIN Cliente cli ON cli.ClienteId = obj.cliente_id
            LEFT JOIN lige.dbo.regvehiculocustodia regveh ON regveh.objetivo_custodia_id = obj.objetivo_custodia_id
            LEFT JOIN lige.dbo.regpersonalcustodia regper ON regper.objetivo_custodia_id = obj.objetivo_custodia_id
            WHERE ((obj.fecha_liquidacion IS NULL AND obj.estado IN (0)) OR (DATEPART(YEAR,obj.fecha_liquidacion)=@0 AND  DATEPART(MONTH, obj.fecha_liquidacion)=@1))
            AND (${search}) AND (${filterSql}) 
            ${orderBy}`, [year, month])
    }

    async updateObjetivoCustodiaQuery(queryRunner: any, objetivoCustodia: any, usuario: any, ip: any) {
        const objetivo_custodia_id = objetivoCustodia.id
        const cliente_id = objetivoCustodia.clienteId
        const desc_requirente = objetivoCustodia.descRequirente ? objetivoCustodia.descRequirente : null
        const descripcion = objetivoCustodia.descripcion ? objetivoCustodia.descripcion : null
        const fecha_inicio = new Date(objetivoCustodia.fechaInicio)
        const origen = objetivoCustodia.origen
        const fecha_fin = objetivoCustodia.fechaFinal ? new Date(objetivoCustodia.fechaFinal) : null
        const destino = objetivoCustodia.destino
        const cant_modulos = objetivoCustodia.cantModulos ? objetivoCustodia.cantModulos : null
        const importe_modulos = objetivoCustodia.impoModulos ? objetivoCustodia.impoModulos : null
        const cant_horas_exced = objetivoCustodia.cantHorasExced ? objetivoCustodia.cantHorasExced : null
        const impo_horas_exced = objetivoCustodia.impoHorasExced ? objetivoCustodia.impoHorasExced : null
        const cant_km_exced = objetivoCustodia.cantKmExced ? objetivoCustodia.cantKmExced : null
        const impo_km_exced = objetivoCustodia.impoKmExced ? objetivoCustodia.impoKmExced : null
        const impo_peaje = objetivoCustodia.impoPeaje ? objetivoCustodia.impoPeaje : null
        const impo_facturar = cant_modulos * importe_modulos + cant_horas_exced * impo_horas_exced + cant_km_exced * impo_km_exced + impo_peaje
        const num_factura = objetivoCustodia.numFactura ? objetivoCustodia.numFactura : null
        const desc_facturacion = objetivoCustodia.desc_facturacion ? objetivoCustodia.desc_facturacion : null
        const estado = objetivoCustodia.estado ? objetivoCustodia.estado : 0
        const fechaActual = new Date()
        const fechaLiquidacionLast = new Date(objetivoCustodia.anio, objetivoCustodia.mes, 0, 20, 59, 59, 999)
        const fechaLiquidacionNew = (fechaActual > fechaLiquidacionLast) ? fechaLiquidacionLast : fechaActual
        let fecha_liquidacion = (!objetivoCustodia.fecha_liquidacion && (estado == 1 || estado == 3 || estado == 4)) ? fechaLiquidacionNew : objetivoCustodia.fecha_liquidacion

        if (estado != 1 && estado != 3 && estado != 4)
            fecha_liquidacion = null

        const periodo = await queryRunner.query(`
            SELECT TOP 1 *, CAST (EOMONTH(CONCAT(anio,'-',mes,'-',1)) AS DATETIME)+'23:59:59' AS FechaCierre FROM lige.dbo.liqmaperiodo WHERE ind_recibos_generados = 1 ORDER BY anio DESC, mes DESC
        `)

        if (new Date(periodo[0].FechaCierre) > fechaLiquidacionNew && (estado == 1 || estado == 3 || estado == 4) && objetivoCustodia.fecha_liquidacion == null)
            throw new ClientException(`No se puede cerrar la custodia en el período ${objetivoCustodia.mes}/${objetivoCustodia.anio}`)

        return queryRunner.query(`
        UPDATE lige.dbo.objetivocustodia 
        SET cliente_id = @1, desc_requirente = @2, descripcion = @3, fecha_inicio = @4, origen = @5, 
        fecha_fin = @6, destino = @7, cant_modulos = @8, importe_modulos = @9, cant_horas_exced = @10, 
        impo_horas_exced = @11, cant_km_exced = @12, impo_km_exced = @13, impo_peaje = @14,  
        impo_facturar = @15, desc_facturacion = @16, num_factura = @17, estado = @18, fecha_liquidacion = @19,
        aud_usuario_mod = @20, aud_ip_mod = @21, aud_fecha_mod = @22
        WHERE objetivo_custodia_id = @0`,
            [objetivo_custodia_id, cliente_id, desc_requirente, descripcion, fecha_inicio, origen, fecha_fin, destino,
                cant_modulos, importe_modulos, cant_horas_exced, impo_horas_exced, cant_km_exced, impo_km_exced,
                impo_peaje, impo_facturar, desc_facturacion, num_factura, estado, fecha_liquidacion, usuario, ip, fechaActual
            ])
    }

    async updateRegistroPersonalCustodiaQuery(queryRunner: any, infoPersonal: any, usuario: any, ip: any) {
        const personal_id = infoPersonal.personalId
        const objetivo_custodia_id = infoPersonal.objetivoCustodiaId
        const importe_personal = infoPersonal.importe ? infoPersonal.importe : null
        const fechaActual = new Date()
        return await queryRunner.query(`
        UPDATE lige.dbo.regpersonalcustodia
        SET personal_id = @1, importe_personal =@2, aud_usuario_mod = @3, aud_ip_mod = @4, aud_fecha_mod = @5
        WHERE objetivo_custodia_id = @0`,
            [objetivo_custodia_id, personal_id, importe_personal, usuario, ip, fechaActual])
    }

    async updateRegistroVehiculoCustodiaQuery(queryRunner: any, infoVehiculo: any, usuario: any, ip: any) {
        const objetivo_custodia_id = infoVehiculo.objetivoCustodiaId
        const patente = infoVehiculo.patente
        const personal_id = infoVehiculo.duenoId
        const importe_vehiculo = infoVehiculo.importe ? infoVehiculo.importe : null
        const peaje_vehiculo = infoVehiculo.peaje ? infoVehiculo.peaje : null
        const fechaActual = new Date()
        return await queryRunner.query(`
        UPDATE lige.dbo.regvehiculocustodia
        SET patente = @1, personal_id = @2, importe_vehiculo = @3, peaje_vehiculo = @4, aud_usuario_mod = @5, aud_ip_mod = @6, aud_fecha_mod = @7
        WHERE objetivo_custodia_id = @0`,
            [objetivo_custodia_id, patente, personal_id, importe_vehiculo, peaje_vehiculo, usuario, ip, fechaActual])
    }

    async getObjetivoCustodiaQuery(queryRunner: any, custodiaId: any) {
        return await queryRunner.query(`
        SELECT obj.objetivo_custodia_id id, obj.responsable_id responsableId, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS responsable,
        obj.cliente_id clienteId, obj.desc_requirente descRequirente, obj.descripcion, obj.fecha_inicio fechaInicio, obj.origen, 
        obj.fecha_fin fechaFinal, obj.destino, obj.cant_modulos cantModulos, obj.importe_modulos impoModulos, 
        obj.cant_horas_exced cantHorasExced, obj.impo_horas_exced impoHorasExced, obj.cant_km_exced cantKmExced, obj.desc_facturacion,
        obj.impo_km_exced impoKmExced, obj.impo_peaje impoPeaje, obj.impo_facturar facturacion, obj.estado, obj.num_factura numFactura,
        obj.fecha_liquidacion
        FROM lige.dbo.objetivocustodia obj
        INNER JOIN Cliente cli ON cli.ClienteId = obj.cliente_id
        INNER JOIN Personal per ON per.PersonalId = obj.responsable_id
        WHERE objetivo_custodia_id = @0`,
            [custodiaId])
    }

    async getRegPersonalObjCustodiaQuery(queryRunner: any, custodiaId: any) {
        return await queryRunner.query(`
        SELECT reg.personal_id personalId, reg.importe_personal importe
        FROM lige.dbo.regpersonalcustodia reg
        INNER JOIN Personal per ON per.PersonalId = reg.personal_id
        WHERE objetivo_custodia_id = @0`,
            [custodiaId])
    }

    async getRegVehiculoObjCustodiaQuery(queryRunner: any, custodiaId: any) {
        return await queryRunner.query(`
        SELECT reg.patente , reg.importe_vehiculo importe, reg.peaje_vehiculo peaje, reg.personal_id duenoId
        FROM lige.dbo.regvehiculocustodia reg
        INNER JOIN Personal per ON per.PersonalId = reg.personal_id
        WHERE objetivo_custodia_id = @0`,
            [custodiaId])
    }

    async deleteRegPersonalObjCustodiaQuery(queryRunner: any, custodiaId: any, personalId: any) {
        return await queryRunner.query(`
        DELETE lige.dbo.regpersonalcustodia 
        WHERE objetivo_custodia_id = @0
        AND personal_id = @1`,
            [custodiaId, personalId])
    }

    async deleteRegVehiculoObjCustodiaQuery(queryRunner: any, custodiaId: any, patente: any) {
        return await queryRunner.query(`
        DELETE lige.dbo.regvehiculocustodia 
        WHERE objetivo_custodia_id = @0
        AND patente = @1`,
            [custodiaId, patente])
    }

    async addObjetivoCustodia(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        let errores = []

        try {
            await queryRunner.startTransaction()
            if (!req.body.clienteId || !req.body.fechaInicio || !req.body.origen)
                throw new ClientException(`Los campos de Cliente, Fecha Inicial y Origen NO pueden estar vacios.`)

            const usuario = res.locals.userName
            const ip = this.getRemoteAddress(req)
            // const responsableId = 699
            const responsableId = res.locals.PersonalId
            if (!responsableId)
                throw new ClientException(`No se a encontrado al personal responsable.`)




            const valCustodiaForm = this.valCustodiaForm(req.body, queryRunner)
            if (valCustodiaForm instanceof ClientException)
                throw valCustodiaForm

            const objetivoCustodiaId = await this.getProxNumero(queryRunner, `objetivocustodia`, usuario, ip)

            const fecha_liquidacion = (this.valByEstado(req.body.estado)) ? new Date() : null

            const objetivoCustodia = { ...req.body, responsableId, id: objetivoCustodiaId }


            const periodo = await queryRunner.query(`
                SELECT TOP 1 *, CAST (EOMONTH(CONCAT(anio,'-',mes,'-',1)) AS DATETIME)+'23:59:59' AS FechaCierre FROM lige.dbo.liqmaperiodo WHERE ind_recibos_generados = 1 ORDER BY anio DESC, mes DESC
            `)

            if (new Date(objetivoCustodia.fechaInicio) <= new Date(periodo[0].FechaCierre))
                errores.push(`La Fecha inicio de la custodia no puede estar comprendida en un período ya cerrado`)

            if (new Date(objetivoCustodia.fechaInicio).getFullYear() != objetivoCustodia.anio || new Date(objetivoCustodia.fechaInicio).getMonth() + 1 != objetivoCustodia.mes)
                errores.push(`La Fecha inicio debe pertenecer al período seleccionado ${objetivoCustodia.mes}/${objetivoCustodia.anio}`)



            await this.addObjetivoCustodiaQuery(queryRunner, objetivoCustodia, usuario, ip)

            var seen = {};
            var hasDupPersonal = objetivoCustodia.personal.some(function (currentObject) {
                if (!currentObject.personalId) return false
                return seen.hasOwnProperty(currentObject.personalId)
                    || (seen[currentObject.personalId] = false);
            });
            if (hasDupPersonal)
                errores.push(`Hay personal duplicado`)


            await queryRunner.query(`DELETE FROM lige.dbo.regpersonalcustodia WHERE objetivo_custodia_id = @0`, [objetivoCustodiaId])
            let errorCantPersonal: boolean = true
            for (const obj of objetivoCustodia.personal) {
                if (obj.personalId) {
                    errorCantPersonal = false
                    //Validaciones para fecha_liquidacion
                    if (fecha_liquidacion && !obj.importe) {
                        errores.push(`El campo Importe de Personal NO pueden estar vacios.`)
                        break
                    }

                    // if(this.valByEstado(objetivoCustodia.estado) && !obj.importe)
                    //     errores.push(`El campo Importe de Personal NO pueden estar vacios.`)

                    await this.addRegistroPersonalCustodiaQuery(queryRunner, objetivoCustodiaId, obj, usuario, ip)
                }
            }

            var hasDupVehiculos = objetivoCustodia.vehiculos.some(function (currentObject) {
                if (!currentObject.patente) return false
                return seen.hasOwnProperty(currentObject.patente)
                    || (seen[currentObject.patente] = false);
            });
            if (hasDupVehiculos)
                errores.push(`Hay vehículos duplicados`)

            await queryRunner.query(`DELETE lige.dbo.regvehiculocustodia WHERE objetivo_custodia_id = @0`, [objetivoCustodiaId])
            let errorCantVehiculo: boolean = true
            for (const obj of objetivoCustodia.vehiculos) {
                if (obj.patente) {
                    errorCantVehiculo = false
                    if (fecha_liquidacion && (!obj.importe || !obj.duenoId)) {
                        errores.push(`Los campos relacionados al vehículo ${obj.patente} NO pueden estar vacíos.`)
                        continue
                    }
                    if (!obj.duenoId) {
                        errores.push(`Debe completar el campo Dueño del vehículo ${obj.patente}`)
                        continue
                    }

                    await this.addRegistroVehiculoCustodiaQuery(queryRunner, objetivoCustodiaId, obj, usuario, ip)
                }
            }

            if (errorCantVehiculo)
                errores.push(`Debe haber al menos un vehículo por custodia.`)

            if (errorCantPersonal)
                errores.push(`Debe de haber al menos una persona por custodia.`)

            if (errores.length)
                throw new ClientException(errores.join(`\n`))

            await queryRunner.commitTransaction()
            return this.jsonRes({ custodiaId: objetivoCustodiaId }, res, 'Carga Exitosa');
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
            // const responsableId = 699
            const responsableId = res.locals.PersonalId
            const periodo: Date = new Date(req.body.periodo)
            const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null };

            const filterSql = filtrosToSql(options.filtros, columnsObjCustodia);
            const orderBy = orderToSQL(options.sort)

            let result: any
            if (await this.hasGroup(req, 'liquidaciones') || await this.hasGroup(req, 'administrativo')) {
                result = await this.listObjetivoCustodiaByResponsableQuery(queryRunner, filterSql, orderBy, periodo)
            } else {
                result = await this.listObjetivoCustodiaByResponsableQuery(queryRunner, filterSql, orderBy, periodo, responsableId)
            }

            let list = result.map((obj: any) => {
                return {
                    id: obj.id,
                    responsable: { id: obj.responsableId, fullName: obj.responsable },
                    cliente: { id: obj.clienteId, fullName: obj.cliente },
                    requirente: obj.desc_requirente,
                    descripcion: obj.descripcion,
                    fechaI: obj.fecha_inicio,
                    origen: obj.origen,
                    fechaF: obj.fecha_fin ? obj.fecha_fin : null,
                    destino: obj.destino,
                    estado: estados[obj.estado],
                    desc_facturacion: obj.desc_facturacion,
                    facturacion: obj.facturacion,
                    cant_modulos: obj.cant_modulos,
                    importe_modulos: obj.importe_modulos,
                    cant_horas_exced: obj.cant_horas_exced,
                    impo_horas_exced: obj.impo_horas_exced,
                    cant_km_exced: obj.cant_km_exced,
                    impo_km_exced: obj.impo_km_exced,
                    impo_peaje: obj.impo_peaje,
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
            const custodiaId = req.params.id
            let infoCustodia = await this.getObjetivoCustodiaQuery(queryRunner, custodiaId)
            let listPersonal = await this.getRegPersonalObjCustodiaQuery(queryRunner, custodiaId)
            let listVehiculo = await this.getRegVehiculoObjCustodiaQuery(queryRunner, custodiaId)

            infoCustodia = infoCustodia[0]
            // delete infoCustodia.id
            delete infoCustodia.responsableId
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
            // const responsableId = 699
            const responsableId = res.locals.PersonalId
            const custodiaId = req.params.id
            const objetivoCustodia = { ...req.body }

            let infoCustodia = await this.getObjetivoCustodiaQuery(queryRunner, custodiaId)
            infoCustodia = infoCustodia[0]

            if (objetivoCustodia.estado == 0) {
                infoCustodia.fecha_liquidacion = null
            }

            delete infoCustodia.id
            delete infoCustodia.responsable

            if (!(await this.hasGroup(req, 'liquidaciones') || await this.hasGroup(req, 'administrativo')) && responsableId != infoCustodia.responsableId) {
                throw new ClientException(`Únicamente puede modificar el registro ${infoCustodia.responsable} o pertenecer al grupo 'Administracion'/'Liquidaciones'.`)
            }

            if (infoCustodia.estado == 4) {
                throw new ClientException(`No se puede modificar los registros con estado Facturado.`)
            }

            const valCustodiaForm = this.valCustodiaForm(objetivoCustodia, queryRunner)
            if (valCustodiaForm instanceof ClientException)
                throw valCustodiaForm
            if (infoCustodia.fecha_liquidacion) {
                var listPersonal = await this.getRegPersonalObjCustodiaQuery(queryRunner, custodiaId)
                var listVehiculo = await this.getRegVehiculoObjCustodiaQuery(queryRunner, custodiaId)
            }

            var seen = {};
            var hasDupPersonal = objetivoCustodia.personal.some(function (currentObject) {
                if (!currentObject.personalId) return false
                return seen.hasOwnProperty(currentObject.personalId)
                    || (seen[currentObject.personalId] = false);
            });
            if (hasDupPersonal)
                errores.push(`Hay personal duplicado`)

            await queryRunner.query(`DELETE FROM lige.dbo.regpersonalcustodia WHERE objetivo_custodia_id = @0`, [custodiaId])
            let errorCantPersonal: boolean = true
            for (const obj of objetivoCustodia.personal) {
                if (obj.personalId) {
                    errorCantPersonal = false
                    //Validaciones para fecha_liquidacion
                    if (((this.valByEstado(objetivoCustodia.estado) && !infoCustodia.fecha_liquidacion)) && !obj.importe) {
                        errores.push(`El campo Importe de Personal NO pueden estar vacios.`)
                        break
                    }
                    if (infoCustodia.fecha_liquidacion && !this.comparePersonal(obj, listPersonal)) {
                        errores.push(`NO se pueden modificar los campos del Personal.`)
                        break
                    }
                    //
                    // if(this.valByEstado(objetivoCustodia.estado) && !obj.importe)
                    //     errores.push(`El campo Importe de Personal NO pueden estar vacios.`)

                    await this.addRegistroPersonalCustodiaQuery(queryRunner, custodiaId, obj, usuario, ip)
                }
            }

            var hasDupVehiculos = objetivoCustodia.vehiculos.some(function (currentObject) {
                if (!currentObject.patente) return false
                return seen.hasOwnProperty(currentObject.patente)
                    || (seen[currentObject.patente] = false);
            });
            if (hasDupVehiculos)
                errores.push(`Hay vehículos duplicados`)
            await queryRunner.query(`DELETE lige.dbo.regvehiculocustodia WHERE objetivo_custodia_id = @0`, [custodiaId])
            let errorCantVehiculo: boolean = true
            for (const obj of objetivoCustodia.vehiculos) {
                if (obj.patente) {
                    errorCantVehiculo = false
                    //Validaciones para fecha_liquidacion
                    if (((this.valByEstado(objetivoCustodia.estado) && !infoCustodia.fecha_liquidacion)) && (!obj.importe || !obj.duenoId)) {
                        errores.push(`Los campos relacionados a la Patente ${obj.patente} NO pueden estar vacio.`)
                        continue
                    }
                    if (infoCustodia.fecha_liquidacion && !this.compareVehiculo(obj, listVehiculo)) {
                        errores.push(`NO se pueden modificar los campos de la Patente ${obj.patente}.`)
                        continue
                    }
                    //
                    // if(this.valByEstado(objetivoCustodia.estado) && !obj.importe)
                    //     errores.push(`El campo Importe de la Patente ${obj.patente} NO pueden estar vacio.`)
                    if (!obj.duenoId)
                        errores.push(`El campo Dueño de la Patente ${obj.patente} NO pueden estar vacio.`)

                    await this.addRegistroVehiculoCustodiaQuery(queryRunner, custodiaId, obj, usuario, ip)
                }
            }

            if (errorCantVehiculo)
                errores.push(`Debe de haber por lo menos un vehículo (Patente y Dueño) por custodia.`)

            if (errorCantPersonal)
                errores.push(`Debe de haber por lo menos una persona por custodia.`)
            // console.log('errores.length', errores)
            if (errores.length)
                throw new ClientException(errores.join(`\n`))

            objetivoCustodia.fecha_liquidacion = infoCustodia.fecha_liquidacion
            objetivoCustodia.id = custodiaId
            await this.updateObjetivoCustodiaQuery(queryRunner, objetivoCustodia, usuario, ip)

            //                        throw new ClientException('DEBUG')

            await queryRunner.commitTransaction()
            return this.jsonRes([], res, 'Carga Exitosa');
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

    async getEstados(req: any, res: Response, next: NextFunction) {
        return this.jsonRes(estados, res)
    }

    valCustodiaForm(custodiaForm: any, queryRunner: any) {
        let errores: any[] = []
        if (!Number.isInteger(custodiaForm.estado)) {
            errores.push(`El campo Estado NO pueden estar vacio`)
        }
        if (!custodiaForm.clienteId || !custodiaForm.fechaInicio || !custodiaForm.origen) {
            errores.push(`Los campos de Cliente, Fecha Inicial y Origen NO pueden estar vacios.`)
        }
        if ((!custodiaForm.cantModulos && custodiaForm.impoModulos) || (custodiaForm.cantModulos && !custodiaForm.impoModulos)) {
            errores.push(`Los campos pares Cant. e Importe de Modulos deben de llenarse al mismo tiempo.`)
        }
        if ((!custodiaForm.cantHorasExced && custodiaForm.impoHorasExced) || (custodiaForm.cantHorasExced && !custodiaForm.impoHorasExced)) {
            errores.push(`Los campos pares Cant. e Importe de Horas Excedentes deben de llenarse al mismo tiempo.`)
        }
        if ((!custodiaForm.cantKmExced && custodiaForm.impoKmExced) || (custodiaForm.cantKmExced && !custodiaForm.impoKmExced)) {
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
        if (this.valByEstado(custodiaForm.estado)) {
            if (!custodiaForm.facturacion || !custodiaForm.fechaFinal || !custodiaForm.destino) {
                errores.push(`Los campos de Destino, Fecha Final y Importe a Facturar NO pueden estar vacios.`)
            }
            if (custodiaForm.estado == 4 && !custodiaForm.numFactura) {
                errores.push(`El campo Num de Factura NO puede estar vacio.`)
            }
        }

        if (custodiaForm.fechaFinal && custodiaForm.fechaFinal <= custodiaForm.fechaInicio) {
            errores.push(`La Fecha Final no puede ser menor o igual a la Fecha Inicial.`)
        }

        if (errores.length) {
            return new ClientException(errores.join(`\n`))
        }
    }

    async searhPatente(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.startTransaction()
            const patente = req.body.patente
            const list = await queryRunner.query(`
                SELECT reg.patente, reg.personal duenoId
                FROM lige.dbo.regvehiculocustodia reg
                WHERE patente LIKE '%${patente}%'`)
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
            const list = await queryRunner.query(`
                SELECT TOP 1 reg.patente, reg.personal_id duenoId
                FROM lige.dbo.regvehiculocustodia reg
                WHERE
                reg.patente = @0
                -- patente LIKE '%${patente}%'
                ORDER BY aud_fecha_ins DESC`,
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
            const clienteId = req.body.clienteId
            const list = await queryRunner.query(`
                SELECT DISTINCT obj.desc_requirente descRequirente
                FROM lige.dbo.objetivocustodia obj
                WHERE obj.cliente_id = @0`,
                [clienteId])

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
            const list = await queryRunner.query(`
                SELECT DISTINCT obj.desc_requirente fullName
                FROM lige.dbo.objetivocustodia obj
                WHERE obj.desc_requirente LIKE '%${value}%'`)

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
            // const responsableId = 699
            const responsableId = res.locals.PersonalId
            await queryRunner.startTransaction()
            const forms: any[] = req.body
            let errores: any[] = []
            for (const form of forms) {
                const ids: number[] = form.custodiasIds
                const estado: number = form.estado
                const numFactura: number = form.numFactura

                if (estado == 4 && await this.hasGroup(req, 'Administrativo') == false)
                    throw new ClientException(`Requiere ser miembro del grupo Administrativo`)

                if (estado == 4 && !numFactura) {
                    throw new ClientException(`El Número de Factura es invalido.`)
                }

                for (const id of ids) {
                    let infoCustodia = await this.getObjetivoCustodiaQuery(queryRunner, id)
                    infoCustodia = infoCustodia[0]

                    if (infoCustodia.responsableId != responsableId) {
                        errores.push(`Codigo ${id}: Solo el responsable puede modificar la custodia.`)
                        continue
                    }
                    //Validaciones
                    if (infoCustodia.estado == 4) {
                        errores.push(`Codigo ${id}: No se puede modificar el estado.`)
                        continue
                    }

                    let msgError: string = ''
                    if (this.valByEstado(estado)) {
                        let listPersonal = await this.getRegPersonalObjCustodiaQuery(queryRunner, id)
                        let listVehiculo = await this.getRegVehiculoObjCustodiaQuery(queryRunner, id)
                        for (const personal of listPersonal) {
                            if (!personal.importe) {
                                msgError += `Revisar el Importe del personal. `
                                break
                            }
                        }
                        for (const vehiculo of listVehiculo) {
                            if (!vehiculo.importe) {
                                msgError += (`Revisar el Importe del vehiculo.`)
                                break
                            }
                        }
                    }
                    if (msgError.length) {
                        errores.push(`Codigo ${id}:` + msgError)
                        continue
                    }

                    infoCustodia.estado = estado
                    if (estado == 4)
                        infoCustodia.numFactura = numFactura
                    const valCustodiaForm = this.valCustodiaForm(infoCustodia, queryRunner)
                    if (valCustodiaForm instanceof ClientException) {
                        errores.push(`Codigo ${id}: ${valCustodiaForm.messageArr}`)
                        continue
                    }

                    await this.updateObjetivoCustodiaQuery(queryRunner, infoCustodia, usuario, ip)
                }

            }

            if (errores.length) {
                throw new ClientException(errores.join(`\n`))
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

    static async listPersonalCustodiaQuery(options: any, queryRunner: QueryRunner, anio: number, mes: number, responsableId?: number) {
        const filterSql = filtrosToSql(options.filtros, columnsPersonalCustodia);
        const orderBy = orderToSQL(options.sort)

        let search = ''
        if (responsableId == 0) {
            search = `1=1`
        } else {
            search = `obj.responsable_id IN (${responsableId})`
        }

        return queryRunner.query(`
            SELECT per.PersonalId, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre,
            obj.objetivo_custodia_id, obj.cliente_id, TRIM(cli.ClienteDenominacion) cliente,
            obj.fecha_inicio, obj.fecha_fin, obj.estado, obj.fecha_liquidacion,
            regp.importe_personal AS importe,
            ABS(CEILING(CONVERT(FLOAT,DATEDIFF(minute, obj.fecha_inicio,obj.fecha_fin)) / 60)) AS horas, 
            'Personal' AS tipo_importe, 
            '' AS categoria,
            '' AS patente
            FROM dbo.Personal AS per
            INNER JOIN lige.dbo.regpersonalcustodia regp ON per.PersonalId= regp.personal_id
            INNER JOIN lige.dbo.objetivocustodia obj ON regp.objetivo_custodia_id= obj.objetivo_custodia_id
            INNER JOIN lige.dbo.Cliente cli ON cli.ClienteId = obj.cliente_id
            WHERE (DATEPART(YEAR,obj.fecha_liquidacion)=@0 AND  DATEPART(MONTH, obj.fecha_liquidacion)=@1)
            AND (${search}) AND (${filterSql}) 
            ${orderBy}
            UNION ALL
            SELECT per.PersonalId, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre,
            obj.objetivo_custodia_id, obj.cliente_id, TRIM(cli.ClienteDenominacion) cliente,
            obj.fecha_inicio, obj.fecha_fin, obj.estado, obj.fecha_liquidacion,
            (ISNULL(regv.importe_vehiculo,0)+ISNULL(regv.peaje_vehiculo,0)) AS importe,
            0 AS horas, 
            'Vehiculo' AS tipo_importe, 
            '' AS categoria,
            regv.patente
            FROM dbo.Personal AS per
            INNER JOIN lige.dbo.regvehiculocustodia regv ON per.PersonalId= regv.personal_id
            INNER JOIN lige.dbo.objetivocustodia obj ON regv.objetivo_custodia_id= obj.objetivo_custodia_id
            INNER JOIN lige.dbo.Cliente cli ON cli.ClienteId = obj.cliente_id
            WHERE (DATEPART(YEAR,obj.fecha_liquidacion)=@0 AND  DATEPART(MONTH, obj.fecha_liquidacion)=@1)
            AND (${search}) AND (${filterSql}) 
            ${orderBy}
            UNION ALL
            SELECT per.PersonalId, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre,
            obj.objetivo_custodia_id, obj.cliente_id, TRIM(cli.ClienteDenominacion) cliente,
            obj.fecha_inicio, obj.fecha_fin, obj.estado, obj.fecha_liquidacion,
            ROUND (CONVERT (FLOAT,obj.impo_facturar * (IIF(obj.cliente_id=798,1,3.5)) / 100),2) AS importe,
            0 AS horas, 
            'Jefe Área' AS tipo_importe, 
            '' AS categoria,
            '' AS patente
            FROM lige.dbo.objetivocustodia obj 
            INNER JOIN lige.dbo.Personal AS per ON per.PersonalId = obj.responsable_id
            INNER JOIN lige.dbo.Cliente cli ON cli.ClienteId = obj.cliente_id
            WHERE (DATEPART(YEAR,obj.fecha_liquidacion)=@0 AND  DATEPART(MONTH, obj.fecha_liquidacion)=@1)
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
            if (await this.hasGroup(req, 'liquidaciones') || await this.hasGroup(req, 'administrativo')) {
                result = await CustodiaController.listPersonalCustodiaQuery(options, queryRunner, anio, mes, 0)
            } else {
                result = await CustodiaController.listPersonalCustodiaQuery(options, queryRunner, anio, mes, responsableId)
            }

            let list = result.map((obj: any, index: number) => {
                obj.id = index + 1
                obj.estado = estados[obj.estado]
                obj.cliente = { id: obj.cliente_id, fullName: obj.cliente }
                delete obj.cliente_id
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
                if (estado == 1 || estado == 3 || estado == 4)
                    return true
                else
                    return false
            default:
                return false
        }
    }

    comparePersonal(per: any, list: any[]): boolean {
        let result: any = list.find((obj: any) => (obj.personalId == per.personalId && obj.importe == per.importe))
        return result ? true : false
    }

    compareVehiculo(veh: any, list: any[]): boolean {
        let result: any = list.find((obj: any) => (obj.patente == veh.patente && obj.importe == veh.importe && obj.duenoId == veh.duenoId && obj.peaje == veh.peaje))
        return result ? true : false
    }

}
