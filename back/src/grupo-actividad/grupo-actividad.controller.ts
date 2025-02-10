import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";


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
            fieldName: "grup.GrupoActividadNumero,",
            sortable: true,
        },
        {
            name: "NumeroOld",
            type: "number",
            id: "GrupoActividadNumeroOld",
            field: "GrupoActividadNumeroOld",
            fieldName: "grup.GrupoActividadNumero,",
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

    async getGridColsGrupos(req, res) {
        this.jsonRes(this.columnasGrillaGrupos, res);
    }

    async getGridColsResponsables(req, res) {
        this.jsonRes(this.columnasGrillaResponsables, res);
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

        console.log("req.body.options.filtros ", req.body.options.filtros)
        const filterSql = filtrosToSql(req.body.options.filtros, this.columnasGrillaResponsables);
        console.log("filterSql ", filterSql)
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


    async changecellgrupo(req: any, res: Response, next: NextFunction) {

        const ip = this.getRemoteAddress(req)
        const queryRunner = dataSource.createQueryRunner();

        const usuarioIdquery = await queryRunner.query(`SELECT * FROM Usuario WHERE UsuarioId = @0`, [res.locals.PersonalId])
        const usuarioId = usuarioIdquery > 0 ? usuarioIdquery : null

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
                let GrupoActividadUsuarioId = usuarioId
                let GrupoActividadObjetivoUltNro = 0

                let day = new Date()
                day.setHours(0, 0, 0, 0)
                let time = day.toTimeString().split(' ')[0]


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
                        GrupoActividadUsuarioId,
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

        const usuarioIdquery = await queryRunner.query(`SELECT * FROM Usuario WHERE UsuarioId = @0`, [res.locals.PersonalId])
        const usuarioId = usuarioIdquery > 0 ? usuarioIdquery : null

        const fechaActual = new Date()
        let message = ""
        const params = req.body

        try {
            console.log("params ", params)
            //throw new ClientException(`test`)
            await queryRunner.connect();
            await queryRunner.startTransaction();


            const codigoExist = await queryRunner.query(`SELECT * FROM GrupoActividadJerarquico WHERE GrupoActividadJerarquicoId = @0`, [params.GrupoActividadJerarquicoId])
            let dataResultado = {}

            if (codigoExist.length > 0) { //Entro en update
                //Validar si cambio el código

                await this.validateFormResponsables(params, queryRunner)

                if (params.GrupoActividadJerarquicoComo == 'J' && params.GrupoActividadDetalle.id != params.GrupoActividadDetalleOld.id) {

                    const result = await queryRunner.query(` SELECT * FROM GrupoActividadJerarquico  
                        WHERE GrupoActividadId = @0 AND GrupoActividadJerarquicoComo = @1`,[params.GrupoActividadDetalle.id,params.GrupoActividadJerarquicoComo]);
                    
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


                console.log('El código no existe - es nuevo')
                await this.validateFormResponsables(params, queryRunner)

                if (params.GrupoActividadJerarquicoComo == 'J') {
                    // - si jerarquico tiene hasta el ultimo registro se puede agregar uno nuevo siempre y cuando la fecha desde es posterior a la fehca del ultiumo jerarquico pendiente
                    const result = await queryRunner.query(
                        `SELECT TOP 1 * 
                        FROM GrupoActividadJerarquico  
                        WHERE GrupoActividadId = @0 
                        AND GrupoActividadJerarquicoComo = @1
                        ORDER BY GrupoActividadJerarquicoDesde DESC, GrupoActividadJerarquicoHasta DESC;
                        `,[params.GrupoActividadDetalle.id,params.GrupoActividadJerarquicoComo]);

                        console.log("result ", result)
                        console.log("result ", result[0].GrupoActividadJerarquicoDesde)
                        
                     

                    if ( result.length > 0 ) {
                     
                        if(!result[0].GrupoActividadJerarquicoHasta){
                           
                            if (params.GrupoActividadJerarquicoDesde <= result[0].GrupoActividadJerarquicoDesde) 
                                throw new ClientException(`La fecha desde debe ser mayor a ${this.dateFormatter.format(result[0].GrupoActividadJerarquicoDesde)}`)
                            
                            let GrupoActividadJerarquicoHasta = new Date(params.GrupoActividadJerarquicoDesde)
                            GrupoActividadJerarquicoHasta.setDate(GrupoActividadJerarquicoHasta.getDate() - 1)
                            console.log("GrupoActividadJerarquicoHasta " , GrupoActividadJerarquicoHasta)

                            await queryRunner.query(`UPDATE GrupoActividadJerarquico
                                SET GrupoActividadJerarquicoHasta = @2
                               WHERE GrupoActividadId = @0 AND GrupoActividadJerarquicoComo = @1`,
                                [params.GrupoActividadDetalle.id,params.GrupoActividadJerarquicoComo,GrupoActividadJerarquicoHasta])
                        }else{

                            if (params.GrupoActividadJerarquicoDesde <= result[0].GrupoActividadJerarquicoHasta) 
                                throw new ClientException(`La fecha desde debe ser mayor a ${this.dateFormatter.format(result[0].GrupoActividadJerarquicoHasta)}`)

                        }
                    }
                }

                let day = new Date()
                day.setHours(0, 0, 0, 0)
                let time = day.toTimeString().split(' ')[0]


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


                dataResultado = { action: 'I', GrupoActividadId: params.GrupoActividadDetalle.id, GrupoActividadJerarquicoId: GrupoActividadJerarquicoUltNro }
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
        console.log("cod_grupo_actividad ", cod_grupo_actividad)
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
            throw new ClientException(`La fecha Hasta ${this.dateFormatter.format(params.GrupoActividadJerarquicoHasta)} no puede ser menor que la fecha ${this.dateFormatter.format(params.GrupoActividadJerarquicoDesde)}.`);
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
                FROM PersonalSitu   acionRevista sit 
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
               SET 		  gru.GrupoActividadObjetivoHasta=ISNULL(clicon.ClienteContratoFechaHasta,eledepcon.ClienteElementoDependienteContratoFechaHasta)
                           
                                  
                           
                       FROM GrupoActividadObjetivo gru
               
                     JOIN Objetivo obj  ON gru.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId
               
                       LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
                       LEFT JOIN ClienteElementoDependienteContrato eledepcon ON eledepcon.ClienteId = obj.ClienteId AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledepcon.ClienteElementoDependienteContratoId = eledep.ClienteElementoDependienteContratoUltNro
                       
                       LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId 
                       LEFT JOIN ClienteContrato clicon ON clicon.ClienteId = obj.ClienteId AND clicon.ClienteContratoId = cli.ClienteContratoUltNro AND obj.ClienteElementoDependienteId IS NULL 
               
                           
                           
                       WHERE ISNULL(ISNULL(clicon.ClienteContratoFechaHasta,eledepcon.ClienteElementoDependienteContratoFechaHasta),'9999-12-31') < ISNULL(gru.GrupoActividadObjetivoHasta,'9999-12-31') AND 
                       ISNULL(ISNULL(clicon.ClienteContratoFechaHasta,eledepcon.ClienteElementoDependienteContratoFechaHasta),'9999-12-31') < @0`,
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
