import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { QueryResult } from "typeorm";


export class ObjetivosController extends BaseController {

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
            name: "Codigo",
            type: "number",
            id: "Codigo",
            field: "Codigo",
            fieldName: "Codigo",
            sortable: true,
            hidden: false,
            searchHidden: false
        },
        {
            name: "Cliente",
            type: "number",
            id: "ClienteId",
            field: "ClienteId",
            fieldName: "obj.ClienteId",
            searchComponent: "inpurForClientSearch",
            sortable: true,
            hidden: true,
            searchHidden: false
        },
        {
            name: "Objetivo",
            type: "number",
            id: "ObjetivoId",
            field: "ObjetivoId",
            fieldName: " obj.ObjetivoId",
            searchComponent: "inpurForObjetivoSearch",
            sortable: true,
            hidden: true,
            searchHidden: false
        },
        
        {
            name: "Razón Social",
            type: "string",
            id: "ClienteDenominacion",
            field: "ClienteDenominacion",
            fieldName: "cli.ClienteDenominacion",
            searchType: "string",
            sortable: true,

            searchHidden: false,
            hidden: false,
        },
        {
            name: "Descripcion Objetivo",
            type: "string",
            id: "Descripcion",
            field: "Descripcion",
            fieldName: "Descripcion",
            searchType: "string",
            searchHidden: false
        },
        {
            name: "Grupo Actividad",
            type: "string",
            id: "GrupoActividadDetalle",
            field: "GrupoActividadDetalle",
            fieldName: " gruac.GrupoActividadDetalle",
            sortable: true,
            searchHidden: true
        },
        {
            name: "Sucursal",
            type: "string",
            id: "SucursalDescripcion",
            field: "SucursalDescripcion",
            fieldName: "suc.SucursalDescripcion",
            sortable: true,
            searchHidden: true
        },
        {
            name: "Contrato Desde",
            type: "date",
            id: "ContratoFechaDesde",
            field: "ContratoFechaDesde",
            fieldName: "ContratoFechaDesde",
            searchComponent: "inpurForFechaSearch",
            sortable: true,
            hidden: false,
            searchHidden: false
        },
        {
            name: "Contrato Hasta",
            type: "date",
            id: "ContratoFechaHasta",
            field: "ContratoFechaHasta",
            fieldName: "ContratoFechaHasta",
            searchComponent: "inpurForFechaSearch",
            sortable: true,
            hidden: false,
            searchHidden: false
        },
    ];

    async getGridCols(req, res) {
        this.jsonRes(this.listaColumnas, res);
    }

    async list(req: any, res: Response, next: NextFunction) {

        const filterSql = filtrosToSql(req.body.options.filtros, this.listaColumnas);
        const orderBy = orderToSQL(req.body.options.sort)
        const queryRunner = dataSource.createQueryRunner();
        const fechaActual = new Date()
        const anio = fechaActual.getFullYear()
        const mes = fechaActual.getMonth()

        try {
            const objetivos = await queryRunner.query(
                `SELECT 
                obj.ObjetivoId,
                NEWID() AS id, 
                obj.ClienteId,
                obj.ClienteElementoDependienteId,
                CONCAT(obj.ClienteId, '/', ISNULL(obj.ClienteElementoDependienteId,0)) AS Codigo, 
                cli.ClienteDenominacion,
                obj.ObjetivoDescripcion AS Descripcion, 
                gru.GrupoActividadId,
                gruac.GrupoActividadDetalle,
                suc.SucursalDescripcion,
                ISNULL(eledepcon.ClienteElementoDependienteContratoFechaDesde, clicon.ClienteContratoFechaDesde) AS ContratoFechaDesde,
                ISNULL(eledepcon.ClienteElementoDependienteContratoFechaHasta, clicon.ClienteContratoFechaHasta) AS ContratoFechaHasta

                FROM Objetivo obj 
                LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
                LEFT JOIN ClienteElementoDependienteContrato eledepcon ON eledepcon.ClienteId = obj.ClienteId 
                    AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId 
                    AND EOMONTH(DATEFROMPARTS(@0,@1,1)) >= eledepcon.ClienteElementoDependienteContratoFechaDesde 
                    AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaHasta, '9999-12-31') >= DATEFROMPARTS(@0,@1,1)
                    AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaFinalizacion, '9999-12-31') >= DATEFROMPARTS(@0,@1,1)
                LEFT JOIN  ClienteContrato clicon ON clicon.ClienteId = cli.ClienteId 
                    AND obj.ClienteElementoDependienteId IS NULL 
                    AND EOMONTH(DATEFROMPARTS(@0,@1,1)) >= clicon.ClienteContratoFechaDesde 
                    AND ISNULL(clicon.ClienteContratoFechaHasta, '9999-12-31') >= DATEFROMPARTS(@0,@1,1)
                    AND ISNULL(clicon.ClienteContratoFechaFinalizacion, '9999-12-31') >= DATEFROMPARTS(@0,@1,1)
                LEFT JOIN GrupoActividadObjetivo gru ON gru.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId
                LEFT JOIN GrupoActividad gruac  ON gruac.GrupoActividadId = gru.GrupoActividadId
                LEFT JOIN  ObjetivoSucursal sucobj ON sucobj.ObjetivoSucursalId = obj.ObjetivoEsSucursalId AND sucobj.ObjetivoId = obj.ObjetivoId
                LEFT JOIN Sucursal suc ON suc.SucursalId = sucobj.ObjetivoSucursalSucursalId
                WHERE ${filterSql} ${orderBy}`, [anio,mes])

            console.log("..............." , objetivos.length)

            this.jsonRes(
                {
                    total: objetivos.length,
                    list: objetivos,
                },
                res
            );

        } catch (error) {
            return next(error)
        }

    }
}
