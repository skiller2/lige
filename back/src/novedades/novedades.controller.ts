import { BaseController, ClientException } from "../controller/basecontroller.ts";
import { dataSource } from "../data-source.ts";
import type { NextFunction, Request, Response } from "express";
import { filtrosToSql, orderToSQL } from "../impuestos-afip/filtros-utils/filtros.ts";
import { FileUploadController } from "../controller/file-upload.controller.ts"
import type { QueryRunner } from "typeorm";
import { ObjetivoController } from "../controller/objetivo.controller.ts";
import { ObjetivosController } from "../objetivos/objetivos.controller.ts";

import { AccesoBotController } from "../acceso-bot/acceso-bot.controller.ts";
import { PersonalController } from "../controller/personal.controller.ts"
import * as fs from 'fs';
import { mkdirSync, existsSync, writeFileSync } from "fs";
import path from 'path';
import { promises as fsPromises } from 'fs';
import puppeteer, { Browser, Page } from 'puppeteer';
import { PDFDocument } from 'pdf-lib';

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
        maxWidth: 100

    },
    {
        name: "Sucursal Objetivo",
        type: "string",
        id: "SucursalDescripcion",
        field: "SucursalDescripcion",
        fieldName: "suc.SucursalDescripcion",
        sortable: true,
        hidden: false,
        searchHidden: true,

    },
    {
        name: "Sucursal Objetivo",
        type: "string",
        id: "SucursalId",
        field: "SucursalId",
        fieldName: "suc.SucursalId",
        searchComponent: "inputForSucursalSearch",
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
        searchComponent: "inputForClientSearch",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
    {
        name: "Cod. Objetivo",
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
        searchComponent: "inputForObjetivoSearch",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
    {
        name: "Obj. Descripción",
        type: "string",
        id: "DescripcionObj",
        field: "DescripcionObj",
        fieldName: "DescripcionObj",
        sortable: true,
        hidden: false,
        searchHidden: true
    },
    {
        name: "Coo. Zona",
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
        searchComponent: 'inputForGrupoActividadSearch',
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
        name: "Tipo Novedad",
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
        name: "Descripción",
        type: "string",
        id: "Descripcion",
        field: "Descripcion",
        fieldName: "nov.Descripcion",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Acción",
        type: "string",
        id: "Accion",
        field: "Accion",
        fieldName: "nov.Accion",
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
        searchComponent: "inputForFechaSearch",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Registrado Por",
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
        searchComponent: "inputForPersonalSearch",
        searchType: "number",
        sortable: true,
        searchHidden: false,
        hidden: true,
    },
    {
        name: "Registrado Desde",
        type: "string",
        id: "Telefono",
        field: "Telefono",
        fieldName: "nov.Telefono",
        sortable: true,
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
        name: "Usuario Ing.",
        type: "string",
        id: "AudUsuarioIng",
        field: "AudUsuarioIng",
        fieldName: "nov.AudUsuarioIng",
        sortable: false,
        hidden: true,
        searchHidden: false
    },

];


export class NovedadesController extends BaseController {

    directoryNovedad = (process.env.PATH_DOCUMENTS) ? process.env.PATH_DOCUMENTS : '.' + '/novedades'
    PathNovedadTemplate = {
        header: `${this.directoryNovedad}/config/novedad/novedad-header.html`,
        body: `${this.directoryNovedad}/config/novedad/novedad-body.html`,
        footer: `${this.directoryNovedad}/config/novedad/novedad-footer.html`,
        headerDef: './assets/novedad/novedad-header.def.html',
        bodyDef: './assets/novedad/novedad-body.def.html',
        footerDef: './assets/novedad/novedad-footer.def.html'
    }


    constructor() {
        super();
        if (!existsSync(this.directoryNovedad)) {
            mkdirSync(this.directoryNovedad, { recursive: true });
        }
    }

    async getGridCols(req, res) {
        this.jsonRes(listaColumnas, res);
    }

    async listQuery(queryRunner: any, condition: any, filterSql: any, orderBy: any, year: number, month: number) {
        return await queryRunner.query(
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
                ,nov.AudUsuarioIng
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
    }

    async list(req: any, res: Response, next: NextFunction) {
        const filterSql = filtrosToSql(req.body.options.filtros, listaColumnas);
        const orderBy = orderToSQL(req.body.options.sort)
        const queryRunner = dataSource.createQueryRunner();
        const periodo = req.body.periodo ? new Date(req.body.periodo) : null
        const year = periodo ? periodo.getFullYear() : 0
        const month = periodo ? periodo.getMonth() + 1 : 0
        let condition = `1=1`
        if (periodo) {
            condition = `DATEPART(YEAR,nov.Fecha)=@0 AND DATEPART(MONTH, nov.Fecha)=@1`
        }
        try {
            const novedades = await this.listQuery(queryRunner, condition, filterSql, orderBy, year, month);
            this.jsonRes(
                {
                    total: novedades.length,
                    list: novedades,
                },
                res
            );

        } catch (error) {
            return next(error)
        } finally {
            await queryRunner.release()
        }

    }

    async getTipoNovedad(req: any, res: Response, next: NextFunction) {

        const queryRunner = dataSource.createQueryRunner();
        try {
            const provincias = await queryRunner.query(`SELECT NovedadTipoCod value, Descripcion label FROM NovedadTipo`)
            return this.jsonRes(provincias, res);
        } catch (error) {
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }



    async infNovedad(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        const usuarioName = res.locals.userName
        const NovedadId = req.params.NovedadId

        try {
            await queryRunner.startTransaction()
            if (!res.locals.verifyGrupoActividad && !res.locals.authADGroup) {
                const novedad = await queryRunner.query(`SELECT AudUsuarioIng FROM Novedad WHERE NovedadCodigo = @0`, [NovedadId])
                if (novedad.length === 0 || novedad[0].AudUsuarioIng !== usuarioName) {
                    throw new ClientException(`No tiene permisos para ver la novedad.`)
                }
            }
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


            const novedadId = await BaseController.getProxNumero(queryRunner, `Novedad`, res.locals.PersonalId, ip)

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

            Obj.novedadId = novedadId
            //TODO: Agregar detalle del objetivo en Obj.DesObjetivo
            await this.sendMsgResponsable(Obj, queryRunner, usuarioName, ip)

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
        ClienteElementoDependienteId: any, Telefono: any, ip: any, PersonalId: any, novedadId: any, usuarioName: any) {

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
        if (grupoActividad) {
            startFilters.push({
                field: 'GrupoActividadNumero',
                condition: 'AND',
                operator: '=',
                value: grupoActividad,
                forced: res.locals?.authADGroup ? false : true
            })
            return this.jsonRes(startFilters, res)
        }

        startFilters.push({
            field: 'AudUsuarioIng',
            condition: 'AND',
            operator: '=',
            value: res.locals.userName,
            forced: res.locals?.authADGroup ? false : true
        })
        return this.jsonRes(startFilters, res)


        // return this.jsonRes([], res)
    }

    async sendMsgResponsable(novedad: any, queryRunner: QueryRunner, usuario: string, ip: string) {
        const Fecha = new Date(novedad.Fecha)
        const ClienteId = novedad.ClienteId
        const ClienteElementoDependienteId = novedad.ClienteElementoDependienteId
        const ObjetivoId = novedad.ObjetivoId
        const anio = Fecha.getFullYear()
        const mes = Fecha.getMonth() + 1
        const responsables = await ObjetivoController.getObjetivoResponsables(ObjetivoId, anio, mes, queryRunner)
        const supervisor = responsables.find(r => r.ord == 2)

        const msg = `Se a registrado una novedad en el objetivo ${(novedad.ClienteId && novedad.ClienteElementoDependienteId) ? (novedad.ClienteId + '/' + novedad.ClienteElementoDependienteId) : 's/d'} ${novedad?.DesObjetivo ?? ''}`

        if (supervisor.GrupoActividadId) {
            const PersonalId = supervisor.GrupoActividadId
            const result = await queryRunner.query(`SELECT tel.Telefono FROM BotRegTelefonoPersonal tel WHERE tel.PersonalId = @0 `, [PersonalId])
            const telefono = (result[0]) ? result[0].Telefono : ''


            if (telefono) {
                const sendit = await AccesoBotController.enqueBotMsg(PersonalId, msg, `NOVEDAD${novedad.novedadId}`, usuario, ip)
            }
        }
    }

    async setNovedadConfig(req: Request, res: Response, next: NextFunction) {
        const header = req.body.header
        const body = req.body.body
        const footer = req.body.footer

        try {

            if (body == "")
                throw new ClientException(`El cuerpo no puede estar vacio`)

            if (header == "")
                throw new ClientException(`La cabecera no puede estar vacia`)

            try {
                fs.renameSync(this.PathNovedadTemplate.header, this.PathNovedadTemplate.header + '.old')
                fs.renameSync(this.PathNovedadTemplate.body, this.PathNovedadTemplate.body + '.old')
                fs.renameSync(this.PathNovedadTemplate.footer, this.PathNovedadTemplate.footer + '.old')
            } catch (_e) { }

            fs.mkdirSync(path.dirname(this.PathNovedadTemplate.header), { recursive: true })
            fs.writeFileSync(this.PathNovedadTemplate.header, header)
            fs.writeFileSync(this.PathNovedadTemplate.body, body)
            fs.writeFileSync(this.PathNovedadTemplate.footer, footer)

            this.jsonRes([], res, `Se guardo el nuevo formato de novedad`);

        } catch (error) {
            console.log('capturo', error)
            return next(error)
        }
    }

    async getNovedadConfig(req: Request, res: Response, next: NextFunction) {
        const prev: boolean = (req.params.prev === 'true')
        try {
            const htmlContent = await this.getNovedadHtmlContentGeneral(new Date(), '', '', '', true, prev);
            this.jsonRes({ header: htmlContent.header, body: htmlContent.body, footer: htmlContent.footer }, res);

        } catch (error) {
            return next(error)
        }
    }

    async getNovedadHtmlContentGeneral(fechaNovedad: Date, header: string = "", body: string = "", footer: string = "", raw: boolean = false, prev: boolean = false) {

        const imgPath = `./assets/logo-lince-full.svg`
        const imgBuffer = await fsPromises.readFile(imgPath);
        const imgBase64 = imgBuffer.toString('base64');

        // const imgBufferFirma = await fsPromises.readFile(`./assets/firma_tesorero.svg`);
        // const imgBase64Firma = imgBufferFirma.toString('base64');

        const imgPathinaes = `./assets/icons/inaes.png`
        const imgBufferinaes = await fsPromises.readFile(imgPathinaes);
        const imgBase64inaes = imgBufferinaes.toString('base64');

        header = (header) ? header : (fs.existsSync(this.PathNovedadTemplate.header) ? fs.readFileSync(this.PathNovedadTemplate.header + ((prev) ? '.old' : ''), 'utf-8') : fs.readFileSync(this.PathNovedadTemplate.headerDef, 'utf-8'))
        body = (body) ? body : (fs.existsSync(this.PathNovedadTemplate.body) ? fs.readFileSync(this.PathNovedadTemplate.body + ((prev) ? '.old' : ''), 'utf-8') : fs.readFileSync(this.PathNovedadTemplate.bodyDef, 'utf-8'))
        footer = (footer) ? footer : (fs.existsSync(this.PathNovedadTemplate.footer) ? fs.readFileSync(this.PathNovedadTemplate.footer + ((prev) ? '.old' : ''), 'utf-8') : fs.readFileSync(this.PathNovedadTemplate.footerDef, 'utf-8'))

        if (!raw) {
            header = header.replace(/\${imgBase64}/g, imgBase64);
            footer = footer.replace(/\${imgBase64inaes}/g, imgBase64inaes);
            //   body = body.replace(/\${imgBase64Firma}/g, imgBase64Firma);

            header = header.replace(/\${fechaFormateada}/g, this.dateOutputFormat(fechaNovedad));
        }
        return { header, body, footer }
    }

    async downloadNovedadPrueba(req: Request, res: Response, next: NextFunction) {
        const header = req.body.header
        const body = req.body.body
        const footer = req.body.footer
        const NovedadCodigo = Number(req.body.NovedadCodigo)
        const queryRunner = dataSource.createQueryRunner()
        const fechaActual = new Date();

        let filePath = ""

        try {
            if (!NovedadCodigo)
                throw new ClientException(`Debe selccionar una Novedad`)

            const waterMark = `<div style="position: fixed; bottom: 500px; left: 50px; z-index: 10000; font-size:200px; color: red; transform:rotate(-60deg);
                            opacity: 0.6;">PRUEBA</div>`

            const condition = `(nov.NovedadCodigo IN (${NovedadCodigo}))`
            let NovedadInfo = await this.listQuery(queryRunner, condition, '(1=1)', '', 0, 0)
            if (NovedadInfo.length == 0)
                throw new ClientException(`Novedad no encontrada`)
            NovedadInfo = NovedadInfo[0]

            let infoPersonal = await PersonalController.infoPersonalQuery(NovedadInfo.PersonalId, fechaActual.getFullYear(), fechaActual.getMonth() + 1)
            infoPersonal = infoPersonal[0]

            const personaNombre = infoPersonal.PersonalApellido + ' ' + infoPersonal.PersonalNombre;
            const cuit = infoPersonal.PersonalCUITCUILCUIT;

            const asociado = infoPersonal.PersonalNroLegajo;
            const grupo = infoPersonal.GrupoActividadDetalle;

            const htmlContent = await this.getNovedadHtmlContentGeneral(fechaActual, header, body, footer)

            const objetivoDomicilio = await new ObjetivosController().getDomicilio(queryRunner, NovedadInfo.ObjetivoId, NovedadInfo.ClienteId, NovedadInfo.ClienteElementoDependienteId);
            const browser = await puppeteer.launch({ headless: 'new' })
            const page = await browser.newPage();

            filePath = (process.env.PATH_NOVEDAD_HTML_TEST) ? process.env.PATH_NOVEDAD_HTML_TEST : 'tmp' + '/' + NovedadCodigo + ".pdf"

            // let docRelaciones = await queryRunner.query(`
            //         SELECT dr.DocumentoId, dr.NovedadCodigo, doc.DocumentoNombreArchivo, doc.DocumentoPath
            //         FROM DocumentoRelaciones dr
            //         LEFT JOIN Documento doc ON doc.DocumentoId = dr.DocumentoId
            //         WHERE NovedadCodigo IN (@0)
            //     `,[NovedadCodigo])

            //     docRelaciones = docRelaciones.filter(doc => {
            //         const nombre = doc.DocumentoNombreArchivo.toLowerCase();
            //         return nombre.endsWith('.png') ||
            //                 nombre.endsWith('.jpg') ||
            //                 nombre.endsWith('.jpeg')
            //     });
            // const imgsPath = docRelaciones.map(doc => `${process.env.PATH_DOCUMENTS}/${doc.DocumentoPath}`);

            await this.createPdf(filePath, personaNombre, cuit, objetivoDomicilio[0]?.domCompleto, asociado, grupo,
                NovedadInfo, page, htmlContent.body + waterMark, htmlContent.header, htmlContent.footer)

            await page.close();
            await browser.close();

            let nameFile = `NovedadTest-${NovedadCodigo}.pdf`
            await this.dowloadPdfBrowser(res, next, filePath, nameFile)

        } catch (error) {
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async createPdf(
        filesPath: string,
        personaNombre: string,
        cuit: string,
        domicilioObj: string,
        asociado: string,
        grupo: string,
        novedadInfo: any,
        page: Page,
        htmlContent: string,
        headerContent: string,
        footerContent: string,
        imgsPaths: string[] = []
    ) {
        domicilioObj = (domicilioObj && domicilioObj != '()') ? domicilioObj : 'Sin especificar'
        asociado = (asociado) ? asociado.toString() : 'Pendiente'
        grupo = (grupo) ? grupo : 'Sin asignar'
        cuit = (cuit) ? cuit.toString() : 'Sin especificar'


        headerContent = headerContent.replace(/\${novedaCodigo}/g, novedadInfo.NovedadCodigo);
        htmlContent = htmlContent.replace(/\${personaNombre}/g, personaNombre);
        htmlContent = htmlContent.replace(/\${cuit}/g, cuit);

        htmlContent = htmlContent.replace(/\${domicilioObjetivo}/g, domicilioObj);
        htmlContent = htmlContent.replace(/\${asociado}/g, asociado);
        htmlContent = htmlContent.replace(/\${grupo}/g, grupo);

        // Reemplazo de campos en el cuerpo del HTML - Datos de la novedad
        htmlContent = htmlContent.replace(/\${fechaActual}/g, this.formatDate(new Date()));
        htmlContent = htmlContent.replace(/\${novedaCodigo}/g, novedadInfo.NovedadCodigo);
        htmlContent = htmlContent.replace(/\${fechaNovedad}/g, this.formatDate(new Date(novedadInfo.Fecha)));
        htmlContent = htmlContent.replace(/\${tipoNovedad}/g, novedadInfo.NovedadTipo);
        htmlContent = htmlContent.replace(/\${descripcionNovedad}/g, novedadInfo.Descripcion);
        htmlContent = htmlContent.replace(/\${accionTomada}/g, novedadInfo.Accion);
        htmlContent = htmlContent.replace(/\${registradoPorNombre}/g, personaNombre);
        htmlContent = htmlContent.replace(/\${registradoPorNroAsociado}/g, asociado);

        let htmlObjetivo = `${novedadInfo.CodObj} - ${novedadInfo.ClienteDenominacion} ${novedadInfo.DescripcionObj}`
        let htmlCoor = `${novedadInfo.ApellidoNombreJerarquico}`

        htmlContent = htmlContent.replace(/\${sucursalObjetivo}/g, novedadInfo.SucursalDescripcion);

        htmlContent = htmlContent.replace(/\${textobjetivo}/g, htmlObjetivo);
        htmlContent = htmlContent.replace(/\${textcoor}/g, htmlCoor);

        // Agrego imagenes al HTML - Documentos Realcionados
        let htmlImgs = imgsPaths.length ? `<tr>` : ``
        const imgsPorFila = 3;
        for (let index = 0; index < imgsPaths.length; index++) {
            const path = imgsPaths[index];
            if (!fs.existsSync(path)) { continue };

            const imgBuffer = await fsPromises.readFile(path);
            const imgBase64 = imgBuffer.toString("base64");

            // Detectar extensión real
            const ext = path.split(".").pop()?.toLowerCase() || "jpg";

            if (index > 0 && index % imgsPorFila === 0) {
                htmlImgs += "</tr><tr>";
            }

            htmlImgs += `
                <td style="width:${100 / imgsPorFila}%; text-align:center;">
                    <img 
                        src="data:image/${ext};base64,${imgBase64}" 
                        style="width:150px; display:block; margin:5px auto;"
                        alt="imagen"
                    />
                </td>`;
        }
        if (htmlImgs) htmlImgs += `</tr>`

        htmlContent = htmlContent.replace(/\${imgsBase64}/g, htmlImgs);

        await page.setContent(htmlContent);

        //fs.writeFileSync("./full.html",htmlContent)
        await page.pdf({
            path: filesPath,
            margin: { top: '80px', right: '0px', bottom: '50px', left: '0px' },
            printBackground: true,
            format: 'A4',
            displayHeaderFooter: true,
            headerTemplate: headerContent,
            footerTemplate: footerContent,
        });

    }

    async dowloadPdfBrowser(res: Response, next: NextFunction, filesPath: any, nameFile: any) {
        res.download(filesPath, nameFile, async (err) => {
            if (err) {
                console.error(`Error al descargar el PDF: ${filesPath}`, err);
                return next(err);
            } else {
                //console.log('PDF descargado con éxito');
                fs.unlinkSync(filesPath);
                // console.log('PDF eliminado del servidor');
            }
        });
    }

    formatDate(date: Date): string {
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();

        const HH = String(date.getHours()).padStart(2, '0');
        const MM = String(date.getMinutes()).padStart(2, '0');

        return `${dd}/${mm}/${yyyy} ${HH}:${MM}`;
    }

    async generaInformesNovedades(req: any, res: Response, next: NextFunction) {
        const filterSql = filtrosToSql(req.body.options.filtros, listaColumnas);
        const orderBy = ` ORDER BY nov.Fecha ASC `;
        const queryRunner = dataSource.createQueryRunner();
        const periodo = req.body.periodo ? new Date(req.body.periodo) : null
        const year = periodo ? periodo.getFullYear() : 0
        const month = periodo ? periodo.getMonth() + 1 : 0
        const fechaActual = new Date();
        let usuario = res.locals.userName
        const ip = this.getRemoteAddress(req)
        let condition = (periodo) ? `DATEPART(YEAR,nov.Fecha)=@0 AND DATEPART(MONTH, nov.Fecha)=@1` : `1=1`
        let ProcesoAutomaticoLogCodigo = 0


        try {
            ({ ProcesoAutomaticoLogCodigo } = await this.procesoAutomaticoLogInicio(
                queryRunner,
                `Proceso Exportación de informe de novedades.`,
                { condition, filterSql, year, month, usuario, ip },
                usuario,
                ip
            ))


            const list = await this.listQuery(queryRunner, condition, filterSql, orderBy, year, month);

            const htmlContent = await this.getNovedadHtmlContentGeneral(fechaActual, '', '', '')
            const browser = await puppeteer.launch({ headless: 'new' })
            const page = await browser.newPage();
            const filesPath = `tmp/informe-novedad/${usuario}-${fechaActual.getTime()}`
            if (!existsSync(filesPath)) {
                mkdirSync(filesPath, { recursive: true });
            }

            const fechasResult = await queryRunner.query(`
                SELECT 
                    MIN(nov.Fecha) as PrimerDia,
                    MAX(nov.Fecha) as UltimoDia
                FROM Novedad nov
                LEFT JOIN ClienteElementoDependiente ele ON ele.ClienteId=nov.ClienteId and ele.ClienteElementoDependienteId=nov.ClienteElementoDependienteId
                LEFT JOIN Cliente cli on cli.ClienteId=ele.ClienteId
                LEFT JOIN Objetivo obj on obj.ClienteId=nov.ClienteId and obj.ClienteElementoDependienteId=nov.ClienteElementoDependienteId
                LEFT JOIN Personal per on per.PersonalId=nov.PersonalId
                LEFT JOIN GrupoActividadObjetivo gaobj on gaobj.GrupoActividadObjetivoObjetivoId=obj.ObjetivoId and gaobj.GrupoActividadObjetivoDesde<=nov.Fecha and ISNULL(gaobj.GrupoActividadObjetivoHasta,'9999-12-31')>=nov.Fecha
                LEFT JOIN GrupoActividad ga on ga.GrupoActividadId=gaobj.GrupoActividadId
                LEFT JOIN NovedadTipo novtip on novtip.NovedadTipoCod=nov.NovedadTipoCod
                LEFT JOIN Sucursal suc on suc.SucursalId=ele.ClienteElementoDependienteSucursalId
                WHERE (${condition}) AND ${filterSql}
            `, [year, month]);

            const primerDia = fechasResult[0]?.PrimerDia ? new Date(fechasResult[0].PrimerDia) : null;
            const ultimoDia = fechasResult[0]?.UltimoDia ? new Date(fechasResult[0].UltimoDia) : null;

            htmlContent.header = htmlContent.header.replace(/\${periodoInicio}/g, primerDia ? this.dateOutputFormat(primerDia) : 'N/A');
            htmlContent.header = htmlContent.header.replace(/\${periodoFin}/g, ultimoDia ? this.dateOutputFormat(ultimoDia) : 'N/A');

            const totalNovedades: number = list.length;
            let novedades: number = 0
            let informeNovedadPaths: string[] = []
            for (const novedad of list) {
                novedades++

                htmlContent.footer = htmlContent.footer.replace(/\$\{pageNumber\}/g, novedades.toString());
                htmlContent.footer = htmlContent.footer.replace(/\$\{totalPages\}/g, totalNovedades.toString());

                let filePath = `${filesPath}/${novedad.NovedadCodigo}.pdf`
                let body = htmlContent.body;
                let header = htmlContent.header;
                let footer = htmlContent.footer

                let infoPersonal = await PersonalController.infoPersonalQuery(
                    novedad.PersonalId,
                    fechaActual.getFullYear(),
                    fechaActual.getMonth() + 1
                );
                infoPersonal = infoPersonal[0];

                const objetivoDomicilio = await new ObjetivosController().getDomicilio(queryRunner, novedad.ObjetivoId, novedad.ClienteId, novedad.ClienteElementoDependienteId);


                const personaNombre = novedad.ApellidoNombrePersonal;
                const cuit = infoPersonal.PersonalCUITCUILCUIT;
                const asociado = infoPersonal.PersonalNroLegajo;
                const grupo = infoPersonal.GrupoActividadDetalle;

                //Documentos Relacionados de la Novedad
                const docRelaciones = await queryRunner.query(`
                    SELECT dr.DocumentoId, dr.NovedadCodigo, doc.DocumentoNombreArchivo, doc.DocumentoPath
                    FROM DocumentoRelaciones dr
                    LEFT JOIN Documento doc ON doc.DocumentoId = dr.DocumentoId
                    WHERE dr.NovedadCodigo IN (@0)
                `, [novedad.NovedadCodigo])

                //Filtra Documentos Relacionados por imagen
                const imgsDoc = docRelaciones.filter(doc => {
                    const nombre = doc.DocumentoNombreArchivo.toLowerCase();
                    return nombre.endsWith('.png') ||
                        nombre.endsWith('.jpg') ||
                        nombre.endsWith('.jpeg')
                });
                const imgsPath = imgsDoc.map(doc => `${process.env.PATH_DOCUMENTS}/${doc.DocumentoPath}`);

                await this.createPdf(filePath, personaNombre, cuit, objetivoDomicilio[0]?.domCompleto, asociado, grupo,
                    novedad, page, body, header, footer, imgsPath)

                //Filtra Documentos Relacionados por pdf
                const pdfsDoc = docRelaciones.filter(doc => {
                    const nombre = doc.DocumentoNombreArchivo.toLowerCase();
                    return nombre.endsWith('.pdf')
                });
                let pdfsPath = pdfsDoc.map((doc: any) => `${process.env.PATH_DOCUMENTS}/${doc.DocumentoPath}`);
                //Agrega los pdf relacionados al final del informe

                // comento temporalmente la union de pdfs relacionados
                // if (pdfsPath.length) {
                //     pdfsPath = [filePath, ...pdfsPath]
                //     const buffer = await this.joinPDFsOnPath(pdfsPath)
                //     //Sobre-escribe el informe
                //     writeFileSync(filePath, buffer);
                // }

                informeNovedadPaths.push(filePath);
            }

            await page.close();
            await browser.close();

            const buffer = await this.joinPDFsOnPath(informeNovedadPaths)
            const tmpfilename = new FileUploadController().getRandomTempFileName('.pdf');
            let nameFile: string = 'informe-novedades.pdf'
            writeFileSync(tmpfilename, buffer);

            if (fs.existsSync(filesPath)) {
                fs.rmSync(filesPath, { recursive: true, force: true });
            }

            await this.procesoAutomaticoLogFin(
                queryRunner,
                ProcesoAutomaticoLogCodigo,
                'COM',
                {
                res: `Procesado correctamente`,
                'Informes generados': novedades
                },
                usuario,
                ip
            );

            await this.dowloadPdfBrowser(res, next, tmpfilename, nameFile)

        } catch (error) {

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

    async joinPDFsOnPath(listPaths: any[]) {
        const pdfFinal = await PDFDocument.create();

        // Iterar en el orden de la lista
        for (const filePath of listPaths) {
            // Verificar que el archivo exista
            if (!fs.existsSync(filePath)) continue;

            const contenidoPDF = fs.readFileSync(filePath);
            const pdf = await PDFDocument.load(new Uint8Array(contenidoPDF));

            const indices = Array.from({ length: pdf.getPageCount() }, (_, i) => i);
            const paginasCopiadas = await pdfFinal.copyPages(pdf, indices);
            paginasCopiadas.forEach(pagina => pdfFinal.addPage(pagina));
        }

        return await pdfFinal.save();
    }

}
