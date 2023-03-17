import { getConnection, getManager, getRepository } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { BaseController } from "./baseController";
import { ParsedQs } from "qs";
import { ResponseByID } from "../schemas/personal.schemas";

export class PersonalController extends BaseController {
  getById(PersonalId: string, res: Response) {
    const con = getConnection();

    con
      .query(
        "SELECT persona.PersonalId, cuit.PersonalCUITCUILCUIT, foto.DocumentoImagenFotoBlobNombreArchivo FROM Personal persona \
          JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = persona.PersonalId AND cuit.PersonalCUITCUILId = persona.PersonalCUITCUILUltNro \
          LEFT JOIN DocumentoImagenFoto foto ON foto.PersonalId = persona.PersonalId \
          WHERE persona.PersonalId = @0",
        [PersonalId]
      )
      .then((records: Array<ResponseByID>) => {
        records[0].image = process.env.IMAGE_FOTO_PATH.concat(records[0].DocumentoImagenFotoBlobNombreArchivo)
        if (records.length == 1) this.jsonRes(records[0], res);
        else { throw new Error('Record not found')}
      })
      .catch((err) => {
        this.errRes(err, res, "Error accediendo a la base de datos", 409);
      });
  }

  search(
    req: Request<{}, any, any, ParsedQs, Record<string, any>>,
    res: Response
  ) {
    const connection = getConnection();
    const { fieldName, value } = req.body;

    const valueArray: Array<string> = value.split(" ");

    let query: string =
      "SELECT persona.PersonalId, CONCAT(TRIM(persona.PersonalNombre) , ' ', TRIM(persona.PersonalApellido)) fullName FROM dbo.Personal persona WHERE";

    valueArray.forEach((element, index) => {
      query += `(persona.PersonalNombre LIKE '%${element}%' OR persona.PersonalApellido LIKE '%${element}%') AND `;
    });

    connection
      .query((query += " 1=1"))
      .then((records) => {
        this.jsonRes({recordsArray: records}, res);
      })
      .catch((err) => {
        this.errRes(err, res, "Error accediendo a la base de datos", 409);
      });
  }
  constructor() {
    super("");
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
