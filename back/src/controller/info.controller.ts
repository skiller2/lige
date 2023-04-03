import { getConnection, getManager, getRepository } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { BaseController } from "./baseController";
import { dataSource } from "../data-source";
import { dbServer } from "..";

export class InfoController extends BaseController {
  constructor() {
    super("");
  }

  dbstatus(res, req) {
    const con = dbServer.dataSource;
    console.log(con.isInitialized)
    const data = {
      connected: false,
      database: process.env.DB_DATABASE,
      sqltest: {},
      random: Math.floor(Math.random() * (100000000000 + 1)),
    };

   con
      .query("SELECT 1 + @0", [1])
      .then((records) => {
        data.sqltest = records;
        data.connected = true;
        this.jsonRes(data, res);
        //throw new Error("Forzado");
      })
      .catch((err: Error) => {
        this.errRes(err, res, "Error accediendo a base de datos",409);
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
