import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { QueryRunner } from "typeorm";


const getOptions: any[] = [
    { label: 'No', value: '1' },
    { label: 'Si', value: '0' },
]

const getTipos: any[] = [
    { label: 'Jerarquico', value: 'J' },
    { label: 'Administrativo', value: 'A' },
]

export class GrupoActividadController extends BaseController {

    columnasGrillaGrupos: any[] = [
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
            name: "Numero",
            type: "number",
            id: "GrupoActividadNumero",
            field: "GrupoActividadNumero",
            fieldName: "grup.GrupoActividadNumero",
            sortable: true,
        },
        {
            name: "NumeroOld",
            type: "number",
            id: "GrupoActividadNumeroOld",
            field: "GrupoActividadNumeroOld",
            fieldName: "grup.GrupoActividadNumero",
            sortable: false,
            hidden: true,
            searchHidden: true
        },
        {
            name: "Detalle",
            type: "string",
            id: "GrupoActividadDetalle",
            field: "GrupoActividadDetalle",
            fieldName: "grup.GrupoActividadDetalle",
            sortable: true,
            searchHidden: false
        },
        {
            name: "Activo",
            id: "GrupoActividadInactivo",
            field: "GrupoActividadInactivo",
            fieldName: "grup.GrupoActividadInactivo",
            formatter: 'collectionFormatter',
            exportWithFormatter: true,
            params: { collection: getOptions, },
            type: 'string',
            searchComponent: "inpurForInactivo",

            sortable: true
        },
        {
            name: "Sucursal",
            type: "string",
            id: "SucursalId",
            field: "GrupoActividadSucursalId",
            fieldName: "grup.GrupoActividadSucursalId",
            formatter: 'collectionFormatter',
            searchComponent: "inpurForSucursalSearch",
            sortable: true,
            searchHidden: false
        }

    ]

    columnasGrillaResponsables: any[] = [
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
            name: "Grupo Actividad",
            type: "string",
            id: "GrupoActividadDetalle",
            field: "GrupoActividadDetalle",
            fieldName: "ga.GrupoActividadDetalle",
            sortable: true,
            searchHidden: true
        },
        {
            name: "Grupo Actividad",
            type: "string",
            id: "GrupoActividadId",
            field: "GrupoActividadId",
            fieldName: "ga.GrupoActividadId",
            searchComponent: 'inpurForGrupoPersonaSearch',
            sortable: false,
            hidden: true,
            searchHidden: false
        },
        {
            name: "TIPO",
            id: "GrupoActividadJerarquicoComo",
            field: "GrupoActividadJerarquicoComo",
            fieldName: "jer.GrupoActividadJerarquicoComo",
            formatter: 'collectionFormatter',
            exportWithFormatter: true,
            type: 'string',
            searchComponent: "inpurForGrupoActividad",
            sortable: true
        },
        {
            name: "Apellido Nombre",
            type: "string",
            id: "ApellidoNombrePersona",
            field: "ApellidoNombrePersona",
            fieldName: "ApellidoNombrePersona",
            sortable: true,
            searchHidden: true
        },
        {
            name: "Nombre",
            type: "string",
            id: "PersonalId",
            field: "PersonalId",
            fieldName: "per.PersonalId",
            searchComponent: "inpurForPersonalSearch",
            sortable: false,
            hidden: true,
            searchHidden: false
        },
        {
            name: "Desde",
            type: "date",
            id: "GrupoActividadJerarquicoDesde",
            field: "GrupoActividadJerarquicoDesde",
            fieldName: "jer.GrupoActividadJerarquicoDesde",
            searchComponent: "inpurForFechaSearch",
            sortable: true,
        },
        {
            name: "Hasta",
            type: "date",
            id: "GrupoActividadJerarquicoHasta",
            field: "GrupoActividadJerarquicoHasta",
            fieldName: "jer.GrupoActividadJerarquicoHasta",
            searchComponent: "inpurForFechaSearch",
            sortable: true,
        }


    ]

    columnasGrillaObjetivos: any[] = [
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
            name: "Objetivo",
            type: "string",
            id: "GrupoObjetivoDetalle",
            field: "GrupoObjetivoDetalle",
            fieldName: "obj.ObjetivoDescripcion",

            sortable: true,
            searchHidden: true
        },
        {
            name: "Objetivo ",
            type: "string",
            id: "ObjetivoId",
            field: "ObjetivoId",
            fieldName: "obj.ObjetivoId",
            searchComponent: "inpurForObjetivoSearch",
            sortable: false,
            hidden: true,
        },
        {
            name: "Grupo Actividad",
            type: "string",
            id: "GrupoActividadDetalle",
            field: "GrupoActividadDetalle",
            fieldName: "ga.GrupoActividadDetalle",

            sortable: true,
            searchHidden: true
        },
        {
            name: "Grupo Actividad ",
            type: "string",
            id: "GrupoActividadId",
            field: "GrupoActividadId",
            fieldName: "ga.GrupoActividadId",
            searchComponent: "inpurForGrupoPersonaSearch",
            sortable: false,
            hidden: true,
        },
        {
            name: "Desde",
            type: "date",
            id: "GrupoActividadObjetivoDesde",
            field: "GrupoActividadObjetivoDesde",
            fieldName: "gaobj.GrupoActividadObjetivoDesde",
            searchComponent: "inpurForFechaSearch",
            sortable: true,
        },
        {
            name: "Hasta",
            type: "date",
            id: "GrupoActividadObjetivoHasta",
            field: "GrupoActividadObjetivoHasta",
            fieldName: "gaobj.GrupoActividadObjetivoHasta",
            searchComponent: "inpurForFechaSearch",
            sortable: true,
        }


    ]

    columnasGrillaPersonal: any[] = [
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
            name: "Apellido Nombre",
            type: "string",
            id: "ApellidoNombrePersona",
            field: "ApellidoNombrePersona",
            fieldName: "ApellidoNombrePersona",
            sortable: true,
            searchHidden: true
        },
        {
            name: "Nombre",
            type: "string",
            id: "PersonalId",
            field: "PersonalId",
            fieldName: "per.PersonalId",
            searchComponent: "inpurForPersonalSearch",
            sortable: false,
            hidden: true,
            searchHidden: false
        },
        {
            name: "Grupo Actividad",
            type: "string",
            id: "GrupoActividadDetalle",
            field: "GrupoActividadDetalle",
            fieldName: "ga.GrupoActividadDetalle",

            sortable: true,
            searchHidden: true
        },
        {
            name: "Grupo Actividad ",
            type: "string",
            id: "GrupoActividadId",
            field: "GrupoActividadId",
            fieldName: "ga.GrupoActividadId",
            searchComponent: "inpurForGrupoPersonaSearch",
            sortable: false,
            hidden: true,
        },
        {
            name: "Desde",
            type: "date",
            id: "GrupoActividadPersonalDesde",
            field: "GrupoActividadPersonalDesde",
            fieldName: "gaper.GrupoActividadPersonalDesde",
            searchComponent: "inpurForFechaSearch",
            sortable: true,
        },
        {
            name: "Hasta",
            type: "date",
            id: "GrupoActividadPersonalHasta",
            field: "GrupoActividadPersonalHasta",
            fieldName: "gaper.GrupoActividadPersonalHasta",
            searchComponent: "inpurForFechaSearch",
            sortable: true,
        }


    ]


    async getGridColsGrupos(req, res) {
        this.jsonRes(this.columnasGrillaGrupos, res);
    }

    async getGridColsResponsables(req, res) {
        this.jsonRes(this.columnasGrillaResponsables, res);
    }

    async getGridColsObjetivos(req, res) {
        this.jsonRes(this.columnasGrillaObjetivos
            , res);
    }

    async getGridColsPersonal(req, res) {
        this.jsonRes(this.columnasGrillaPersonal
            , res);
    }


    async getOptions(req, res) {
        this.jsonRes(getOptions, res);
    }

    async getTipos(req, res) {
        this.jsonRes(getTipos, res);
    }

    async listGrupoActividadGrupos(req: any, res: Response, next: NextFunction) {

        console.log("req.body.options.filtros ", req.body.options.filtros)
        const filterSql = filtrosToSql(req.body.options.filtros, this.columnasGrillaGrupos);

        const orderBy = orderToSQL(req.body.options.sort)
        const queryRunner = dataSource.createQueryRunner();
        const fechaActual = new Date()

        try {

            const GrupoActividad = await queryRunner.query(
                `SELECT 
                     ROW_NUMBER() OVER (ORDER BY grup.GrupoActividadId) AS id,
                     grup.GrupoActividadId,
                    grup.GrupoActividadNumero,
                    grup.GrupoActividadNumero AS GrupoActividadNumeroOld ,
                    grup.GrupoActividadDetalle,
                    IIF(grup.GrupoActividadInactivo=1, '1', '0') as GrupoActividadInactivo,
                    grup.GrupoActividadSucursalId
                    FROM GrupoActividad grup
                    
                    WHERE ${filterSql} ORDER BY   grup.GrupoActividadId ASC	`)

            this.jsonRes(
                {
                    total: GrupoActividad.length,
                    list: GrupoActividad,
                },
                res
            );

        } catch (error) {
            return next(error)
        }

    }


    async listGrupoActividadResponsables(req: any, res: Response, next: NextFunction) {

        const filterSql = filtrosToSql(req.body.options.filtros, this.columnasGrillaResponsables);
        const orderBy = orderToSQL(req.body.options.sort)
        const queryRunner = dataSource.createQueryRunner();
        const fechaActual = new Date()

        try {

            const GrupoActividadResponsables = await queryRunner.query(
                `SELECT 
                    ROW_NUMBER() OVER (ORDER BY ga.GrupoActividadId) AS id,
                    ga.GrupoActividadId,
                    ga.GrupoActividadNumero,
                    ga.GrupoActividadDetalle as detalle, 
                    ga.GrupoActividadInactivo,
                    ga.GrupoActividadSucursalId,
                    jer.GrupoActividadJerarquicoId,
                    jer.GrupoActividadJerarquicoComo,
                    jer.GrupoActividadJerarquicoComo as GrupoActividadJerarquicoComoOld,
                    jer.GrupoActividadJerarquicoPersonalId,
                    per.PersonalId,
                    CONCAT(TRIM(per.PersonalApellido),', ',TRIM(per.PersonalNombre)) AS fullName,
                    jer.GrupoActividadJerarquicoDesde,
                    jer.GrupoActividadJerarquicoHasta
            
                FROM GrupoActividadJerarquico jer
                INNER JOIN GrupoActividad ga ON jer.GrupoActividadId = ga.GrupoActividadId
                INNER JOIN Personal per ON per.PersonalId = jer.GrupoActividadJerarquicoPersonalId
                WHERE ${filterSql}`
            );

            const formattedData = GrupoActividadResponsables.map((item: any) => ({
                ...item,
                ApellidoNombrePersonaOld: {
                    id: item.PersonalId,
                    fullName: item.fullName
                },
                ApellidoNombrePersona: {
                    id: item.PersonalId,
                    fullName: item.fullName
                },
                GrupoActividadDetalle: {
                    id: item.GrupoActividadId,
                    fullName: item.detalle
                },
                GrupoActividadDetalleOld: {
                    id: item.GrupoActividadId,
                    fullName: item.detalle
                }
            }));

            this.jsonRes(
                {
                    total: formattedData.length,
                    list: formattedData,
                },
                res
            );


        } catch (error) {
            return next(error)
        }

    }


    async listGrupoActividadObjetivos(req: any, res: Response, next: NextFunction) {

        const filterSql = filtrosToSql(req.body.options.filtros, this.columnasGrillaObjetivos);
        const orderBy = orderToSQL(req.body.options.sort)
        const queryRunner = dataSource.createQueryRunner();
        const fechaActual = new Date()

        try {

            const GrupoActividadObjetivos = await queryRunner.query(
                `SELECT 
                    ROW_NUMBER() OVER (ORDER BY ga.GrupoActividadId) AS id,
                    ga.GrupoActividadId,
                    ga.GrupoActividadNumero,
                     ga.GrupoActividadDetalle as detalle, 
                    ga.GrupoActividadInactivo,
                    ga.GrupoActividadSucursalId,

                    obj.ObjetivoId,
                    obj.ObjetivoDescripcion,
                    gaobj.GrupoActividadObjetivoId,
                    gaobj.GrupoActividadObjetivoObjetivoId,
                    gaobj.GrupoActividadObjetivoDesde,
                    gaobj.GrupoActividadObjetivoHasta

                    FROM GrupoActividadObjetivo gaobj
                    INNER JOIN GrupoActividad ga ON gaobj.GrupoActividadId = ga.GrupoActividadId
                    INNER JOIN Objetivo obj ON obj.ObjetivoId = gaobj.GrupoActividadObjetivoObjetivoId
                    
                WHERE ${filterSql} ORDER BY obj.ObjetivoDescripcion`
            );

            const formattedData = GrupoActividadObjetivos.map((item: any) => ({
                ...item,
                GrupoActividadDetalle: {
                    id: item.GrupoActividadId,
                    fullName: item.detalle
                },
                GrupoActividadDetalleOld: {
                    id: item.GrupoActividadId,
                    fullName: item.detalle
                },
                GrupoObjetivoDetalle: {
                    id: item.ObjetivoId,
                    fullName: item.ObjetivoDescripcion
                },
                GrupoObjetivoDetalleOld: {
                    id: item.ObjetivoId,
                    fullName: item.ObjetivoDescripcion
                }
            }));

            this.jsonRes(
                {
                    total: formattedData.length,
                    list: formattedData,
                },
                res
            );


        } catch (error) {
            return next(error)
        }

    }

    async listGrupoActividadPersonal(req: any, res: Response, next: NextFunction) {

        const filterSql = filtrosToSql(req.body.options.filtros, this.columnasGrillaPersonal);
        const orderBy = orderToSQL(req.body.options.sort)
        const queryRunner = dataSource.createQueryRunner();
        const fechaActual = new Date()

        try {

            const GrupoActividadPersonal = await queryRunner.query(
                `SELECT 
                    ROW_NUMBER() OVER (ORDER BY ga.GrupoActividadId) AS id,
                    ga.GrupoActividadId,
                    ga.GrupoActividadDetalle as detalle, 
                    ga.GrupoActividadNumero,
                    ga.GrupoActividadDetalle, 

                    gaper.GrupoActividadPersonalId,
                    per.PersonalId,
                    CONCAT(TRIM(per.PersonalApellido),', ',TRIM(per.PersonalNombre)) ApellidoNombrePersona,

                    gaper.GrupoActividadPersonalDesde,
                    gaper.GrupoActividadPersonalHasta

                FROM GrupoActividadPersonal gaper
                LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gaper.GrupoActividadId
                LEFT JOIN Personal per ON per.PersonalId = gaper.GrupoActividadPersonalPersonalId
                WHERE ${filterSql}`
            );

            const formattedData = GrupoActividadPersonal.map((item: any) => ({
                ...item,
                GrupoActividadDetalle: {
                    id: item.GrupoActividadId,
                    fullName: item.detalle
                },
                GrupoActividadDetalleOld: {
                    id: item.GrupoActividadId,
                    fullName: item.detalle
                },
                ApellidoNombrePersonaOld: {
                    id: item.PersonalId,
                    fullName: item.ApellidoNombrePersona
                },
                ApellidoNombrePersona: {
                    id: item.PersonalId,
                    fullName: item.ApellidoNombrePersona
                },
            }));

            this.jsonRes(
                {
                    total: formattedData.length,
                    list: formattedData,
                },
                res
            );


        } catch (error) {
            return next(error)
        }

    }

    async changecellgrupo(req: any, res: Response, next: NextFunction) {

        const ip = this.getRemoteAddress(req)
        const queryRunner = dataSource.createQueryRunner();
        const usuarioId = await this.getUsuarioId(res, queryRunner)

        const fechaActual = new Date()
        let message = ""
        const params = req.body

        try {
            console.log("params ", params)
            //throw new ClientException(`test`)
            await queryRunner.connect();
            await queryRunner.startTransaction();


            const codigoExist = await queryRunner.query(`SELECT *  FROM GrupoActividad WHERE GrupoActividadId = @0`, [params.GrupoActividadId])
            let dataResultado = {}

            if (codigoExist.length > 0) { //Entro en update
                //Validar si cambio el código
                console.log(" voy a hacer update")

                await this.validateFormGrupo(params, queryRunner)

                if (params.GrupoActividadNumero != params.GrupoActividadNumeroOld) {

                    let validateGrupoActividadNumero = await queryRunner.query(`SELECT * FROM GrupoActividad WHERE GrupoActividadNumero = @0`, [params.GrupoActividadNumero])

                    if (validateGrupoActividadNumero.length > 0) {
                        throw new ClientException(`El Numero ingresado ya existe`)
                    }
                }

                await queryRunner.query(`UPDATE GrupoActividad SET GrupoActividadNumero = @1,GrupoActividadDetalle = @2,GrupoActividadInactivo=@3,GrupoActividadSucursalId=@4
                    WHERE GrupoActividadId = @0`, [params.GrupoActividadId, params.GrupoActividadNumero, params.GrupoActividadDetalle, params.GrupoActividadInactivo, params.GrupoActividadSucursalId])

                dataResultado = { action: 'U' }
                message = "Actualizacion exitosa"

            } else {  //Es un nuevo registro


                console.log('El código no existe - es nuevo')
                await this.validateFormGrupo(params, queryRunner)

                let validateGrupoActividadNumero = await queryRunner.query(`SELECT * FROM GrupoActividad WHERE GrupoActividadNumero = @0`, [params.GrupoActividadNumero])

                if (validateGrupoActividadNumero.length > 0) {
                    throw new ClientException(`El Numero ingresado ya existe`)
                }

                let GrupoActividadPersonalUltNro = 0
                let GrupoActividadJerarquicoUltNro = 0

                let GrupoActividadObjetivoUltNro = 0

                let day = new Date()
                const time = this.getTimeString(day)
                day.setHours(0, 0, 0, 0)


                await queryRunner.query(`
                    INSERT INTO "GrupoActividad" (
                        "GrupoActividadNumero", 
                        "GrupoActividadDetalle", 
                        "GrupoActividadPersonalUltNro", 
                        "GrupoActividadJerarquicoUltNro", 
                        "GrupoActividadInactivo", 
                        "GrupoActividadPuesto", 
                        "GrupoActividadDia", 
                        "GrupoActividadTiempo", 
                        "GrupoActividadUsuarioId", 
                        "GrupoActividadSucursalId", 
                        "GrupoActividadObjetivoUltNro"
                    ) 
                    VALUES ( @0,@1,@2, @3, @4, @5,@6, @7,@8, @9,@10 )`,
                    [params.GrupoActividadNumero,
                    params.GrupoActividadDetalle,
                        GrupoActividadPersonalUltNro,
                        GrupoActividadJerarquicoUltNro,
                    params.GrupoActividadInactivo,
                        ip,
                        day,
                        time,
                        usuarioId,
                    params.GrupoActividadSucursalId,
                        GrupoActividadObjetivoUltNro
                    ]
                );

                dataResultado = { action: 'I' }
                message = "Carga de nuevo Registro exitoso"
            }

            await queryRunner.commitTransaction()
            return this.jsonRes(dataResultado, res, message)
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        }

    }

    async changecellResponsable(req: any, res: Response, next: NextFunction) {

        const ip = this.getRemoteAddress(req)
        const queryRunner = dataSource.createQueryRunner();
        const usuarioId = await this.getUsuarioId(res, queryRunner)

        let message = ""
        const params = req.body
        const GrupoActividadJerarquicoDesde = new Date(params.GrupoActividadJerarquicoDesde)

        const GrupoActividadJerarquicoHastaNew = (params.GrupoActividadJerarquicoHasta) ? new Date(params.GrupoActividadJerarquicoHasta) : null
        if (GrupoActividadJerarquicoHastaNew) GrupoActividadJerarquicoHastaNew.setHours(0, 0, 0, 0)

        try {
            await queryRunner.connect()
            await queryRunner.startTransaction()

            const codigoExist = await queryRunner.query(`SELECT * FROM GrupoActividadJerarquico WHERE GrupoActividadJerarquicoId = @0 AND GrupoActividadId = @1`, [params.GrupoActividadJerarquicoId, params.GrupoActividadId])

            let dataResultado = {}
            let GrupoActividadJerarquicoHasta: Date

            if (codigoExist.length) { //Entro en update
                //Validar si cambio el código
                const orig = codigoExist[0]
                await this.validateFormResponsables(params, queryRunner)

                const desdeOrig = new Date(orig.GrupoActividadJerarquicoDesde)
                if (desdeOrig.getTime() != GrupoActividadJerarquicoDesde.getTime()) {
                    await this.checkDateDesde(desdeOrig, GrupoActividadJerarquicoDesde, queryRunner)

                    const maxFechaRec = await queryRunner.query(`SELECT MAX(GrupoActividadJerarquicoHasta) GrupoActividadJerarquicoHasta FROM GrupoActividadJerarquico WHERE GrupoActividadJerarquicoPersonalId = @0 AND GrupoActividadId = @1`, [params.ApellidoNombrePersona.id, params.GrupoActividadId])
                    const maxFecha = new Date(maxFechaRec[0].GrupoActividadJerarquicoHasta);
                    if (GrupoActividadJerarquicoDesde <= maxFecha)
                        throw new ClientException(`La fecha desde ser mayor a ${this.dateOutputFormat(maxFecha)}`)
                }

                if (GrupoActividadJerarquicoHastaNew) {
                    await this.checkDateHasta(GrupoActividadJerarquicoDesde, GrupoActividadJerarquicoHastaNew, queryRunner)
                    params.GrupoActividadJerarquicoHasta = GrupoActividadJerarquicoHastaNew
                }


                if (params.GrupoActividadJerarquicoComo == 'J' && params.GrupoActividadDetalle.id != params.GrupoActividadDetalleOld.id) {

                    const result = await queryRunner.query(` SELECT * FROM GrupoActividadJerarquico  
                        WHERE GrupoActividadId = @0 AND GrupoActividadJerarquicoComo = @1`, [params.GrupoActividadDetalle.id, params.GrupoActividadJerarquicoComo]);

                    if (result.length > 0) {
                        throw new ClientException(`EL grupo actividad ya posee un jerarquico`)
                    }
                }

                await queryRunner.query(`UPDATE GrupoActividadJerarquico
                    SET GrupoActividadJerarquicoComo = @0, GrupoActividadJerarquicoDesde = @1, GrupoActividadJerarquicoHasta = @2
                    WHERE GrupoActividadJerarquicoId = @3 AND GrupoActividadId = @5
                    AND GrupoActividadId = @4`,
                    [params.GrupoActividadJerarquicoComo, params.GrupoActividadJerarquicoDesde, params.GrupoActividadJerarquicoHasta, params.GrupoActividadJerarquicoId,
                    params.GrupoActividadId, params.GrupoActividadDetalle.id
                    ])

                dataResultado = { action: 'U', GrupoActividadId: params.GrupoActividadId, GrupoActividadJerarquicoId: params.GrupoActividadJerarquicoId }
                message = "Actualizacion exitosa"

            } else {  //Es un nuevo registro
                GrupoActividadJerarquicoDesde.setHours(0, 0, 0, 0)

                await this.validateFormResponsables(params, queryRunner)

                const { GrupoActividadJerarquicoComo, GrupoActividadDetalle, ApellidoNombrePersona } = params

                await this.checkDateDesde(null, GrupoActividadJerarquicoDesde, queryRunner)
                if (GrupoActividadJerarquicoHasta)
                    await this.checkDateHasta(null, GrupoActividadJerarquicoHastaNew, queryRunner)

                if (GrupoActividadJerarquicoComo == 'J') {
                    const jerarquico = await queryRunner.query(
                        `SELECT GrupoActividadJerarquicoId, GrupoActividadId, GrupoActividadJerarquicoDesde FROM GrupoActividadJerarquico WHERE GrupoActividadId = @0 AND GrupoActividadJerarquicoComo = @1  AND GrupoActividadJerarquicoDesde <= @2 AND  ISNULL(GrupoActividadJerarquicoHasta,'9999-12-31') >= @2`,
                        [GrupoActividadDetalle.id, GrupoActividadJerarquicoComo, GrupoActividadJerarquicoDesde]
                    );
                    if (jerarquico.length > 0) {
                        const GrupoActividadJerarquicoHasta = new Date(GrupoActividadJerarquicoDesde)
                        GrupoActividadJerarquicoHasta.setDate(GrupoActividadJerarquicoHasta.getDate() - 1)
                        GrupoActividadJerarquicoHasta.setHours(0, 0, 0, 0)

                        await queryRunner.query(
                            `UPDATE GrupoActividadJerarquico SET GrupoActividadJerarquicoHasta = @2 WHERE GrupoActividadJerarquicoId=@0 And GrupoActividadId = @1`,
                            [jerarquico[0].GrupoActividadId, jerarquico[0].GrupoActividadJerarquicoId, GrupoActividadJerarquicoHasta])
                    }
                }
                const mismaPersona = await queryRunner.query(
                    `SELECT GrupoActividadJerarquicoId, GrupoActividadId, GrupoActividadJerarquicoDesde FROM GrupoActividadJerarquico WHERE GrupoActividadId = @0 AND GrupoActividadJerarquicoComo = @1  AND GrupoActividadJerarquicoDesde <= @2 AND  ISNULL(GrupoActividadJerarquicoHasta,'9999-12-31') >= @2 AND GrupoActividadJerarquicoPersonalId=@3 `,
                    [GrupoActividadDetalle.id, GrupoActividadJerarquicoComo, GrupoActividadJerarquicoDesde, ApellidoNombrePersona.id])
                if (mismaPersona.length > 0)
                    throw new ClientException(`Ya existe un registro con misma persona, tipo y grupo vigente`)

                let day = new Date()
                const time = this.getTimeString(day)
                day.setHours(0, 0, 0, 0)


                let GrupoActividadJerarquicoUltNro = await queryRunner.query(` SELECT GrupoActividadJerarquicoUltNro FROM GrupoActividad WHERE GrupoActividadId =  @0`, [params.GrupoActividadDetalle.id])
                GrupoActividadJerarquicoUltNro = GrupoActividadJerarquicoUltNro[0].GrupoActividadJerarquicoUltNro + 1


                await queryRunner.query(`
                    INSERT INTO "GrupoActividadJerarquico" (
                        GrupoActividadJerarquicoId,
                        GrupoActividadId,
                        GrupoActividadJerarquicoComo,
                        GrupoActividadJerarquicoPersonalId,
                        GrupoActividadJerarquicoDesde,
                        GrupoActividadJerarquicoHasta,
                        GrupoActividadJerarquicoPuesto,
                        GrupoActividadJerarquicoUsuarioId,
                        GrupoActividadJerarquicoDia,
                        GrupoActividadJerarquicoTiempo 
                      
                    ) 
                    VALUES ( @0,@1,@2, @3, @4, @5,@6, @7,@8, @9 )`,
                    [GrupoActividadJerarquicoUltNro, params.GrupoActividadDetalle.id, params.GrupoActividadJerarquicoComo, params.ApellidoNombrePersona.id,
                        params.GrupoActividadJerarquicoDesde, params.GrupoActividadJerarquicoHasta, ip, usuarioId, day, time
                    ]);

                await queryRunner.query(`UPDATE GrupoActividad
                SET GrupoActividadJerarquicoUltNro = @0
                WHERE GrupoActividadId =  @1`, [GrupoActividadJerarquicoUltNro, params.GrupoActividadDetalle.id])


                dataResultado = { action: 'I', GrupoActividadId: params.GrupoActividadDetalle.id, GrupoActividadJerarquicoId: GrupoActividadJerarquicoUltNro, PreviousDate: GrupoActividadJerarquicoHasta }
                message = "Carga de nuevo Registro exitoso"

                throw new ClientException('debug')

            }


            await queryRunner.commitTransaction()
            return this.jsonRes(dataResultado, res, message)
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        }

    }

    async checkDateDesde(desdeOrig: Date, desdeNew: Date, queryRunner: QueryRunner) {
        const cierre = await queryRunner.query(`SELECT TOP 1 *, EOMONTH(DATEFROMPARTS(anio, mes, 1)) AS FechaCierre FROM lige.dbo.liqmaperiodo WHERE ind_recibos_generados = 1 ORDER BY anio DESC, mes DESC `)
        const FechaCierre = new Date(cierre[0].FechaCierre);

        if (desdeOrig && desdeOrig < FechaCierre)
            throw new ClientException(`No se puede modificar la fecha desde, es menor a la fecha del último periodo cerrado ${this.dateOutputFormat(FechaCierre)}`)

        if (desdeNew <= FechaCierre)
            throw new ClientException(`Fecha desde debe ser mayor a la fecha del último periodo cerrado ${this.dateOutputFormat(FechaCierre)}`)

        return true
    }

    async checkDateHasta(desde: Date, hastaNew: Date, queryRunner: QueryRunner) {
        const cierre = await queryRunner.query(`SELECT TOP 1 *, EOMONTH(DATEFROMPARTS(anio, mes, 1)) AS FechaCierre FROM lige.dbo.liqmaperiodo WHERE ind_recibos_generados = 1 ORDER BY anio DESC, mes DESC `)
        const FechaCierre = new Date(cierre[0].FechaCierre);

        if (hastaNew <= desde)
            throw new ClientException(`Fecha hasta debe ser mayor al desde`)

        if (hastaNew < FechaCierre)
            throw new ClientException(`Fecha hasta debe ser mayor o igual a la fecha del último periodo cerrado ${this.dateOutputFormat(FechaCierre)}`)

        return true
    }


    async changecellObjetivos(req: any, res: Response, next: NextFunction) {

        const ip = this.getRemoteAddress(req)
        const queryRunner = dataSource.createQueryRunner();
        const usuarioId = await this.getUsuarioId(res, queryRunner)

        const fechaActual = new Date()
        const time = this.getTimeString(fechaActual)
        let message = ""
        const params = req.body

        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            fechaActual.setHours(0, 0, 0, 0)


            let dataResultado = {}

            const codigoExist = await queryRunner.query(`SELECT * FROM GrupoActividadObjetivo WHERE GrupoActividadObjetivoId = @0 AND GrupoActividadId = @1`, [params.GrupoActividadObjetivoId, params.GrupoActividadId])
            if (codigoExist.length > 0) { //Entro en update
                const orig = codigoExist[0]

                const desdeOrig = new Date(orig.GrupoActividadObjetivoDesde)
                const desdeNew = new Date(params.GrupoActividadObjetivoDesde)
                if (desdeOrig.getTime() != desdeNew.getTime()) {
                    await this.checkDateDesde(desdeOrig, desdeNew, queryRunner)

                    const maxFechaRec = await queryRunner.query(`SELECT MAX(GrupoActividadObjetivoHasta) GrupoActividadObjetivoHasta FROM GrupoActividadObjetivo WHERE GrupoActividadObjetivoObjetivoId = @0 AND GrupoActividadId = @1`, [params.ObjetivoId, params.GrupoActividadId])
                    const maxFecha = new Date(maxFechaRec[0].GrupoActividadObjetivoHasta);
                    if (desdeNew <= maxFecha)
                        throw new ClientException(`La fecha desde ser mayor a ${this.dateOutputFormat(maxFecha)}`)

                }

                if (params.GrupoActividadObjetivoHasta) {
                    const hasta = new Date(params.GrupoActividadObjetivoHasta)
                    hasta.setHours(0, 0, 0, 0)

                    await this.checkDateHasta(desdeNew, hasta, queryRunner)
                    params.GrupoActividadObjetivoHasta = hasta
                }

                await this.validateFormObjetivos(params, queryRunner)

                await queryRunner.query(`
                    UPDATE GrupoActividadObjetivo
                    SET GrupoActividadObjetivoDesde = @2,GrupoActividadObjetivoHasta = @3,
                        GrupoActividadObjetivoPuesto = @4,GrupoActividadObjetivoUsuarioId = @5,
                        GrupoActividadObjetivoDia = @6,GrupoActividadObjetivoTiempo = @7
                    WHERE GrupoActividadObjetivoObjetivoId = @0 AND GrupoActividadId = @1 AND GrupoActividadObjetivoId = @8
                `, [
                    params.GrupoActividadObjetivoObjetivoId,
                    params.GrupoActividadDetalle.id,
                    params.GrupoActividadObjetivoDesde,
                    params.GrupoActividadObjetivoHasta,
                    ip,
                    usuarioId,
                    fechaActual,
                    time,
                    params.GrupoActividadObjetivoId
                ])


                dataResultado = { action: 'U', GrupoActividadId: params.GrupoActividadId }
                message = "Actualizacion exitosa"
            } else {  //Es un nuevo registro
                await this.validateFormObjetivos(params, queryRunner)


                let resultQuery = await queryRunner.query(`
                SELECT TOP 1 * FROM GrupoActividadObjetivo 
                WHERE GrupoActividadObjetivoObjetivoId = @0
                --  AND GrupoActividadObjetivoDesde >= @1
                -- AND (GrupoActividadObjetivoHasta  <= @1 OR GrupoActividadObjetivoHasta IS NULL)
                ORDER BY GrupoActividadObjetivoDesde DESC, GrupoActividadObjetivoHasta DESC
            `, [params.GrupoObjetivoDetalle.id, fechaActual])

                // console.log("result ", result)

                const ultimoRegistroQuery = resultQuery[0]

                console.log("ultimoRegistroQuery ", ultimoRegistroQuery)

                const GrupoActividadObjetivoHasta = new Date(params.GrupoActividadObjetivoDesde)
                GrupoActividadObjetivoHasta.setDate(GrupoActividadObjetivoHasta.getDate() - 1)
                //const formattedDate = GrupoActividadObjetivoHasta.toISOString().split('T')[0] + "T00:00:00.000Z"

                //throw new ClientException(`test`)
                const validarGrupoActividadVigente = (registro) => {

                    if (
                        registro?.GrupoActividadObjetivoHasta
                            ? new Date(params?.GrupoActividadObjetivoDesde) <= new Date(registro?.GrupoActividadObjetivoHasta)
                            : new Date(params?.GrupoActividadObjetivoDesde) <= new Date(registro?.GrupoActividadObjetivoDesde)
                    ) {
                        const fecha = registro.GrupoActividadObjetivoHasta ? registro.GrupoActividadObjetivoHasta : registro.GrupoActividadObjetivoDesde
                        throw new ClientException(`La fecha desde debe ser mayor a ${this.dateOutputFormat(fecha)} `)
                    }

                    // if (registro?.GrupoActividadId == params.GrupoActividadDetalle.id &&
                    //     (!registro?.GrupoActividadObjetivoHasta || new Date(registro.GrupoActividadObjetivoHasta) >= fechaActual)
                    // ) {
                    //     throw new ClientException(`Ya se encuentra vigente el grupo actividad con el objetivo`)
                    // }


                };

                const actualizarGrupoActividadHasta = async (registro) => {


                    if (registro && (!registro.GrupoActividadObjetivoHasta)) {
                        await queryRunner.query(
                            `UPDATE GrupoActividadObjetivo 
                             SET GrupoActividadObjetivoHasta = @2 
                             WHERE GrupoActividadId = @0 
                             AND GrupoActividadObjetivoObjetivoId = @1
                             AND GrupoActividadObjetivoId = @3`,

                            [registro.GrupoActividadId, registro.GrupoActividadObjetivoObjetivoId, GrupoActividadObjetivoHasta, registro.GrupoActividadObjetivoId]
                        )
                    }
                }

                if (resultQuery.length > 0) {
                    validarGrupoActividadVigente(ultimoRegistroQuery)
                    actualizarGrupoActividadHasta(ultimoRegistroQuery)
                }

                let GrupoActividadObjetivoId = await queryRunner.query(` SELECT GrupoActividadObjetivoUltNro FROM GrupoActividad WHERE GrupoActividadId =  @0`, [params.GrupoActividadDetalle.id])
                GrupoActividadObjetivoId = GrupoActividadObjetivoId[0].GrupoActividadObjetivoUltNro + 1


                let GrupoActividadObjetivoDesdeInsert = new Date(params.GrupoActividadObjetivoDesde)
                GrupoActividadObjetivoDesdeInsert.toISOString().split('T')[0] + "T00:00:00.000Z"

                let GrupoActividadObjetivoHastaInsert = params.GrupoActividadObjetivoHasta
                    ? new Date(params.GrupoActividadObjetivoHasta).toISOString().split('T')[0] + "T00:00:00.000Z"
                    : null


                await queryRunner.query(`INSERT INTO "GrupoActividadObjetivo" (
                    "GrupoActividadObjetivoId",
                    "GrupoActividadId",
                    "GrupoActividadObjetivoObjetivoId",
                    "GrupoActividadObjetivoDesde",
                    "GrupoActividadObjetivoHasta",
                    "GrupoActividadObjetivoPuesto",
                    "GrupoActividadObjetivoUsuarioId",
                    "GrupoActividadObjetivoDia",
                    "GrupoActividadObjetivoTiempo"
                ) VALUES ( @0,@1,@2, @3,@4, @5,@6, @7,@8 );
                `, [GrupoActividadObjetivoId, params.GrupoActividadDetalle.id, params.GrupoObjetivoDetalle.id,
                    GrupoActividadObjetivoDesdeInsert, GrupoActividadObjetivoHastaInsert, ip, usuarioId, fechaActual, time])


                await queryRunner.query(`UPDATE GrupoActividad
                    SET GrupoActividadObjetivoUltNro = @0
                    WHERE GrupoActividadId =  @1`, [GrupoActividadObjetivoId, params.GrupoActividadDetalle.id])

                dataResultado = { action: 'I', GrupoActividadId: params.GrupoActividadDetalle.id, GrupoActividadObjetivoObjetivoId: params.GrupoObjetivoDetalle.id, PreviousDate: GrupoActividadObjetivoHasta }
                message = "Carga de nuevo Registro exitoso"
            }


            await queryRunner.commitTransaction()
            return this.jsonRes(dataResultado, res, message)
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        }

    }


    async changecellPersonal(req: any, res: Response, next: NextFunction) {

        const ip = this.getRemoteAddress(req)
        const queryRunner = dataSource.createQueryRunner();
        const usuarioId = await this.getUsuarioId(res, queryRunner)

        const fechaActual = new Date()
        const time = this.getTimeString(fechaActual)
        let message = ""
        const params = req.body

        try {
            console.log("params objetivos ", params)
            //throw new ClientException(`test`)
            await queryRunner.connect();
            await queryRunner.startTransaction();

            fechaActual.setHours(0, 0, 0, 0)

            let dataResultado = {}
            let GrupoActividadPersonalHasta

            const codigoExist = await queryRunner.query(`SELECT * FROM GrupoActividadPersonal WHERE GrupoActividadPersonalId = @0 AND GrupoActividadId = @1`, [params.GrupoActividadPersonalId, params.GrupoActividadId])
            if (codigoExist.length > 0) { //Entro en update
                const orig = codigoExist[0]

                const desdeOrig = new Date(orig.GrupoActividadPersonalDesde)
                const desdeNew = new Date(params.GrupoActividadPersonalDesde)
                if (desdeOrig.getTime() != desdeNew.getTime()) {
                    await this.checkDateDesde(desdeOrig, desdeNew, queryRunner)

                    const maxFechaRec = await queryRunner.query(`SELECT MAX(GrupoActividadPersonalHasta) GrupoActividadPersonalHasta FROM GrupoActividadPersonal WHERE GrupoActividadPersonalPersonalId = @0 AND GrupoActividadId = @1`, [params.PersoanlId, params.GrupoActividadId])
                    const maxFecha = new Date(maxFechaRec[0].GrupoActividadObjetivoHasta);
                    if (desdeNew <= maxFecha)
                        throw new ClientException(`La fecha desde ser mayor a ${this.dateOutputFormat(maxFecha)}`)

                }

                if (params.GrupoActividadPersonalHasta) {
                    const hasta = new Date(params.GrupoActividadPersonalHasta)
                    hasta.setHours(0, 0, 0, 0)

                    await this.checkDateHasta(desdeNew, hasta, queryRunner)
                    params.GrupoActividadPersonalHasta = hasta
                }

                //Validar si cambio el código
                console.log('El código no existe - es update personal')

                await this.validateFormPersonal(params, queryRunner)

                await queryRunner.query(`
                    UPDATE GrupoActividadPersonal
                    SET GrupoActividadPersonalDesde = @2,GrupoActividadPersonalHasta = @3,
                        GrupoActividadPersonalPuesto = @4,GrupoActividadPersonalUsuarioId = @5,
                        GrupoActividadPersonalDia = @6,GrupoActividadPersonalTiempo = @7
                    WHERE GrupoActividadId = @0 AND GrupoActividadPersonalPersonalId = @1
                `, [
                    params.GrupoActividadId,
                    params.ApellidoNombrePersona.id,
                    params.GrupoActividadPersonalDesde,
                    params.GrupoActividadPersonalHasta,
                    ip,
                    usuarioId,
                    fechaActual,
                    time
                ])


                dataResultado = { action: 'U', GrupoActividadId: params.GrupoActividadId }
                message = "Actualizacion exitosa"

            } else {  //Es un nuevo registro

                console.log('El código no existe - es nuevo personal')

                await this.validateFormPersonal(params, queryRunner)

                let resultQuery = await queryRunner.query(`
                SELECT TOP 1 * FROM GrupoActividadPersonal 
                WHERE GrupoActividadPersonalPersonalId = @0
                ORDER BY GrupoActividadPersonalDesde DESC, GrupoActividadPersonalHasta DESC`, [params.ApellidoNombrePersona.id])


                const ultimoRegistroQuery = resultQuery[0]
                console.log("ultimoRegistroQuery ", ultimoRegistroQuery)

                GrupoActividadPersonalHasta = new Date(params.GrupoActividadPersonalDesde)
                GrupoActividadPersonalHasta.setDate(GrupoActividadPersonalHasta.getDate() - 1)

                const validarGrupoActividadVigente = (registro) => {
                    if (
                        registro?.GrupoActividadPersonalHasta
                            ? new Date(params?.GrupoActividadPersonalDesde) <= new Date(registro?.GrupoActividadPersonalHasta)
                            : new Date(params?.GrupoActividadPersonalDesde) <= new Date(registro?.GrupoActividadPersonalDesde)
                    ) {
                        const fecha = registro.GrupoActividadPersonalHasta ? registro.GrupoActividadPersonalHasta : registro.GrupoActividadPersonalDesde
                        throw new ClientException(`La fecha desde debe ser mayor a ${this.dateOutputFormat(fecha)} `)
                    }
                };

                const ActualizarGrupoActividadPersonalHasta = async (registro) => {


                    if (registro && (!registro.GrupoActividadPersonalHasta)) {
                        await queryRunner.query(
                            `UPDATE GrupoActividadPersonal 
                             SET GrupoActividadPersonalHasta = @1 
                             WHERE GrupoActividadPersonalId = @0 
                             AND GrupoActividadPersonalPersonalId = @2`,

                            [registro.GrupoActividadPersonalId, GrupoActividadPersonalHasta, registro.GrupoActividadPersonalPersonalId]
                        )
                    }
                }

                if (resultQuery.length > 0) {
                    validarGrupoActividadVigente(ultimoRegistroQuery)
                    ActualizarGrupoActividadPersonalHasta(ultimoRegistroQuery)
                }

                let GrupoActividadPersonalId = await queryRunner.query(` SELECT GrupoActividadPersonalUltNro FROM GrupoActividad WHERE GrupoActividadId =  @0`, [params.GrupoActividadDetalle.id])
                GrupoActividadPersonalId = GrupoActividadPersonalId[0].GrupoActividadPersonalUltNro + 1

                await queryRunner.query(`INSERT INTO GrupoActividadPersonal (
                   		GrupoActividadPersonalId,
                        GrupoActividadId,
                        GrupoActividadPersonalPersonalId,
                        GrupoActividadPersonalDesde,
                        GrupoActividadPersonalHasta,

                        GrupoActividadPersonalReasignado,
                        GrupoActividadPersonalEsReten,

                        GrupoActividadPersonalPuesto,
                        GrupoActividadPersonalUsuarioId,
                        GrupoActividadPersonalDia,
                        GrupoActividadPersonalTiempo) VALUES ( @0,@1,@2, @3,@4, @5,@6, @7,@8,@9,@10);
                `, [GrupoActividadPersonalId,
                    params.GrupoActividadDetalle.id,
                    params.ApellidoNombrePersona.id,
                    params.GrupoActividadPersonalDesde,
                    params.GrupoActividadPersonalHasta,
                    false,
                    null,
                    ip,
                    usuarioId,
                    fechaActual,
                    time])


                await queryRunner.query(`UPDATE GrupoActividad
                    SET GrupoActividadPersonalUltNro = @0
                    WHERE GrupoActividadId =  @1`, [GrupoActividadPersonalId, params.GrupoActividadDetalle.id])

                dataResultado = { action: 'I', GrupoActividadId: params.GrupoActividadDetalle.id, GrupoActividadPersonalPersonalId: params.ApellidoNombrePersona.id, PreviousDate: GrupoActividadPersonalHasta }
                message = "Carga de nuevo Registro exitoso"
            }


            await queryRunner.commitTransaction()
            return this.jsonRes(dataResultado, res, message)
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        }

    }



    async deleteGrupo(req: any, res: Response, next: NextFunction) {

        let cod_grupo_actividad = req.query[0]
        //throw new ClientException(`test`)
        const queryRunner = dataSource.createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction()
        try {

            await queryRunner.query(`DELETE FROM GrupoActividad WHERE GrupoActividadId = @0`, [cod_grupo_actividad])

            await queryRunner.commitTransaction()
            return this.jsonRes("", res, "Borrado Exitoso")
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        }
    }

    async deleteResponsables(req: any, res: Response, next: NextFunction) {

        let cod_grupo_jerarquico_id = req.query[0]
        let cod_grupo_actividad = req.query[1]
        let fecha_hasta = req.query[2]
        const queryRunner = dataSource.createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction()
        try {

            if (fecha_hasta && fecha_hasta !== 'null') {
                throw new ClientException(`No se puede borrar un registro que tenga fecha Hasta.`)
            }

            await queryRunner.query(`DELETE FROM GrupoActividadJerarquico WHERE GrupoActividadJerarquicoId = @0 AND GrupoActividadId = @1`, [cod_grupo_jerarquico_id, cod_grupo_actividad])

            await queryRunner.commitTransaction()
            return this.jsonRes("", res, "Borrado Exitoso")
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        }
    }

    async validateFormGrupo(params: any, queryRunner: any) {



        if (!params.GrupoActividadNumero) {
            throw new ClientException(`Debe completar el campo Numero.`)
        }

        if (!params.GrupoActividadDetalle && !params.PersonalId) {
            throw new ClientException(`Debe completar el campo Detalle.`)
        }
        if (!params.GrupoActividadInactivo) {
            throw new ClientException(`Debe completar el campo Inactivo.`)
        }
        if (!params.GrupoActividadSucursalId) {
            throw new ClientException(`Debe completar el campo Sucursal.`)
        }



    }


    async validateFormResponsables(params: any, queryRunner: any) {

        if (params.GrupoActividadId != 0) {

            if (params.ApellidoNombrePersonaOld.id != params.ApellidoNombrePersona.id) {
                throw new ClientException(`Para Modiciar el Apellido y Nombre tiene que crear un nuevo registro.`)
            }
            if (params.GrupoActividadDetalle.id != params.GrupoActividadDetalleOld.id) {
                throw new ClientException(`Para Modiciar el Grupo Actividad tiene que crear un nuevo registro.`)
            }

            if (params.GrupoActividadJerarquicoComo != params.GrupoActividadJerarquicoComoOld) {
                throw new ClientException(`Para Modiciar el Tipo tiene que crear un nuevo registro.`)
            }

        } else {


            if (!params.GrupoActividadDetalle?.id) {
                throw new ClientException(`Debe completar el campo Grupo Actividad.`)
            }
            if (!params.GrupoActividadJerarquicoComo) {
                throw new ClientException(`Debe completar el campo Tipo.`)
            }
            if (!params.ApellidoNombrePersona) {
                throw new ClientException(`Debe completar el campo Apellido Nombre.`)
            }

        }

        if (!params.GrupoActividadJerarquicoDesde) {
            throw new ClientException(`Debe completar el campo Desde.`)
        }

        if (params.GrupoActividadJerarquicoHasta && params.GrupoActividadJerarquicoDesde > params.GrupoActividadJerarquicoHasta) {

            throw new ClientException(`La fecha Hasta ${this.dateOutputFormat(new Date(params.GrupoActividadJerarquicoHasta))} tiene que ser mayor a ${this.dateOutputFormat(new Date(params.GrupoActividadJerarquicoDesde))}.`);
        }

    }

    async validateFormObjetivos(params: any, queryRunner: any) {


        if (!params.GrupoActividadDetalle?.id) {
            throw new ClientException(`Debe completar el campo Grupo Actividad.`)
        }
        if (!params.GrupoObjetivoDetalle?.id) {
            throw new ClientException(`Debe completar el campo Objetivo.`)
        }

        if (params.GrupoActividadJerarquicoHasta && params.GrupoActividadJerarquicoDesde > params.GrupoActividadJerarquicoHasta) {

            let GrupoActividadJerarquicoDesde = new Date(`${params.GrupoActividadJerarquicoDesde}T00:00:00`)
            GrupoActividadJerarquicoDesde.setHours(0, 0, 0, 0)

            let GrupoActividadJerarquicoHasta = new Date(`${params.GrupoActividadJerarquicoHasta}T00:00:00`)
            GrupoActividadJerarquicoHasta.setHours(0, 0, 0, 0)

            if (GrupoActividadJerarquicoDesde > GrupoActividadJerarquicoHasta) {
                throw new ClientException(`La fecha Hasta ${this.dateOutputFormat(new Date(params.GrupoActividadJerarquicoHasta))} tiene que ser mayor a ${this.dateOutputFormat(new Date(params.GrupoActividadJerarquicoDesde))}.`);
            }


        }


    }


    async validateFormPersonal(params: any, queryRunner: any) {


        if (!params.GrupoActividadDetalle?.id) {
            throw new ClientException(`Debe completar el campo Grupo Actividad.`)
        }
        if (!params.ApellidoNombrePersona?.id) {
            throw new ClientException(`Debe completar el campo Apellido Nombre.`)
        }


        if (params.GrupoActividadPersonalHasta && params.GrupoActividadPersonalDesde > params.GrupoActividadPersonalHasta) {

            let GrupoActividadPersonalDesde = new Date(`${params.GrupoActividadPersonalDesde}T00:00:00`)
            GrupoActividadPersonalDesde.setHours(0, 0, 0, 0)

            let GrupoActividadPersonalHasta = new Date(`${params.GrupoActividadPersonalHasta}T00:00:00`)
            GrupoActividadPersonalHasta.setHours(0, 0, 0, 0)

            if (GrupoActividadPersonalDesde > GrupoActividadPersonalHasta) {
                throw new ClientException(`La fecha Hasta ${this.dateOutputFormat(new Date(params.GrupoActividadPersonalHasta))} tiene que ser mayor a ${this.dateOutputFormat(new Date(params.GrupoActividadPersonalDesde))}.`);
            }


        }

    }


    async gruposPersonas(req: any, res: Response, next: NextFunction) {

        const queryRunner = dataSource.createQueryRunner();
        const fechaCorte = new Date()
        fechaCorte.setDate(1)

        const fechaMonth = new Date()
        fechaMonth.setDate(fechaCorte.getDate() - 1);
        const anio = fechaMonth.getFullYear()
        const mes = fechaMonth.getMonth() + 1

        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            const personal = await queryRunner.query(`SELECT DISTINCT sit.PersonalId,sit.PersonalSituacionRevistaSituacionId, sit.PersonalSituacionRevistaDesde, sit.PersonalSituacionRevistaHasta, sitdes.SituacionRevistaDescripcion
                FROM PersonalSituacionRevista sit 
                JOIN 
                (SELECT sitj.PersonalId, MAX(sitj.PersonalSituacionRevistaDesde) PersonalSituacionRevistaDesde FROM PersonalSituacionRevista sitj 
                WhERE sitj.PersonalSituacionRevistaDesde < EOMONTH(DATEFROMPARTS(@1,@2,1))
                GROUP BY sitj.PersonalId
                    ) sitlast ON sitlast.PersonalId=sit.PersonalId AND sitlast.PersonalSituacionRevistaDesde = sit.PersonalSituacionRevistaDesde

                JOIN GrupoActividadPersonal gru ON gru.GrupoActividadPersonalPersonalId = sit.PersonalId AND gru.GrupoActividadPersonalDesde<= @0  AND ISNULL(gru.GrupoActividadPersonalHasta,'9999-12-31')>=@0
                JOIN SituacionRevista sitdes ON sitdes.SituacionRevistaId = sit.PersonalSituacionRevistaSituacionId
                WHERE sit.PersonalSituacionRevistaSituacionId NOT IN (2,10,11,14,21,12,26,20)
                `, [fechaCorte, anio, mes])

            if (personal.length > 0) {
                const personalIds = personal.map(p => p.PersonalId).join(',');
                await queryRunner.query(`UPDATE GrupoActividadPersonal SET  GrupoActividadPersonalHasta = @0 WHERE GrupoActividadPersonalPersonalId IN (${personalIds}) AND GrupoActividadPersonalDesde <= @0`, [fechaMonth])
            }

            await queryRunner.commitTransaction();
            if (res)
                this.jsonRes({ list: [] }, res, `Se actualizaron los grupos `);
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release();
        }
    }


    async objetivosGrupos(req: any, res: Response, next: NextFunction) {

        const queryRunner = dataSource.createQueryRunner();
        let fechaActual = new Date()

        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            const catactual = await queryRunner.query(
                `UPDATE gru
               SET 		  gru.GrupoActividadObjetivoHasta=eledepcon.ClienteElementoDependienteContratoFechaHasta
                           
                                  
                           
                       FROM GrupoActividadObjetivo gru
               
                     JOIN Objetivo obj  ON gru.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId
               
                       LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
                       LEFT JOIN ClienteElementoDependienteContrato eledepcon ON eledepcon.ClienteId = obj.ClienteId AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledepcon.ClienteElementoDependienteContratoId = eledep.ClienteElementoDependienteContratoUltNro
                       
                       LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId 
               
                           
                           
                       WHERE ISNULL(eledepcon.ClienteElementoDependienteContratoFechaHasta,'9999-12-31') < ISNULL(gru.GrupoActividadObjetivoHasta,'9999-12-31') AND 
                       ISNULL(eledepcon.ClienteElementoDependienteContratoFechaHasta,'9999-12-31') < @0`,
                [fechaActual]
            )


            await queryRunner.commitTransaction();
            if (res)
                this.jsonRes({ list: [] }, res, `Se actualizaron los grupos `);
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release();
        }
    }
}
