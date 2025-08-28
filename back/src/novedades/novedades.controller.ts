import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { FileUploadController } from "../controller/file-upload.controller"
import { QueryRunner } from "typeorm";
import { ObjectId } from "typeorm/browser";

const listaColumnas: any[] = [
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
        id: "NovedadCodigo",
        field: "NovedadCodigo",
        fieldName: "nov.NovedadCodigo",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Sucursal",
        type: "string",
        id: "SucursalDescripcion",
        field: "SucursalDescripcion",
        fieldName: "suc.SucursalDescripcion",
        sortable: true,
        hidden: false,
        searchHidden: true
    },
    {
        name: "Sucursal",
        type: "string",
        id: "SucursalDescripcion",
        field: "SucursalDescripcion",
        fieldName: "suc.SucursalId",
        searchComponent: "inpurForSucursalSearch",
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
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Cod Obj",
        type: "string",
        id: "CodObj",
        field: "CodObj",
        fieldName: "CodObj",
        sortable: true,
        hidden: false,
        searchHidden: true
    },
    {
        name: "GrupoActividad",
        type: "string",
        id: "ApellidoNombreJerarquico",
        field: "ApellidoNombreJerarquico",
        fieldName: "ApellidoNombreJerarquico",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Tipo Nov.",
        type: "string",
        id: "NovedadTipo",
        field: "NovedadTipo",
        fieldName: "NovedadTipo",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Fecha",
        type: "date",
        id: "Fecha",
        field: "Fecha",
        fieldName: "nov.Fecha",
        searchComponent: "inpurForFechaSearch",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Personal",
        type: "string",
        id: "ApellidoNombrePersonal",
        field: "ApellidoNombrePersonal",
        fieldName: "ApellidoNombrePersonal",
        sortable: true,
        hidden: false,
        searchHidden: true
    },
    {
        id: "PersonalId", name: "Personal", field: "PersonalId",
        type: "string",
        fieldName: "nov.PersonalId",
        searchComponent: "inpurForPersonalSearch",
        searchType: "number",
        sortable: true,
        searchHidden: false,
        hidden: false,
      },
    {
        name: "Telefono",
        type: "string",
        id: "Telefono",
        field: "Telefono",
        fieldName: "nov.Telefono",
        sortable: false,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Fecha Visualizacion",
        type: "date",
        id: "VisualizacionFecha",
        field: "VisualizacionFecha",
        fieldName: "nov.VisualizacionFecha",
        sortable: true,
        hidden: false,
        searchHidden: false
    }
];


export class NovedadesController extends BaseController {


    async getGridCols(req, res) {
        this.jsonRes(listaColumnas, res);
    }

    async list(req: any, res: Response, next: NextFunction) {

        const filterSql = filtrosToSql(req.body.options.filtros, listaColumnas);
        const orderBy = orderToSQL(req.body.options.sort)
        const queryRunner = dataSource.createQueryRunner();
        const fechaActual = new Date()
        const anio = fechaActual.getFullYear()
        const mes = fechaActual.getMonth() + 1

        try {
            const objetivos = await queryRunner.query(
                `Select ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) id
         ,nov.NovedadCodigo
        ,suc.SucursalId
        ,suc.SucursalDescripcion
        ,cli.ClienteId
        ,cli.ClienteDenominacion
        ,ele.ClienteElementoDependienteId
        ,obj.ObjetivoId
        , CONCAT(obj.ClienteId, '/', ISNULL(obj.ClienteElementoDependienteId,0)) AS CodObj
        ,ele.ClienteElementoDependienteDescripcion DescripcionObj

        ,CONCAT(TRIM(jerper.PersonalApellido),', ', TRIM(jerper.PersonalNombre)) as ApellidoNombreJerarquico

        ,per.PersonalId
        ,CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) as ApellidoNombrePersonal
        ,nov.Telefono
        ,novtip.Descripcion NovedadTipo
        ,nov.Fecha
        ,nov.VisualizacionFecha
        ,nov.VisualizacionUsuario
        ,1
        From Novedad nov
        LEFT JOIN NovedadTipo novtip on novtip.NovedadTipoCod=nov.NovedadTipoCod
        LEFT JOIN ClienteElementoDependiente ele ON ele.ClienteId=nov.ClienteId and ele.ClienteElementoDependienteId=nov.ClienteElementoDependienteId
        LEFT JOIN Cliente cli on cli.ClienteId=ele.ClienteId
        LEFT JOIN Objetivo obj on obj.ClienteId=nov.ClienteId and obj.ClienteElementoDependienteId=nov.ClienteElementoDependienteId
        LEFT JOIN Personal per on per.PersonalId=nov.PersonalId
        LEFT JOIN GrupoActividadObjetivo gaobj on gaobj.GrupoActividadObjetivoObjetivoId=obj.ObjetivoId and gaobj.GrupoActividadObjetivoDesde<=nov.Fecha and ISNULL(gaobj.GrupoActividadObjetivoHasta,'9999-12-31')>=nov.Fecha
        LEFT JOIN GrupoActividad ga on ga.GrupoActividadId=gaobj.GrupoActividadId
        LEFT JOIN GrupoActividadJerarquico gajer on gajer.GrupoActividadId=ga.GrupoActividadId  and gajer.GrupoActividadJerarquicoDesde<=nov.Fecha and ISNULL(gajer.GrupoActividadJerarquicoHasta,'9999-12-31')>=nov.Fecha and gajer.GrupoActividadJerarquicoComo='J'
        LEFT JOIN Personal jerper on jerper.PersonalId=gajer.GrupoActividadJerarquicoPersonalId
        LEFT JOIN Sucursal suc on suc.SucursalId=ele.ClienteElementoDependienteSucursalId


                
                WHERE ${filterSql} ${orderBy}`, [anio, mes, fechaActual])

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
