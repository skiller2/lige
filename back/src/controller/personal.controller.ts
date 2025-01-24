import { BaseController, ClientException } from "./baseController";
import { PersonaObj } from "../schemas/personal.schemas";
import fetch, { Request } from "node-fetch";
import { dataSource } from "../data-source";
import { Response } from "express-serve-static-core";
import { NextFunction, query } from "express";
import { mkdirSync, renameSync, existsSync, readFileSync, unlinkSync, copyFileSync } from "fs";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";
import { promisify } from 'util';
import * as fs from 'fs';

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
    id: "sitrev.PersonalSituacionRevistaDesde",
    name: "Fecha desde Situación",
    field: "PersonalSituacionRevistaDesde",
    type: "date",
    fieldName: "sitrev.PersonalSituacionRevistaDesde",
    searchType: "date",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: "PersonalFechaIngreso",
    name: "Fecha Ingreso",
    field: "PersonalFechaIngreso",
    type: "date",
    fieldName: "per.PersonalFechaIngreso",
    searchType: "date",
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
        `SELECT DISTINCT
        per.PersonalId PersonalId, cuit2.PersonalCUITCUILCUIT AS CUIT, CONCAT(TRIM(per.PersonalApellido), ',', TRIM(per.PersonalNombre)) ApellidoNombre,
        com.PersonalComprobantePagoAFIPAno,com.PersonalComprobantePagoAFIPMes,com.PersonalComprobantePagoAFIPImporte,
        ga.GrupoActividadId, ga.GrupoActividadNumero, ga.GrupoActividadDetalle,
        1
        FROM Personal per
        JOIN PersonalComprobantePagoAFIP com ON com.PersonalId=per.PersonalId AND com.PersonalComprobantePagoAFIPAno = @1 AND com.PersonalComprobantePagoAFIPMes = @2
        LEFT JOIN PersonalCUITCUIL cuit2 ON cuit2.PersonalId = per.PersonalId AND cuit2.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)
        LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND EOMONTH(DATEFROMPARTS(@1,@2,1)) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31')
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
    const estudios = await dataSource.query(`SELECT TOP 1 tip.TipoEstudioId, tip.TipoEstudioDescripcion, est.PersonalEstudioTitulo FROM PersonalEstudio est 
      JOIN TipoEstudio tip ON tip.TipoEstudioId = est.TipoEstudioId
      WHERE est.PersonalId=@0 AND est.EstadoEstudioId = 2
      ORDER BY tip.TipoEstudioId DESC `, [PersonalId])
    dataSource
      .query(
        `SELECT per.PersonalId, cuit.PersonalCUITCUILCUIT, foto.DocumentoImagenFotoBlobNombreArchivo, categ.CategoriaPersonalDescripcion, cat.PersonalCategoriaId,
        per.PersonalNombre, per.PersonalApellido, per.PersonalFechaNacimiento, per.PersonalFechaIngreso, per.PersonalNroLegajo,
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
        LEFT JOIN DocumentoImagenFoto foto ON foto.PersonalId = per.PersonalId
        LEFT JOIN PersonalCategoria cat ON cat.PersonalCategoriaPersonalId = per.PersonalId AND cat.PersonalCategoriaId = per.PersonalCategoriaUltNro
        LEFT JOIN CategoriaPersonal categ ON categ.TipoAsociadoId = cat.PersonalCategoriaTipoAsociadoId AND categ.CategoriaPersonalId = cat.PersonalCategoriaCategoriaPersonalId
        LEFT JOIN PersonalDomicilio AS dom ON dom.PersonalId = per.PersonalId AND dom.PersonalDomicilioActual = 1 AND dom.PersonalDomicilioId = ( SELECT MAX(dommax.PersonalDomicilioId) FROM PersonalDomicilio dommax WHERE dommax.PersonalId = per.PersonalId AND dom.PersonalDomicilioActual = 1)
        LEFT JOIN Localidad loc ON loc.LocalidadId  =  dom.PersonalDomicilioLocalidadId AND loc.PaisId = dom.PersonalDomicilioPaisId AND loc.ProvinciaId = dom.PersonalDomicilioProvinciaId
        LEFT JOIN Provincia pro ON pro.ProvinciaId  =  dom.PersonalDomicilioProvinciaId AND pro.PaisId = dom.PersonalDomicilioPaisId
        LEFT JOIN PersonalSucursalPrincipal sucper ON sucper.PersonalId = per.PersonalId
        LEFT JOIN Sucursal suc ON suc.SucursalId=sucper.PersonalSucursalPrincipalSucursalId
        
        LEFT JOIN (SELECT grp.GrupoActividadPersonalPersonalId, MAX(grp.GrupoActividadPersonalDesde) AS GrupoActividadPersonalDesde, MAX(ISNULL(grp.GrupoActividadPersonalHasta,'9999-12-31')) GrupoActividadPersonalHasta FROM GrupoActividadPersonal AS grp WHERE EOMONTH(DATEFROMPARTS(@1,@2,1)) > grp.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(grp.GrupoActividadPersonalHasta, '9999-12-31') GROUP BY grp.GrupoActividadPersonalPersonalId) as grupodesde ON grupodesde.GrupoActividadPersonalPersonalId = per.PersonalId
        LEFT JOIN GrupoActividadPersonal grupo ON grupo.GrupoActividadPersonalPersonalId = per.PersonalId AND grupo.GrupoActividadPersonalDesde = grupodesde.GrupoActividadPersonalDesde AND ISNULL(grupo.GrupoActividadPersonalHasta,'9999-12-31') = grupodesde.GrupoActividadPersonalHasta 
        LEFT JOIN GrupoActividad act ON act.GrupoActividadId= grupo.GrupoActividadId

        WHERE per.PersonalId = @0`,
        [PersonalId, anio, mes]
      )
      .then(async (records: Array<PersonaObj>) => {
        if (records.length != 1) throw new ClientException("Person not found");

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
        const imageFotoPath = process.env.IMAGE_FOTO_PATH
          ? process.env.IMAGE_FOTO_PATH
          : "";
        const imageUrl = personaData.DocumentoImagenFotoBlobNombreArchivo
          ? imageFotoPath.concat(
            personaData.DocumentoImagenFotoBlobNombreArchivo
          )
          : "";
        //        personaData.image = "";
        personaData.mails = mails;
        personaData.estudios = (estudios[0]) ? `${estudios[0].TipoEstudioDescripcion.trim()} ${estudios[0].PersonalEstudioTitulo.trim()}` : 'Sin registro'
        if (imageUrl != "") {
          const res = await fetch(imageUrl)
          const buffer = await res.arrayBuffer()
          const bufferStr = Buffer.from(buffer).toString('base64')
          personaData.image = "data:image/jpeg;base64, " + bufferStr;
        }

        this.jsonRes(personaData, res);
      })
      .catch((error) => {
        return next(error)
      });
  }

  async downloadPersonaImagen(PersonalId: number, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();

    const pathArchivos = (process.env.PATH_ARCHIVOS) ? process.env.PATH_ARCHIVOS : '.'
    try {
      const fechaActual = new Date();
      const ds = await queryRunner
        .query(
          `SELECT per.PersonalId, foto.DocumentoImagenFotoBlobNombreArchivo, dir.DocumentoImagenParametroDirectorioPath
          FROM Personal per
                  JOIN DocumentoImagenFoto foto ON foto.PersonalId = per.PersonalId 
                  JOIN DocumentoImagenParametroDirectorio dir ON dir.DocumentoImagenParametroDirectorioId = foto.DocumentoImagenParametroDirectorioId AND dir.DocumentoImagenParametroId =  foto.DocumentoImagenParametroId
                  JOIN DocumentoImagenParametro par ON par.DocumentoImagenParametroId = foto.DocumentoImagenParametroId
                  
                  WHERE per.PersonalId = @0`,
          [PersonalId, fechaActual]
        )

      if (ds.length == 0)
        throw new ClientException(`Documento no existe para la persona`);

      const downloadPath = `${pathArchivos}/${ds[0].DocumentoImagenParametroDirectorioPath.replaceAll('\\', '/')}/${ds[0].DocumentoImagenFotoBlobNombreArchivo}`;

      if (!existsSync(downloadPath))
        throw new ClientException(`El archivo Imagen no existe`, { 'path': downloadPath });

      res.download(downloadPath, ds[0].DocumentoImagenFotoBlobNombreArchivo, (msg) => { });

    } catch (error) {
      return next(error)
    }
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
      result.map((cuenta:any) => { cuenta.PersonalBancoCBU = cuenta.PersonalBancoCBU.slice(0, -6)+'XXXXXX' }) 
      this.jsonRes(result, res);
    } catch (error) {
      return next(error)
    }
  }


  search(req: any, res: Response, next: NextFunction) {
    const { fieldName, value } = req.body;

    let buscar = false;
    let query: string = `SELECT per.PersonalId, CONCAT(TRIM(per.PersonalApellido) , ', ', TRIM(per.PersonalNombre), ' CUIT:' , cuit.PersonalCUITCUILCUIT) fullName, ISNULL(sucpri.PersonalSucursalPrincipalSucursalId,1) SucursalId 
    FROM dbo.Personal per 
    LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)
    LEFT JOIN PersonalSucursalPrincipal sucpri ON sucpri.PersonalId = per.PersonalId 
 
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
--ROW_NUMBER() OVER(ORDER BY per.PersonalId) AS id,
per.PersonalId id,
per.PersonalId,
cuit.PersonalCUITCUILCUIT,
        CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre,
        per.PersonalNroLegajo, suc.SucursalId , TRIM(suc.SucursalDescripcion) AS SucursalDescripcion,
        sitrev.SituacionRevistaDescripcion,
        sitrev.PersonalSituacionRevistaDesde,
--        CONCAT(TRIM(sitrev.SituacionRevistaDescripcion), ' ', FORMAT(sitrev.PersonalSituacionRevistaDesde, 'dd/MM/yyyy')) AS SituacionRevista,
        per.PersonalFechaIngreso

        FROM Personal per
        LEFT JOIN (
          SELECT p.PersonalId, p.PersonalSituacionRevistaSituacionId, s.SituacionRevistaDescripcion,p.PersonalSituacionRevistaDesde
          FROM PersonalSituacionRevista p
          JOIN SituacionRevista s
          ON p.PersonalSituacionRevistaSituacionId = s.SituacionRevistaId AND p.PersonalSituacionRevistaDesde <= GETDATE() AND ISNULL(p.PersonalSituacionRevistaHasta,'9999-12-31') >= GETDATE()
			 ) sitrev ON sitrev.PersonalId = per.PersonalId
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 

        LEFT JOIN PersonalSucursalPrincipal sucper ON sucper.PersonalId = per.PersonalId
        LEFT JOIN Sucursal suc ON suc.SucursalId=sucper.PersonalSucursalPrincipalSucursalId
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
        SELECT sit.SituacionRevistaId value, sit.SituacionRevistaDescripcion label
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
    SucusalId: number,
    CUIT: number
  ) {
    Nombre = Nombre.toUpperCase()
    Apellido = Apellido.toUpperCase()
    const fullname: string = Apellido + ', ' + Nombre
    const PersonalEstado = 'POSTULANTE'
    const ApellidoNombreDNILegajo = `${Apellido}, ${Nombre} (${PersonalEstado} -CUIT ${CUIT} - Leg.:${NroLegajo})`
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
      -- PersonalFotoId,
      PersonalSucursalIngresoSucursalId,
      PersonalSuActualSucursalPrincipalId,
      PersonalEstado,
      PersonalApellidoNombreDNILegajo,
      PersonalCUITCUILUltNro
      )
      VALUES (@0,@1,@2,@3,@4,@5,@5,@6,@6,@7,@8,@9,@9,@10,@11,@12)
      
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
      PersonalEstado,
      ApellidoNombreDNILegajo,
      1
    ])
    // console.log('newId:',newId);
    let PersonalId = newId[0].id
    return PersonalId
  }

  private async addPersonalCUITQuery(queryRunner: any, personaId: any, CUIT: number, now: Date) {
    const PersonalCUITCUIL = await queryRunner.query(`
      SELECT PersonalCUITCUILUltNro
      FROM Personal
      WHERE PersonalId IN (@0)`,
      [personaId]
    )
    const PersonalCUITCUILId = PersonalCUITCUIL[0].PersonalCUITCUILUltNro + 1
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
      [personaId, PersonalCUITCUILId, 'T', CUIT, now]
    )
  }

  async addPersonalEmail(queryRunner: any, personaId: any, email: string) {
    await queryRunner.query(`
      INSERT INTO PersonalEmail (
      PersonalId,
      PersonalEmailId,
      PersonalEmailEmail,
      PersonalEmailInactivo
      )
      VALUES (@0,@1,@2,@3)`,
      [personaId, 1, email, 0]
    )
  }

  private async addPersonalDocumentoQuery(queryRunner: any, personaId: any, DNI: number) {
    const PersonalDocumento = await queryRunner.query(`
      SELECT PersonalDocumentoUltNro
      FROM Personal
      WHERE PersonalId IN (@0)`,
      [personaId]
    )
    const PersonalDocumentoId = PersonalDocumento[0].PersonalDocumentoUltNro + 1
    await queryRunner.query(`
      INSERT INTO PersonalCUITCUIL (
      PersonalDocumentoId,
      PersonalId,
      TipoDocumentoId,
      PersonalDocumentoNro
      )
      VALUES (@0, @1, @2, @3, @4)`,
      [PersonalDocumentoId, personaId, 1, DNI]
    )
  }

  async addPersonal(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    let Nombre: string = req.body.Nombre
    let Apellido: string = req.body.Apellido
    const CUIT: number = req.body.CUIT
    const NroLegajo: number = req.body.NroLegajo
    const SucursalId: number = req.body.SucursalId
    const Email = req.body.Email
    let FechaIngreso: Date = req.body.FechaIngreso ? new Date(req.body.FechaIngreso) : req.body.FechaIngreso
    let FechaNacimiento: Date = req.body.FechaIngreso ? new Date(req.body.FechaNacimiento) : req.body.FechaIngreso
    const foto = req.body.Foto
    const NacionalidadId: number = req.body.NacionalidadId
    const docFrente = req.body.docFrente
    const docDorso = req.body.docDorso
    const telefonos = req.body.telefonos
    const estudios = req.body.estudios
    let errors: string[] = []
    let now = new Date()
    now.setHours(0, 0, 0, 0)
    FechaIngreso ? FechaIngreso.setHours(0, 0, 0, 0) : FechaIngreso
    FechaNacimiento ? FechaNacimiento.setHours(0, 0, 0, 0) : FechaNacimiento

    try {
      await queryRunner.startTransaction()

      const valForm = this.valPersonalForm(req.body)
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
        queryRunner, NroLegajo, Apellido, Nombre, now, FechaIngreso, FechaNacimiento, NacionalidadId, SucursalId, CUIT
      )
      if (Number.isNaN(PersonalId)) {
        throw new ClientException('No se pudo generar un identificador.')
      }

      await this.addPersonalCUITQuery(queryRunner, PersonalId, CUIT, now)
      const DNI = parseInt(CUIT.toString().slice(2, -1))
      await this.addPersonalDocumentoQuery(queryRunner, PersonalId, DNI)

      if (req.body.Calle || req.body.Nro || req.body.Piso || req.body.Dpto || req.body.CodigoPostal || req.body.PaisId)
        await this.addPersonalDomicilio(queryRunner, req.body, PersonalId)

      if (Email) await this.addPersonalEmail(queryRunner, PersonalId, Email)


      for (const telefono of telefonos) {
        if (telefono.TelefonoNum) {
          if (!telefono.TipoTelefonoId) {
            errors.push(`El campo Tipo de la seccion Telefono No pueden estar vacios.`)
            break
          }
          await this.addPersonalTelefono(queryRunner, telefono, PersonalId)
        }
      }
      for (const estudio of estudios) {
        if (estudio.EstudioTitulo) {
          if (!estudio.TipoEstudioId || !estudio.EstadoEstudioId) {
            errors.push(`Los campos Tipo y Estados de la seccion Estudios No pueden estar vacios.`)
            break
          }
          await this.addPersonalEstudio(queryRunner, estudio, PersonalId)
        }
      }

      if (errors.length)
        throw new ClientException(errors)

      await this.setSituacionRevistaQuerys(queryRunner, PersonalId, req.body.SituacionId, now, req.body.Motivo)

      if (foto && foto.length) await this.setFoto(queryRunner, PersonalId, foto[0])

      if (docFrente && docFrente.length) await this.setDocumento(queryRunner, PersonalId, docFrente[0], 12)

      if (docDorso && docDorso.length) await this.setDocumento(queryRunner, PersonalId, docDorso[0], 13)

    
      
      await queryRunner.commitTransaction()
      return this.jsonRes({}, res, 'Carga Exitosa');
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async addPersonalTelefono(queryRunner: any, telefono: any, personalId: any) {
    const tipoTelefonoId = telefono.TipoTelefonoId
    const telefonoNum = telefono.TelefonoNro
    await queryRunner.query(`
      INSERT INTO PersonalTelefono (
      PersonalId,
      TipoTelefonoId,
      PersonalTelefonoNro
      )
      VALUES (@0,@1,@2)`, [
      personalId, tipoTelefonoId, telefonoNum
    ])
    await queryRunner.query(`
      UPDATE Personal SET PersonalTelefonoUltNro = ISNULL(PersonalTelefonoUltNro, 0) + 1 WHERE PersonalId = @1
      `, [personalId])
  }

  async addPersonalEstudio(queryRunner: any, estudio: any, personalId: any) {
    const tipoEstudioId = estudio.TipoEstudioId
    const estadoEstudioId = estudio.EstadoEstudioId
    const estudioTitulo = estudio.EstudioTitulo
    const estudioAnio = estudio.EstudioAno
    const docTitulo = estudio.DocTitulo[0]
    await queryRunner.query(`
      INSERT INTO PersonalEstudio (
      PersonalId,
      TipoEstudioId,
      EstadoEstudioId,
      PersonalEstudioTitulo,
      PersonalEstudioAno,
      )
      VALUES (@0,@1,@2,@3,@4)`, [
      personalId, tipoEstudioId, estadoEstudioId, estudioTitulo, estudioAnio
    ])
    await queryRunner.query(`
      UPDATE Personal SET PersonalEstudioUltNro = ISNULL(PersonalEstudioUltNro, 0) + 1 WHERE PersonalId = @1
    `, [personalId])
    if (docTitulo) {
      await this.setImagenEstudio(queryRunner, personalId, docTitulo)
    }
  }

  async addPersonalDomicilio(queryRunner: any, domicilio: any, personalId: any) {
    const calle = domicilio.Calle
    const numero = domicilio.Nro
    const piso = domicilio.Piso
    const departamento = domicilio.Dpto
    const codPostal = domicilio.CodigoPostal
    const paisId = domicilio.PaisId ? domicilio.PaisId : null
    const provinciaId = domicilio.ProvinciaId ? domicilio.ProvinciaId : null
    const localidadId = domicilio.LocalidadId ? domicilio.LocalidadId : null
    const barrioId = domicilio.BarrioId ? domicilio.BarrioId : null
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
      personalId,
      1,
      calle,
      numero,
      piso,
      departamento,
      codPostal,
      1,
      paisId,
      provinciaId,
      localidadId,
      barrioId,
    ])
    await queryRunner.query(`
      UPDATE Personal SET PersonalDomicilioUltNro = ISNULL(PersonalDomicilioUltNro, 0) + 1 WHERE PersonalId = @0
      `, [personalId])
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

  moveFile(dirFile: any, newFilePath: any) {
    // console.log("dirFile ", dirFile)
    // console.log("newFilePath ", newFilePath)
    if (!existsSync(dirFile)) {
      mkdirSync(dirFile, { recursive: true })
    }

    renameSync(dirFile, newFilePath)

  }

  async setFoto(queryRunner: any, personalId: any, file: any) {
    const type = file.mimeType.split('/')[1]
    const fieldname = file.fieldname
    let foto = await queryRunner.query(`
      SELECT foto.DocumentoImagenFotoId fotoId, dir.DocumentoImagenParametroDirectorioPath
      JOIN DocumentoImagenParametroDirectorio dir ON dir.DocumentoImagenParametroDirectorioId = foto.DocumentoImagenParametroDirectorioId AND dir.DocumentoImagenParametroId = foto.DocumentoImagenParametroId
      JOIN DocumentoImagenParametro par ON par.DocumentoImagenParametroId = foto.DocumentoImagenParametroId
      FROM DocumentoImagenFoto foto WHERE foto.PersonalId IN (@0)
    `, [personalId])
    if (!foto.length) {
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
      foto = await queryRunner.query(`
        SELECT foto.DocumentoImagenFotoId fotoId, dir.DocumentoImagenParametroDirectorioPath
        JOIN DocumentoImagenParametroDirectorio dir ON dir.DocumentoImagenParametroDirectorioId = foto.DocumentoImagenParametroDirectorioId AND dir.DocumentoImagenParametroId = foto.DocumentoImagenParametroId
        JOIN DocumentoImagenParametro par ON par.DocumentoImagenParametroId = foto.DocumentoImagenParametroId
        FROM DocumentoImagenFoto foto WHERE foto.PersonalId IN (@0)
      `, [personalId])
    }

    const fotoId = foto[0].fotoId
    const pathArchivos = (process.env.PATH_ARCHIVOS) ? process.env.PATH_ARCHIVOS : '.'
    const dirFile = `${process.env.PATH_DOCUMENTS}/temp/${fieldname}.${type}`;
    const newFieldname = `${personalId}-${fotoId}-FOTO`
    const newFilePath = `${pathArchivos}/${foto[0].DocumentoImagenParametroDirectorioPath.replaceAll('\\', '/')}/${newFieldname}.${type}`;
    this.moveFile(dirFile, newFilePath);
    await queryRunner.query(`
      UPDATE DocumentoImagenFoto SET
      DocumentoImagenFotoBlobNombreArchivo = @1,
      DocumentoImagenFotoBlobTipoArchivo = @2,
      DocumentoImagenParametroId = @3,
      DocumentoImagenParametroDirectorioId = @4
      WHERE PersonalId = @0`,
      [personalId, newFieldname, type, 7, 1]
    )
    await queryRunner.query(`UPDATE Personal SET PersonalFotoId = @0 WHERE PersonalId = @1`,
      [fotoId, personalId]
    )
  }

  async setDocumento(queryRunner: any, personalId: any, file: any, parametro: number) {
    const type = file.mimeType.split('/')[1]
    const fieldname = file.fieldname
    let doc = await queryRunner.query(`
      SELECT doc.DocumentoImagenDocumentoId docId, dir.DocumentoImagenParametroDirectorioPath
      JOIN DocumentoImagenParametroDirectorio dir ON dir.DocumentoImagenParametroDirectorioId = doc.DocumentoImagenParametroDirectorioId AND dir.DocumentoImagenParametroId =  doc.DocumentoImagenParametroId
      JOIN DocumentoImagenParametro par ON par.DocumentoImagenParametroId = doc.DocumentoImagenParametroId
      FROM DocumentoImagenDocumento doc WHERE doc.PersonalId IN (@0)
    `, [personalId])
    if (!doc.length) {
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
      doc = await queryRunner.query(`
        SELECT doc.DocumentoImagenDocumentoId docId, dir.DocumentoImagenParametroDirectorioPath
        JOIN DocumentoImagenParametroDirectorio dir ON dir.DocumentoImagenParametroDirectorioId = doc.DocumentoImagenParametroDirectorioId AND dir.DocumentoImagenParametroId = doc.DocumentoImagenParametroId
        JOIN DocumentoImagenParametro par ON par.DocumentoImagenParametroId = doc.DocumentoImagenParametroId
        FROM DocumentoImagenDocumento doc WHERE doc.PersonalId IN (@0)
      `, [personalId])
    }

    const docId = doc[0].docId
    const pathArchivos = (process.env.PATH_ARCHIVOS) ? process.env.PATH_ARCHIVOS : '.'
    const dirFile: string = `${process.env.PATH_DOCUMENTS}/temp/${fieldname}.${type}`;
    let newFieldname: string = `${personalId}-${docId}`
    if (parametro == 13) {
      newFieldname += `-DOCUMENDOR`
    } else if (parametro == 12) {
      newFieldname += `-DOCUMENFREN`
    }
    const newFilePath: string = `${pathArchivos}/${doc[0].DocumentoImagenParametroDirectorioPath.replaceAll('\\', '/')}/${newFieldname}.${type}`;
    this.moveFile(dirFile, newFilePath);
    await queryRunner.query(`
      UPDATE DocumentoImagenDocumento SET
      DocumentoImagenDocumentoBlobNombreArchivo = @1,
      DocumentoImagenDocumentoBlobTipoArchivo = @2,
      DocumentoImagenParametroId = @3,
      DocumentoImagenParametroDirectorioId = @4
      WHERE PersonalId = @0
    `, [personalId, newFieldname, type, parametro, 1]
    )
  }

  async setImagenEstudio(queryRunner: any, personalId: any, file: any) {
    const type = file.mimeType.split('/')[1]
    const fieldname = file.fieldname
    let estudio = await queryRunner.query(`
      SELECT est.DocumentoImagenEstudioId estudioId, dir.DocumentoImagenParametroDirectorioPath
      JOIN DocumentoImagenParametroDirectorio dir ON dir.DocumentoImagenParametroDirectorioId = est.DocumentoImagenParametroDirectorioId AND dir.DocumentoImagenParametroId =  est.DocumentoImagenParametroId
      JOIN DocumentoImagenParametro par ON par.DocumentoImagenParametroId = est.DocumentoImagenParametroId
      FROM DocumentoImagenEstudio est WHERE est.PersonalId IN (@0)
      `, [personalId])
    if (!estudio.length) {
      await queryRunner.query(`
        INSERT INTO DocumentoImagenEstudio (
        PersonalId,
        DocumentoImagenEstudioBlobTipoArchivo,
        DocumentoImagenParametroId,
        DocumentoImagenParametroDirectorioId
        )
        VALUES(@0,@1,@2,@3)
      `, [personalId, type, 14, 1])
      estudio = await queryRunner.query(`
        SELECT est.DocumentoImagenEstudioId estudioId, dir.DocumentoImagenParametroDirectorioPath
        JOIN DocumentoImagenParametroDirectorio dir ON dir.DocumentoImagenParametroDirectorioId = est.DocumentoImagenParametroDirectorioId AND dir.DocumentoImagenParametroId =  est.DocumentoImagenParametroId
        JOIN DocumentoImagenParametro par ON par.DocumentoImagenParametroId = est.DocumentoImagenParametroId
        FROM DocumentoImagenEstudio est WHERE est.PersonalId IN (@0)
      `, [personalId])
    }

    const estudioId = estudio[0].estudioId
    const pathArchivos = (process.env.PATH_ARCHIVOS) ? process.env.PATH_ARCHIVOS : '.'
    const dirFile = `${process.env.PATH_DOCUMENTS}/temp/${fieldname}.${type}`;
    const newFieldname = `${personalId}-${estudioId}-CERESTPAG1`
    const newFilePath = `${pathArchivos}/${estudio[0].DocumentoImagenParametroDirectorioPath.replaceAll('\\', '/')}/${newFieldname}.${type}`;
    this.moveFile(dirFile, newFilePath);
    await queryRunner.query(`
      UPDATE DocumentoImagenEstudio SET
      DocumentoImagenEstudioBlobNombreArchivo = @1,
      DocumentoImagenEstudioBlobTipoArchivo = @2,
      DocumentoImagenParametroId = @3,
      DocumentoImagenParametroDirectorioId = @4
      WHERE PersonalId IN (@0)`,
      [personalId, newFieldname, type, 14, 1]
    )
    await queryRunner.query(`UPDATE PersonalEstudio SET PersonalEstudioPagina1Id = @0 WHERE PersonalId IN (@1)`,
      [estudioId, personalId]
    )
  }

  private async updatePersonalQuerys(queryRunner: any, PersonalId: number, infoPersonal: any) {
    let personalRes = await queryRunner.query(`
      SELECT PersonalNroLegajo NroLegajo, TRIM(PersonalApellido) Apellido, TRIM(PersonalNombre) Nombre,
      PersonalFechaIngreso FechaIngreso, PersonalFechaNacimiento FechaNacimiento,
      PersonalNacionalidadId NacionalidadId, PersonalSucursalIngresoSucursalId SucursalId
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
    const NroLegajo: number = infoPersonal.NroLegajo
    const SucursalId: number = infoPersonal.SucursalId
    let FechaIngreso: Date = infoPersonal.FechaIngreso ? new Date(infoPersonal.FechaIngreso) : null
    let FechaNacimiento: Date = infoPersonal.FechaNacimiento ? new Date(infoPersonal.FechaNacimiento) : null
    const CUIT: number = infoPersonal.CUIT
    FechaIngreso.setHours(0, 0, 0, 0)
    FechaNacimiento.setHours(0, 0, 0, 0)
    Nombre = Nombre.toUpperCase()
    Apellido = Apellido.toUpperCase()
    const fullname: string = Apellido + ', ' + Nombre
    const PersonalEstado = 'POSTULANTE'
    const ApellidoNombreDNILegajo = `${Apellido}, ${Nombre} (${PersonalEstado} -CUIT ${CUIT} - Leg.:${NroLegajo})`
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
      PersonalSucursalIngresoSucursalId = @8,
      PersonalSuActualSucursalPrincipalId = @8,
      PersonalApellidoNombreDNILegajo = @9
      WHERE PersonalId = @0
      `, [PersonalId, NroLegajo, Apellido, Nombre, fullname, FechaIngreso, FechaNacimiento, NacionalidadId,
      SucursalId, ApellidoNombreDNILegajo
    ])
  }

  private async updatePersonalDomicilio(queryRunner: any, PersonalId: number, infoDomicilio: any) {
    let domicilioRes = await queryRunner.query(`
      SELECT TRIM(PersonalDomicilioDomCalle) Calle, TRIM(PersonalDomicilioDomNro) Nro, TRIM(PersonalDomicilioDomPiso) Piso,
      TRIM(PersonalDomicilioDomDpto) Dpto, TRIM(PersonalDomicilioCodigoPostal) CodigoPostal, PersonalDomicilioPaisId PaisId, PersonalDomicilioProvinciaId ProvinciaId,
      PersonalDomicilioLocalidadId LocalidadId, PersonalDomicilioBarrioId BarrioId
      FROM PersonalDomicilio
      WHERE PersonalId = @0 AND PersonalDomicilioId = @1
      `, [PersonalId, infoDomicilio.PersonalDomicilioId])
    const domicilio = domicilioRes[0] ? domicilioRes[0] : {}

    let cambio: boolean = false
    for (const key in domicilio) {
      if (infoDomicilio[key] != domicilio[key]) {
        cambio = true
        break
      }
    }
    if (!cambio) return

    const calle = infoDomicilio.Calle
    const numero = infoDomicilio.Nro
    const piso = infoDomicilio.Piso
    const departamento = infoDomicilio.Dpto
    const esquina = infoDomicilio.Esquina
    const esquinaY = infoDomicilio.EsquinaY
    const bloque = infoDomicilio.Bloque
    const edificio = infoDomicilio.Edificio
    const cuerpo = infoDomicilio.Cuerpo
    const codPostal = infoDomicilio.CodigoPostal
    const paisId = infoDomicilio.PaisId
    const provinciaId = infoDomicilio.ProvinciaId
    const localidadId = infoDomicilio.LocalidadId
    const barrioId = infoDomicilio.BarrioId
    await queryRunner.query(`
      UPDATE PersonalDomicilio SET
      PersonalDomicilioDomCalle = @1,
      PersonalDomicilioDomNro = @2,
      PersonalDomicilioDomPiso = @3,
      PersonalDomicilioDomDpto = @4,
      PersonalDomicilioEntreEsquina = @5,
      PersonalDomicilioEntreEsquinaY = @6,
      PersonalDomicilioDomBloque = @7,
      PersonalDomicilioDomEdificio = @8,
      PersonalDomicilioDomCuerpo = @9,
      PersonalDomicilioCodigoPostal = @10,
      PersonalDomicilioPaisId = @11,
      PersonalDomicilioProvinciaId = @12,
      PersonalDomicilioLocalidadId = @13,
      PersonalDomicilioBarrioId = @14
      WHERE PersonalId IN (@0)
      `, [
      PersonalId, calle, numero, piso, departamento, esquina, esquinaY, bloque, edificio, cuerpo, codPostal,
      paisId, provinciaId, localidadId, barrioId,
    ])

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
    const codigoPais = infoTelefono.CodigoPais
    const codigoArea = infoTelefono.CodigoArea
    const telefonoNum = infoTelefono.TelefonoNro
    await queryRunner.query(`
      UPDATE PersonalTelefono SET
      LugarTelefonoId = @2,
      TipoTelefonoId = @3,
      PersonalTelefonoCodigoPais = @4,
      PersonalTelefonoCodigoArea = @5,
      PersonalTelefonoNro = @6,
      PersonalTelefonoInactivo = null
      WHERE PersonalId IN (@0) AND PersonalTelefonoId IN (@1)
      `, [
      PersonalId, PersonalTelefonoId, lugarTelefonoId, tipoTelefonoId, codigoPais, codigoArea, telefonoNum
    ])
  }

  private async updatePersonalEstudio(queryRunner: any, PersonalId: number, infoEstudio: any) {
    const PersonalEstudioId = infoEstudio.PersonalEstudioId
    let estudio = await queryRunner.query(`
      SELECT TipoEstudioId , EstadoEstudioId, TRIM(PersonalEstudioTitulo) EstudioTitulo, PersonalEstudioAno EstudioAno
      FROM PersonalEstudio
      WHERE PersonalId IN (@0) AND PersonalEstudioId IN (@1)
      `, [PersonalId, PersonalEstudioId])
    if (!estudio.length)
      return await this.addPersonalEstudio(queryRunner, infoEstudio, PersonalId)
    estudio = estudio[0]

    let cambio: boolean = false
    for (const key in estudio) {
      if (infoEstudio[key] != estudio[key]) {
        cambio = true
        break
      }
    }
    if (!cambio) return
    const tipoEstudioId = estudio.TipoEstudioId
    const estadoEstudioId = estudio.EstadoEstudioId
    const estudioTitulo = estudio.EstudioTitulo
    const estudioAno = estudio.EstudioAno
    const docTitulo = estudio.DocTitulo[0]
    await queryRunner.query(`
      UPDATE PersonalEstudio SET
      TipoEstudioId = @2,
      EstadoEstudioId = @3,
      PersonalEstudioTitulo = @4,
      PersonalEstudioAno = @5
      WHERE PersonalId IN (@0) AND PersonalEstudioId IN (@1)
      `, [
      PersonalId, PersonalEstudioId, tipoEstudioId, estadoEstudioId, estudioTitulo, estudioAno
    ])
    if (docTitulo) {
      await this.setImagenEstudio(queryRunner, PersonalId, docTitulo)
    }
  }

  async updatePersonalEmail(queryRunner: any, personaId: any, infoEmail: any) {
    const PersonalEmailId = infoEmail.PersonalEmailId
    const Email = infoEmail.Email
    if (PersonalEmailId) {
      let PersonalEmailEmail = await queryRunner.query(`
        SELECT PersonalEmailEmail
        FROM PersonalEmail
        WHERE PersonalId IN (@0) AND PersonalEmailId IN (@1)`,
        [personaId, PersonalEmailId]
      )
      PersonalEmailEmail = PersonalEmailEmail[0].PersonalEmailEmail
      if (PersonalEmailEmail != Email)
        await queryRunner.query(`UPDATE PersonalEmail SET PersonalEmailEmail = @1 WHERE PersonalId IN (@0)`,
          [personaId, Email]
        )
    } else {
      if (Email) await this.addPersonalEmail(queryRunner, personaId, Email)
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

  async updatePersonalCUITQuery(queryRunner: any, personaId: any, CUIT: number, now:Date) {
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
    }else if (PersonalCUITCUILDesde.getTime() == now.getTime()) {
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
    let now = new Date()
    now.setHours(0, 0, 0, 0)

    try {
      await queryRunner.startTransaction()

      const valForm = this.valPersonalForm(req.body)
      if (valForm instanceof ClientException)
        throw valForm

      await this.updatePersonalQuerys(queryRunner, PersonalId, req.body)

      const PersonalCUITCUIL = await queryRunner.query(`
        SELECT PersonalCUITCUILCUIT cuit FROM PersonalCUITCUIL WHERE PersonalId = @0 ORDER BY PersonalCUITCUILId DESC`, [PersonalId]
      )
      if (PersonalCUITCUIL[0].cuit != CUIT) {
        await this.updatePersonalCUITQuery(queryRunner, PersonalId, CUIT, now)
        const DNI = parseInt(CUIT.toString().slice(2, -1))
        await this.updatePersonalDocumentoQuery(queryRunner, PersonalId, DNI)
      }
      await this.updatePersonalDomicilio(queryRunner, PersonalId, req.body)
      await this.updatePersonalEmail(queryRunner, PersonalId, req.body)
      // await this.updatePersonalSitRevista(queryRunner, PersonalId, req.body)

      //Telefonos
      await queryRunner.query(`UPDATE PersonalTelefono SET PersonalTelefonoInactivo = 1 WHERE PersonalId IN (@0)`, [PersonalId])
      for (const telefono of telefonos) {
        if (telefono.TelefonoNro) await this.updatePersonalTelefono(queryRunner, PersonalId, telefono)
      }
      //Estudios
      // await queryRunner.query(``)
      for (const estudio of estudios) {
        if (estudio.EstudioTitulo) await this.updatePersonalEstudio(queryRunner, PersonalId, estudio)
      }

      if (Foto && Foto.length) await this.setFoto(queryRunner, PersonalId, Foto)

      if (docFrente && docFrente.length) await this.setDocumento(queryRunner, PersonalId, docFrente, 12)

      if (docDorso && docDorso.length) await this.setDocumento(queryRunner, PersonalId, docDorso, 13)

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
      per.PersonalSuActualSucursalPrincipalId SucursalId , TRIM(suc.SucursalDescripcion) AS SucursalDescripcion, nac.NacionalidadId, TRIM(nac.NacionalidadDescripcion),
      TRIM(dom.PersonalDomicilioDomCalle) Calle, TRIM(dom.PersonalDomicilioDomNro) Nro, TRIM(dom.PersonalDomicilioDomPiso) Piso,
      TRIM(dom.PersonalDomicilioDomDpto) Dpto, TRIM(dom.PersonalDomicilioCodigoPostal) CodigoPostal, dom.PersonalDomicilioPaisId PaisId,
      dom.PersonalDomicilioProvinciaId ProvinciaId, dom.PersonalDomicilioLocalidadId LocalidadId, dom.PersonalDomicilioBarrioId BarrioId, dom.PersonalDomicilioId,
      email.PersonalEmailEmail Email, email.PersonalEmailId,
      sit.PersonalSituacionRevistaId, TRIM(sit.PersonalSituacionRevistaMotivo) Motivo, sit.PersonalSituacionRevistaSituacionId SituacionId
      FROM Personal per
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN DocumentoImagenFoto foto ON foto.PersonalId = per.PersonalId
      LEFT JOIN Sucursal suc ON suc.SucursalId = per.PersonalSuActualSucursalPrincipalId
      LEFT JOIN Nacionalidad nac ON nac.NacionalidadId = per.PersonalNacionalidadId
      LEFT JOIN PersonalDomicilio dom ON dom.PersonalId = per.PersonalId AND dom.PersonalDomicilioActual IN (1)
      LEFT JOIN PersonalEmail email ON email.PersonalId = per.PersonalId AND email.PersonalEmailInactivo IN (0)
      LEFT JOIN PersonalSituacionRevista sit ON sit.PersonalId = per.PersonalId AND sit.PersonalSituacionRevistaId = per.PersonalSituacionRevistaUltNro
      WHERE per.PersonalId = @0
      `, [personalId]
    )
    return data[0]
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
        TRIM(est.PersonalEstudioTitulo) EstudioTitulo, est.PersonalEstudioAno EstudioAno
        FROM PersonalEstudio est
        WHERE est.PersonalId IN (@0)
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

      data.telefonos = telefonos
      data.estudios = estudios

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


    if (this.listSitRev.split(',').find((sit: any) =>  SituacionRevistaId == sit )) 
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
      throw new ClientException(`La fecha desde de situación de revista no puede ser menor al ${sitRevista[0].PersonalSituacionRevistaDesde.getDate()}/${sitRevista[0].PersonalSituacionRevistaDesde.getMonth()+1}/${sitRevista[0].PersonalSituacionRevistaDesde.getFullYear()}`)

    if (sitRevista[0]?.PersonalSituacionRevistaSituacionId == SituacionRevistaId)
      throw new ClientException(`La situación de revista es igual a la existente`)

    if (sitRevista.length > 0 && this.listSitRev.split(',').find((sit: any) =>  sitRevista[0]?.PersonalSituacionRevistaSituacionId == sit ))
      throw new ClientException(`No se puede modificar la situación de revista desde esta pantalla`)

    if (sitRevista.length>0 && sitRevista[0].PersonalSituacionRevistaDesde.getTime() == desde.getTime()) {
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

  valPersonalForm(personalForm: any) {
    let campos_vacios: any[] = []

    if (!personalForm.Nombre) {
      campos_vacios.push(`- Nombre`)
    }
    if (!personalForm.Apellido) {
      campos_vacios.push(`- Apellido`)
    }
    if (!Number.isInteger(personalForm.CUIT)) {
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
    if (!personalForm.SituacionId) {
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
        CONCAT('/api/personal/download/Foto/', foto.DocumentoImagenFotoId) url
        FROM DocumentoImagenFoto foto
        LEFT JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = foto.DocumentoImagenParametroId
        WHERE foto.PersonalId IN (@0)
        UNION ALL
        SELECT doc.DocumentoImagenDocumentoId docId, doc.DocumentoImagenDocumentoBlobNombreArchivo NombreArchivo,
        param.DocumentoImagenParametroDe Parametro, param.DocumentoImagenParametroDescripcion Descripcion,
        CONCAT('/api/personal/download/Documento/', doc.DocumentoImagenDocumentoId) url
        FROM DocumentoImagenDocumento doc
        LEFT JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = doc.DocumentoImagenParametroId
        WHERE doc.PersonalId IN (@0)
        UNION ALL
        SELECT CUIT.DocumentoImagenCUITCUILId docId, CUIT.DocumentoImagenCUITCUILBlobNombreArchivo NombreArchivo,
        param.DocumentoImagenParametroDe Parametro, param.DocumentoImagenParametroDescripcion Descripcion,
        CONCAT('/api/personal/download/CUITCUIL/', CUIT.DocumentoImagenCUITCUILId) url
        FROM DocumentoImagenCUITCUIL CUIT
        LEFT JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = CUIT.DocumentoImagenParametroId
        WHERE CUIT.PersonalId IN (@0)
        UNION ALL
        SELECT afip.DocumentoImagenImpuestoAFIPId docId, afip.DocumentoImagenImpuestoAFIPBlobNombreArchivo NombreArchivo,
        param.DocumentoImagenParametroDe Parametro, param.DocumentoImagenParametroDescripcion Descripcion,
        CONCAT('/api/impuestos_afip/documento/download/', afip.DocumentoImagenImpuestoAFIPId) url
        FROM DocumentoImagenImpuestoAFIP afip
        LEFT JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = afip.DocumentoImagenParametroId
        WHERE afip.PersonalId IN (@0) 
        UNION ALL
        SELECT curso.DocumentoImagenCursoId docId, curso.DocumentoImagenCursoBlobNombreArchivo NombreArchivo,
        param.DocumentoImagenParametroDe Parametro, param.DocumentoImagenParametroDescripcion Descripcion,
        CONCAT('/api/personal/download/Curso/', curso.DocumentoImagenCursoId) url
        FROM DocumentoImagenCurso curso
        LEFT JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = curso.DocumentoImagenParametroId
        WHERE curso.PersonalId IN (@0)
        UNION ALL
        SELECT habil.DocumentoImagenHabilitacionId docId, habil.DocumentoImagenHabilitacionBlobNombreArchivo NombreArchivo,
        param.DocumentoImagenParametroDe Parametro, param.DocumentoImagenParametroDescripcion Descripcion,
        CONCAT('/api/personal/download/Habilitacion/', habil.DocumentoImagenHabilitacionId) url
        FROM DocumentoImagenHabilitacion habil
        LEFT JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = habil.DocumentoImagenParametroId
        WHERE habil.PersonalId IN (@0)
        UNION ALL
        SELECT psi.DocumentoImagenPsicofisicoId docId, psi.DocumentoImagenPsicofisicoBlobNombreArchivo NombreArchivo,
        param.DocumentoImagenParametroDe Parametro, param.DocumentoImagenParametroDescripcion Descripcion,
        CONCAT('/api/personal/download/Psicofisico/', psi.DocumentoImagenPsicofisicoId) url
        FROM DocumentoImagenPsicofisico psi
        LEFT JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = psi.DocumentoImagenParametroId
        WHERE psi.PersonalId IN (@0)
        UNION ALL
        SELECT ren.DocumentoImagenRenarId docId, ren.DocumentoImagenRenarBlobNombreArchivo NombreArchivo,
        param.DocumentoImagenParametroDe Parametro, param.DocumentoImagenParametroDescripcion Descripcion,
        CONCAT('/api/personal/download/Renar/', ren.DocumentoImagenRenarId) url
        FROM DocumentoImagenRenar ren
        LEFT JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = ren.DocumentoImagenParametroId
        WHERE ren.PersonalId IN (@0)
        UNION ALL
        SELECT rein.DocumentoImagenCertificadoReincidenciaId docId, rein.DocumentoImagenCertificadoReincidenciaBlobNombreArchivo NombreArchivo,
        param.DocumentoImagenParametroDe Parametro, param.DocumentoImagenParametroDescripcion Descripcion,
        CONCAT('/api/personal/download/CertificadoReincidencia/', rein.DocumentoImagenCertificadoReincidenciaId) url
        FROM DocumentoImagenCertificadoReincidencia rein
        LEFT JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = rein.DocumentoImagenParametroId
        WHERE rein.PersonalId IN (@0)
        UNION ALL
        SELECT preo.DocumentoImagenPreocupacionalId docId, preo.DocumentoImagenPreocupacionalBlobNombreArchivo NombreArchivo,
        param.DocumentoImagenParametroDe Parametro, param.DocumentoImagenParametroDescripcion Descripcion,
        CONCAT('/api/personal/download/Preocupacional/', preo.DocumentoImagenPreocupacionalId) url
        FROM DocumentoImagenPreocupacional preo
        LEFT JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = preo.DocumentoImagenParametroId
        WHERE preo.PersonalId IN (@0)
        UNION ALL
        SELECT gen.doc_id docId, gen.nombre_archivo NombreArchivo,
        param.doctipo_id Parametro, param.detalle Descripcion,
        CONCAT('/api/personal/download/docgeneral/', gen.doc_id) url
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

  async getCategoriasByTipoAsociado(req: any, res: Response, next: NextFunction){
    const queryRunner = dataSource.createQueryRunner();
    const tipoAsociado:number = req.body.tipoAsociadoId
    try {
      const options =await queryRunner.query(`
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

  private async setCategoriaQuerys(queryRunner:any, PersonalId:number, TipoAsociadoId:number, CategoriaId:number, Desde:Date){
    Desde.setHours(0, 0, 0, 0)
    let yesterday: Date = new Date(Desde.getFullYear(), Desde.getMonth(), Desde.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    //Obtengo la última categoria
    let categoria = await queryRunner.query(`
      SELECT TOP 1 perc.PersonalCategoriaId, perc.PersonalCategoriaPersonalId,
      perc.PersonalCategoriaTipoAsociadoId, PersonalCategoriaCategoriaPersonalId,
      perc.PersonalCategoriaDesde, ISNULL(perc.PersonalCategoriaHasta, '9999-12-31') PersonalCategoriaHasta
      FROM PersonalCategoria perc
      WHERE perc.PersonalCategoriaPersonalId IN (@0) 
      ORDER BY perc.PersonalCategoriaDesde DESC, ISNULL(perc.PersonalCategoriaHasta, '9999-12-31') DESC
      `, [PersonalId]
    )

    if (categoria.length == 1 && categoria[0].PersonalCategoriaDesde.getTime() > Desde.getTime())
      throw new ClientException(`La fecha Desde no puede ser menor al ${categoria[0].PersonalCategoriaDesde.getDate()}/${categoria[0].PersonalCategoriaDesde.getMonth()+1}/${categoria[0].PersonalCategoriaDesde.getFullYear()}`)

    if (categoria[0]?.PersonalCategoriaTipoAsociadoId == TipoAsociadoId && categoria[0]?.PersonalCategoriaCategoriaPersonalId == CategoriaId)
      throw new ClientException(`Debe ingresar una categoria distinta a la que se encuentra activa.`)

    if (categoria.length>0 && categoria[0].PersonalCategoriaDesde.getTime() == Desde.getTime()) {
      await queryRunner.query(`
        UPDATE PersonalCategoria SET PersonalCategoriaDesde = @2, PersonalCategoriaTipoAsociadoId = @3, PersonalCategoriaCategoriaPersonalId = @4
        WHERE PersonalCategoriaPersonalId IN (@0) AND PersonalCategoriaId IN (@1)
        `, [PersonalId, categoria[0]?.PersonalCategoriaId, Desde, TipoAsociadoId, CategoriaId]
      )
    } else {
      //Crea una categoria nueva
      await queryRunner.query(`
        UPDATE PersonalCategoria SET PersonalCategoriaHasta = @2
        WHERE PersonalCategoriaPersonalId IN (@0) AND PersonalCategoriaId IN (@1)`,
        [PersonalId, categoria[0]?.PersonalCategoriaId, yesterday]
      )

      const PersonalCategoriaUltNroQuery = await queryRunner.query(`SELECT PersonalCategoriaUltNro, PersonalSuActualSucursalPrincipalId FROM Personal WHERE PersonalId IN (@0)`, [PersonalId])
      const PersonalCategoriaUltNro = PersonalCategoriaUltNroQuery[0].PersonalCategoriaUltNro + 1
      const SucursalId = PersonalCategoriaUltNroQuery[0].PersonalSuActualSucursalPrincipalId

      await queryRunner.query(`
        INSERT INTO PersonalCategoria ( PersonalCategoriaId, PersonalCategoriaPersonalId, PersonalCategoriaTipoAsociadoId, PersonalCategoriaCategoriaPersonalId, PersonalCategoriaDesde, SucursalId, TipoJornadaId)
          VALUES(@0, @1, @2, @3, @4, @5, @6)`,
        [PersonalCategoriaUltNro, PersonalId, TipoAsociadoId, CategoriaId, Desde, SucursalId,1]
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
    queryRunner:any, PersonalId:number, GrupoActividadId:number, Desde:Date,
    usuarioId:number, ip:string
  ){
    Desde.setHours(0, 0, 0, 0)
    let yesterday: Date = new Date(Desde.getFullYear(), Desde.getMonth(), Desde.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    let now:Date = new Date()
    let time:string = now.getHours()+':'+now.getMinutes()+':'+now.getSeconds()
    now.setHours(0, 0, 0, 0)
    const UsuarioId = usuarioId? usuarioId : null
    let GrupoActividadPersonalReasignado = 0
    
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
      throw new ClientException(`La fecha Desde no puede ser menor al ${ultGrupoActividadPersonal[0].GrupoActividadPersonalDesde.getDate()}/${ultGrupoActividadPersonal[0].GrupoActividadPersonalDesde.getMonth()+1}/${ultGrupoActividadPersonal[0].GrupoActividadPersonalDesde.getFullYear()}`)

    if (ultGrupoActividadPersonal[0].GrupoActividadId == GrupoActividadId)
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
        GrupoActividadPersonalReasignado++
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
        GrupoActividadPersonalId, GrupoActividadId, GrupoActividadPersonalPersonalId, GrupoActividadPersonalDesde, GrupoActividadPersonalReasignado,
        GrupoActividadPersonalPuesto, GrupoActividadPersonalUsuarioId, GrupoActividadPersonalDia, GrupoActividadPersonalTiempo
        ) VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8)
        `, [GrupoActividadPersonalId, GrupoActividadId, PersonalId, Desde, GrupoActividadPersonalReasignado, ip, UsuarioId, now, time]
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
      const Usuario = await queryRunner.query(`
        SELECT UsuarioId FROM Usuario WHERE UsuarioPersonalId IN (@0)`, [PersonaId]
      )
      const UsuarioId = (Usuario.length && Usuario[0].UsuarioId)? Usuario[0].UsuarioId : 0

      await this.setGrupoActividadPersonalQuerys(queryRunner, PersonalId, GrupoActividadId, new Date(Desde), UsuarioId, ip)

      await queryRunner.commitTransaction()
      this.jsonRes({}, res, 'Carga Exitosa');
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

}
