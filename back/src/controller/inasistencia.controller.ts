import { BaseController, ClientException } from "./baseController";
import fetch, { Request } from "node-fetch";
import { dataSource } from "../data-source";
import { Response } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { NextFunction } from "express";

export class InasistenciaController extends BaseController {
  
  search(req: any, res: Response, next:NextFunction) {
    const { fieldName, value } = req.body;
    let buscar = false;
    let query: string = `SELECT TipoInasistenciaId, TipoInasistenciaDescripcion FROM TipoInasistencia WHERE 1=1 AND `;
    switch (fieldName) {
      case "TipoInasistenciaDescripcion":
        const valueArray: Array<string> = value.split(/[\s,.]+/);
        valueArray.forEach((element, index) => {
          if (element.trim().length >= 1) {
            query += ` TipoInasistenciaDescripcion LIKE '%${element.trim()}%' AND `;
            //query += `(CONCAT(CLienteDenominacion, ClienteNombreFantasia, ClienteApellidoNombre) LIKE '%${element.trim()}%') AND `;
            buscar = true;
          }
        });
        break;
      case "TipoInasistenciaId":
        if (value > 0) {
          query += ` TipoInasistenciaId = '${value}' AND `;
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
