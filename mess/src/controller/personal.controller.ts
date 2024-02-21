import { BaseController, ClientException } from "./base.controller";
// import { PersonaObj } from "../schemas/personal.schemas";
// import fetch, { Request } from "node-fetch";
import { dataSource } from "../data-source";
import { Response } from "express-serve-static-core";
// import { ParsedQs } from "qs";
import { NextFunction } from "express";

export class PersonalController extends BaseController {

  async search(req: any, res: Response, next:NextFunction) {
    const cuit = req.params.cuit;
    try {
      const result = await dataSource.query(
        `SELECT per.PersonalId, CONCAT(TRIM(per.PersonalApellido) , ', ', TRIM(per.PersonalNombre), ' CUIT:' , cuit.PersonalCUITCUILCUIT) fullName FROM dbo.Personal per 
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
        WHERE cuit.PersonalCUITCUILCUIT LIKE '%${cuit.trim()}%'`
      );
      return this.jsonRes(result, res);
    } catch (error) {
      return error
    }
  }
    
  async getUltDeposito(req: any, res: Response, next:NextFunction) {
    const cuit = req.params.cuit;
    try {
      const result = await dataSource.query(
        `SELECT TOP 1 persona_id,periodo_id,importe FROM lige.dbo.liqmamovimientos WHERE persona_id=28748 AND  tipo_movimiento_id=11
        ORDER BY periodo_id DESC ,movimiento_id DESC`
      );
      return this.jsonRes(result, res);
    } catch (error) {
      return error
    }
  }

}

