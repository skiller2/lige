import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { FileUploadController } from "../controller/file-upload.controller"
import { QueryRunner } from "typeorm";
import { ObjectId } from "typeorm/browser";

const getOptions: any[] = [
    { label: 'Si', value: 'True' },
    { label: 'No', value: 'False' },
    { label: 'Indeterminado', value: null }
]

const getOptionsSINO: any[] = [
    { label: 'No', value: '0' },
    { label: 'Si', value: '1' },
]


const listaColumnas: any[] = [
    {
        id: "id",
        name: "id",
        field: "id",
        fieldName: "id",
        type: "number",
        sortable: true,
        hidden: true,
        searchHidden: true
    },
    {
        name: "Código Objetivo",
        type: "number",
        id: "Codigo",
        field: "Codigo",
        fieldName: "Codigo",
        sortable: true,
        hidden: false,
        searchHidden: true,
        maxWidth: 150,
        showGridColumn: true
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
        name: "Descripcion Objetivo",
        type: "string",
        id: "Descripcion",
        field: "Descripcion",
        fieldName: "ISNULL(eledep.ClienteElementoDependienteDescripcion,cli.ClienteDenominacion)",
        searchType: "string",
        searchHidden: false,
        sortable: true

    },
    {
        name: "Cliente",
        type: "number",
        id: "ClienteId",
        field: "ClienteId",
        fieldName: "obj.ClienteId",
        searchComponent: "inputForClientSearch",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
    {
        name: "Cliente",
        type: "string",
        id: "ClienteDenominacion",
        field: "ClienteDenominacion",
        fieldName: "cli.ClienteDenominacion",
        searchType: "string",
        sortable: true,
        searchHidden: true,
        hidden: false,
    },
    {
        name: "Grupo Actividad",
        type: "string",
        id: "GrupoActividadDetalle",
        field: "GrupoActividadDetalle",
        fieldName: " gruac.GrupoActividadDetalle",
        sortable: true,
        searchHidden: true
    },
    {
        name: "Grupo Actividad",
        type: "string",
        id: "GrupoActividadId",
        field: "GrupoActividadId",
        fieldName: " gap.GrupoActividadId",
        searchComponent: "inputForGrupoActividadSearch",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
    {
        name: "Sucursal Objetivo",
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
        name: "Dirección",
        type: "string",
        id: "domCompleto",
        field: "domCompleto",
        fieldName: "objdom.domCompleto",
        sortable: true,
        hidden: false,
        searchHidden: true
    },
    {
        name: "Dir. Calle",
        type: "string",
        id: "domCalleNro",
        field: "domCalleNro",
        fieldName: "objdom.domCalleNro",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
    {
        name: "Dir. Código Postal",
        type: "string",
        id: "DomicilioCodigoPostal",
        field: "domCalDomicilioCodigoPostalleNro",
        fieldName: "objdom.DomicilioCodigoPostal",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
    {
        name: "Dir. Provincia",
        type: "number",
        id: "DomicilioProvinciaId",
        field: "DomicilioProvinciaId",
        fieldName: "objdom.DomicilioProvinciaId",
        searchComponent: "inputForProvinciasSearch",
        searchType: "number",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
    {
        name: "Dir. Localidad",
        type: "number",
        id: "DomicilioLocalidadId",
        field: "DomicilioLocalidadId",
        fieldName: "objdom.DomicilioLocalidadId",
        searchComponent: "inputForLocalidadesSearch",
        searchType: "number",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
    {
        name: "Dir. Barrio",
        type: "number",
        id: "DomicilioBarrioId",
        field: "DomicilioBarrioId",
        fieldName: "objdom.DomicilioBarrioId",
        searchComponent: "inputForBarrioSearch",
        searchType: "number",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
    {
        name: "Administrador",
        type: "string",
        id: "AdministradorId",
        field: "AdministradorId",
        fieldName: "adm.AdministradorId",
        searchComponent: "inputForTipoSeguroSearch",
        sortable: true,
        hidden: true,
        searchHidden: false
    },
    {
        name: "Contrato Desde",
        type: "date",
        id: "ContratoFechaDesde",
        field: "ContratoFechaDesde",
        fieldName: "ISNULL(eledepcon.ClienteElementoDependienteContratoFechaDesde,'9999-12-31')",
        searchComponent: "inputForFechaSearch",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Contrato Hasta",
        type: "date",
        id: "ContratoFechaHasta",
        field: "ContratoFechaHasta",
        fieldName: "ISNULL(eledepcon.ClienteElementoDependienteContratoFechaHasta,'9999-12-31')",
        searchComponent: "inputForFechaSearch",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Lugares Habilitación Necesaria ids",
        type: "string",
        id: "LugarHabilitacionIdList",
        field: "LugarHabilitacionIdList",
        fieldName: "oan.LugarHabilitacionIdList",
        sortable: true,
        hidden: true,
        searchHidden: true
    },
    {
        name: "Lugares Habilitación Necesaria",
        type: "string",
        id: "LugarHabilitacionDescripcionList",
        field: "LugarHabilitacionDescripcionList",
        fieldName: "oan.LugarHabilitacionDescripcionList",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    // {
    //     name: "Objetivo Habilitado",
    //     id: "ObjetivoHabilitado",
    //     field: "ObjetivoHabilitado",
    //     fieldName: "ISNULL(docHabilitacion.ObjetivoHabilitado,'0')",
    //     type: 'string',

    //     searchComponent: "inputForActivo",
    //     sortable: true,
    //     formatter: 'collectionFormatter',
    //     params: { collection: getOptionsSINO },
    //     exportWithFormatter: true,
        
    //     hidden: false,
    //     searchHidden: false,
    //     minWidth: 80,
    //     maxWidth: 80,
    //     cssClass: 'text-center'
    // },

];


const columnasGrillaHistoryContrato: any[] = [

    {
        name: "id",
        type: "number",
        id: "id",
        field: "id",
        fieldName: "id",
        hidden: true,
        searchHidden: true,
        sortable: true
    },
    {
        name: "Desde",
        type: "date",
        id: "desde",
        field: "desde",
        fieldName: "clie.ClienteElementoDependienteContratoFechaDesde",
        hidden: false,
        searchHidden: false,
        sortable: false
    },
    {
        name: "Hasta",
        type: "date",
        id: "hasta",
        field: "hasta",
        fieldName: "clie.ClienteElementoDependienteContratoFechaHasta",
        hidden: false,
        searchHidden: false,
        sortable: false
    }
];

const columnasGrillaHistoryDomicilio: any[] = [

    {
        name: "id",
        type: "number",
        id: "id",
        field: "id",
        fieldName: "id",
        hidden: true,
        searchHidden: true,
        sortable: true
    },
    {
        name: "Calle",
        type: "string",
        id: "calle",
        field: "calle",
        fieldName: "dom.DomicilioDomCalle",
        hidden: false,
        searchHidden: false,
        sortable: false
    },
    {
        name: "Codigo Postal",
        type: "string",
        id: "postal",
        field: "postal",
        fieldName: "dom.DomicilioCodigoPostal",
        hidden: false,
        searchHidden: false,
        sortable: false
    },
    {
        name: "Complemento",
        type: "string",
        id: "DomicilioDomLugar",
        field: "DomicilioDomLugar",
        fieldName: "dom.DomicilioDomLugar",
        hidden: false,
        searchHidden: false,
        sortable: false
    },
    {
        name: "Provincia",
        type: "string",
        id: "provincia",
        field: "provincia",
        fieldName: "rov.provinciadescripcion",
        hidden: false,
        searchHidden: false,
        sortable: false
    },
    {
        name: "Localidad",
        type: "string",
        id: "localidad",
        field: "localidad",
        fieldName: "local.localidaddescripcion",
        hidden: false,
        searchHidden: false,
        sortable: false
    },
    {
        name: "Barrio",
        type: "string",
        id: "barrio",
        field: "barrio",
        fieldName: "bar.barriodescripcion",
        hidden: false,
        searchHidden: false,
        sortable: false
    },
];

const columnasGrillaHistoryGrupoActividad: any[] = [

    {
        name: "id",
        type: "number",
        id: "id",
        field: "id",
        fieldName: "id",
        hidden: true,
        searchHidden: true,
        sortable: true
    },
    {
        name: "Grupo Actividad",
        type: "string",
        id: "detalle",
        field: "detalle",
        fieldName: "acti.grupoactividadDetalle",
        hidden: false,
        searchHidden: false,
        sortable: false
    },
    {
        name: "Desde",
        type: "date",
        id: "desde",
        field: "desde",
        fieldName: "grup.GrupoActividadObjetivoDesde",
        hidden: false,
        searchHidden: false,
        sortable: false
    },
    {
        name: "Hasta",
        type: "date",
        id: "hasta",
        field: "hasta",
        fieldName: "grup.GrupoActividadObjetivoHasta",
        hidden: false,
        searchHidden: false,
        sortable: false
    },


];

const listDocsColumns: any[] = [
    {
        id: "id",
        name: "Id",
        field: "id",
        fieldName: "doc.DocumentoId",
        type: "number",
        sortable: false,
        hidden: false,
        searchHidden: false,
        maxWidth: 150,
    },
    {
        name: "Denominación",
        type: "string",
        id: "DocumentoDenominadorDocumento",
        field: "DocumentoDenominadorDocumento",
        fieldName: "doc.DocumentoDenominadorDocumento",
        sortable: true,
        hidden: false,
        searchHidden: false,
        // maxWidth: 500,
    },
    {
        name: "Tipo",
        type: "string",
        id: "DocumentoTipoCodigo",
        field: "DocumentoTipoCodigo",
        fieldName: "doc.DocumentoTipoCodigo",
        searchComponent: "inputForTipoDocumentoSearch",
        sortable: true,
        hidden: true,
        searchHidden: false,
        // maxWidth: 500,
    },
    {
        name: "Tipo",
        type: "string",
        id: "Descripcion",
        field: "Descripcion",
        fieldName: "param.DocumentoTipoDetalle",
        sortable: true,
        hidden: false,
        searchHidden: true,
        // maxWidth: 200,
    },
    {
        name: "Desde",
        type: "date",
        id: "Desde",
        field: "doc.DocumentoFecha",
        fieldName: "doc.DocumentoFecha",
        searchComponent: "inputForFechaSearch",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
    {
        name: "Hasta",
        type: "date",
        id: "Hasta",
        field: "Hasta",
        fieldName: "doc.DocumentoFechaDocumentoVencimiento",
        searchComponent: "inputForFechaSearch",
        sortable: true,
        hidden: false,
        searchHidden: false
    },
];

export class ObjetivosController extends BaseController {

    async getGridCols(req, res) {
        this.jsonRes(listaColumnas, res);
    }

    async getDocsGridCols(req, res) {
        this.jsonRes(listDocsColumns, res);
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
                `
SELECT 
                    -- DISTINCT
                    ROW_NUMBER() OVER (ORDER BY obj.ObjetivoId) AS id,
                    obj.ObjetivoId,
                    obj.ClienteId,
                    obj.ClienteElementoDependienteId,
                    CONCAT(obj.ClienteId, '/', ISNULL(obj.ClienteElementoDependienteId,0)) AS Codigo, 
                    cli.ClienteDenominacion,
                    ISNULL(eledep.ClienteElementoDependienteDescripcion,cli.ClienteDenominacion) Descripcion,                
                    gap.GrupoActividadId,
                    ga.GrupoActividadDetalle,
                        adm.AdministradorApellidoNombre,
                    adm.AdministradorId,
                    suc.SucursalDescripcion,
                                
                    eledepcon.ClienteElementoDependienteContratoFechaDesde AS ContratoFechaDesde,
                    eledepcon.ClienteElementoDependienteContratoFechaHasta AS ContratoFechaHasta,
                    objdom.domCompleto,
					objdom.domCalleNro,
					 objdom.DomicilioCodigoPostal, objdom.DomicilioPaisId, objdom.DomicilioProvinciaId,objdom.DomicilioLocalidadId,objdom.DomicilioBarrioId,
                    oan.LugarHabilitacionIdList,
                    oan.LugarHabilitacionDescripcionList,
                    1
                    FROM Objetivo obj 
                    LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
                    LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteId = obj.ClienteId AND eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
                                        
                    LEFT JOIN (SELECT ec.ClienteId, ec.ClienteElementoDependienteId, MAX(ec.ClienteElementoDependienteContratoId) ClienteElementoDependienteContratoId FROM ClienteElementoDependienteContrato ec WHERE  EOMONTH(DATEFROMPARTS(@0,@1,1)) >= ec.ClienteElementoDependienteContratoFechaDesde 
                        --   AND ISNULL(ec.ClienteElementoDependienteContratoFechaHasta, '9999-12-31') >= DATEFROMPARTS(@0,@1,1)
                        --   AND ISNULL(ec.ClienteElementoDependienteContratoFechaFinalizacion, '9999-12-31') >= DATEFROMPARTS(@0,@1,1)
                    GROUP BY ec.ClienteId, ec.ClienteElementoDependienteId
                                            
                        ) eledepcon2 ON eledepcon2.ClienteId = obj.ClienteId AND eledepcon2.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
                                        
                                        
                    --LEFT JOIN ClienteElementoDependienteContrato eledepcon ON eledepcon.ClienteId = obj.ClienteId  AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId  AND eledepcon.ClienteElementoDependienteContratoId = eledepcon2.ClienteElementoDependienteContratoId
                                    
                        LEFT JOIN (
                            SELECT 
                                ec.ClienteId, 
                                ec.ClienteElementoDependienteId, 
                                ec.ClienteElementoDependienteContratoId, 
                                ec.ClienteElementoDependienteContratoFechaDesde, 
                                ec.ClienteElementoDependienteContratoFechaHasta,
                                ROW_NUMBER() OVER (PARTITION BY ec.ClienteId, ec.ClienteElementoDependienteId 
                                                    ORDER BY ec.ClienteElementoDependienteContratoFechaDesde DESC) AS RowNum
                            FROM ClienteElementoDependienteContrato ec
                            WHERE EOMONTH(DATEFROMPARTS(@0,@1,1)) >= ec.ClienteElementoDependienteContratoFechaDesde
                        ) eledepcon ON eledepcon.ClienteId = obj.ClienteId 
                            AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
                            AND eledepcon.RowNum = 1       
                                    
                    --           LEFT JOIN (SELECT GrupoActividadObjetivoObjetivoId, MAX(GrupoActividadObjetivoId) GrupoActividadObjetivoId FROM GrupoActividadObjetivo
                    --		WHERE EOMONTH(DATEFROMPARTS(@0,@1,1)) >= GrupoActividadObjetivoDesde AND DATEFROMPARTS(@0,@1,1) <= ISNULL(GrupoActividadObjetivoHasta,'9999-12-31') 
                    --		GROUP BY GrupoActividadObjetivoObjetivoId
                        --) gap2 ON gap2.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId 
                        
                    LEFT JOIN GrupoActividadObjetivo gap ON gap.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND gap.GrupoActividadObjetivoDesde<=@2 AND ISNULL(gap.GrupoActividadObjetivoHasta, '9999-12-31')>=@2
                    LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId
                                                
                    LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(eledep.ClienteElementoDependienteSucursalId ,cli.ClienteSucursalId)

                    Left join (Select  (TRIM(dom.DomicilioDomCalle) + ' '+ TRIM(dom.DomicilioDomNro)) domCalleNro, obj.ObjetivoId, 
								
								CONCAT_WS(', ', CONCAT_WS(' ',NULLIF(TRIM(dom.DomicilioDomCalle), ''),NULLIF(TRIM(dom.DomicilioDomNro), '')),NULLIF(CONCAT('C', TRIM(dom.DomicilioCodigoPostal)), 'C'),
								NULLIF(TRIM(bar.BarrioDescripcion), ''),NULLIF(TRIM(loc.LocalidadDescripcion), ''),NULLIF(TRIM(prov.ProvinciaDescripcion), ''),NULLIF(TRIM(pais.PaisDescripcion), '')) AS domCompleto

								, dom.DomicilioCodigoPostal, dom.DomicilioPaisId,dom.DomicilioProvinciaId,dom.DomicilioLocalidadId,dom.DomicilioBarrioId
                                from Objetivo obj
                                LEFT JOIN NexoDomicilio nexdom ON nexdom.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND nexdom.ClienteId = obj.ClienteId AND nexdom.NexoDomicilioActual = 1
                                LEFT JOIN Domicilio dom ON dom.DomicilioId = nexdom.DomicilioId
                                LEFT JOIN Pais pais on pais.PaisId=dom.DomicilioPaisId
                                LEFT JOIN Provincia prov on prov.PaisId=pais.PaisId and prov.ProvinciaId=dom.DomicilioProvinciaId
                                LEFT JOIN Localidad loc on loc.PaisId=pais.PaisId and loc.ProvinciaId=prov.ProvinciaId  and loc.LocalidadId=dom.DomicilioLocalidadId 
                                LEFT JOIN Barrio bar on bar.PaisId=pais.PaisId and prov.ProvinciaId=bar.ProvinciaId and loc.LocalidadId=bar.LocalidadId and dom.DomicilioBarrioId=bar.BarrioId
                                ) AS objdom on objdom.ObjetivoId=obj.ObjetivoId
                            
                    LEFT JOIN ( SELECT   ca.ClienteId,ca.ClienteAdministradorAdministradorId AS AdministradorId,adm.AdministradorApellidoNombre, 
                                ROW_NUMBER() OVER (PARTITION BY ca.ClienteId ORDER BY ca.ClienteAdministradorAdministradorId DESC) AS RowNum
                                FROM ClienteAdministrador ca JOIN Administrador adm ON adm.AdministradorId = ca.ClienteAdministradorAdministradorId) 
                                adm ON adm.ClienteId = cli.ClienteId  AND adm.RowNum = 1
                    LEFT JOIN (
                        SELECT an.ObjetivoId, STRING_AGG(an.ObjetivoHabilitacionNecesariaLugarHabilitacionId,',') LugarHabilitacionIdList, STRING_AGG(TRIM(lh.LugarHabilitacionDescripcion),' , ') LugarHabilitacionDescripcionList FROM ObjetivoHabilitacionNecesaria an
                        JOIN LugarHabilitacion lh ON lh.LugarHabilitacionId = an.ObjetivoHabilitacionNecesariaLugarHabilitacionId
                        WHERE an.ObjetivoHabilitacionNecesariaInactivo IS NULL OR an.ObjetivoHabilitacionNecesariaInactivo=0
                    GROUP BY  an.ObjetivoId
                        ) oan ON oan.ObjetivoId = obj.ObjetivoId                
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

    async listDocsObjetivo(req: any, res: Response, next: NextFunction) {

        const filterSql = filtrosToSql(req.body.options.filtros, listDocsColumns);
        const orderBy = orderToSQL(req.body.options.sort);
        const ClienteId = req.body.ClienteId;
        const ObjetivoId = req.body.ObjetivoId;
        const queryRunner = dataSource.createQueryRunner();

        try {
            const documentos = await queryRunner.query(
                `SELECT doc.DocumentoId AS id, doc.DocumentoDenominadorDocumento, doc.DocumentoFecha Desde, doc.DocumentoFechaDocumentoVencimiento Hasta,CONCAT(doc.DocumentoMes, '/', doc.DocumentoAnio) periodo,
                param.DocumentoTipoCodigo Parametro, param.DocumentoTipoDetalle Descripcion,
                CONCAT('api/file-upload/downloadFile/', doc.DocumentoId, '/Documento/0') url,
                RIGHT(doc.DocumentoNombreArchivo, CHARINDEX('.', REVERSE(doc.DocumentoNombreArchivo)) - 1) TipoArchivo,
                1
            FROM Documento doc
            LEFT JOIN DocumentoTipo param ON param.DocumentoTipoCodigo = doc.DocumentoTipoCodigo
            WHERE doc.ObjetivoId = @1
                AND ${filterSql}`, [ClienteId, ObjetivoId])

            this.jsonRes(
                {
                    total: documentos.length,
                    list: documentos,
                },
                res
            );

        } catch (error) {
            return next(error)
        }

    }

    async getDescuento(req, res) {
        this.jsonRes(getOptions, res);
    }

    async infObjetivoQuerys(queryRunner: any, ObjetivoId: any, ClienteId: any, ClienteElementoDependienteId:any) {
        
        let infObjetivo = await this.getObjetivoQuery(queryRunner, ObjetivoId, ClienteId, ClienteElementoDependienteId)
        const infoCoordinadorCuenta = await this.getCoordinadorCuentaQuery(queryRunner, ObjetivoId)
        const rubrosCliente = await this.getRubroQuery(queryRunner, ClienteId, ClienteElementoDependienteId)
        const docsRequerido = await this.getDocRequeridoQuery(queryRunner, ClienteId, ClienteElementoDependienteId)
        const domiclio = await this.getDomicilio(queryRunner, ObjetivoId, ClienteId, ClienteElementoDependienteId)
        const facturacion = await this.getFacturacion(queryRunner, ClienteId, ClienteElementoDependienteId)
        const grupoactividad = await this.getGrupoActividad(queryRunner, ObjetivoId, ClienteId, ClienteElementoDependienteId)
        const grupoactividadjerarquico = await this.getGrupoActividadJerarquico(queryRunner, grupoactividad[0]?.GrupoActividadId)
        const habilitacion = await this.getFormHabilitacionByObjetivoIdQuery(queryRunner, ObjetivoId)

        if (!facturacion) {
            infObjetivo = { ...infObjetivo[0], ...domiclio[0] };
        } else {
            infObjetivo = { ...infObjetivo[0], ...domiclio[0], ...facturacion[0] };
        }

        infObjetivo.infoCoordinadorCuenta = infoCoordinadorCuenta
        infObjetivo.docsRequerido = docsRequerido
        infObjetivo.infoActividad = [grupoactividad?.[0]]
        infObjetivo.infoActividadJerarquico = grupoactividadjerarquico
        infObjetivo.rubrosCliente = rubrosCliente
        infObjetivo.habilitacion = habilitacion

        return infObjetivo
    }

    async infObjetivo(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        try {
            await queryRunner.startTransaction()
            const ObjetivoId = req.params.ObjetivoId
            const ClienteId = req.params.ClienteId
            const ClienteElementoDependienteId = req.params.ClienteElementoDependienteId === "null" ? null : req.params.ClienteElementoDependienteId
            let infObjetivo = await this.getObjetivoQuery(queryRunner, ObjetivoId, ClienteId, ClienteElementoDependienteId)
            const infoCoordinadorCuenta = await this.getCoordinadorCuentaQuery(queryRunner, ObjetivoId)
            const rubrosCliente = await this.getRubroQuery(queryRunner, ClienteId, ClienteElementoDependienteId)
            const docsRequerido = await this.getDocRequeridoQuery(queryRunner, ClienteId, ClienteElementoDependienteId)
            const domiclio = await this.getDomicilio(queryRunner, ObjetivoId, ClienteId, ClienteElementoDependienteId)
            const facturacion = await this.getFacturacion(queryRunner, ClienteId, ClienteElementoDependienteId)
            const grupoactividad = await this.getGrupoActividad(queryRunner, ObjetivoId, ClienteId, ClienteElementoDependienteId)
            const grupoactividadjerarquico = await this.getGrupoActividadJerarquico(queryRunner, grupoactividad[0]?.GrupoActividadId)
            const habilitacion = await this.getFormHabilitacionByObjetivoIdQuery(queryRunner, ObjetivoId)

            if (!facturacion) {
                infObjetivo = { ...infObjetivo[0], ...domiclio[0] };
            } else {
                infObjetivo = { ...infObjetivo[0], ...domiclio[0], ...facturacion[0] };
            }

            infObjetivo.infoCoordinadorCuenta = infoCoordinadorCuenta
            infObjetivo.docsRequerido = docsRequerido
            infObjetivo.infoActividad = [grupoactividad?.[0]]
            infObjetivo.infoActividadJerarquico = grupoactividadjerarquico
            infObjetivo.rubrosCliente = rubrosCliente
            infObjetivo.habilitacion = habilitacion

            await queryRunner.commitTransaction()
            return this.jsonRes(infObjetivo, res)
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async getFacturacion(queryRunner, ClienteId, ClienteElementoDependienteId) {


        if (!ClienteElementoDependienteId) {

            const fechaActual = new Date()
            const anio = fechaActual.getFullYear()
            const mes = fechaActual.getMonth() + 1

            return await queryRunner.query(`
                SELECT 
                    fac.ClienteFacturacionCUIT
                    ,fac.ClienteFacturacionId
                    ,fac.CondicionAnteIVAId
                    ,TRIM(con.CondicionAnteIVADescripcion) AS CondicionAnteIVADescripcion
                FROM ClienteFacturacion fac
                LEFT JOIN CondicionAnteIVA con ON con.CondicionAnteIVAId = fac.CondicionAnteIVAId
                WHERE fac.ClienteId = @2
                AND fac.ClienteFacturacionDesde <= DATEFROMPARTS(@0, @1, 1)
                AND ISNULL(fac.ClienteFacturacionHasta, '9999-12-31') >= DATEFROMPARTS(@0, @1, 1)`, [anio, mes, ClienteId])

        }

    }
    async getGrupoActividad(queryRunner: any, ObjetivoId: any, ClienteId: any, ClienteElementoDependienteId: any) {

        return await queryRunner.query(`
        SELECT GrupoActividadObjetivoId, GrupoActividadId, GrupoActividadId AS GrupoActividadOriginal,
        GrupoActividadObjetivoDesde, GrupoActividadObjetivoDesde AS GrupoActividadObjetivoDesdeOriginal,
        GrupoActividadObjetivoHasta
        FROM GrupoActividadObjetivo 
        WHERE GrupoActividadObjetivoObjetivoId = @0 ORDER BY ISNULL(GrupoActividadObjetivoHasta,'9999-12-31') DESC, GrupoActividadObjetivodesde DESC, GrupoActividadObjetivoAudFechaIng DESC;`
            , [ObjetivoId])


    }
    async getGrupoActividadJerarquico(queryRunner: any, GrupoActividadId: any) {

        return await queryRunner.query(`
        SELECT TOP 1 GrupoActividadJerarquicoId, GrupoActividadId, GrupoActividadId AS GrupoActividadOriginal,
        GrupoActividadJerarquicoDesde, GrupoActividadJerarquicoDesde AS GrupoActividadJerarquicoDesdeOriginal,
        GrupoActividadJerarquicoHasta, GrupoActividadJerarquicoPersonalId
        FROM GrupoActividadJerarquico 
        WHERE GrupoActividadId = @0 AND GrupoActividadJerarquicoComo='J'
        ORDER BY ISNULL(GrupoActividadJerarquicoHasta,'9999-12-31') DESC, GrupoActividadJerarquicoDesde DESC, GrupoActividadJerarquicoAudFechaIng DESC`
            , [GrupoActividadId])


    }

    async getDomicilio(queryRunner: any, ObjetivoId: any, ClienteId: any, ClienteElementoDependienteId: any) {

        if (!ObjetivoId && (ClienteId && ClienteElementoDependienteId)) {

            return await queryRunner.query(`SELECT TOP 1 
                    dom.DomicilioId AS DomicilioId,
                    TRIM(dom.DomicilioDomCalle) AS DomicilioDomCalle,
                    TRIM(dom.DomicilioDomNro) AS DomicilioDomNro,
                    TRIM(dom.DomicilioCodigoPostal) AS DomicilioCodigoPostal,
                    dom.DomicilioPaisId AS DomicilioPaisId,
                    dom.DomicilioProvinciaId AS DomicilioProvinciaId,
                    dom.DomicilioLocalidadId AS DomicilioLocalidadId,
                    dom.DomicilioBarrioId AS DomicilioBarrioId,
                    dom.DomicilioDomLugar AS DomicilioDomLugar,
                    CONCAT_WS(', ',
                        NULLIF(
                            TRIM(
                                CONCAT_WS(' ', 
                                    NULLIF(TRIM(dom.DomicilioDomCalle), ''),
                                    NULLIF(TRIM(dom.DomicilioDomNro), '')
                                )
                            ),
                            ''
                        ),
                        -- Código postal
                        NULLIF(CONCAT('CP ', TRIM(dom.DomicilioCodigoPostal)), 'CP '),
                        -- Barrio
                        NULLIF(TRIM(bar.BarrioDescripcion), ''),
                        -- Localidad
                        NULLIF(TRIM(loc.LocalidadDescripcion), ''),
                        -- Provincia
                        NULLIF(TRIM(prov.ProvinciaDescripcion), ''),
                        -- País
                        NULLIF(TRIM(pais.PaisDescripcion), '')
                    ) AS domCompleto
                FROM Domicilio AS dom
                JOIN NexoDomicilio nexdom ON nexdom.DomicilioId = dom.DomicilioId
                LEFT JOIN Objetivo obj ON obj.ClienteElementoDependienteId = nexdom.ClienteElementoDependienteId 
                    AND obj.ClienteId = nexdom.ClienteId
                LEFT JOIN Pais pais ON pais.PaisId = dom.DomicilioPaisId
                LEFT JOIN Provincia prov ON prov.PaisId = pais.PaisId 
                    AND prov.ProvinciaId = dom.DomicilioProvinciaId
                LEFT JOIN Localidad loc ON loc.PaisId = pais.PaisId 
                    AND loc.ProvinciaId = prov.ProvinciaId  
                    AND loc.LocalidadId = dom.DomicilioLocalidadId 
                LEFT JOIN Barrio bar ON bar.PaisId = pais.PaisId 
                    AND bar.ProvinciaId = dom.DomicilioProvinciaId
                    AND bar.LocalidadId = dom.DomicilioLocalidadId 
                    AND bar.BarrioId = dom.DomicilioBarrioId
                WHERE nexdom.ClienteElementoDependienteId =@1 AND nexdom.ClienteId = @0 AND nexdom.NexoDomicilioActual = 1
                    AND nexdom.NexoDomicilioActual = 1
                ORDER BY dom.DomicilioId DESC;`,
                [ClienteId, ClienteElementoDependienteId])

        }

        return await queryRunner.query(`SELECT TOP 1 
                    dom.DomicilioId AS DomicilioId,
                    TRIM(dom.DomicilioDomCalle) AS DomicilioDomCalle,
                    TRIM(dom.DomicilioDomNro) AS DomicilioDomNro,
                    TRIM(dom.DomicilioCodigoPostal) AS DomicilioCodigoPostal,
                    dom.DomicilioPaisId AS DomicilioPaisId,
                    dom.DomicilioProvinciaId AS DomicilioProvinciaId,
                    dom.DomicilioLocalidadId AS DomicilioLocalidadId,
                    dom.DomicilioBarrioId AS DomicilioBarrioId,
                    dom.DomicilioDomLugar AS DomicilioDomLugar,
                    CONCAT_WS(', ',
                        NULLIF(
                            TRIM(
                                CONCAT_WS(' ', 
                                    NULLIF(TRIM(dom.DomicilioDomCalle), ''),
                                    NULLIF(TRIM(dom.DomicilioDomNro), '')
                                )
                            ),
                            ''
                        ),
                        -- Código postal
                        NULLIF(CONCAT('CP ', TRIM(dom.DomicilioCodigoPostal)), 'CP '),
                        -- Barrio
                        NULLIF(TRIM(bar.BarrioDescripcion), ''),
                        -- Localidad
                        NULLIF(TRIM(loc.LocalidadDescripcion), ''),
                        -- Provincia
                        NULLIF(TRIM(prov.ProvinciaDescripcion), ''),
                        -- País
                        NULLIF(TRIM(pais.PaisDescripcion), '')
                    ) AS domCompleto
                FROM Domicilio AS dom
                JOIN NexoDomicilio nexdom ON nexdom.DomicilioId = dom.DomicilioId
                LEFT JOIN Objetivo obj ON obj.ClienteElementoDependienteId = nexdom.ClienteElementoDependienteId 
                    AND obj.ClienteId = nexdom.ClienteId
                LEFT JOIN Pais pais ON pais.PaisId = dom.DomicilioPaisId
                LEFT JOIN Provincia prov ON prov.PaisId = pais.PaisId 
                    AND prov.ProvinciaId = dom.DomicilioProvinciaId
                LEFT JOIN Localidad loc ON loc.PaisId = pais.PaisId 
                    AND loc.ProvinciaId = prov.ProvinciaId  
                    AND loc.LocalidadId = dom.DomicilioLocalidadId 
                LEFT JOIN Barrio bar ON bar.PaisId = pais.PaisId 
                    AND bar.ProvinciaId = dom.DomicilioProvinciaId
                    AND bar.LocalidadId = dom.DomicilioLocalidadId 
                    AND bar.BarrioId = dom.DomicilioBarrioId
                WHERE obj.ObjetivoId = @0 
                    AND nexdom.NexoDomicilioActual = 1
                ORDER BY dom.DomicilioId DESC;`,
            [ObjetivoId])

    }



    async getCoordinadorCuentaQuery(queryRunner: any, ObjetivoId: any) {
        return await queryRunner.query(`SELECT
                ObjetivoId,
                ObjetivoPersonalJerarquicoId,
                ObjetivoPersonalJerarquicoPersonalId as PersonalId,
                ObjetivoPersonalJerarquicoComision,
                ObjetivoPersonalJerarquicoDesde,
                ObjetivoPersonalJerarquicoHasta,
                ObjetivoPersonalJerarquicoDescuentos,
                ObjetivoPersonalJerarquicoSeDescuentaTelefono
                FROM ObjetivoPersonalJerarquico

                WHERE ObjetivoId = @0 AND ObjetivoPersonalJerarquicoDesde <= @1 AND ISNULL(ObjetivoPersonalJerarquicoHasta,'9999-12-31') >= @1`,
            [ObjetivoId, new Date()])
    }

    async getRubroQuery(queryRunner: any, ClienteId: any, ClienteElementoDependienteId: any) {
        const rubros = []
        const ClienteEleDepRubro = await queryRunner.query(`
            SELECT ClienteElementoDependienteRubroClienteId AS RubroId 
            FROM ClienteEleDepRubro 
            WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1`,
            [ClienteId, ClienteElementoDependienteId])

        for (const rubro of ClienteEleDepRubro)
            rubros.push(rubro.RubroId)
        return rubros
    }

    async getDocRequeridoQuery(queryRunner: any, ClienteId: any, ClienteElementoDependienteId) {
        let docsRequerido = []
        const ClienteElementoDependienteDocRequerido = await queryRunner.query(`
            SELECT DocumentoTipoCodigo FROM ClienteElementoDependienteDocRequerido 
            WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1`,
            [ClienteId, ClienteElementoDependienteId])

        for (const obj of ClienteElementoDependienteDocRequerido)
            docsRequerido.push(obj.DocumentoTipoCodigo)
        return docsRequerido
    }

    async getObjetivoQuery(queryRunner: any, ObjetivoId: any, ClienteId: any, ClienteElementoDependienteId: any) {
        const fechaActual = new Date()
        const anio = fechaActual.getFullYear()
        const mes = fechaActual.getMonth() + 1
        if (ClienteElementoDependienteId) {
            return await queryRunner.query(`SELECT obj.ObjetivoId
                ,obj.ObjetivoId AS id
                ,obj.ClienteId
                ,obj.ClienteElementoDependienteId
                ,eledep.ClienteElementoDependienteRubroUltNro as RubroUltNro
                ,TRIM(eledep.ClienteElementoDependienteDescripcion) AS Descripcion
                ,suc.SucursalDescripcion
                ,suc.SucursalId
                ,eledep.CoberturaServicio
                ,eledepcon.ClienteElementoDependienteContratoFechaDesde AS ContratoFechaDesde
                ,eledepcon.ClienteElementoDependienteContratoFechaHasta AS ContratoFechaHasta
                ,eledepcon.ClienteElementoDependienteContratoId AS ContratoId
                ,eledep.ClienteElementoDependienteContratoUltNro

            FROM Objetivo obj
            LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
            LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteId = obj.ClienteId
                AND eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
            LEFT JOIN (
                SELECT ec.ClienteId
                    ,ec.ClienteElementoDependienteId
                    ,MAX(ec.ClienteElementoDependienteContratoId) AS ClienteElementoDependienteContratoId
                FROM ClienteElementoDependienteContrato ec
                WHERE EOMONTH(DATEFROMPARTS(@3, @4, 1)) >= ec.ClienteElementoDependienteContratoFechaDesde
             --       AND ISNULL(ec.ClienteElementoDependienteContratoFechaHasta, '9999-12-31') >= DATEFROMPARTS(@3, @4, 1)
                GROUP BY ec.ClienteId
                    ,ec.ClienteElementoDependienteId
                ) eledepcon2 ON eledepcon2.ClienteId = obj.ClienteId
                AND eledepcon2.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
            LEFT JOIN ClienteElementoDependienteContrato eledepcon ON eledepcon.ClienteId = obj.ClienteId
                AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
                AND eledepcon.ClienteElementoDependienteContratoId = eledepcon2.ClienteElementoDependienteContratoId
            LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(eledep.ClienteElementoDependienteSucursalId, cli.ClienteSucursalId)
           
            WHERE obj.ObjetivoId = @0;`,
                [ObjetivoId, ClienteId, ClienteElementoDependienteId, anio, mes])

        } else {
            return await queryRunner.query(`
                SELECT cli.ClienteId AS id
                ,cli.ClienteId
                ,TRIM(cli.ClienteDenominacion) AS Descripcion 
                ,TRIM(cli.CLienteNombreFantasia) AS CLienteNombreFantasia
                ,cli.ClienteRubroUltNro as RubroUltNro
                ,cli.ClienteAdministradorUltNro
                ,cli.ClienteSucursalId AS SucursalId
                ,TRIM(adm.AdministradorNombre) AS AdministradorNombre
                ,TRIM(adm.AdministradorApellido) AS AdministradorApellido
                ,adm.AdministradorId
            FROM Cliente cli
                
            LEFT JOIN (
                SELECT TOP 1 ca.ClienteId
                    ,ca.ClienteAdministradorAdministradorId AS AdministradorId
                    ,adm.AdministradorNombre
                    ,adm.AdministradorApellido
                FROM ClienteAdministrador ca
                JOIN Administrador adm ON adm.AdministradorId = ca.ClienteAdministradorAdministradorId
                WHERE ca.ClienteId = @0
                ORDER BY ca.ClienteAdministradorId DESC
                ) AS adm ON adm.ClienteId = cli.ClienteId


            WHERE cli.ClienteId = @0;`,
                [ClienteId, anio, mes])
        }

    }

    async validateDateAndCreateContrato(queryRunner: any, ContratoFechaDesde: Date, ContratoFechaDesdeOLD: Date, ContratoFechaHasta: Date, ContratoFechaHastaOLD: Date, FechaModificada: boolean, ClienteId: number, ClienteElementoDependienteId: number, ObjetivoId: number, ContratoId: number, ip: string, usuarioId: number, usuario: string) {

        let createNewContrato = false
        ContratoFechaDesde = ContratoFechaDesde ? new Date(ContratoFechaDesde) : null
        ContratoFechaDesdeOLD = ContratoFechaDesdeOLD ? new Date(ContratoFechaDesdeOLD) : null
        ContratoFechaHastaOLD = ContratoFechaHastaOLD ? new Date(ContratoFechaHastaOLD) : null
        ContratoFechaHasta = ContratoFechaHasta ? new Date(ContratoFechaHasta) : null
        const now = new Date()
        if (ContratoFechaDesde)
            ContratoFechaDesde.setHours(0, 0, 0, 0)

        if (ContratoFechaHasta)
            ContratoFechaHasta.setHours(0, 0, 0, 0)

        if (ContratoFechaDesdeOLD) {
            ContratoFechaDesdeOLD.setHours(0, 0, 0, 0)
        }

        if (ContratoFechaHastaOLD)
            ContratoFechaHastaOLD.setHours(0, 0, 0, 0)

        if (!FechaModificada && !ContratoFechaDesdeOLD && !ContratoFechaHastaOLD)
            throw new ClientException(`Debe completar el campo Contrato Desde.`)

        if (!FechaModificada) {
            return true
        }
        if (!ContratoFechaDesde) {
            throw new ClientException(`Debe completar el campo Contrato Desde.`)
        }

        if (ContratoFechaHasta && ContratoFechaDesde > ContratoFechaHasta) {
            throw new ClientException(`La fecha desde no puede ser mayor a la fecha hasta`)
        }
        const ValidatePeriodoAndDay = await queryRunner.query(`SELECT TOP 1 *, EOMONTH(DATEFROMPARTS(anio, mes, 1)) AS FechaCierre FROM lige.dbo.liqmaperiodo WHERE ind_recibos_generados = 1 ORDER BY anio DESC, mes DESC `)
        const FechaCierre = new Date(ValidatePeriodoAndDay[0].FechaCierre);

        // Fechas desde y hasta < Fecha del último periodo cerrado no se modifican.
        if (ContratoFechaDesdeOLD && ContratoFechaDesdeOLD < FechaCierre && ContratoFechaHastaOLD && ContratoFechaHastaOLD < FechaCierre) {

            if (ContratoFechaDesde < FechaCierre) {
                throw new ClientException(`La fecha desde del contrato debe ser mayor que la fecha del último periodo cerrado, fecha limite ${this.dateOutputFormat(FechaCierre)}`)
            }
            if (!ContratoFechaDesde) {
                throw new ClientException(`La fecha desde del contrato no puede estar vacía, fecha limite ${this.dateOutputFormat(FechaCierre)}`)
            }
            if (ContratoFechaHasta && ContratoFechaHasta < FechaCierre) {
                throw new ClientException(`La fecha hasta del contrato debe ser mayor a la fecha del último periodo cerrado, fecha limite ${this.dateOutputFormat(FechaCierre)}`)
            }
            createNewContrato = true
        }

        // validacion para cuando es un nuevo registro
        if (!ContratoFechaDesdeOLD && !ContratoFechaHastaOLD) {

            if (ContratoFechaDesde.getTime() <= FechaCierre.getTime()) {
                throw new ClientException(`La  fecha Desde debe ser mayor que la fecha del último periodo cerrado, fecha limite ${this.dateOutputFormat(FechaCierre)}`)
            }
            if (!ContratoFechaDesde) {
                throw new ClientException(`La fecha Desde no puede estar vacía, fecha limite ${this.dateOutputFormat(FechaCierre)}`)
            }
            if (ContratoFechaHasta && ContratoFechaHasta < FechaCierre) {
                throw new ClientException(`La fecha de cierre debe ser igual o mayor a la fecha limit. ${this.dateOutputFormat(FechaCierre)}`)
            }
            createNewContrato = true
        }

        // validacion para no ingresar fecha desde en un periodo ya cerrado
        if (!createNewContrato && ContratoFechaDesdeOLD && ContratoFechaDesdeOLD < FechaCierre) {
            if (ContratoFechaDesdeOLD.getTime() !== ContratoFechaDesde.getTime()) {
                throw new ClientException(`No se puede modificar la fecha desde ya que pertenece a un periodo ya cerrado`);
            }
        }


        // Desde < FecUltPer y Hasta > UltPer, se puede modificar el hasta, pero el nuevo hasta >= UltPer
        if (ContratoFechaDesdeOLD < FechaCierre && (!ContratoFechaHastaOLD || ContratoFechaHastaOLD > FechaCierre)) {

            if (ContratoFechaHasta && ContratoFechaHasta.getTime() < FechaCierre.getTime()) {
                throw new ClientException(`La fecha de cierre debe ser igual o mayor a la fecha limite. ${this.dateOutputFormat(FechaCierre)}`)
            }

        }

        // Desde > FecUltPer, se puede modificar si el nuevo Desde > FecUltPer y no puede quedar vacío
        if (ContratoFechaDesdeOLD > FechaCierre) {
            if (ContratoFechaDesde < FechaCierre) {
                throw new ClientException(`La  fecha Desde debe ser mayor que la fecha del último periodo cerrado, fecha limite ${this.dateOutputFormat(FechaCierre)}`)
            }
            if (!ContratoFechaDesde) {
                throw new ClientException(`La fecha Desde no puede estar vacía, fecha limite ${this.dateOutputFormat(FechaCierre)}`)
            }
        }


        if (ClienteElementoDependienteId != null) {

            //SI EL ELEMENTO DEPENDIENTE ES DIFERENTE NULL SOLO ACTUALIZA TABLAS DE ELEMENTO DEPENDIENTE

            if (ContratoId && !createNewContrato) {
                await queryRunner.query(`UPDATE ClienteElementoDependienteContrato SET ClienteElementoDependienteContratoFechaDesde = @3, ClienteElementoDependienteContratoFechaHasta = @4
                    WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1 AND ClienteElementoDependienteContratoId = @2`,
                    [ClienteId, ClienteElementoDependienteId, ContratoId, ContratoFechaDesde, ContratoFechaHasta])
            } else {
                const resUltNro = await queryRunner.query(`SELECT ClienteElementoDependienteContratoUltNro FROM ClienteElementoDependiente WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1 `, [ClienteId, ClienteElementoDependienteId])
                const ClienteElementoDependienteContratoId = (resUltNro[0]?.ClienteElementoDependienteContratoUltNro) ? resUltNro[0].ClienteElementoDependienteContratoUltNro + 1 : 1
                await queryRunner.query(`INSERT INTO ClienteElementoDependienteContrato (ClienteElementoDependienteContratoId,
                    ClienteId,ClienteElementoDependienteId, ClienteElementoDependienteContratoFechaDesde,ClienteElementoDependienteContratoFechaHasta) VALUES(@0,@1,@2,@3,@4)`,
                    [ClienteElementoDependienteContratoId, ClienteId, ClienteElementoDependienteId, ContratoFechaDesde, ContratoFechaHasta])
                await queryRunner.query(`UPDATE ClienteElementoDependiente SET ClienteElementoDependienteContratoUltNro = @2 WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1`,
                    [ClienteId, ClienteElementoDependienteId, ClienteElementoDependienteContratoId])
            }

        }

        const gao = await queryRunner.query(`SELECT TOP 1 GrupoActividadObjetivoId, GrupoActividadId, GrupoActividadObjetivoDesde, GrupoActividadObjetivoHasta FROM GrupoActividadObjetivo WHERE GrupoActividadObjetivoObjetivoId = @0 ORDER BY GrupoActividadObjetivoDesde DESC`,
            [ObjetivoId, ContratoFechaDesde, ContratoFechaHasta])
        if (gao[0]) {

            //Me fijo si la fecha hasta del Grupo es mayor a la fecha Hasta del contrato
            if (gao[0].GrupoActividadObjetivoHasta == null || gao[0].GrupoActividadObjetivoHasta > ContratoFechaHasta)
                await queryRunner.query(`UPDATE GrupoActividadObjetivo SET GrupoActividadObjetivoHasta = @2  
                , GrupoActividadObjetivoAudFechaMod = @3, GrupoActividadObjetivoAudUsuarioMod = @4, GrupoActividadObjetivoAudIpMod = @5 
                    WHERE GrupoActividadObjetivoId=@0 AND GrupoActividadId=@1 AND GrupoActividadObjetivoHasta > @2 AND GrupoActividadObjetivoDesde <= @2`, [gao[0].GrupoActividadObjetivoId, gao[0].GrupoActividadId, ContratoFechaHasta, now, usuario, ip])
            else if (gao[0].GrupoActividadObjetivoHasta < ContratoFechaHasta || !ContratoFechaHasta) { //Esta sin grupo vigente
                const FechaCierreNueva = new Date(FechaCierre)
                FechaCierreNueva.setDate(FechaCierreNueva.getDate() + 1)

                const GrupoActividadObjetivoHastaNueva = new Date(gao[0].GrupoActividadObjetivoHasta)
                GrupoActividadObjetivoHastaNueva.setDate(GrupoActividadObjetivoHastaNueva.getDate() + 1)

                const DesdeMax: Date = new Date(Math.max(GrupoActividadObjetivoHastaNueva.getTime(), ContratoFechaDesde.getTime(), FechaCierreNueva.getTime()))
                if (DesdeMax < ContratoFechaHasta || !ContratoFechaHasta) {

                    const GrupoActividadObjetivoUltNro = await queryRunner.query(`SELECT GrupoActividadObjetivoUltNro FROM GrupoActividad WHERE GrupoActividadId = @0`, [gao[0].GrupoActividadId])
                    const GrupoActividadObjetivoIdNew = GrupoActividadObjetivoUltNro[0].GrupoActividadObjetivoUltNro + 1;


                    await queryRunner.query(`INSERT INTO GrupoActividadObjetivo (
                    GrupoActividadObjetivoId,
                    GrupoActividadId,
                    GrupoActividadObjetivoObjetivoId,
                    GrupoActividadObjetivoDesde,
                    GrupoActividadObjetivoAudIpIng,GrupoActividadObjetivoAudUsuarioIng,GrupoActividadObjetivoAudFechaIng,
                    GrupoActividadObjetivoAudIpMod,GrupoActividadObjetivoAudUsuarioMod,GrupoActividadObjetivoAudFechaMod
                    ) VALUES (@0,@1,@2,@3, @4,@5,@6,@4,@5,@6)`,
                        [GrupoActividadObjetivoIdNew,
                            gao[0].GrupoActividadId,
                            ObjetivoId,
                            DesdeMax,
                            ip, usuario, now
                        ])
                    await queryRunner.query(`
                        UPDATE GrupoActividad SET GrupoActividadObjetivoUltNro = @0 
                        , GrupoActividadAudFechaMod = @2, GrupoActividadAudUsuarioMod = @3, GrupoActividadAudIpMod = @4
                        WHERE GrupoActividadId = @1`, [GrupoActividadObjetivoIdNew, gao[0].GrupoActividadId, now, usuario, ip])
                }
            }
        }

        return true
    }

    async grupoActividad(queryRunner: any, infoActividad: any, GrupoActividadObjetivoObjetivoId: number, ip: any, usuarioId: number, usuario: string) {

        const now = new Date();

        const cierre = await queryRunner.query(`SELECT TOP 1 *, EOMONTH(DATEFROMPARTS(anio, mes, 1)) AS FechaCierre FROM lige.dbo.liqmaperiodo WHERE ind_recibos_generados = 1 ORDER BY anio DESC, mes DESC `)
        const FechaCierre = new Date(cierre[0].FechaCierre);


        let GrupoActividadObjetivoDesde = new Date(infoActividad[0].GrupoActividadObjetivoDesde)
        GrupoActividadObjetivoDesde.setHours(0, 0, 0, 0)

        //        throw new ClientException('Fecha GrupoActividadObjetivoDesde',GrupoActividadObjetivoDesde)

        const gao = await queryRunner.query(`
            SELECT gao.GrupoActividadObjetivoId, gao.GrupoActividadObjetivoObjetivoId, gao.GrupoActividadObjetivoDesde, gao.GrupoActividadObjetivoHasta
            FROM GrupoActividadObjetivo gao WHERE gao.GrupoActividadObjetivoObjetivoId = @0 AND ISNULL(gao.GrupoActividadObjetivoHasta,'9999-12-31') >= @1 AND gao.GrupoActividadObjetivoDesde<=@1 `,
            [infoActividad[0].GrupoActividadObjetivoObjetivoId, now]
        )

        if (gao.length && infoActividad[0].GrupoActividadId != infoActividad[0].GrupoActividadOriginal && gao[0].GrupoActividadObjetivoDesde > GrupoActividadObjetivoDesde) {
            throw new ClientException(`La fecha Desde no puede ser menor a ${this.dateOutputFormat(gao[0].GrupoActividadObjetivoDesde)}`)
        }
        if (GrupoActividadObjetivoDesde != infoActividad[0].GrupoActividadObjetivoDesdeOriginal && GrupoActividadObjetivoDesde <= FechaCierre) {
            throw new ClientException(`La  fecha Desde debe ser mayor que la fecha del último periodo cerrado, fecha limite ${this.dateOutputFormat(FechaCierre)}`)
        }
        // Restar un día a la fecha

        const nuevoHasta = new Date(GrupoActividadObjetivoDesde)
        nuevoHasta.setDate(nuevoHasta.getDate() - 1)

        if (infoActividad[0].GrupoActividadId != infoActividad[0].GrupoActividadOriginal) {
            await queryRunner.query(`DELETE FROM GrupoActividadObjetivo 
                WHERE  GrupoActividadObjetivoObjetivoId = @0 AND GrupoActividadObjetivoDesde > @1`,
                [GrupoActividadObjetivoObjetivoId, nuevoHasta])

            await queryRunner.query(`UPDATE GrupoActividadObjetivo SET GrupoActividadObjetivoHasta = @1, GrupoActividadObjetivoAudFechaMod = @2, GrupoActividadObjetivoAudUsuarioMod = @3, GrupoActividadObjetivoAudIpMod = @4
                WHERE  GrupoActividadObjetivoObjetivoId = @0 AND ISNULL(GrupoActividadObjetivoHasta,'9999-12-31') > @1 AND GrupoActividadObjetivoDesde <= @1`,
                [GrupoActividadObjetivoObjetivoId, nuevoHasta, now, usuario, ip])

            const GrupoActividadObjetivoUltNro = await queryRunner.query(`SELECT GrupoActividadObjetivoUltNro FROM GrupoActividad WHERE GrupoActividadId = @0`, [infoActividad[0].GrupoActividadId])
            const GrupoActividadObjetivoIdNew = GrupoActividadObjetivoUltNro[0].GrupoActividadObjetivoUltNro + 1;

            await queryRunner.query(`INSERT INTO GrupoActividadObjetivo (
            GrupoActividadObjetivoId,
            GrupoActividadId,
            GrupoActividadObjetivoObjetivoId,
            GrupoActividadObjetivoDesde,
            GrupoActividadObjetivoAudIpIng,GrupoActividadObjetivoAudUsuarioIng,GrupoActividadObjetivoAudFechaIng,
            GrupoActividadObjetivoAudIpMod,GrupoActividadObjetivoAudUsuarioMod,GrupoActividadObjetivoAudFechaMod
            ) VALUES (@0,@1,@2,@3, @4,@5,@6,@4,@5,@6)`,
                [GrupoActividadObjetivoIdNew,
                    infoActividad[0].GrupoActividadId,
                    GrupoActividadObjetivoObjetivoId,
                    GrupoActividadObjetivoDesde,
                    ip,
                    usuario,
                    now])

            await queryRunner.query(`
                UPDATE GrupoActividad SET GrupoActividadObjetivoUltNro = @0 
                , GrupoActividadAudFechaMod = @2, GrupoActividadAudUsuarioMod = @3, GrupoActividadAudIpMod = @4
                WHERE GrupoActividadId = @1
            `, [GrupoActividadObjetivoIdNew, infoActividad[0].GrupoActividadId, now, usuario, ip])
        } else if (GrupoActividadObjetivoDesde != infoActividad[0].GrupoActividadObjetivoDesdeOriginal) {
            await queryRunner.query(`
            UPDATE GrupoActividadObjetivo SET
            GrupoActividadObjetivoDesde = @3, GrupoActividadObjetivoAudIpMod = @4, GrupoActividadObjetivoAudUsuarioMod = @5, GrupoActividadObjetivoAudFechaMod = @6
            WHERE  GrupoActividadObjetivoId = @0 AND GrupoActividadObjetivoObjetivoId = @1 AND GrupoActividadId = @2 AND ISNULL(GrupoActividadObjetivoHasta,'9999-12-31') > @3
            `, [
                infoActividad[0].GrupoActividadObjetivoId, GrupoActividadObjetivoObjetivoId,
                infoActividad[0].GrupoActividadOriginal, GrupoActividadObjetivoDesde,
                ip, usuario, now
            ])
        }
    }


    async updateObjetivo(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();

        try {
            const usuario = res.locals.userName
            const usuarioId = res.locals.userName
            const ip = this.getRemoteAddress(req)
            const ObjetivoId = Number(req.params.id)
            const Obj = { ...req.body }
            const infoActividad = { ...Obj.infoActividad }
            let ObjObjetivoNew = { infoDocRequerido: [], infoCoordinadorCuenta: {}, infoActividad: [], ClienteElementoDependienteId: 0, ClienteId: 0, DomicilioId: 0 }

            const now = new Date();
            //throw new ClientException(`test.`)
            //validaciones
            await queryRunner.startTransaction()

            await this.FormValidations(Obj)

            ObjObjetivoNew.ClienteElementoDependienteId = Obj.ClienteElementoDependienteId
            ObjObjetivoNew.ClienteId = Obj.ClienteId

            //validacion de barrio
            // if (Obj.DomicilioProvinciaId && Obj.DomicilioLocalidadId && !Obj.DomicilioBarrioId) {

            //     let queryBarrio = await queryRunner.query(`SELECT BarrioId,ProvinciaId,LocalidadId,BarrioDescripcion FROM Barrio WHERE PaisId = 1 AND ProvinciaId = @0 AND LocalidadId = @1`,
            //         [Obj.DomicilioProvinciaId, Obj.DomicilioLocalidadId])

            //     if (queryBarrio && queryBarrio.length > 0)
            //         throw new ClientException(`Debe completar el campo barrio.`)

            // }

            if (infoActividad[0].GrupoActividadOriginal != infoActividad[0].GrupoActividadId || infoActividad[0].GrupoActividadObjetivoDesdeOriginal != infoActividad[0].GrupoActividadObjetivoDesde) {
                await this.grupoActividad(queryRunner, Obj.infoActividad, ObjetivoId, ip, usuarioId, usuario)
            }


            await this.validateDateAndCreateContrato(queryRunner, Obj.ContratoFechaDesde, Obj.ContratoFechaDesdeOLD, Obj.ContratoFechaHasta, Obj.ContratoFechaHastaOLD, Obj.FechaModificada, Obj.ClienteId, Obj.ClienteElementoDependienteId, ObjetivoId, Obj.ContratoId, ip, usuarioId, usuario)
            //update
            const grupoactividad = await this.getGrupoActividad(queryRunner, ObjetivoId, Obj.ClienteId, Obj.ClienteElementoDependienteId)
            ObjObjetivoNew.infoActividad[0] = grupoactividad[0]
            ObjObjetivoNew.infoActividad[0].GrupoActividadOriginal = ObjObjetivoNew.infoActividad[0].GrupoActividadId
            ObjObjetivoNew.infoActividad[0].GrupoActividadObjetivoDesdeOriginal = ObjObjetivoNew.infoActividad[0].GrupoActividadObjetivoDesde

            if ((!Obj.ContratoFechaHasta && ObjObjetivoNew.infoActividad[0].GrupoActividadObjetivoHasta) || (Obj.ContratoFechaHasta > ObjObjetivoNew.infoActividad[0].GrupoActividadObjetivoHasta)) {
                await queryRunner.query(`UPDATE GrupoActividadObjetivo SET GrupoActividadObjetivoHasta = @2, 
                    GrupoActividadObjetivoAudFechaMod = @3, GrupoActividadObjetivoAudUsuarioMod = @4, GrupoActividadObjetivoAudIpMod = @5
                    WHERE GrupoActividadObjetivoId=@0 AND GrupoActividadId=@1
                    `, [ObjObjetivoNew.infoActividad[0].GrupoActividadObjetivoId, ObjObjetivoNew.infoActividad[0].GrupoActividadId, Obj.ContratoFechaHasta, now, usuario, ip])
            }


            if (Obj.ClienteElementoDependienteId != null && Obj.ClienteElementoDependienteId != "null") {
                //SI EL ELEMENTO DEPENDIENTE ES DIFERENTE NULL SOLO ACTUALIZA TABLAS DE ELEMENTO DEPENDIENTE
                if (Obj.DireccionModificada) {

                    await this.addElementoDependienteDomicilio(
                        queryRunner
                        , Obj.ClienteId
                        , Obj.ClienteElementoDependienteId
                        , Obj.DomicilioDomLugar
                        , Obj.DomicilioDomCalle
                        , Obj.DomicilioDomNro
                        , Obj.DomicilioCodigoPostal
                        , Obj.DomicilioProvinciaId
                        , Obj.DomicilioLocalidadId
                        , Obj.DomicilioBarrioId
                    )

                }

                await this.updateClienteElementoDependienteTable(queryRunner, Obj.ClienteId, Obj.ClienteElementoDependienteId, Obj.Descripcion, Obj.SucursalId, Obj.CoberturaServicio)
                await this.updateObjetivoTable(queryRunner, Obj.ClienteId, Obj.ClienteElementoDependienteId, Obj.Descripcion)



            } else {
                throw new ClientException('El objetivo no puede ser un cliente')
            }


            ObjObjetivoNew.infoCoordinadorCuenta = await this.ObjetivoCoordinador(queryRunner, Obj.infoCoordinadorCuenta, ObjetivoId)
            await this.ObjetivoRubro(queryRunner, Obj.rubrosCliente, Obj.ClienteId, Obj.ClienteElementoDependienteId)
            await this.ObjetivoDocRequerido(queryRunner, Obj.docsRequerido, Obj.ClienteId, Obj.ClienteElementoDependienteId, usuario, ip)

            await this.setObjetivoHabilitacionNecesaria(queryRunner, ObjetivoId, Obj.habilitacion, usuario, ip)

            if (Obj.files?.length > 0) {
                for (const file of Obj.files) {
                    let denDocumento = Obj.ClienteId + '/' + Obj.ClienteElementoDependienteId
                    await FileUploadController.handleDOCUpload(null, ObjetivoId, null, null, new Date(), null, denDocumento, null, null, file, usuario, ip, queryRunner)
                }
            }

            if (Obj.ClienteId !== Obj.clienteOld) {
                let infoMaxClienteElementoDependiente = await queryRunner.query(`SELECT ClienteElementoDependienteUltNro AS ClienteElementoDependienteUltNro FROM Cliente WHERE ClienteId = @0`, [Number(Obj.ClienteId)])
                let { ClienteElementoDependienteUltNro } = infoMaxClienteElementoDependiente[0]
                ClienteElementoDependienteUltNro = ClienteElementoDependienteUltNro == null ? 1 : ClienteElementoDependienteUltNro + 1


                await this.insertClienteElementoDependienteSql(queryRunner, Number(Obj.ClienteId), ClienteElementoDependienteUltNro, Obj.Descripcion, Obj.SucursalId, Obj.CoberturaServicio)

                //ClienteElementoDependienteContrato
                await queryRunner.query(`UPDATE ClienteElementoDependienteContrato SET ClienteId = @2, ClienteElementoDependienteId = @3  WHERE  ClienteId = @0 AND ClienteElementoDependienteId = @1`,
                    [Obj.clienteOld, Obj.ClienteElementoDependienteId, Obj.ClienteId, ClienteElementoDependienteUltNro])

                //ClienteEleDepRubro

                await queryRunner.query(`UPDATE ClienteEleDepRubro SET ClienteId = @2, ClienteElementoDependienteId = @3  WHERE  ClienteId = @0 AND ClienteElementoDependienteId = @1`,
                    [Obj.clienteOld, Obj.ClienteElementoDependienteId, Obj.ClienteId, ClienteElementoDependienteUltNro])


                //objetivo 
                // await this.deleteObjetivoQuery(queryRunner,Number(Obj.ObjetivoId),Number(Obj.ClienteId))
                // await this.insertObjetivoSql(queryRunner,Number(Obj.ClienteId),Obj.Descripcion,ClienteElementoDependienteUltNro,Obj.SucursalId)

                await queryRunner.query(`UPDATE Objetivo SET ClienteId = @0, ObjetivoDescripcion = @1, ClienteElementoDependienteId = @2 WHERE ObjetivoId = @3`,
                    [Obj.ClienteId, Obj.Descripcion, ClienteElementoDependienteUltNro, Obj.ObjetivoId])

                //objetivopersonal jerarquico
                //se modifico objetivo no es necesario modificar el personal jerarquico

                // cliente
                await this.updateCliente(queryRunner, Number(Obj.ClienteId), ClienteElementoDependienteUltNro)
                await this.deleteClienteElementoDependienteQuery(queryRunner, Number(Obj.clienteOld), Number(Obj.ClienteElementoDependienteId))






                ObjObjetivoNew.ClienteElementoDependienteId = ClienteElementoDependienteUltNro
                ObjObjetivoNew.ClienteId = Obj.ClienteId
            }
            await queryRunner.commitTransaction()

            return this.jsonRes(ObjObjetivoNew, res, 'Modificación  Exitosa');
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async ObjetivoCoordinador(queryRunner: QueryRunner, Coordinadores: any[], ObjetivoId: number) {
        const Fecha = new Date()
        const fechaAyer = new Date()
        Fecha.setHours(0, 0, 0, 0)
        fechaAyer.setDate(fechaAyer.getDate() - 1);
        fechaAyer.setHours(0, 0, 0, 0)
        const coordinadoresActuales = await this.getCoordinadorCuentaQuery(queryRunner, ObjetivoId)
        for (const old of coordinadoresActuales) {
            const nuevo = Coordinadores.find((r: any) => (r.PersonalId == old.PersonalId))
            if (nuevo?.ObjetivoPersonalJerarquicoComision != old.ObjetivoPersonalJerarquicoComision || nuevo?.ObjetivoPersonalJerarquicoDescuentos != old.ObjetivoPersonalJerarquicoDescuentos || nuevo?.ObjetivoPersonalJerarquicoSeDescuentaTelefono != old.ObjetivoPersonalJerarquicoSeDescuentaTelefono) {
                await queryRunner.query(`UPDATE ObjetivoPersonalJerarquico SET ObjetivoPersonalJerarquicoHasta = @2
                WHERE ObjetivoPersonalJerarquicoPersonalId = @0 AND ObjetivoId = @1 AND ISNULL(ObjetivoPersonalJerarquicoHasta,'9999-12-31') >= @3`,
                    [old.PersonalId, ObjetivoId, fechaAyer, Fecha])
                await queryRunner.query(`DELETE ObjetivoPersonalJerarquico WHERE ObjetivoPersonalJerarquicoPersonalId = @0 AND ObjetivoId = @1  AND ISNULL(ObjetivoPersonalJerarquicoHasta,'9999-12-31') < ObjetivoPersonalJerarquicoDesde`,
                    [old.PersonalId, ObjetivoId])

                if (nuevo?.PersonalId) {
                    await queryRunner.query(`INSERT INTO ObjetivoPersonalJerarquico (ObjetivoId,ObjetivoPersonalJerarquicoPersonalId,
                        ObjetivoPersonalJerarquicoDesde,ObjetivoPersonalJerarquicoHasta,ObjetivoPersonalJerarquicoComision,
                        ObjetivoPersonalJerarquicoDescuentos, ObjetivoPersonalJerarquicoSeDescuentaTelefono) VALUES (@0, @1,@2,@3,@4,@5,@6); `,
                        [ObjetivoId, nuevo.PersonalId, Fecha, null, nuevo.ObjetivoPersonalJerarquicoComision, nuevo.ObjetivoPersonalJerarquicoDescuentos, nuevo.ObjetivoPersonalJerarquicoSeDescuentaTelefono])
                }
            }
        }

        const newPesonalIds = coordinadoresActuales.map(item => item.PersonalId);
        const nuevos = Coordinadores.filter(item => !newPesonalIds.includes(item.PersonalId));
        for (const nuevo of nuevos) {
            if (!nuevo.PersonalId) continue
            await queryRunner.query(` INSERT INTO ObjetivoPersonalJerarquico (ObjetivoId,ObjetivoPersonalJerarquicoPersonalId,
                ObjetivoPersonalJerarquicoDesde,ObjetivoPersonalJerarquicoHasta,ObjetivoPersonalJerarquicoComision,
                ObjetivoPersonalJerarquicoDescuentos, ObjetivoPersonalJerarquicoSeDescuentaTelefono) VALUES (@0, @1,@2,@3,@4,@5,@6); `,
                [ObjetivoId, nuevo.PersonalId, Fecha, null, nuevo.ObjetivoPersonalJerarquicoComision, nuevo.ObjetivoPersonalJerarquicoDescuentos, nuevo.ObjetivoPersonalJerarquicoSeDescuentaTelefono])
        }
        return await this.getCoordinadorCuentaQuery(queryRunner, ObjetivoId)
    }

    async ObjetivoRubro(queryRunner: any, rubros: any, ClienteId: any, ClienteElementoDependienteId: any) {
        //Compruebo si hubo cambios
        let cambios: boolean = false

        const rubrosOld = await this.getRubroQuery(queryRunner, ClienteId, ClienteElementoDependienteId)

        if (rubros.length != rubrosOld.length)
            cambios = true
        else
            rubrosOld.forEach((rub: any, index: number) => {
                if (rubros.find(r => rub != r)) {
                    cambios = true
                }
            });
        if (!cambios) return


        //Actualizo
        if (rubros.length > 0)
            await queryRunner.query(`DELETE FROM ClienteEleDepRubro WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1`, [ClienteId, ClienteElementoDependienteId])

        let RubroUltNro = 0

        for (const RubroId of rubros) {
            RubroUltNro++
            await queryRunner.query(`
            INSERT INTO ClienteEleDepRubro (ClienteElementoDependienteRubroId,ClienteId,ClienteElementoDependienteId, ClienteElementoDependienteRubroClienteId )
            VALUES (@0, @1, @2, @3)`,
                [RubroUltNro, ClienteId, ClienteElementoDependienteId, RubroId])
        }
        if (ClienteElementoDependienteId != null && ClienteElementoDependienteId != "null") {
            await queryRunner.query(`
            UPDATE ClienteElementoDependiente
            SET ClienteElementoDependienteRubroUltNro = @2
            WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1`,
                [ClienteId, ClienteElementoDependienteId, RubroUltNro])
        } else {
            await queryRunner.query(`
            UPDATE Cliente
            SET ClienteRubroUltNro = @1
            WHERE ClienteId = @0`,
                [ClienteId, RubroUltNro])

        }
    }

    async ObjetivoDocRequerido(queryRunner: any, docsRequeridos: any, ClienteId: any, ClienteElementoDependienteId: any, usuario: string, ip: string) {
        //Compruebo si hubo cambios
        let cambios: boolean = false

        const docsRequeridosOld = await this.getDocRequeridoQuery(queryRunner, ClienteId, ClienteElementoDependienteId)

        if (docsRequeridos.length != docsRequeridosOld.length)
            cambios = true
        else
            docsRequeridosOld.forEach((rub: any, index: number) => {
                if (docsRequeridos.find(r => rub != r)) {
                    cambios = true
                }
            });
        if (!cambios) return

        // Validar duplicados
        const duplicados = docsRequeridos.filter((codigo, index) => docsRequeridos.indexOf(codigo) !== index);
        if (duplicados.length > 0) throw new ClientException('No se pueden tener documentos requeridos duplicados')

        await queryRunner.query(`DELETE FROM ClienteElementoDependienteDocRequerido WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1`, [ClienteId, ClienteElementoDependienteId])

        const now: Date = new Date()
        for (const DocumentoTipoCodigo of docsRequeridos) {
            await queryRunner.query(`
            INSERT INTO ClienteElementoDependienteDocRequerido (ClienteId, ClienteElementoDependienteId, DocumentoTipoCodigo, AudFechaIng, AudUsuarioIng, AudIpIng, AudFechaMod, AudUsuarioMod, AudIpMod )
            VALUES (@0,@1,@2,@3,@4,@5,@3,@4,@5)`, [ClienteId, ClienteElementoDependienteId, DocumentoTipoCodigo, now, usuario, ip])
        }
    }

    async updateClienteElementoDependienteTable(
        queryRunner: any,
        ClienteId: number,
        ClienteElementoDependienteId: any,
        ClienteElementoDependienteDescripcion: any,
        ClienteElementoDependienteSucursalId: any,
        CoberturaServicio: any,
    ) {

        return await queryRunner.query(`
            UPDATE ClienteElementoDependiente
            SET ClienteElementoDependienteSucursalId = @2, ClienteElementoDependienteDescripcion = @3, CoberturaServicio = @4
            WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1 `,
            [ClienteId, ClienteElementoDependienteId, ClienteElementoDependienteSucursalId, ClienteElementoDependienteDescripcion, CoberturaServicio])
    }

    async updateObjetivoTable(
        queryRunner: any,
        ClienteId: number,
        ClienteElementoDependienteId: any,
        ObjetivoDescripcion: any,
    ) {
        return await queryRunner.query(`
            UPDATE Objetivo
            SET ObjetivoDescripcion = @2
            WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1 `,
            [ClienteId, ClienteElementoDependienteId, ObjetivoDescripcion])
    }

    async updateClienteTable(
        queryRunner: any,
        ClienteId: number,
        SucursalId: any,
        SucursalDescripcion: any
    ) {

        return await queryRunner.query(`
            UPDATE Cliente
            SET ClienteSucursalId = @1, ClienteNombreFantasia = @2
            WHERE ClienteId = @0 `,
            [ClienteId, SucursalId, SucursalDescripcion])
    }

    async FormValidations(form: any) {


        if (!form.ClienteId) {
            throw new ClientException(`Debe completar el campo Cliente.`)
        }

        if (!form.Descripcion) {
            throw new ClientException(`Debe completar el campo  Descripcion.`)
        }

        if (!form.SucursalId) {
            throw new ClientException(`Debe completar el campo Sucursal.`)
        }



        // if(!form.ContratoFechaHasta) {
        //     throw new ClientException(`El campo Contrato Hasta NO pueden estar vacio.`)
        //  }

        //Domicilio

        if (!form.DomicilioDomCalle) {
            throw new ClientException(`Debe completar el campo Dirección Calle.`)
        }

        if (!form.DomicilioDomNro) {
            throw new ClientException(`Debe completar el campo Nro.`)
        }

        if (form.DomicilioDomNro.length > 5) {
            throw new ClientException(`El campo Domicilio Nro NO puede ser mayor a 5 digitos.`)
        }

        if (!form.DomicilioCodigoPostal) {
            throw new ClientException(`Debe completar el campo Cod Postal.`)
        }

        if (form.DomicilioCodigoPostal.length > 8) {
            throw new ClientException(`El campo Cod Postal NO puede ser mayor a 8 digitos.`)
        }

        if (!form.DomicilioProvinciaId) {
            throw new ClientException(`Debe completar el campo Provincia.`)
        }

        if (!form.DomicilioLocalidadId) {
            throw new ClientException(`Debe completar el campo Localidad.`)
        }





        // Coordinador de cuenta

        for (const obj of form.infoCoordinadorCuenta) {
            if (!obj.PersonalId && obj.ObjetivoPersonalJerarquicoComision && obj.ObjetivoPersonalJerarquicoDescuentos) {
                throw new ClientException(`Debe completar el campo Persona en Coordinador de cuenta.`)
            }

        }

        // Rubro
        if (!form.rubrosCliente || !form.rubrosCliente.length) {
            throw new ClientException(`Debe selecionar al menos un Rubro.`)
        }

        // Documentos requeridos a presentar
        if (!form.docsRequerido || !form.docsRequerido.length) {
            throw new ClientException('Debe de tener al menos un Documento requerido a presentar')
        }

        //Grupo Actividad
        for (const obj of form.infoActividad) {
            if (!obj.GrupoActividadId) {
                throw new ClientException(`Debe completar el campo Actividad.`)
            }
            if (!obj.GrupoActividadObjetivoDesde) {
                throw new ClientException(`Debe completar el campo Fecha Desde de Grupo Actividad.`)
            }
        }

        //Habilitacion nesesaria
        if (!form.habilitacion || !form.habilitacion.length) {
            throw new ClientException(`Debe selecionar al menos un lugar de habilitación.`)
        }


    }

    async deleteObjetivo(req: Request, res: Response, next: NextFunction) {

        const { ClienteId, ObjetivoId, ClienteElementoDependienteId, DomicilioId, ContratoId } = req.query
        const queryRunner = dataSource.createQueryRunner();

        try {
            if (!ClienteElementoDependienteId || !ClienteId || !ObjetivoId)
                throw new ClientException("Debe seleccionar un Objetivo")


            await queryRunner.connect();
            await queryRunner.startTransaction();

            const horasAsistencia = await queryRunner.query(`SELECT SUM(
                    ((ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias1Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias1Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias2Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias2Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias3Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias3Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias4Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias4Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias5Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias5Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias6Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias6Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias7Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias7Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias8Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias8Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias9Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias9Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias10Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias10Gral),2) AS INT),0)+

                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias11Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias11Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias12Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias12Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias13Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias13Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias14Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias14Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias15Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias15Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias16Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias16Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias17Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias17Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias18Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias18Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias19Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias19Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias20Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias20Gral),2) AS INT),0)+

                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias21Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias21Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias22Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias22Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias23Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias23Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias24Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias24Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias25Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias25Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias26Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias26Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias27Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias27Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias28Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias28Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias29Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias29Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias30Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias30Gral),2) AS INT),0)+
                    ISNULL(CAST(LEFT(objp.ObjetivoAsistenciaAnoMesPersonalDias31Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias31Gral),2) AS INT),0) 
                    ) / CAST(60 AS FLOAT))
                    ) AS totalHorasGlobal

                    FROM ObjetivoAsistenciaAnoMesPersonalDias objp
                    WHERE objp.ObjetivoId = @0
                    `, [Number(ObjetivoId)])

            if (horasAsistencia[0].totalHorasGlobal > 0) throw new ClientException(`No se puede eliminar el objetivo porque tiene horas de asistencia cargadas. Horas Cargadas Totales: ${horasAsistencia[0].totalHorasGlobal}`)

            const documentosAsociados = await queryRunner.query(`SELECT COUNT(*) AS totalDocumentos FROM Documento WHERE ObjetivoId = @0`, [Number(ObjetivoId)])
            if (documentosAsociados[0].totalDocumentos > 0) throw new ClientException(`No se puede eliminar el objetivo porque tiene documentos asociados. Cantidad de Documentos Asociados: ${documentosAsociados[0].totalDocumentos}`)

            await this.deletePersonalJerarquicoQuery(queryRunner, Number(ObjetivoId))
            await this.deleteGrupoActividadQuery(queryRunner, Number(ObjetivoId))

            await this.deleteClienteElementoDependienteDomicilioQuery(queryRunner, Number(ClienteId), Number(ClienteElementoDependienteId))
            await this.deleteClienteElementoDependienteContratoQuery(queryRunner, Number(ClienteId), Number(ClienteElementoDependienteId))
            await this.deleteClienteEleDepRubroQuery(queryRunner, Number(ClienteId), Number(ClienteElementoDependienteId))
            await this.deleteClienteElementoDependienteDocRequeridoQuery(queryRunner, Number(ClienteId), Number(ClienteElementoDependienteId))
            await this.deleteHabilitacionNecesariaObjetivoQuery(queryRunner, Number(ObjetivoId))

            await this.deleteObjetivoQuery(queryRunner, Number(ObjetivoId), Number(ClienteId))
            await this.deleteClienteElementoDependienteQuery(queryRunner, Number(ClienteId), Number(ClienteElementoDependienteId))

            await queryRunner.commitTransaction();

            return this.jsonRes({}, res, 'Eliminación Exitosa');

        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        }

    }

    async deleteObjetivoQuery(queryRunner: any, ObjetivoId: number, ClienteId: number) {

        return await queryRunner.query(`DELETE FROM objetivo WHERE ObjetivoId = @0 AND ClienteId = @1;`,
            [ObjetivoId, ClienteId])
    }

    async deleteClienteElementoDependienteQuery(queryRunner: any, ClienteId: number, ClienteElementoDependienteId: number) {

        return await queryRunner.query(`DELETE FROM ClienteElementoDependiente WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1;`,
            [ClienteId, ClienteElementoDependienteId])
    }

    async deleteClienteElementoDependienteDomicilioQuery(queryRunner: any, ClienteId: number, ClienteElementoDependienteId: number) {
        await queryRunner.query(`DELETE FROM NexoDomicilio WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1`, [ClienteId, ClienteElementoDependienteId])
        await queryRunner.query(`DELETE dom FROM Domicilio dom  JOIN NexoDomicilio nex ON nex.DomicilioId=dom.DomicilioId AND nex.ClienteId=@0 AND nex.ClienteElementoDependienteId = @1`, [ClienteId, ClienteElementoDependienteId])
    }

    async deleteClienteElementoDependienteContratoQuery(queryRunner: any, ClienteId: number, ClienteElementoDependienteId: number) {
        return await queryRunner.query(`DELETE FROM ClienteElementoDependienteContrato  WHERE ClienteId = @0 AND ClienteElementoDependienteId = @1 `,
            [ClienteId, ClienteElementoDependienteId])
    }

    async deleteClienteEleDepRubroQuery(queryRunner: any, ClienteId: number, ClienteElementoDependienteId: number) {

        return await queryRunner.query(`DELETE FROM ClienteEleDepRubro  WHERE 
             ClienteId = @0
             AND ClienteElementoDependienteId = @1`,
            [ClienteId, ClienteElementoDependienteId])
    }

    async deleteClienteElementoDependienteDocRequeridoQuery(queryRunner: any, ClienteId: number, ClienteElementoDependienteId: number) {

        return await queryRunner.query(`DELETE FROM ClienteElementoDependienteDocRequerido  WHERE 
             ClienteId = @0
             AND ClienteElementoDependienteId = @1`,
            [ClienteId, ClienteElementoDependienteId])
    }

    async deletePersonalJerarquicoQuery(queryRunner: any, ObjetivoId: number) {
        return await queryRunner.query(`DELETE FROM ObjetivoPersonalJerarquico WHERE ObjetivoId = @0`, [ObjetivoId])
    }

    async deleteGrupoActividadQuery(queryRunner: any, ObjetivoId: number) {
        return await queryRunner.query(`DELETE FROM GrupoActividadObjetivo WHERE GrupoActividadObjetivoObjetivoId = @0`, [ObjetivoId])
    }

    async deleteHabilitacionNecesariaObjetivoQuery(queryRunner: any, ObjetivoId: number) {
        return await queryRunner.query(`DELETE FROM ObjetivoHabilitacionNecesaria WHERE ObjetivoId = @0`, [ObjetivoId])
    }

    async addObjetivo(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();
        const Obj = { ...req.body };
        const infoActividad = { ...Obj.infoActividad }
        let ObjObjetivoNew = { ClienteId: 0, id: 0, ClienteElementoDependienteId: 0, infoCoordinadorCuenta: {}, infoActividad: [] }
        try {

            const usuario = res.locals.userName
            const usuarioId = res.locals.PersonalId
            const ip = this.getRemoteAddress(req)

            ObjObjetivoNew.ClienteId = Obj.ClienteId
            //validaciones
            await queryRunner.startTransaction()

            await this.FormValidations(Obj)

            // //validacion de barrio
            // if (Obj.DomicilioProvinciaId && Obj.DomicilioLocalidadId && !Obj.DomicilioBarrioId) {

            //     let queryBarrio = await queryRunner.query(`SELECT BarrioId,ProvinciaId,LocalidadId,BarrioDescripcion FROM Barrio WHERE PaisId = 1 AND ProvinciaId = @0 AND LocalidadId = @1`,
            //         [Obj.DomicilioProvinciaId, Obj.DomicilioLocalidadId])

            //     if (queryBarrio && queryBarrio.length > 0)
            //         throw new ClientException(`Debe completar el campo barrio.`)

            // }

            //throw new ClientException(`test`)


            let infoMaxClienteElementoDependiente = await queryRunner.query(`SELECT ClienteElementoDependienteUltNro AS ClienteElementoDependienteUltNro FROM Cliente WHERE ClienteId = @0`, [Number(Obj.ClienteId)])
            let { ClienteElementoDependienteUltNro } = infoMaxClienteElementoDependiente[0]
            ClienteElementoDependienteUltNro = ClienteElementoDependienteUltNro == null ? 1 : ClienteElementoDependienteUltNro + 1

            //Agrego los valores al objeto original para retornar
            ObjObjetivoNew.ClienteElementoDependienteId = ClienteElementoDependienteUltNro
            Obj.ClienteElementoDependienteId = ClienteElementoDependienteUltNro


            await this.insertClienteElementoDependienteSql(queryRunner, Number(Obj.ClienteId), ClienteElementoDependienteUltNro, Obj.Descripcion, Obj.SucursalId, Obj.CoberturaServicio)
            await this.updateCliente(queryRunner, Number(Obj.ClienteId), ClienteElementoDependienteUltNro)
            await this.addElementoDependienteDomicilio(queryRunner, Obj.ClienteId, ClienteElementoDependienteUltNro, Obj.DomicilioDomLugar, Obj.DomicilioDomCalle, Obj.DomicilioDomNro,
                Obj.DomicilioCodigoPostal, Obj.DomicilioProvinciaId, Obj.DomicilioLocalidadId, Obj.DomicilioBarrioId)

            //await this.ClienteElementoDependienteContrato(queryRunner,Number(Obj.ClienteId),ClienteElementoDependienteUltNro,Obj.ContratoFechaDesde,Obj.ContratoFechaHasta)
            await this.insertObjetivoSql(queryRunner, Number(Obj.ClienteId), Obj.Descripcion, ClienteElementoDependienteUltNro, Obj.SucursalId)

            let infoMaxObjetivo = await queryRunner.query(`SELECT IDENT_CURRENT('Objetivo')`)
            const ObjetivoId = infoMaxObjetivo[0]['']

            await this.validateDateAndCreateContrato(queryRunner, Obj.ContratoFechaDesde, Obj.ContratoFechaDesdeOLD, Obj.ContratoFechaHasta, Obj.ContratoFechaHastaOLD, Obj.FechaModificada, Obj.ClienteId, Obj.ClienteElementoDependienteId, ObjetivoId, Obj.ContratoId, ip, usuarioId, usuario)

            ObjObjetivoNew.id = ObjetivoId


            ObjObjetivoNew.infoCoordinadorCuenta = await this.ObjetivoCoordinador(queryRunner, Obj.infoCoordinadorCuenta, ObjetivoId)
            await this.ObjetivoRubro(queryRunner, Obj.rubrosCliente, Obj.ClienteId, ClienteElementoDependienteUltNro)
            await this.ObjetivoDocRequerido(queryRunner, Obj.docsRequerido, Obj.ClienteId, ClienteElementoDependienteUltNro, usuario, ip)

            //await this.updateMaxClienteElementoDependiente(queryRunner,Obj.ClienteId,Obj.ClienteElementoDependienteId,MaxObjetivoPersonalJerarquicoId, maxRubro)

            if (infoActividad[0].GrupoActividadId) {
                await this.grupoActividad(queryRunner, Obj.infoActividad, ObjetivoId, ip, usuarioId, usuario)
            }

            const grupoactividad = await this.getGrupoActividad(queryRunner, ObjetivoId, Obj.ClienteId, ClienteElementoDependienteUltNro)
            ObjObjetivoNew.infoActividad[0] = grupoactividad[0]
            ObjObjetivoNew.infoActividad[0].GrupoActividadOriginal = ObjObjetivoNew.infoActividad[0].GrupoActividadId
            ObjObjetivoNew.infoActividad[0].GrupoActividadObjetivoDesdeOriginal = ObjObjetivoNew.infoActividad[0].GrupoActividadObjetivoDesde

            await this.setObjetivoHabilitacionNecesaria(queryRunner, ObjetivoId, Obj.habilitacion, usuario, ip)

            if (Obj.files?.length > 0) {
                for (const file of Obj.files) {
                    let denDocumento = Obj.ClienteId + '/' + ClienteElementoDependienteUltNro
                    await FileUploadController.handleDOCUpload(null, ObjetivoId, null, null, new Date(), null, denDocumento, null, null, file, usuarioId, ip, queryRunner)
                }
            }

            let ObjObjetivoNewQuery = await this.infObjetivoQuerys(queryRunner, ObjetivoId, Obj.ClienteId, Obj.ClienteElementoDependienteId)

            await queryRunner.commitTransaction()
            return this.jsonRes(ObjObjetivoNewQuery, res, 'Carga  de nuevo registro exitoso');
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }

    async updateCliente(queryRunner: any, ClienteId: number, ClienteElementoDependienteUltNro: any) {
        return await queryRunner.query(`UPDATE Cliente SET ClienteElementoDependienteUltNro = @1 WHERE ClienteId = @0`,
            [ClienteId, ClienteElementoDependienteUltNro])
    }

    async ClienteElementoDependienteContrato(queryRunner: any, ClienteId: any, ClienteElementoDependienteId: any, ClienteElementoDependienteContratoFechaDesde: any,
        ClienteElementoDependienteContratoFechaHasta: any) {


        let ClienteElementoDependienteContratoUltNro = 1

        return await queryRunner.query(`INSERT INTO ClienteElementoDependienteContrato (
            ClienteElementoDependienteContratoId,
            ClienteId,
            ClienteElementoDependienteId,
            ClienteElementoDependienteContratoFechaDesde,
            ClienteElementoDependienteContratoFechaHasta
            ) VALUES (@0,@1,@2,@3,@4)`,
            [ClienteElementoDependienteContratoUltNro,
                ClienteId,
                ClienteElementoDependienteId,
                ClienteElementoDependienteContratoFechaDesde,
                ClienteElementoDependienteContratoFechaHasta,
            ])
    }

    async addElementoDependienteDomicilio(queryRunner: any, ClienteId: any, ClienteElementoDependienteId: any, DomicilioDomLugar: any, DomicilioDomCalle: any,
        DomicilioDomNro: any, DomicilioCodigoPostal: any, DomicilioProvinciaId: any, DomicilioLocalidadId: any, DomicilioBarrioId: any) {
        await queryRunner.query(`UPDATE NexoDomicilio SET NexoDomicilioActual=0  WHERE ClienteElementoDependienteId = @0 AND ClienteId=@1 `, [ClienteElementoDependienteId, ClienteId])


        await queryRunner.query(`INSERT INTO Domicilio (
                    DomicilioDomLugar, DomicilioDomCalle, DomicilioDomNro, DomicilioCodigoPostal, 
                    DomicilioPaisId, DomicilioProvinciaId, DomicilioLocalidadId, DomicilioBarrioId) 
                    VALUES ( @0,@1,@2,@3,@4,@5,@6,@7)`, [
            DomicilioDomLugar, DomicilioDomCalle, DomicilioDomNro,
            DomicilioCodigoPostal, 1, DomicilioProvinciaId, DomicilioLocalidadId,
            DomicilioBarrioId
        ])
        const resDomicilio = await queryRunner.query(`SELECT IDENT_CURRENT('Domicilio')`)
        const DomicilioId = resDomicilio[0]['']

        await queryRunner.query(`INSERT INTO NexoDomicilio (
                    DomicilioId, NexoDomicilioActual, NexoDomicilioComercial, NexoDomicilioOperativo, NexoDomicilioConstituido, NexoDomicilioLegal, ClienteId, ClienteElementoDependienteId
                    ) 
                    VALUES ( @0,@1,@2,@3,@4,@5,@6,@7)`, [
            DomicilioId, 1, 0, 1, 0, 0, ClienteId, ClienteElementoDependienteId
        ])
    }

    async insertObjetivoSql(queryRunner: any, ClienteId: number, ClienteElementoDependienteDescripcion: string, ClienteElementoDependienteId: any, ObjetivoSucursalUltNro: any,) {

        return await queryRunner.query(`INSERT INTO Objetivo (
            ClienteId,
            ObjetivoDescripcion,
            ClienteElementoDependienteId,
            ObjetivoSucursalUltNro) VALUES (@0,@1,@2,@3)`,
            [ClienteId, ClienteElementoDependienteDescripcion, ClienteElementoDependienteId, ObjetivoSucursalUltNro])
    }

    async insertClienteElementoDependienteSql(queryRunner: any, ClienteId: any, ClienteElementoDependienteId: any, ClienteElementoDependienteDescripcion, ClienteElementoDependienteSucursalId: any, CoberturaServicio: any) {
        //este codigo arma el ClienteElementoDependienteArmado
        let ElementoDependienteId = 1
        let infoElementoDependiente = await queryRunner.query(`SELECT ElementoDependienteDescripcion FROM ElementoDependiente WHERE ElementoDependienteId = @0`, [ElementoDependienteId])
        let ClienteElementoDependienteArmado = `${infoElementoDependiente[0].ElementoDependienteDescripcion} - ${ClienteElementoDependienteDescripcion}`

        return await queryRunner.query(`INSERT INTO ClienteElementoDependiente (
            ClienteId,
            ClienteElementoDependienteId,
            ElementoDependienteId,
            ClienteElementoDependienteDescripcion,
            ClienteElementoDependienteArmado,
            ClienteElementoDependienteSucursalId,
            CoberturaServicio) VALUES (@0,@1,@2,@3,@4,@5,@6)`,
            [ClienteId,
                ClienteElementoDependienteId,
                ElementoDependienteId,
                ClienteElementoDependienteDescripcion,
                ClienteElementoDependienteArmado,
                ClienteElementoDependienteSucursalId,
                CoberturaServicio
            ])
    }


    async getGridColsHistoryContrato(req, res) {
        this.jsonRes(columnasGrillaHistoryContrato, res);
    }

    async getGridColsHistoryDomicilio(req, res) {
        this.jsonRes(columnasGrillaHistoryDomicilio, res);
    }

    async getGridColsHistoryGrupoActiviadad(req, res) {
        this.jsonRes(columnasGrillaHistoryGrupoActividad, res);
    }


    async listHistoryContrato(
        req: any,
        res: Response,
        next: NextFunction
    ) {

        let fechaActual = new Date()
        const anio = Number(fechaActual.getFullYear())
        const mes = Number(fechaActual.getMonth())
        const ObjetivoId = req.body.ObjetivoId
        const queryRunner = dataSource.createQueryRunner();
        const ClienteElementoDependienteId = req.body.ClienteElementoDependienteId
        const ClienteId = req.body.ClienteId

        try {

            let listCargaContratoHistory

            if (ClienteElementoDependienteId && ClienteElementoDependienteId > 0)
                //ClienteElementoDependienteContrato 
                listCargaContratoHistory = await queryRunner.query(`SELECT 
                       ROW_NUMBER() OVER (ORDER BY clie.ClienteElementoDependienteContratoFechaDesde, 
                                clie.ClienteElementoDependienteContratoFechaHasta, 
                                clie.ClienteElementoDependienteContratoHorasMensuales) AS id,
                clie.ClienteElementoDependienteContratoFechaDesde as desde ,
                clie.ClienteElementoDependienteContratoFechaHasta as hasta
                FROM  ClienteElementoDependienteContrato as clie
                WHERE ClienteElementoDependienteId = @1 AND ClienteId = @0`, [ClienteId, ClienteElementoDependienteId])


            this.jsonRes(
                {
                    total: listCargaContratoHistory.length,
                    list: listCargaContratoHistory,
                },
                res
            );

        } catch (error) {
            return next(error)
        }
    }


    async listHistoryDomicilio(
        req: any,
        res: Response,
        next: NextFunction
    ) {

        let fechaActual = new Date()
        const anio = Number(fechaActual.getFullYear())
        const mes = Number(fechaActual.getMonth())
        const ObjetivoId = req.body.ObjetivoId
        const queryRunner = dataSource.createQueryRunner();
        const ClienteElementoDependienteId = req.body.ClienteElementoDependienteId
        const ClienteId = req.body.ClienteId

        try {

            let listCargaContratoHistory

            if (ClienteElementoDependienteId && ClienteElementoDependienteId > 0)
                listCargaContratoHistory = await queryRunner.query(`  
                SELECT ROW_NUMBER() OVER (ORDER BY dom.DomicilioId) AS id,  
                    CONCAT(dom.DomicilioDomCalle, ' ', ISNULL(dom.DomicilioDomNro, 0)) AS calle,
                    dom.DomicilioCodigoPostal AS postal,
                    prov.provinciadescripcion AS provincia,
                    local.localidaddescripcion AS localidad,
                    bar.barriodescripcion AS barrio,
                    dom.DomicilioDomLugar
                FROM Domicilio dom
                JOIN NexoDomicilio nexdom ON nexdom.DomicilioId = dom.DomicilioId
                LEFT JOIN  provincia prov ON prov.provinciaid = dom.DomicilioProvinciaid
                        AND prov.PaisId = 1
                LEFT JOIN  localidad local ON local.provinciaid = dom.DomicilioProvinciaid
                    AND local.localidadid = dom.DomicilioLocalidadid AND local.PaisId = 1
                LEFT JOIN  barrio bar ON bar.provinciaid = dom.DomicilioProvinciaid
                    AND bar.localidadid = dom.DomicilioLocalidadid 
                    AND bar.BarrioId = dom.DomicilioBarrioId
                    AND bar.PaisId = 1

                WHERE  nexdom.ClienteElementoDependienteId = @1 AND nexdom.ClienteId = @0;`, [ClienteId, ClienteElementoDependienteId])

            this.jsonRes(
                {
                    total: listCargaContratoHistory.length,
                    list: listCargaContratoHistory,
                },
                res
            );

        } catch (error) {
            return next(error)
        }
    }

    async listHistoryGrupoActividad(
        req: any,
        res: Response,
        next: NextFunction
    ) {

        let fechaActual = new Date()
        const anio = Number(fechaActual.getFullYear())
        const mes = Number(fechaActual.getMonth())
        const ObjetivoId = req.body.ObjetivoId
        const queryRunner = dataSource.createQueryRunner();
        const ClienteElementoDependienteId = req.body.ClienteElementoDependienteId
        const ClienteId = req.body.ClienteId

        try {

            let listCargaContratoHistory

            if (ClienteElementoDependienteId && ClienteElementoDependienteId > 0)
                listCargaContratoHistory = await queryRunner.query(`  
                SELECT 
                    ROW_NUMBER() OVER (ORDER BY grup.GrupoActividadObjetivoId) AS id,  
                    acti.grupoactividadDetalle AS detalle,
                    grup.GrupoActividadObjetivoDesde AS desde,
                    grup.GrupoActividadObjetivoHasta AS hasta
                FROM GrupoActividadObjetivo grup
                LEFT JOIN grupoactividad acti 
                    ON acti.GrupoActividadId = grup.GrupoActividadId
                WHERE GrupoActividadObjetivoObjetivoId = @0;`, [ObjetivoId])

            this.jsonRes(
                {
                    total: listCargaContratoHistory.length,
                    list: listCargaContratoHistory,
                },
                res
            );

        } catch (error) {
            return next(error)
        }
    }

    private async setObjetivoHabilitacionNecesaria(queryRunner: any, ObjetivoId: number, habilitaciones: any[], usuario: string, ip: string) {
        //Compruebo si hubo cambios
        let cambios: boolean = false
        if (!habilitaciones || !habilitaciones.length) {
            throw new ClientException('Al menos debe seleccionar un lugar de habilitación para el objetivo')
        }

        const habilitacionesOld = await this.getFormHabilitacionByObjetivoIdQuery(queryRunner, ObjetivoId)

        if (habilitaciones.length != habilitacionesOld.length)
            cambios = true
        else
            habilitacionesOld.forEach((hab: any, index: number) => {
                if (habilitaciones.find(h => hab != h)) {
                    cambios = true
                }
            });
        if (!cambios) return


        //Actualizo
        const now = new Date()

        let ObjetivoHabilitacionNecesariaLugarHabilitacionId: number = 0
        await queryRunner.query(`
          DELETE FROM ObjetivoHabilitacionNecesaria
          WHERE ObjetivoId IN (@0)
          `, [ObjetivoId])
        for (const habilitacionId of habilitaciones) {
            ObjetivoHabilitacionNecesariaLugarHabilitacionId++
            await queryRunner.query(`
              INSERT INTO ObjetivoHabilitacionNecesaria (
              ObjetivoHabilitacionNecesariaId, ObjetivoId, ObjetivoHabilitacionNecesariaLugarHabilitacionId,
              ObjetivoHabilitacionNecesariaAudFechaIng,ObjetivoHabilitacionNecesariaAudUsuarioIng, ObjetivoHabilitacionNecesariaAudIpIng,
              ObjetivoHabilitacionNecesariaAudFechaMod,ObjetivoHabilitacionNecesariaAudUsuarioMod, ObjetivoHabilitacionNecesariaAudIpMod
              )
              VALUES(@0,@1,@2, @3,@4,@5, @3,@4,@5)
              `, [ObjetivoHabilitacionNecesariaLugarHabilitacionId, ObjetivoId, habilitacionId, now, usuario, ip])
        }
        await queryRunner.query(`
          UPDATE Objetivo SET
          ObjetivoHabilitacionNecesariaUltNro = @1
          WHERE ObjetivoId IN (@0)
          `, [ObjetivoId, ObjetivoHabilitacionNecesariaLugarHabilitacionId])
    }

    private async getFormHabilitacionByObjetivoIdQuery(queryRunner: any, ObjetivoId: any) {
        const habs = []
        const habilitacionPers = await queryRunner.query(`
            SELECT ObjetivoHabilitacionNecesariaLugarHabilitacionId
            FROM ObjetivoHabilitacionNecesaria
            WHERE ObjetivoId IN (@0)
          `, [ObjetivoId]
        )
        for (const hab of habilitacionPers)
            habs.push(hab.ObjetivoHabilitacionNecesariaLugarHabilitacionId)
        return habs
    }

}
