import { BaseController } from "./baseController";
import { dataSource } from "../data-source";

export class SucursalController extends BaseController {

  async getAllSucursales(res, req) {
    try {
        const result = await dataSource.query(
            'SELECT SucursalId, SucursalDescripcion FROM Sucursal '
        )
        this.jsonRes(result, res)
    }
    catch (err) {
        this.errRes(err, res, "Error accediendo a la base de datos", 409)
    }
    /*
        const result = await this.connection.query(
          'EXEC procedures.MyProcedure @0', [someParam]
        );
        */
    // ... do something with the result
  }
}
