import { NextFunction, Response } from "express";
import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";
import { QueryRunner } from "typeorm";

export class CursoController extends BaseController {

  search(req: any, res: Response, next: NextFunction) {
    const { fieldName, value } = req.body

    let buscar = false;
    let query: string = `SELECT CursoHabilitacionId,CursoHabilitacionDescripcion,CursoHabilitacionCodigo FROM CursoHabilitacion ch
    WHERE`;
    switch (fieldName) {
      case "CursoHabilitacionDescripcion":
        const valueArray: Array<string> = value.split(/[\s,.]+/);
        valueArray.forEach((element, index) => {
          if (element.trim().length > 1) {
            query += `(ch.CursoHabilitacionDescripcion LIKE '%${element.trim()}%' OR ch.CursoHabilitacionCodigo LIKE '%${element.trim()}%') AND  `;
            buscar = true;
          }
        });
        break;
      case "CursoHabilitacionId":
        if (value > 0) {
          query += ` ch.CursoHabilitacionId = '${value}' AND `;
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