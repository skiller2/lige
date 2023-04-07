import { Response } from "express";
import { BaseController } from "./baseController";
import { PersonaObj } from "../schemas/personal.schemas";
import fetch from "node-fetch";
import { dataSource } from "../data-source";

export class PersonalController extends BaseController {
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
        if (records.length != 1) throw new Error('Person not found')

        let FechaHasta = new Date();
        FechaHasta.setFullYear(FechaHasta.getFullYear() + 1);
        

        const personaData = records[0]
        personaData.NRO_EMPRESA = process.env.NRO_EMPRESA_PBA
//        personaData.PersonalCUITCUILCUIT = (personaData.PersonalCUITCUILCUIT) ? `${personaData.PersonalCUITCUILCUIT}` : "Sin registrar"
        personaData.PersonalCUITCUILCUIT = (personaData.PersonalCUITCUILCUIT != null) ? personaData.PersonalCUITCUILCUIT : ""
        personaData.DNI = (personaData.PersonalCUITCUILCUIT.length!=null)? personaData.PersonalCUITCUILCUIT.substring(2, 10):""
        personaData.FechaDesde = new Date()
        personaData.FechaHasta = FechaHasta
        const imageUrl = personaData.DocumentoImagenFotoBlobNombreArchivo ? process.env.IMAGE_FOTO_PATH.concat(personaData.DocumentoImagenFotoBlobNombreArchivo) : ""
        if (imageUrl != "") {
          fetch(imageUrl)
            .then((imageUrlRes) => imageUrlRes.buffer())
            .then((buffer) => {
              const bufferStr = buffer.toString('base64')
              personaData.image = 'data:image/jpeg;base64, ' + bufferStr;
    
              this.jsonRes(personaData, res);
            })
            .catch((reason) => {
              throw new Error('Image not found')
            })
        }
        else {  
          personaData.image = '';
          this.jsonRes(personaData, res);
        }
      })
      .catch((err) => {
        this.errRes(err, res, "Error accediendo a la base de datos", 409);
      });
  }

  search(
    req: any,
    res: Response
  ) {
    const { fieldName, value } = req.body;


    let query: string =
    `SELECT per.PersonalId, CONCAT(TRIM(per.PersonalNombre) , ' ', TRIM(per.PersonalApellido), ' CUIT:' , cuit.PersonalCUITCUILCUIT) fullName FROM dbo.Personal per 
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = per.PersonalCUITCUILUltNro
      WHERE`
    switch (fieldName) {
      case 'Nombre':
        const valueArray: Array<string> = value.split(" ");
        valueArray.forEach((element, index) => {
          query += `(per.PersonalNombre LIKE '%${element}%' OR per.PersonalApellido LIKE '%${element}%') AND `;
        });
        break;
      case 'CUIT':
          query += ` cuit.PersonalCUITCUILCUIT LIKE '%${value}%' AND `
      default:
        break;
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
