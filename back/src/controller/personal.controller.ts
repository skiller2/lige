import { BaseController, ClientException } from "./baseController";
import { PersonaObj } from "../schemas/personal.schemas";
import fetch, { Request } from "node-fetch";
import { dataSource } from "../data-source";
import { Response } from "express-serve-static-core";
import { NextFunction } from "express";
import { existsSync } from "fs";

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
        JOIN Banco ban ON ban.BancoId = cue.PersonalBancoId
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
    let query: string = `SELECT per.PersonalId, CONCAT(TRIM(per.PersonalApellido) , ', ', TRIM(per.PersonalNombre), ' CUIT:' , cuit.PersonalCUITCUILCUIT) fullName FROM dbo.Personal per 
    LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
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
}
