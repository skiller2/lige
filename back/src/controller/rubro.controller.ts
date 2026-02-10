import { BaseController, ClientException } from "./basecontroller.ts";
import fetch, { Request } from "node-fetch";
import { dataSource } from "../data-source.ts";
import { Response } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { NextFunction } from "express";

export class RubroController extends BaseController {
  
  search(req: any, res: Response, next:NextFunction) {
    const { fieldName, value } = req.body;
    let buscar = false;
    let query: string = `SELECT RubroClienteId, RubroClienteDescripcion FROM RubroCliente WHERE 1=1 AND `;
    switch (fieldName) {
      case "RubroClienteDescripcion":
        const valueArray: Array<string> = value.split(/[\s,.]+/);
        valueArray.forEach((element, index) => {
          if (element.trim().length >= 1) {
            query += ` RubroClienteDescripcion LIKE '%${element.trim()}%' AND `;
            buscar = true;
          }
        });
        break;
      case "RubroClienteId":
        if (value > 0) {
          query += ` RubroClienteId = '${value}' AND `;
          buscar = true;
        }
        break;
      default:
        break;
    }

    /*
    if (buscar == false) {
      this.jsonRes({ recordsArray: [] }, res);
      return;
    }
    */

    dataSource
      .query((query += " 1=1"))
      .then((records) => {
        this.jsonRes({ recordsArray: records }, res);
      })
      .catch((error) => {
        return next(error)
      });
  }

  async getRubroCliente(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await queryRunner.query(`
        SELECT RubroClienteId value, TRIM(RubroClienteDescripcion) label
        FROM RubroCliente
      `)
      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }
}
