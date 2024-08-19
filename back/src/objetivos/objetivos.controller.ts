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
            id: "Grupo",
            field: "Grupo",
            fieldName: "Grupo",
            sortable: true,
            searchHidden: true
        },
        {
            name: "Sucursal",
            type: "string",
            id: "Sucursal",
            field: "Sucursal",
            fieldName: "Sucursal",
            sortable: true,
            searchHidden: true
        },
        {
            name: "Contrato Desde",
            type: "date",
            id: "ContratoDesde",
            field: "ContratoDesde",
            fieldName: "inpurForFechaSearch",
            sortable: true,
            hidden: false,
            searchHidden: false
        },
        {
            name: "Contrato Hasta",
            type: "date",
            id: "ContratoHasta",
            field: "ContratoHasta",
            fieldName: "inpurForFechaSearch",
            sortable: true,
            hidden: false,
            searchHidden: false
        },
    ];

    async getGridCols(req, res) {
        this.jsonRes(this.listaColumnas, res);
    }
}
