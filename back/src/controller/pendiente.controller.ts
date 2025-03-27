import { BaseController, ClientException } from "./baseController";
import { PersonaObj } from "../schemas/personal.schemas";
import fetch, { Request } from "node-fetch";
import { dataSource } from "../data-source";
import { Response } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { NextFunction } from "express";

export class PendienteController extends BaseController {
 

  search(req: any, res: Response, next:NextFunction) {
    const { fieldName, value } = req.body;

    let buscar = false;
    
    let query: string = `SELECT GrupoActividadId, GrupoActividadNumero, GrupoActividadDetalle from GrupoActividad WHERE`
    
    switch (fieldName) {
      case "GrupoActividadDetalle":
        const valueArray: Array<string> = value.split(/[\s,.]+/);
        valueArray.forEach((element, index) => {
          if (element.trim().length > 1) {
            query += ` (GrupoActividadDetalle LIKE '%${element.trim()}%' OR GrupoActividadNumero LIKE '%${element.trim()}%') AND  `;
            buscar = true;
          }
        });
        break;
      case "GrupoActividadNumero":
          query += ` GrupoActividadNumero = '${String(value).trim()}' AND `;
          buscar = true;
        break;
      case "GrupoActividadId":
          query += ` GrupoActividadId = '${String(value).trim()}' AND `;
          buscar = true;
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
