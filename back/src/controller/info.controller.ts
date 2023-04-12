import { BaseController } from "./baseController";
import { dataSource } from "../data-source";

export class InfoController extends BaseController {

  dbstatus(res:any, req:any) {
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
