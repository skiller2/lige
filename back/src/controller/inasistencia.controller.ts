import { BaseController, ClientException } from "./base.controller.ts";
import { getConnection } from "../data-source.ts";
import type { Response, NextFunction } from "express";

export class InasistenciaController extends BaseController {

  async search(req: any, res: Response, next: NextFunction) {
    const { fieldName, value } = req.body;

    let buscar = false;
    // Los términos del usuario van como parámetros, no interpolados en el SQL.
    const params: any[] = [];
    let query: string = `SELECT TipoInasistenciaId, TipoInasistenciaDescripcion FROM TipoInasistencia WHERE 1=1 AND `;
    switch (fieldName) {
      case "TipoInasistenciaDescripcion":
        const valueArray: Array<string> = value.split(/[\s,.]+/);
        valueArray.forEach((element, index) => {
          if (element.trim().length >= 1) {
            query += ` TipoInasistenciaDescripcion LIKE @${params.length} AND `;
            params.push(`%${element.trim()}%`);
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
    
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const records = await queryRunner.query((query += " 1=1"), params);
      this.jsonRes({ recordsArray: records }, res);
    } catch (error) {
      return next(error)
    } finally {
      await queryRunner.release()
    }
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
