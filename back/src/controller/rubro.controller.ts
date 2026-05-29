import { BaseController, ClientException } from "./base.controller.ts";
import { getConnection } from "../data-source.ts";
import type { Response, NextFunction } from "express";

export class RubroController extends BaseController {

  async search(req: any, res: Response, next: NextFunction) {
    const { fieldName, value } = req.body;
    const queryRunner = await getConnection(res.locals.userName);
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


    queryRunner.query((query += " 1=1"))
      .then(async (records) => {

        await queryRunner.release()

        this.jsonRes({ recordsArray: records }, res);
      })
      .catch((error) => {
        return next(error)
      });
  }

  async getRubroCliente(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const options = await queryRunner.query(`
        SELECT RubroClienteId value, TRIM(RubroClienteDescripcion) label
        FROM RubroCliente
      `)
      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async getAllRubros(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const result = await queryRunner.query(`
        SELECT
          ru.RubroId,
          ru.RubroDescripcion
        FROM Rubro ru
        ORDER BY ru.RubroDescripcion
      `)
      this.jsonRes(result, res);
    } catch (error) {
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }
}
