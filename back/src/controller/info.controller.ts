import { BaseController } from "./basecontroller.ts";
import { dataSource } from "../data-source.ts";
import { Request, Response, NextFunction } from "express";

export class InfoController extends BaseController {

  dbstatus(req: Request, res: Response, next: NextFunction) {
    const data = {
      connected: false,
      database: process.env.DB_DATABASE,
      sqltest: {},
      random: Math.floor(Math.random() * (100000000000 + 1)),
    };

    dataSource
      .query("SELECT 1 + @0", [2])
      .then((records) => {
        data.sqltest = records;
        data.connected = true;

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
