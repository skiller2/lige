import { BaseController, ClientException } from "./baseController";
import fetch, { Request } from "node-fetch";
import { dataSource } from "../data-source";
import { Response } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { NextFunction } from "express";

export class ClienteController extends BaseController {
  
  search(req: any, res: Response, next:NextFunction) {
    const { fieldName, value } = req.body;
    let buscar = false;
    let query: string = `SELECT ClienteId,ClienteApellidoNombre  FROM cliente WHERE`;
    switch (fieldName) {
      case "ClienteApellidoNombre":
        const valueArray: Array<string> = value.split(/[\s,.]+/);
        valueArray.forEach((element, index) => {
          if (element.trim().length > 1) {
//            query += `(ClienteApellidoNombre LIKE '%${element.trim()}%') AND `;
            query += `(CONCAT(ClienteNombreFantasia, ClienteApellidoNombre) LIKE '%${element.trim()}%') AND `;
            buscar = true;
          }
        });
        break;
      case "ClienteId":
        if (value > 0) {
          query += ` ClienteId = '${value}' AND `;
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

    dataSource
      .query((query += " 1=1"))
      .then((records) => {
        this.jsonRes({ recordsArray: records }, res);
      })
      .catch((error) => {
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

  async getClientesBillingData(req: any, res: Response, next:NextFunction) {
    const clientesIds: number[] = req.body
    const queryRunner = dataSource.createQueryRunner();
    let infoCliente: any[] = []
    const now = new Date()
    try {
      await queryRunner.startTransaction()
      for (const id of clientesIds) {
        let info = await queryRunner.query(`
          SELECT cli.ClienteId AS ClienteId, TRIM(cli.ClienteApellidoNombre) AS ApellidoNombre, fac.ClienteFacturacionCUIT AS CUIT,
          CONCAT_WS(' ', TRIM(domcli.ClienteDomicilioDomCalle), TRIM(domcli.ClienteDomicilioDomNro), TRIM(loc.LocalidadDescripcion), TRIM(prov.ProvinciaDescripcion)) AS Domicilio
          FROM Cliente cli
          LEFT JOIN ClienteFacturacion fac ON fac.ClienteId = cli.ClienteId 
            AND fac.ClienteFacturacionDesde <= @1 
            AND ISNULL(fac.ClienteFacturacionHasta, '9999-12-31') >= @1
          LEFT JOIN ClienteDomicilio domcli ON domcli.ClienteId = cli.ClienteId AND domcli.ClienteDomicilioId = cli.ClienteDomicilioUltNro AND ClienteDomicilioActual = 1
          LEFT JOIN Localidad loc ON loc.LocalidadId = domcli.ClienteDomicilioLocalidadId AND loc.ProvinciaId = domcli.ClienteDomicilioProvinciaId AND loc.PaisId = domcli.ClienteDomicilioPaisId
          LEFT JOIN Provincia prov ON prov.ProvinciaId = domcli.ClienteDomicilioProvinciaId AND prov.PaisId = domcli.ClienteDomicilioPaisId
          WHERE cli.ClienteId = @0`, [id, now]
        )
        infoCliente.push(info[0])
      }
      await queryRunner.commitTransaction()
      return this.jsonRes(infoCliente, res);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }
}
