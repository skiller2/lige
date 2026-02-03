import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { json, NextFunction, Request, Response } from "express";
import { filtrosToSql, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { FileUploadController } from "../controller/file-upload.controller"
import { QueryRunner } from "typeorm";
import { AsistenciaController } from "src/controller/asistencia.controller";
import { CustodiaController } from "src/controller/custodia.controller";
import { PersonalController } from "src/controller/personal.controller"
import { max } from "moment";

const getHabNecesariaOptions: any[] = [
    { label: 'Si', value: '1' },
    { label: 'No', value: '0' },
]

const getHabilitacionesClasesOptions: any[] = [
    { label: 'Habilitación', value: 'H' },
    { label: 'Revalidación', value: 'R' },
    // { label: 'Habilitación (C)', value: 'C' },
    { label: 'Renovación', value: 'N' },
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
    // {
    //     id: "PersonalHabilitacionId",
    //     name: "PersonalHabilitacionId",
    //     field: "PersonalHabilitacionId",
    //     fieldName: "vishab.PersonalHabilitacionId",
    //     type: "number",
    //     sortable: false,
    //     hidden: false,
    //     searchHidden: true
    // },
    {
        name: "Apellido Nombre",
        type: "number",
        id: "PersonalId",
        field: "PersonalId",
        fieldName: "per.PersonalId",
        searchComponent: "inputForPersonalSearch",
        sortable: false,
        hidden: true,
        searchHidden: false
    },
    {
        name: "CUIT",
        type: "string",
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
        name: "Sucursal Persona",
        type: "string",
        id: "SucursalDescripcion",
        field: "SucursalDescripcion",
        fieldName: "suc.SucursalId",
        searchComponent: "inputForSucursalSearch",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Situacion Revista",
        type: "number",
        id: "SituacionRevistaId",
        field: "SituacionRevistaId",
        fieldName: "sitrev.PersonalSituacionRevistaSituacionId",
        searchComponent: "inputForSituacionRevistaSearch",
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
        searchComponent: "inputForFechaSearch",
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
        searchComponent: "inputForActivo",
    },
    {
        name: "Lugar Habilitación",
        type: "number",
        id: "LugarHabilitacionId",
        field: "LugarHabilitacionId",
        fieldName: "vishab.LugarHabilitacionId",
        searchComponent: "inputForLugarHabilitacionSearch",
        searchType: "number",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
    {
        name: "Lugar Habilitación",
        type: "string",
        id: "LugarHabilitacionDescripcion",
        field: "LugarHabilitacionDescripcion",
        fieldName: "d.LugarHabilitacionDescripcion",
        sortable: true,
        hidden: false,
        searchHidden: true
    },
    {
        name: "Habilitación Desde",
        type: "date",
        id: "PersonalHabilitacionDesde",
        field: "PersonalHabilitacionDesde",
        fieldName: "ISNULL(b.PersonalHabilitacionDesde, '9999-12-31')",
        searchComponent: "inputForFechaSearch",
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
        searchComponent: "inputForFechaSearch",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Clase",
        type: "string",
        id: "PersonalHabilitacionClase",
        field: "PersonalHabilitacionClase",
        fieldName: "b.PersonalHabilitacionClase",
        searchComponent: "inputForHabilitacionClaseSearch",
        formatter: 'collectionFormatter',
        params: { collection: getHabilitacionesClasesOptions },
        sortable: true,
        hidden: false,
        searchHidden: false,
    },
    {
        name: "Estado",
        type: "string",
        id: "GestionHabilitacionEstadoCodigo",
        field: "GestionHabilitacionEstadoCodigo",
        fieldName: "iif(e.GestionHabilitacionCodigo is null, 'PEN', e.GestionHabilitacionEstadoCodigo)",
        searchComponent: "inputForHabilitacionEstadoSearch",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
    {
        name: "Estado",
        type: "string",
        id: "GestionHabilitacionEstado",
        field: "GestionHabilitacionEstado",
        fieldName: "IIF(e.GestionHabilitacionCodigo IS NULL, 'Pendiente', est.Detalle)",
        sortable: true,
        hidden: false,
        searchHidden: true
    },
    {
        name: "Detalle",
        type: "string",
        id: "Detalle",
        field: "Detalle",
        fieldName: "e.Detalle",
        sortable: true,
        hidden: false,
        searchHidden: true,
        showGridColumn: false

    },
    {
        name: "Fecha Estado",
        type: "date",
        id: "FechaEstado",
        field: "FechaEstado",
        fieldName: "e.AudFechaIng",
        searchComponent: "inputForFechaSearch",
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
    {
        name: "Dias Faltantes Vencimiento",
        type: "number",
        id: "DiasFaltantesVencimiento",
        field: "DiasFaltantesVencimiento",
        fieldName: " IIF(b.PersonalId IS NULL, 0, dias.DiasFaltantesVencimiento)",
        sortable: true,
        hidden: false,
        searchHidden: false,
        searchType: "numberAdvanced",
        searchComponent: "inputForNumberAdvancedSearch",
    },
    {
        name: "Fecha Ingreso",
        type: "date",
        id: "AudFechaIng",
        field: "AudFechaIng",
        fieldName: "b.AudFechaIng",
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
        fieldName: "b.AudUsuarioIng",
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
        fieldName: "b.AudFechaMod",
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
        fieldName: "b.AudUsuarioMod",
        sortable: true,
        hidden: false,
        searchHidden: true,
        showGridColumn: false

    }
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
        // searchComponent: "inputForFechaSearch",
        sortable: false,
        hidden: false,
        searchHidden: true
    },
    {
        name: "Estado",
        type: "string",
        id: "estado",
        field: "estado",
        fieldName: "est.Detalle",
        sortable: false,
        hidden: false,
        searchHidden: false,
        maxWidth: 250
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
        name: "Tipo",
        type: "string",
        id: "DocumentoTipoDetalle",
        field: "DocumentoTipoDetalle",
        fieldName: "doctip.DocumentoTipoDetalle",
        sortable: true,
        hidden: false,
        searchHidden: true,
    },
    {
        name: "Descripción",
        type: "string",
        id: "Descripcion",
        field: "Descripcion",
        fieldName: "Descripcion",
        sortable: false,
        hidden: false,
        searchHidden: false
    },
    // {
    //     name: "Fecha Ingreso",
    //     type: "date",
    //     id: "DocumentoAudFechaIng",
    //     field: "DocumentoAudFechaIng",
    //     fieldName: "doc.DocumentoAudFechaIng",
    //     // searchComponent: "inputForFechaSearch",
    //     sortable: true,
    //     hidden: false,
    //     searchHidden: true
    // },
    {
        name: "Desde",
        type: "date",
        id: "DocumentoFecha",
        field: "DocumentoFecha",
        fieldName: " doc.DocumentoFecha",
        // searchComponent: "inputForFechaSearch",
        sortable: true,
        hidden: false,
        searchHidden: true
    },
    {
        name: "Hasta",
        type: "date",
        id: "DocumentoFechaDocumentoVencimiento",
        field: "DocumentoFechaDocumentoVencimiento",
        fieldName: "doc.DocumentoFechaDocumentoVencimiento",
        // searchComponent: "inputForFechaSearch",
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

    async getHabilitacionesClasesOptions(req, res, next) {
        this.jsonRes(getHabilitacionesClasesOptions, res);
    }

    async habilitacionesListQuery(queryRunner: any, periodo: any, filterSql: any, orderBy: any) {
        periodo.setHours(0, 0, 0, 0)
        return await queryRunner.query(`
        SELECT ROW_NUMBER() OVER (ORDER BY per.PersonalId) AS id,
            per.PersonalId, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),' ',TRIM(per.PersonalNombre)) ApellidoNombre, 
            sit.SituacionRevistaDescripcion, sitrev.PersonalSituacionRevistaDesde, 
            d.LugarHabilitacionDescripcion, b.PersonalHabilitacionDesde, b.PersonalHabilitacionHasta, 
            iif(e.GestionHabilitacionCodigo is null, 'PEN', e.GestionHabilitacionEstadoCodigo) GestionHabilitacionEstadoCodigo, e.Detalle,
            est.Detalle Estado, e.AudFechaIng AS FechaEstado, b.NroTramite, b.PersonalHabilitacionClase,
            b.PersonalHabilitacionId, b.PersonalHabilitacionLugarHabilitacionId, vishab.LugarHabilitacionId,
		    IIF(b.PersonalHabilitacionId IS NULL, 0, dias.DiasFaltantesVencimiento) as DiasFaltantesVencimiento,

			IIF(c.PersonalId IS NULL,'0','1') HabNecesaria,
            IIF(e.GestionHabilitacionCodigo IS NULL, 'Pendiente', est.Detalle) AS GestionHabilitacionEstado,
            suc.SucursalId, suc.SucursalDescripcion,
            b.AudFechaIng, b.AudFechaMod, b.AudUsuarioIng, b.AusUsuarioMod

        FROM Personal per
   
		JOIN (
            SELECT b.PersonalId, b.PersonalHabilitacionLugarHabilitacionId LugarHabilitacionId
            FROM  PersonalHabilitacion b 
            WHERE b.PersonalHabilitacionDesde <= @0 AND ISNULL(b.PersonalHabilitacionHasta, '9999-12-31') >= @0

            UNION

            SELECT c.PersonalId, c.PersonalHabilitacionNecesariaLugarHabilitacionId LugarHabilitacionId
            FROM PersonalHabilitacionNecesaria c 
            
        ) vishab on vishab.PersonalId=per.PersonalId
	
		LEFT JOIN PersonalHabilitacion b ON b.PersonalId=per.PersonalId  and b.PersonalHabilitacionLugarHabilitacionId=vishab.LugarHabilitacionId and ((b.PersonalHabilitacionDesde <= @0 AND ISNULL(b.PersonalHabilitacionHasta, '9999-12-31') >= @0) or b.PersonalHabilitacionDesde is null or b.PersonalHabilitacionHasta is null) 
                and b.PersonalHabilitacionClase != 'C'
		LEFT JOIN PersonalHabilitacionNecesaria c ON c.PersonalId = per.PersonalId and c.PersonalHabilitacionNecesariaLugarHabilitacionId=vishab.LugarHabilitacionId
		LEFT JOIN LugarHabilitacion d ON d.LugarHabilitacionId = vishab.LugarHabilitacionId 

		LEFT JOIN GestionHabilitacion e ON e.GestionHabilitacionCodigo = b.GestionHabilitacionCodigoUlt AND e.PersonalId = vishab.PersonalId AND e.PersonalHabilitacionLugarHabilitacionId = vishab.LugarHabilitacionId AND e.PersonalHabilitacionId = b.PersonalHabilitacionId

        LEFT JOIN (
            SELECT sitrev2.PersonalId, MAX(sitrev2.PersonalSituacionRevistaId) PersonalSituacionRevistaId
            FROM PersonalSituacionRevista sitrev2 
            WHERE @0 >=  sitrev2.PersonalSituacionRevistaDesde AND  @0 <= ISNULL(sitrev2.PersonalSituacionRevistaHasta,'9999-12-31')
            GROUP BY sitrev2.PersonalId
        ) sitrev3  ON sitrev3.PersonalId = per.PersonalId
        LEFT JOIN PersonalSituacionRevista sitrev ON sitrev.PersonalId = per.PersonalId AND sitrev.PersonalSituacionRevistaId = sitrev3.PersonalSituacionRevistaId

        LEFT JOIN SituacionRevista sit ON sit.SituacionRevistaId = sitrev.PersonalSituacionRevistaSituacionId

        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 

        LEFT JOIN GestionHabilitacionEstado est ON est.GestionHabilitacionEstadoCodigo = e.GestionHabilitacionEstadoCodigo
		LEFT JOIN (
			SELECT 
				b2.PersonalId,
				b2.PersonalHabilitacionId,
				b2.PersonalHabilitacionLugarHabilitacionId,
				CASE 
					WHEN b2.PersonalHabilitacionHasta>=@0 THEN DATEDIFF(DAY, @0, b2.PersonalHabilitacionHasta)
                    --WHEN b2.PersonalHabilitacionHasta IS NULL and b2.PersonalHabilitacionDesde is null THEN NULL
					--WHEN b2.PersonalHabilitacionHasta IS NULL AND b2.PersonalHabilitacionDesde IS NOT NULL THEN NULL
					ELSE 0
				END AS DiasFaltantesVencimiento
			FROM PersonalHabilitacion b2
		) dias ON dias.PersonalId = vishab.PersonalId AND dias.PersonalHabilitacionId = b.PersonalHabilitacionId AND dias.PersonalHabilitacionLugarHabilitacionId = vishab.LugarHabilitacionId

        LEFT JOIN PersonalSucursalPrincipal sucper ON sucper.PersonalId = per.PersonalId AND sucper.PersonalSucursalPrincipalId = (SELECT MAX(a.PersonalSucursalPrincipalId) PersonalSucursalPrincipalId FROM PersonalSucursalPrincipal a WHERE a.PersonalId = per.PersonalId)
        LEFT JOIN Sucursal suc ON suc.SucursalId=sucper.PersonalSucursalPrincipalSucursalId
        WHERE d.LugarHabilitacionId != 9
        and (${filterSql})
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
        } finally {
            await queryRunner.release()
        }

    }

    async listDetalleGestionesQuery(queryRunner: any, PersonalId: any, PersonalHabilitacionId: any, PersonalHabilitacionLugarHabilitacionId: any) {
        return await queryRunner.query(`
        SELECT ROW_NUMBER() OVER (ORDER BY geshab.GestionHabilitacionCodigo) id, geshab.GestionHabilitacionCodigo, geshab.Detalle, geshab.AudFechaIng, est.Detalle estado
        FROM GestionHabilitacion geshab
        LEFT JOIN PersonalHabilitacion perhab ON perhab.PersonalId=geshab.PersonalId and perhab.PersonalHabilitacionLugarHabilitacionId=geshab.PersonalHabilitacionLugarHabilitacionId and perhab.PersonalHabilitacionId=geshab.PersonalHabilitacionId
        LEFT JOIN GestionHabilitacionEstado est ON est.GestionHabilitacionEstadoCodigo=geshab.GestionHabilitacionEstadoCodigo
        WHERE perhab.PersonalId = @0 AND perhab.PersonalHabilitacionId = @1 AND perhab.PersonalHabilitacionLugarHabilitacionId = @2
        ORDER BY geshab.AudFechaIng DESC
        `, [PersonalId, PersonalHabilitacionId, PersonalHabilitacionLugarHabilitacionId])
    }

    async getDetalleGestiones(req: any, res: Response, next: NextFunction) {
        const PersonalId = req.body.PersonalId
        const PersonalHabilitacionId = req.body.PersonalHabilitacionId
        const PersonalHabilitacionLugarHabilitacionId = req.body.LugarHabilitacionId
        const queryRunner = dataSource.createQueryRunner();
        try {
            const habilitaciones = await this.listDetalleGestionesQuery(queryRunner, PersonalId, PersonalHabilitacionId, PersonalHabilitacionLugarHabilitacionId);

            this.jsonRes(
                {
                    total: habilitaciones.length,
                    list: habilitaciones,
                },
                res
            );

        } catch (error) {
            return next(error)
        } finally {
            await queryRunner.release()
        }

    }

    async listDocQuery(queryRunner: any, PersonalId: any, PersonalHabilitacionId: any, PersonalHabilitacionLugarHabilitacionId: any) {
        return await queryRunner.query(`
        SELECT doc.DocumentoId AS id, doc.DocumentoDenominadorDocumento Descripcion, doctip.DocumentoTipoCodigo, doctip.DocumentoTipoDetalle,doc.DocumentoAudFechaIng, doc.DocumentoFecha,doc.DocumentoFechaDocumentoVencimiento
        , CONCAT('api/file-upload/downloadFile/', doc.DocumentoId, '/Documento/0') url, doc.DocumentoNombreArchivo AS NombreArchivo, 1 AS canDelete
        FROM PersonalHabilitacion perhab 
        JOIN Documento doc ON doc.PersonalId=perhab.PersonalId and doc.PersonalHabilitacionId=perhab.PersonalHabilitacionId and doc.PersonalHabilitacionLugarHabilitacionId=perhab.PersonalHabilitacionLugarHabilitacionId
        LEFT JOIN DocumentoTipo doctip ON doctip.DocumentoTipoCodigo=doc.DocumentoTipoCodigo
        WHERE perhab.PersonalId = @0 AND perhab.PersonalHabilitacionId = @1 AND perhab.PersonalHabilitacionLugarHabilitacionId = @2
        `, [PersonalId, PersonalHabilitacionId, PersonalHabilitacionLugarHabilitacionId])
    }

    async getDocRelacionados(req: any, res: Response, next: NextFunction) {
        const PersonalId = req.body.PersonalId
        const PersonalHabilitacionId = req.body.PersonalHabilitacionId
        const PersonalHabilitacionLugarHabilitacionId = req.body.LugarHabilitacionId
        const queryRunner = dataSource.createQueryRunner();

        const fechaActual = new Date()
        fechaActual.setHours(0, 0, 0, 0)
        try {

            const docs = await queryRunner.query(`
  SELECT doc.DocumentoImagenDocumentoId id, '' Descripcion, param.DocumentoImagenParametroDescripcion as DocumentoTipoDetalle, null AS DocumentoAudFechaIng, null AS DocumentoFecha, null AS DocumentoFechaDocumentoVencimiento
                , CONCAT('api/file-upload/downloadFile/', doc.DocumentoImagenDocumentoId, '/DocumentoImagenDocumento/0') url, doc.DocumentoImagenDocumentoBlobNombreArchivo NombreArchivo, 0 AS canDelete,
				CASE 
                   WHEN CHARINDEX('.', doc.DocumentoImagenDocumentoBlobNombreArchivo) > 0 
                   THEN LOWER(RIGHT(doc.DocumentoImagenDocumentoBlobNombreArchivo,CHARINDEX('.', REVERSE(doc.DocumentoImagenDocumentoBlobNombreArchivo)) - 1))
                   ELSE ''
                END as TipoArchivo
            FROM DocumentoImagenDocumento doc
            LEFT JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = doc.DocumentoImagenParametroId
            WHERE doc.PersonalId IN (@0)

UNION ALL
           SELECT doc.DocumentoId AS id, doc.DocumentoDenominadorDocumento Descripcion,doctip.DocumentoTipoDetalle, doc.DocumentoAudFechaIng, doc.DocumentoFecha, doc.DocumentoFechaDocumentoVencimiento
                , CONCAT('api/file-upload/downloadFile/', doc.DocumentoId, '/Documento/0') url, doc.DocumentoNombreArchivo AS NombreArchivo, 0 AS canDelete,
				CASE 
                   WHEN CHARINDEX('.', doc.DocumentoNombreArchivo) > 0 
                   THEN LOWER(RIGHT(doc.DocumentoNombreArchivo, CHARINDEX('.', REVERSE(doc.DocumentoNombreArchivo)) - 1))
                   ELSE ''
                END as TipoArchivo
            FROM Documento doc
            LEFT JOIN DocumentoTipo doctip ON doctip.DocumentoTipoCodigo = doc.DocumentoTipoCodigo
            WHERE doc.PersonalId = @0  and doc.DocumentoTipoCodigo IN ('DOCIDEDOR', 'DOCIDEFRE', 'PERREI', 'PERANT', 'FOTO', 'CLU')

UNION ALL

SELECT doc.DocumentoImagenEstudioId id, 
			 CASE
				WHEN pere.PersonalEstudioCursoId is null then CONCAT(TRIM(TipoEstudioDescripcion) , ' - ', TRIM(pere.PersonalEstudioTitulo))
				when pere.PersonalEstudioCursoId is not null then CONCAT(TRIM(TipoEstudioDescripcion),' - ', ch.CursoHabilitacionDescripcion)
				else pere.PersonalEstudioTitulo
				end as Descripcion, 'Estudio' DocumentoTipoDetalle, null AS DocumentoAudFechaIng, pere.PersonalEstudioOtorgado AS DocumentoFecha, pere.PersonalEstudioHasta AS DocumentoFechaDocumentoVencimiento
                , CONCAT('api/file-upload/downloadFile/', doc.DocumentoImagenEstudioId, '/DocumentoImagenDocumento/0') url, doc.DocumentoImagenEstudioBlobNombreArchivo NombreArchivo, 0 AS canDelete,
				CASE 
                   WHEN CHARINDEX('.', doc.DocumentoImagenEstudioBlobNombreArchivo) > 0 
                   THEN LOWER(RIGHT(doc.DocumentoImagenEstudioBlobNombreArchivo, CHARINDEX('.', REVERSE(doc.DocumentoImagenEstudioBlobNombreArchivo)) - 1))
                   ELSE ''
                END as TipoArchivo
            FROM PersonalEstudio pere
            JOIN DocumentoImagenEstudio doc ON doc.PersonalId = pere.PersonalId AND doc.DocumentoImagenEstudioId = pere.PersonalEstudioPagina1Id
            left JOIN TipoEstudio tipo ON tipo.TipoEstudioId = pere.TipoEstudioId
			Left join  CursoHabilitacion ch on ch.CursoHabilitacionId=pere.PersonalEstudioCursoId
            LEFT JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = doc.DocumentoImagenParametroId
            WHERE pere.PersonalId IN (@0) and (pere.PersonalEstudioCursoId IN (2,3,4,5,6,7,8,9,10,12,13,14,15,16) or pere.PersonalEstudioCursoId is null)

UNION ALL
            SELECT curso.DocumentoImagenCursoId id, CONCAT(param.DocumentoImagenParametroDescripcion,' - ', TRIM(curhab.CursoHabilitacionDescripcion)) Descripcion, 'Estudio' DocumentoTipoDetalle, null AS DocumentoAudFechaIng, perc.PersonalCursoDesde AS DocumentoFecha, perc.PersonalCursoHasta AS DocumentoFechaDocumentoVencimiento
                , CONCAT('api/file-upload/downloadFile/', curso.DocumentoImagenCursoId, '/DocumentoImagenCurso/0') url, curso.DocumentoImagenCursoBlobNombreArchivo NombreArchivo, 0 AS canDelete,
				CASE 
                   WHEN CHARINDEX('.', curso.DocumentoImagenCursoBlobNombreArchivo) > 0 
                   THEN LOWER(RIGHT(curso.DocumentoImagenCursoBlobNombreArchivo, CHARINDEX('.', REVERSE(curso.DocumentoImagenCursoBlobNombreArchivo)) - 1))
                   ELSE ''
                END as TipoArchivo
            FROM PersonalCurso perc
            JOIN CursoHabilitacion curhab ON curhab.CursoHabilitacionId = perc.PersonalCursoHabilitacionId
            JOIN DocumentoImagenCurso curso  ON curso.PersonalId = perc.PersonalId AND curso.DocumentoImagenCursoId = perc.PersonalCursoDocumentoImagenId
            LEFT JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = curso.DocumentoImagenParametroId
            WHERE perc.PersonalId IN (@0) AND perc.PersonalCursoDesaprobado = 'N' AND perc.PersonalCursoDesde <= @1 AND ISNULL(perc.PersonalCursoHasta, '9999-12-31') >= @1
                AND perc.PersonalCursoHabilitacionId IN (2,3,4,5,6,7,8,9,10,12,13,14,15,16) and perc.PersonalCursoDesde<=@1 and ISNULL(perc.PersonalCursoHasta, '9999-12-31')>=@1
         
UNION ALL
            
 SELECT rein.DocumentoImagenCertificadoReincidenciaId id,'' Descripcion, param.DocumentoImagenParametroDescripcion DocumentoTipoDetalle,  null DocumentoAudFechaIng, pr.PersonalCertificadoReincidenciaVigenciaDesde DocumentoFecha,pr.PersonalCertificadoReincidenciaVencimiento DocumentoFechaDocumentoVencimiento,
        CONCAT('api/file-upload/downloadFile/', rein.DocumentoImagenCertificadoReincidenciaId, '/DocumentoImagenCertificadoReincidencia/0') url, rein.DocumentoImagenCertificadoReincidenciaBlobNombreArchivo NombreArchivo,  0 AS canDelete,
        DocumentoImagenCertificadoReincidenciaBlobTipoArchivo TipoArchivo
        FROM DocumentoImagenCertificadoReincidencia rein
		JOIN PersonalCertificadoReincidencia pr on pr.PersonalId=rein.PersonalId and  rein.DocumentoImagenCertificadoReincidenciaId=pr.PersonalCertificadoReincidenciaCertificadoId
        LEFT JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = rein.DocumentoImagenParametroId
        WHERE rein.PersonalId IN (@0) and pr.PersonalCertificadoReincidenciaVigenciaDesde<=@1 and isnull(pr.PersonalCertificadoReincidenciaVencimiento, '9999-12-31')>=@1

UNION ALL 

SELECT ren.DocumentoImagenRenarId id, '' Descripcion, param.DocumentoImagenParametroDescripcion DocumentoTipoDetalle, null DocumentoAudFechaIng, pr.PersonalRenarDesde, pr.PersonalRenarHasta,
        CONCAT('api/file-upload/downloadFile/', ren.DocumentoImagenRenarId, '/DocumentoImagenRenar/0') url,  ren.DocumentoImagenRenarBlobNombreArchivo NombreArchivo, 0 AS canDelete,
        DocumentoImagenRenarBlobTipoArchivo TipoArchivo
		FROM DocumentoImagenRenar ren
		LEFT JOIN PersonalRenar pr on pr.PersonalId=ren.PersonalId and pr.PersonalRenarDocumentoImagenId=ren.DocumentoImagenRenarId
        LEFT JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = ren.DocumentoImagenParametroId
        WHERE ren.PersonalId IN (@0)

UNION ALL


 SELECT doc.DocumentoId AS id, doc.DocumentoDenominadorDocumento Descripcion, doctip.DocumentoTipoDetalle,doc.DocumentoAudFechaIng, doc.DocumentoFecha,doc.DocumentoFechaDocumentoVencimiento
        , CONCAT('api/file-upload/downloadFile/', doc.DocumentoId, '/Documento/0') url, doc.DocumentoNombreArchivo AS NombreArchivo, 1 AS canDelete,
		CASE 
                   WHEN CHARINDEX('.', doc.DocumentoNombreArchivo) > 0 
                   THEN lower(RIGHT(doc.DocumentoNombreArchivo, CHARINDEX('.', REVERSE(doc.DocumentoNombreArchivo)) - 1))
                   ELSE ''
                END as TipoArchivo
        FROM PersonalHabilitacion perhab 
        JOIN Documento doc ON doc.PersonalId=perhab.PersonalId and doc.PersonalHabilitacionId=perhab.PersonalHabilitacionId and doc.PersonalHabilitacionLugarHabilitacionId=perhab.PersonalHabilitacionLugarHabilitacionId
        LEFT JOIN DocumentoTipo doctip ON doctip.DocumentoTipoCodigo=doc.DocumentoTipoCodigo
        WHERE perhab.PersonalId = @0 AND perhab.PersonalHabilitacionId = @3 AND perhab.PersonalHabilitacionLugarHabilitacionId = @2



                        `, [PersonalId, fechaActual, PersonalHabilitacionLugarHabilitacionId, PersonalHabilitacionId]);



            this.jsonRes(
                {
                    total: docs.length,
                    docs,
                },
                res
            );

        } catch (error) {
            return next(error)
        } finally {
            await queryRunner.release()
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
        } finally {
            await queryRunner.release()
        }

    }

    async getPersonalHabilitacion(req: any, res: Response, next: NextFunction) {
        const PersonalId = req.body.personalId
        const PersonalHabilitacionId = req.body.personalHabilitacionId
        // const PersonalHabilitacionLugarHabilitacionId = req.body.lugarHabilitacionId
        const queryRunner = dataSource.createQueryRunner();
        try {
            const PersonalHabilitacion = await queryRunner.query(`
            SELECT 
            perhab.PersonalHabilitacionId, perhab.PersonalId, perhab.PersonalHabilitacionLugarHabilitacionId AS LugarHabilitacionId
            , perhab.PersonalHabilitacionDesde, perhab.PersonalHabilitacionHasta, perhab.PersonalHabilitacionClase , perhab.NroTramite
            FROM PersonalHabilitacion perhab 
            WHERE perhab.PersonalHabilitacionId = @0 AND perhab.PersonalId = @1
            `, [PersonalHabilitacionId, PersonalId])

            let HabilitacionCategoriaCodigos: string[] = []
            const HabilitacionCategorias = await this.getHabilitacionCategoriaByPersonalHabilitacionIdQuery(queryRunner, PersonalId, PersonalHabilitacionId)
            for (const obj of HabilitacionCategorias)
                HabilitacionCategoriaCodigos.push(obj.HabilitacionCategoriaCodigo)

            const obj = {
                ...PersonalHabilitacion[0],
                HabilitacionCategoriaCodigos
            }

            this.jsonRes(obj, res);

        } catch (error) {
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async getHabilitacionCategoriaByPersonalHabilitacionIdQuery(queryRunner: any, PersonalId: any, PersonalHabilitacionId: any) {
        return await queryRunner.query(`
            SELECT 
                habcatper.PersonalId, habcatper.PersonalHabilitacionId, habcatper.PersonalHabilitacionLugarHabilitacionId AS LugarHabilitacionId
                , habcatper.HabilitacionCategoriaCodigo, habcatper.Desde, habcatper.Hasta
            FROM HabilitacionCategoriaPersonal habcatper 
            WHERE habcatper.PersonalHabilitacionId = @0 AND habcatper.PersonalId = @1
        `, [PersonalHabilitacionId, PersonalId])
    }

    async getGestionHabilitacion(req: any, res: Response, next: NextFunction) {
        const GestionHabilitacionCodigo = req.body.codigo
        const PersonalId = req.body.personalId
        const PersonalHabilitacionId = req.body.personalHabilitacionId
        const PersonalHabilitacionLugarHabilitacionId = req.body.lugarHabilitacionId
        const queryRunner = dataSource.createQueryRunner();
        try {
            const PersonalHabilitacion = await queryRunner.query(`
            SELECT geshab.GestionHabilitacionCodigo,
            geshab.GestionHabilitacionEstadoCodigo, geshab.Detalle, geshab.AudFechaIng
            FROM GestionHabilitacion geshab 
            WHERE geshab.GestionHabilitacionCodigo = @0 AND geshab.PersonalId = @1 AND geshab.PersonalHabilitacionId = @2 AND geshab.PersonalHabilitacionLugarHabilitacionId = @3
            `, [GestionHabilitacionCodigo, PersonalId, PersonalHabilitacionId, PersonalHabilitacionLugarHabilitacionId])

            this.jsonRes(PersonalHabilitacion[0], res);

        } catch (error) {
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async addHabilitacionDetalle(req: any, res: Response, next: NextFunction) {
        const PersonalId = req.body.PersonalId
        const PersonalHabilitacionId = req.body.PersonalHabilitacionId
        const LugarHabilitacionId = req.body.LugarHabilitacionId
        const HabilitacionCategoriaCodigos = req.body.HabilitacionCategoriaCodigos
        if (!PersonalHabilitacionId) {
            return this.addHabilitacion(req, res, next)
        }
        const ip = this.getRemoteAddress(req)
        const usuario = res.locals.userName
        const fechaActual = new Date()

        const GestionHabilitacionEstadoCodigo = req.body.GestionHabilitacionEstadoCodigo
        const Detalle = req.body.Detalle
        const NroTramite = req.body.NroTramite
        const PersonalHabilitacionDesde: Date = req.body.PersonalHabilitacionDesde ? new Date(req.body.PersonalHabilitacionDesde) : null
        const PersonalHabilitacionHasta: Date = req.body.PersonalHabilitacionHasta ? new Date(req.body.PersonalHabilitacionHasta) : null
        const PersonalHabilitacionClase = req.body.PersonalHabilitacionClase
        // const AudFechaIng = req.body.AudFechaIng
        const documentos: any[] = req.body.documentos

        if (PersonalHabilitacionDesde) PersonalHabilitacionDesde.setHours(0, 0, 0, 0)
        if (PersonalHabilitacionHasta) PersonalHabilitacionHasta.setHours(0, 0, 0, 0)

        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            //Validacion
            const valForm: any = await this.valHabilitacionesForm(queryRunner, req.body)
            if (valForm instanceof ClientException)
                throw valForm

            //HabilitacionCategoriaPersonal
            await this.setHabilitacionCategoriaPersonal(
                queryRunner
                , PersonalId
                , PersonalHabilitacionId
                , LugarHabilitacionId
                , HabilitacionCategoriaCodigos
                , usuario, ip
            )

            //Obtiene el Ultimo Codigo registrado
            let result = await queryRunner.query(`
                SELECT ISNULL(GestionHabilitacionCodigoUlt, 0) CodigoUlt
                FROM PersonalHabilitacion
                WHERE PersonalHabilitacionId = @0 AND PersonalId = @1 AND PersonalHabilitacionLugarHabilitacionId = @2
            `, [PersonalHabilitacionId, PersonalId, LugarHabilitacionId])
            const newCodigoUlt = result[0].CodigoUlt + 1

            //Actualiza el Ultimo Codigo registrado
            await queryRunner.query(`
                UPDATE PersonalHabilitacion
                SET PersonalHabilitacionDesde = @3, PersonalHabilitacionHasta = @4,PersonalHabilitacionClase = @5, GestionHabilitacionCodigoUlt = @6, NroTramite = @7
                , AudFechaMod = @8, AudIpMod = @9, AusUsuarioMod = @10
                WHERE PersonalHabilitacionId = @0 AND PersonalId = @1 AND PersonalHabilitacionLugarHabilitacionId = @2
            `, [PersonalHabilitacionId, PersonalId, LugarHabilitacionId,
                PersonalHabilitacionDesde, PersonalHabilitacionHasta, PersonalHabilitacionClase, newCodigoUlt, NroTramite,
                fechaActual, ip, usuario
            ])

            //Inserta el Codigo registrado
            await queryRunner.query(`
                INSERT INTO GestionHabilitacion (GestionHabilitacionCodigo, PersonalId, PersonalHabilitacionLugarHabilitacionId, PersonalHabilitacionId, GestionHabilitacionEstadoCodigo, Detalle
                , AudFechaIng, AudFechaMod, AudUsuarioIng, AudUsuarioMod, AudIpIng, AudIpMod
                ) VALUES (@0, @1, @2, @3, @4, @5, @6, @6, @7, @7, @8, @8)
            `, [newCodigoUlt, PersonalId, LugarHabilitacionId, PersonalHabilitacionId, GestionHabilitacionEstadoCodigo, Detalle, fechaActual, usuario, ip])


            //Datos para la denominacion del documento
            let infoPersonal = await PersonalController.infoPersonalQuery(PersonalId, fechaActual.getFullYear(), fechaActual.getMonth() + 1)
            const cuit = infoPersonal[0].PersonalCUITCUILCUIT;
            result = await queryRunner.query(`
                SELECT TRIM(LugarHabilitacionDescripcion) Descripcion
                FROM LugarHabilitacion
                WHERE LugarHabilitacionId = @0
            `, [LugarHabilitacionId])
            const lugarHabilitacionDescripcion = result[0].Descripcion

            //Registra documentos
            for (const docs of documentos) {
                if (docs.file?.[0]) {
                    const file = docs.file[0]

                    const DocumentoFecha = file.DocumentoFecha ? new Date(file.DocumentoFecha) : null
                    const DocumentoFechaDocumentoVencimiento = file.DocumentoFechaDocumentoVencimiento ? new Date(file.DocumentoFechaDocumentoVencimiento) : null

                    if (DocumentoFecha) DocumentoFecha.setHours(0, 0, 0, 0)
                    if (DocumentoFechaDocumentoVencimiento) DocumentoFechaDocumentoVencimiento.setHours(0, 0, 0, 0)

                    // CUIT- Tipo Documento - Lugar habilitación
                    const den_documento = `${cuit}-${file.doctipo_id}-${lugarHabilitacionDescripcion}`

                    const IdsRelacionados = {
                        PersonalId: PersonalId,
                        PersonalHabilitacionId: PersonalHabilitacionId,
                        PersonalHabilitacionLugarHabilitacionId: LugarHabilitacionId
                    }
                    const uploadResult = await FileUploadController.handleDOCUploadV2(null, DocumentoFecha, DocumentoFechaDocumentoVencimiento, den_documento, null, null, file, usuario, ip, queryRunner, IdsRelacionados)

                }
            }

            // throw new ClientException(`DEBUG`)

            await queryRunner.commitTransaction()
            this.jsonRes({ GestionHabilitacionCodigo: newCodigoUlt, AudFechaIng: fechaActual }, res, 'Carga exitosa');
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        }
    }

    async updateHabilitacionDetalle(req: any, res: Response, next: NextFunction) {
        const PersonalId = req.body.PersonalId
        const PersonalHabilitacionId = req.body.PersonalHabilitacionId
        const LugarHabilitacionId = req.body.LugarHabilitacionId
        const HabilitacionCategoriaCodigos = req.body.HabilitacionCategoriaCodigos
        const GestionHabilitacionCodigo = req.body.GestionHabilitacionCodigo
        const ip = this.getRemoteAddress(req)
        const usuario = res.locals.userName
        const fechaActual = new Date()

        const GestionHabilitacionEstadoCodigo = req.body.GestionHabilitacionEstadoCodigo
        const Detalle = req.body.Detalle
        const NroTramite = req.body.NroTramite
        const PersonalHabilitacionDesde: Date = req.body.PersonalHabilitacionDesde ? new Date(req.body.PersonalHabilitacionDesde) : null
        const PersonalHabilitacionHasta: Date = req.body.PersonalHabilitacionHasta ? new Date(req.body.PersonalHabilitacionHasta) : null
        const PersonalHabilitacionClase = req.body.PersonalHabilitacionClase
        // const AudFechaIng = req.body.AudFechaIng
        const documentos: any[] = req.body.documentos

        if (PersonalHabilitacionDesde) PersonalHabilitacionDesde.setHours(0, 0, 0, 0)
        if (PersonalHabilitacionHasta) PersonalHabilitacionHasta.setHours(0, 0, 0, 0)

        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            //Validacion
            const valForm: any = await this.valHabilitacionesForm(queryRunner, req.body)
            if (valForm instanceof ClientException)
                throw valForm

            //HabilitacionCategoriaPersonal
            await this.setHabilitacionCategoriaPersonal(
                queryRunner
                , PersonalId
                , PersonalHabilitacionId
                , LugarHabilitacionId
                , HabilitacionCategoriaCodigos
                , usuario, ip
            )

            //Actualiza el Ultimo Codigo registrado
            await queryRunner.query(`
            UPDATE PersonalHabilitacion
            SET PersonalHabilitacionDesde = @3, PersonalHabilitacionHasta = @4,PersonalHabilitacionClase = @5, NroTramite = @6
            , AudFechaMod = @7, AudIpMod = @8, AusUsuarioMod = @9
            WHERE PersonalHabilitacionId = @0 AND PersonalId = @1 AND PersonalHabilitacionLugarHabilitacionId = @2
            `, [PersonalHabilitacionId, PersonalId, LugarHabilitacionId,
                PersonalHabilitacionDesde, PersonalHabilitacionHasta, PersonalHabilitacionClase, NroTramite,
                fechaActual, ip, usuario
            ])

            //Actualiza el Codigo registrado
            await queryRunner.query(`
            UPDATE GestionHabilitacion
            SET GestionHabilitacionEstadoCodigo = @4, Detalle = @5,
                 AudFechaMod = @6, AudUsuarioMod = @7, AudIpMod = @8
            WHERE GestionHabilitacionCodigo = @0 AND PersonalHabilitacionId = @1 AND PersonalId = @2 AND PersonalHabilitacionLugarHabilitacionId = @3
            `, [GestionHabilitacionCodigo, PersonalHabilitacionId, PersonalId, LugarHabilitacionId,
                GestionHabilitacionEstadoCodigo, Detalle, fechaActual, usuario, ip])

            //Datos para la denominacion del documento
            let infoPersonal = await PersonalController.infoPersonalQuery(PersonalId, fechaActual.getFullYear(), fechaActual.getMonth() + 1)
            const cuit = infoPersonal[0].PersonalCUITCUILCUIT;
            let result = await queryRunner.query(`
                SELECT TRIM(LugarHabilitacionDescripcion) Descripcion
                FROM LugarHabilitacion
                WHERE LugarHabilitacionId = @0
            `, [LugarHabilitacionId])
            const lugarHabilitacionDescripcion = result[0].Descripcion

            //Registra documentos
            for (const docs of documentos) {
                if (docs.file?.[0]) {
                    const file = docs.file[0]

                    const DocumentoFecha = file.DocumentoFecha ? new Date(file.DocumentoFecha) : null
                    const DocumentoFechaDocumentoVencimiento = file.DocumentoFechaDocumentoVencimiento ? new Date(file.DocumentoFechaDocumentoVencimiento) : null

                    if (DocumentoFecha) DocumentoFecha.setHours(0, 0, 0, 0)
                    if (DocumentoFechaDocumentoVencimiento) DocumentoFechaDocumentoVencimiento.setHours(0, 0, 0, 0)

                    // CUIT- Tipo Documento - Lugar habilitación
                    const den_documento = `${cuit}-${file.doctipo_id}-${lugarHabilitacionDescripcion}`

                    const IdsRelacionados = {
                        PersonalId: PersonalId,
                        PersonalHabilitacionId: PersonalHabilitacionId,
                        PersonalHabilitacionLugarHabilitacionId: LugarHabilitacionId
                    }
                    const uploadResult = await FileUploadController.handleDOCUploadV2(null, DocumentoFecha, DocumentoFechaDocumentoVencimiento, den_documento, null, null, file, usuario, ip, queryRunner, IdsRelacionados)


                }
            }


            await queryRunner.commitTransaction()
            this.jsonRes({}, res, 'Carga exitosa');
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        }
    }

    private async getLugarHabilitacionQuery(queryRunner: any) {
        return await queryRunner.query(`
          SELECT LugarHabilitacionId value, TRIM(LugarHabilitacionDescripcion) label
          FROM LugarHabilitacion
          WHERE LugarHabilitacionInactivo IS NULL
        `)
    }

    async getLugarHabilitacion(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            const options = await this.getLugarHabilitacionQuery(queryRunner)
            this.jsonRes(options, res);
        } catch (error) {
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async getLugarHabilitacionByPersonalId(req: any, res: Response, next: NextFunction) {
        const PersonalId = req.params.PersonalId;
        const queryRunner = dataSource.createQueryRunner();
        try {
            const options = await queryRunner.query(`
                SELECT lughab.LugarHabilitacionId value, TRIM(lughab.LugarHabilitacionDescripcion) label
                FROM PersonalHabilitacionNecesaria perhab
                INNER JOIN LugarHabilitacion lughab ON lughab.LugarHabilitacionId = perhab.PersonalHabilitacionNecesariaLugarHabilitacionId
                WHERE perhab.PersonalId IN (@0) AND lughab.LugarHabilitacionInactivo IS NULL
            `, [PersonalId])

            this.jsonRes(options, res);
        } catch (error) {
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    private async getHabilitacionCategoriaQuery(queryRunner: any, LugarHabilitacionId: any) {
        return await queryRunner.query(`
          SELECT HabilitacionCategoriaCodigo value, TRIM(Detalle) label
          FROM HabilitacionCategoria
          WHERE LugarHabilitacionId IN (@0)
        `, [LugarHabilitacionId])
    }

    async getHabilitacionCategoria(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        const LugarHabilitacionId = req.params.LugarHabilitacionId
        try {
            const options = await this.getHabilitacionCategoriaQuery(queryRunner, LugarHabilitacionId)
            this.jsonRes(options, res);
        } catch (error) {
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async addHabilitacion(req: any, res: Response, next: NextFunction) {

        const ip = this.getRemoteAddress(req)
        const usuario = res.locals.userName
        const fechaActual = new Date()

        const PersonalId = req.body.PersonalId
        const LugarHabilitacionId = req.body.LugarHabilitacionId
        const GestionHabilitacionEstadoCodigo = req.body.GestionHabilitacionEstadoCodigo
        const HabilitacionCategoriaCodigos = req.body.HabilitacionCategoriaCodigos
        const Detalle = req.body.Detalle
        const NroTramite = req.body.NroTramite
        const PersonalHabilitacionDesde: Date = req.body.PersonalHabilitacionDesde ? new Date(req.body.PersonalHabilitacionDesde) : null
        const PersonalHabilitacionHasta: Date = req.body.PersonalHabilitacionHasta ? new Date(req.body.PersonalHabilitacionHasta) : null
        const PersonalHabilitacionClase = req.body.PersonalHabilitacionClase
        // const AudFechaIng = req.body.AudFechaIng
        const documentos: any[] = req.body.documentos

        if (PersonalHabilitacionDesde) PersonalHabilitacionDesde.setHours(0, 0, 0, 0)
        if (PersonalHabilitacionHasta) PersonalHabilitacionHasta.setHours(0, 0, 0, 0)

        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            //Validación
            const valForm: any = await this.valHabilitacionesForm(queryRunner, req.body)
            if (valForm instanceof ClientException)
                throw valForm

            // validar que no exista un registro con estado != a habilitado o rechazado

            let exist = await queryRunner.query(`SELECT ph.PersonalHabilitacionId
                FROM PersonalHabilitacion ph
                LEFT JOIN GestionHabilitacion gh on gh.PersonalHabilitacionId=ph.PersonalHabilitacionId and gh.PersonalId=ph.PersonalId and gh.PersonalHabilitacionLugarHabilitacionId=ph.PersonalHabilitacionLugarHabilitacionId and gh.GestionHabilitacionCodigo=ph.GestionHabilitacionCodigoUlt
                WHERE gh.GestionHabilitacionEstadoCodigo not in ('HABORG','RECORG') and ph.PersonalId=@0 and ph.PersonalHabilitacionLugarHabilitacionId=@1 `, [PersonalId, LugarHabilitacionId])

            if (exist && exist.length > 0) throw new ClientException(`Ya existe una habilitación en trámite para el lugar de habilitación seleccionado.`)

            //Obtiene el Ultimo Codigo registrado
            let result = await queryRunner.query(`
                SELECT MAX(PersonalHabilitacionId) PersonalHabilitacionId
                FROM PersonalHabilitacion
                WHERE PersonalId = @0
            `, [PersonalId])
            const newPersonalHabilitacionId = (result && result.length) ? (result[0].PersonalHabilitacionId + 1) : 1
            const newCodigoUlt = 1

            await queryRunner.query(`
                INSERT INTO PersonalHabilitacion (
                PersonalHabilitacionId, PersonalId, PersonalHabilitacionLugarHabilitacionId
                , PersonalHabilitacionRechazado, PersonalHabilitacionDesde, PersonalHabilitacionHasta
                , PersonalHabilitacionClase, GestionHabilitacionCodigoUlt, NroTramite
                , AudFechaIng, AudFechaMod, AudIpIng, AudIpMod, AudUsuarioIng, AusUsuarioMod
                ) VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @9, @10, @10, @11, @11)
            `, [newPersonalHabilitacionId, PersonalId, LugarHabilitacionId
                , 'N', PersonalHabilitacionDesde, PersonalHabilitacionHasta
                , PersonalHabilitacionClase, newCodigoUlt, NroTramite
                , fechaActual, ip, usuario
            ])

            //HabilitacionCategoriaPersonal
            if (HabilitacionCategoriaCodigos != null && HabilitacionCategoriaCodigos.length > 0) {
                for (const codigo of HabilitacionCategoriaCodigos) {
                    await queryRunner.query(`
                INSERT INTO HabilitacionCategoriaPersonal (
                PersonalId, PersonalHabilitacionId, PersonalHabilitacionLugarHabilitacionId, HabilitacionCategoriaCodigo
                , Desde, Hasta
                , AudFechaIng, AudFechaMod, AudUsuarioIng, AudUsuarioMod, AudIpIng, AudIpMod
                ) VALUES (@0, @1, @2, @3, @4, @5, @6, @6, @7, @7, @8, @8)
                `, [
                        PersonalId, newPersonalHabilitacionId, LugarHabilitacionId, codigo
                        , null, null
                        , fechaActual, usuario, ip
                    ])
                }
            }

            await queryRunner.query(`
            INSERT INTO GestionHabilitacion (GestionHabilitacionCodigo, PersonalId, PersonalHabilitacionLugarHabilitacionId, PersonalHabilitacionId, GestionHabilitacionEstadoCodigo, Detalle
            , AudFechaIng, AudFechaMod, AudUsuarioIng, AudUsuarioMod, AudIpIng, AudIpMod
            ) VALUES (@0, @1, @2, @3, @4, @5, @6, @6, @7, @7, @8, @8)
            `, [newCodigoUlt, PersonalId, LugarHabilitacionId, newPersonalHabilitacionId, GestionHabilitacionEstadoCodigo, Detalle, fechaActual, usuario, ip])

            //Datos para la denominacion del documento
            let infoPersonal = await PersonalController.infoPersonalQuery(PersonalId, fechaActual.getFullYear(), fechaActual.getMonth() + 1)
            const cuit = infoPersonal[0].PersonalCUITCUILCUIT;
            result = await queryRunner.query(`
                SELECT TRIM(LugarHabilitacionDescripcion) Descripcion
                FROM LugarHabilitacion
                WHERE LugarHabilitacionId = @0
            `, [LugarHabilitacionId])
            const lugarHabilitacionDescripcion = result[0].Descripcion

            //Registra documentos
            for (const doc of documentos) {
                if (doc.file?.[0]) {
                    const file = doc.file[0]

                    const DocumentoFecha = file.DocumentoFecha ? new Date(file.DocumentoFecha) : null
                    const DocumentoFechaDocumentoVencimiento = file.DocumentoFechaDocumentoVencimiento ? new Date(file.DocumentoFechaDocumentoVencimiento) : null

                    if (DocumentoFecha) DocumentoFecha.setHours(0, 0, 0, 0)
                    if (DocumentoFechaDocumentoVencimiento) DocumentoFechaDocumentoVencimiento.setHours(0, 0, 0, 0)

                    // CUIT- Tipo Documento - Lugar habilitación
                    const den_documento = `${cuit}-${file.doctipo_id}-${lugarHabilitacionDescripcion}`
                    const IdsRelacionados = {
                        PersonalId: PersonalId,
                        PersonalHabilitacionId: newPersonalHabilitacionId,
                        PersonalHabilitacionLugarHabilitacionId: LugarHabilitacionId
                    }

                    const uploadResult = await FileUploadController.handleDOCUploadV2(null, DocumentoFecha, DocumentoFechaDocumentoVencimiento, den_documento, null, null, file, usuario, ip, queryRunner, IdsRelacionados)

                }
            }

            // throw new ClientException(`DEBUG`)

            await queryRunner.commitTransaction()
            this.jsonRes({ PersonalHabilitacionId: newPersonalHabilitacionId, GestionHabilitacionCodigo: newCodigoUlt, AudFechaIng: fechaActual }, res, 'Carga exitosa');
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        }
    }

    async updatePersonalHabilitacionNecesaria(req: any, res: Response, next: NextFunction) {
        const ip = this.getRemoteAddress(req)
        const usuario = res.locals.userName

        const PersonalId = req.body.PersonalId
        const LugarHabilitacionIds: number[] = req.body.LugarHabilitacionIds ? req.body.LugarHabilitacionIds : []

        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            await this.setPersonalHabilitacionNecesaria(queryRunner, PersonalId, LugarHabilitacionIds, usuario, ip)

            await queryRunner.commitTransaction()
            this.jsonRes({}, res, 'Carga exitosa');
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        }
    }

    async setPersonalHabilitacionNecesaria(queryRunner: any, personalId: number, habilitaciones: any[], usuario: string, ip: string) {
        //Compruebo si hubo cambios
        let cambios: boolean = false

        const habsOld: number[] = []
        const list = await this.queryHabilitacionNecesariaByPersonalId(queryRunner, personalId)
        for (const hab of list)
            habsOld.push(hab.PersonalHabilitacionNecesariaLugarHabilitacionId)

        if (habilitaciones.length != habsOld.length)
            cambios = true
        else
            habsOld.forEach((hab: any, index: number) => {
                if (habilitaciones.find(h => hab != h)) cambios = true
            });
        if (!cambios) return


        //Actualizo
        const now = new Date()
        const desde = new Date()
        desde.setHours(0, 0, 0, 0)
        let PersonalHabilitacionNecesariaId: number = 0

        await queryRunner.query(`
            DELETE FROM PersonalHabilitacionNecesaria
            WHERE PersonalId IN (@0)
        `, [personalId])

        for (const lugarHabilitacionId of habilitaciones) {
            PersonalHabilitacionNecesariaId++
            await queryRunner.query(`
                INSERT INTO PersonalHabilitacionNecesaria (
                    PersonalHabilitacionNecesariaId, PersonalId, PersonalHabilitacionNecesariaLugarHabilitacionId, PersonalHabilitacionNecesariaDesde, 
                    PersonalHabilitacionNecesariaAudFechaIng, PersonalHabilitacionNecesariaAudIpIng, PersonalHabilitacionNecesariaAudUsuarioIng,
                    PersonalHabilitacionNecesariaAudFechaMod, PersonalHabilitacionNecesariaAudIpMod, PersonalHabilitacionNecesariaAudUsuarioMod)
                VALUES(@0, @1, @2, @3, @4, @5, @6, @4, @5, @6)
            `, [PersonalHabilitacionNecesariaId, personalId, lugarHabilitacionId, desde, now, ip, usuario])
        }
        await queryRunner.query(`
            UPDATE Personal SET PersonalHabilitacionNecesariaUltNro = @1
            WHERE PersonalId IN (@0)
        `, [personalId, PersonalHabilitacionNecesariaId])
    }

    async setHabilitacionCategoriaPersonal(queryRunner: any, PersonalId: number, PersonalHabilitacionId: number, LugarHabilitacionId: number, categorias: string[], usuario: string, ip: string) {
        //Compruebo si hubo cambios
        let cambios: boolean = false

        const catsOld: number[] = []
        const list = await this.getHabilitacionCategoriaByPersonalHabilitacionIdQuery(queryRunner, PersonalId, PersonalHabilitacionId)

        for (const hab of list) {
            catsOld.push(hab.HabilitacionCategoriaCodigo)
        }

        if (categorias.length != catsOld.length)
            cambios = true
        else
            catsOld.forEach((hab: any, index: number) => {
                if (categorias.find(h => hab != h)) cambios = true
            });
        if (!cambios) return


        //Actualizo
        const fechaActual = new Date()

        await queryRunner.query(`
            DELETE FROM HabilitacionCategoriaPersonal
            WHERE PersonalId IN (@0) AND PersonalHabilitacionId IN (@1)
        `, [PersonalId, PersonalHabilitacionId])

        for (const codigo of categorias) {
            await queryRunner.query(`
                INSERT INTO HabilitacionCategoriaPersonal (
                PersonalId, PersonalHabilitacionId, PersonalHabilitacionLugarHabilitacionId, HabilitacionCategoriaCodigo
                , Desde, Hasta
                , AudFechaIng, AudFechaMod, AudUsuarioIng, AudUsuarioMod, AudIpIng, AudIpMod
                ) VALUES (@0, @1, @2, @3, @4, @5, @6, @6, @7, @7, @8, @8)
            `, [
                PersonalId, PersonalHabilitacionId, LugarHabilitacionId, codigo
                , null, null
                , fechaActual, usuario, ip
            ])
        }
    }

    private async queryHabilitacionNecesariaByPersonalId(queryRunner: any, PersonalId: any) {
        return await queryRunner.query(`
            SELECT PersonalHabilitacionNecesariaId, PersonalHabilitacionNecesariaLugarHabilitacionId
            FROM PersonalHabilitacionNecesaria
            WHERE PersonalId = @0
        `, [PersonalId])
    }

    async getHabilitacionNecesariaByPersonalId(req: any, res: Response, next: NextFunction) {

        const PersonalId = req.params.PersonalId

        const queryRunner = dataSource.createQueryRunner();
        try {
            const habs = []
            const habilitaciones = await this.queryHabilitacionNecesariaByPersonalId(queryRunner, PersonalId)
            for (const hab of habilitaciones)
                habs.push(hab.PersonalHabilitacionNecesariaLugarHabilitacionId)

            const obj = {
                PersonalId,
                LugarHabilitacionIds: habs
            }

            this.jsonRes(obj, res);
        } catch (error) {
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    getPreviousMonthYear(year: number, month: number): { year: number, month: number } {
        if (month === 1) {
            return { year: year - 1, month: 12 };
        } else {
            return { year: year, month: month - 1 };
        }
    }

    async jobHabilitacionNecesaria(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();

        const usuario = res?.locals.userName || 'server'
        const ip = this.getRemoteAddress(req)
        let registrosActualizados = 0

        const { year: anio, month: mes } = this.getPreviousMonthYear(req.body.anio, req.body.mes);

        const { ProcesoAutomaticoLogCodigo } = await this.procesoAutomaticoLogInicio(
            queryRunner,
            `Habilitación Necesaria ${mes}/${anio}`,
            { anio, mes, usuario, ip },
            usuario,
            ip
        );

        try {
            await queryRunner.startTransaction();
            const resAsisObjetiv = await AsistenciaController.getAsistenciaObjetivos(anio, mes, [])
            const resCustodias = await CustodiaController.listPersonalCustodiaQuery({ filtros: [] }, queryRunner, anio, mes, 0)
            const now = new Date()
            const desde = new Date(anio, mes - 1, 1);

            const resPersHabActuales = await queryRunner.query(`SELECT DISTINCT n.PersonalId, n.PersonalHabilitacionNecesariaLugarHabilitacionId FROM PersonalHabilitacionNecesaria n`)


            const map = new Map<number, { set: Set<number>; list: number[] }>();

            for (const asisObj of resAsisObjetiv) {
                if (asisObj.ObjetivoAsistenciaTipoAsociadoId != 3) continue;
                //                if (asisObj.LugarHabilitacionIdList== null || asisObj.LugarHabilitacionIdList.trim() === '') console.log(asisObj);
                const PersonalId = asisObj.PersonalId
                const LugarHabilitacionIdList = asisObj.LugarHabilitacionIdList ? asisObj.LugarHabilitacionIdList.split(',') : []
                for (const LugarHabilitacionId of LugarHabilitacionIdList) {


                    if (!map.has(PersonalId)) {
                        map.set(PersonalId, { set: new Set(), list: [] });
                    }

                    const entry = map.get(PersonalId)!;
                    if (!entry.set.has(LugarHabilitacionId)) {
                        entry.set.add(LugarHabilitacionId);
                        entry.list.push(LugarHabilitacionId);
                    }
                }
            }

            const PersonalLugar = Array.from(map.entries()).map(([PersonalId, { list }]) => ({
                PersonalId,
                LugarHabilitacionId: list,
            }));
            //console.log('PersonalLugar1', PersonalLugar);
            //console.log('PersonalLugar2', PersonalLugar.length);
            //TODO:  Buscar las diferencias entre lo que esta en la base y lo que deberia estar segun las asistencias
            for (const perlug of PersonalLugar) {
                const PersonalId = perlug.PersonalId
                const LugarHabilitacionIds = perlug.LugarHabilitacionId
                for (const lugarId of LugarHabilitacionIds) {

                    const habNecesariaActual = resPersHabActuales.find((h: any) => h.PersonalId === PersonalId && lugarId == h.PersonalHabilitacionNecesariaLugarHabilitacionId)
                    if (!habNecesariaActual) {

                        const res = await queryRunner.query(`
                                    SELECT PersonalHabilitacionNecesariaUltNro FROM  Personal WHERE PersonalId =@0
                                `, [PersonalId])

                        const PersonalHabilitacionNecesariaId = (res && res.length) ? (res[0].PersonalHabilitacionNecesariaUltNro + 1) : 1


                        await queryRunner.query(`
                            INSERT INTO PersonalHabilitacionNecesaria (
                                PersonalHabilitacionNecesariaId, PersonalId, PersonalHabilitacionNecesariaLugarHabilitacionId, PersonalHabilitacionNecesariaDesde, 
                                PersonalHabilitacionNecesariaAudFechaIng, PersonalHabilitacionNecesariaAudIpIng, PersonalHabilitacionNecesariaAudUsuarioIng,
                                PersonalHabilitacionNecesariaAudFechaMod, PersonalHabilitacionNecesariaAudIpMod, PersonalHabilitacionNecesariaAudUsuarioMod)
                            VALUES(@0, @1, @2, @3, @4, @5, @6, @4, @5, @6)
                        `, [PersonalHabilitacionNecesariaId, PersonalId, lugarId, desde, now, ip, usuario])



                        await queryRunner.query(`
                                    UPDATE Personal SET PersonalHabilitacionNecesariaUltNro = @1
                                    WHERE PersonalId =@0
                                `, [PersonalId, PersonalHabilitacionNecesariaId])

                        registrosActualizados += 1;

                    }
                }
            }


            await queryRunner.commitTransaction();

            await this.procesoAutomaticoLogFin(
                queryRunner,
                ProcesoAutomaticoLogCodigo,
                'COM',
                {
                    res: `Procesado correctamente`,
                    'Registros Actualizados': registrosActualizados
                },
                usuario,
                ip
            );


            this.jsonRes({ registrosActualizados }, res, `Registros actualizados ${registrosActualizados}`);

        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            await this.procesoAutomaticoLogFin(queryRunner,
                ProcesoAutomaticoLogCodigo,
                'ERR',
                { res: error },
                usuario,
                ip
            );
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async valHabilitacionesForm(queryRunner: any, habilitacion: any) {
        let error: string[] = []
        if (!habilitacion.GestionHabilitacionEstadoCodigo) {
            error.push(`- Estado`)
        }

        const valHabilitacionNecesaria = await queryRunner.query(`
            SELECT PersonalHabilitacionNecesariaId
            FROM PersonalHabilitacionNecesaria
            WHERE PersonalId = @0 AND PersonalHabilitacionNecesariaLugarHabilitacionId = @1
        `, [habilitacion.PersonalId, habilitacion.LugarHabilitacionId])

        if (valHabilitacionNecesaria && !valHabilitacionNecesaria.length) {
            return new ClientException(`La persona no posee la habilitación necesaria para el Lugar Habilitación`)
        }

        //Habilitacion en CABA, Provincia de Bs.As y Provincia de Formosa
        const arrayFilter: any[] = [{ LugarHabilitacionId: 1, tipoDocHabilitacion: 'HABPERCABA' }, { LugarHabilitacionId: 5, tipoDocHabilitacion: 'HABPERPRO' }, { LugarHabilitacionId: 8, tipoDocHabilitacion: 'HABPERFOR' }]
        if (habilitacion.GestionHabilitacionEstadoCodigo == 'HABORG') {
            if (!habilitacion.NroTramite) error.push(`- Nro Tramite`)
            if (!habilitacion.PersonalHabilitacionDesde) error.push(`- Habilitación Desde`)
            if (!habilitacion.PersonalHabilitacionHasta) error.push(`- Habilitación Hasta`)
            else {
                //Verifica que sea un periodo valido
                const desde = new Date(habilitacion.PersonalHabilitacionDesde)
                const hasta = new Date(habilitacion.PersonalHabilitacionHasta)
                desde.setHours(0, 0, 0, 0)
                hasta.setHours(0, 0, 0, 0)
                if (desde > hasta) return new ClientException(`La fecha de Habilitación Desde no puede ser mayor a la fecha de Habilitación Hasta`)
            }

            // let desdeHastaDocHabilitacion = false
            let desdeDocHabilitacion = false
            let hastaDocHabilitacion = false
            let tipoDocHabilitacion = false
            let cantDoc = 0
            for (const docs of habilitacion.documentos) {
                if (docs.file?.[0]) {
                    const doc = docs.file[0]

                    const find = arrayFilter.find((obj: any) => obj.tipoDocHabilitacion == doc.doctipo_id)

                    if (find) {
                        if (!doc.DocumentoFecha) desdeDocHabilitacion = true
                        if (!doc.DocumentoFechaDocumentoVencimiento) hastaDocHabilitacion = true
                        if (find.LugarHabilitacionId != habilitacion.LugarHabilitacionId) tipoDocHabilitacion = true
                        cantDoc++
                    }
                }
                // if ((docs.file?.[0]?.doctipo_id == 'HARPERCABA') || (docs.file?.[0]?.doctipo_id == 'HABPERPRO') || (docs.file?.[0]?.doctipo_id == 'HABPERFOR')) {
                //     const doc = docs.file[0]
                //     // if (!doc.DocumentoFecha || !doc.DocumentoFechaDocumentoVencimiento) desdeHastaDocHabilitacion = true
                //     if (!doc.DocumentoFecha) desdeDocHabilitacion = true
                //     if (!doc.DocumentoFechaDocumentoVencimiento) hastaDocHabilitacion = true
                //     if(!arrayFilter.find((obj:any)=>{ obj.tipoDocHabilitacion == doc.doctipo_id && obj.LugarHabilitacionId == habilitacion.LugarHabilitacionId})) tipoDocHabilitacion = true
                //     cantDoc++
                // }
            }

            if (desdeDocHabilitacion) error.push(`- Desde (Documento)`)
            // if (hastaDocHabilitacion) error.push(`- Hasta (Documento)`)

            // se comenta momentaneamente la validacion de tipo de documento por lugar de habilitacion
            // if (!cantDoc || tipoDocHabilitacion) error.push(`Ingrese un documento relacionado al Lugar Habilitacion`)

        }
        if (!habilitacion.Detalle) {
            error.push(`- Detalle`)
        }
        if (error.length) {
            error.unshift('Deben completar los siguientes campos:')
            return new ClientException(error)
        }
    }

    async deleteGestionHabilitacion(req: any, res: Response, next: NextFunction) {

        const { PersonalId, PersonalHabilitacionId, LugarHabilitacionId, Codigo } = req.query
        // const ip = this.getRemoteAddress(req)
        // const usuario = res.locals.userName
        // const fechaActual = new Date()

        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            await queryRunner.query(`
                DELETE GestionHabilitacion
                WHERE PersonalHabilitacionId = @0 AND PersonalId = @1 AND PersonalHabilitacionLugarHabilitacionId = @2 AND GestionHabilitacionCodigo = @3
            `, [PersonalHabilitacionId, PersonalId, LugarHabilitacionId, Codigo])

            // throw new ClientException(`DEBUG`)

            await queryRunner.commitTransaction()
            this.jsonRes({}, res, 'Borrado Exitoso');
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        }
    }

}