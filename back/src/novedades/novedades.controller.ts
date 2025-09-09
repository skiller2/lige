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
        id: "id",
        field: "id",
        fieldName: "id",
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
        sortable: false,
        hidden: true,
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
        searchHidden: true,
    },
    {
        name: "Tipo Nov.",
        type: "string",
        id: "NovedadTipoCod",
        field: "NovedadTipoCod",
        fieldName: "novtip.NovedadTipoCod",
        sortable: true,
        hidden: false,
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
                `Select
                    nov.NovedadCodigo id
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
                    ,novtip.NovedadTipoCod
                    ,nov.Fecha
                    ,nov.VisualizacionFecha
                    ,nov.Accion
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
         
        Select
            nov.NovedadCodigo id
            ,cli.ClienteId
            ,cli.ClienteDenominacion
            ,ele.ClienteElementoDependienteId
            ,obj.ObjetivoId
            ,nov.Fecha
            ,nov.Accion
             ,STRING_AGG(CAST(doc.DocumentoId AS VARCHAR), ',') AS DocumentoId
            ,nov.NovedadTipoCod AS TipoNovedadId
            ,nov.Descripcion
            , CONCAT(obj.ClienteId, '/', ISNULL(obj.ClienteElementoDependienteId,0)) AS CodObj
            ,ele.ClienteElementoDependienteDescripcion DescripcionObj
            ,1
            From Novedad nov
            
            LEFT JOIN DocumentoRelaciones doc ON doc.NovedadCodigo = nov.NovedadCodigo
            LEFT JOIN NovedadTipo novtip on novtip.NovedadTipoCod=nov.NovedadTipoCod
            LEFT JOIN ClienteElementoDependiente ele ON ele.ClienteId=nov.ClienteId and ele.ClienteElementoDependienteId=nov.ClienteElementoDependienteId
            LEFT JOIN Cliente cli on cli.ClienteId=ele.ClienteId
            LEFT JOIN Objetivo obj on obj.ClienteId=nov.ClienteId and obj.ClienteElementoDependienteId=nov.ClienteElementoDependienteId
            LEFT JOIN GrupoActividadObjetivo gaobj on gaobj.GrupoActividadObjetivoObjetivoId=obj.ObjetivoId and gaobj.GrupoActividadObjetivoDesde<=nov.Fecha and ISNULL(gaobj.GrupoActividadObjetivoHasta,'9999-12-31')>=nov.Fecha
            LEFT JOIN GrupoActividad ga on ga.GrupoActividadId=gaobj.GrupoActividadId
            LEFT JOIN GrupoActividadJerarquico gajer on gajer.GrupoActividadId=ga.GrupoActividadId  and gajer.GrupoActividadJerarquicoDesde<=nov.Fecha and ISNULL(gajer.GrupoActividadJerarquicoHasta,'9999-12-31')>=nov.Fecha and gajer.GrupoActividadJerarquicoComo='J'
            LEFT JOIN Personal jerper on jerper.PersonalId=gajer.GrupoActividadJerarquicoPersonalId
             WHERE nov.NovedadCodigo = @0
            GROUP BY
                nov.NovedadCodigo,cli.ClienteId,cli.ClienteDenominacion,ele.ClienteElementoDependienteId,obj.ObjetivoId,nov.Fecha,nov.Accion,nov.NovedadTipoCod,nov.Descripcion,CONCAT(obj.ClienteId, '/', ISNULL(obj.ClienteElementoDependienteId,0)),ele.ClienteElementoDependienteDescripcion
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
            const usuarioId =  res.locals.PersonalId

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

    async updateNovedadTable(queryRunner: any, Fecha: any, NovedadTipoCod: any, Descripcion: any, Accion: any, NovedadCodigo: any, AudFechaMod: any, AudUsuarioMod: any, AudIpMod: any,  ClienteId: any, ClienteElementoDependienteId: any) {
        await queryRunner.query(`
            UPDATE Novedad SET Fecha = @0, NovedadTipoCod = @1, Descripcion = @2, Accion = @3, AudFechaMod = @5, AudUsuarioMod = @6, AudIpMod = @7, ClienteId = @8, ClienteElementoDependienteId = @9 where NovedadCodigo = @4`
            , [ Fecha, NovedadTipoCod, Descripcion, Accion, NovedadCodigo, AudFechaMod, AudUsuarioMod, AudIpMod, ClienteId, ClienteElementoDependienteId])
    }


    async addNovedad(req: any, res: Response, next: NextFunction) {

        const usuarioName = res.locals.userName
        const queryRunner = dataSource.createQueryRunner();
        const Obj = { ...req.body }
        let NovedadIdNew = { } 

        try {
            
            const ip = this.getRemoteAddress(req)
           // const usuarioIdquery = await queryRunner.query(`SELECT UsuarioPersonalId FROM usuario WHERE UsuarioNombre = @0`, [res.locals.userName])
            const usuarioId = res.locals.PersonalId ? res.locals.PersonalId : null
           
            await queryRunner.startTransaction()
            await this.FormValidations(Obj)

          
            const novedadId = await this.getProxNumero(queryRunner, `Novedad`, res.locals.PersonalId, ip)

            const objetivo = await queryRunner.query(`SELECT ClienteId, ClienteElementoDependienteId FROM Objetivo WHERE Objetivoid = @0`, [Obj.ObjetivoId])
            Obj.ClienteId = objetivo[0].ClienteId
            Obj.ClienteElementoDependienteId = objetivo[0].ClienteElementoDependienteId

            await this.addNovedadTable(queryRunner, Obj.Fecha, Obj.TipoNovedadId, Obj.Descripcion, Obj.Accion, Obj.ClienteId, Obj.ClienteElementoDependienteId,
                  Obj.Telefono, usuarioId, ip, novedadId, usuarioName)


             let doc_id = 0
             let array_id = []
            if (Obj.files?.length > 0) {
                for (const file of Obj.files) {
                    await this.fileNovedadUpload(queryRunner, Obj, usuarioId, ip, novedadId, usuarioName, file, array_id, doc_id)
                }
            }

            NovedadIdNew = {
                novedadId: novedadId,
            }

            await queryRunner.commitTransaction()
            return this.jsonRes(NovedadIdNew, res, 'Carga de nuevo registro exitoso');
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async fileNovedadUpload(queryRunner: any, Obj: any, usuarioId: any, ip: any, novedadId: any, usuarioName: any, file: any, array_id: any, doc_id: any ) {

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

    async addNovedadTable( queryRunner: any,Fecha: any, NovedadTipoCod: any,Descripcion: any,Accion: any,ClienteId: any,
        ClienteElementoDependienteId: any,Telefono: any,usuarioId: any,ip: any, novedadId: any, usuarioName: any ) {

        const now = new Date();
        const AudFechaIng = now;
        const AudFechaMod = now;
        const AudIpIng = ip;
        const AudIpMod = ip;
        const AudUsuarioIng = usuarioName;
        const AudUsuarioMod = usuarioName;

        const PersonalId = usuarioId
        const telefono =  Telefono ? Telefono : null
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
                    await queryRunner.query(`DELETE FROM Documento WHERE DocumentoId = @0`, [doc.DocumentoId]);
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

 
}
