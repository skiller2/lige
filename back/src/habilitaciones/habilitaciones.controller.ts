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
        fieldName: "IIF(c.PersonalId IS NULL,'0','1')",
        formatter: 'collectionFormatter',
        params: { collection: getHabNecesariaOptions, },
        sortable: true,
        hidden: false,
        searchComponent: "inpurForActivo",

    },
     {
        name: "Lugar Habilitación Necesaria",
        type: "string",
        id: "LugarHabilitacionDescripcion",
        field: "LugarHabilitacionDescripcion",
        fieldName: "d.LugarHabilitacionDescripcion",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Habilitación Desde",
        type: "date",
        id: "PersonalHabilitacionDesde",
        field: "PersonalHabilitacionDesde",
        fieldName: "ISNULL(b.PersonalHabilitacionDesde, '9999-12-31')",
        searchComponent: "inpurForFechaSearch",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Habilitación Hasta",
        type: "date",
        id: "PersonalHabilitacionHasta",
        field: "PersonalHabilitacionHasta",
        fieldName: "ISNULL(b.PersonalHabilitacionHasta, '9999-12-31')",
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

const GridDetalleColums: any[] = [
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
        name: "Detalle",
        type: "string",
        id: "Detalle",
        field: "Detalle",
        fieldName: "geshab.Detalle",
        sortable: false,
        hidden: false,
        searchHidden: true
    },
    {
        name: "Fecha Ingreso",
        type: "date",
        id: "AudFechaIng",
        field: "AudFechaIng",
        fieldName: "geshab.AudFechaIng",
        // searchComponent: "inpurForFechaSearch",
        sortable: true,
        hidden: false,
        searchHidden: true
    },
    {
        name: "Estado",
        type: "string",
        id: "Detalle",
        field: "Detalle",
        fieldName: "est.Detalle",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
]

const GridDocColums: any[] = [
    {
        name: "DocumentoId",
        type: "number",
        id: "id",
        field: "id",
        fieldName: "doc.DocumentoId",
        sortable: false,
        hidden: true,
        searchHidden: true
    },
    {
        name: "Tipo Codigo",
        type: "string",
        id: "DocumentoTipoCodigo",
        field: "DocumentoTipoCodigo",
        fieldName: "doctip.DocumentoTipoCodigo",
        sortable: true,
        hidden: false,
        searchHidden: true,
    },
    {
        name: "Fecha Ingreso",
        type: "date",
        id: "DocumentoAudFechaIng",
        field: "DocumentoAudFechaIng",
        fieldName: "doc.DocumentoAudFechaIng",
        // searchComponent: "inpurForFechaSearch",
        sortable: true,
        hidden: false,
        searchHidden: true
    },
    {
        name: "Fecha",
        type: "date",
        id: "DocumentoFecha",
        field: "DocumentoFecha",
        fieldName: " doc.DocumentoFecha",
        // searchComponent: "inpurForFechaSearch",
        sortable: true,
        hidden: false,
        searchHidden: true
    },
    {
        name: "Fecha Vencimiento",
        type: "date",
        id: "DocumentoFechaDocumentoVencimiento",
        field: "DocumentoFechaDocumentoVencimiento",
        fieldName: "doc.DocumentoFechaDocumentoVencimiento",
        // searchComponent: "inpurForFechaSearch",
        sortable: true,
        hidden: false,
        searchHidden: true
    },
]

export class HabilitacionesController extends BaseController {
    
    async getGridCols(req, res, next) {
        this.jsonRes(GridColums, res, next);
    }

    async getGridDetalleCols(req, res, next) {
        this.jsonRes(GridDetalleColums, res);
    }

    async getGridDocCols(req, res, next) {
        this.jsonRes(GridDocColums, res);
    }

    async habilitacionesListQuery(queryRunner: any, periodo: any, filterSql: any, orderBy: any) {
        return await queryRunner.query(`
        SELECT ROW_NUMBER() OVER (ORDER BY per.PersonalId) AS id,
            per.PersonalId, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),' ',TRIM(per.PersonalNombre)) ApellidoNombre, 
            sit.SituacionRevistaDescripcion, sitrev.PersonalSituacionRevistaDesde, IIF(c.PersonalId IS NULL,'0','1') HabNecesaria, 
            d.LugarHabilitacionDescripcion, b.PersonalHabilitacionDesde, b.PersonalHabilitacionHasta, e.GestionHabilitacionEstadoCodigo, 
            est.Detalle Estado, e.AudFechaIng AS FechaEstado, b.NroTramite,
            b.PersonalHabilitacionId, b.PersonalHabilitacionLugarHabilitacionId
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
        WHERE (b.PersonalId IS NOT NULL OR c.PersonalId IS NOT NULL) AND (${filterSql})
        ${orderBy}
        `, [periodo])
    }

    async list(req: any, res: Response, next: NextFunction) {
        const filterSql = filtrosToSql(req.body.options.filtros, GridColums);
        const orderBy = orderToSQL(req.body.options.sort)
        const queryRunner = dataSource.createQueryRunner();
        const periodo = new Date()
        try {
            const habilitaciones = await this.habilitacionesListQuery(queryRunner, periodo, filterSql, orderBy);
            
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

    async listDetalleGestionesQuery(queryRunner: any, PersonalId: any, PersonalHabilitacionId: any, PersonalHabilitacionLugarHabilitacionId: any) {
        return await queryRunner.query(`
        SELECT geshab.Detalle, geshab.AudFechaIng,est.Detalle estado
        FROM GestionHabilitacion geshab
        LEFT JOIN PersonalHabilitacion perhab ON perhab.PersonalId=geshab.PersonalId and perhab.PersonalHabilitacionLugarHabilitacionId=geshab.PersonalHabilitacionLugarHabilitacionId and perhab.PersonalHabilitacionId=geshab.PersonalHabilitacionId
        LEFT JOIN GestionHabilitacionEstado est ON est.GestionHabilitacionEstadoCodigo=geshab.GestionHabilitacionEstadoCodigo
        WHERE perhab.PersonalId = @0 AND perhab.PersonalHabilitacionId = @1 AND perhab.PersonalHabilitacionLugarHabilitacionId = @2
        `, [PersonalId, PersonalHabilitacionId, PersonalHabilitacionLugarHabilitacionId])
    }

    async getDetalleGestiones(req: any, res: Response, next: NextFunction) {
        const PersonalId = req.body.PersonalId
        const PersonalHabilitacionId = req.body.PersonalHabilitacionId
        const PersonalHabilitacionLugarHabilitacionId = req.body.LugarHabilitacionId
        const queryRunner = dataSource.createQueryRunner();
        try {
            const habilitaciones = await this.listDetalleGestionesQuery(queryRunner, PersonalId, PersonalHabilitacionId, PersonalHabilitacionLugarHabilitacionId);
            console.log('Detalle.length:', habilitaciones.length);
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

    async listDocQuery(queryRunner: any, PersonalId: any, PersonalHabilitacionId: any, PersonalHabilitacionLugarHabilitacionId: any) {
        return await queryRunner.query(`
        SELECT doc.DocumentoId,doc.DocumentoDenominadorDocumento, doctip.DocumentoTipoCodigo,doc.DocumentoAudFechaIng, doc.DocumentoFecha,doc.DocumentoFechaDocumentoVencimiento
        FROM PersonalHabilitacion perhab 
        JOIN DocumentoRelaciones docrel on docrel.PersonalId=perhab.PersonalId and docrel.PersonalHabilitacionId=docrel.PersonalHabilitacionId and docrel.PersonalHabilitacionLugarHabilitacionId=perhab.PersonalHabilitacionLugarHabilitacionId
        LEFT JOIN Documento doc on doc.DocumentoId=docrel.DocumentoId
        LEFT JOIN DocumentoTipo doctip on doctip.DocumentoTipoCodigo=doc.DocumentoTipoCodigo
        WHERE perhab.PersonalId = @0 AND perhab.PersonalHabilitacionId = @1 AND perhab.PersonalHabilitacionLugarHabilitacionId = @2
        `, [PersonalId, PersonalHabilitacionId, PersonalHabilitacionLugarHabilitacionId])
    }

    async getDocRelacionados(req: any, res: Response, next: NextFunction) {
        const PersonalId = req.body.PersonalId
        const PersonalHabilitacionId = req.body.PersonalHabilitacionId
        const PersonalHabilitacionLugarHabilitacionId = req.body.LugarHabilitacionId
        const queryRunner = dataSource.createQueryRunner();
        try {
            const habilitaciones = await this.listDocQuery(queryRunner, PersonalId, PersonalHabilitacionId, PersonalHabilitacionLugarHabilitacionId);
            // console.log('Doc.length:', habilitaciones.length);
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

    async getEstadosHabilitaciones(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            const tipos = await queryRunner.query(`
            SELECT est.GestionHabilitacionEstadoCodigo value, est.Detalle label
            FROM GestionHabilitacionEstado est
            `,)

            this.jsonRes(
                {
                    total: tipos.length,
                    list: tipos,
                },
                res
            );

        } catch (error) {
            return next(error)
        }

    }

    async addHabilitacionDetalle(req: any, res: Response, next: NextFunction) {
        const PersonalId = req.body.PersonalId
        const PersonalHabilitacionId = req.body.PersonalHabilitacionId
        const PersonalHabilitacionLugarHabilitacionId = req.body.LugarHabilitacionId
        const ip = this.getRemoteAddress(req)
        const usuario = res.locals.userName
        const fechaActual = new Date()

        const GestionHabilitacionEstadoCodigo = req.body.GestionHabilitacionEstadoCodigo
        const Detalle = req.body.Detalle
        const NroTramite = req.body.NroTramite
        const PersonalHabilitacionDesde = req.body.PersonalHabilitacionDesde
        const PersonalHabilitacionHasta = req.body.PersonalHabilitacionHasta
        const PersonalHabilitacionClase = req.body.PersonalHabilitacionClase
        const AudFechaIng = req.body.AudFechaIng

        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            await queryRunner.query(`
            INSERT INTO GestionHabilitacion (
                GestionHabilitacionCodigo, PersonalId, PersonalHabilitacionLugarHabilitacionId, PersonalHabilitacionId, GestionHabilitacionEstadoCodigo, Detalle
                , AudFechaIng, AudFechaMod, AudUsuarioIng, AudUsuarioMod, AudIpIng, AudIpMod
            ) VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @8, @9, @9);
            `,[ ,PersonalId, PersonalHabilitacionLugarHabilitacionId, PersonalHabilitacionId, GestionHabilitacionEstadoCodigo, Detalle, AudFechaIng, fechaActual, usuario, ip])

            await queryRunner.query(`
            UPDATE PersonalHabilitacion
            SET PersonalHabilitacionDesde = @3, PersonalHabilitacionHasta = @4,PersonalHabilitacionClase = @5, NroTramite = @6
            , AudFechaMod = @7, AudIpMod = @8, AusUsuarioMod = @9
            WHERE PersonalHabilitacionId = @0 AND PersonalId = @1 AND PersonalHabilitacionLugarHabilitacionId = @2
            `,[PersonalHabilitacionId, PersonalId, PersonalHabilitacionLugarHabilitacionId, 
                PersonalHabilitacionDesde, PersonalHabilitacionHasta, PersonalHabilitacionClase, NroTramite,
                fechaActual, ip, usuario
            ])


            await queryRunner.commitTransaction()

        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        }
    }
    
}