import { getConnection, getManager, getRepository } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { BaseController } from "./baseController";
import { ParsedQs } from "qs";

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
      .then((records) => {
        console.log('registros',records);
        if (records.length == 1) this.jsonRes(records[0], res);
      })
      .catch((err) => {
        this.errRes(err, res, "Error accediendo a la base de datos", 409);
      });

    //    throw new Error("Method not implemented.");
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
        this.jsonRes(records, res);
      })
      .catch((err) => {
        this.errRes(err, res, "Error accediendo a la base de datos", 409);
      });
  }
  constructor() {
    super("");
  }

  //   dbstatus(res, req) {
  //     const con = getConnection();

  //     const data = {
  //       connected: false,
  //       database: process.env.DB_DATABASE,
  //       sqltest: {},
  //       random: Math.floor(Math.random() * (100000000000 + 1)),
  //     };

  //    con
  //       .query("SELECT 1 + @0", [1])
  //       .then((records) => {
  //         data.sqltest = records;
  //         data.connected = true;
  //         this.jsonRes(data, res);
  //         //throw new Error("Forzado");
  //       })
  //       .catch((err: Error) => {
  //         this.errRes(err, res, "Error accediendo a base de datos",409);
  //       });
  //   }

  async execProcedure(someParam: number) {
    /*
        const result = await this.connection.query(
          'EXEC procedures.MyProcedure @0', [someParam]
        );
        */
    // ... do something with the result
  }
}
