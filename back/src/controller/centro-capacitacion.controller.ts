import { NextFunction, Response } from "express";
import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";
import { QueryRunner } from "typeorm";


export class CentroCapacitacionController extends BaseController {

    search(req: any, res: Response, next: NextFunction) {
        const { fieldName, value } = req.body
    
        let buscar = false;
        let query: string = `  SELECT CentroCapacitacionId, CentroCapacitacionRazonSocial FROM CentroCapacitacion WHERE `;
        switch (fieldName) {
          case "CentroCapacitacionRazonSocial":
            const valueArray: Array<string> = value.split(/[\s,.]+/);
            valueArray.forEach((element, index) => {
              if (element.trim().length > 1) {
                query += ` CentroCapacitacionRazonSocial LIKE '%${element.trim()}%'  AND  `;
                buscar = true;
              }
            });
            break;
          case "CentroCapacitacionId":
            if (value > 0) {
              query += ` CentroCapacitacionId = '${value}' AND `;
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


      searchSede(req: any, res: Response, next: NextFunction) {
        const { fieldName, value, CentroCapacitacionId } = req.body
        console.log("req.body", req.body)
        console.log("centro capacitacion id",CentroCapacitacionId)
        let buscar = false;
        let query: string = `   SELECT CentroCapacitacionSedeId, CentroCapacitacionId,CentroCapacitacionSedeDescripcion FROM CentroCapacitacionSede  WHERE `;
        switch (fieldName) {
          case "CentroCapacitacionSedeDescripcion":
            const valueArray: Array<string> = value.split(/[\s,.]+/);
            valueArray.forEach((element, index) => {
              if (element.trim().length > 1) {
                query += ` CentroCapacitacionSedeDescripcion LIKE '%${element.trim()}%'  AND  `;
                buscar = true;
              }
            });
            break;
          case "CentroCapacitacionSedeId":
            if (value > 0) {
              query += ` CentroCapacitacionSedeId = '${value}' AND `;
              buscar = true;
            }
            break;
          default:
            break;
        }

        if(CentroCapacitacionId > 0){
          query += ` CentroCapacitacionId = '${CentroCapacitacionId}' AND `;
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


}