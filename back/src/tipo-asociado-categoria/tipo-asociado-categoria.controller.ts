import { BaseController } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";

export class TipoAsociadoCategoriaController extends BaseController {

  searchTipoAsociadoCategoria(req: any, res: Response, next: NextFunction) {
    const { fieldName, value } = req.body;
    let buscar = false;
    let query: string = `SELECT cat.TipoAsociadoId, cat.CategoriaPersonalId,
        CONCAT(TRIM(tip.TipoAsociadoDescripcion), ' - ', TRIM(cat.CategoriaPersonalDescripcion)) Label,
        CONCAT(cat.TipoAsociadoId,'/', cat.CategoriaPersonalId) id
        FROM CategoriaPersonal cat 
        JOIN TipoAsociado tip ON tip.TipoAsociadoId = cat.TipoAsociadoId
        WHERE (CategoriaPersonalInactivo is null or CategoriaPersonalInactivo = 0) AND `;
    switch (fieldName) {
      case "Label":
        const valueArray: Array<string> = value.split(/[\s,.]+/);
        valueArray.forEach((element, index) => {
          if (element.trim().length > 1) {
            query += `(CONCAT(TRIM(tip.TipoAsociadoDescripcion), ' - ', TRIM(cat.CategoriaPersonalDescripcion)) LIKE '%${element.trim()}%') AND `;
            buscar = true;
          }
        });
        break;
      case "id":
        if (value && value.length > 0) {
          // El id tiene formato TipoAsociadoId/CategoriaPersonalId
          const parts = value.split('/');
          if (parts.length === 2) {
            query += `cat.TipoAsociadoId = '${parts[0]}' AND cat.CategoriaPersonalId = '${parts[1]}' AND `;
            buscar = true;
          } else {
            query += `CONCAT(cat.TipoAsociadoId,'/', cat.CategoriaPersonalId) LIKE '%${value}%' AND `;
            buscar = true;
          }
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

