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
        fieldName: " IIF(b.PersonalId IS NULL, 0, dias.DiasFaltantesVencimiento)",
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
        periodo.setHours(0,0,0,0)
        return await queryRunner.query(`
        
       
SELECT ROW_NUMBER() OVER (ORDER BY per.PersonalId) AS id,
            per.PersonalId, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),' ',TRIM(per.PersonalNombre)) ApellidoNombre, 
            sit.SituacionRevistaDescripcion, sitrev.PersonalSituacionRevistaDesde, 
            d.LugarHabilitacionDescripcion, b.PersonalHabilitacionDesde, b.PersonalHabilitacionHasta, e.GestionHabilitacionEstadoCodigo, 
            est.Detalle Estado, e.AudFechaIng AS FechaEstado, b.NroTramite,
            b.PersonalHabilitacionId, b.PersonalHabilitacionLugarHabilitacionId, vishab.LugarHabilitacionId,
		    IIF(b.PersonalHabilitacionId IS NULL, 0, dias.DiasFaltantesVencimiento) as DiasFaltantesVencimiento,

			IIF(c.PersonalId IS NULL,'0','1') HabNecesaria


        FROM Personal per
   
		JOIN (
				SELECT b.PersonalId, b.PersonalHabilitacionLugarHabilitacionId LugarHabilitacionId
				FROM  PersonalHabilitacion b 
				WHERE b.PersonalHabilitacionDesde <= @0 AND ISNULL(b.PersonalHabilitacionHasta, '9999-12-31') >= @0

				UNION

				SELECT c.PersonalId, c.PersonalHabilitacionNecesariaLugarHabilitacionId LugarHabilitacionId
				FROM PersonalHabilitacionNecesaria c 
				
				) vishab on vishab.PersonalId=per.PersonalId

	
		LEFT JOIN PersonalHabilitacion b ON b.PersonalId=per.PersonalId  and b.PersonalHabilitacionLugarHabilitacionId=vishab.LugarHabilitacionId --and b.PersonalHabilitacionDesde <= @0 AND ISNULL(b.PersonalHabilitacionHasta, '9999-12-31') >= @0
		LEFT JOIN PersonalHabilitacionNecesaria c ON c.PersonalId = per.PersonalId and c.PersonalHabilitacionNecesariaLugarHabilitacionId=vishab.LugarHabilitacionId
		LEFT JOIN LugarHabilitacion d ON d.LugarHabilitacionId = vishab.LugarHabilitacionId

		LEFT JOIN GestionHabilitacion e ON e.GestionHabilitacionCodigo = b.GestionHabilitacionCodigoUlt AND e.PersonalId = vishab.PersonalId AND e.PersonalHabilitacionLugarHabilitacionId = vishab.LugarHabilitacionId AND e.PersonalHabilitacionId = b.PersonalHabilitacionId

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
					WHEN b2.PersonalHabilitacionHasta IS not NULL THEN DATEDIFF(DAY, @0, b2.PersonalHabilitacionHasta)
                    WHEN b2.PersonalHabilitacionHasta IS NULL and b2.PersonalHabilitacionDesde is null THEN NULL
					--WHEN b2.PersonalHabilitacionHasta IS NULL AND b2.PersonalHabilitacionDesde IS NOT NULL THEN NULL
					ELSE 0
				END AS DiasFaltantesVencimiento
			FROM PersonalHabilitacion b2
		) dias ON dias.PersonalId = vishab.PersonalId AND dias.PersonalHabilitacionId = b.PersonalHabilitacionId AND dias.PersonalHabilitacionLugarHabilitacionId = vishab.LugarHabilitacionId

        WHERE (${filterSql})
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
        order by geshab.AudFechaIng desc
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
        , CONCAT('api/file-upload/downloadFile/', doc.DocumentoId, '/Documento/0') url, doc.DocumentoNombreArchivo AS NombreArchivo
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
            
            let list = habilitaciones.map(obj =>{
                obj.TipoArchivo = obj.NombreArchivo.split('.').pop()?.toLowerCase()
                return obj
            })
            
            this.jsonRes(
                {
                    total: list.length,
                    list,
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
        // const PersonalHabilitacionLugarHabilitacionId = req.body.lugarHabilitacionId
        const queryRunner = dataSource.createQueryRunner();
        try {
            const PersonalHabilitacion = await queryRunner.query(`
            SELECT 
            perhab.PersonalHabilitacionId, perhab.PersonalId, perhab.PersonalHabilitacionLugarHabilitacionId AS LugarHabilitacionId
            , perhab.PersonalHabilitacionDesde, perhab.PersonalHabilitacionHasta, perhab.PersonalHabilitacionClase , perhab.NroTramite
            FROM PersonalHabilitacion perhab 
            WHERE perhab.PersonalHabilitacionId = @0 AND perhab.PersonalId = @1
            `, [ PersonalHabilitacionId, PersonalId ])

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

        if (PersonalHabilitacionDesde) PersonalHabilitacionDesde.setHours(0,0,0,0)
        if (PersonalHabilitacionHasta) PersonalHabilitacionHasta.setHours(0,0,0,0)

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
            if ((PersonalHabilitacionDesde || PersonalHabilitacionHasta || NroTramite)
                && (!PersonalHabilitacionDesde || !PersonalHabilitacionHasta || !NroTramite)) {
                throw new ClientException(`Los campos Desde, Hasta y Nro Tramite deben de completarse al mismo tiempo`)
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

        if (PersonalHabilitacionDesde) PersonalHabilitacionDesde.setHours(0,0,0,0)
        if (PersonalHabilitacionHasta) PersonalHabilitacionHasta.setHours(0,0,0,0)

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
            if ((PersonalHabilitacionDesde || PersonalHabilitacionHasta || NroTramite)
                && (!PersonalHabilitacionDesde || !PersonalHabilitacionHasta || !NroTramite)) {
                throw new ClientException(`Los campos Desde, Hasta y Nro Tramite deben de completarse al mismo tiempo`)
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
        }
    }

    private async getHabilitacionCategoriaQuery(queryRunner: any, LugarHabilitacionId:any) {
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
        }
    }

    async addHabilitacion(req: any, res: Response, next: NextFunction) {
        
        const ip = this.getRemoteAddress(req)
        const usuario = res.locals.userName
        const fechaActual = new Date()

        const PersonalId = req.body.PersonalId
        const LugarHabilitacionId = req.body.LugarHabilitacionId
        const GestionHabilitacionEstadoCodigo = req.body.GestionHabilitacionEstadoCodigo
        const HabilitacionCategoriaCodigo = req.body.HabilitacionCategoriaCodigo
        const Detalle = req.body.Detalle
        const NroTramite = req.body.NroTramite
        const PersonalHabilitacionDesde: Date = req.body.PersonalHabilitacionDesde ? new Date(req.body.PersonalHabilitacionDesde) : null
        const PersonalHabilitacionHasta: Date = req.body.PersonalHabilitacionHasta ? new Date(req.body.PersonalHabilitacionHasta) : null
        const PersonalHabilitacionClase = req.body.PersonalHabilitacionClase
        // const AudFechaIng = req.body.AudFechaIng
        const documentos: any[] = req.body.documentos

        if (PersonalHabilitacionDesde) PersonalHabilitacionDesde.setHours(0,0,0,0)
        if (PersonalHabilitacionHasta) PersonalHabilitacionHasta.setHours(0,0,0,0)

        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            //Validación
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
            if ((PersonalHabilitacionDesde || PersonalHabilitacionHasta || NroTramite)
                && (!PersonalHabilitacionDesde || !PersonalHabilitacionHasta || !NroTramite)) {
                throw new ClientException(`Los campos Desde, Hasta y Nro Tramite deben de completarse al mismo tiempo`)
            }

            const valHabilitacionNecesaria = await queryRunner.query(`
                SELECT PersonalHabilitacionNecesariaId
                FROM PersonalHabilitacionNecesaria
                WHERE PersonalId = @0 AND PersonalHabilitacionNecesariaLugarHabilitacionId = @1
                --AND PersonalHabilitacionNecesariaDesde <= @2
                --AND (PersonalHabilitacionNecesariaHasta IS NULL OR PersonalHabilitacionNecesariaHasta >= @3)
            `, [ PersonalId, LugarHabilitacionId, PersonalHabilitacionDesde, PersonalHabilitacionHasta ])
            
            if (valHabilitacionNecesaria && !valHabilitacionNecesaria.length) {
                // throw new ClientException(`La persona no posee la habilitación necesaria para el Lugar Habilitación en el periodo seleccionado (Desde - Hasta)`)
                throw new ClientException(`La persona no posee la habilitación necesaria para el Lugar Habilitación`)
            }

            //Obtiene el Ultimo Codigo registrado
            let result = await queryRunner.query(`
                SELECT MAX(PersonalHabilitacionId) PersonalHabilitacionId
                FROM PersonalHabilitacion
                WHERE PersonalId = @0
            `, [ PersonalId ])
            const newPersonalHabilitacionId = (result && result.length)? (result[0].PersonalHabilitacionId+1) : 1
            const newCodigoUlt = 1

            await queryRunner.query(`
                INSERT INTO PersonalHabilitacion (
                PersonalHabilitacionId, PersonalId, PersonalHabilitacionLugarHabilitacionId
                , PersonalHabilitacionRechazado, PersonalHabilitacionDesde, PersonalHabilitacionHasta
                , PersonalHabilitacionClase, GestionHabilitacionCodigoUlt
                , AudFechaIng, AudFechaMod, AudIpIng, AudIpMod, AudUsuarioIng, AusUsuarioMod
                ) VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @8, @9, @9, @10, @10)
            `, [newPersonalHabilitacionId, PersonalId, LugarHabilitacionId
                , 'N', PersonalHabilitacionDesde, PersonalHabilitacionHasta
                , PersonalHabilitacionClase, newCodigoUlt
                , fechaActual, ip, usuario
            ])

            // for (const codigo of HabilitacionCategoriaCodigo) {
            //     await queryRunner.query(`
            //     INSERT INTO HabilitacionCategoriaPersonal (
            //     PersonalId, HabilitacionCategoriaCodigo, PersonalHabilitacionId, PersonalHabilitacionLugarHabilitacionId
            //     , Desde, Hasta
            //     , AudFechaIng, AudFechaMod, AudUsuarioIng, AudUsuarioMod, AudIpIng, AudIpMod
            //     ) VALUES (@0, @1, @2, @3, @4, @5, @6, @6, @7, @7, @8, @8)
            //     `, [ 
            //         PersonalId, codigo, newPersonalHabilitacionId, LugarHabilitacionId
            //         , PersonalHabilitacionDesde, PersonalHabilitacionHasta
            //         , fechaActual, usuario, ip
            //     ])
            // }

            await queryRunner.query(`
            INSERT INTO GestionHabilitacion (GestionHabilitacionCodigo, PersonalId, PersonalHabilitacionLugarHabilitacionId, PersonalHabilitacionId, GestionHabilitacionEstadoCodigo, Detalle
            , AudFechaIng, AudFechaMod, AudUsuarioIng, AudUsuarioMod, AudIpIng, AudIpMod
            ) VALUES (@0, @1, @2, @3, @4, @5, @6, @6, @7, @7, @8, @8)
            `, [newCodigoUlt, PersonalId, LugarHabilitacionId, newPersonalHabilitacionId, GestionHabilitacionEstadoCodigo, Detalle, fechaActual, usuario, ip])

            //Registra documentos
            for (const docs of documentos) {
                if (docs.files?.length > 0) {
                    for (const file of docs.files) {
                        const DocumentoFecha = file.DocumentoFecha? new Date(file.DocumentoFecha) : null
                        const DocumentoFechaDocumentoVencimiento = file.DocumentoFechaDocumentoVencimiento? new Date(file.DocumentoFechaDocumentoVencimiento) : null

                        if (DocumentoFecha) DocumentoFecha.setHours(0,0,0,0)
                        if (DocumentoFechaDocumentoVencimiento) DocumentoFechaDocumentoVencimiento.setHours(0,0,0,0)
                            
                        const uploadResult = await FileUploadController.handleDOCUpload(PersonalId, null, null, null, DocumentoFecha, DocumentoFechaDocumentoVencimiento, NroTramite, null, null, file[0], usuario, ip, queryRunner)
                        const doc_id = uploadResult && typeof uploadResult === 'object' ? uploadResult.doc_id : undefined;
                        await queryRunner.query(`
                        INSERT INTO DocumentoRelaciones (
                            DocumentoId, PersonalId, AudFechaIng, AudFechaMod, AudUsuarioIng, AudUsuarioMod
                            , AudIpIng, AudIpMod, PersonalHabilitacionId, PersonalHabilitacionLugarHabilitacionId
                        ) VALUES (@0, @1, @2, @2, @3, @3, @4, @4, @5, @6)
                        `, [doc_id, PersonalId, fechaActual, usuario, ip, newPersonalHabilitacionId, LugarHabilitacionId])
                    }
                }
            }
            
            // throw new ClientException(`DEBUG`)

            await queryRunner.commitTransaction()
            this.jsonRes({ PersonalHabilitacionId: newPersonalHabilitacionId }, res, 'Carga exitosa');
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        }
    }

    async updatePersonalHabilitacionNecesaria(req: any, res: Response, next: NextFunction) {
        const ip = this.getRemoteAddress(req)
        const usuario = res.locals.userName

        const PersonalId = req.body.PersonalId
        const LugarHabilitacionIds:number[] = req.body.LugarHabilitacionIds? req.body.LugarHabilitacionIds : []

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
        desde.setHours(0,0,0,0)
        let PersonalHabilitacionNecesariaId:number = 0

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

    private async queryHabilitacionNecesariaByPersonalId(queryRunner: any, PersonalId:any){
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
                LugarHabilitacionIds : habs
            }

            this.jsonRes(obj, res);
        } catch (error) {
            return next(error)
        }
    }

    // funcion encargada de crear o eliminar el registro de habilutacion necesaria, en base a la asistencia que posee la persona
    async backgroundProcessHabilitacionNecesaria(req: any, res: Response, next: NextFunction) {
        
        // si la persona esta de baja, eliminar la habilitacion necesaria

        // ver si tuvo asistencia en el periodo pasado, pero esta activo, no elimino la habilitacion necesaria

        // si tuvo asistencia, chequear que tenga la habilitacion necesaria, si no la tiene, crearla

        // si no tuvo asistencia, chequear si tiene habilitacion necesaria, si la tiene, eliminarla

/*      otros casos: 
                - esta activa pero no tuvo asistencia, que se hace?
                - estuvo de baja en el periodo, que se hace? se elimina la habilitacion necesaria
                - estuvo de baja en el periodo pero ahora esta activa, que se hace? se crea la habilitacion necesaria si tuvo asistencia
                - 


*/

        

    }

}