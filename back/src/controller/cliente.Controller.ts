import { BaseController, ClientException } from "./basecontroller.ts";
import fetch, { Request } from "node-fetch";
import { dataSource } from "../data-source.ts";
import { Response } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { NextFunction } from "express";

export class ClienteController extends BaseController {
  
  search(req: any, res: Response, next:NextFunction) {
    const { fieldName, value } = req.body;
    let buscar = false;
    let query: string = `SELECT ClienteId,ClienteDenominacion  FROM cliente WHERE`;
    switch (fieldName) {
      case "ClienteDenominacion":
        const valueArray: Array<string> = value.split(/[\s,.]+/);
        valueArray.forEach((element, index) => {
          if (element.trim().length > 1) {
//            query += `(ClienteDenominacion LIKE '%${element.trim()}%') AND `;
            query += `(CONCAT(ClienteNombreFantasia, ClienteDenominacion) LIKE '%${element.trim()}%') AND `;
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
          SELECT cli.ClienteId AS ClienteId, TRIM(cli.ClienteDenominacion) AS ClienteDenominacion, fac.ClienteFacturacionCUIT AS CUIT,
          CONCAT_WS(' ', TRIM(dom.DomicilioDomCalle), TRIM(dom.DomicilioDomNro), TRIM(loc.LocalidadDescripcion), TRIM(prov.ProvinciaDescripcion)) AS Domicilio
          FROM Cliente cli
          LEFT JOIN ClienteFacturacion fac ON fac.ClienteId = cli.ClienteId 
            AND fac.ClienteFacturacionDesde <= @1 
            AND ISNULL(fac.ClienteFacturacionHasta, '9999-12-31') >= @1
          LEFT JOIN NexoDomicilio nex ON nex.ClienteId = cli.ClienteId AND nex.NexoDomicilioActual = 1
          LEFT JOIN Domicilio dom ON dom.DomicilioId = nex.DomicilioId 
          LEFT JOIN Localidad loc ON loc.LocalidadId = dom.DomicilioLocalidadId AND loc.ProvinciaId = dom.DomicilioProvinciaId AND loc.PaisId = dom.DomicilioPaisId
          LEFT JOIN Provincia prov ON prov.ProvinciaId = dom.DomicilioProvinciaId AND prov.PaisId = dom.DomicilioPaisId
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
