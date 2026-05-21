import { BaseController } from "./base.controller.ts";
import { getConnection } from "../data-source.ts";
import type { Request, Response, NextFunction } from "express";
import { QueryResult } from "typeorm";

export class InfoController extends BaseController {

  async dbstatus(req: Request, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);
    const data = {
      connected: false,
      database: process.env.DB_DATABASE,
      sqltest: {},
      random: Math.floor(Math.random() * (100000000000 + 1)),
    };

    queryRunner
      .query("SELECT 1 + @0", [2])
      .then(async (records) => {
        data.sqltest = records;
        data.connected = true;

        await queryRunner.release()

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
