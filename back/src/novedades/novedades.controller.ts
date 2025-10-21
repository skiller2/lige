import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { FileUploadController } from "../controller/file-upload.controller"
import { QueryRunner } from "typeorm";
import { ObjectId } from "typeorm/browser";
import { Console } from "node:console";
import { ObjetivoController } from "src/controller/objetivo.controller";
import { AccesoBotController } from "src/acceso-bot/acceso-bot.controller";

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
        name: "Código",
        type: "number",
        id: "NovedadCodigo",
        field: "NovedadCodigo",
        fieldName: "nov.NovedadCodigo",
        sortable: true,
        hidden: false,
        searchHidden: false,
        // maxWidth: 55

    },
    {
        name: "Sucursal",
        type: "string",
        id: "SucursalDescripcion",
        field: "SucursalDescripcion",
        fieldName: "suc.SucursalDescripcion",
        sortable: true,
        hidden: false,
        searchHidden: true,

    },
    {
        name: "Sucursal",
        type: "string",
        id: "SucursalId",
        field: "SucursalId",
        fieldName: "suc.SucursalId",
        searchComponent: "inpurForSucursalSearch",
        sortable: false,
        hidden: true,
        searchHidden: false
    },
    {
        name: "Cliente",
        type: "string",
        id: "ClienteDenominacion",
        field: "ClienteDenominacion",
        fieldName: "cli.ClienteDenominacion",
        sortable: true,
        hidden: false,
        searchHidden: true
    },
    {
        name: "Cliente",
        type: "string",
        id: "ClienteId",
        field: "ClienteId",
        fieldName: "cli.ClienteId",
        searchComponent: "inpurForClientSearch",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
    {
        name: "Código Objetivo",
        type: "string",
        id: "CodObj",
        field: "CodObj",
        fieldName: "CodObj",
        sortable: true,
        hidden: false,
        searchHidden: true,
        maxWidth: 65
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
        name: "Objetivo",
        type: "string",
        id: "DescripcionObj",
        field: "DescripcionObj",
        fieldName: "DescripcionObj",
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
        searchHidden: true
    },

    {
        name: "Grupo Actividad",
        type: "number",
        id: "GrupoActividadId",
        field: "GrupoActividadId",
        fieldName: "ga.GrupoActividadId",
        searchComponent: 'inpurForGrupoActividadSearch',
        sortable: false,
        hidden: true,
        searchHidden: false
    },
    {
        name: "GrupoActividadNumero",
        type: "string",
        id: "GrupoActividadNumero",
        field: "GrupoActividadNumero",
        fieldName: "ga.GrupoActividadNumero",
        sortable: false,
        hidden: true,
        searchHidden: true
    },
    {
        name: "Tipo novedad.",
        type: "string",
        id: "NovedadTipo",
        field: "NovedadTipo",
        fieldName: "NovedadTipo",
        sortable: true,
        hidden: false,
        searchHidden: true,
    },
    {
        name: "Tipo novedad",
        type: "string",
        id: "NovedadTipoCod",
        field: "NovedadTipoCod",
        fieldName: "novtip.NovedadTipoCod",
        sortable: true,
        hidden: true,
        searchHidden: false,
        searchComponent: "inputForTipoNovedadSearch"
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
        hidden: true,
    },
    {
        name: "Teléfono",
        type: "string",
        id: "Telefono",
        field: "Telefono",
        fieldName: "nov.Telefono",
        sortable: false,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Visto",
        type: "date",
        id: "VisualizacionFecha",
        field: "VisualizacionFecha",
        fieldName: "nov.VisualizacionFecha",
        sortable: true,
        hidden: false,
        searchHidden: true,

    },
    {
        name: "Descripción",
        type: "string",
        id: "Descripcion",
        field: "Descripcion",
        fieldName: "nov.Descripcion",
        sortable: false,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Accion",
        type: "string",
        id: "Accion",
        field: "Accion",
        fieldName: "nov.Accion",
        sortable: false,
        hidden: false,
        searchHidden: false
    },

];


export class NovedadesController extends BaseController {


    async getGridCols(req, res) {
        this.jsonRes(listaColumnas, res);
    }

    async list(req: any, res: Response, next: NextFunction) {
        const filterSql = filtrosToSql(req.body.options.filtros, listaColumnas);
        const orderBy = orderToSQL(req.body.options.sort)
        const queryRunner = dataSource.createQueryRunner();
        const periodo = req.body.periodo? new Date(req.body.periodo) : null
        const year = periodo? periodo.getFullYear() : 0
        const month = periodo? periodo.getMonth()+1 : 0
        let condition = `1=1`
        if (periodo) {
            condition = `DATEPART(YEAR,nov.Fecha)=@0 AND DATEPART(MONTH, nov.Fecha)=@1`
        }
        try {
            const objetivos = await queryRunner.query(
                `SELECT
                    nov.NovedadCodigo id
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
                    , ga.GrupoActividadId
                    , ga.GrupoActividadNumero
                    ,per.PersonalId
                    ,CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) as ApellidoNombrePersonal
                    ,nov.Telefono
                    ,novtip.Descripcion NovedadTipo
                    ,novtip.NovedadTipoCod
                    ,nov.Fecha
                    ,nov.VisualizacionFecha
                    ,nov.Accion
                    ,nov.Descripcion
                    ,nov.VisualizacionPersonaId
                    ,nov.VisualizacionTelefono 
                    ,1
                FROM Novedad nov
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

                WHERE (${condition}) AND ${filterSql} ${orderBy}`, [year, month])
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

    async getTipoNovedad(req: any, res: Response, next: NextFunction) {

        const queryRunner = dataSource.createQueryRunner();
        try {
            const provincias = await queryRunner.query(`SELECT NovedadTipoCod, Descripcion FROM NovedadTipo`)
            return this.jsonRes(provincias, res);
        } catch (error) {
            return next(error)
        } finally {

        }
    }



    async infNovedad(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.startTransaction()
            const NovedadId = req.params.NovedadId
            let infObjetivo = await this.getNovedadQuery(queryRunner, NovedadId)
            await queryRunner.commitTransaction()
            return this.jsonRes(infObjetivo, res)
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }



    async getNovedadQuery(queryRunner: any, NovedadId: any) {

        return await queryRunner.query(`
       SELECT
            nov.NovedadCodigo id,
            cli.ClienteId,
            cli.ClienteDenominacion,
            ele.ClienteElementoDependienteId,
            obj.ObjetivoId,
            nov.Fecha,
            nov.Accion,
            STRING_AGG(CAST(doc.DocumentoId AS VARCHAR), ',') AS DocumentoId,
            nov.NovedadTipoCod AS TipoNovedadId,
            nov.Descripcion,
            CONCAT(obj.ClienteId, '/', ISNULL(obj.ClienteElementoDependienteId,0)) AS CodObj,
            ele.ClienteElementoDependienteDescripcion DescripcionObj,
            nov.VisualizacionFecha,
            nov.VisualizacionPersonaId,
            visper.PersonalApellidoNombre AS VisualizacionPersonaNombre, 
            nov.VisualizacionTelefono,
            nov.PersonalId, nov.Telefono,
            1,
            nov.AudFechaIng, nov.AudFechaMod, nov.AudUsuarioIng, nov.AudUsuarioMod
        FROM Novedad nov
        LEFT JOIN DocumentoRelaciones doc ON doc.NovedadCodigo = nov.NovedadCodigo
        LEFT JOIN NovedadTipo novtip ON novtip.NovedadTipoCod = nov.NovedadTipoCod
        LEFT JOIN ClienteElementoDependiente ele ON ele.ClienteId = nov.ClienteId AND ele.ClienteElementoDependienteId = nov.ClienteElementoDependienteId
        LEFT JOIN Cliente cli  ON cli.ClienteId = ele.ClienteId
        LEFT JOIN Objetivo obj ON obj.ClienteId = nov.ClienteId   AND obj.ClienteElementoDependienteId = nov.ClienteElementoDependienteId
        LEFT JOIN GrupoActividadObjetivo gaobj ON gaobj.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId 
            AND gaobj.GrupoActividadObjetivoDesde <= nov.Fecha 
            AND ISNULL(gaobj.GrupoActividadObjetivoHasta,'9999-12-31') >= nov.Fecha
        LEFT JOIN GrupoActividad ga  ON ga.GrupoActividadId = gaobj.GrupoActividadId
        LEFT JOIN GrupoActividadJerarquico gajer ON gajer.GrupoActividadId = ga.GrupoActividadId  
            AND gajer.GrupoActividadJerarquicoDesde <= nov.Fecha 
            AND ISNULL(gajer.GrupoActividadJerarquicoHasta,'9999-12-31') >= nov.Fecha 
            AND gajer.GrupoActividadJerarquicoComo = 'J'
        LEFT JOIN Personal jerper ON jerper.PersonalId = gajer.GrupoActividadJerarquicoPersonalId
        LEFT JOIN Personal visper ON visper.PersonalId = nov.VisualizacionPersonaId
        WHERE nov.NovedadCodigo = @0
        GROUP BY nov.NovedadCodigo,cli.ClienteId,cli.ClienteDenominacion,
            ele.ClienteElementoDependienteId,obj.ObjetivoId, nov.Fecha, nov.Accion,nov.NovedadTipoCod,nov.Descripcion,
            CONCAT(obj.ClienteId, '/', ISNULL(obj.ClienteElementoDependienteId,0)), ele.ClienteElementoDependienteDescripcion,
            nov.VisualizacionFecha,nov.VisualizacionPersonaId, visper.PersonalApellidoNombre, nov.VisualizacionTelefono,
            nov.PersonalId, nov.Telefono,
            nov.AudFechaIng, nov.AudFechaMod, nov.AudUsuarioIng, nov.AudUsuarioMod
            `,
            [NovedadId])


    }

    async updateNovedad(req: any, res: Response, next: NextFunction) {

        const queryRunner = dataSource.createQueryRunner();
        try {

            const usuarioName = res.locals.userName
            const ip = this.getRemoteAddress(req)
            const NovedadId = Number(req.params.id)
            const Obj = { ...req.body }
            let ObjObjetivoNew = {}
            const AudFechaMod = new Date()

            // console.log("res.local.PersonalId", res.locals.PersonalId)
            // const usuarioIdquery = await queryRunner.query(`SELECT UsuarioPersonalId FROM usuario WHERE UsuarioNombre = @0`, [res.locals.userName])
            const usuarioId = res.locals.PersonalId

            //throw new ClientException(`test.`)

            await queryRunner.startTransaction()

            await this.FormValidations(Obj)


            const objetivo = await queryRunner.query(`SELECT ClienteId, ClienteElementoDependienteId FROM Objetivo WHERE Objetivoid = @0`, [Obj.ObjetivoId])
            Obj.ClienteId = objetivo[0].ClienteId
            Obj.ClienteElementoDependienteId = objetivo[0].ClienteElementoDependienteId

            await this.updateNovedadTable(queryRunner, Obj.Fecha, Obj.TipoNovedadId, Obj.Descripcion, Obj.Accion, NovedadId, AudFechaMod, usuarioName, ip, Obj.ClienteId, Obj.ClienteElementoDependienteId)

            let array_id = []
            let doc_id = 0
            if (Obj.files?.length > 0) {
                for (const file of Obj.files) {
                    await this.fileNovedadUpload(queryRunner, Obj, usuarioId, ip, NovedadId, usuarioName, file, array_id, doc_id)
                }
            }

            //validacion de barrio

            await queryRunner.commitTransaction()

            return this.jsonRes(ObjObjetivoNew, res, 'Modificación  Exitosa');
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async FormValidations(Obj: any) {


        if (!Obj.ObjetivoId) {
            throw new ClientException(`Debe completar el campo Objetivo.`)
        }

        if (!Obj.Fecha) {
            throw new ClientException(`Debe completar el campo fecha.`)
        }

        if (!Obj.TipoNovedadId) {
            throw new ClientException(`Debe completar el campo Tipo de novedad.`)
        }

        if (!Obj.Descripcion) {
            throw new ClientException(`Debe completar el campo Descripcion.`)
        }

        if (!Obj.Accion) {
            throw new ClientException(`Debe completar el campo Accion.`)
        }
    }

    async updateNovedadTable(queryRunner: any, Fecha: any, NovedadTipoCod: any, Descripcion: any, Accion: any, NovedadCodigo: any, AudFechaMod: any, AudUsuarioMod: any, AudIpMod: any, ClienteId: any, ClienteElementoDependienteId: any) {
        await queryRunner.query(`
            UPDATE Novedad SET Fecha = @0, NovedadTipoCod = @1, Descripcion = @2, Accion = @3, AudFechaMod = @5, AudUsuarioMod = @6, AudIpMod = @7, ClienteId = @8, ClienteElementoDependienteId = @9 where NovedadCodigo = @4`
            , [Fecha, NovedadTipoCod, Descripcion, Accion, NovedadCodigo, AudFechaMod, AudUsuarioMod, AudIpMod, ClienteId, ClienteElementoDependienteId])
    }


    async addNovedad(req: any, res: Response, next: NextFunction) {

        const usuarioName = res.locals.userName
        const queryRunner = dataSource.createQueryRunner();
        const Obj = { ...req.body }
        let NovedadIdNew = {}
        const ip = this.getRemoteAddress(req)

        try {

            // const usuarioIdquery = await queryRunner.query(`SELECT UsuarioPersonalId FROM usuario WHERE UsuarioNombre = @0`, [res.locals.userName])
            const PersonalId = res.locals.PersonalId ? res.locals.PersonalId : null
            await queryRunner.startTransaction()
            await this.FormValidations(Obj)


            const novedadId = await this.getProxNumero(queryRunner, `Novedad`, res.locals.PersonalId, ip)

            const objetivo = await queryRunner.query(`SELECT ClienteId, ClienteElementoDependienteId FROM Objetivo WHERE Objetivoid = @0`, [Obj.ObjetivoId])
            Obj.ClienteId = objetivo[0].ClienteId
            Obj.ClienteElementoDependienteId = objetivo[0].ClienteElementoDependienteId

            if (!Obj.PersonalId)
                Obj.PersonalId = PersonalId
        

            await this.addNovedadTable(queryRunner, Obj.Fecha, Obj.TipoNovedadId, Obj.Descripcion, Obj.Accion, Obj.ClienteId, Obj.ClienteElementoDependienteId,
                Obj.Telefono, ip, Obj.PersonalId, novedadId, usuarioName)


            let doc_id = 0
            let array_id = []
            if (Obj.files?.length > 0) {
                for (const file of Obj.files) {
                    await this.fileNovedadUpload(queryRunner, Obj, PersonalId, ip, novedadId, usuarioName, file, array_id, doc_id)
                }
            }

            NovedadIdNew = {
                novedadId: novedadId,
            }

            await this.sendMsgResponsable(Obj,queryRunner,usuarioName,ip)
            
            await queryRunner.commitTransaction()
            return this.jsonRes(NovedadIdNew, res, 'Carga de nuevo registro exitoso');
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async fileNovedadUpload(queryRunner: any, Obj: any, usuarioId: any, ip: any, novedadId: any, usuarioName: any, file: any, array_id: any, doc_id: any) {

        let result = await FileUploadController.handleDOCUpload(null, null, null, null, new Date(), null, file.doctipo_id, null, null, file, usuarioName, ip, queryRunner)


        if (result && typeof result === 'object') {
            ({ doc_id } = result)
            array_id.push(doc_id)
        }

        if (file.tempfilename && !file.id) {
            await queryRunner.query(`INSERT INTO DocumentoRelaciones (
             DocumentoId,
             PersonalId,
             ObjetivoId,
             ClienteId,
             PersonalLicenciaId,
             AudFechaIng,
             AudFechaMod,
             AudUsuarioIng,
             AudUsuarioMod,
             AudIpIng,
             AudIpMod,
             NovedadCodigo
         ) VALUES (
             @0, @1, @2, @3, @4, @5, @5, @6, @6, @7, @7, @8
         )`, [
                doc_id,
                null,
                null,
                null,
                null,
                new Date(),
                usuarioName,
                ip,
                novedadId
            ])
        } else {
            await queryRunner.query(`UPDATE DocumentoRelaciones SET AudFechaMod = @0, AudUsuarioMod = @1, AudIpMod = @2, NovedadCodigo = @4 WHERE DocumentoId = @3 `, [
                new Date(),
                usuarioName,
                ip,
                doc_id,
                novedadId
            ])
        }
    }

    async addNovedadTable(queryRunner: any, Fecha: any, NovedadTipoCod: any, Descripcion: any, Accion: any, ClienteId: any,
        ClienteElementoDependienteId: any, Telefono: any, ip: any, PersonalId:any, novedadId: any, usuarioName: any) {

        const now = new Date();
        const AudFechaIng = now;
        const AudFechaMod = now;
        const AudIpIng = ip;
        const AudIpMod = ip;
        const AudUsuarioIng = usuarioName;
        const AudUsuarioMod = usuarioName;

        const telefono = Telefono ? Telefono : null
        const fechaString = Fecha;
        const fechaObjeto = new Date(fechaString);
        const hora = fechaObjeto.getHours() + ':' + fechaObjeto.getMinutes();

        const NovedadTipoCodDescripcion = await queryRunner.query(`SELECT Descripcion FROM NovedadTipo WHERE NovedadTipoCod = @0`, [NovedadTipoCod])

        NovedadTipoCod
        const Json = JSON.stringify({
            Fecha: Fecha,
            CodObjetivo: ClienteId + '/' + (ClienteElementoDependienteId ?? 0),
            Tipo: {
                NovedadTipoCod: NovedadTipoCod,
                Descripcion: NovedadTipoCodDescripcion[0].Descripcion
            },
            Descripcion: Descripcion,
            Hora: hora,
        });
        const VisualizacionFecha = null;
        const VisualizacionPersonaId = null;

        await queryRunner.query(
            `
            INSERT INTO Novedad (
                NovedadCodigo,
                ClienteId,
                ClienteElementoDependienteId,
                PersonalId,
                Telefono,
                Fecha,
                Descripcion,
                NovedadTipoCod,
                Json,
                AudFechaIng,
                AudFechaMod,
                AudIpIng,
                AudIpMod,
                AudUsuarioIng,
                AudUsuarioMod,
                Accion,
                VisualizacionFecha,
                VisualizacionPersonaId
            )
            VALUES (
                @0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15, @16, @17
            )
            `,
            [
                novedadId,
                ClienteId,
                ClienteElementoDependienteId,
                PersonalId,
                Telefono,
                Fecha,
                Descripcion,
                NovedadTipoCod,
                Json,
                AudFechaIng,
                AudFechaMod,
                AudIpIng,
                AudIpMod,
                AudUsuarioIng,
                AudUsuarioMod,
                Accion,
                VisualizacionFecha,
                VisualizacionPersonaId
            ]
        );
    }


    async deleteNovedad(req: any, res: Response, next: NextFunction) {

        const queryRunner = dataSource.createQueryRunner()
        // console.log("req.params", req.params)
        //throw new ClientException(`test`)
        try {
            const NovedadId = req.params.id
            await queryRunner.startTransaction()

            if (!res.locals?.authADGroup) {
                // consultar si el objetivo que esta asociado a la novedad, el usuario es jerarquico del mismo
                const grupoActividad = res.locals.GrupoActividad ? res.locals.GrupoActividad.map((grupo: any) => grupo.GrupoActividadId).join(',') : '';

                const validacion = await queryRunner.query(
                    `Select nov.NovedadCodigo 
                    From Novedad nov    
                    LEFT JOIN ClienteElementoDependiente ele ON ele.ClienteId=nov.ClienteId and ele.ClienteElementoDependienteId=nov.ClienteElementoDependienteId
                    LEFT JOIN Objetivo obj on obj.ClienteId=nov.ClienteId and obj.ClienteElementoDependienteId=nov.ClienteElementoDependienteId
                    LEFT JOIN GrupoActividadObjetivo gaobj on gaobj.GrupoActividadObjetivoObjetivoId=obj.ObjetivoId and gaobj.GrupoActividadObjetivoDesde<=nov.Fecha and ISNULL(gaobj.GrupoActividadObjetivoHasta,'9999-12-31')>=nov.Fecha
                    LEFT JOIN GrupoActividad ga on ga.GrupoActividadId=gaobj.GrupoActividadId
                WHERE nov.NovedadCodigo = @0 AND ga.GrupoActividadId IN (${grupoActividad})`, [NovedadId])
                if (validacion.length === 0) {
                    throw new ClientException(`No tiene permisos para eliminar esta novedad.`)
                }
            }

            const DocumentoId = await queryRunner.query(`SELECT DocumentoId FROM DocumentoRelaciones WHERE NovedadCodigo = @0`, [NovedadId])
            if (DocumentoId.length > 0) {
                for (const doc of DocumentoId) {
                    await FileUploadController.deleteFile(doc.DocumentoId, 'Documento', queryRunner)
                }
            }
            await queryRunner.query(`DELETE FROM DocumentoRelaciones WHERE NovedadCodigo = @0`, [NovedadId])
            await queryRunner.query(`DELETE FROM Novedad WHERE NovedadCodigo = @0`, [NovedadId])
            await queryRunner.commitTransaction()
            return this.jsonRes({}, res, 'Eliminación exitosa')
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }

    }

    async getGridFilters(req: any, res: Response, next: NextFunction) {
        let startFilters: { field: string; condition: string; operator: string; value: any; forced: boolean }[] = []
        const grupoActividad = res.locals.GrupoActividad ? res.locals.GrupoActividad.map((grupo: any) => grupo.GrupoActividadNumero).join(';') : '';
        console.log("grupoActividad", grupoActividad)
        if (!grupoActividad) return this.jsonRes([], res)
        startFilters.push({
            field: 'GrupoActividadNumero',
            condition: 'AND',
            operator: '=',
            value: grupoActividad,
            forced: res.locals?.authADGroup ? false : true
        })
        return this.jsonRes(startFilters, res)
    }

  async sendMsgResponsable(novedad: any, queryRunner: QueryRunner, usuario:string, ip:string) {
    const Fecha = new Date(novedad.Fecha)
    const ClienteId = novedad.ClienteId
    const ClienteElementoDependienteId = novedad.ClienteElementoDependienteId
    const ObjetivoId = novedad.ObjetivoId
    const anio = Fecha.getFullYear()
    const mes = Fecha.getMonth() + 1
    const responsables = await ObjetivoController.getObjetivoResponsables(ObjetivoId, anio, mes, queryRunner)
    const supervisor = responsables.find(r => r.ord == 3)
    
    const msg = `Se a registrado una novedad en el objetivo ${(novedad.ClienteId && novedad.ClienteElementoDependienteId) ? (novedad.ClienteId + '/' + novedad.ClienteElementoDependienteId) : 's/d'} ${novedad?.DesObjetivo ?? ''}` 

    if (supervisor.GrupoActividadId) {
      const PersonalId = supervisor.GrupoActividadId
      const result = await queryRunner.query(`SELECT tel.Telefono FROM BotRegTelefonoPersonal tel WHERE tel.PersonalId = @0 `, [PersonalId])
      const telefono = (result[0]) ? result[0].Telefono : ''


      if (telefono) {
        //TODO: Debería encolarse
        //ChatBotController.enqueBotMsg(PersonalId, msg, 'HIGH', 'bot', '127.0.0.1')

          const sendit = await AccesoBotController.enqueBotMsg(PersonalId, msg, `NOVEDAD`, usuario, ip)
          //if (sendit) errormsg.push('Se envió notificación a la persona recordando que descargue el recibo')
          
          
          
        //await botServer.sendMsg(telefono, msg)
        
        //await botServer.runFlow(telefono, 'CONSULTA_NOVEDADES')


      }
    }
  }

}
