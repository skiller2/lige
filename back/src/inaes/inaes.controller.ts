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
    searchComponent: "inputForCUITsSearchFromINAESFile",
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
    id: 'Apellido', 
    name: 'Apellido', 
    field: 'Apellido',
    fieldName: "per.PersonalApellido",
    type: 'string',
    searchType: "string",
    sortable: true,
    searchHidden: true,
    hidden: false,
  },
  {
    id: 'Nombre', 
    name: 'Nombre',
    field: 'Nombre',
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
    id: "Telefonos",
    name: "Teléfonos",
    field: "Telefonos",
    type: "string",
    fieldName: "tels.Telefonos",
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
    searchType: "number",
    searchComponent: "inputForCUITsSearchFromINAESFile",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: 'TipoPersona', 
    name: 'Fecha Recibo', 
    field: 'TipoPersona',
    fieldName: "",
    type: 'date',
    searchType: "string",
    sortable: true,
    searchHidden: true,
    hidden: false,
    showGridColumn: false,
  },
  {
    id: 'RazonSocial', 
    name: 'Medio Pago', 
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
    id: 'Apellido', 
    name: 'Cbu/Alias', 
    field: 'Apellido',
    fieldName: "per.PersonalApellido",
    type: 'string',
    searchType: "string",
    sortable: true,
    searchHidden: true,
    hidden: false,
  },
  {
    id: 'Nombre', 
    name: 'Retribución',
    field: 'Nombre',
    fieldName: "per.PersonalNombre",
    type: 'string',
    searchType: "string",
    sortable: true,
    searchHidden: true,
    hidden: false,
  },
  {
    id: 'PersonalSexo', 
    name: 'Excedentes',
    field: 'PersonalSexo',
    fieldName: "per.PersonalSexo",
    type: 'string',
    searchType: "string",
    sortable: true,
    searchHidden: true,
    hidden: false,
    showGridColumn: false,
  },
  {
    id: "PersonalFechaNacimiento",
    name: "Retencion Monotributo",
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
    name: 'Otras Retenciones',
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
    name: 'Detalle Otras Retenciones',
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
    name: 'Detalle de Retribucion',
    field: 'DomicilioCodigoPostal',
    fieldName: "perdom.DomicilioCodigoPostal",
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

  private async getAltasBajasQuery(queryRunner: any, filterSql: any, orderBy: any) {
    return await queryRunner.query(`
      SELECT
        per.PersonalId AS id,
        30643445510 AS CUITEntidad,
        ing.PersonalFechaIngreso,
        cuit.PersonalCUITCUILCUIT,
        'Humana' AS TipoPersona,
        'COOP DE TRABAJO LINCE SEGURIDAD LTDA' AS RazonSocial,
        LEFT(PersonalApellidoNombre, CHARINDEX(', ', PersonalApellidoNombre) - 1) AS Apellido,
        SUBSTRING(
          PersonalApellidoNombre,
          CHARINDEX(', ', PersonalApellidoNombre) + 2,
          LEN(PersonalApellidoNombre)
        ) AS Nombre,
        CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre,
        per.PersonalSexo,
        per.PersonalFechaNacimiento,
        perdom.ProvinciaDescripcion,
        perdom.LocalidadDescripcion,
        perdom.DomicilioCodigoPostal,
        perdom.Domicilio,
        TRIM(email.PersonalEmailEmail) AS PersonalEmailEmail,
        tels.Telefonos,
        per.PersonalNroLegajo,
        perdom.domCompleto,
        sitrev.PersonalSituacionRevistaSituacionId, sitrev.SituacionRevistaDescripcion
      FROM Personal per

      LEFT JOIN(
        SELECT
          a.PersonalId,
          a.ActaId,
          b.ActaFechaActa,
          b.ActaDescripcion,
          a.TipoPersonalActaCodigo,
          tip.TipoPersonalActaDescripcion
        FROM PersonalActa a
        JOIN Acta b ON b.ActaId = a.ActaId
        JOIN (
          SELECT
            a.PersonalId,
            MAX(b.ActaFechaActa) AS MaxFecha
          FROM PersonalActa a
          JOIN Acta b ON b.ActaId = a.ActaId
          WHERE a.TipoPersonalActaCodigo IN ('ALT','BAJ','REI','BD')
          GROUP BY a.PersonalId
        ) x ON x.PersonalId = a.PersonalId AND x.MaxFecha = b.ActaFechaActa
        JOIN TipoPersonalActa tip ON tip.TipoPersonalActaCodigo = a.TipoPersonalActaCodigo
        WHERE a.TipoPersonalActaCodigo IN ('ALT','BAJ','REI','BD') 
      ) act ON act.PersonalId=per.PersonalId 

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
        
      LEFT JOIN (
        SELECT t.PersonalId, STRING_AGG(TRIM(t.PersonalTelefonoNro),', ') Telefonos 
        FROM PersonalTelefono t 
        WHERE t.PersonalTelefonoInactivo = 0 OR t.PersonalTelefonoInactivo IS NULL 
        GROUP BY t.PersonalId
      ) tels ON tels.PersonalId= per.PersonalId

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
      LEFT JOIN BotRegTelefonoPersonal rt ON rt.PersonalId = per.PersonalId
      WHERE (1=1)
      AND (${filterSql})
      ${orderBy}`)
    }
  
  async getAltasBajas(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null };
      const filterSql = filtrosToSql(options.filtros, altasBajasColumns);
      const orderBy = orderToSQL(options.sort)

      const lista: any[] = await this.getAltasBajasQuery(queryRunner, filterSql, orderBy)

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