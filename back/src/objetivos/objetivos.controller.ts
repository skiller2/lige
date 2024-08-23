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
        const mes = fechaActual.getMonth()+1

        try {
            const objetivos = await queryRunner.query(
                `SELECT 
-- DISTINCT
                obj.ObjetivoId,
                obj.ObjetivoId id, 
                obj.ClienteId,
                obj.ClienteElementoDependienteId,
                CONCAT(obj.ClienteId, '/', ISNULL(obj.ClienteElementoDependienteId,0)) AS Codigo, 
                cli.ClienteDenominacion,
                ISNULL(eledep.ClienteElementoDependienteDescripcion,cli.ClienteDenominacion) Descripcion,                
--                obj.ObjetivoDescripcion AS Descripcion2, --Basura
                gap.GrupoActividadId,
                ga.GrupoActividadDetalle,
                suc.SucursalDescripcion,
                ISNULL(eledepcon.ClienteElementoDependienteContratoFechaDesde, clicon.ClienteContratoFechaDesde) AS ContratoFechaDesde,
                ISNULL(eledepcon.ClienteElementoDependienteContratoFechaHasta, clicon.ClienteContratoFechaHasta) AS ContratoFechaHasta,
 1
                FROM Objetivo obj 
                LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
                LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteId = obj.ClienteId AND eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
					 
					 

					LEFT JOIN (SELECT cc.ClienteId, MAX(cc.ClienteContratoId) ClienteContratoId FROM  ClienteContrato cc WHERE EOMONTH(DATEFROMPARTS(@0,@1,1)) >= cc.ClienteContratoFechaDesde 
                    AND ISNULL(cc.ClienteContratoFechaHasta, '9999-12-31') >= DATEFROMPARTS(@0,@1,1)
                    AND ISNULL(cc.ClienteContratoFechaFinalizacion, '9999-12-31') >= DATEFROMPARTS(@0,@1,1)
					GROUP BY cc.ClienteId) clicon2 ON clicon2.ClienteId = cli.ClienteId AND obj.ClienteElementoDependienteId IS null

					 LEFT JOIN  ClienteContrato clicon ON clicon.ClienteId = cli.ClienteId AND clicon.ClienteContratoId = clicon2.ClienteContratoId
					 
					 
					LEFT JOIN (SELECT ec.ClienteId, ec.ClienteElementoDependienteId, MAX(ec.ClienteElementoDependienteContratoId) ClienteElementoDependienteContratoId FROM ClienteElementoDependienteContrato ec WHERE  EOMONTH(DATEFROMPARTS(@0,@1,1)) >= ec.ClienteElementoDependienteContratoFechaDesde 
                    AND ISNULL(ec.ClienteElementoDependienteContratoFechaHasta, '9999-12-31') >= DATEFROMPARTS(@0,@1,1)
                    AND ISNULL(ec.ClienteElementoDependienteContratoFechaFinalizacion, '9999-12-31') >= DATEFROMPARTS(@0,@1,1)
                GROUP BY ec.ClienteId, ec.ClienteElementoDependienteId
						
					) eledepcon2 ON eledepcon2.ClienteId = obj.ClienteId AND eledepcon2.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
					 
					 
					 LEFT JOIN ClienteElementoDependienteContrato eledepcon ON eledepcon.ClienteId = obj.ClienteId  AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId  AND eledepcon.ClienteElementoDependienteContratoId = eledepcon2.ClienteElementoDependienteContratoId
                          
   				LEFT JOIN (SELECT GrupoActividadObjetivoObjetivoId, MAX(GrupoActividadObjetivoId) GrupoActividadObjetivoId FROM GrupoActividadObjetivo
   				WHERE EOMONTH(DATEFROMPARTS(@0,@1,1)) >= GrupoActividadObjetivoDesde AND DATEFROMPARTS(@0,@1,1) <= ISNULL(GrupoActividadObjetivoHasta,'9999-12-31') 
   				GROUP BY GrupoActividadObjetivoObjetivoId
					) gap2 ON gap2.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId 
      
                LEFT JOIN GrupoActividadObjetivo gap ON gap.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND gap.GrupoActividadObjetivoId=gap2.GrupoActividadObjetivoId
                LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId
		                    
                LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(eledep.ClienteElementoDependienteSucursalId ,cli.ClienteSucursalId)
                

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
