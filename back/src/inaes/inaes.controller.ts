import { BaseController, ClientException } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import type { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL, getOptionsSINO } from "../impuestos-afip/filtros-utils/filtros.ts";
import type { Options } from "../schemas/filtro.ts";
// import { FileUploadController } from "../controller/file-upload.controller.ts";
import type { QueryRunner } from "typeorm";
import xlsx from 'node-xlsx';
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { TextItem } from "pdfjs-dist/types/src/display/api.d.ts";
import { logger } from "../logger/logger.ts";

const getOptionsSexo: any[] = [
  { label: 'Masculino', value: 'M' },
  { label: 'Femenino', value: 'F' },
]

const getOptionsEstado: any[] = [
  { label: 'Baja', value: '0' },
  { label: 'Alta', value: '1' },
]

const altasBajasColumns: any[] = [
  {
    id: 'id', 
    name: 'id', 
    field: 'id',
    type: 'string',
    fieldName: "per.PersonalId",
    searchType: "string",
    sortable: true,
    searchHidden: true,
    hidden: true,
    excludeFromExport: true,
  },
  {
    id: "ApellidoNombre",
    name: "Apellido Nombre",
    field: "ApellidoNombre",
    type: "string",
    fieldName: "per.PersonalId",
    searchComponent: "inputForPersonalSearch",
    searchType: "number",
    sortable: true,
    searchHidden: false,
    hidden: true,
    excludeFromExport: true,
  },
  {
    id: "SituacionRevistaId",
    name: "Situacion Revista",
    field: "SituacionRevistaId",
    type: "number",
    fieldName: "sitrev.PersonalSituacionRevistaSituacionId",
    searchComponent: "inputForSituacionRevistaSearch",
    searchType: "number",
    sortable: true,
    searchHidden: false,
    hidden: true,
    excludeFromExport: true,
  },
  {
    id: 'CUITEntidad', 
    name: 'CUIT Entidad', 
    field: 'CUITEntidad',
    fieldName: "",
    type: 'string',
    searchType: "number",
    sortable: true,
    searchHidden: true,
    hidden: false,
    showGridColumn: false,
  },
  {
    id: "PersonalFechaIngreso",
    name: "Fecha Ingreso",
    field: "PersonalFechaIngreso",
    type: "date",
    fieldName: "ISNULL(ing.PersonalFechaIngreso,'9999-12-31')",
    searchType: "date",
    searchComponent: "inputForFechaSearch",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: "PersonalCUITCUILCUIT",
    name: "CUIT",
    field: "PersonalCUITCUILCUIT",
    type: "string",
    fieldName: "cuit.PersonalCUITCUILCUIT",
    searchType: "number",
    // searchComponent: "inputForCUITsSearch",
    actions: ['searchCUITsFromFile'],
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: 'TipoPersona', 
    name: 'Tipo Persona', 
    field: 'TipoPersona',
    fieldName: "",
    type: 'string',
    searchType: "string",
    sortable: true,
    searchHidden: true,
    hidden: false,
    showGridColumn: false,
  },
  {
    id: 'RazonSocial', 
    name: 'Razon Social', 
    field: 'RazonSocial',
    fieldName: "",
    type: 'string',
    searchType: "string",
    sortable: true,
    searchHidden: true,
    hidden: false,
    showGridColumn: false,
  },
  {
    id: 'PersonalApellido', 
    name: 'Apellido', 
    field: 'PersonalApellido',
    fieldName: "per.PersonalApellido",
    type: 'string',
    searchType: "string",
    sortable: true,
    searchHidden: true,
    hidden: false,
  },
  {
    id: 'PersonalNombre', 
    name: 'Nombre',
    field: 'PersonalNombre',
    fieldName: "per.PersonalNombre",
    type: 'string',
    searchType: "string",
    sortable: true,
    searchHidden: true,
    hidden: false,
  },
  {
    id: 'PersonalSexo', 
    name: 'Sexo',
    field: 'PersonalSexo',
    fieldName: "per.PersonalSexo",
    type: 'string',
    formatter: 'collectionFormatter',
    params: { collection: getOptionsSexo },
    searchType: "string",
    sortable: true,
    searchHidden: true,
    hidden: false,
    showGridColumn: false,
  },
  {
    id: "PersonalFechaNacimiento",
    name: "Fecha Nacimiento / Inscripcion",
    field: "PersonalFechaNacimiento",
    type: "date",
    fieldName: "ISNULL(per.PersonalFechaNacimiento,'9999-12-31')",
    searchComponent: "inputForFechaSearch",
    searchType: "date",
    sortable: true,
    hidden: false,
    searchHidden: true,
    showGridColumn: false,
  },
  {
    id: 'ProvinciaDescripcion', 
    name: 'Provincia',
    field: 'ProvinciaDescripcion',
    fieldName: "perdom.ProvinciaId",
    type: 'string',
    searchComponent: "inputForProvinciasSearch",
    searchType: "number",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: 'LocalidadDescripcion', 
    name: 'Localidad',
    field: 'LocalidadDescripcion',
    fieldName: "perdom.LocalidadId",
    type: 'string',
    searchComponent: "inputForLocalidadesSearch",
    searchType: "number",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: 'DomicilioCodigoPostal', 
    name: 'Codigo Postal',
    field: 'DomicilioCodigoPostal',
    fieldName: "perdom.DomicilioCodigoPostal",
    type: 'string',
    searchType: "string",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: "Domicilio",
    name: "Domicilio",
    field: "Domicilio",
    type: "string",
    fieldName: "perdom.Domicilio",
    sortable: true,
    hidden: false,
    searchHidden: true,
    showGridColumn: false,
  },
  {
    id: "PersonalEmailEmail",
    name: "Mail",
    field: "PersonalEmailEmail",
    type: "string",
    fieldName: "email.PersonalEmailEmail",
    sortable: true,
    hidden: false,
    searchHidden: true,
    showGridColumn: false,
  },
  {
    id: "Telefono",
    name: "Telefono",
    field: "Telefono",
    type: "string",
    fieldName: "tel.Telefono",
    searchType: "string",
    sortable: true,
    searchHidden: true,
    hidden: false,
  },
  {
    id: "CapitalSuscripto",
    name: "Capital Suscripto",
    field: "CapitalSuscripto",
    type: "currency",
    fieldName: "",
    sortable: true,
    hidden: false,
    searchHidden: true,
    showGridColumn: false,
  },
  {
    id: "CapitalIntegrado",
    name: "Capital Integrado",
    field: "CapitalIntegrado",
    type: "currency",
    fieldName: "",
    sortable: true,
    hidden: false,
    searchHidden: true,
    showGridColumn: false,
  },
  {
    id: "PersonalNroLegajo",
    name: "Nro. de Legajo",
    field: "PersonalNroLegajo",
    type: "string",
    fieldName: "per.PersonalNroLegajo",
    searchType: "number",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: 'Estado', 
    name: 'Estado', 
    field: 'Estado',
    type: 'string',
    sortable: true,
    formatter: 'collectionFormatter',
    params: { collection: getOptionsEstado },
    searchHidden: true,
    hidden: false,
    excludeFromExport: true,
    // showGridColumn: false,
  },
]

const recibosColumns: any[] = [
  {
    id: 'id', 
    name: 'id', 
    field: 'id',
    type: 'string',
    fieldName: "",
    searchType: "string",
    sortable: true,
    searchHidden: true,
    hidden: true,
    excludeFromExport: true,
  },
  {
    id: 'CUITEntidad', 
    name: 'CUIT Entidad', 
    field: 'CUITEntidad',
    fieldName: "",
    type: 'string',
    searchType: "number",
    sortable: true,
    searchHidden: true,
    hidden: false,
    showGridColumn: false,
  },
  {
    id: "PersonalCUITCUILCUIT",
    name: "Cuit / Cuil / Cdi",
    field: "PersonalCUITCUILCUIT",
    type: "string",
    fieldName: "cuit.PersonalCUITCUILCUIT",
    sortable: true,
    searchHidden: true,
    hidden: false,
  },
  {
    id: "ApellidoNombre",
    name: "Apellido Nombre",
    field: "ApellidoNombre",
    type: "string",
    fieldName: "mov1.PersonalId",
    searchComponent: "inputForPersonalSearch",
    searchType: "number",
    sortable: true,
    searchHidden: false,
    hidden: false,
    excludeFromExport: true,
  },
  {
    id: 'DocumentoAudFechaIng', 
    name: 'Fecha Recibo', 
    field: 'DocumentoAudFechaIng',
    fieldName: "doc.DocumentoAudFechaIng",
    type: 'date',
    searchType: "string",
    sortable: true,
    searchHidden: true,
    hidden: false,
  },
  {
    id: 'MedioPago', 
    name: 'Medio Pago', 
    field: 'MedioPago',
    fieldName: "",
    type: 'string',
    searchType: "string",
    sortable: true,
    searchHidden: true,
    hidden: false,
  },
  {
    id: 'PersonalBancoCBU', 
    name: 'Cbu/Alias', 
    field: 'PersonalBancoCBU',
    fieldName: "perban.PersonalBancoCBU",
    type: 'string',
    searchType: "string",
    sortable: true,
    searchHidden: true,
    hidden: false,
  },
  {
    id: 'total_ingresos', 
    name: 'Retribución',
    field: 'total_ingresos',
    fieldName: "total_ingresos",
    type: 'currency',
    sortable: true,
    searchHidden: true,
    hidden: false,
  },
  {
    id: 'Excedentes', 
    name: 'Excedentes',
    field: 'Excedentes',
    fieldName: '',
    type: 'currency',
    sortable: true,
    searchHidden: true,
    hidden: false,
  },
  {
    id: "RetencionMonotributo",
    name: "Retencion Monotributo",
    field: "RetencionMonotributo",
    type: "currency",
    fieldName: "",
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
  {
    id: 'OtrasRetenciones', 
    name: 'Otras Retenciones',
    field: 'OtrasRetenciones',
    fieldName: "",
    type: 'currency',
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: 'DetalleOtrasRetenciones', 
    name: 'Detalle Otras Retenciones',
    field: 'DetalleOtrasRetenciones',
    fieldName: "",
    type: 'string',
    searchComponent: "",
    searchType: "string",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: 'DetalledeRetribucion', 
    name: 'Detalle de Retribucion',
    field: 'DetalledeRetribucion',
    fieldName: "",
    type: 'string',
    searchType: "string",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
]

export class InaesController extends BaseController {
  
  async getColumnsAltaBajasGrid(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(altasBajasColumns, res)
  }

  async getColumnsRecibosGrid(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(recibosColumns, res)
  }

  private async getAltasBajasQuery(queryRunner: any, filterSql: any, orderBy: any, cuits:string|null ) {
    let flags = '1' 
    let filterCUITs = '(1=1)'
    if (cuits) {
      flags = `CASE WHEN (sitrev.PersonalSituacionRevistaSituacionId IN (2,10,12)) THEN '1' ELSE '0' END AS Estado`
      filterCUITs = ` cuit.PersonalCUITCUILCUIT NOT IN (${cuits}) OR sitrev.PersonalSituacionRevistaSituacionId IN (3)`
    }
    return await queryRunner.query(`
      SELECT
        per.PersonalId AS id,
        30643445510 AS CUITEntidad,
        ing.PersonalFechaIngreso,
        cuit.PersonalCUITCUILCUIT,
        'Humana' AS TipoPersona,
        'COOP DE TRABAJO LINCE SEGURIDAD LTDA' AS RazonSocial,
        per.PersonalApellido,
        per.PersonalNombre,
        CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre,
        per.PersonalSexo,
        per.PersonalFechaNacimiento,
        perdom.ProvinciaDescripcion,
        perdom.LocalidadDescripcion,
        perdom.DomicilioCodigoPostal,
        perdom.Domicilio,
        TRIM(email.PersonalEmailEmail) AS PersonalEmailEmail,
        tel.Telefono,
        per.PersonalNroLegajo,
        perdom.domCompleto,
        sitrev.PersonalSituacionRevistaSituacionId, sitrev.SituacionRevistaDescripcion,
        ${flags}
      FROM Personal per

      LEFT JOIN (
        SELECT p.PersonalId, p.PersonalSituacionRevistaSituacionId, s.SituacionRevistaDescripcion, p.PersonalSituacionRevistaDesde
        /*CASE 
          WHEN p.PersonalSituacionRevistaId IS NOT NULL THEN  
            CONCAT(TRIM(s.SituacionRevistaDescripcion), ' (Desde: ', FORMAT(p.PersonalSituacionRevistaDesde, 'dd/MM/yyyy'), ' - Hasta: ', 
              CASE WHEN p.PersonalSituacionRevistaHasta IS NULL THEN '' 
                ELSE FORMAT(p.PersonalSituacionRevistaHasta, 'dd/MM/yyyy') 
              END, ')'
            )
          ELSE '' 
        END AS sitRevCom*/
        FROM PersonalSituacionRevista p
        JOIN SituacionRevista s
          ON p.PersonalSituacionRevistaSituacionId = s.SituacionRevistaId AND p.PersonalSituacionRevistaDesde <= GETDATE() AND ISNULL(p.PersonalSituacionRevistaHasta,'9999-12-31') >= CAST(GETDATE() AS DATE)
      ) sitrev ON sitrev.PersonalId = per.PersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN PersonalIngresoEgreso ing ON ing.PersonalId = per.PersonalId
        
      OUTER APPLY (
        SELECT TOP (1)
          TRIM(t.PersonalTelefonoNro) AS Telefono
        FROM PersonalTelefono t
        WHERE t.PersonalId = per.PersonalId
          AND (t.PersonalTelefonoInactivo = 0 OR t.PersonalTelefonoInactivo IS NULL)
        ORDER BY t.PersonalTelefonoId
      ) tel

      LEFT JOIN (
        SELECT 
          (TRIM(dom.DomicilioDomCalle) + ' '+ TRIM(dom.DomicilioDomNro)) domCalleNro, per.PersonalId, 
          CONCAT_WS(', ', CONCAT_WS(' ',NULLIF(TRIM(dom.DomicilioDomCalle), ''),NULLIF(TRIM(dom.DomicilioDomNro), '')),NULLIF(CONCAT('C', TRIM(dom.DomicilioCodigoPostal)), 'C'),
          NULLIF(TRIM(bar.BarrioDescripcion), ''),NULLIF(TRIM(loc.LocalidadDescripcion), ''),NULLIF(TRIM(prov.ProvinciaDescripcion), ''),NULLIF(TRIM(pais.PaisDescripcion), '')) AS domCompleto,
          CONCAT(TRIM(dom.DomicilioDomCalle), ' ', TRIM(dom.DomicilioDomNro)) AS Domicilio,
          prov.ProvinciaId, prov.ProvinciaDescripcion,
          loc.LocalidadId, loc.LocalidadDescripcion,
          dom.DomicilioCodigoPostal
        FROM Personal per
        LEFT JOIN NexoDomicilio nexdom ON nexdom.PersonalId = per.PersonalId AND nexdom.NexoDomicilioActual = 1
        LEFT JOIN Domicilio dom ON dom.DomicilioId = nexdom.DomicilioId
        LEFT JOIN Pais pais ON pais.PaisId = dom.DomicilioPaisId
        LEFT JOIN Provincia prov ON prov.PaisId = pais.PaisId AND prov.ProvinciaId = dom.DomicilioProvinciaId
        LEFT JOIN Localidad loc ON loc.PaisId = pais.PaisId AND loc.ProvinciaId = prov.ProvinciaId  AND loc.LocalidadId = dom.DomicilioLocalidadId 
        LEFT JOIN Barrio bar ON bar.PaisId = pais.PaisId AND prov.ProvinciaId = bar.ProvinciaId AND loc.LocalidadId = bar.LocalidadId AND dom.DomicilioBarrioId = bar.BarrioId
      ) AS perdom ON perdom.PersonalId = per.PersonalId

      LEFT JOIN PersonalEmail email on email.PersonalId=per.PersonalId AND email.PersonalEmailInactivo=0

      WHERE (1=1)
      AND (${filterSql}) AND (${filterCUITs})
      ${orderBy}`)
  }
  
  async getAltasBajas(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null };

      const index = options.filtros.findIndex((p:any) => p.index === "PersonalCUITCUILCUIT");
      let CUITs:string = null
      if (index !== -1) {
        let CUITsFromFile:any = null;
        [CUITsFromFile] = options.filtros.splice(index, 1);
        CUITs = CUITsFromFile.valor[0].split(";").join(",")
      }

      const filterSql = filtrosToSql(options.filtros, altasBajasColumns);
      const orderBy = orderToSQL(options.sort)

      const lista: any[] = await this.getAltasBajasQuery(queryRunner, filterSql, orderBy, CUITs)

      this.jsonRes(lista, res);
    } catch (error) {
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  private async getRecibosQuery(queryRunner: any, filterSql: any, orderBy: any, year:number, month:number) {
    return await queryRunner.query(`
      SELECT 
        ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) id,
        mov1.persona_id,
        30643445510 AS CUITEntidad,
        cuit.PersonalCUITCUILCUIT,
        doc.DocumentoAudFechaIng,
        'Banco' AS MedioPago,
        CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre,
        perban.PersonalBancoCBU,

        --viginorm.importe AS importe_vigil, viginorm.horas AS horas_vigil,
        --viginormart14.importe AS importe_vigilart14, viginormart14.horas AS horas_vigilart14, 
        -- adminorm.importe AS importe_admin, adminorm.horas AS horas_admin,
        --vigiar42.importe AS importe_vigilar42, vigiar42.horas AS horas_vigilar42,
        --admiar42.importe AS importe_adminar42, admiar42.horas AS horas_adminar42,
        --vigiextra.importe AS importe_extra, vigiextra.horas AS horas_extra,

        --(ISNULL(viginorm.importe,0) + ISNULL(viginormart14.importe,0) + ISNULL(vigiextra.importe,0) + ISNULL(vigiar42.importe,0) + ISNULL(admiar42.importe,0)) AS total_ingresos,

        --mdesc.importe AS descuentos,
        --motro.importe AS otros_desc,
        --mayud.importe AS ayuda_asis,
        --mrent.importe AS rentas,
        --mddjj.importe AS ddjj,
        --madel.importe AS adelantos,
        --mprep.importe AS prepaga,
        --mtele.importe AS telefonia,

        --ISNULL(mdesc.importe,0) + ISNULL(motro.importe,0) + ISNULL(mayud.importe,0) + ISNULL(mrent.importe,0) + ISNULL(mddjj.importe,0) + ISNULL(mprep.importe,0) + ISNULL(mtele.importe,0) AS total_egresos,

        --ISNULL(viginorm.importe,0) + ISNULL(viginormart14.importe,0) + ISNULL(vigiextra.importe,0) + ISNULL(vigiar42.importe,0) + ISNULL(admiar42.importe,0) - ISNULL(mdesc.importe,0) - ISNULL(motro.importe,0) - ISNULL(mayud.importe,0) - ISNULL(mrent.importe,0) - ISNULL(mddjj.importe,0) - ISNULL(mprep.importe,0) - ISNULL(mtele.importe,0) AS retiro,
        --supri.PersonalSucursalPrincipalSucursalId, suc.SucursalDescripcion,
        --g.GrupoActividadId, g.GrupoActividadNumero, g.GrupoActividadDetalle,
        --banc.BancoDescripcion,
        --detsitrev.detsituacionrevista,
        1

      FROM Personal per 
      JOIN (
        SELECT DISTINCT per.PersonalId persona_id
        FROM Personal per
        JOIN lige.dbo.liqmaperiodo am ON am.anio=@1 AND am.mes=@2 
        LEFT JOIN lige.dbo.liqmamovimientos m ON m.persona_id = per.PersonalId AND m.periodo_id = am.periodo_id
        LEFT JOIN PersonalSituacionRevista sit ON sit.PersonalId=per.PersonalId AND sit.PersonalSituacionRevistaDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) 
            AND ISNULL(sit.PersonalSituacionRevistaHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1)  AND sit.PersonalSituacionRevistaSituacionId IN (2,5,11,12,14,20,26,28)
            
            
        WHERE (sit.PersonalId IS NOT NULL OR m.persona_id IS NOT NULL)
      ) mov1 ON mov1.persona_id = per.PersonalId

      LEFT JOIN lige.dbo.liqmaperiodo mov ON mov.anio=@1 AND mov.mes=@2 

      LEFT JOIN PersonalSucursalPrincipal supri ON supri.PersonalId = per.PersonalId
      LEFT JOIN Sucursal suc ON suc.SucursalId = supri.PersonalSucursalPrincipalSucursalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)

      LEFT JOIN GrupoActividadPersonal ga ON ga.GrupoActividadPersonalPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,1) <  ISNULL(ga.GrupoActividadPersonalHasta, '9999-12-31') AND ga.GrupoActividadPersonalDesde = (
        SELECT MAX(ga.GrupoActividadPersonalDesde) GrupoActividadPersonalDesde FROM GrupoActividadPersonal ga
        WHERE DATEFROMPARTS(@1,@2,28) > ga.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(ga.GrupoActividadPersonalHasta, '9999-12-31')
          AND ga.GrupoActividadPersonalPersonalId = per.PersonalId
        GROUP BY ga.GrupoActividadPersonalPersonalId
      )

      LEFT JOIN GrupoActividad g ON g.GrupoActividadId = ga.GrupoActividadId           
      LEFT JOIN PersonalBanco AS perban ON perban.PersonalId = per.PersonalId AND perban.PersonalBancoDesde = (SELECT MAX(perbanmax.PersonalBancoDesde) FROM PersonalBanco perbanmax WHERE perbanmax.PersonalId = per.PersonalId) 
        AND perban.PersonalBancoDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) 
        AND ISNULL(perban.PersonalBancoHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1)
      LEFT JOIN banco AS banc ON banc.BancoId = perban.PersonalBancoBancoId

      LEFT JOIN (
        SELECT ingvig.periodo_id, ingvig.persona_id, SUM (ingvig.horas) as horas,SUM(ingvig.importe) AS importe 
        FROM lige.dbo.liqmamovimientos ingvig 
        JOIN lige.dbo.liqcotipomovimiento tipo ON tipo.tipo_movimiento_id = ingvig.tipo_movimiento_id
        WHERE ingvig.tipocuenta_id = 'G' AND tipo.tipo_movimiento = 'I'
        GROUP BY ingvig.periodo_id, ingvig.persona_id --Ingresos Extra
      ) AS vigiextra ON vigiextra.persona_id=per.PersonalId AND vigiextra.periodo_id = mov.periodo_id

      LEFT JOIN (
        SELECT ingvig.periodo_id, ingvig.persona_id, SUM (ingvig.horas) as horas,SUM(ingvig.importe) AS importe FROM lige.dbo.liqmamovimientos ingvig WHERE ingvig.tipo_movimiento_id=8 AND ingvig.detalle NOT LIKE 'Art14%' AND ingvig.tipocuenta_id = 'G'
        GROUP BY ingvig.periodo_id, ingvig.persona_id --Ingreso Vigilancia
      ) AS viginorm ON viginorm.persona_id=per.PersonalId AND viginorm.periodo_id = mov.periodo_id

      LEFT JOIN (
        SELECT ingvig.periodo_id, ingvig.persona_id, SUM (ingvig.horas) as horas,SUM(ingvig.importe) AS importe FROM lige.dbo.liqmamovimientos ingvig WHERE ingvig.tipo_movimiento_id=8 AND ingvig.detalle LIKE 'Art14%' AND ingvig.tipocuenta_id = 'G'
        GROUP BY ingvig.periodo_id, ingvig.persona_id --Ingreso Vigilancia Art14
      ) AS viginormart14 ON viginormart14.persona_id=per.PersonalId AND  viginormart14.periodo_id = mov.periodo_id

      LEFT JOIN (
        SELECT ingvig.periodo_id, ingvig.persona_id, SUM (ingvig.horas) as horas,SUM(ingvig.importe) AS importe FROM lige.dbo.liqmamovimientos ingvig WHERE ingvig.tipo_movimiento_id=9 AND ingvig.tipocuenta_id = 'G' 
        GROUP BY ingvig.periodo_id, ingvig.persona_id --Ingreso Administracion
      ) AS adminorm ON adminorm.persona_id=per.PersonalId AND  adminorm.periodo_id = mov.periodo_id

      LEFT JOIN (
        SELECT ingvig.periodo_id, ingvig.persona_id, SUM (ingvig.horas) as horas,SUM(ingvig.importe) AS importe FROM lige.dbo.liqmamovimientos ingvig WHERE ingvig.tipo_movimiento_id=12 AND ingvig.tipocuenta_id = 'G'
        GROUP BY ingvig.periodo_id, ingvig.persona_id --Ingreso Art42 Vigilancia
      ) AS vigiar42 ON vigiar42.persona_id=per.PersonalId AND  vigiar42.periodo_id = mov.periodo_id

      LEFT JOIN (
        SELECT ingvig.periodo_id, ingvig.persona_id, SUM (ingvig.horas) as horas,SUM(ingvig.importe) AS importe FROM lige.dbo.liqmamovimientos ingvig WHERE ingvig.tipo_movimiento_id=13 AND ingvig.tipocuenta_id = 'G'
        GROUP BY ingvig.periodo_id, ingvig.persona_id --Ingreso Art42 Adminis
      ) AS admiar42 ON admiar42.persona_id=per.PersonalId AND  admiar42.periodo_id = mov.periodo_id

      LEFT JOIN (
        SELECT ingvig.periodo_id, ingvig.persona_id, 0 as horas,SUM(ingvig.importe) AS importe FROM lige.dbo.liqmamovimientos ingvig WHERE ingvig.tipo_movimiento_id=4 AND ingvig.tipocuenta_id = 'G'
        GROUP BY ingvig.periodo_id, ingvig.persona_id --Descuento
      ) AS mdesc ON mdesc.persona_id=per.PersonalId AND  mdesc.periodo_id = mov.periodo_id

      LEFT JOIN (
        SELECT ingvig.periodo_id, ingvig.persona_id, 0 as horas,SUM(ingvig.importe) AS importe FROM lige.dbo.liqmamovimientos ingvig WHERE ingvig.tipo_movimiento_id=5 AND ingvig.tipocuenta_id = 'G'
        GROUP BY ingvig.periodo_id, ingvig.persona_id --Otro Descuento
      ) AS motro ON motro.persona_id=per.PersonalId AND  motro.periodo_id = mov.periodo_id

      LEFT JOIN (
        SELECT ingvig.periodo_id, ingvig.persona_id, 0 as horas,SUM(ingvig.importe) AS importe FROM lige.dbo.liqmamovimientos ingvig WHERE ingvig.tipo_movimiento_id=15 AND ingvig.tipocuenta_id = 'G'
        GROUP BY ingvig.periodo_id, ingvig.persona_id --Adelanto
      ) AS madel ON madel.persona_id=per.PersonalId AND  madel.periodo_id = mov.periodo_id

      LEFT JOIN (
        SELECT ingvig.periodo_id, ingvig.persona_id, 0 as horas,SUM(ingvig.importe) AS importe FROM lige.dbo.liqmamovimientos ingvig WHERE ingvig.tipo_movimiento_id=7 AND ingvig.tipocuenta_id = 'G'
        GROUP BY ingvig.periodo_id, ingvig.persona_id --Ayuda
      ) AS mayud ON mayud.persona_id=per.PersonalId AND  mayud.periodo_id = mov.periodo_id

      LEFT JOIN (
        SELECT ingvig.periodo_id, ingvig.persona_id, 0 as horas,SUM(ingvig.importe) AS importe FROM lige.dbo.liqmamovimientos ingvig WHERE ingvig.tipo_movimiento_id=14  AND ingvig.tipocuenta_id = 'G'
        GROUP BY ingvig.periodo_id, ingvig.persona_id --Prepaga
      ) AS mprep ON mprep.persona_id=per.PersonalId AND  mprep.periodo_id = mov.periodo_id

      LEFT JOIN (
        SELECT ingvig.periodo_id, ingvig.persona_id, 0 as horas,SUM(ingvig.importe) AS importe FROM lige.dbo.liqmamovimientos ingvig WHERE ingvig.tipo_movimiento_id=6 AND ingvig.tipocuenta_id = 'G'
        GROUP BY ingvig.periodo_id, ingvig.persona_id --Rentas
      ) AS mrent ON mrent.persona_id=per.PersonalId AND  mrent.periodo_id = mov.periodo_id

      LEFT JOIN (
        SELECT ingvig.periodo_id, ingvig.persona_id, 0 as horas,SUM(ingvig.importe) AS importe FROM lige.dbo.liqmamovimientos ingvig WHERE ingvig.tipo_movimiento_id=16 AND ingvig.tipocuenta_id = 'G'
        GROUP BY ingvig.periodo_id, ingvig.persona_id --DDJJ
      ) AS mddjj ON mddjj.persona_id=per.PersonalId AND  mddjj.periodo_id = mov.periodo_id

      LEFT JOIN (
        SELECT ingvig.periodo_id, ingvig.persona_id, 0 as horas,SUM(ingvig.importe) AS importe FROM lige.dbo.liqmamovimientos ingvig WHERE ingvig.tipo_movimiento_id=17 AND ingvig.tipocuenta_id = 'G'
        GROUP BY ingvig.periodo_id, ingvig.persona_id --TELE
      ) AS mtele ON mtele.persona_id=per.PersonalId AND  mtele.periodo_id = mov.periodo_id

      LEFT JOIN (
        SELECT sit.PersonalId, STRING_AGG(CONCAT(TRIM(sr.SituacionRevistaDescripcion), ' ',FORMAT(sit.PersonalSituacionRevistaDesde,'dd/MM/yyyy'),' - ',FORMAT(sit.PersonalSituacionRevistaHasta,'dd/MM/yyyy')), '\n') detsituacionrevista
        FROM PersonalSituacionRevista sit
        JOIN SituacionRevista sr ON sr.SituacionRevistaId = sit.PersonalSituacionRevistaSituacionId 
        -- WHERE sit.PersonalSituacionRevistaSituacionId NOT IN (2,4,5,6,10,11,12,20,23,26)
          AND sit.PersonalSituacionRevistaDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) 
          AND ISNULL(sit.PersonalSituacionRevistaHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1) 
        GROUP BY sit.PersonalId
      ) AS detsitrev ON detsitrev.PersonalId=per.PersonalId 

      LEFT JOIN Documento doc ON doc.PersonalId = per.PersonalId AND doc.DocumentoTipoCodigo = 'REC' AND doc.DocumentoAnio = @1 AND doc.DocumentoMes = @2
      
      /*
      WHERE g.GrupoActividadId IN (
        SELECT g.GrupoActividadId FROM GrupoActividad g 
        JOIN GrupoActividadJerarquico gaj ON gaj.GrupoActividadId = g.GrupoActividadId
        WHERE gaj.GrupoActividadJerarquicoPersonalId = @3 
      ) OR @3 IS NULL
      */
      WHERE (${filterSql})
      ${orderBy}`, [null, year, month, null])
  }


  async getRecibos(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const periodo:Date|null = req.body.periodo? new Date(req.body.periodo) : null
      if (!periodo) throw new ClientException('Ingrese un Periodo') 
      const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null };
      const filterSql = filtrosToSql(options.filtros, altasBajasColumns);
      const orderBy = orderToSQL(options.sort)

      const lista: any[] = await this.getRecibosQuery(queryRunner, filterSql, orderBy,periodo.getFullYear(), periodo.getMonth()+1)

      this.jsonRes(lista, res);
    } catch (error) {
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async getCUITsByINAESFile(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);
    const file:any[] = req.body.file
    try {
      await queryRunner.startTransaction()
      if (!file.length) throw new ClientException("Debes de ingresar un archivo");
      const CUITs:string[] = await this.getCUITsByFile(file[0].tempfilename)

      await queryRunner.commitTransaction()
      this.jsonRes({cuits: CUITs, length: CUITs.length}, res);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async getCUITsByFile(tempfilename: any) {
    let CUITs:any[] = []
    const loadingTask = getDocument(`${process.env.PATH_DOCUMENTS}/temp/${tempfilename}`)
    const document = await loadingTask.promise;//Error
    for (let pagenum = 1; pagenum <= document.numPages; pagenum++) {
      const page = await document.getPage(pagenum);
      const textContent = await page.getTextContent();

      for (let index = 0; index < textContent.items.length-6; index++) { // Para no recorrer el Pie de Pagina -6
        const item:any = textContent.items[index];
        if (item.str == '' || item.str == ' ') continue
        if (item.str.length == 11 && !isNaN(item.str)) CUITs.push(item.str)
      }

    }
    return CUITs

  }
}