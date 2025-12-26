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
        name: "Estado",
        type: "string",
        id: "Estado",
        field: "Estado",
        fieldName: "est.Detalle",
        sortable: true,
        hidden: false,
        searchHidden: false
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
        fieldName: "IIF(b.PersonalId IS NULL, 0, dias.DiasFaltantesVencimiento)",
        sortable: true,
        hidden: false,
        searchHidden: false,
        searchType: "numberAdvanced",
        searchComponent: "inputForNumberAdvancedSearch",
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
        // searchComponent: "inputForFechaSearch",
        sortable: true,
        hidden: false,
        searchHidden: true
    },
    {
        name: "Estado",
        type: "string",
        id: "estado",
        field: "estado",
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
        // searchComponent: "inputForFechaSearch",
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
        // searchComponent: "inputForFechaSearch",
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

    async habilitacionesListQuery(queryRunner: any, periodo: any, filterSql: any, orderBy: any) {
        return await queryRunner.query(`
        

        SELECT ROW_NUMBER() OVER (ORDER BY per.PersonalId) AS id,
            per.PersonalId, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),' ',TRIM(per.PersonalNombre)) ApellidoNombre, 
            sit.SituacionRevistaDescripcion, sitrev.PersonalSituacionRevistaDesde, IIF(c.PersonalId IS NULL,'0','1') HabNecesaria, 
            d.LugarHabilitacionDescripcion, b.PersonalHabilitacionDesde, b.PersonalHabilitacionHasta, e.GestionHabilitacionEstadoCodigo, 
            est.Detalle Estado, e.AudFechaIng AS FechaEstado, b.NroTramite,
            b.PersonalHabilitacionId, b.PersonalHabilitacionLugarHabilitacionId,
		    IIF(b.PersonalId IS NULL, 0, dias.DiasFaltantesVencimiento) as DiasFaltantesVencimiento

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
		LEFT JOIN (
			SELECT 
				b2.PersonalId,
				b2.PersonalHabilitacionId,
				b2.PersonalHabilitacionLugarHabilitacionId,
				CASE 
								 WHEN b2.PersonalHabilitacionHasta IS NULL AND b2.PersonalHabilitacionDesde IS NULL THEN 0
					WHEN b2.PersonalHabilitacionHasta IS NULL THEN NULL
					WHEN b2.PersonalHabilitacionHasta < @0 THEN 0
					ELSE DATEDIFF(DAY, @0, b2.PersonalHabilitacionHasta)
				END AS DiasFaltantesVencimiento
			FROM PersonalHabilitacion b2
		) dias ON dias.PersonalId = b.PersonalId AND dias.PersonalHabilitacionId = b.PersonalHabilitacionId AND dias.PersonalHabilitacionLugarHabilitacionId = b.PersonalHabilitacionLugarHabilitacionId
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
        SELECT ROW_NUMBER() OVER (ORDER BY geshab.GestionHabilitacionCodigo) id, geshab.GestionHabilitacionCodigo, geshab.Detalle, geshab.AudFechaIng, est.Detalle estado
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
        SELECT doc.DocumentoId AS id, doc.DocumentoDenominadorDocumento, doctip.DocumentoTipoCodigo,doc.DocumentoAudFechaIng, doc.DocumentoFecha,doc.DocumentoFechaDocumentoVencimiento
        FROM PersonalHabilitacion perhab 
        JOIN DocumentoRelaciones docrel ON docrel.PersonalId = perhab.PersonalId AND docrel.PersonalHabilitacionId = perhab.PersonalHabilitacionId AND docrel.PersonalHabilitacionLugarHabilitacionId = perhab.PersonalHabilitacionLugarHabilitacionId
        LEFT JOIN Documento doc ON doc.DocumentoId = docrel.DocumentoId
        LEFT JOIN DocumentoTipo doctip ON doctip.DocumentoTipoCodigo=doc.DocumentoTipoCodigo
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
            console.log('Doc.length:', habilitaciones.length);
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

    async getPersonalHabilitacion(req: any, res: Response, next: NextFunction) {
        const PersonalId = req.body.personalId
        const PersonalHabilitacionId = req.body.personalHabilitacionId
        const PersonalHabilitacionLugarHabilitacionId = req.body.lugarHabilitacionId
        const queryRunner = dataSource.createQueryRunner();
        try {
            const PersonalHabilitacion = await queryRunner.query(`
            SELECT perhab.PersonalHabilitacionDesde, perhab.PersonalHabilitacionHasta, perhab.PersonalHabilitacionClase , perhab.NroTramite
            FROM PersonalHabilitacion perhab 
            -- JOIN DocumentoRelaciones docrel on docrel.PersonalId=perhab.PersonalId and docrel.PersonalHabilitacionId=docrel.PersonalHabilitacionId and docrel.PersonalHabilitacionLugarHabilitacionId=perhab.PersonalHabilitacionLugarHabilitacionId
            -- LEFT JOIN Documento doc on doc.DocumentoId = docrel.DocumentoId
            -- LEFT JOIN DocumentoTipo doctip on doctip.DocumentoTipoCodigo=doc.DocumentoTipoCodigo
            WHERE perhab.PersonalId = @0 AND perhab.PersonalHabilitacionId = @1 AND perhab.PersonalHabilitacionLugarHabilitacionId = @2
            `, [PersonalId, PersonalHabilitacionId, PersonalHabilitacionLugarHabilitacionId])

            this.jsonRes(PersonalHabilitacion[0], res);

        } catch (error) {
            return next(error)
        }
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
        }
    }

    async addHabilitacionDetalle(req: any, res: Response, next: NextFunction) {
        const PersonalId = req.body.personalId
        const PersonalHabilitacionId = req.body.personalHabilitacionId
        const PersonalHabilitacionLugarHabilitacionId = req.body.lugarHabilitacionId
        const ip = this.getRemoteAddress(req)
        const usuario = res.locals.userName
        const fechaActual = new Date()
        fechaActual.setHours(0, 0, 0, 0)

        const GestionHabilitacionEstadoCodigo = req.body.GestionHabilitacionEstadoCodigo
        const Detalle = req.body.Detalle
        const NroTramite = req.body.NroTramite
        const PersonalHabilitacionDesde: Date = req.body.PersonalHabilitacionDesde ? new Date(req.body.PersonalHabilitacionDesde) : null
        const PersonalHabilitacionHasta: Date = req.body.PersonalHabilitacionHasta ? new Date(req.body.PersonalHabilitacionHasta) : null
        const PersonalHabilitacionClase = req.body.PersonalHabilitacionClase
        // const AudFechaIng = req.body.AudFechaIng
        const file: any[] = req.body.file

        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            //Validacion
            let error: string[] = []
            if (!GestionHabilitacionEstadoCodigo) {
                error.push(` Estado`)
            }
            if (!Detalle) {
                error.push(` Detalle`)
            }
            if (error.length) {
                error.unshift('Deben completar los siguientes campos:')
                throw new ClientException(error)
            }
            if ((PersonalHabilitacionDesde || PersonalHabilitacionHasta || PersonalHabilitacionClase.length)
                && (!PersonalHabilitacionDesde || !PersonalHabilitacionHasta || !PersonalHabilitacionClase.length)) {
                throw new ClientException(`Los campos Desde, Hasta y Tipo deben de completarse al mismo tiempo`)
            }

            //Obtiene el Ultimo Codigo registrado
            let result = await queryRunner.query(`
            SELECT ISNULL(GestionHabilitacionCodigoUlt, 0) CodigoUlt
            FROM PersonalHabilitacion
            WHERE PersonalHabilitacionId = @0 AND PersonalId = @1 AND PersonalHabilitacionLugarHabilitacionId = @2
            `, [PersonalHabilitacionId, PersonalId, PersonalHabilitacionLugarHabilitacionId])
            const newCodigoUlt = result[0].CodigoUlt + 1

            //Actualiza el Ultimo Codigo registrado
            await queryRunner.query(`
            UPDATE PersonalHabilitacion
            SET PersonalHabilitacionDesde = @3, PersonalHabilitacionHasta = @4,PersonalHabilitacionClase = @5, GestionHabilitacionCodigoUlt = @6, NroTramite = @7
            , AudFechaMod = @8, AudIpMod = @9, AusUsuarioMod = @10
            WHERE PersonalHabilitacionId = @0 AND PersonalId = @1 AND PersonalHabilitacionLugarHabilitacionId = @2
            `, [PersonalHabilitacionId, PersonalId, PersonalHabilitacionLugarHabilitacionId,
                PersonalHabilitacionDesde, PersonalHabilitacionHasta, PersonalHabilitacionClase, newCodigoUlt, NroTramite,
                fechaActual, ip, usuario
            ])

            //Inserta el Codigo registrado
            await queryRunner.query(`
            INSERT INTO GestionHabilitacion (GestionHabilitacionCodigo, PersonalId, PersonalHabilitacionLugarHabilitacionId, PersonalHabilitacionId, GestionHabilitacionEstadoCodigo, Detalle
            , AudFechaIng, AudFechaMod, AudUsuarioIng, AudUsuarioMod, AudIpIng, AudIpMod
            ) VALUES (@0, @1, @2, @3, @4, @5, @6, @6, @7, @7, @8, @8)
            `, [newCodigoUlt, PersonalId, PersonalHabilitacionLugarHabilitacionId, PersonalHabilitacionId, GestionHabilitacionEstadoCodigo, Detalle, fechaActual, usuario, ip])

            //Registra el nuevo documento
            if (file?.length > 0) {
                const uploadResult = await FileUploadController.handleDOCUpload(PersonalId, null, null, null, PersonalHabilitacionDesde, PersonalHabilitacionHasta, NroTramite, null, null, file[0], usuario, ip, queryRunner)
                const doc_id = uploadResult && typeof uploadResult === 'object' ? uploadResult.doc_id : undefined;
                await queryRunner.query(`
                INSERT INTO DocumentoRelaciones (
                    DocumentoId, PersonalId, AudFechaIng, AudFechaMod, AudUsuarioIng, AudUsuarioMod
                    , AudIpIng, AudIpMod, PersonalHabilitacionId, PersonalHabilitacionLugarHabilitacionId
                ) VALUES (@0, @1, @2, @2, @3, @3, @4, @4, @5, @6)
                `, [doc_id, PersonalId, fechaActual, usuario, ip, PersonalHabilitacionId, PersonalHabilitacionLugarHabilitacionId])
            }

            await queryRunner.commitTransaction()
            this.jsonRes({ GestionHabilitacionCodigo: newCodigoUlt, AudFechaIng: fechaActual }, res, 'Carga exitosa');
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        }
    }

    async updateHabilitacionDetalle(req: any, res: Response, next: NextFunction) {
        const PersonalId = req.body.personalId
        const PersonalHabilitacionId = req.body.personalHabilitacionId
        const PersonalHabilitacionLugarHabilitacionId = req.body.lugarHabilitacionId
        const GestionHabilitacionCodigo = req.body.codigo
        const ip = this.getRemoteAddress(req)
        const usuario = res.locals.userName
        const fechaActual = new Date()
        fechaActual.setHours(0, 0, 0, 0)

        const GestionHabilitacionEstadoCodigo = req.body.GestionHabilitacionEstadoCodigo
        const Detalle = req.body.Detalle
        const NroTramite = req.body.NroTramite
        const PersonalHabilitacionDesde: Date = req.body.PersonalHabilitacionDesde ? new Date(req.body.PersonalHabilitacionDesde) : null
        const PersonalHabilitacionHasta: Date = req.body.PersonalHabilitacionHasta ? new Date(req.body.PersonalHabilitacionHasta) : null
        const PersonalHabilitacionClase = req.body.PersonalHabilitacionClase
        // const AudFechaIng = req.body.AudFechaIng
        // const file: any[] = req.body.archivo

        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            //Validacion
            let error: string[] = []

            if (!GestionHabilitacionEstadoCodigo) {
                error.push(` Estado`)
            }
            if (!Detalle) {
                error.push(` Detalle`)
            }
            if (error.length) {
                error.unshift('Deben completar los siguientes campos:')
                throw new ClientException(error)
            }
            if ((PersonalHabilitacionDesde || PersonalHabilitacionHasta || PersonalHabilitacionClase.length)
                && (!PersonalHabilitacionDesde || !PersonalHabilitacionHasta || !PersonalHabilitacionClase.length)) {
                throw new ClientException(`Los campos Desde, Hasta y Tipo deben de completarse al mismo tiempo`)
            }

            //Actualiza el Ultimo Codigo registrado
            await queryRunner.query(`
            UPDATE PersonalHabilitacion
            SET PersonalHabilitacionDesde = @3, PersonalHabilitacionHasta = @4,PersonalHabilitacionClase = @5, NroTramite = @6
            , AudFechaMod = @7, AudIpMod = @8, AusUsuarioMod = @9
            WHERE PersonalHabilitacionId = @0 AND PersonalId = @1 AND PersonalHabilitacionLugarHabilitacionId = @2
            `, [PersonalHabilitacionId, PersonalId, PersonalHabilitacionLugarHabilitacionId,
                PersonalHabilitacionDesde, PersonalHabilitacionHasta, PersonalHabilitacionClase, NroTramite,
                fechaActual, ip, usuario
            ])

            //Inserta el Codigo registrado
            await queryRunner.query(`
            UPDATE GestionHabilitacion
            SET GestionHabilitacionEstadoCodigo = @4, Detalle = @5,
                 AudFechaMod = @6, AudUsuarioMod = @7, AudIpMod = @8
            WHERE GestionHabilitacionCodigo = @0 AND PersonalHabilitacionId = @1 AND PersonalId = @2 AND PersonalHabilitacionLugarHabilitacionId = @3
            `, [GestionHabilitacionCodigo, PersonalHabilitacionId, PersonalId, PersonalHabilitacionLugarHabilitacionId,
                GestionHabilitacionEstadoCodigo, Detalle, fechaActual, usuario, ip])


            await queryRunner.commitTransaction()
            this.jsonRes({}, res, 'Carga exitosa');
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        }
    }

}