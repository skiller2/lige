import { BaseController, ClientException } from "./baseController";
import { PersonaObj } from "../schemas/cliente.schemas";
import fetch, { Request } from "node-fetch";
import { dataSource } from "../data-source";
import { Response } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { NextFunction } from "express";

export class ClienteController extends BaseController {
  
  search(req: any, res: Response, next:NextFunction) {
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
        next(error)
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
