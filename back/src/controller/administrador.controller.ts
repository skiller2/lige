import { BaseController, ClientException } from "./basecontroller.ts";
import fetch, { Request } from "node-fetch";
import { dataSource } from "../data-source.ts";
import type { Response } from "express";
import { ParsedQs } from "qs";
import { NextFunction } from "express";

export class AdministradorController extends BaseController {
  
  search(req: any, res: Response, next:NextFunction) {
    const { fieldName, value } = req.body;
    let buscar = false;
    let query: string = `SELECT AdministradorId, AdministradorApellidoNombre FROM Administrador WHERE`;
    switch (fieldName) {
      case "AdministradorApellidoNombre":
        const valueArray: Array<string> = value.split(/[\s,.]+/);
        valueArray.forEach((element, index) => {
          if (element.trim().length > 1) {
            query += `(CONCAT(AdministradorDenominacion, AdministradorNombreFantasia, AdministradorApellidoNombre) LIKE '%${element.trim()}%') AND `;
            buscar = true;
          }
        });
        break;
      case "AdministradorId":
        if (value > 0) {
          query += ` AdministradorId = '${value}' AND `;
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

}
