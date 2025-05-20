import { BaseController, ClientException } from "./baseController";
import { PersonaObj } from "../schemas/personal.schemas";
import { dataSource } from "../data-source";
import { Response } from "express-serve-static-core";
import { NextFunction } from "express";
import { mkdirSync, renameSync, existsSync } from "fs";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";
import { isObject, promisify } from 'util';
import * as fs from 'fs';
import { FileUploadController } from "../controller/file-upload.controller"

const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);

const columns: any[] = [
  {
    id: "id",
    name: "id",
    field: "id",
    type: "number",
    fieldName: "per.PersonalId",
    sortable: true,
    searchHidden: true,
    hidden: true,
  },
  {
    id: "PersonalId",
    name: "PersonalId",
    field: "PersonalId",
    type: "number",
    fieldName: "per.PersonalId",
    sortable: true,
    searchHidden: true,
    hidden: true,
  },
  {
    id: "PersonalCUITCUILCUIT",
    name: "CUIT",
    field: "PersonalCUITCUILCUIT",
    type: "string",
    fieldName: "cuit.PersonalCUITCUILCUIT",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: "ApellidoNombre",
    name: "Apellido Nombre",
    field: "ApellidoNombre",
    type: "string",
    fieldName: "per.PersonalId",
    searchComponent: "inpurForPersonalSearch",
    searchType: "number",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: "PersonalNroLegajo",
    name: "Nro Asociado",
    field: "PersonalNroLegajo",
    type: "string",
    fieldName: "per.PersonalNroLegajo",
    searchType: "number",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: "SucursalId",
    name: "SucursalId",
    field: "SucursalId",
    type: "string",
    fieldName: "suc.SucursalId",
    searchType: "number",
    sortable: true,
    searchHidden: true,
    hidden: true,
  },
  {
    id: "SucursalDescripcion",
    name: "Sucursal",
    field: "SucursalDescripcion",
    type: "string",
    fieldName: "suc.SucursalDescripcion",
    searchType: "string",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: "SituacionRevistaId",
    name: "Situacion Revista",
    field: "SituacionRevistaId",
    type: "number",
    fieldName: "sitrev.PersonalSituacionRevistaSituacionId",
    searchComponent: "inpurForSituacionRevistaSearch",
    searchType: "number",
    sortable: true,
    searchHidden: false,
    hidden: true,
  },
  {
    id: "SituacionRevistaDescripcion",
    name: "Situación Revista",
    field: "SituacionRevistaDescripcion",
    type: "string",
    fieldName: "sitrev.SituacionRevistaDescripcion",
    searchType: "string",
    sortable: true,
    searchHidden: true,
    hidden: false,
  },
  {
    id: "PersonalSituacionRevistaDesde",
    name: "Fecha desde Situación",
    field: "PersonalSituacionRevistaDesde",
    type: "date",
    fieldName: "sitrev.PersonalSituacionRevistaDesde",
    searchType: "date",
    searchComponent: "inpurForFechaSearch",
    sortable: true,
    searchHidden: false,
    hidden: false,
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
    id: "PersonalFechaIngreso",
    name: "Fecha Ingreso",
    field: "PersonalFechaIngreso",
    type: "date",
    fieldName: "per.PersonalFechaIngreso",
    searchType: "date",
    searchComponent: "inpurForFechaSearch",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
]


export class PersonalController extends BaseController {
  private listSitRev = process.env.SITREV_AUTOMATIC ? process.env.SITREV_AUTOMATIC : '9,10,16,18,23,28'
  async getPersonalMonotributo(req: any, res: Response, next: NextFunction) {
    const personalId = req.params.personalId;
    const anio = req.params.anio;
    const mes = req.params.mes;

    try {
      const result = await dataSource.query(
        `SELECT
        per.PersonalId PersonalId, cuit2.PersonalCUITCUILCUIT AS CUIT, CONCAT(TRIM(per.PersonalApellido), ',', TRIM(per.PersonalNombre)) ApellidoNombre,
        com.PersonalComprobantePagoAFIPAno,com.PersonalComprobantePagoAFIPMes,com.PersonalComprobantePagoAFIPImporte,
        ga.GrupoActividadId, ga.GrupoActividadNumero, ga.GrupoActividadDetalle, gap.GrupoActividadPersonalDesde,
        1
        FROM Personal per
        JOIN PersonalComprobantePagoAFIP com ON com.PersonalId=per.PersonalId AND com.PersonalComprobantePagoAFIPAno = @1 AND com.PersonalComprobantePagoAFIPMes = @2
        LEFT JOIN PersonalCUITCUIL cuit2 ON cuit2.PersonalId = per.PersonalId AND cuit2.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)
        LEFT JOIN (
		  		SELECT TOP 1 gap.GrupoActividadId, gap.GrupoActividadPersonalPersonalId PersonalId, gap.GrupoActividadPersonalDesde FROM GrupoActividadPersonal gap WHERE gap.GrupoActividadPersonalPersonalId = @0 AND EOMONTH(DATEFROMPARTS(@1,@2,1)) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31') ORDER BY gap.GrupoActividadPersonalDesde DESC
		    ) gap ON gap.PersonalId = per.PersonalId
        LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId
        WHERE per.PersonalId = @0`,
        [personalId, anio, mes]
      );

      this.jsonRes(result, res);
    } catch (error) {
      return next(error)
    }
  }

  async getNameFromId(PersonalId, res: Response, next: NextFunction) {
    try {
      const result = await dataSource.query(
        `SELECT per.PersonalId personalId, cuit.PersonalCUITCUILCUIT cuit,
      per.PersonalNombre nombre, per.PersonalApellido apellido
      FROM Personal per
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      WHERE per.PersonalId = @0`,
        [PersonalId]
      );

      const info = result[0];
      this.jsonRes(info, res);
    } catch (error) {
      return next(error)
    }
  }

  async getPersonalResponsables(req: any, res: Response, next: NextFunction) {
    const personalId = req.params.personalId;
    const anio = req.params.anio;
    const mes = req.params.mes;

    try {
      const responsables = await dataSource.query(
        `
        SELECT 1 AS ord, gap.GrupoActividadPersonalPersonalId as id, 'Grupo' tipo,
        ga.GrupoActividadId AS id, CONCAT (ga.GrupoActividadNumero, ' ',ga.GrupoActividadDetalle) AS detalle, gap.GrupoActividadPersonalDesde AS desde , gap.GrupoActividadPersonalHasta hasta,
          1
          
          FROM GrupoActividadPersonal gap
        JOIN GrupoActividad ga ON ga.GrupoActividadId = gap.GrupoActividadId
        WHERE gap.GrupoActividadPersonalPersonalId=@0 AND EOMONTh(DATEFROMPARTS(@1,@2,1)) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,1) <  ISNULL(gap.GrupoActividadPersonalHasta, '9999-12-31')
    AND gap.GrupoActividadPersonalPersonalId = @0
    UNION
    SELECT 3, gap.GrupoActividadPersonalPersonalId, 'Supervisor' tipo,
        per.PersonalId, CONCAT(TRIM(per.PersonalApellido),', ',TRIM(per.PersonalNombre)) AS ApellidoNombre, gaj.GrupoActividadJerarquicoDesde AS desde , gaj.GrupoActividadJerarquicoHasta hasta,
          1
          
          FROM GrupoActividadPersonal gap
        LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId
        LEFT JOIN GrupoActividadJerarquico gaj ON gaj.GrupoActividadId = ga.GrupoActividadId AND EOMONTh(DATEFROMPARTS(@1,@2,1)) >   gaj.GrupoActividadJerarquicoDesde  AND DATEFROMPARTS(@1,@2,1) <  ISNULL(gaj.GrupoActividadJerarquicoHasta,'9999-12-31') AND gaj.GrupoActividadJerarquicoComo = 'J'
        JOIN Personal per ON per.PersonalId = gaj.GrupoActividadJerarquicoPersonalId
        WHERE gap.GrupoActividadPersonalPersonalId=@0 AND EOMONTh(DATEFROMPARTS(@1,@2,1)) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,1) <  ISNULL(gap.GrupoActividadPersonalHasta, '9999-12-31')
    AND gap.GrupoActividadPersonalPersonalId = @0
    
    
    UNION
    SELECT 4, gap.GrupoActividadPersonalPersonalId, 'Administrador' tipo,
        per.PersonalId, CONCAT(TRIM(per.PersonalApellido),', ',TRIM(per.PersonalNombre)) AS ApellidoNombre, gaj.GrupoActividadJerarquicoDesde AS desde , gaj.GrupoActividadJerarquicoHasta hasta,
          1
          
          FROM GrupoActividadPersonal gap
        LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId
        LEFT JOIN GrupoActividadJerarquico gaj ON gaj.GrupoActividadId = ga.GrupoActividadId AND EOMONTh(DATEFROMPARTS(@1,@2,1)) >   gaj.GrupoActividadJerarquicoDesde  AND DATEFROMPARTS(@1,@2,1) <  ISNULL(gaj.GrupoActividadJerarquicoHasta,'9999-12-31') AND gaj.GrupoActividadJerarquicoComo = 'A'
        JOIN Personal per ON per.PersonalId = gaj.GrupoActividadJerarquicoPersonalId
        WHERE gap.GrupoActividadPersonalPersonalId=@0 AND EOMONTh(DATEFROMPARTS(@1,@2,1)) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,1) <  ISNULL(gap.GrupoActividadPersonalHasta, '9999-12-31')
    AND gap.GrupoActividadPersonalPersonalId = @0
    ORDER BY ord
    
    
        `,

        [personalId, anio, mes]
      );
      this.jsonRes(responsables, res);
    } catch (error) {
      return next(error)
    }
  }

  async getPersonalSitRevista(req: any, res: Response, next: NextFunction) {
    const personalId = req.params.personalId;
    const anio = req.params.anio;
    const mes = req.params.mes;
    const stmactual = new Date()

    try {
      const responsables = await dataSource.query(
        `SELECT DISTINCT sitrev.PersonalSituacionRevistaDesde, sitrev.PersonalSituacionRevistaHasta, sit.*, ISNULL(sitrev.PersonalSituacionRevistaHasta,'9999-12-31') hastafull
        FROM Personal per
        JOIN PersonalSituacionRevista sitrev ON sitrev.PersonalId = per.PersonalId AND ((DATEPART(YEAR,sitrev.PersonalSituacionRevistaDesde)=@1 AND  DATEPART(MONTH, sitrev.PersonalSituacionRevistaDesde)=@2) OR (DATEPART(YEAR,sitrev.PersonalSituacionRevistaHasta)=@1 AND  DATEPART(MONTH, sitrev.PersonalSituacionRevistaHasta)=@2) OR (sitrev.PersonalSituacionRevistaDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND ISNULL(sitrev.PersonalSituacionRevistaHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1)))
        LEFT JOIN SituacionRevista sit ON sit.SituacionRevistaId = sitrev.PersonalSituacionRevistaSituacionId
        WHERE per.PersonalId=@0
        ORDER BY sitrev.PersonalSituacionRevistaDesde, hastafull`, [personalId, anio, mes])

      this.jsonRes(responsables, res);
    } catch (error) {
      return next(error)
    }
  }

  async getById(PersonalId: string, res: Response, next: NextFunction) {
    const fechaActual = new Date();
    //    const dia = fechaActual.getDate();
    const mes = fechaActual.getMonth() + 1; // Agrega 1 porque los meses se indexan desde 0 (0 = enero)
    const anio = fechaActual.getFullYear();
    const mails = await dataSource.query('SELECT ema.PersonalEmailEmail, ema.PersonalId FROM PersonalEmail ema WHERE ema.PersonalEmailInactivo <> 1 AND ema.PersonalId=@0', [PersonalId])
    const estudios = await dataSource.query(`SELECT TOP 1 tip.TipoEstudioId, tip.TipoEstudioDescripcion, est.PersonalEstudioTitulo, est.PersonalEstudioOtorgado FROM PersonalEstudio est 
      JOIN TipoEstudio tip ON tip.TipoEstudioId = est.TipoEstudioId
      WHERE est.PersonalId=@0 AND est.EstadoEstudioId = 2
      ORDER BY tip.TipoEstudioId DESC `, [PersonalId])
    dataSource
      .query(
        `SELECT TOP 1 per.PersonalId, cuit.PersonalCUITCUILCUIT, foto.DocumentoImagenFotoBlobNombreArchivo, categ.CategoriaPersonalDescripcion, cat.PersonalCategoriaId,
        per.PersonalNombre, per.PersonalApellido, per.PersonalFechaNacimiento, per.PersonalFechaIngreso, per.PersonalNroLegajo,per.PersonalFotoId,
        TRIM(CONCAT(
          TRIM(dom.PersonalDomicilioDomCalle), ' ',
          TRIM(dom.PersonalDomicilioDomNro), ' ',
          TRIM(dom.PersonalDomicilioDomPiso), ' ',
          TRIM(dom.PersonalDomicilioDomDpto), ' (',
          TRIM(dom.PersonalDomicilioCodigoPostal), ') ',
          TRIM(loc.LocalidadDescripcion), ' ',
          IIF((loc.LocalidadDescripcion!=pro.ProvinciaDescripcion),TRIM(pro.ProvinciaDescripcion),''), ' '
        )) AS DomicilioCompleto,
        act.GrupoActividadNumero,
        act.GrupoActividadDetalle,
        suc.SucursalDescripcion
        FROM Personal per
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
        LEFT JOIN DocumentoImagenFoto foto ON foto.PersonalId = per.PersonalId AND  foto.DocumentoImagenFotoId = per.PersonalFotoId
        LEFT JOIN PersonalCategoria cat ON cat.PersonalCategoriaPersonalId = per.PersonalId AND cat.PersonalCategoriaId = per.PersonalCategoriaUltNro
        LEFT JOIN CategoriaPersonal categ ON categ.TipoAsociadoId = cat.PersonalCategoriaTipoAsociadoId AND categ.CategoriaPersonalId = cat.PersonalCategoriaCategoriaPersonalId
        LEFT JOIN PersonalDomicilio AS dom ON dom.PersonalId = per.PersonalId AND dom.PersonalDomicilioActual = 1 AND dom.PersonalDomicilioId = ( SELECT MAX(dommax.PersonalDomicilioId) FROM PersonalDomicilio dommax WHERE dommax.PersonalId = per.PersonalId AND dom.PersonalDomicilioActual = 1)
        LEFT JOIN Localidad loc ON loc.LocalidadId  =  dom.PersonalDomicilioLocalidadId AND loc.PaisId = dom.PersonalDomicilioPaisId AND loc.ProvinciaId = dom.PersonalDomicilioProvinciaId
        LEFT JOIN Provincia pro ON pro.ProvinciaId  =  dom.PersonalDomicilioProvinciaId AND pro.PaisId = dom.PersonalDomicilioPaisId
        LEFT JOIN PersonalSucursalPrincipal sucper ON sucper.PersonalId = per.PersonalId AND sucper.PersonalSucursalPrincipalId = (SELECT MAX(a.PersonalSucursalPrincipalId) PersonalSucursalPrincipalId FROM PersonalSucursalPrincipal a WHERE a.PersonalId = per.PersonalId)
        LEFT JOIN Sucursal suc ON suc.SucursalId=sucper.PersonalSucursalPrincipalSucursalId
        
        LEFT JOIN (SELECT grp.GrupoActividadPersonalPersonalId, MAX(grp.GrupoActividadPersonalDesde) AS GrupoActividadPersonalDesde, MAX(ISNULL(grp.GrupoActividadPersonalHasta,'9999-12-31')) GrupoActividadPersonalHasta FROM GrupoActividadPersonal AS grp WHERE EOMONTH(DATEFROMPARTS(@1,@2,1)) > grp.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(grp.GrupoActividadPersonalHasta, '9999-12-31') GROUP BY grp.GrupoActividadPersonalPersonalId) as grupodesde ON grupodesde.GrupoActividadPersonalPersonalId = per.PersonalId
        LEFT JOIN GrupoActividadPersonal grupo ON grupo.GrupoActividadPersonalPersonalId = per.PersonalId AND grupo.GrupoActividadPersonalDesde = grupodesde.GrupoActividadPersonalDesde AND ISNULL(grupo.GrupoActividadPersonalHasta,'9999-12-31') = grupodesde.GrupoActividadPersonalHasta 
        LEFT JOIN GrupoActividad act ON act.GrupoActividadId= grupo.GrupoActividadId

        WHERE per.PersonalId = @0`,
        [PersonalId, anio, mes]
      )
      .then(async (records: Array<PersonaObj>) => {
        if (records.length == 0) throw new ClientException("No se localizó la persona");

        let FechaHasta = new Date();
        FechaHasta.setFullYear(FechaHasta.getFullYear() + 1);

        const personaData = records[0];
        personaData.NRO_EMPRESA = process.env.NRO_EMPRESA_PBA
          ? process.env.NRO_EMPRESA_PBA
          : "";
        //        personaData.PersonalCUITCUILCUIT = (personaData.PersonalCUITCUILCUIT) ? `${personaData.PersonalCUITCUILCUIT}` : "Sin registrar"
        personaData.PersonalCUITCUILCUIT =
          personaData.PersonalCUITCUILCUIT != null
            ? personaData.PersonalCUITCUILCUIT
            : "";
        personaData.DNI =
          String(personaData.PersonalCUITCUILCUIT).length > 10
            ? String(personaData.PersonalCUITCUILCUIT).substring(2, 10)
            : "";
        personaData.FechaDesde = new Date();
        personaData.FechaHasta = FechaHasta;

        personaData.mails = mails;
        personaData.estudios = (estudios[0]) ? `${String(estudios[0].TipoEstudioDescripcion).trim()} ${String(estudios[0].PersonalEstudioTitulo).trim()}` : 'Sin registro'
        this.jsonRes(personaData, res);
      })
      .catch((error) => {
        return next(error)
      });
  }

  async getTelefonosPorPersona(PersonalId: string, res: Response, next: NextFunction) {
    try {
      const result = await dataSource.query(
        `SELECT tel.PersonalId, tip.TipoTelefonoDescripcion, tel.PersonalTelefonoNro
        FROM PersonalTelefono tel 
        JOIN TipoTelefono tip ON tip.TipoTelefonoId = tel.TipoTelefonoId
        WHERE (tel.PersonalTelefonoInactivo IS NULL OR tel.PersonalTelefonoInactivo =0) AND tel.PersonalId=@0`,
        [PersonalId]
      );

      this.jsonRes(result, res);
    } catch (error) {
      return next(error)
    }
  }

  async getCuentasBancoPorPersona(PersonalId: string, res: Response, next: NextFunction) {
    try {
      const stmactual = new Date();
      const result = await dataSource.query(
        `SELECT cue.PersonalId, ban.BancoDescripcion, cue.PersonalBancoCBU, cue.PersonalBancoDesde, cue.PersonalBancoHasta
        FROM PersonalBanco cue
        JOIN Banco ban ON ban.BancoId = cue.PersonalBancoBancoId
        WHERE cue.PersonalBancoDesde <= @1 AND ISNULL(cue.PersonalBancoHasta,'9999-12-31')>= @1 AND cue.PersonalId=@0`,
        [PersonalId, stmactual]
      )
      result.map((cuenta: any) => { cuenta.PersonalBancoCBU = cuenta.PersonalBancoCBU.slice(0, -6) + 'XXXXXX' })
      this.jsonRes(result, res);
    } catch (error) {
      return next(error)
    }
  }


  search(req: any, res: Response, next: NextFunction) {
    const { fieldName, value } = req.body;

    let buscar = false;
    let query: string = `SELECT per.PersonalId, CONCAT(TRIM(per.PersonalApellido) , ', ', TRIM(per.PersonalNombre), ' CUIT:' , cuit.PersonalCUITCUILCUIT) fullName, ISNULL(sucper.PersonalSucursalPrincipalSucursalId,1) SucursalId 
    FROM dbo.Personal per 
    LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)
    LEFT JOIN PersonalSucursalPrincipal sucper ON sucper.PersonalId = per.PersonalId AND sucper.PersonalSucursalPrincipalId = (SELECT MAX(a.PersonalSucursalPrincipalId) PersonalSucursalPrincipalId FROM PersonalSucursalPrincipal a WHERE a.PersonalId = per.PersonalId)

    WHERE`;
    switch (fieldName) {
      case "Nombre":
        const valueArray: Array<string> = value.split(/[\s,.]+/);
        valueArray.forEach((element, index) => {
          if (element.trim().length > 1) {
            query += `(per.PersonalNombre LIKE '%${element.trim()}%' OR per.PersonalApellido LIKE '%${element.trim()}%') AND `;
            buscar = true;
          }
        });
        break;
      case "CUIT":
        if (value.trim().length > 1) {
          query += ` cuit.PersonalCUITCUILCUIT LIKE '%${value.trim()}%' AND `;
          buscar = true;
        }
        break;
      case "PersonalId":
        if (value > 0) {
          query += ` per.PersonalId = '${value}' AND `;
          buscar = true;
        }
        break;
      default:
        break;
    }

    if (buscar == false) {
      this.jsonRes({ recordsArray: [] }, res);
      return;
    }

    dataSource
      .query((query += " 1=1"))
      .then((records) => {
        this.jsonRes({ recordsArray: records }, res);
      })
      .catch((error) => {
        return next(error)
      });
  }
  async execProcedure(someParam: number) {
    /*
        const result = await this.connection.query(
          'EXEC procedures.MyProcedure @0', [someParam]
        );
        */
    // ... do something with the result
  }

  async getGridColumns(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(columns, res)
  }

  private async listPersonalQuery(queryRunner: any, filterSql: any, orderBy: any) {
    return await queryRunner.query(`
SELECT 
CONCAT(per.PersonalId,'-',sitrev.PersonalSituacionRevistaSituacionId) id,
per.PersonalId,
cuit.PersonalCUITCUILCUIT,
        CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre,
        per.PersonalNroLegajo, suc.SucursalId , TRIM(suc.SucursalDescripcion) AS SucursalDescripcion,
        sitrev.SituacionRevistaDescripcion,
        sitrev.PersonalSituacionRevistaDesde,
        per.PersonalFechaIngreso,
        tels.Telefonos

        FROM Personal per
        LEFT JOIN (
          SELECT p.PersonalId, p.PersonalSituacionRevistaSituacionId, s.SituacionRevistaDescripcion,p.PersonalSituacionRevistaDesde
          FROM PersonalSituacionRevista p
          JOIN SituacionRevista s
          ON p.PersonalSituacionRevistaSituacionId = s.SituacionRevistaId AND p.PersonalSituacionRevistaDesde <= GETDATE() AND ISNULL(p.PersonalSituacionRevistaHasta,'9999-12-31') >= CAST(GETDATE() AS DATE)
			 ) sitrev ON sitrev.PersonalId = per.PersonalId
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 

        LEFT JOIN PersonalSucursalPrincipal sucper ON sucper.PersonalId = per.PersonalId AND sucper.PersonalSucursalPrincipalId = (SELECT MAX(a.PersonalSucursalPrincipalId) PersonalSucursalPrincipalId FROM PersonalSucursalPrincipal a WHERE a.PersonalId = per.PersonalId)
        LEFT JOIN Sucursal suc ON suc.SucursalId=sucper.PersonalSucursalPrincipalSucursalId

        LEFT JOIN ( SELECT t.PersonalId, STRING_AGG(TRIM(t.PersonalTelefonoNro),', ') Telefonos FROM PersonalTelefono t WHERE t.PersonalTelefonoInactivo =0 OR t.PersonalTelefonoInactivo IS null GROUP BY t.PersonalId
            ) tels ON tels.PersonalId= per.PersonalId

        WHERE (1=1)
        AND (${filterSql})
        ${orderBy}`)
  }

  async getGridList(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction()

      const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null };
      const filterSql = filtrosToSql(options.filtros, columns);
      const orderBy = orderToSQL(options.sort)

      const lista: any[] = await this.listPersonalQuery(queryRunner, filterSql, orderBy)

      await queryRunner.commitTransaction()
      this.jsonRes(lista, res);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async getListFull(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction()

      const lista: any[] = await queryRunner.query(`SELECT PersonalId, personalApellidoNombre, personalApellidoNombre as label, PersonalId as value FROM personal`)

      await queryRunner.commitTransaction()
      this.jsonRes(lista, res);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  private async getSituacionRevistaQuery(queryRunner: any) {
    return await queryRunner.query(`
        SELECT sit.SituacionRevistaId value, TRIM(sit.SituacionRevistaDescripcion) label
        FROM SituacionRevista sit`)
  }

  async getSituacionRevista(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await this.getSituacionRevistaQuery(queryRunner)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

  private async addPersonalQuery(
    queryRunner: any,
    NroLegajo: number,
    Apellido: string,
    Nombre: string,
    now: Date,
    FechaIngreso: Date,
    FechaNacimiento: Date,
    NacionalidadId: number,
    EstadoCivilId: number,
    SucusalId: number,
    CUIT: number,
    LeyNro: number
  ) {
    Nombre = Nombre.toUpperCase()
    Apellido = Apellido.toUpperCase()
    const fullname: string = Apellido + ', ' + Nombre
    const ApellidoNombreDNILegajo = `${Apellido}, ${Nombre} (CUIT ${CUIT} - Leg.:${NroLegajo})`
    let newId = await queryRunner.query(`
      INSERT INTO Personal (
      PersonalClasePersonal,
      PersonalNroLegajo,
      PersonalApellido,
      PersonalNombre,
      PersonalApellidoNombre,
      PersonalFechaSolicitudIngreso,
      PersonalFechaSolicitudAceptada,
      PersonalFechaPreIngreso,
      PersonalFechaIngreso,
      PersonalFechaNacimiento,
      PersonalNacionalidadId,
      PersonalSucursalIngresoSucursalId,
      PersonalSuActualSucursalPrincipalId,
      PersonalApellidoNombreDNILegajo,
      PersonalCUITCUILUltNro,
      PersonalLeyNro,
      EstadoCivilId
      )
      VALUES (@0,@1,@2,@3,@4,@5,@5,@6,@6,@7,@8,@9,@9,@10,@11,@12,@13)
      
      SELECT MAX(PersonalId) id FROM Personal
      `, [
      'A',
      NroLegajo,
      Apellido,
      Nombre,
      fullname,
      now,
      FechaIngreso,
      FechaNacimiento,
      NacionalidadId,
      SucusalId,
      ApellidoNombreDNILegajo,
      1,
      LeyNro,
      EstadoCivilId
    ])
    // console.log('newId:',newId);
    let PersonalId = newId[0].id
    return PersonalId
  }

  private async addPersonalCUITQuery(queryRunner: any, personaId: any, CUIT: number, now: Date) {
    const PersonalCUITCUIL = await queryRunner.query(`
      SELECT ISNULL(PersonalCUITCUILUltNro, 0) PersonalCUITCUILUltNro
      FROM Personal
      WHERE PersonalId IN (@0)`,
      [personaId]
    )
    const newPersonalCUITCUILId = PersonalCUITCUIL[0].PersonalCUITCUILUltNro + 1
    await queryRunner.query(`
      INSERT INTO PersonalCUITCUIL (
      PersonalId,
      PersonalCUITCUILId,
      PersonalCUITCUILEs,
      PersonalCUITCUILCUIT,
      PersonalCUITCUILDesde
      )
      VALUES (@0, @1, @2, @3, @4)

      UPDATE Personal SET 
      PersonalCUITCUILUltNro = @1
      WHERE PersonalId IN (@0)`,
      [personaId, newPersonalCUITCUILId, 'T', CUIT, now]
    )
  }


  private async addPersonalDocumentoQuery(queryRunner: any, personaId: any, DNI: number) {
    const PersonalDocumento = await queryRunner.query(`
      SELECT ISNULL(PersonalDocumentoUltNro, 0) PersonalDocumentoUltNro
      FROM Personal
      WHERE PersonalId IN (@0)`,
      [personaId]
    )
    const newPersonalDocumentoId = PersonalDocumento[0].PersonalDocumentoUltNro + 1
    await queryRunner.query(`
      INSERT INTO PersonalDocumento (
      PersonalDocumentoId,
      PersonalId,
      TipoDocumentoId,
      PersonalDocumentoNro
      )
      VALUES (@0, @1, @2, @3)
      
      UPDATE Personal SET
      PersonalDocumentoUltNro = @0
      WHERE PersonalId IN (@1)`,
      [newPersonalDocumentoId, personaId, 1, DNI]
    )
  }
  private async updateSucursalPrincipal(queryRunner: any, personaId: any, PersonalSucursalPrincipalSucursalId: number) {
    const actual = new Date()
    actual.setHours(0, 0, 0, 0)
    const res = await queryRunner.query(`
      SELECT TOP 1 PersonalSucursalPrincipalSucursalId
      FROM PersonalSucursalPrincipal
      WHERE PersonalId =@0 ORDER BY PersonalSucursalPrincipalUltimaActualizacion DESC, PersonalSucursalPrincipalId  DESC `,
      [personaId]
    )
    console.log('original, nueva', res[0]?.PersonalSucursalPrincipalSucursalId, PersonalSucursalPrincipalSucursalId)
    if (res.length == 0 || res[0]?.PersonalSucursalPrincipalSucursalId != PersonalSucursalPrincipalSucursalId) {
      await queryRunner.query(`
      INSERT INTO PersonalSucursalPrincipal (PersonalId, PersonalSucursalPrincipalUltimaActualizacion, PersonalSucursalPrincipalSucursalId)
      VALUES (@0, @1, @2)`,
        [personaId, actual, PersonalSucursalPrincipalSucursalId]
      )
    }
  }

  async addPersonal(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    let Nombre: string = req.body.Nombre
    let Apellido: string = req.body.Apellido
    const CUIT: number = req.body.CUIT
    const NroLegajo: number = req.body.NroLegajo
    const SucursalId: number = req.body.SucursalId
    const Email = req.body.Email
    let FechaIngreso: Date = req.body.FechaIngreso ? new Date(req.body.FechaIngreso) : null
    let FechaNacimiento: Date = req.body.FechaNacimiento ? new Date(req.body.FechaNacimiento) : null
    const foto = req.body.Foto
    const NacionalidadId: number = req.body.NacionalidadId
    const EstadoCivilId: number = req.body.EstadoCivilId
    const LeyNro: number = req.body.LeyNro
    const docFrente = req.body.docFrente
    const docDorso = req.body.docDorso
    const telefonos = req.body.telefonos
    const estudios = req.body.estudios
    const familiares = req.body.familiares
    const actas = req.body.actas
    const habilitacion: number[] = (req.body.habilitacion) ? req.body.habilitacion : []
    const beneficiarios = req.body.beneficiarios
    let errors: string[] = []
    let now = new Date()
    now.setHours(0, 0, 0, 0)
    FechaIngreso?.setHours(0, 0, 0, 0)
    FechaNacimiento?.setHours(0, 0, 0, 0)

    try {
      await queryRunner.startTransaction()
      const usuario = res.locals.userName
      const usuarioId = await this.getUsuarioId(res, queryRunner)
      const ip = this.getRemoteAddress(req)

      const valForm = this.valPersonalForm(req.body, 'I')
      if (valForm instanceof ClientException)
        throw valForm

      if (NroLegajo) {
        let validacionNroLegajo = await queryRunner.query(`
          SELECT per.PersonalId
          FROM Personal per
          WHERE per.PersonalNroLegajo IN (@0)
        `, [NroLegajo])
        if (validacionNroLegajo.length) {
          errors.push(`El NroLegajo esta en uso.`);
        }
      }

      let validacionCUIT = await queryRunner.query(`
        SELECT cuit.PersonalId
        FROM PersonalCUITCUIL cuit 
        WHERE cuit.PersonalCUITCUILCUIT IN (@0)
      `, [CUIT])
      if (validacionCUIT.length) {
        errors.push(`El CUIT ya fue registrado.`);
      }

      if (errors.length)
        throw new ClientException(errors)


      const PersonalId = await this.addPersonalQuery(
        queryRunner, NroLegajo, Apellido, Nombre, now, FechaIngreso, FechaNacimiento, NacionalidadId, EstadoCivilId, SucursalId, CUIT, LeyNro
      )

      if (Number.isNaN(PersonalId)) {
        throw new ClientException('No se pudo generar un identificador.')
      }

      await this.addPersonalCUITQuery(queryRunner, PersonalId, CUIT, now)

      const DNI = parseInt(CUIT.toString().slice(2, -1))
      await this.addPersonalDocumentoQuery(queryRunner, PersonalId, DNI)

      await this.updatePersonalDomicilio(queryRunner, PersonalId, req.body)

      await this.updatePersonalEmail(queryRunner, PersonalId, Email)

      await this.updateSucursalPrincipal(queryRunner, PersonalId, SucursalId)

      //Telefonos
      for (const telefono of telefonos) {
        if (telefono.TelefonoNro) {
          if (!telefono.TipoTelefonoId) {
            errors.push(`El campo Tipo de la seccion Telefono No pueden estar vacios.`)
            break
          }

          await this.addPersonalTelefono(queryRunner, telefono, PersonalId)
        }
      }

      //Estudios
      for (const estudio of estudios) {
        if (estudio.EstudioTitulo) {
          if (!estudio.TipoEstudioId || !estudio.EstadoEstudioId) {
            errors.push(`Los campos Tipo y Estados de la seccion Estudios No pueden estar vacios.`)
            break
          }
          await this.addPersonalEstudio(queryRunner, estudio, PersonalId)
        }
      }
      if (errors.length) throw new ClientException(errors)

      //Familiares
      const updatePersonalFamilia = await this.updatePersonalFamilia(queryRunner, PersonalId, familiares)
      if (updatePersonalFamilia instanceof ClientException)
        throw updatePersonalFamilia

      //Beneficiario
      const setPersonalSeguroBeneficiario = await this.setPersonalSeguroBeneficiario(queryRunner, PersonalId, beneficiarios, usuario, ip)
      if (setPersonalSeguroBeneficiario instanceof ClientException)
        throw setPersonalSeguroBeneficiario

      //Situacion de Revista
      await this.setSituacionRevistaQuerys(queryRunner, PersonalId, req.body.SituacionId, now, req.body.Motivo)

      //Habilitacion necesaria
      await this.setPersonalHabilitacionNecesaria(queryRunner, PersonalId, habilitacion, usuarioId, ip)

      //Actas
      const valActas = await this.setActasQuerys(queryRunner, PersonalId, actas)
      if (valActas instanceof ClientException)
        throw valActas

      console.log("file....", foto[0])
      //throw new ClientException('test.')
     // let  resultFile = await FileUploadController.handleDOCUpload(
       // PersonalId, 
        //file.objetivo_id, 
        //file.cliente_id, 
        //file.id, 
        //new Date(), 
        //fec_doc_ven, 
        //file.den_documento, 
        //file, 
        //usuario,
        //ip,
        //queryRunner)


      if (foto && foto.length) await this.setFoto(queryRunner, PersonalId, foto[0])

      if (docFrente && docFrente.length) await this.setDocumento(queryRunner, PersonalId, docFrente[0], 12)

      if (docDorso && docDorso.length) await this.setDocumento(queryRunner, PersonalId, docDorso[0], 13)

      await queryRunner.commitTransaction()
      return this.jsonRes({ PersonalId }, res, 'Carga Exitosa');
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }

  }

  async addPersonalTelefono(queryRunner: any, telefono: any, personalId: any) {
    const tipoTelefonoId = telefono.TipoTelefonoId
    const ultnro = await queryRunner.query(`SELECT PersonalTelefonoUltNro FROM Personal WHERE PersonalId = @0 `, [personalId])
    const PersonalTelefonoId = (ultnro[0]?.PersonalTelefonoUltNro) ? ultnro[0]?.PersonalTelefonoUltNro + 1 : 1
    const telefonoNum = telefono.TelefonoNro.split('').filter(char => !isNaN(Number(char)) && char !== ' ').join('')

    await queryRunner.query(`
      INSERT INTO PersonalTelefono (
      PersonalId,
      PersonalTelefonoId,
      TipoTelefonoId,
      PersonalTelefonoNro
      )
      VALUES (@0,@1,@2,@3)`, [
      personalId, PersonalTelefonoId, tipoTelefonoId, telefonoNum
    ])
    await queryRunner.query(`
      UPDATE Personal SET PersonalTelefonoUltNro = @0 WHERE PersonalId = @1
      `, [PersonalTelefonoId, personalId])
  }

  async addPersonalEstudio(queryRunner: any, estudio: any, personalId: any) {
    const tipoEstudioId = estudio.TipoEstudioId
    // const estadoEstudioId = estudio.EstadoEstudioId
    const estudioTitulo = estudio.EstudioTitulo
    const PersonalEstudioOtorgado = estudio.PersonalEstudioOtorgado
    const docTitulo = (estudio.DocTitulo) ? estudio.DocTitulo[0] : null
    const ultnro = await queryRunner.query(`SELECT PersonalEstudioUltNro FROM Personal WHERE PersonalId = @0 `, [personalId])
    const PersonalEstudioId = (ultnro[0]?.PersonalEstudioUltNro) ? ultnro[0]?.PersonalEstudioUltNro + 1 : 1

    let DocumentoImagenEstudioId = null
    if (docTitulo) {
      const DocumentoImagenEstudio = await queryRunner.query(`
        INSERT INTO DocumentoImagenEstudio (
        PersonalId,
        DocumentoImagenParametroId,
        DocumentoImagenParametroDirectorioId
        )
        VALUES(@0,@1,@2)

        SELECT MAX(DocumentoImagenEstudioId) as DocumentoImagenEstudioId FROM DocumentoImagenEstudio WHERE PersonalId IN (@0)
      `, [personalId, 14, 1])
      DocumentoImagenEstudioId = DocumentoImagenEstudio[0].DocumentoImagenEstudioId
    }

    await queryRunner.query(`
      INSERT INTO PersonalEstudio (
      PersonalId,
      PersonalEstudioId,
      TipoEstudioId,
      EstadoEstudioId,
      PersonalEstudioTitulo,
      PersonalEstudioOtorgado,
      PersonalEstudioPagina1Id
      )
      VALUES (@0,@1,@2,@3,@4,@5,@6)`, [
      personalId, PersonalEstudioId, tipoEstudioId, 2, estudioTitulo, PersonalEstudioOtorgado, DocumentoImagenEstudioId
    ])

    await queryRunner.query(`
      UPDATE Personal SET PersonalEstudioUltNro = @1 WHERE PersonalId = @0`, [personalId, PersonalEstudioId])

    if (docTitulo) {
      await this.setImagenEstudio(queryRunner, personalId, docTitulo, DocumentoImagenEstudioId)
    }
  }

  async addPersonalFamilia(queryRunner: any, PersonalId: any, familiar: any) {
    const Nombre = familiar.Nombre
    const Apellido = familiar.Apellido
    const TipoParentescoId = familiar.TipoParentescoId
    let PersonalFamiliaId = familiar.PersonalFamiliaId
    if (!PersonalFamiliaId) {
      const Personal = await queryRunner.query(`
        SELECT ISNULL(PersonalFamiliaUltNro, 0)+1 AS UltNro
        FROM Personal
        WHERE PersonalId IN (@0)
        `, [PersonalId])
      PersonalFamiliaId = Personal[0].UltNro
    }

    await queryRunner.query(`
      INSERT INTO PersonalFamilia (
      PersonalId,
      PersonalFamiliaId,
      PersonalFamiliaApellido,
      PersonalFamiliaNombre,
      PersonalFamiliaSexo,
      TipoParentescoId,
      PersonalFamiliaVive
      )
      VALUES (@0, @1, @2, @3, @4, @5, @6)`, [
      PersonalId, PersonalFamiliaId, Apellido, Nombre, 'N', TipoParentescoId, 1
    ])
    await queryRunner.query(`
      UPDATE Personal SET
      PersonalFamiliaUltNro = @1
      WHERE PersonalId IN (@0)
      `, [PersonalId, PersonalFamiliaId])
  }

  private async getNacionalidadListQuery(queryRunner: any) {
    return await queryRunner.query(`
        SELECT nac.NacionalidadId value, TRIM(nac.NacionalidadDescripcion) label
        FROM Nacionalidad nac`)
  }

  async getNacionalidadList(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await this.getNacionalidadListQuery(queryRunner)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

  moveFile(dirFile: any, newFilePath: any, newFileName: any) {

    if (!existsSync(newFilePath)) {
      mkdirSync(newFilePath, { recursive: true })
    }

    console.log("antes")
    renameSync(dirFile, `${newFilePath}${newFileName}`)
    console.log("despues")

  }

  async setFoto(queryRunner: any, personalId: any, file: any) {
    console.log("file", file)
    if(file?.tempfilename){

    //const type = file.mimetype.split('/')[1]
    const type = file.TipoArchivo
    //const fieldname = file.fieldname
    const fieldname = file.tempfilename
    // let foto = await queryRunner.query(`
    //   SELECT foto.DocumentoImagenFotoId fotoId, dir.DocumentoImagenParametroDirectorioPath
    //   FROM DocumentoImagenFoto foto 
    //   JOIN DocumentoImagenParametroDirectorio dir ON dir.DocumentoImagenParametroDirectorioId = foto.DocumentoImagenParametroDirectorioId AND dir.DocumentoImagenParametroId = foto.DocumentoImagenParametroId
    //   JOIN DocumentoImagenParametro par ON par.DocumentoImagenParametroId = foto.DocumentoImagenParametroId
    //   WHERE foto.PersonalId =@0
    // `, [personalId])
    // if (!foto.length) {
    await queryRunner.query(`
        INSERT INTO DocumentoImagenFoto (
        PersonalId,
        DocumentoImagenFotoBlobTipoArchivo,
        DocumentoImagenParametroId,
        DocumentoImagenParametroDirectorioId
        )
        VALUES(@0,@1,@2,@3)`,
      [personalId, type, 7, 1]
    )
    let foto = await queryRunner.query(`
        SELECT TOP 1 foto.DocumentoImagenFotoId fotoId, dir.DocumentoImagenParametroDirectorioPath
        FROM DocumentoImagenFoto foto
        JOIN DocumentoImagenParametroDirectorio dir ON dir.DocumentoImagenParametroDirectorioId = foto.DocumentoImagenParametroDirectorioId AND dir.DocumentoImagenParametroId = foto.DocumentoImagenParametroId
        JOIN DocumentoImagenParametro par ON par.DocumentoImagenParametroId = foto.DocumentoImagenParametroId
        WHERE foto.PersonalId IN (@0)
        ORDER BY foto.DocumentoImagenFotoId DESC
      `, [personalId])
    // }

    const fotoId = foto[0].fotoId
    const pathArchivos = (process.env.PATH_ARCHIVOS) ? process.env.PATH_ARCHIVOS : '.'
    const dirFile = `${process.env.PATH_DOCUMENTS}/temp/${fieldname}`;
    const newFieldname = `${personalId}-${fotoId}-FOTO.${type}`
    const newFilePath = `${pathArchivos}/${foto[0].DocumentoImagenParametroDirectorioPath.replaceAll('\\', '/')}`;
    this.moveFile(dirFile, newFilePath, newFieldname);
    await queryRunner.query(`
      UPDATE DocumentoImagenFoto SET
      DocumentoImagenFotoBlobNombreArchivo = @2
      WHERE PersonalId = @0 AND DocumentoImagenFotoId = @1`,
      [personalId, fotoId, newFieldname]
    )
    await queryRunner.query(`UPDATE Personal SET PersonalFotoId = @0 WHERE PersonalId = @1`,
      [fotoId, personalId]
    )
    }
  }

  async setDocumento(queryRunner: any, personalId: any, file: any, parametro: number) {
    if(file.tempfilename){
      
  
       //const type = file.mimetype.split('/')[1]
       const type = file.TipoArchivo
       //const fieldname = file.fieldname
       const fieldname = file.tempfilename
    // let doc = await queryRunner.query(`
    //   SELECT doc.DocumentoImagenDocumentoId docId, dir.DocumentoImagenParametroDirectorioPath
    //   FROM DocumentoImagenDocumento doc 
    //   JOIN DocumentoImagenParametroDirectorio dir ON dir.DocumentoImagenParametroDirectorioId = doc.DocumentoImagenParametroDirectorioId AND dir.DocumentoImagenParametroId =  doc.DocumentoImagenParametroId
    //   JOIN DocumentoImagenParametro par ON par.DocumentoImagenParametroId = doc.DocumentoImagenParametroId
    //   WHERE doc.PersonalId IN (@0)
    // `, [personalId])
    // if (!doc.length) {
    await queryRunner.query(`
      INSERT INTO DocumentoImagenDocumento (
      PersonalId,
      DocumentoImagenDocumentoBlobTipoArchivo,
      DocumentoImagenParametroId,
      DocumentoImagenParametroDirectorioId
      )
      VALUES(@0,@1,@2,@3)`,
      [personalId, type, parametro, 1]
    )
    let doc = await queryRunner.query(`
      SELECT TOP 1 doc.DocumentoImagenDocumentoId docId, dir.DocumentoImagenParametroDirectorioPath
      FROM DocumentoImagenDocumento doc 
      JOIN DocumentoImagenParametroDirectorio dir ON dir.DocumentoImagenParametroDirectorioId = doc.DocumentoImagenParametroDirectorioId AND dir.DocumentoImagenParametroId = doc.DocumentoImagenParametroId
      JOIN DocumentoImagenParametro par ON par.DocumentoImagenParametroId = doc.DocumentoImagenParametroId
      WHERE doc.PersonalId IN (@0)
      ORDER BY doc.DocumentoImagenDocumentoId DESC
    `, [personalId])
    // }
  
    const docId = doc[0].docId
    const pathArchivos = (process.env.PATH_ARCHIVOS) ? process.env.PATH_ARCHIVOS : '.'
    const dirFile: string = `${process.env.PATH_DOCUMENTS}/temp/${fieldname}`;
    let newFieldname: string = `${personalId}-${docId}`
    if (parametro == 13) {
      newFieldname += `-DOCUMENDOR`
    } else if (parametro == 12) {
      newFieldname += `-DOCUMENFREN`
    }
    newFieldname += `.${type}`
    const newFilePath: string = `${pathArchivos}/${doc[0].DocumentoImagenParametroDirectorioPath.replaceAll('\\', '/')}`;
    this.moveFile(dirFile, newFilePath, newFieldname);
    await queryRunner.query(`
      UPDATE DocumentoImagenDocumento SET
      DocumentoImagenDocumentoBlobNombreArchivo = @2
      WHERE PersonalId = @0 AND DocumentoImagenDocumentoId = @1
    `, [personalId, docId, newFieldname]
    )

    const PersonalDocumento = await queryRunner.query(`
      SELECT PersonalDocumentoUltNro
      FROM Personal
      WHERE PersonalId IN (@0)`,
      [personalId]
    )
    const PersonalDocumentoUltNro = PersonalDocumento[0].PersonalDocumentoUltNro
    if (parametro == 13) {
      await queryRunner.query(`
        UPDATE PersonalDocumento SET
        PersonalDocumentoDorsoId = @2
        WHERE PersonalId = @0 AND PersonalDocumentoId = @1
      `, [personalId, PersonalDocumentoUltNro, docId]
      )
    } else if (parametro == 12) {
      await queryRunner.query(`
        UPDATE PersonalDocumento SET
        PersonalDocumentoFrenteId = @2
        WHERE PersonalId = @0 AND PersonalDocumentoId = @1
      `, [personalId, PersonalDocumentoUltNro, docId]
      )
    }
  }
  }

  async setImagenEstudio(queryRunner: any, personalId: any, file: any, DocumentoImagenEstudioId: number) {
    if(file.tempfilename){
    const type = file.mimetype.split('/')[1]
    const fieldname = file.fieldname
    let estudio = await queryRunner.query(`
      SELECT est.DocumentoImagenEstudioId estudioId, dir.DocumentoImagenParametroDirectorioPath
      FROM DocumentoImagenEstudio est 
      JOIN DocumentoImagenParametroDirectorio dir ON dir.DocumentoImagenParametroDirectorioId = est.DocumentoImagenParametroDirectorioId AND dir.DocumentoImagenParametroId =  est.DocumentoImagenParametroId
      JOIN DocumentoImagenParametro par ON par.DocumentoImagenParametroId = est.DocumentoImagenParametroId
      WHERE est.PersonalId IN (@0) AND est.DocumentoImagenEstudioId IN (@1)
      `, [personalId, DocumentoImagenEstudioId])

    const estudioId = DocumentoImagenEstudioId

    const pathArchivos = (process.env.PATH_ARCHIVOS) ? process.env.PATH_ARCHIVOS : '.'

    const dirFile = `${process.env.PATH_DOCUMENTS}/temp/${fieldname}.${type}`;

    const newFieldname = `${personalId}-${estudioId}-CERESTPAG1.${type}`

    const newFilePath = `${pathArchivos}/${estudio[0].DocumentoImagenParametroDirectorioPath.replaceAll('\\', '/')}`;

    this.moveFile(dirFile, newFilePath, newFieldname);


    await queryRunner.query(`
      UPDATE DocumentoImagenEstudio SET
      DocumentoImagenEstudioBlobNombreArchivo = @1,
      DocumentoImagenEstudioBlobTipoArchivo = @2,
      DocumentoImagenParametroId = @3,
      DocumentoImagenParametroDirectorioId = @4
      WHERE PersonalId IN (@0) AND DocumentoImagenEstudioId IN (@5)`,
      [personalId, newFieldname, type, 14, 1, DocumentoImagenEstudioId]
    )
    }
  }

  private async updatePersonalQuerys(queryRunner: any, PersonalId: number, infoPersonal: any) {
    let personalRes = await queryRunner.query(`
      SELECT PersonalNroLegajo NroLegajo, TRIM(PersonalApellido) Apellido, TRIM(PersonalNombre) Nombre,
      PersonalFechaIngreso FechaIngreso, PersonalFechaNacimiento FechaNacimiento,
      PersonalNacionalidadId NacionalidadId, PersonalSuActualSucursalPrincipalId SucursalId, PersonalLeyNro LeyNro,
      EstadoCivilId 
      FROM Personal
      WHERE PersonalId = @0
      `, [PersonalId])
    const personal = personalRes[0]
    let cambio: boolean = false
    for (const key in personal) {
      if (infoPersonal[key] != personal[key]) {
        cambio = true
        break
      }
    }
    if (!cambio) return

    let Nombre: string = infoPersonal.Nombre
    let Apellido: string = infoPersonal.Apellido
    const NacionalidadId: number = infoPersonal.NacionalidadId
    const EstadoCivilId: number = infoPersonal.EstadoCivilId
    const NroLegajo: number = infoPersonal.NroLegajo
    const SucursalId: number = infoPersonal.SucursalId
    let FechaIngreso: Date = infoPersonal.FechaIngreso ? new Date(infoPersonal.FechaIngreso) : null
    let FechaNacimiento: Date = infoPersonal.FechaNacimiento ? new Date(infoPersonal.FechaNacimiento) : null
    const CUIT: number = infoPersonal.CUIT
    const LeyNro: number = infoPersonal.LeyNro
    FechaIngreso?.setHours(0, 0, 0, 0)
    FechaNacimiento?.setHours(0, 0, 0, 0)
    Nombre = Nombre.toUpperCase()
    Apellido = Apellido.toUpperCase()
    const fullname: string = Apellido + ', ' + Nombre
    const ApellidoNombreDNILegajo = `${Apellido}, ${Nombre} (CUIT ${CUIT} - Leg.:${NroLegajo})`
    await queryRunner.query(`
      UPDATE Personal SET
      PersonalNroLegajo = @1,
      PersonalApellido = @2,
      PersonalNombre = @3,
      PersonalApellidoNombre = @4,
      PersonalFechaPreIngreso = @5,
      PersonalFechaIngreso = @5,
      PersonalFechaNacimiento = @6,
      PersonalNacionalidadId = @7,
      PersonalSuActualSucursalPrincipalId = @8,
      PersonalApellidoNombreDNILegajo = @9,
      PersonalLeyNro = @10,
      EstadoCivilId = @11
      WHERE PersonalId = @0
      `, [PersonalId, NroLegajo, Apellido, Nombre, fullname, FechaIngreso, FechaNacimiento, NacionalidadId,
      SucursalId, ApellidoNombreDNILegajo, LeyNro, EstadoCivilId
    ])
  }

  private async updatePersonalDomicilio(queryRunner: any, PersonalId: number, infoDomicilio: any) {

    if (infoDomicilio.Calle || infoDomicilio.Nro || infoDomicilio.Piso || infoDomicilio.Dpto ||
      infoDomicilio.CodigoPostal || infoDomicilio.PaisId || infoDomicilio.ProvinciaId || infoDomicilio.LocalidadId) {

      let campos_vacios = []
      if (!infoDomicilio.Calle) campos_vacios.push('- Calle')
      if (!infoDomicilio.Nro) campos_vacios.push('- Nro')

      if (!infoDomicilio.CodigoPostal) campos_vacios.push('- Codigo Postal')
      if (!infoDomicilio.PaisId) campos_vacios.push('- Pais')
      if (!infoDomicilio.ProvinciaId) campos_vacios.push('- Provincia')
      if (!infoDomicilio.LocalidadId) campos_vacios.push('- Localidad')

      if (campos_vacios.length) {
        campos_vacios.unshift('Debe completar los siguientes campos del Domicilio:')
        throw new ClientException(campos_vacios)
      }


      let cambio: boolean = false
      const domicilioRes = await queryRunner.query(`
          SELECT TRIM(PersonalDomicilioDomCalle) Calle, TRIM(PersonalDomicilioDomNro) Nro, TRIM(PersonalDomicilioDomPiso) Piso,
          TRIM(PersonalDomicilioDomDpto) Dpto, TRIM(PersonalDomicilioCodigoPostal) CodigoPostal, PersonalDomicilioPaisId PaisId, PersonalDomicilioProvinciaId ProvinciaId,
          PersonalDomicilioLocalidadId LocalidadId, PersonalDomicilioBarrioId BarrioId
          FROM PersonalDomicilio
          WHERE PersonalId = @0 AND PersonalDomicilioId = @1
          `, [PersonalId, infoDomicilio.PersonalDomicilioId])

      const domicilio = domicilioRes[0] ? domicilioRes[0] : {}

      if (domicilioRes.length == 0)
        cambio = true

      for (const key in domicilio) {
        if (infoDomicilio[key] != domicilio[key]) {
          cambio = true
          break
        }
      }

      if (cambio) {
        await queryRunner.query(`
          UPDATE PersonalDomicilio SET PersonalDomicilioActual=0 WHERE PersonalId =@0`, [PersonalId])

        const ultnro = await queryRunner.query(`SELECT PersonalDomicilioUltNro FROM Personal WHERE PersonalId = @0 `, [PersonalId])
        const PersonalDomicilioId = (ultnro[0]?.PersonalDomicilioUltNro) ? ultnro[0]?.PersonalDomicilioUltNro + 1 : 1

        await queryRunner.query(`
            INSERT INTO PersonalDomicilio (
            PersonalId,
            PersonalDomicilioId,
            PersonalDomicilioDomCalle,
            PersonalDomicilioDomNro,
            PersonalDomicilioDomPiso,
            PersonalDomicilioDomDpto,
            PersonalDomicilioCodigoPostal,
            PersonalDomicilioActual,
            PersonalDomicilioPaisId,
            PersonalDomicilioProvinciaId,
            PersonalDomicilioLocalidadId,
            PersonalDomicilioBarrioId
            )
            VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@11)`, [
          PersonalId,
          PersonalDomicilioId,
          infoDomicilio.Calle,
          infoDomicilio.Nro,
          infoDomicilio.Piso,
          infoDomicilio.Dpto,
          infoDomicilio.CodigoPostal,
          1,
          infoDomicilio.PaisId,
          infoDomicilio.ProvinciaId,
          infoDomicilio.LocalidadId,
          infoDomicilio.BarrioId,
        ])
        await queryRunner.query(`
            UPDATE Personal SET PersonalDomicilioUltNro = @1 WHERE PersonalId = @0
            `, [PersonalId, PersonalDomicilioId])

      }

    }
  }

  private async updatePersonalTelefono(queryRunner: any, PersonalId: number, infoTelefono: any) {
    const PersonalTelefonoId = infoTelefono.PersonalTelefonoId
    let telefono: any = await queryRunner.query(`
      SELECT TipoTelefonoId, PersonalTelefonoNro TelefonoNro
      FROM PersonalTelefono
      WHERE PersonalId IN (@0) AND PersonalTelefonoId IN (@1)
      `, [PersonalId, PersonalTelefonoId])

    if (!telefono.length)
      return await this.addPersonalTelefono(queryRunner, infoTelefono, PersonalId)

    const lugarTelefonoId = infoTelefono.LugarTelefonoId
    const tipoTelefonoId = infoTelefono.TipoTelefonoId
    const telefonoNum = infoTelefono.TelefonoNro
    await queryRunner.query(`
      UPDATE PersonalTelefono SET
      LugarTelefonoId = @2,
      TipoTelefonoId = @3,
      PersonalTelefonoNro = @4,
      PersonalTelefonoInactivo = null
      WHERE PersonalId IN (@0) AND PersonalTelefonoId IN (@1)
      `, [
      PersonalId, PersonalTelefonoId, lugarTelefonoId, tipoTelefonoId, telefonoNum
    ])
  }

  private async updatePersonalEstudio(queryRunner: any, PersonalId: number, estudios: any[]) {
    let oldStudies = await queryRunner.query(`
      SELECT PersonalEstudioId, PersonalEstudioPagina1Id, PersonalEstudioPagina2Id,
      PersonalEstudioPagina3Id, PersonalEstudioPagina4Id
      FROM PersonalEstudio
      WHERE PersonalId IN (@0)
      `, [PersonalId])

    await queryRunner.query(`
      DELETE FROM PersonalEstudio WHERE PersonalId IN (@0)
      `, [PersonalId])

    for (const infoEstudio of estudios) {
      console.log('infoEstudio', infoEstudio)

      if (infoEstudio.EstudioTitulo || infoEstudio.TipoEstudioId || infoEstudio.PersonalEstudioOtorgado) {
        let campos_vacios = []
        if (!infoEstudio.EstudioTitulo) campos_vacios.push('- Título')
          if (!infoEstudio.TipoEstudioId) campos_vacios.push('- Tipo de Estudio')
        if (!infoEstudio.PersonalEstudioOtorgado) campos_vacios.push('- Estudio Otorgado')  
      
        if (campos_vacios.length) {
          campos_vacios.unshift('Debe completar los siguientes campos de la sección estudios:')
          throw new ClientException(campos_vacios)
        }

      }

      if (infoEstudio.PersonalEstudioId) {
        let find = oldStudies.find((study: any) => { return (study.PersonalEstudioId == infoEstudio.PersonalEstudioId) })
        let Pagina1Id = find.PersonalEstudioPagina1Id
        // const Pagina2Id = find.PersonalEstudioPagina2Id
        // const Pagina3Id = find.PersonalEstudioPagina3Id
        // const Pagina4Id = find.PersonalEstudioPagina4Id
        if (!Pagina1Id && infoEstudio.DocTitulo && infoEstudio.DocTitulo.length) {
          const DocumentoImagenEstudio = await queryRunner.query(`
            INSERT INTO DocumentoImagenEstudio (
            PersonalId,
            DocumentoImagenParametroId,
            DocumentoImagenParametroDirectorioId
            )
            VALUES(@0,@1,@2)
      
            SELECT MAX(DocumentoImagenEstudioId) as DocumentoImagenEstudioId FROM DocumentoImagenEstudio WHERE PersonalId IN (@0)
          `, [PersonalId, 14, 1])
          Pagina1Id = DocumentoImagenEstudio[0].DocumentoImagenEstudioId
        }
        await queryRunner.query(`
          INSERT INTO PersonalEstudio (
          PersonalId,
          PersonalEstudioId,
          TipoEstudioId,
          EstadoEstudioId,
          PersonalEstudioTitulo,
          PersonalEstudioOtorgado,
          PersonalEstudioPagina1Id
          --PersonalEstudioPagina2Id, PersonalEstudioPagina3Id, PersonalEstudioPagina4Id
          )
          VALUES (@0,@1,@2,@3,@4,@5,@6)`, [
          PersonalId, infoEstudio.PersonalEstudioId, infoEstudio.TipoEstudioId,
          2, infoEstudio.EstudioTitulo, infoEstudio.PersonalEstudioOtorgado,
          Pagina1Id,
          //Pagina2Id, Pagina3Id, Pagina4Id
        ])

        if (infoEstudio.DocTitulo && infoEstudio.DocTitulo.length) {
          const docTitulo = infoEstudio.DocTitulo[0]
          console.log('docTitulo', docTitulo)
          if (!docTitulo?.id)
            await this.setImagenEstudio(queryRunner, PersonalId, docTitulo, Pagina1Id)

        }

      } else {
        return await this.addPersonalEstudio(queryRunner, infoEstudio, PersonalId)
      }

    }
  }

  async updatePersonalEmail(queryRunner: any, personalId: number, email: string) {
    email = email.toLowerCase()
    const emailRec = await queryRunner.query(`SELECT PersonalEmailEmail FROM PersonalEmail WHERE PersonalId =@0 AND PersonalEmailInactivo =0`, [personalId])

    if (emailRec[0]?.PersonalEmailEmail != email) {
      await queryRunner.query(`UPDATE PersonalEmail SET PersonalEmailInactivo = 1 WHERE PersonalId =@0`, [personalId])
      if (email) {
        const ultnro = await queryRunner.query(`SELECT PersonalEmailUltNro FROM Personal WHERE PersonalId = @0 `, [personalId])
        const PersonalEmailId = (ultnro[0]?.PersonalEmailUltNro) ? ultnro[0]?.PersonalEmailUltNro + 1 : 1

        await queryRunner.query(`
          INSERT INTO PersonalEmail (
          PersonalId,
          PersonalEmailId,
          PersonalEmailEmail,
          PersonalEmailInactivo
          )
          VALUES (@0,@1,@2,@3)`,
          [personalId, PersonalEmailId, email, 0]
        )

        await queryRunner.query(`UPDATE Personal SET PersonalEmailUltNro = @0 WHERE PersonalId = @1`, [PersonalEmailId, personalId])
      }
    }
  }

  async updatePersonalFamilia(queryRunner: any, PersonalId: any, familia: any[]) {
    await queryRunner.query(`DELETE FROM PersonalFamilia WHERE PersonalId IN (@0)`, [PersonalId])
    for (const familiar of familia) {
      if (!familiar.Nombre && !familiar.Apellido && !familiar.TipoParentescoId)
        continue

      if (!familiar.Nombre || !familiar.Apellido || !familiar.TipoParentescoId)
        return new ClientException(`Los campos Nombre, Apellido y Parentesco de la seccion Familiar No pueden estar vacios.`)

      await this.addPersonalFamilia(queryRunner, PersonalId, familiar)
    }
  }

  // async updatePersonalSitRevista(queryRunner:any, PersonalId:any, infoSitRevista:any){
  //   const PersonalSituacionRevistaId = infoSitRevista.PersonalSituacionRevistaId
  //   let situacionRevista = await queryRunner.query(`
  //     SELECT PersonalSituacionRevistaSituacionId SituacionId, PersonalSituacionRevistaMotivo Motivo,
  //     PersonalSituacionRevistaDesde Desde
  //     FROM PersonalSituacionRevista
  //     WHERE PersonalId IN (@0) AND PersonalSituacionRevistaId IN (@1)
  //     `,[PersonalId, PersonalSituacionRevistaId])

  //   let cambio:boolean = false
  //   for (const key in situacionRevista) {
  //     if (infoSitRevista[key] != situacionRevista[key]) {
  //       cambio = true
  //       break
  //     }
  //   }

  //   if(!cambio) return
  //   await this.setSituacionRevistaQuerys(queryRunner, PersonalId, infoSitRevista)
  // }

  async updatePersonalCUITQuery(queryRunner: any, personaId: any, CUIT: number, now: Date) {
    const PersonalCUITCUIL = await queryRunner.query(`
      SELECT per.PersonalCUITCUILUltNro, cuit.PersonalCUITCUILDesde
      FROM Personal per
      LEFT JOIN PersonalCUITCUIL cuit ON PersonalCUITCUILId = per.PersonalCUITCUILUltNro
      WHERE per.PersonalId IN (@0)`,
      [personaId]
    )
    const PersonalCUITCUILUltNro = PersonalCUITCUIL[0].PersonalCUITCUILUltNro
    const PersonalCUITCUILDesde = new Date(PersonalCUITCUIL[0].PersonalCUITCUILDesde)
    if (PersonalCUITCUILDesde.getTime() < now.getTime()) {
      const yesterday: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
      yesterday.setHours(0, 0, 0, 0)
      await queryRunner.query(`
        UPDATE PersonalCUITCUIL SET
        PersonalCUITCUILHasta = @2
        WHERE PersonalId = @0 AND PersonalCUITCUILId = @1`,
        [personaId, PersonalCUITCUILUltNro, yesterday]
      )
      await this.addPersonalCUITQuery(queryRunner, personaId, CUIT, now)
    } else if (PersonalCUITCUILDesde.getTime() == now.getTime()) {
      await queryRunner.query(`
        UPDATE PersonalCUITCUIL SET
        PersonalCUITCUILCUIT = @2
        WHERE PersonalId = @0 AND PersonalCUITCUILId = @1`,
        [personaId, PersonalCUITCUILUltNro, CUIT]
      )
    }

  }

  private async updatePersonalDocumentoQuery(queryRunner: any, personaId: any, DNI: number) {
    const PersonalDocumento = await queryRunner.query(`
      SELECT PersonalDocumentoUltNro
      FROM Personal
      WHERE PersonalId IN (@0)`,
      [personaId]
    )
    const PersonalDocumentoId = PersonalDocumento[0].PersonalDocumentoUltNro
    await queryRunner.query(`
      UPDATE PersonalDocumento SET
      PersonalDocumentoNro = @2
      WHERE PersonalDocumentoId IN (@0) AND PersonalId IN (@1)
      `, [PersonalDocumentoId, personaId, DNI]
    )
  }

  async updatePersonal(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const PersonalId: number = Number(req.params.id)
    const CUIT: number = req.body.CUIT
    const Foto = req.body.Foto
    const docFrente = req.body.docFrente
    const docDorso = req.body.docDorso
    const telefonos: any[] = req.body.telefonos
    const estudios: any[] = req.body.estudios
    const familiares: any[] = req.body.familiares
    const beneficiarios: any[] = req.body.beneficiarios
    const SucursalId = req.body.SucursalId
    const actas = req.body.actas
    const habilitacion = req.body.habilitacion

    let now = new Date()
    now.setHours(0, 0, 0, 0)

    try {
      await queryRunner.startTransaction()
      const usuario = res.locals.userName
      const usuarioId = await this.getUsuarioId(res, queryRunner)
      const ip = this.getRemoteAddress(req)

      const valForm = this.valPersonalForm(req.body, 'U')
      if (valForm instanceof ClientException)
        throw valForm

      await this.updatePersonalQuerys(queryRunner, PersonalId, req.body)

      await this.updateSucursalPrincipal(queryRunner, PersonalId, SucursalId)

      const PersonalCUITCUIL = await queryRunner.query(`
        SELECT PersonalCUITCUILCUIT cuit FROM PersonalCUITCUIL WHERE PersonalId = @0 ORDER BY PersonalCUITCUILId DESC`, [PersonalId]
      )
      if (PersonalCUITCUIL[0]?.cuit != CUIT) {
        await this.updatePersonalCUITQuery(queryRunner, PersonalId, CUIT, now)
        const DNI = parseInt(CUIT.toString().slice(2, -1))
        await this.updatePersonalDocumentoQuery(queryRunner, PersonalId, DNI)
      }
      await this.updatePersonalDomicilio(queryRunner, PersonalId, req.body)

      await this.updatePersonalEmail(queryRunner, PersonalId, req.body.Email)
      // await this.updatePersonalSitRevista(queryRunner, PersonalId, req.body)
      //Telefonos
      await queryRunner.query(`UPDATE PersonalTelefono SET PersonalTelefonoInactivo = 1 WHERE PersonalId IN (@0)`, [PersonalId])
      for (const telefono of telefonos) {
        if (telefono.TelefonoNro) await this.updatePersonalTelefono(queryRunner, PersonalId, telefono)
      }
      //Estudios
      await this.updatePersonalEstudio(queryRunner, PersonalId, estudios)

      //Familiares
      const updatePersonalFamilia = await this.updatePersonalFamilia(queryRunner, PersonalId, familiares)
      if (updatePersonalFamilia instanceof ClientException)
        throw updatePersonalFamilia

      //Beneficiario
      const setPersonalSeguroBeneficiario = await this.setPersonalSeguroBeneficiario(queryRunner, PersonalId, beneficiarios, usuario, ip)
      if (setPersonalSeguroBeneficiario instanceof ClientException)
        throw setPersonalSeguroBeneficiario

      //Habilitacion Necesaria
      await this.setPersonalHabilitacionNecesaria(queryRunner, PersonalId, habilitacion, usuarioId, ip)

      //Actas
      const valActas = await this.setActasQuerys(queryRunner, PersonalId, actas)
      if (valActas instanceof ClientException)
        throw valActas

     // throw new ClientException('test.')
     // let  resultFile = await FileUploadController.handleDOCUpload(
       // PersonalId, 
        //file.objetivo_id, 
        //file.cliente_id, 
        //file.id, 
        //new Date(), 
        //fec_doc_ven, 
        //file.den_documento, 
        //file, 
        //usuario,
        //ip,
        //queryRunner)

      if (Foto && Foto.length) await this.setFoto(queryRunner, PersonalId, Foto[0])

      if (docFrente && docFrente.length) await this.setDocumento(queryRunner, PersonalId, docFrente[0], 12)

      if (docDorso && docDorso.length) await this.setDocumento(queryRunner, PersonalId, docDorso[0], 13)

      await queryRunner.commitTransaction()
      this.jsonRes({}, res, 'Carga Exitosa');
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  private async getFormPersonByIdQuery(queryRunner: any, personalId: any) {
    let data = await queryRunner.query(`
      SELECT per.PersonalId ,TRIM(per.PersonalNombre) Nombre, TRIM(per.PersonalApellido) Apellido, per.PersonalNroLegajo NroLegajo,
      cuit.PersonalCUITCUILCUIT CUIT , per.PersonalFechaIngreso FechaIngreso, per.PersonalFechaNacimiento FechaNacimiento,
      per.PersonalSuActualSucursalPrincipalId SucursalId , TRIM(suc.SucursalDescripcion) AS SucursalDescripcion, nac.NacionalidadId,
      TRIM(nac.NacionalidadDescripcion), per.EstadoCivilId,
      TRIM(dom.PersonalDomicilioDomCalle) Calle, TRIM(dom.PersonalDomicilioDomNro) Nro, TRIM(dom.PersonalDomicilioDomPiso) Piso,
      TRIM(dom.PersonalDomicilioDomDpto) Dpto, TRIM(dom.PersonalDomicilioCodigoPostal) CodigoPostal, dom.PersonalDomicilioPaisId PaisId,
      dom.PersonalDomicilioProvinciaId ProvinciaId, dom.PersonalDomicilioLocalidadId LocalidadId, dom.PersonalDomicilioBarrioId BarrioId, dom.PersonalDomicilioId,
      email.PersonalEmailEmail Email, email.PersonalEmailId,
      sit.PersonalSituacionRevistaId, TRIM(sit.PersonalSituacionRevistaMotivo) Motivo, sit.PersonalSituacionRevistaSituacionId SituacionId,
      per.PersonalFotoId FotoId, ISNULL(doc.PersonalDocumentoFrenteId,0) docFrenteId, ISNULL(doc.PersonalDocumentoDorsoId, 0) docDorsoId,
      per.PersonalNroActa, per.PersonalFechaActa, per.PersonalBajaNroActa, per.PersonalBajaFechaActa, per.PersonalFechaDestruccion, per.PersonalDestruccionNroActa,
      per.PersonalLeyNro LeyNro
      FROM Personal per
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN Sucursal suc ON suc.SucursalId = per.PersonalSuActualSucursalPrincipalId
      LEFT JOIN Nacionalidad nac ON nac.NacionalidadId = per.PersonalNacionalidadId
      LEFT JOIN PersonalDomicilio dom ON dom.PersonalId = per.PersonalId AND dom.PersonalDomicilioActual IN (1)
      LEFT JOIN PersonalEmail email ON email.PersonalId = per.PersonalId AND email.PersonalEmailInactivo IN (0)
      LEFT JOIN PersonalSituacionRevista sit ON sit.PersonalId = per.PersonalId AND sit.PersonalSituacionRevistaId = (SELECT MAX (sitmax.PersonalSituacionRevistaId) FROM PersonalSituacionRevista sitmax WHERE sitmax.PersonalId = per.PersonalId AND sitmax.PersonalSituacionRevistaDesde <= @1 AND ISNULL(sitmax.PersonalSituacionRevistaHasta,'9999-12-31') >= @1)
      LEFT JOIN PersonalDocumento doc ON doc.PersonalId = per.PersonalId AND doc.PersonalDocumentoId = (SELECT MAX (docmax.PersonalDocumentoId) FROM PersonalDocumento docmax WHERE docmax.PersonalId = per.PersonalId) 
      WHERE per.PersonalId = @0
      `, [personalId, new Date()]
    )
    let persona: any = data[0]
    persona.actas = {
      alta: { fecha: data[0].PersonalFechaActa, numero: data[0].PersonalNroActa },
      baja: { fecha: data[0].PersonalBajaFechaActa, numero: data[0].PersonalBajaNroActa },
      destruccion: { fecha: data[0].PersonalFechaDestruccion, numero: data[0].PersonalDestruccionNroActa }
    }
    delete persona.PersonalNroActa
    delete persona.PersonalFechaActa
    delete persona.PersonalBajaNroActa
    delete persona.PersonalBajaFechaActa
    delete persona.PersonalFechaDestruccion
    delete persona.PersonalDestruccionNroActa
    return persona
  }

  // private async getFormDocumnetosByPersonalIdQuery(queryRunner:any, personalId:any){
  //   return await queryRunner.query(`
  //       SELECT doc.DocumentoImagenDocumentoBlobNombreArchivo, doc.DocumentoImagenParametroId
  //       FROM DocumentoImagenDocumento doc
  //       WHERE doc.PersonalId = @0
  //     `, [personalId]
  //   )
  // }

  private async getFormTelefonosByPersonalIdQuery(queryRunner: any, personalId: any) {
    return await queryRunner.query(`
        SELECT tel.PersonalTelefonoId, tel.TipoTelefonoId, TRIM(tel.PersonalTelefonoNro) TelefonoNro
        FROM PersonalTelefono tel
        WHERE tel.PersonalId IN (@0) AND tel.PersonalTelefonoInactivo IS NULL
      `, [personalId]
    )
  }

  private async getFormEstudiosByPersonalIdQuery(queryRunner: any, personalId: any) {
    return await queryRunner.query(`
        SELECT est.PersonalEstudioId, est.TipoEstudioId, est.EstadoEstudioId,
        TRIM(est.PersonalEstudioTitulo) EstudioTitulo, est.PersonalEstudioOtorgado PersonalEstudioOtorgado,
        est.PersonalEstudioPagina1Id AS docId
        FROM PersonalEstudio est
        WHERE est.PersonalId IN (@0)
      `, [personalId]
    )
  }

  private async getFormFamiliaresByPersonalIdQuery(queryRunner: any, personalId: any) {
    return await queryRunner.query(`
        SELECT PersonalFamiliaId, TRIM(PersonalFamiliaNombre) AS Nombre,
        TRIM(PersonalFamiliaApellido) Apellido, TipoParentescoId
        FROM PersonalFamilia
        WHERE PersonalId IN (@0)
      `, [personalId]
    )
  }

  private async getFormHabilitacionByPersonalIdQuery(queryRunner: any, personalId: any) {
    const habs = []
    const habilitacionPers = await queryRunner.query(`
        SELECT PersonalHabilitacionNecesariaLugarHabilitacionId
        FROM PersonalHabilitacionNecesaria
        WHERE PersonalId IN (@0)
      `, [personalId]
    )
    for (const hab of habilitacionPers)
      habs.push(hab.PersonalHabilitacionNecesariaLugarHabilitacionId)
    return habs
    /*
    const lugares = await this.getLugarHabilitacionQuery(queryRunner)
    for (const lugar of lugares) {
      const find = lugaresPersona.find((obj:any)=> {return obj.LugarHabilitacionId == lugar.value})
      if (find) lugar.checked = true
      else lugar.checked = false
    }
    return lugares
    */
  }

  private async getFormBeneficiariosByPersonalIdQuery(queryRunner: any, personalId: any) {
    return await queryRunner.query(`
        SELECT TRIM(PersonalBeneficiarioApellido) AS Apellido,
        TRIM(PersonalBeneficiarioNombre) AS Nombre,
        TipoParentescoId, TipoDocumentoId, PersonalBeneficiarioDocumentoNro AS DocumentoNro,
        TRIM(PersonalBeneficiarioObservacion) AS Observacion,
        PersonalBeneficiarioDesde AS Desde
        FROM PersonalBeneficiario
        WHERE PersonalId IN (@0) AND PersonalBeneficiarioInactivo = 0
      `, [personalId]
    )
  }

  async getFormDataById(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner()
    const personalId = req.params.id
    try {
      let data = await this.getFormPersonByIdQuery(queryRunner, personalId)

      const telefonos = await this.getFormTelefonosByPersonalIdQuery(queryRunner, personalId)
      const estudios = await this.getFormEstudiosByPersonalIdQuery(queryRunner, personalId)
      const familiares = await this.getFormFamiliaresByPersonalIdQuery(queryRunner, personalId)
      const habilitacion = await this.getFormHabilitacionByPersonalIdQuery(queryRunner, personalId)
      const beneficiarios = await this.getFormBeneficiariosByPersonalIdQuery(queryRunner, personalId)

      data.telefonos = telefonos
      data.estudios = estudios
      data.familiares = familiares
      data.habilitacion = habilitacion
      data.beneficiarios = beneficiarios

      this.jsonRes(data, res);
    } catch (error) {
      return next(error)
    }
  }

  async deleteArchivo(req: any, res: Response, next: NextFunction) {
    const personalId = req.body.id
    const tipo = req.body.tipo
    let document: any
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      switch (tipo) {
        case 7:
          document = await queryRunner.query(`
            SELECT foto.PersonalId, CONCAT(dir.DocumentoImagenParametroDirectorioPath, foto.DocumentoImagenFotoBlobNombreArchivo) path, foto.DocumentoImagenFotoBlobNombreArchivo archivo
            FROM DocumentoImagenFoto foto
            JOIN DocumentoImagenParametroDirectorio dir ON dir.DocumentoImagenParametroId = foto.DocumentoImagenParametroId
            WHERE foto.PersonalId = @0 AND foto.DocumentoImagenParametroId = @1
          `, [personalId, tipo]);
          break;
        case 13:
        case 14:
          document = await queryRunner.query(`
            SELECT doc.PersonalId, CONCAT(dir.DocumentoImagenParametroDirectorioPath, doc.DocumentoImagenDocumentoBlobNombreArchivo) path, doc.DocumentoImagenDocumentoBlobNombreArchivo archivo
            FROM DocumentoImagenDocumento doc
            JOIN DocumentoImagenParametroDirectorio dir ON dir.DocumentoImagenParametroId = doc.DocumentoImagenParametroId
            WHERE doc.PersonalId = @0 AND doc.DocumentoImagenParametroId = @1
          `, [personalId, tipo]);

        default:
          throw new ClientException(`No se encontro el tipo de Archivo.`);
      }

      const url = `${process.env.LINCE_PATH}/${document[0]["path"]}`

      if (document.length > 0) {
        if (!existsSync(url)) {
          console.log(`Archivo ${document[0]["archivo"]} no localizado`, { path: url })
        } else {
          await unlink(url);
        }



        switch (tipo) {
          case 7:
            document = await queryRunner.query(`
              DELETE FROM DocumentoImagenFoto
              WHERE doc_id = @0 WHERE foto.PersonalId = @0 AND foto.DocumentoImagenParametroId = @1
            `, [personalId, tipo]);
            break;
          case 13:
          case 14:
            document = await queryRunner.query(`
              DELETE FROM DocumentoImagenDocumento
              WHERE doc.PersonalId = @0 AND doc.DocumentoImagenParametroId = @1
            `, [personalId, tipo]);

          default:
            throw new ClientException(`No se encontro el tipo de Archivo.`);
        }

        await queryRunner.commitTransaction();
      }

      this.jsonRes({ list: [] }, res, `Archivo borrado con exito`);

    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    }

  }

  async getDomicilioByPersonalId(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const PersonalId: number = Number(req.params.id)
    try {
      let domicilios = await queryRunner.query(`
        SELECT dom.PersonalDomicilioId, dom.PersonalId , dom.PersonalDomicilioDomCalle Calle, dom.PersonalDomicilioDomNro Numero, dom.PersonalDomicilioDomPiso Piso,
        dom.PersonalDomicilioDomDpto Departamento, dom.PersonalDomicilioEntreEsquina EsquinaA, dom.PersonalDomicilioEntreEsquinaY EsquinaB, dom.PersonalDomicilioDomBloque Bloque,
        dom.PersonalDomicilioDomEdificio Edificio, dom.PersonalDomicilioDomCuerpo Cuerpo, dom.PersonalDomicilioCodigoPostal CodigoPostal,
        IIF(ISNULL(dom.PersonalDomicilioActual, 0) = 0, '', 'Actual') Estado,
        pais.PaisId , pais.PaisDescripcion Pais,
        pro.ProvinciaId , pro.ProvinciaDescripcion Provincia,
        loc.LocalidadId , loc.LocalidadDescripcion Localidad,
        bar.BarrioId , bar.BarrioDescripcion Barrio
        FROM PersonalDomicilio dom
        LEFT JOIN Pais pais ON pais.PaisId = dom.PersonalDomicilioPaisId
        LEFT JOIN Provincia pro ON pro.ProvinciaId = dom.PersonalDomicilioProvinciaId AND pro.PaisId = dom.PersonalDomicilioPaisId
        LEFT JOIN Localidad loc ON loc.LocalidadId = dom.PersonalDomicilioLocalidadId AND loc.ProvinciaId = dom.PersonalDomicilioProvinciaId AND loc.PaisId = dom.PersonalDomicilioPaisId
        LEFT JOIN Barrio bar ON bar.BarrioId = dom.PersonalDomicilioBarrioId AND bar.LocalidadId = dom.PersonalDomicilioLocalidadId AND bar.ProvinciaId = dom.PersonalDomicilioProvinciaId AND bar.PaisId = dom.PersonalDomicilioPaisId
        WHERE dom.PersonalId = @0
        ORDER BY dom.PersonalDomicilioActual DESC
        `, [PersonalId]
      )

      this.jsonRes(domicilios, res);
    } catch (error) {
      return next(error)
    }
  }

  async getHistoryPersonalSitRevista(req: any, res: Response, next: NextFunction) {
    const personalId = Number(req.params.personalId);

    try {
      const listSitRevista = await dataSource.query(
        `SELECT sitrev.PersonalSituacionRevistaId,
        TRIM(sit.SituacionRevistaDescripcion) Descripcion, TRIM(sitrev.PersonalSituacionRevistaMotivo) Motivo,
        sitrev.PersonalSituacionRevistaDesde Desde, sitrev.PersonalSituacionRevistaHasta Hasta,
        PersonalSituacionRevistaSituacionId SituacionRevistaId
        FROM PersonalSituacionRevista sitrev 
        LEFT JOIN SituacionRevista sit ON sit.SituacionRevistaId = sitrev.PersonalSituacionRevistaSituacionId
        WHERE sitrev.PersonalId IN (@0)
        ORDER BY sitrev.PersonalSituacionRevistaId DESC
        `, [personalId])

      this.jsonRes(listSitRevista, res);
    } catch (error) {
      return next(error)
    }
  }

  async getSituacionRevistaInvalidos(req: any, res: Response, next: NextFunction) {
    try {
      const recordSet = this.listSitRev.split(',').map((item: string) => { return { SituacionRevistaId: item } })
      this.jsonRes(recordSet, res);
    } catch (error) {
      return next(error)
    }
  }

  private async setSituacionRevistaQuerys(queryRunner: any, personalId: number, SituacionRevistaId: number, desde: Date, motivo: string) {
    desde.setHours(0, 0, 0, 0)
    let yesterday: Date = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)


    if (this.listSitRev.split(',').find((sit: any) => SituacionRevistaId == sit))
      throw new ClientException(`La situación de revista seleccionada no se puede cargar desde esta pantalla.`)

    //Obtengo la última situación de revista
    let sitRevista = await queryRunner.query(`
      SELECT TOP 1 sitrev.PersonalSituacionRevistaId, sitrev.PersonalSituacionRevistaDesde, sitrev.PersonalSituacionRevistaSituacionId,  ISNULL(sitrev.PersonalSituacionRevistaHasta, '9999-12-31') PersonalSituacionRevistaHasta
      FROM PersonalSituacionRevista sitrev
      WHERE sitrev.PersonalId = @0 
      ORDER BY sitrev.PersonalSituacionRevistaDesde DESC, ISNULL(sitrev.PersonalSituacionRevistaHasta, '9999-12-31') DESC
      `, [personalId]
    )

    if (sitRevista.length == 1 && sitRevista[0].PersonalSituacionRevistaDesde.getTime() > desde.getTime())
      throw new ClientException(`La fecha desde de situación de revista no puede ser menor al ${sitRevista[0].PersonalSituacionRevistaDesde.getDate()}/${sitRevista[0].PersonalSituacionRevistaDesde.getMonth() + 1}/${sitRevista[0].PersonalSituacionRevistaDesde.getFullYear()}`)

    if (sitRevista[0]?.PersonalSituacionRevistaSituacionId == SituacionRevistaId)
      throw new ClientException(`La situación de revista es igual a la existente`)

    if (sitRevista.length > 0 && this.listSitRev.split(',').find((sit: any) => sitRevista[0]?.PersonalSituacionRevistaSituacionId == sit))
      throw new ClientException(`No se puede modificar la situación de revista desde esta pantalla`)

    if (sitRevista.length > 0 && sitRevista[0].PersonalSituacionRevistaDesde.getTime() == desde.getTime()) {
      await queryRunner.query(`UPDATE PersonalSituacionRevista SET PersonalSituacionRevistaDesde = @2, PersonalSituacionRevistaMotivo = @3, PersonalSituacionRevistaSituacionId = @4,
        PersonalSituacionRevistaHasta = NULL
        WHERE PersonalId = @0 AND PersonalSituacionRevistaId = @1
        `, [personalId, sitRevista[0].PersonalSituacionRevistaId, desde, motivo, SituacionRevistaId]
      )
    } else {
      //Crea una situación de revista nueva
      await queryRunner.query(`
        UPDATE PersonalSituacionRevista SET PersonalSituacionRevistaHasta = @2 WHERE PersonalId IN (@0) AND PersonalSituacionRevistaId = @1`,
        [personalId, sitRevista[0]?.PersonalSituacionRevistaId, yesterday]
      )

      const PersonalSituacionRevistaUltNroQuery = await queryRunner.query(`SELECT PersonalSituacionRevistaUltNro FROM Personal WHERE PersonalId = @0`, [personalId])
      const PersonalSituacionRevistaUltNro = PersonalSituacionRevistaUltNroQuery[0].PersonalSituacionRevistaUltNro + 1

      await queryRunner.query(`
        INSERT INTO PersonalSituacionRevista ( PersonalId, PersonalSituacionRevistaId, PersonalSituacionRevistaDesde, PersonalSituacionRevistaMotivo, PersonalSituacionRevistaSituacionId)
          VALUES(@0, @1, @2, @3, @4)`,
        [personalId, PersonalSituacionRevistaUltNro, desde, motivo, SituacionRevistaId]
      )

      await queryRunner.query(`UPDATE Personal SET PersonalSituacionRevistaUltNro = @1 WHERE PersonalId IN (@0)`, [personalId, PersonalSituacionRevistaUltNro])
    }
  }

  async setSituacionRevista(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const personalId: number = Number(req.params.id);
    const SituacionRevistaId = req.body.SituacionId
    const desde = req.body.Desde
    const motivo = req.body.Motivo
    let error: any = []
    try {
      await queryRunner.startTransaction()

      if (!SituacionRevistaId) {
        error.push(`- Situación de Revista.`);
      }
      if (!desde) {
        error.push(`- Fecha Desde.`);
      }
      if (error.length) {
        error.unshift('Debe completar:');
        throw new ClientException(error);
      }

      await this.setSituacionRevistaQuerys(queryRunner, personalId, SituacionRevistaId, new Date(desde), motivo)

      await queryRunner.commitTransaction()
      this.jsonRes({}, res, 'Carga Exitosa');
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async getResponsablesListByPersonal(req: any, res: Response, next: NextFunction) {
    const personalId = Number(req.params.personalId);
    try {
      const responsables = await dataSource.query(`
        SELECT ga.GrupoActividadId, ga.GrupoActividadNumero Numero, ga.GrupoActividadDetalle Detalle,
        gap.GrupoActividadPersonalDesde Desde, gap.GrupoActividadPersonalHasta Hasta,
        CONCAT(TRIM(PersonalApellido),', ',TRIM(PersonalNombre)) Supervisor
        FROM GrupoActividadPersonal gap
        LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId = gap.GrupoActividadId
        LEFT JOIN GrupoActividadJerarquico gaj ON gaj.GrupoActividadId = ga.GrupoActividadId AND gaj.GrupoActividadJerarquicoComo = 'J' AND gaj.GrupoActividadJerarquicoHasta IS NULL
        LEFT JOIN Personal per ON per.PersonalId = gaj.GrupoActividadJerarquicoPersonalId
        WHERE gap.GrupoActividadPersonalPersonalId IN (@0)
        ORDER BY gap.GrupoActividadPersonalDesde DESC
      `, [personalId]
      );

      this.jsonRes(responsables, res);
    } catch (error) {
      return next(error)
    }
  }

  async getGrupoActividad(req: any, res: Response, next: NextFunction) {
    try {
      const options = await dataSource.query(`
        SELECT ga.GrupoActividadId value, ga.GrupoActividadDetalle label
        FROM GrupoActividad ga
        WHERE ga.GrupoActividadInactivo != 1 OR ga.GrupoActividadInactivo IS NULL
        ORDER BY ga.GrupoActividadDetalle ASC
      `);

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

  valPersonalForm(personalForm: any, action: string) {
    let campos_vacios: any[] = []

    if (!personalForm.Nombre) {
      campos_vacios.push(`- Nombre`)
    }
    if (!personalForm.Apellido) {
      campos_vacios.push(`- Apellido`)
    }
    if (!Number.isInteger(personalForm.CUIT) || personalForm.CUIT.toString().length != 11) {
      campos_vacios.push(`- CUIT`)
    }
    if (!personalForm.SucursalId) {
      campos_vacios.push(`- Sucursal`)
    }
    if (!personalForm.NacionalidadId) {
      campos_vacios.push(`- Nacionalidad`)
    }
    if (!personalForm.Email) {
      campos_vacios.push(`- Email`)
    }
    if (action == 'I' && !personalForm.SituacionId) {
      campos_vacios.push(`- Situacion de Revista`)
    }

    if (campos_vacios.length) {
      campos_vacios.unshift('Debe completar los siguientes campos: ')
      return new ClientException(campos_vacios)
    }
  }

  async getDocumentosByPersonalId(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const personalId: number = Number(req.params.personalId);
    // const fechaActual = new Date();
    try {
      // await queryRunner.startTransaction()

      const documentos = await queryRunner.query(`
        SELECT foto.DocumentoImagenFotoId docId, foto.DocumentoImagenFotoBlobNombreArchivo NombreArchivo,
        param.DocumentoImagenParametroDe Parametro, param.DocumentoImagenParametroDescripcion Descripcion,
        CONCAT('/api/file-upload/downloadFile/', foto.DocumentoImagenFotoId, '/DocumentoImagenFoto/0') url
        FROM DocumentoImagenFoto foto
        LEFT JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = foto.DocumentoImagenParametroId
        WHERE foto.PersonalId IN (@0)
        UNION ALL
        SELECT doc.DocumentoImagenDocumentoId docId, doc.DocumentoImagenDocumentoBlobNombreArchivo NombreArchivo,
        param.DocumentoImagenParametroDe Parametro, param.DocumentoImagenParametroDescripcion Descripcion,
        CONCAT('/api/file-upload/downloadFile/', doc.DocumentoImagenDocumentoId, '/DocumentoImagenDocumento/0') url
        FROM DocumentoImagenDocumento doc
        LEFT JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = doc.DocumentoImagenParametroId
        WHERE doc.PersonalId IN (@0)
        UNION ALL
        SELECT CUIT.DocumentoImagenCUITCUILId docId, CUIT.DocumentoImagenCUITCUILBlobNombreArchivo NombreArchivo,
        param.DocumentoImagenParametroDe Parametro, param.DocumentoImagenParametroDescripcion Descripcion,
        CONCAT('/api/file-upload/downloadFile/', CUIT.DocumentoImagenCUITCUILId,'/DocumentoImagenCUITCUIL/0') url
        FROM DocumentoImagenCUITCUIL CUIT
        LEFT JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = CUIT.DocumentoImagenParametroId
        WHERE CUIT.PersonalId IN (@0)
        UNION ALL
        SELECT afip.DocumentoImagenImpuestoAFIPId docId, afip.DocumentoImagenImpuestoAFIPBlobNombreArchivo NombreArchivo,
        param.DocumentoImagenParametroDe Parametro, param.DocumentoImagenParametroDescripcion Descripcion,
        CONCAT('/api/file-upload/downloadFile/', afip.DocumentoImagenImpuestoAFIPId,'/DocumentoImagenImpuestoAFIP/0') url
        FROM DocumentoImagenImpuestoAFIP afip
        LEFT JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = afip.DocumentoImagenParametroId
        WHERE afip.PersonalId IN (@0) 
        UNION ALL
        SELECT curso.DocumentoImagenCursoId docId, curso.DocumentoImagenCursoBlobNombreArchivo NombreArchivo,
        param.DocumentoImagenParametroDe Parametro, param.DocumentoImagenParametroDescripcion Descripcion,
        CONCAT('/api/file-upload/downloadFile/', curso.DocumentoImagenCursoId, '/DocumentoImagenCurso/0') url
        FROM DocumentoImagenCurso curso
        LEFT JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = curso.DocumentoImagenParametroId
        WHERE curso.PersonalId IN (@0)
        UNION ALL
        SELECT habil.DocumentoImagenHabilitacionId docId, habil.DocumentoImagenHabilitacionBlobNombreArchivo NombreArchivo,
        param.DocumentoImagenParametroDe Parametro, param.DocumentoImagenParametroDescripcion Descripcion,
        CONCAT('/api/file-upload/downloadFile/', habil.DocumentoImagenHabilitacionId, '/DocumentoImagenHabilitacion/0') url
        FROM DocumentoImagenHabilitacion habil
        LEFT JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = habil.DocumentoImagenParametroId
        WHERE habil.PersonalId IN (@0)
        UNION ALL
        SELECT psi.DocumentoImagenPsicofisicoId docId, psi.DocumentoImagenPsicofisicoBlobNombreArchivo NombreArchivo,
        param.DocumentoImagenParametroDe Parametro, param.DocumentoImagenParametroDescripcion Descripcion,
        CONCAT('/api/file-upload/downloadFile/', psi.DocumentoImagenPsicofisicoId, '/DocumentoImagenPsicofisico/0') url
        FROM DocumentoImagenPsicofisico psi
        LEFT JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = psi.DocumentoImagenParametroId
        WHERE psi.PersonalId IN (@0)
        UNION ALL
        SELECT ren.DocumentoImagenRenarId docId, ren.DocumentoImagenRenarBlobNombreArchivo NombreArchivo,
        param.DocumentoImagenParametroDe Parametro, param.DocumentoImagenParametroDescripcion Descripcion,
        CONCAT('/api/file-upload/downloadFile/', ren.DocumentoImagenRenarId, '/DocumentoImagenRenar/0') url
        FROM DocumentoImagenRenar ren
        LEFT JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = ren.DocumentoImagenParametroId
        WHERE ren.PersonalId IN (@0)
        UNION ALL
        SELECT rein.DocumentoImagenCertificadoReincidenciaId docId, rein.DocumentoImagenCertificadoReincidenciaBlobNombreArchivo NombreArchivo,
        param.DocumentoImagenParametroDe Parametro, param.DocumentoImagenParametroDescripcion Descripcion,
        CONCAT('/api/file-upload/downloadFile/', rein.DocumentoImagenCertificadoReincidenciaId, '/DocumentoImagenCertificadoReincidencia/0') url
        FROM DocumentoImagenCertificadoReincidencia rein
        LEFT JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = rein.DocumentoImagenParametroId
        WHERE rein.PersonalId IN (@0)
        UNION ALL
        SELECT preo.DocumentoImagenPreocupacionalId docId, preo.DocumentoImagenPreocupacionalBlobNombreArchivo NombreArchivo,
        param.DocumentoImagenParametroDe Parametro, param.DocumentoImagenParametroDescripcion Descripcion,
        CONCAT('/api/file-upload/downloadFile/', preo.DocumentoImagenPreocupacionalId, '/DocumentoImagenPreocupacional/0') url
        FROM DocumentoImagenPreocupacional preo
        LEFT JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = preo.DocumentoImagenParametroId
        WHERE preo.PersonalId IN (@0)
        UNION ALL
        SELECT gen.doc_id docId, gen.nombre_archivo NombreArchivo,
        param.doctipo_id Parametro, param.detalle Descripcion,
        CONCAT('/api/file-upload/downloadFile/', gen.doc_id, '/docgeneral/0') url
        FROM lige.dbo.docgeneral gen
        LEFT JOIN lige.dbo.doctipo param ON param.doctipo_id = gen.doctipo_id
        WHERE gen.persona_id IN (@0)
        `, [personalId]
      )

      // await queryRunner.commitTransaction()
      this.jsonRes(documentos, res);
    } catch (error) {
      // this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      // await queryRunner.release()
    }
  }

  async downloadPersonaDocumentoImagen(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const id = Number(req.params.id)
    const table = req.params.table
    const pathArchivos = (process.env.PATH_ARCHIVOS) ? process.env.PATH_ARCHIVOS : '.'
    try {
      let ds: any
      if (table == 'docgeneral') {
        ds = await queryRunner.query(`
          SELECT gen.doc_id AS id, path, gen.nombre_archivo AS nombreArchivo,
          param.doctipo_id parametro
          FROM lige.dbo.docgeneral gen
          JOIN lige.dbo.doctipo param ON param.doctipo_id = gen.doctipo_id
          WHERE gen.doc_id = @0
          `, [id]
        )
      } else {
        ds = await queryRunner.query(`
          SELECT dir.DocumentoImagenParametroDirectorioPath path, doc.DocumentoImagen${table}BlobNombreArchivo nombreArchivo,
          param.DocumentoImagenParametroDe parametro
          FROM DocumentoImagen${table} doc
          JOIN DocumentoImagenParametroDirectorio dir ON dir.DocumentoImagenParametroDirectorioId = doc.DocumentoImagenParametroDirectorioId AND dir.DocumentoImagenParametroId =  doc.DocumentoImagenParametroId
          JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = doc.DocumentoImagenParametroId
          WHERE doc.DocumentoImagen${table}Id IN (@0)
          `, [id]
        )
      }

      if (ds.length == 0)
        throw new ClientException(`El archivo no existe`);

      const downloadPath = `${pathArchivos}/${ds[0].path.replaceAll('\\', '/')}/${ds[0].nombreArchivo}`;

      if (!existsSync(downloadPath))
        throw new ClientException(`El archivo ${ds[0].parametro} no se encuentra`, { 'path': downloadPath });

      res.download(downloadPath, ds[0].nombreArchivo, (msg) => { });

    } catch (error) {
      return next(error)
    }
  }

  async getTipoAsociado(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await queryRunner.query(`
        SELECT tipo.TipoAsociadoId value, TRIM(tipo.TipoAsociadoDescripcion) label
        FROM TipoAsociado tipo
      `)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

  async getCategoriasByTipoAsociado(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const tipoAsociado: number = req.body.tipoAsociadoId
    try {
      const options = await queryRunner.query(`
        SELECT catper.CategoriaPersonalId value, TRIM(catper.CategoriaPersonalDescripcion) label
        FROM CategoriaPersonal catper
        WHERE catper.TipoAsociadoId IN (@0) AND catper.CategoriaPersonalInactivo IS NULL
        `, [tipoAsociado]
      )

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

  async getHistoryPersonalCategoria(req: any, res: Response, next: NextFunction) {
    const personalId = Number(req.params.personalId);

    try {
      const listSitRevista = await dataSource.query(`
        SELECT percat.PersonalCategoriaId, percat.PersonalCategoriaTipoAsociadoId, TRIM(tipo.TipoAsociadoDescripcion) TipoAsociado,
        percat.PersonalCategoriaCategoriaPersonalId, TRIM(catper.CategoriaPersonalDescripcion) Categoria,
        percat.PersonalCategoriaDesde Desde, percat.PersonalCategoriaHasta Hasta
        FROM PersonalCategoria percat 
        LEFT JOIN TipoAsociado tipo ON tipo.TipoAsociadoId = percat.PersonalCategoriaTipoAsociadoId
        LEFT JOIN CategoriaPersonal catper ON catper.CategoriaPersonalId = percat.PersonalCategoriaCategoriaPersonalId AND catper.TipoAsociadoId = percat.PersonalCategoriaTipoAsociadoId
        WHERE percat.PersonalCategoriaPersonalId IN (@0)
        ORDER BY percat.PersonalCategoriaId DESC
        `, [personalId]
      )

      this.jsonRes(listSitRevista, res);
    } catch (error) {
      return next(error)
    }
  }

  private async setCategoriaQuerys(queryRunner: any, PersonalId: number, TipoAsociadoId: number, CategoriaId: number, Desde: Date) {
    Desde.setHours(0, 0, 0, 0)
    let yesterday: Date = new Date(Desde.getFullYear(), Desde.getMonth(), Desde.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    //Obtengo la última categoria
    let categoria = await queryRunner.query(`
      SELECT TOP 1 perc.PersonalCategoriaId, perc.PersonalCategoriaPersonalId,
      perc.PersonalCategoriaTipoAsociadoId, PersonalCategoriaCategoriaPersonalId,
      perc.PersonalCategoriaDesde, ISNULL(perc.PersonalCategoriaHasta, '9999-12-31') PersonalCategoriaHasta
      FROM PersonalCategoria perc
      WHERE perc.PersonalCategoriaPersonalId IN (@0) AND perc.PersonalCategoriaTipoAsociadoId IN(@1)  AND perc.PersonalCategoriaHasta IS NULL
      ORDER BY perc.PersonalCategoriaDesde DESC, ISNULL(perc.PersonalCategoriaHasta, '9999-12-31') DESC
      `, [PersonalId, TipoAsociadoId]
    )
    //Validaciones
    if (categoria.length && categoria[0].PersonalCategoriaTipoAsociadoId == TipoAsociadoId && categoria[0].PersonalCategoriaCategoriaPersonalId == CategoriaId)
      throw new ClientException(`Debe ingresar una categoria distinta a la que se encuentra activa.`)

    if (categoria.length && categoria[0].PersonalCategoriaDesde.getTime() > Desde.getTime())
      throw new ClientException(`La fecha Desde no puede ser menor al ${categoria[0].PersonalCategoriaDesde.getDate()}/${categoria[0].PersonalCategoriaDesde.getMonth() + 1}/${categoria[0].PersonalCategoriaDesde.getFullYear()}`)

    //Actuliza o Cierra la ultima categorización
    if (categoria.length && categoria[0].PersonalCategoriaDesde.getTime() == Desde.getTime()) {
      await queryRunner.query(`
        UPDATE PersonalCategoria SET PersonalCategoriaDesde = @2, PersonalCategoriaTipoAsociadoId = @3, PersonalCategoriaCategoriaPersonalId = @4
        WHERE PersonalCategoriaPersonalId IN (@0) AND PersonalCategoriaId IN (@1)
        `, [PersonalId, categoria[0]?.PersonalCategoriaId, Desde, TipoAsociadoId, CategoriaId]
      )
    } else {
      if (categoria.length) {
        await queryRunner.query(`
          UPDATE PersonalCategoria SET PersonalCategoriaHasta = @2
          WHERE PersonalCategoriaPersonalId IN (@0) AND PersonalCategoriaId IN (@1)`,
          [PersonalId, categoria[0].PersonalCategoriaId, yesterday]
        )
      }
      //Crea una nueva categoria
      const PersonalCategoriaUltNroQuery = await queryRunner.query(`SELECT ISNULL(PersonalCategoriaUltNro, 0) PersonalCategoriaUltNro, PersonalSuActualSucursalPrincipalId FROM Personal WHERE PersonalId IN (@0)`, [PersonalId])
      const PersonalCategoriaUltNro = PersonalCategoriaUltNroQuery[0].PersonalCategoriaUltNro + 1
      const SucursalId = PersonalCategoriaUltNroQuery[0].PersonalSuActualSucursalPrincipalId

      await queryRunner.query(`
        INSERT INTO PersonalCategoria ( PersonalCategoriaId, PersonalCategoriaPersonalId, PersonalCategoriaTipoAsociadoId, PersonalCategoriaCategoriaPersonalId, PersonalCategoriaDesde, SucursalId, TipoJornadaId)
          VALUES(@0, @1, @2, @3, @4, @5, @6)`,
        [PersonalCategoriaUltNro, PersonalId, TipoAsociadoId, CategoriaId, Desde, SucursalId, 1]
      )

      await queryRunner.query(`UPDATE Personal SET PersonalCategoriaUltNro = @1 WHERE PersonalId IN (@0)`, [PersonalId, PersonalCategoriaUltNro])
    }
  }

  async setCategoria(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const PersonalId: number = Number(req.params.id);
    const TipoAsociadoId = req.body.TipoAsociadoId
    const Desde = req.body.Desde
    const CategoriaId = req.body.CategoriaId
    try {
      let campos_vacios: any[] = []

      await queryRunner.startTransaction()

      if (!TipoAsociadoId) {
        campos_vacios.push(`- Tipo de Asociado`);
      }
      if (!CategoriaId) {
        campos_vacios.push(`- Categoría`);
      }
      if (!Desde) {
        campos_vacios.push(`- Fecha Desde`);
      }
      if (campos_vacios.length) {
        campos_vacios.unshift('Debe completar los siguientes campos:')
        throw new ClientException(campos_vacios);
      }


      await this.setCategoriaQuerys(queryRunner, PersonalId, TipoAsociadoId, CategoriaId, new Date(Desde))
      await queryRunner.commitTransaction()
      this.jsonRes({}, res, 'Carga Exitosa');
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  private async setGrupoActividadPersonalQuerys(
    queryRunner: any, PersonalId: number, GrupoActividadId: number, Desde: Date,
    usuarioId: number, ip: string
  ) {
    Desde.setHours(0, 0, 0, 0)
    let yesterday: Date = new Date(Desde.getFullYear(), Desde.getMonth(), Desde.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    let now: Date = new Date()
    const time = this.getTimeString(now)
    now.setHours(0, 0, 0, 0)

    //Obtengo el ultimo Grupo Actividad Personal
    let ultGrupoActividadPersonal = await queryRunner.query(`
      SELECT TOP 1 grup.GrupoActividadPersonalId, grup.GrupoActividadId, grup.GrupoActividadPersonalPersonalId,
      grup.GrupoActividadPersonalDesde, ISNULL(grup.GrupoActividadPersonalHasta, '9999-12-31') GrupoActividadPersonalHasta
      FROM GrupoActividadPersonal grup
      WHERE grup.GrupoActividadPersonalPersonalId IN (@0) 
      ORDER BY grup.GrupoActividadPersonalDesde DESC, ISNULL(grup.GrupoActividadPersonalHasta, '9999-12-31') DESC
      `, [PersonalId]
    )


    if (ultGrupoActividadPersonal.length == 1 && ultGrupoActividadPersonal[0].GrupoActividadPersonalDesde.getTime() > Desde.getTime())
      throw new ClientException(`La fecha Desde no puede ser menor al ${ultGrupoActividadPersonal[0].GrupoActividadPersonalDesde.getDate()}/${ultGrupoActividadPersonal[0].GrupoActividadPersonalDesde.getMonth() + 1}/${ultGrupoActividadPersonal[0].GrupoActividadPersonalDesde.getFullYear()}`)

    if (ultGrupoActividadPersonal[0]?.GrupoActividadId == GrupoActividadId)
      throw new ClientException(`Debe ingresar un Grupo Actividad distinto al que se encuentra activo.`)

    if (ultGrupoActividadPersonal.length > 0 && ultGrupoActividadPersonal[0].GrupoActividadPersonalDesde.getTime() == Desde.getTime()) {
      await queryRunner.query(`
        UPDATE GrupoActividadPersonal SET GrupoActividadPersonalDesde = @2, GrupoActividadId = @3
        WHERE GrupoActividadPersonalPersonalId IN (@0) AND GrupoActividadPersonalId IN (@1)
        `, [PersonalId, ultGrupoActividadPersonal[0].GrupoActividadPersonalId, Desde, GrupoActividadId]
      )
    } else {
      if (ultGrupoActividadPersonal.length) {
        await queryRunner.query(`
          UPDATE GrupoActividadPersonal SET GrupoActividadPersonalHasta = @2
          WHERE GrupoActividadPersonalPersonalId IN (@0) AND GrupoActividadPersonalId IN (@1)`,
          [PersonalId, ultGrupoActividadPersonal[0].GrupoActividadPersonalId, yesterday]
        )
      }

      //Obtengo y actualizo el ultimo GrupoActividadPersonalId
      const GrupoActividad = await queryRunner.query(`
        SELECT GrupoActividadId, GrupoActividadPersonalUltNro
        FROM GrupoActividad
        WHERE GrupoActividadId IN (@0)
        `, [GrupoActividadId]
      )
      const GrupoActividadPersonalId = GrupoActividad[0].GrupoActividadPersonalUltNro + 1
      await queryRunner.query(`
        UPDATE GrupoActividad SET GrupoActividadPersonalUltNro = @1
        WHERE GrupoActividadId IN (@0)`, [GrupoActividadId, GrupoActividadPersonalId]
      )

      //Crea un Grupo Actividad Personal nuevo
      await queryRunner.query(`
        INSERT INTO GrupoActividadPersonal ( 
        GrupoActividadPersonalId, GrupoActividadId, GrupoActividadPersonalPersonalId, GrupoActividadPersonalDesde,
        GrupoActividadPersonalPuesto, GrupoActividadPersonalUsuarioId, GrupoActividadPersonalDia, GrupoActividadPersonalTiempo
        ) VALUES(@0, @1, @2, @3, @4, @5, @6, @7)
        `, [GrupoActividadPersonalId, GrupoActividadId, PersonalId, Desde, ip, usuarioId, now, time]
      )

    }
  }

  async setGrupoActividadPersonal(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const PersonaId = res.locals.PersonalId
    const ip = this.getRemoteAddress(req)
    const PersonalId: number = Number(req.params.id);
    const GrupoActividadId = req.body.GrupoActividadId
    const Desde = req.body.Desde
    try {
      let campos_vacios: any[] = []
      await queryRunner.startTransaction()

      if (!GrupoActividadId) {
        campos_vacios.push(`- Grupo Actividad`);
      }
      if (!Desde) {
        campos_vacios.push(`- Fecha Desde`);
      }
      if (campos_vacios.length) {
        campos_vacios.unshift('Debe completar los siguientes campos:')
        throw new ClientException(campos_vacios);
      }

      const usuarioId = await this.getUsuarioId(res, queryRunner)

      await this.setGrupoActividadPersonalQuerys(queryRunner, PersonalId, GrupoActividadId, new Date(Desde), usuarioId, ip)

      await queryRunner.commitTransaction()
      this.jsonRes({}, res, 'Carga Exitosa');
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async getTipoParentesco(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await queryRunner.query(`
        SELECT TipoParentescoId value, TipoParentescoDescripcion label
        FROM TipoParentesco
      `)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

  async getBancos(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await queryRunner.query(`
        SELECT BancoId value, BancoDescripcion label
        FROM Banco
        WHERE BancoInactivo IS NULL
      `)
      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

  async getHistoryPersonalBanco(req: any, res: Response, next: NextFunction) {
    const personalId = Number(req.params.personalId);

    try {
      const listSitRevista = await dataSource.query(`
        SELECT perb.PersonalBancoId,
        TRIM(ban.BancoDescripcion) Descripcion, TRIM(perb.PersonalBancoCBU) CBU,
        perb.PersonalBancoDesde Desde, perb.PersonalBancoHasta Hasta
        FROM PersonalBanco perb
        LEFT JOIN Banco ban ON ban.BancoId = perb.PersonalBancoBancoId
        WHERE perb.PersonalId IN (@0)
        ORDER BY perb.PersonalBancoId DESC
        `, [personalId])

      this.jsonRes(listSitRevista, res);
    } catch (error) {
      return next(error)
    }
  }

  isCBU(cbu: string): boolean {
    // Verifica que tenga exactamente 22 caracteres
    if (cbu.length != 22)
      return false

    // Verifica que todos los caracteres sean números
    for (let i = 0; i < cbu.length; i++) {
      const char = cbu[i];
      if (char < '0' || char > '9')
        return false
    }

    return true
  }

  async setPersonalBanco(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const PersonalId: number = Number(req.params.id);
    const BancoId: number = req.body.BancoId
    const CBU = req.body.CBU
    let Desde = req.body.Desde
    try {
      let campos_vacios: any[] = []
      await queryRunner.startTransaction()

      if (!BancoId) campos_vacios.push(`- Banco`);
      if (!CBU) campos_vacios.push(`- CBU`);
      if (!Desde) campos_vacios.push(`- Fecha Desde`);
      if (campos_vacios.length) {
        campos_vacios.unshift('Debe completar los siguientes campos:')
        throw new ClientException(campos_vacios);
      }
      if (!this.isCBU(CBU))
        throw new ClientException('El CBU debe ser de 22 digitos.')

      let PersonalBanco = await queryRunner.query(`
        SELECT PersonalBancoId
        FROM PersonalBanco 
        WHERE PersonalBancoCBU = @0 AND PersonalBancoHasta IS NULL
      `, [CBU])
      if (PersonalBanco.length)
        throw new ClientException('No puedes ingresar un CBU ya registrado.');

      Desde = new Date(Desde)
      Desde.setHours(0, 0, 0, 0)

      PersonalBanco = await queryRunner.query(`
        SELECT PersonalBancoId, PersonalBancoDesde
        FROM PersonalBanco 
        WHERE PersonalId IN (@0) AND PersonalBancoBancoId IN (@1) AND PersonalBancoHasta IS NULL
      `, [PersonalId, BancoId])

      if (PersonalBanco.length && new Date(PersonalBanco[0].PersonalBancoDesde).getTime() == Desde.getTime()) {
        const PersonalBancoId = PersonalBanco[0].PersonalBancoId
        await queryRunner.query(`
          UPDATE PersonalBanco SET
          PersonalBancoCBU = @3
          WHERE PersonalId IN (@0) AND PersonalBancoBancoId IN (@1) AND PersonalBancoId IN (@2) AND PersonalBancoHasta IS NULL
        `, [PersonalId, BancoId, PersonalBancoId, CBU])
      } else {
        if (PersonalBanco.length) {
          if (PersonalBanco[0].PersonalBancoDesde.getTime() > Desde.getTime())
            throw new ClientException(`La fecha Desde no puede ser menor a la fecha ${PersonalBanco[0].PersonalBancoDesde.getDate()}/${PersonalBanco[0].PersonalBancoDesde.getMonth() + 1}/${PersonalBanco[0].PersonalBancoDesde.getFullYear()}`)

          const PersonalBancoId = PersonalBanco[0].PersonalBancoId
          const Hasta = new Date(Desde)
          Hasta.setDate(Hasta.getDate() - 1)
          await queryRunner.query(`
            UPDATE PersonalBanco SET
            PersonalBancoHasta = @3
            WHERE PersonalId IN (@0) AND PersonalBancoBancoId IN (@1) AND PersonalBancoId IN (@2)
          `, [PersonalId, BancoId, PersonalBancoId, Hasta])

        }
        const Personal = await queryRunner.query(`
          SELECT ISNULL(PersonalBancoUltNro, 0)+1 UltNro
          FROM Personal 
          WHERE PersonalId IN (@0)
        `, [PersonalId])
        const newPersonalBancoId = Personal[0].UltNro

        await queryRunner.query(`
          INSERT INTO PersonalBanco (PersonalId, PersonalBancoId, PersonalBancoBancoId, PersonalBancoCBU, PersonalBancoDesde)
          VALUES (@0, @1, @2, @3, @4)

          UPDATE Personal SET PersonalBancoUltNro = @1 WHERE PersonalId IN (@0)
        `, [PersonalId, newPersonalBancoId, BancoId, CBU, Desde])
      }

      await queryRunner.commitTransaction()
      this.jsonRes({}, res, 'Carga Exitosa');
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  private async setActasQuerys(queryRunner: any, personalId: number, actas: any) {
    const PersonalNroActa = actas.alta.numero
    const PersonalFechaActa = actas.alta.fecha
    const PersonalBajaNroActa = actas.baja.numero
    const PersonalBajaFechaActa = actas.baja.fecha
    const PersonalDestruccionNroActa = actas.destruccion.numero
    const PersonalFechaDestruccion = actas.destruccion.fecha

    if (((!PersonalNroActa && PersonalFechaActa) || (PersonalNroActa && !PersonalFechaActa)) ||
      ((!PersonalBajaNroActa && PersonalBajaFechaActa) || (PersonalBajaNroActa && !PersonalBajaFechaActa)) ||
      ((!PersonalDestruccionNroActa && PersonalFechaDestruccion) || (PersonalDestruccionNroActa && !PersonalFechaDestruccion))) {
      return new ClientException(`Los campos Fecha y Numero de la seccion Actas deben de completarse a la par.`)
    } else if ((PersonalNroActa && PersonalFechaActa) ||
      (PersonalBajaNroActa && PersonalBajaFechaActa) ||
      (PersonalDestruccionNroActa && PersonalFechaDestruccion)) {

      await queryRunner.query(`
            UPDATE Personal SET
            PersonalNroActa = @1, PersonalFechaActa = @2, PersonalBajaNroActa = @3,
            PersonalBajaFechaActa = @4, PersonalDestruccionNroActa = @5, PersonalFechaDestruccion = @6
            WHERE PersonalId IN (@0)
            `, [personalId, PersonalNroActa, PersonalFechaActa, PersonalBajaNroActa, PersonalBajaFechaActa, PersonalDestruccionNroActa, PersonalFechaDestruccion])
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

  private async setPersonalHabilitacionNecesaria(queryRunner: any, personalId: number, habilitaciones: any[], usuarioId: number, ip: string) {
    //Compruebo si hubo cambios
    let cambios: boolean = false
    const habilitacionesOld = await this.getFormHabilitacionByPersonalIdQuery(queryRunner, personalId)

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
    const time = this.getTimeString(now)

    let PersonalHabilitacionNecesariaId: number = 0
    now.setHours(0, 0, 0, 0)
    await queryRunner.query(`
      DELETE FROM PersonalHabilitacionNecesaria
      WHERE PersonalId IN (@0)
      `, [personalId])
    for (const habilitacionId of habilitaciones) {
      PersonalHabilitacionNecesariaId++
      await queryRunner.query(`
          INSERT INTO PersonalHabilitacionNecesaria (
          PersonalId, PersonalHabilitacionNecesariaId, PersonalHabilitacionNecesariaLugarHabilitacionId,
          PersonalHabilitacionNecesariaDesde, PersonalHabilitacionNecesariaPuesto, PersonalHabilitacionNecesariaUsuarioId,
          PersonalHabilitacionNecesariaDia, PersonalHabilitacionNecesariaTiempo)
          VALUES(@0,@1,@2,@3,@4,@5,@6,@7)
          `, [personalId, PersonalHabilitacionNecesariaId, habilitacionId, now, ip, usuarioId, now, time])
    }
    await queryRunner.query(`
      UPDATE Personal SET
      PersonalHabilitacionNecesariaUltNro = @1
      WHERE PersonalId IN (@0)
      `, [personalId, PersonalHabilitacionNecesariaId])
  }

  async getEstadoCivil(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await queryRunner.query(`
        SELECT EstadoCivilId AS value, EstadoCivilDescripcion AS label
        FROM EstadoCivil
      `)
      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

  async getTipoDocumento(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await queryRunner.query(`
        SELECT TipoDocumentoId value, TipoDocumentoDescripcion label
        FROM TipoDocumento
      `)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

  async setPersonalSeguroBeneficiario(queryRunner: any, PersonalId: any, beneficiarios: any[], usuario: string, ip: string) {

    await queryRunner.query(`UPDATE PersonalBeneficiario SET PersonalBeneficiarioInactivo = 1 WHERE PersonalId IN (@0)`, [PersonalId])
    for (const beneficiario of beneficiarios) {
      if (!beneficiario.Nombre && !beneficiario.Apellido && !beneficiario.TipoDocumentoId && !beneficiario.DocumentoNro)
        continue

      if (!beneficiario.Nombre || !beneficiario.Apellido || !beneficiario.TipoDocumentoId || !beneficiario.DocumentoNro)
        return new ClientException(`Los campos Nombre, Apellido, Tipo Documento y Documento Nro de la seccion Beneficiario No pueden estar vacios.`)

      if (beneficiario.Desde) {
        await this.updatePersonalSeguroBeneficiario(queryRunner, PersonalId, beneficiario, usuario, ip)
      } else
        await this.addPersonalSeguroBeneficiario(queryRunner, PersonalId, beneficiario, usuario, ip)
    }
  }

  async addPersonalSeguroBeneficiario(queryRunner: any, PersonalId: any, beneficiario: any, usuario: string, ip: string) {
    const Nombre = beneficiario.Nombre
    const Apellido = beneficiario.Apellido
    const TipoDocumentoId = beneficiario.TipoDocumentoId
    const DocumentoNro = beneficiario.DocumentoNro
    const TipoParentescoId = beneficiario.TipoParentescoId
    const Observacion = beneficiario.Observacion
    let desde: Date = new Date()
    // desde.setHours(0,0,0,0)
    await queryRunner.query(`
      INSERT INTO PersonalBeneficiario (
      PersonalId,
      PersonalBeneficiarioApellido,
      PersonalBeneficiarioNombre,
      TipoParentescoId,
      TipoDocumentoId,
      PersonalBeneficiarioDocumentoNro,
      PersonalBeneficiarioDesde,
      PersonalBeneficiarioObservacion,
      PersonalBeneficiarioInactivo,

      PersonalBeneficiarioAudFechaIng, 
      PersonalBeneficiarioAudUsuarioIng, 
      PersonalBeneficiarioAudIpIng,
      PersonalBeneficiarioAudFechaMod, 
      PersonalBeneficiarioAudUsuarioMod, 
      PersonalBeneficiarioAudIpMod
      )
      VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, 
        @9, @10, @11, @9, @10, @11)`, [
      PersonalId, Apellido, Nombre, TipoParentescoId,
      TipoDocumentoId, DocumentoNro, desde, Observacion, 0,
      desde, usuario, ip
    ])
  }

  async updatePersonalSeguroBeneficiario(queryRunner: any, PersonalId: any, beneficiario: any, usuario: string, ip: string) {
    const Nombre = beneficiario.Nombre
    const Apellido = beneficiario.Apellido
    const TipoDocumentoId = beneficiario.TipoDocumentoId

    // TODO - VALIDAR EL TAMAÑO DEL NRO DE DOCUMENTO - SINO ARROJA 'Arithmetic overflow error converting expression to data type int'.
    const DocumentoNro = beneficiario.DocumentoNro

    const TipoParentescoId = beneficiario.TipoParentescoId
    const Observacion = beneficiario.Observacion
    const desde: Date = new Date(beneficiario.Desde)
    let now: Date = new Date()
    // now.setHours(0,0,0,0)

    try {

      // COMPRUEBO SI EXISTE UN DNI YA CARGADO EN LA BASE DE DATOS
      let PersonalBeneficiarioDocumentoNro = await queryRunner.query(`
        SELECT PersonalId,PersonalBeneficiarioDocumentoNro
        FROM PersonalBeneficiario
        WHERE PersonalBeneficiarioDocumentoNro=@0 AND PersonalId= @1
        `, [DocumentoNro, PersonalId])


      if (PersonalBeneficiarioDocumentoNro.length > 0) {
        // HAGO UPDATE PERO NO DEL DOCUMENTO NRO
        await queryRunner.query(`
          UPDATE PersonalBeneficiario SET
          PersonalBeneficiarioApellido = @1,
          PersonalBeneficiarioNombre = @2,
          TipoParentescoId = @3,
          TipoDocumentoId = @4,
          PersonalBeneficiarioObservacion = @6,
          PersonalBeneficiarioInactivo = @7,

          PersonalBeneficiarioAudFechaMod = @8, 
          PersonalBeneficiarioAudUsuarioMod = @9, 
          PersonalBeneficiarioAudIpMod = @10

          WHERE PersonalId = @0 AND PersonalBeneficiarioDesde=@11 AND PersonalBeneficiarioDocumentoNro=@5` , [
          PersonalId,
          Apellido,
          Nombre,
          TipoParentescoId,
          TipoDocumentoId,
          DocumentoNro,
          Observacion,
          0,
          now,
          usuario,
          ip,
          desde
        ])

      } else {
        await queryRunner.query(`
          UPDATE PersonalBeneficiario SET
          PersonalBeneficiarioApellido = @1,
          PersonalBeneficiarioNombre = @2,
          TipoParentescoId = @3,
          TipoDocumentoId = @4,
          PersonalBeneficiarioDocumentoNro = @5,
          PersonalBeneficiarioObservacion = @6,
          PersonalBeneficiarioInactivo = @7,
    
          PersonalBeneficiarioAudFechaMod = @8, 
          PersonalBeneficiarioAudUsuarioMod = @9, 
          PersonalBeneficiarioAudIpMod = @10
          WHERE PersonalId = @0 AND PersonalBeneficiarioDesde=@11` , [
          PersonalId,
          Apellido,
          Nombre,
          TipoParentescoId,
          TipoDocumentoId,
          DocumentoNro,
          Observacion,
          0,
          now,
          usuario,
          ip,
          desde
        ])
      }
    } catch (error) {
      return new ClientException(error)

    }



  }

  async unsubscribeCBUs(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const PersonalId: number = Number(req.body.PersonalId);
    const yesterday: Date = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    try {
      await queryRunner.startTransaction()

      let PersonalBanco = await queryRunner.query(`
        SELECT PersonalBancoId
        FROM PersonalBanco 
        WHERE PersonalId IN (@0) AND PersonalBancoHasta IS NULL
      `, [PersonalId])
      if (!PersonalBanco.length)
        throw new ClientException('No se encuentro CBUs vigentes para dar de baja.');

      await queryRunner.query(`
        UPDATE PersonalBanco SET
        PersonalBancoHasta = @1
        WHERE PersonalId IN (@0) AND (PersonalBancoHasta IS NULL OR @1 < PersonalBancoHasta)
      `, [PersonalId, yesterday])

      await queryRunner.query(`
        DELETE FROM PersonalBanco
        WHERE PersonalId IN (@0) AND PersonalBancoHasta < PersonalBancoDesde
      `, [PersonalId, yesterday])

      await queryRunner.commitTransaction()
      this.jsonRes({}, res, 'Carga Exitosa');
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  // PersonalActas
  
  async getPersonalActa(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const personalId = Number(req.params.personalId);

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const PersonaActaList =  await queryRunner.query(`
         SELECT act.ActaId, act.ActaNroActa as NroActa
              , act.ActaDescripcion as DescriocionActa
              , act.ActaFechaActa as Desde
              , act.ActaFechaHasta as Hasta
              , peract.PersonalId
              , tipperact.TipoPersonalActaDescripcion as TipoActa
              , peract.PersonalActaDescripcion

        FROM PersonalActa peract
        LEFT JOIN Acta act ON act.ActaId=peract.ActaId
        LEFT JOIN TipoPersonalActa tipperact ON tipperact.TipoPersonalActaCodigo=peract.TipoPersonalActaCodigo
        WHERE peract.PersonalId IN (@0)
        ORDER BY act.ActaFechaActa desc
        `, [personalId])

      await queryRunner.commitTransaction();

      this.jsonRes(PersonaActaList, res);
    } catch (error) {
      return next(error)
    }
  }

    async getNroActa(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await queryRunner.query(`
        SELECT TOP 100 ActaId value
            , CONCAT(ActaNroActa, ' - ', TRIM(ActaDescripcion), ' - ', ActaFechaActa) label
            ,ActaFechaActa
        FROM Acta
        ORDER BY ActaFechaActa desc
      `)
      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

  async getTipoPersonalActa(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await queryRunner.query(`
        SELECT TipoPersonalActaCodigo value, TipoPersonalActaDescripcion label
        FROM TipoPersonalActa

      `)
      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }



}
