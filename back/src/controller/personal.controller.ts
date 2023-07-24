import { BaseController } from "./baseController";
import { PersonaObj } from "../schemas/personal.schemas";
import fetch, { Request } from "node-fetch";
import { dataSource } from "../data-source";
import { Response } from "express-serve-static-core";
import { ParsedQs } from "qs";

export class PersonalController extends BaseController {
  async getPersonalMonotributo(req: any, res: Response) {
    const personalId = req.params.personalId;
    const anio = req.params.anio;
    const mes = req.params.mes;
    try {
      const result = await dataSource.query(
        `SELECT des.PersonalId,des.PersonalOtroDescuentoMesesAplica,des.PersonalOtroDescuentoAnoAplica FROM PersonalOtroDescuento des WHERE des.PersonalId = @0 AND des.PersonalOtroDescuentoDescuentoId = @1 AND des.PersonalOtroDescuentoAnoAplica = @2 AND des.PersonalOtroDescuentoMesesAplica = @3`,
        [personalId, Number(process.env.OTRO_DESCUENTO_ID), anio, mes]
      );

      this.jsonRes(result, res);
    } catch (err) {
      this.errRes(err, res, "Error accediendo a la base de datos", 409);
    }
  }

  async getNameFromId(PersonalId, res: Response) {
    try {
      const result = await dataSource.query(
        `SELECT per.PersonalId personalId, cuit.PersonalCUITCUILCUIT cuit,
      per.PersonalNombre nombre, per.PersonalApellido apellido
      FROM Personal per
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = per.PersonalCUITCUILUltNro    
      WHERE per.PersonalId = @0`,
        [PersonalId]
      );

      const info = result[0];
      this.jsonRes(info, res);
    } catch (err) {
      this.errRes(err, res, "Error accediendo a la base de datos", 409);
    }
  }

  async getPersonalResponsables(req: any, res: Response) {
    const personalId = req.params.personalId;
    const anio = req.params.anio;
    const mes = req.params.mes;

    try {
      const responsables = await dataSource.query(
        `
        SELECT DISTINCT pjer.ObjetivoPersonalJerarquicoPersonalId, IIF(pjer.ObjetivoPersonalJerarquicoPersonalId=perrel.PersonalCategoriaPersonalId,'R','A') AS Tipo, perrel.*, 
        perrel.OperacionesPersonalAAsignarPersonalId,
        cuit2.PersonalCUITCUILCUIT as CUIT,
        CONCAT(TRIM(per.PersonalApellido), ',', TRIM(per.PersonalNombre)) ApellidoNombre, 
        perrel.PersonalCategoriaPersonalId,
        cuit.PersonalCUITCUILCUIT as CUITJ,
        CONCAT(TRIM(perjer.PersonalApellido), ', ',TRIM(perjer.PersonalNombre)) ApellidoNombreJ, 
        pjer.ObjetivoPersonalJerarquicoComo,
        
        1
        FroM OperacionesPersonalAsignarAJerarquico perrel 

        LEFT JOIN ObjetivoPersonalJerarquico pje ON pje.ObjetivoPersonalJerarquicoPersonalId = perrel.PersonalCategoriaPersonalId AND DATEFROMPARTS(@1,@2,28) > pje.ObjetivoPersonalJerarquicoDesde AND DATEFROMPARTS(@1,@2,1) <  ISNULL(pje.ObjetivoPersonalJerarquicoHasta, '9999-12-31')
        LEFT JOIN ObjetivoPersonalJerarquico pjer ON pjer.ObjetivoId = pje.ObjetivoId AND DATEFROMPARTS(@1,@2,28) > pjer.ObjetivoPersonalJerarquicoDesde AND DATEFROMPARTS(@1,@2,1) <  ISNULL(pjer.ObjetivoPersonalJerarquicoHasta, '9999-12-31')


        LEFT JOIN Personal perjer ON perjer.PersonalId = ISNULL(pjer.ObjetivoPersonalJerarquicoPersonalId, perrel.PersonalCategoriaPersonalId)
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = perjer.PersonalId AND cuit.PersonalCUITCUILId = perjer.PersonalCUITCUILUltNro
        
        LEFT JOIN Personal per ON per.PersonalId = perrel.OperacionesPersonalAAsignarPersonalId
        LEFT JOIN PersonalCUITCUIL cuit2 ON cuit2.PersonalId = per.PersonalId AND cuit2.PersonalCUITCUILId = per.PersonalCUITCUILUltNro
        
        
        WHERE DATEFROMPARTS(@1,@2,28) > perrel.OperacionesPersonalAsignarAJerarquicoDesde AND DATEFROMPARTS(@1,@2,1) <  ISNULL(perrel.OperacionesPersonalAsignarAJerarquicoHasta, '9999-12-31')
        AND perrel.OperacionesPersonalAAsignarPersonalId=@0        `,

        [personalId, anio, mes]
      );
      this.jsonRes(responsables, res);
    } catch (err) {
      this.errRes(err, res, "Error accediendo a la base de datos", 409);
    }
  }

  getById(PersonalId: string, res: Response) {
    dataSource
      .query(
        `SELECT per.PersonalId, cuit.PersonalCUITCUILCUIT, foto.DocumentoImagenFotoBlobNombreArchivo, categ.CategoriaPersonalDescripcion, cat.PersonalCategoriaId,
        per.PersonalNombre, per.PersonalApellido
        FROM Personal per
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = per.PersonalCUITCUILUltNro    
        LEFT JOIN DocumentoImagenFoto foto ON foto.PersonalId = per.PersonalId
        LEFT JOIN PersonalCategoria cat ON cat.PersonalCategoriaPersonalId = per.PersonalId AND cat.PersonalCategoriaId = per.PersonalCategoriaUltNro
        LEFT JOIN CategoriaPersonal categ ON categ.TipoAsociadoId = cat.PersonalCategoriaTipoAsociadoId AND categ.CategoriaPersonalId = cat.PersonalCategoriaCategoriaPersonalId
        WHERE per.PersonalId = @0`,
        [PersonalId]
      )
      .then((records: Array<PersonaObj>) => {
        if (records.length != 1) throw new Error("Person not found");

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
        if (imageUrl != "") {
          fetch(imageUrl)
            .then((imageUrlRes) => imageUrlRes.buffer())
            .then((buffer) => {
              const bufferStr = buffer.toString("base64");
              personaData.image = "data:image/jpeg;base64, " + bufferStr;

              this.jsonRes(personaData, res);
            })
            .catch((reason) => {
              throw new Error("Image not found");
            });
        } else {
          personaData.image = "";
          this.jsonRes(personaData, res);
        }
      })
      .catch((err) => {
        this.errRes(err, res, "Error accediendo a la base de datos", 409);
      });
  }

  search(req: any, res: Response) {
    const { fieldName, value } = req.body;

    let buscar = false;
    let query: string = `SELECT per.PersonalId, CONCAT(TRIM(per.PersonalApellido) , ', ', TRIM(per.PersonalNombre), ' CUIT:' , cuit.PersonalCUITCUILCUIT) fullName FROM dbo.Personal per 
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = per.PersonalCUITCUILUltNro
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
      .catch((err) => {
        this.errRes(err, res, "Error accediendo a la base de datos", 409);
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
