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
    id: "PersonalCUITCUILCUIT",
    name: "CUIT",
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
    fieldName: "per.PersonalId",
    searchComponent: "inpurForPersonalSearch",
    searchType: "number",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: "PersonalNroLegajo",
    name: " Num Legajo",
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
    id: "SituacionRevista",
    name: "Situacion Revista",
    field: "SituacionRevista",
    type: "string",
    fieldName: "suc.SucursalDescripcion",
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
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
]

export class PersonalController extends BaseController {

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
    const mails = await dataSource.query('SELECT ema.PersonalEmailEmail, ema.PersonalId FROM PersonalEmail ema WHERE ema.PersonalEmailInactivo <> 1 AND ema.PersonalId=@0',[PersonalId])
    const estudios = await dataSource.query(`SELECT TOP 1 tip.TipoEstudioId, tip.TipoEstudioDescripcion, est.PersonalEstudioTitulo FROM PersonalEstudio est 
      JOIN TipoEstudio tip ON tip.TipoEstudioId = est.TipoEstudioId
      WHERE est.PersonalId=@0 AND est.EstadoEstudioId = 2
      ORDER BY tip.TipoEstudioId DESC `,[PersonalId])
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
        personaData.estudios = (estudios[0])? `${estudios[0].TipoEstudioDescripcion.trim()} ${estudios[0].PersonalEstudioTitulo.trim()}`: 'Sin registro'
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
    console.log('PATH_ARCHIVOS', process.env.PATH_ARCHIVOS);
    
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

      const downloadPath = `${pathArchivos}/${ds[0].DocumentoImagenParametroDirectorioPath.replaceAll('\\','/')}/${ds[0].DocumentoImagenFotoBlobNombreArchivo}`;

      if (!existsSync(downloadPath))
        throw new ClientException(`El archivo Imagen no existe`,{'path':downloadPath});

      res.download(downloadPath, ds[0].DocumentoImagenFotoBlobNombreArchivo, (msg) => {});

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
        [PersonalId,stmactual]
      )

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

  async listPersonalQuery(queryRunner:any, filterSql:any, orderBy:any){
    const anio = new Date().getFullYear()
    const mes = new Date().getMonth()+1
    return await queryRunner.query(`
        SELECT DISTINCT per.PersonalId AS id, cuit.PersonalCUITCUILCUIT,
        CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre,
        per.PersonalNroLegajo, suc.SucursalId , TRIM(suc.SucursalDescripcion) AS SucursalDescripcion,
        CONCAT(TRIM(sitrev.SituacionRevistaDescripcion), ' ', FORMAT(sitrev.PersonalSituacionRevistaDesde, 'dd/MM/yyyy')) AS SituacionRevista,
        per.PersonalFechaIngreso
        FROM Personal per
        LEFT JOIN (
          SELECT p.PersonalId, p.PersonalSituacionRevistaSituacionId, s.SituacionRevistaDescripcion, MAX(p.PersonalSituacionRevistaDesde) PersonalSituacionRevistaDesde
          FROM PersonalSituacionRevista p
          JOIN SituacionRevista s
          ON p.PersonalSituacionRevistaSituacionId = s.SituacionRevistaId AND p.PersonalSituacionRevistaHasta IS NULL
          GROUP BY s.SituacionRevistaDescripcion, p.PersonalId, p.PersonalSituacionRevistaSituacionId
        ) sitrev ON sitrev.PersonalId = per.PersonalId
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId
        LEFT JOIN PersonalSucursalPrincipal sucper ON sucper.PersonalId = per.PersonalId
        LEFT JOIN Sucursal suc ON suc.SucursalId=sucper.PersonalSucursalPrincipalSucursalId
        WHERE cuit.PersonalCUITCUILHasta IS NULL
        AND (${filterSql})
        ${orderBy}`)
  }

  async getGridList(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction()

      const options: Options = isOptions(req.body.options)? req.body.options : { filtros: [], sort: null };
      const filterSql = filtrosToSql(options.filtros, columns);
      const orderBy = orderToSQL(options.sort)

      const lista:any[] = await this.listPersonalQuery(queryRunner, filterSql, orderBy)

      await queryRunner.commitTransaction()
      this.jsonRes(lista, res);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async getSituacionRevistaQuery(queryRunner:any){
    return await queryRunner.query(`
        SELECT sit.SituacionRevistaId value, sit.SituacionRevistaDescripcion label
        FROM SituacionRevista sit`)
  }

  async getSituacionRevista(req: any, res: Response, next: NextFunction){
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await this.getSituacionRevistaQuery(queryRunner)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    } 
  }

  async addPersonalQuery(
    queryRunner:any,
    NroLegajo:number,
    Apellido:string,
    Nombre:string,
    now:Date,
    FechaIngreso:Date,
    FechaNacimiento:Date,
    NacionalidadId:number,
    SucusalId:number,
    CUIT:number
  ){
    Nombre = Nombre.toUpperCase()
    Apellido = Apellido.toUpperCase()
    const fullname:string = Apellido + ', ' + Nombre
    const PersonalEstado = 'POSTULANTE'
    const ApellidoNombreDNILegajo = `${Apellido}, ${Nombre} (${PersonalEstado} -CUIT ${CUIT} - Leg.:${NroLegajo})`
    await queryRunner.query(`
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
      VALUES (@0,@1,@2,@3,@4,@5,@5,@6,@6,@7,@8,@9,@9,@10,@11,@12)`,[
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
    let PersonalId = 1
    const numerador = await queryRunner.query(`
      SELECT per.PersonalId
      FROM Personal per
      WHERE per.PersonalNroLegajo = @0 AND per.PersonalApellido = @1 AND per.PersonalNombre = @2
    `, [NroLegajo,Apellido,Nombre])
    PersonalId = numerador[0].PersonalId
    return PersonalId
  }

  async addPersonalCUITCUILQuery(queryRunner:any, personaId:any, CUIT:number, now:Date){
    await queryRunner.query(`
      INSERT INTO PersonalCUITCUIL (
      PersonalId,
      PersonalCUITCUILId,
      PersonalCUITCUILEs,
      PersonalCUITCUILCUIT,
      PersonalCUITCUILDesde
      )
      VALUES (@0, @1, @2, @3, @4)`,
      [ personaId, 1, 'T', CUIT, now]
    )
  }

  async addPersonalEmail(queryRunner:any, personaId:any, email:string){
    await queryRunner.query(`
      INSERT INTO PersonalEmail (
      PersonalId,
      PersonalEmailId,
      PersonalEmailEmail,
      PersonalEmailInactivo
      )
      VALUES (@0,@1,@2,@3)`,
      [ personaId, 1, email, 0]
    )
  }

  async addPersonal(req: any, res: Response, next: NextFunction){
    const queryRunner = dataSource.createQueryRunner();
    let Nombre:string = req.body.Nombre
    let Apellido:string = req.body.Apellido
    const CUIT:number = req.body.CUIT
    const NroLegajo:number = req.body.NroLegajo
    const SucursalId:number = req.body.SucursalId
    const Email = req.body.Email
    let FechaIngreso:Date = new Date(req.body.FechaIngreso)
    let FechaNacimiento:Date = new Date(req.body.FechaNacimiento)
    const foto = req.body.Foto
    const NacionalidadId:number = req.body.NacionalidadId
    const docFrente = req.body.docFrente
    const docDorso = req.body.docDorso
    const telefonos = req.body.telefonos
    const estudios = req.body.estudios
    let errors:string[] = []
    let now = new Date()
    now.setHours(0, 0, 0, 0)
    FechaIngreso.setHours(0, 0, 0, 0)
    FechaNacimiento.setHours(0, 0, 0, 0)
    try {
      await queryRunner.startTransaction()

      if (!Nombre || !Apellido || !CUIT || (!NroLegajo || NroLegajo == 0) || !SucursalId || !NacionalidadId || !FechaIngreso || !FechaNacimiento) {
        throw new ClientException(`Los campos No pueden estar vacios.`);
      }

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
        throw new ClientException(errors.join(`\n`))

      const PersonalId = await this.addPersonalQuery(
        queryRunner, NroLegajo, Apellido, Nombre, now, FechaIngreso, FechaNacimiento, NacionalidadId, SucursalId, CUIT
      )

      await this.addPersonalCUITCUILQuery(queryRunner, PersonalId, CUIT, now)

      await this.addPersonalDomicilio(queryRunner, req.body, PersonalId)

      if (Email) await this.addPersonalEmail(queryRunner, PersonalId, Email)

      for (const obj of telefonos){
        if (obj.telefonoNum) {
          if (!obj.tipoTelefonoId) {
            errors.push(`El campo Tipo de la seccion Telefono No pueden estar vacios.`)
            break
          }
          await this.addPersonalTelefono(queryRunner, obj, PersonalId)
        }
      }
      for (const obj of estudios){
        if (obj.estudioTitulo) {
          if (!obj.tipoEstudioId || !obj.estadoEstudioId) {
            errors.push(`Los campos Tipo y Estados de la seccion Estudios No pueden estar vacios.`)
            break
          }
          await this.addPersonalEstudio(queryRunner, obj, PersonalId)
        }
      }

      if (errors.length)
        throw new ClientException(errors.join(`\n`))

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

  async addPersonalTelefono(queryRunner:any, telefono:any, personalId:any){
    const lugarTelefonoId = telefono.LugarTelefonoId
    const tipoTelefonoId = telefono.TipoTelefonoId
    const codigoPais = telefono.CodigoPais
    const codigoArea = telefono.CodigoArea
    const telefonoNum = telefono.TelefonoNro
    await queryRunner.query(`
      INSERT INTO PersonalTelefono (
      PersonalId,
      LugarTelefonoId,
      TipoTelefonoId,
      PersonalTelefonoCodigoPais,
      PersonalTelefonoCodigoArea,
      PersonalTelefonoNro
      )
      VALUES (@0,@1,@2,@3,@4)`,[
        personalId, lugarTelefonoId, tipoTelefonoId, codigoPais, codigoArea, telefonoNum
    ])
    await queryRunner.query(`
      UPDATE Personal SET PersonalTelefonoUltNro = ISNULL(PersonalTelefonoUltNro, 0) + 1 WHERE PersonalId = @1
      `,[ personalId ])
  }
  
  async addPersonalEstudio(queryRunner:any, estudio:any, personalId:any){
    const tipoEstudioId = estudio.TipoEstudioId
    const estadoEstudioId = estudio.EstadoEstudioId
    const estudioTitulo = estudio.EstudioTitulo
    const estudioAnio = estudio.EstudioAno
    await queryRunner.query(`
      INSERT INTO PersonalEstudio (
      PersonalId,
      TipoEstudioId,
      EstadoEstudioId,
      PersonalEstudioTitulo,
      PersonalEstudioAno,
      )
      VALUES (@0,@1,@2,@3,@4)`,[
        personalId, tipoEstudioId, estadoEstudioId, estudioTitulo, estudioAnio
    ])
    await queryRunner.query(`
      UPDATE Personal SET PersonalEstudioUltNro = ISNULL(PersonalEstudioUltNro, 0) + 1 WHERE PersonalId = @1
      `,[ personalId ])
  }

  async addPersonalDomicilio(queryRunner:any, domicilio:any, personalId:any){
    const calle = domicilio.Calle
    const numero = domicilio.Nro
    const piso = domicilio.Piso
    const departamento = domicilio.Dpto
    const esquina = domicilio.Esquina
    const esquinaY = domicilio.EsquinaY
    const bloque = domicilio.Bloque
    const edificio = domicilio.Edificio
    const cuerpo = domicilio.Cuerpo
    const codPostal = domicilio.CodigoPostal
    const paisId = domicilio.PaisId
    const provinciaId = domicilio.ProvinciaId
    const localidadId = domicilio.LocalidadId
    const barrioId = domicilio.BarrioId
    await queryRunner.query(`
      INSERT INTO PersonalDomicilio (
      PersonalId,
      PersonalDomicilioId,
      PersonalDomicilioDomCalle,
      PersonalDomicilioDomNro,
      PersonalDomicilioDomPiso,
      PersonalDomicilioDomDpto,
      PersonalDomicilioEntreEsquina,
      PersonalDomicilioEntreEsquinaY,
      PersonalDomicilioDomBloque,
      PersonalDomicilioDomEdificio,
      PersonalDomicilioDomCuerpo,
      PersonalDomicilioCodigoPostal,
      PersonalDomicilioActual,
      PersonalDomicilioPaisId,
      PersonalDomicilioProvinciaId,
      PersonalDomicilioLocalidadId,
      PersonalDomicilioBarrioId
      )
      VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@11,@12,@13,@14,@15,@16)`,[
        personalId,
        1,
        calle,
        numero,
        piso,
        departamento,
        esquina,
        esquinaY,
        bloque,
        edificio,
        cuerpo,
        codPostal,
        1,
        paisId,
        provinciaId,
        localidadId,
        barrioId,
    ])
    await queryRunner.query(`
      UPDATE Personal SET PersonalDomicilioUltNro = ISNULL(PersonalDomicilioUltNro, 0) + 1 WHERE PersonalId = @0
      `,[ personalId ])
  }

  async getNacionalidadListQuery(queryRunner:any){
    return await queryRunner.query(`
        SELECT nac.NacionalidadId value, TRIM(nac.NacionalidadDescripcion) label
        FROM Nacionalidad nac`)
  }

  async getNacionalidadList(req: any, res: Response, next: NextFunction){
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

  async setFoto(queryRunner:any, personalId:any, file:any) {
    const type = file.mimeType.split('/')[1]
    const fieldname = file.fieldname
    let fotoId = await queryRunner.query(`SELECT DocumentoImagenFotoId fotoId FROM DocumentoImagenFoto WHERE PersonalId IN (@0)`,[personalId])
    if (fotoId.length) {
      await queryRunner.query(`
        INSERT INTO DocumentoImagenFoto (
        PersonalId,
        DocumentoImagenFotoBlobTipoArchivo,
        DocumentoImagenParametroId,
        DocumentoImagenParametroDirectorioId
        )
        VALUES(@0,@1,@2,@3)`,
        [personalId,type,7,1]
      )
      fotoId = await queryRunner.query(`SELECT DocumentoImagenFotoId fotoId FROM DocumentoImagenFoto WHERE PersonalId IN (@0)`,[personalId])
    }
    
    fotoId = fotoId[0].fotoId
    const dirFile = `${process.env.PATH_DOCUMENTS}/temp/${fieldname}.${type}`;
    const newFieldname = `${personalId}-${fotoId}-FOTO`
    const newFilePath = `${process.env.IMAGE_FOTO_PATH}/${newFieldname}.${type}`;
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

  async setDocumento(queryRunner:any, personalId:any, file:any, parametro:number){
    const type = file.mimeType.split('/')[1]
    const fieldname = file.fieldname
    let docId = await queryRunner.query(`SELECT DocumentoImagenDocumentoId docId FROM DocumentoImagenDocumento WHERE PersonalId IN (@0)`,[personalId])
    if (docId.length) {
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
      docId = await queryRunner.query(`SELECT DocumentoImagenDocumentoId docId FROM DocumentoImagenDocumento WHERE PersonalId IN (@0)`,[personalId])
    }

    docId = docId[0].docId
    const dirFile: string  = `${process.env.PATH_DOCUMENTS}/temp/${fieldname}.${type}`;
    let newFieldname: string = `${personalId}-${docId}`
    if (parametro == 13) {
      newFieldname += `-DOCUMENDOR`
    }else if(parametro == 12){
      newFieldname += `-DOCUMENFREN`
    }
    const newFilePath: string  = `${process.env.IMAGE_DOCUMENTO_PATH}/${newFieldname}.${type}`;
    this.moveFile(dirFile, newFilePath);
    await queryRunner.query(`
      UPDATE DocumentoImagenDocumento SET
      DocumentoImagenDocumentoBlobNombreArchivo = @1,
      DocumentoImagenDocumentoBlobTipoArchivo = @2,
        DocumentoImagenParametroId = @3,
        DocumentoImagenParametroDirectorioId = @4
      WHERE PersonalId = @0`,
      [personalId, newFieldname, type, parametro, 1]
    )
  }

  async updatePersona(queryRunner:any, PersonalId:number, infoPersonal:any ){
    let personal = await queryRunner.query(`
      SELECT PersonalNroLegajo NroLegajo, PersonalApellido Apellido, PersonalNombre Nombre,
      PersonalFechaIngreso FechaIngreso, PersonalFechaNacimiento FechaNacimiento,
      PersonalNacionalidadId NacionalidadId, PersonalSucursalIngresoSucursalId SucursalId
      FROM Personal
      WHERE PersonalId = @0
      `,[PersonalId])
    personal = personal[0]

    let cambio:boolean = false
    for (const data of personal) {
      if (infoPersonal[data] != personal[data]) {
        cambio = true
        break
      }
    }
    if(!cambio) return

    let Nombre:string = infoPersonal.Nombre
    let Apellido:string = infoPersonal.Apellido
    const NacionalidadId:number = infoPersonal.NacionalidadId
    const NroLegajo:number = infoPersonal.NroLegajo
    const SucursalId:number = infoPersonal.SucursalId
    let FechaIngreso:Date = infoPersonal.FechaIngreso? new Date(infoPersonal.FechaIngreso) : null
    let FechaNacimiento:Date = infoPersonal.FechaNacimiento? new Date(infoPersonal.FechaNacimiento) : null
    const CUIT:number = infoPersonal.CUIT
    FechaIngreso.setHours(0, 0, 0, 0)
    FechaNacimiento.setHours(0, 0, 0, 0)
    Nombre = Nombre.toUpperCase()
    Apellido = Apellido.toUpperCase()
    const fullname:string = Apellido + ', ' + Nombre
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
      PersonalApellidoNombreDNILegajo = @9,
      WHERE PersonalId = @0
      `,[PersonalId, NroLegajo, Apellido, Nombre, fullname, FechaIngreso, FechaNacimiento, NacionalidadId,
        SucursalId, ApellidoNombreDNILegajo
      ])
  }

  private async updatePersonalDomicilio(queryRunner:any, PersonalId:number, infoDomicilio:any ){
    let domicilio = await queryRunner.query(`
      SELECT PersonalDomicilioDomCalle Calle, PersonalDomicilioDomNro Nro, PersonalDomicilioDomPiso Piso,
      PersonalDomicilioDomDpto Dpto, PersonalDomicilioEntreEsquina Esquina, PersonalDomicilioEntreEsquinaY EsquinaY
      PersonalDomicilioDomBloque Bloque, PersonalDomicilioDomEdificio Edificio, PersonalDomicilioDomCuerpo Cuerpo,
      PersonalDomicilioCodigoPostal CodigoPostal, PersonalDomicilioPaisId PaisId, PersonalDomicilioProvinciaId ProvinciaId,
      PersonalDomicilioLocalidadId LocalidadId, PersonalDomicilioBarrioId BarrioId
      FROM PersonalDomicilio
      WHERE PersonalId = @0 AND PersonalDomicilioId = @1
      `,[PersonalId, infoDomicilio.PersonalDomicilioId])
    domicilio = domicilio[0]
    
    let cambio:boolean = false
    for (const data of domicilio || []) {
      if (infoDomicilio[data] != domicilio[data]) {
        cambio = true
        break
      }
    }
    if(!cambio) return

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
      `,[
        PersonalId, calle, numero, piso, departamento, esquina, esquinaY, bloque, edificio, cuerpo, codPostal,
        paisId, provinciaId, localidadId, barrioId,
    ])

  }

  private async updatePersonalTelefono(queryRunner:any, PersonalId:number, infoTelefono:any ){
    const PersonalTelefonoId = infoTelefono.PersonalTelefonoId
    let telefono = await queryRunner.query(`
      SELECT LugarTelefonoId , TipoTelefonoId, PersonalTelefonoCodigoPais CodigoPais,
      PersonalTelefonoCodigoArea CodigoArea, PersonalTelefonoNro TelefonoNro
      FROM PersonalTelefono
      WHERE PersonalId IN (@0) AND PersonalTelefonoId IN (@1)
      `,[PersonalId, PersonalTelefonoId])
    if (!telefono.length) 
      return await this.addPersonalTelefono(queryRunner, infoTelefono, PersonalId )
    telefono = telefono[0]

    let cambio:boolean = false
    for (const data of telefono) {
      if (infoTelefono[data] != telefono[data]) {
        cambio = true
        break
      }
    }
    if(!cambio) return
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
      PersonalTelefonoNro = @6
      WHERE PersonalId IN (@0) AND PersonalTelefonoId IN (@1)
      `,[
        PersonalId, PersonalTelefonoId, lugarTelefonoId, tipoTelefonoId, codigoPais, codigoArea, telefonoNum
    ])
  }

  private async updatePersonalEstudio(queryRunner:any, PersonalId:number, infoEstudio:any ){
    const PersonalEstudioId = infoEstudio.PersonalEstudioId
    let estudio = await queryRunner.query(`
      SELECT TipoEstudioId , EstadoEstudioId, PersonalEstudioTitulo EstudioTitulo, PersonalEstudioAno EstudioAno
      FROM PersonalEstudio
      WHERE PersonalId IN (@0) AND PersonalTelefonoId IN (@1)
      `,[PersonalId, PersonalEstudioId])
    if (!estudio.length) 
      return await this.addPersonalEstudio(queryRunner, infoEstudio, PersonalId )
    estudio = estudio[0]

    let cambio:boolean = false
    for (const data of estudio) {
      if (infoEstudio[data] != estudio[data]) {
        cambio = true
        break
      }
    }
    if(!cambio) return
    const tipoEstudioId = estudio.TipoEstudioId
    const estadoEstudioId = estudio.EstadoEstudioId
    const estudioTitulo = estudio.EstudioTitulo
    const estudioAno = estudio.EstudioAno
    await queryRunner.query(`
      UPDATE PersonalEstudio SET
      TipoEstudioId = @2,
      EstadoEstudioId = @3,
      PersonalEstudioTitulo = @4,
      PersonalEstudioAno = @5
      WHERE PersonalId IN (@0) AND PersonalTelefonoId IN (@1)
      `,[
        PersonalId, PersonalEstudioId, tipoEstudioId, estadoEstudioId, estudioTitulo, estudioAno
    ])
  }

  async updatePersonalEmail(queryRunner:any, personaId:any, infoEmail:any){
    const PersonalEmailId = infoEmail.PersonalEmailId
    const Email = infoEmail.Email
    if (PersonalEmailId){
      let PersonalEmailEmail = await queryRunner.query(`
        SELEC PersonalEmailEmail
        FROM PersonalEmail
        WHERE PersonalId IN (@0) AND PersonalEmailId IN (@1)`,
        [ personaId, PersonalEmailId]
      )
      PersonalEmailEmail = PersonalEmailEmail[0]
      if (PersonalEmailEmail != Email) 
        await queryRunner.query(`UPDATE PersonalEmail SET PersonalEmailEmail = @1 WHERE PersonalId IN (@0)`,
          [ personaId, Email]
        )
    }else{
      await this.addPersonalEmail(queryRunner, personaId, Email)
    }
  }
  
  async updatePersonal(req: any, res: Response, next: NextFunction){
    const queryRunner = dataSource.createQueryRunner();
    const PersonalId:number = Number(req.params.id)
    let Nombre:string = req.body.Nombre
    let Apellido:string = req.body.Apellido
    const CUIT:number = req.body.CUIT
    const NroLegajo:number = req.body.NroLegajo
    const SucursalId:number = req.body.SucursalId
    let FechaIngreso:Date = new Date(req.body.FechaIngreso)
    let FechaNacimiento:Date = new Date(req.body.FechaNacimiento)
    const Foto = req.body.Foto
    const NacionalidadId:number = req.body.NacionalidadId
    const docFrente = req.body.docFrente
    const docDorso = req.body.docDorso
    const telefonos = req.body.telefonos
    const estudios = req.body.estudios
    let now = new Date()
    now.setHours(0, 0, 0, 0)
    FechaIngreso.setHours(0, 0, 0, 0)
    FechaNacimiento.setHours(0, 0, 0, 0)
    
    try {
      await queryRunner.startTransaction()

      if (!Nombre || !Apellido || !CUIT || (!NroLegajo || NroLegajo != 0) || !SucursalId || !FechaIngreso || !FechaNacimiento || !NacionalidadId) {
        throw new ClientException(`Los campos No pueden estar vacios.`);
      }
      
      await this.updatePersona(queryRunner, PersonalId, req.body)
      await this.updatePersonalDomicilio(queryRunner, PersonalId, req.body)
      await this.updatePersonalEmail(queryRunner, PersonalId, req.body)

      for (const telefono of telefonos || []) {
        if (telefono.TelefonoNro.length)  await this.updatePersonalTelefono(queryRunner, PersonalId, telefono)
      }
      for (const estudio of estudios || []) {
        if (estudio.EstudioTitulo.length)  await this.updatePersonalEstudio(queryRunner, PersonalId, estudio)
      }
      
      let PersonalCUITCUIL = await queryRunner.query(`
        SELECT PersonalCUITCUILCUIT cuit FROM PersonalCUITCUIL WHERE PersonalId = @0`, [PersonalId]
      )
      if (PersonalCUITCUIL[0].cuit != CUIT) {
        await queryRunner.query(`
          UPDATE PersonalCUITCUIL SET
          PersonalCUITCUILCUIT = @1,
          PersonalCUITCUILDesde = @2
          WHERE PersonalId = @0`,
          [ PersonalId, CUIT, now]
        )
      }
      let response:any = {}
      if (Foto && Foto.length) await this.setFoto(queryRunner, PersonalId, Foto)
      
      if (docFrente && docFrente.length) await this.setDocumento(queryRunner, PersonalId, docFrente, 12)
      
      if (docDorso && docDorso.length) await this.setDocumento(queryRunner, PersonalId, docDorso, 13)
      

      await queryRunner.commitTransaction()
      this.jsonRes(response, res, 'Carga Exitosa');
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  private async getFormPersonByIdQuery(queryRunner:any, personalId:any){
    let data = await queryRunner.query(`
      SELECT per.PersonalId ,TRIM(per.PersonalNombre) Nombre, TRIM(per.PersonalApellido) Apellido, per.PersonalNroLegajo NroLegajo,
      cuit.PersonalCUITCUILCUIT CUIT , per.PersonalFechaIngreso FechaIngreso, per.PersonalFechaNacimiento FechaNacimiento,
      per.PersonalSuActualSucursalPrincipalId SucursalId , TRIM(suc.SucursalDescripcion) AS SucursalDescripcion, nac.NacionalidadId, TRIM(nac.NacionalidadDescripcion),
      --foto.DocumentoImagenFotoBlobNombreArchivo Foto,
      TRIM(dom.PersonalDomicilioDomCalle) Calle, TRIM(dom.PersonalDomicilioDomNro) Nro, TRIM(dom.PersonalDomicilioDomPiso) Piso,
      TRIM(dom.PersonalDomicilioDomDpto) Dpto, TRIM(dom.PersonalDomicilioEntreEsquina) Esquina, TRIM(dom.PersonalDomicilioEntreEsquinaY) EsquinaY,
      TRIM(dom.PersonalDomicilioDomBloque) Bloque, TRIM(dom.PersonalDomicilioDomEdificio) Edificio, TRIM(dom.PersonalDomicilioDomCuerpo) Cuerpo,
      TRIM(dom.PersonalDomicilioCodigoPostal) CodigoPostal, dom.PersonalDomicilioPaisId PaisId, dom.PersonalDomicilioProvinciaId ProvinciaId,
      dom.PersonalDomicilioLocalidadId LocalidadId, dom.PersonalDomicilioBarrioId BarrioId, dom.PersonalDomicilioId
      FROM Personal per
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN DocumentoImagenFoto foto ON foto.PersonalId = per.PersonalId
      LEFT JOIN Sucursal suc ON suc.SucursalId = per.PersonalSuActualSucursalPrincipalId
      LEFT JOIN Nacionalidad nac ON nac.NacionalidadId = per.PersonalNacionalidadId
      LEFT JOIN PersonalDomicilio dom ON dom.PersonalId = per.PersonalId AND dom.PersonalDomicilioActual IN (1)
      WHERE per.PersonalId = @0
      `, [personalId]
    )
    return data[0]
  }

  private async getFormDocumnetosByPersonalIdQuery(queryRunner:any, personalId:any){
    return await queryRunner.query(`
        SELECT doc.DocumentoImagenDocumentoBlobNombreArchivo, doc.DocumentoImagenParametroId
        FROM DocumentoImagenDocumento doc
        WHERE doc.PersonalId = @0
      `, [personalId]
    )
  }

  private async getFormTelefonosByPersonalIdQuery(queryRunner:any, personalId:any){
    return await queryRunner.query(`
        SELECT tel.PersonalTelefonoId, tel.LugarTelefonoId, tel.TipoTelefonoId ,
        TRIM(tel.PersonalTelefonoCodigoPais) CodigoPais, TRIM(tel.PersonalTelefonoCodigoArea) CodigoArea, TRIM(tel.PersonalTelefonoNro) TelefonoNro
        FROM PersonalTelefono tel
        WHERE tel.PersonalId IN (@0) AND tel.PersonalTelefonoInactivo IS NULL
      `, [personalId]
    )
  }

  private async getFormEstudiosByPersonalIdQuery(queryRunner:any, personalId:any){
    return await queryRunner.query(`
        SELECT est.PersonalEstudioId, est.TipoEstudioId, est.EstadoEstudioId,
        TRIM(est.PersonalEstudioTitulo) EstudioTitulo, est.PersonalEstudioAno EstudioAno
        FROM PersonalEstudio est
        WHERE est.PersonalId IN (@0)
      `, [personalId]
    )
  }

  async getFormDataById(req: any, res: Response, next: NextFunction){
    const queryRunner = dataSource.createQueryRunner()
    const personalId = req.params.id
    try {
      let data = await this.getFormPersonByIdQuery(queryRunner, personalId)
      
      // const docs = await this.getFormDocumnetosByPersonalIdQuery(queryRunner, personalId)
      const telefonos = await this.getFormTelefonosByPersonalIdQuery(queryRunner, personalId)
      const estudios = await this.getFormEstudiosByPersonalIdQuery(queryRunner, personalId)

      // docs.forEach((doc:any)=>{
      //   if(doc.DocumentoImagenParametroId==12)
      //     data.docFrente = doc.DocumentoImagenDocumentoBlobNombreArchivo
      //   if (doc.DocumentoImagenParametroId==13) {
      //     data.docDorso = doc.DocumentoImagenDocumentoBlobNombreArchivo
      //   }
      // })
      data.telefonos = telefonos
      data.estudios = estudios
      console.log('DATA',data);
      

      this.jsonRes(data, res);
    } catch (error) {
      return next(error)
    } 
  }

  async deleteArchivo(req: any, res: Response, next: NextFunction) {
    const personalId = req.body.id
    const tipo = req.body.tipo
    let document:any
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

  async getDomicilioByPersonalId(req: any, res: Response, next: NextFunction){
    const queryRunner = dataSource.createQueryRunner();
    const PersonalId:number = Number(req.params.id)
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
        sitrev.PersonalSituacionRevistaDesde Desde, sitrev.PersonalSituacionRevistaHasta Hasta
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

  async setSituacionRevista(req: any, res: Response, next: NextFunction){
    const queryRunner = dataSource.createQueryRunner();
    const personalId:number = Number(req.params.id);
    const situacionId = req.body.SituacionId
    const motivo = req.body.Motivo
    let now:Date = new Date();
    now.setHours(0, 0, 0, 0)
    try {
      await queryRunner.startTransaction()
      let sitRevista = await queryRunner.query(
        `SELECT MAX(sitrev.PersonalSituacionRevistaId) PersonalSituacionRevistaId
        FROM PersonalSituacionRevista sitrev
        WHERE sitrev.PersonalId IN (@0) AND PersonalSituacionRevistaHasta IS NULL
        `, [personalId]
      )
      sitRevista = sitRevista[0].PersonalSituacionRevistaSituacionId

      await queryRunner.query(`
        UPDATE PersonalSituacionRevista SET
        PersonalSituacionRevistaHasta = @2
        WHERE PersonalId IN (@0) AND PersonalSituacionRevistaId = @1
        `, [personalId, sitRevista, now]
      )

      await queryRunner.query(`
        INSERT INTO PersonalSituacionRevista (
        PersonalId,
        PersonalSituacionRevistaId,
        PersonalSituacionRevistaDesde,
        PersonalSituacionRevistaMotivo,
        PersonalSituacionRevistaSituacionId
        )
        VALUES(@0, @1, @2, @3, @4)
        `, [personalId, ++sitRevista, now, motivo, situacionId]
      )

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
