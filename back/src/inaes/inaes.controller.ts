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
import { RecibosController } from "../recibos/recibos.controller.ts";

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
    id: "SituacionRevistaDescripcion",
    name: "Situación Revista",
    field: "SituacionRevistaDescripcion",
    type: "string",
    fieldName: "sitrev.SituacionRevistaDescripcion",
    sortable: true,
    excludeFromExport: true,
  },

  {
    id: "PersonalSituacionRevistaMotivo",
    name: "Motivo",
    field: "PersonalSituacionRevistaMotivo",
    type: "string",
    fieldName: "sitrev.PersonalSituacionRevistaMotivo",
    sortable: true,
    excludeFromExport: true,
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
    showGridColumn: true,
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
    showGridColumn: true,
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
    fieldName: "CUITEntidad",
    type: 'string',
    searchType: "number",
    sortable: true,
    searchHidden: true,
    hidden: false,
    params: { exportHeader: 'Cuit Entidad' }
  },
  {
    id: "PersonalCUITCUILCUIT",
    name: "CUIT",
    field: "PersonalCUITCUILCUIT",
    type: "string",
    fieldName: "cuit.PersonalCUITCUILCUIT",
    sortable: true,
    searchHidden: true,
    hidden: false,
    params: { exportHeader: 'Cuit / Cuil / Cdi' }
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
    hidden: false,
    excludeFromExport: true,
  },
  {
    id: 'DocumentoFecha',
    name: 'Fecha Recibo',
    field: 'DocumentoFecha',
    fieldName: "doc.DocumentoFecha",
    type: 'date',
    searchType: "date",
    sortable: true,
    searchHidden: true,
    hidden: false,
    params: { exportHeader: 'Fecha Recibo (DD/MM/AAAA)' }
  },
  {
    id: 'DocumentoDenominadorDocumento',
    name: 'Número Recibo',
    field: 'DocumentoDenominadorDocumento',
    fieldName: "doc.DocumentoDenominadorDocumento",
    type: 'number',
    searchType: "number",
    sortable: true,
    searchHidden: true,
    hidden: false,
    excludeFromExport: true,
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
    params: { exportHeader: 'Medio Pago (Banco o Efectivo)' }
  },
  {
    id: 'CBU',
    name: 'CBU',
    field: 'CBU',
    fieldName: "CBU",
    type: 'string',
    searchType: "string",
    sortable: true,
    searchHidden: true,
    hidden: false,
    params: { exportHeader: 'Cbu/Alias' }
  },
  {
    id: 'SumaRetribucion',
    name: 'Retribución',
    field: 'SumaRetribucion',
    fieldName: "SumaRetribucion",
    type: 'currency',
    sortable: true,
    searchHidden: true,
    hidden: false,
    params: { exportHeader: 'Retribucion' }
  },
  {
    id: 'SumaExcedentes',
    name: 'Excedentes',
    field: 'SumaExcedentes',
    fieldName: 'SumaExcedentes',
    type: 'currency',
    sortable: true,
    searchHidden: true,
    hidden: false,
    params: { exportHeader: 'Excedentes' }
  },
  {
    id: "SumaMonotributoRetencion",
    name: "Retención Monotributo",
    field: "SumaMonotributoRetencion",
    type: "currency",
    fieldName: "",
    sortable: true,
    hidden: false,
    searchHidden: true,
    params: { exportHeader: 'Retencion Monotributo' }
  },
  {
    id: 'SumaOtrasRetenciones',
    name: 'Otras Retenciones',
    field: 'SumaOtrasRetenciones',
    fieldName: "",
    type: 'currency',
    sortable: true,
    searchHidden: false,
    hidden: false,
    params: { exportHeader: 'Otras Retenciones' }
  },
  {
    id: 'DescOtrasRetenciones',
    name: 'Detalle Otras Retenciones',
    field: 'DescOtrasRetenciones',
    fieldName: "",
    type: 'string',
    searchComponent: "",
    searchType: "string",
    sortable: true,
    searchHidden: false,
    hidden: false,
    params: { exportHeader: 'Detalle Otras Retenciones' }
  },
  {
    id: 'DescRetribucion',
    name: 'Detalle Retribución',
    field: 'DescRetribucion',
    fieldName: "",
    type: 'string',
    searchType: "string",
    sortable: true,
    searchHidden: false,
    hidden: false,
    params: { exportHeader: 'Detalle de Retribucion' }
  },
]

export class InaesController extends BaseController {

  async getColumnsAltaBajasGrid(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(altasBajasColumns, res)
  }

  async getColumnsRecibosGrid(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(recibosColumns, res)
  }

  private async getAltasBajasQuery(queryRunner: any, filterSql: any, orderBy: any, cuits: string | null) {
    let flags = '1'
    let filterCUITs = '(1=1)'
    if (cuits) {
      flags = `CASE WHEN (sitrev.PersonalSituacionRevistaSituacionId IN (2,10,12)) THEN '1' ELSE '0' END AS Estado`
      filterCUITs = `(cuit.PersonalCUITCUILCUIT IN (${cuits}) AND sitrev.PersonalSituacionRevistaSituacionId IN (3)) OR (cuit.PersonalCUITCUILCUIT NOT IN (${cuits}) AND sitrev.PersonalSituacionRevistaSituacionId IN (2,10,12))`
    }

    const ClienteIdPropio = 934
    const clientePropio = await queryRunner.query(`
      SELECT cli.ClienteId, fac.ClienteFacturacionCUIT, cli.ClienteDenominacion 
      FROM Cliente cli 
      JOIN ClienteFacturacion fac ON fac.ClienteId = cli.ClienteId
      WHERE cli.ClienteId=@0`, [ClienteIdPropio]
    )
    const CUITEntidad = clientePropio[0].ClienteFacturacionCUIT
    const RazonSocial = clientePropio[0].ClienteDenominacion


    return await queryRunner.query(`
      SELECT
        per.PersonalId AS id,
        @1 AS CUITEntidad,
        ing.PersonalFechaIngreso,
        cuit.PersonalCUITCUILCUIT,
        'Humana' AS TipoPersona,
        @2 AS RazonSocial,
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
        sitrev.PersonalSituacionRevistaSituacionId, sitrev.SituacionRevistaDescripcion, sitrev.PersonalSituacionRevistaMotivo,
        sal.SalarioMinimoVitalMovilSMVM AS CapitalSuscripto, 		  sal.SalarioMinimoVitalMovilSuscripcionInicial * sal.SalarioMinimoVitalMovilSMVM /100 AS CapitalIntegrado,
        ${flags}
      FROM Personal per

      LEFT JOIN (
        SELECT p.PersonalId, p.PersonalSituacionRevistaSituacionId, s.SituacionRevistaDescripcion, p.PersonalSituacionRevistaMotivo, p.PersonalSituacionRevistaDesde
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

      LEFT JOIN PersonalEmail email on email.PersonalId=per.PersonalId AND ISNULL(email.PersonalEmailInactivo,0)=0
		OUTER APPLY
		(
		    SELECT TOP (1) smv.SalarioMinimoVitalMovilSMVM, smv.SalarioMinimoVitalMovilSuscripcionInicial, smv.SalarioMinimoVitalMovilDesde
		    FROM SalarioMinimoVitalMovil smv
		    WHERE smv.SalarioMinimoVitalMovilDesde <= @0
		    ORDER BY smv.SalarioMinimoVitalMovilDesde DESC
		) sal

      WHERE (per.PersonalNroLegajo IS NOT NULL)
      AND (${filterSql}) AND (${filterCUITs})
      ${orderBy}`,[new Date(),CUITEntidad,RazonSocial])
  }

  async getAltasBajas(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null };

      const index = options.filtros.findIndex((p: any) => p.index === "PersonalCUITCUILCUIT");
      let CUITs: string = null
      if (index !== -1) {
        let CUITsFromFile: any = null;
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

  async getRecibos(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const recibosController = new RecibosController()
      const periodo: Date | null = req.body.periodo ? new Date(req.body.periodo) : null
      if (!periodo) throw new ClientException('Ingrese un Periodo')

      const anio = periodo.getFullYear()
      const mes = periodo.getMonth() + 1

      const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null };
      const filterSql = filtrosToSql(options.filtros, altasBajasColumns);
      const orderBy = orderToSQL(options.sort)
      //TODO: Mover a Parametro de Configuracion
      const ClienteIdPropio = 934
      const clientePropio = await queryRunner.query(`
        SELECT cli.ClienteId, fac.ClienteFacturacionCUIT 
        FROM Cliente cli 
        JOIN ClienteFacturacion fac ON fac.ClienteId = cli.ClienteId
        WHERE cli.ClienteId=@0`, [ClienteIdPropio]
      )
      const CUITEntidad = clientePropio[0].ClienteFacturacionCUIT

      const movimientosRecibos = await recibosController.getListaRecibosGenerados(queryRunner, filterSql, orderBy, anio, mes, 'G')
      movimientosRecibos
      .map((mov: any) => {
        mov.CUITEntidad = CUITEntidad
        mov.CBU = mov.CBU ? mov.CBU : ''
        //mov.DescRetribucion = mov.DescRetribucion ? mov.DescRetribucion : 'N/D'
        mov.DescRetribucion = mov.DescRetribucion ? `Por tareas realizadas durante el periodo ${mes}/${anio}.  Asociado: ${mov.PersonalNroLegajo}` : 'N/D' 
        mov.DescOtrasRetenciones = mov.DescOtrasRetenciones ? mov.DescOtrasRetenciones : 'N/D'
      })

      //const lista: any[] = await this.getRecibosQuery(queryRunner, filterSql, orderBy,periodo.getFullYear(), periodo.getMonth()+1)
      //console.log('movimientosRecibos', movimientosRecibos.length)
      const lista = movimientosRecibos.filter((mov: any) => mov.SumaRetiros >0 && mov.PersonalNroLegajo)

      this.jsonRes(lista, res);
    } catch (error) {
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async getCUITsByINAESFile(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);
    const file: any[] = req.body.file
    try {
      await queryRunner.startTransaction()
      if (!file.length) throw new ClientException("Debes de ingresar un archivo");
      const CUITs: string[] = await this.getCUITsByFile(file[0].tempfilename)

      await queryRunner.commitTransaction()
      this.jsonRes({ cuits: CUITs, length: CUITs.length }, res);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async getCUITsByFile(tempfilename: any) {
    let CUITs: any[] = []
    const loadingTask = getDocument(`${process.env.PATH_DOCUMENTS}/temp/${tempfilename}`)
    const document = await loadingTask.promise;//Error
    for (let pagenum = 1; pagenum <= document.numPages; pagenum++) {
      const page = await document.getPage(pagenum);
      const textContent = await page.getTextContent();

      for (let index = 0; index < textContent.items.length - 6; index++) { // Para no recorrer el Pie de Pagina -6
        const item: any = textContent.items[index];
        if (item.str == '' || item.str == ' ') continue
        if (item.str.length == 11 && !isNaN(item.str)) CUITs.push(item.str)
      }

    }
    return CUITs

  }
}