import { dbServer } from "../index.ts";
import { BaseController } from "../controller/base.controller.ts";
import type { Request, Response, NextFunction } from "express";

export class InfoController extends BaseController {

  async dbstatus(req: Request, res: Response, next: NextFunction) {
    const data = {
      connected: false,
      database: process.env.DB_DATABASE,
      sqltest: {},
      random: Math.floor(Math.random() * (100000000000 + 1)),
    };

    const usuario = BaseController.getUser(res)
    const queryRunner = await dbServer.connection(usuario);

    queryRunner.query("SELECT 1 + @0", [2])
      .then(async (records) => {
        data.sqltest = records;
        data.connected = true;

        await queryRunner.release();

        this.jsonRes(data, res);
      })
      .catch(error => {
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
