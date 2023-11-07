import { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { mkdirSync, existsSync, readFileSync, unlinkSync } from "fs";
import xlsx from 'node-xlsx';
import { isNumberObject } from "util/types";
import fetch from "node-fetch";

export class InformesController extends BaseController {
  directory = process.env.PATH_INFORMES || "tmp";
  ssrsUser = process.env.SSRS_USER || "";
  ssrsPass = process.env.SSRS_PASS || "";
  ssrsURL = "https://gestion.linceseguridad.com.ar/reports/api/v2.0"

  async Report(req: Request, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const {
      Usuario,
      Reporte,
      Formato,
      Filtros
    } = req.body;
    console.log('Respuesta:', Usuario,
      Reporte,
      Formato,
      Filtros
    )


    const resp = await fetch(this.ssrsURL + "/CatalogItems", { method: 'GET', headers: { 'Authorization': 'Basic ' + Buffer.from(this.ssrsUser + ":" + this.ssrsPass).toString('base64') } })
    if (resp.status != 200)
      throw new ClientException(`Error accediendo al sistema de reportes status ${resp.status}`)
    const data = await resp.json();
    console.log('data', data)
    const rep = data.value.find(x => x.Name.localeCompare(Reporte)===0 );
    console.log('resp', rep)

    this.jsonRes({ list: [] }, res, `Se procesaron registros `);

  }

}

