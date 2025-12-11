import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { FileUploadController } from "../controller/file-upload.controller"
import { QueryRunner } from "typeorm";

const getHabNecesariaOptions: any[] = [
    { label: 'Si', value: '1' },
    { label: 'No', value: '0' },
]

const GridColums: any[] = [
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
        name: "Personal",
        type: "number",
        id: "PersonalId",
        field: "PersonalId",
        fieldName: "per.PersonalId",
        searchComponent: "inpurForPersonalSearch",
        sortable: false,
        hidden: true,
        searchHidden: true
    },
    {
        name: "CUIT",
        type: "number",
        id: "PersonalCUITCUILCUIT",
        field: "PersonalCUITCUILCUIT",
        fieldName: "cuit.PersonalCUITCUILCUIT",
        sortable: true,
        hidden: false,
        searchHidden: true,
    },
    {
        name: "Apellido Nombre",
        type: "string",
        id: "ApellidoNombre",
        field: "ApellidoNombre",
        fieldName: "ApellidoNombre",
        sortable: true,
        hidden: false,
        searchHidden: true,
    },
    {
        name: "Situacion Revista",
        type: "number",
        id: "SituacionRevistaId",
        field: "SituacionRevistaId",
        fieldName: "sitrev.PersonalSituacionRevistaSituacionId",
        searchComponent: "inpurForSituacionRevistaSearch",
        searchType: "number",
        sortable: true,
        searchHidden: false,
        hidden: true,
    },
    {
        name: "Situación Revista",
        type: "string",
        id: "SituacionRevistaDescripcion",
        field: "SituacionRevistaDescripcion",
        fieldName: "sitrev.SituacionRevistaDescripcion",
        searchType: "string",
        sortable: true,
        hidden: false,
        searchHidden: true,
    },
    {
        name: "Fecha Situación Revista",
        type: "date",
        id: "PersonalSituacionRevistaDesde",
        field: "PersonalSituacionRevistaDesde",
        fieldName: "sitrev.PersonalSituacionRevistaDesde",
        searchComponent: "inpurForFechaSearch",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Habilitacion Necesaria",
        type: "string",
        id: "HabNecesaria",
        field: "HabNecesaria",
        fieldName: "HabNecesaria",
        formatter: 'collectionFormatter',
        params: { collection: getHabNecesariaOptions, },
        sortable: true,
        hidden: false,
        searchHidden: true
    },
    {
        name: "Habilitacion Desde",
        type: "date",
        id: "PersonalHabilitacionDesde",
        field: "PersonalHabilitacionDesde",
        fieldName: "b.PersonalHabilitacionDesde",
        searchComponent: "inpurForFechaSearch",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Habilitacion Hasta",
        type: "date",
        id: "PersonalHabilitacionHasta",
        field: "PersonalHabilitacionHasta",
        fieldName: "b.PersonalHabilitacionHasta",
        searchComponent: "inpurForFechaSearch",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Estado",
        type: "string",
        id: "Estado",
        field: "Estado",
        fieldName: "est.Detalle",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
    {
        name: "Fecha Estado",
        type: "date",
        id: "FechaEstado",
        field: "FechaEstado",
        fieldName: "e.AudFechaIng",
        searchComponent: "inpurForFechaSearch",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Nro Tramite",
        type: "number",
        id: "NroTramite",
        field: "NroTramite",
        fieldName: "b.NroTramite",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
];

export class HabilitacionesController extends BaseController {
    
    async getGridCols(req, res) {
        this.jsonRes(GridColums, res);
    }

    async HabilitacionesListQuery(queryRunner: any, periodo: any, filterSql: any, orderBy: any) {
        return await queryRunner.query(`
        SELECT ROW_NUMBER() OVER (ORDER BY per.PersonalId) AS id,
        per.PersonalId, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),' ',TRIM(per.PersonalNombre)) ApellidoNombre, sit.SituacionRevistaDescripcion, sitrev.PersonalSituacionRevistaDesde, IIF(c.PersonalId IS NULL,'0','1') HabNecesaria, d.LugarHabilitacionDescripcion, b.PersonalHabilitacionDesde, b.PersonalHabilitacionHasta, e.GestionHabilitacionEstadoCodigo, est.Detalle Estado, e.AudFechaIng AS FechaEstado, b.NroTramite
        FROM Personal per
        LEFT JOIN PersonalHabilitacion b ON b.PersonalId=per.PersonalId AND ((b.PersonalHabilitacionDesde < @0 AND ISNULL(b.PersonalHabilitacionHasta,'9999-12-31') > @0) OR (b.PersonalHabilitacionDesde IS NULL AND b.PersonalHabilitacionHasta IS NULL))
        LEFT JOIN PersonalHabilitacionNecesaria c ON c.PersonalId = per.PersonalId AND c.PersonalHabilitacionNecesariaDesde < @0 AND ISNULL(c.PersonalHabilitacionNecesariaHasta,'9999-12-31') > @0
        LEFT JOIN LugarHabilitacion d ON d.LugarHabilitacionId = b.PersonalHabilitacionLugarHabilitacionId OR d.LugarHabilitacionId = c.PersonalHabilitacionNecesariaLugarHabilitacionId
        LEFT JOIN GestionHabilitacion e ON e.GestionHabilitacionCodigo = b.GestionHabilitacionCodigoUlt AND e.PersonalId = b.PersonalId AND e.PersonalHabilitacionLugarHabilitacionId = b.PersonalHabilitacionLugarHabilitacionId AND e.PersonalHabilitacionId = b.PersonalHabilitacionId

        LEFT JOIN 
                (
                SELECT sitrev2.PersonalId, MAX(sitrev2.PersonalSituacionRevistaId) PersonalSituacionRevistaId
                FROM PersonalSituacionRevista sitrev2 
                WHERE @0 >=  sitrev2.PersonalSituacionRevistaDesde AND  @0 <= ISNULL(sitrev2.PersonalSituacionRevistaHasta,'9999-12-31')
                GROUP BY sitrev2.PersonalId
            ) sitrev3  ON sitrev3.PersonalId = per.PersonalId
        LEFT JOIN PersonalSituacionRevista sitrev ON sitrev.PersonalId = per.PersonalId AND sitrev.PersonalSituacionRevistaId = sitrev3.PersonalSituacionRevistaId

        LEFT JOIN SituacionRevista sit ON sit.SituacionRevistaId = sitrev.PersonalSituacionRevistaSituacionId

        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 

        LEFT JOIN GestionHabilitacionEstado est ON est.GestionHabilitacionEstadoCodigo = e.GestionHabilitacionEstadoCodigo
        WHERE b.PersonalId IS NOT NULL OR c.PersonalId IS NOT NULL AND (${filterSql})
        ${orderBy}
        `, [periodo])
    }

    async list(req: any, res: Response, next: NextFunction) {
        const filterSql = filtrosToSql(req.body.options.filtros, GridColums);
        const orderBy = orderToSQL(req.body.options.sort)
        const queryRunner = dataSource.createQueryRunner();
        const periodo = new Date()
        try {
            const habilitaciones = await this.HabilitacionesListQuery(queryRunner, periodo, filterSql, orderBy);
            
            this.jsonRes(
                {
                    total: habilitaciones.length,
                    list: habilitaciones,
                },
                res
            );

        } catch (error) {
            return next(error)
        }

    }
}