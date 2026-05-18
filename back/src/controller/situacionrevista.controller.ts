import { BaseController, ClientException } from "./base.controller.ts";
import { getConnection } from "../data-source.ts";
import type { Response,NextFunction } from "express";


export class SituacionRevistaController extends BaseController {
  
  async search(req: any, res: Response, next:NextFunction) {
    const { fieldName, value } = req.body;
    const queryRunner = await getConnection();

    let buscar = false;
    let query: string = `SELECT SituacionRevistaId, TRIM(SituacionRevistaDescripcion) SituacionRevistaDescripcion FROM SituacionRevista WHERE 1=1 AND `;
    switch (fieldName) {
      case "SituacionRevistaDescripcion":
        const valueArray: Array<string> = value.split(/[\s,.]+/);
        valueArray.forEach((element, index) => {
          if (element.trim().length >= 1) {
            query += ` SituacionRevistaDescripcion LIKE '%${element.trim()}%' AND `;
            buscar = true;
          }
        });
        break;
      case "SituacionRevistaId":
        if (value > 0) {
          query += ` SituacionRevistaId = '${value}' AND `;
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

    queryRunner
      .query((query += " 1=1"))
      .then((records) => {
        this.jsonRes({ recordsArray: records }, res);
      })
      .catch((error) => {
        return next(error)
      });
  }
  async execProcedure(someParam: number) {
  }
}
