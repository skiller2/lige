import { BaseController, ClientException } from "./base.controller";
// import { PersonaObj } from "../schemas/personal.schemas";
// import fetch, { Request } from "node-fetch";
import { dataSource } from "../data-source";
// import { Response } from "express-serve-static-core";
// import { ParsedQs } from "qs";
import { NextFunction, Request, Response } from "express";

export class PersonalController extends BaseController {

  getRemoteAddress(req: any) {
    return req.headers['x-origin-ip'] ??
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ??
      req.socket.remoteAddress
  }

  async searchQuery(cuit: number){
    const result = await dataSource.query(
      `SELECT per.PersonalId, CONCAT(TRIM(per.PersonalApellido) , ', ', TRIM(per.PersonalNombre), ' CUIT:' , cuit.PersonalCUITCUILCUIT) fullName 
      FROM dbo.Personal per 
      LEFT JOIN PersonalCUITCUIL cuit 
      ON cuit.PersonalId = per.PersonalId 
      AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) 
      FROM PersonalCUITCUIL cuitmax 
      WHERE cuitmax.PersonalId = per.PersonalId)
      WHERE cuit.PersonalCUITCUILCUIT LIKE '%${cuit}%'`
    );
    return result
  }

  async search(req: any, res: Response, next:NextFunction) {
    const cuit = req.params.cuit;
    try {
      const result = await this.searchQuery(cuit)
      return this.jsonRes(result, res);
    } catch (error) {
      return next(error)
    }
  }

  async getUltDepositoQuery(personalId: number){
    const result = await dataSource.query(
      `SELECT TOP 1 persona_id, periodo_id, importe 
      FROM lige.dbo.liqmamovimientos 
      WHERE persona_id = @0 
      AND  tipo_movimiento_id=11
      ORDER BY periodo_id DESC ,movimiento_id DESC`,
      [ personalId ]
    );
    return result
  }
    
  async getUltDeposito(req: any, res: Response, next:NextFunction) {
    const personalId = req.params.personalId;
    try {
      const result = await this.getUltDepositoQuery(personalId)
      return this.jsonRes(result, res);
    } catch (error) {
      return next(error)
    }
  }

  async getPersonalMonotributoQuery( personalId : number, anio : number, mes : number ){
    const result = await dataSource.query(
      `SELECT des.PersonalId,des.PersonalOtroDescuentoMesesAplica,des.PersonalOtroDescuentoAnoAplica 
      FROM PersonalOtroDescuento des 
      WHERE des.PersonalId = @0 
      AND des.PersonalOtroDescuentoDescuentoId = @1 
      AND des.PersonalOtroDescuentoAnoAplica = @2 
      AND des.PersonalOtroDescuentoMesesAplica = @3`,
      [personalId, Number(process.env.OTRO_DESCUENTO_ID), anio, mes]
    );
    return result
  }

  async checkTelefonoPersonal( personalId : number, telefono : string, usuario : string, ip : string){
    try {
      let result : any
      const [telefonoPersonal] = await dataSource.query(
        `SELECT reg.personal_id personalId, reg.telefono
        FROM lige.dbo.regtelefonopersonal reg
        WHERE reg.personal_id = @0`,
        [ personalId ]
      );
      if (telefonoPersonal) {
        result = await this.updateTelefonoPersonalQuery(personalId, telefono, usuario, ip)
      } else {
        result = await this.addTelefonoPersonalQuery(personalId, telefono, usuario, ip)
      }
      return result
    } catch (error) {
      return error
    }
  }

  async addTelefonoPersonalQuery( personalId : number, telefono : string, usuario : string, ip : string){
    const fecha = new Date
    const result = await dataSource.query(
      `INSERT INTO lige.dbo.regtelefonopersonal (personal_id, telefono, aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod) 
      VALUES(@0,@1,@2,@3,@4,@2,@3,@4)`,
      [personalId, telefono, usuario, ip, fecha ]
    );
    return result
  }

  async getPersonalfromTelefonoQuery( telefono : string ){
    const result = await dataSource.query(
      `SELECT reg.personal_id personalId, reg.telefono, per.PersonalNombre name, cuit.PersonalCUITCUILCUIT cuit
      FROM lige.dbo.regtelefonopersonal reg
      LEFT JOIN Personal per ON per.PersonalId = reg.personal_id
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = reg.personal_id
      WHERE reg.telefono = @0`,
      [ telefono ]
    );
    return result
  }

  async getPersonalfromTelefono(req: any, res: Response, next:NextFunction) {
    const telefono = req.params.telefono;
    try {
      const result = await this.getPersonalfromTelefonoQuery( telefono )
      return this.jsonRes(result, res);
    } catch (error) {
      return next(error)
    }
  }

  async linkDownloadComprobanteRecibo(
    personalId: number,
    year: number,
    month: number,
  ){
    const result = `http://localhost:3010/api/recibos/download/${year}/${month}/${personalId}`
    return result
  }
  
  async updateTelefonoPersonalQuery( personalId : number, telefono : string, usuario : string, ip : string){
    const fecha = new Date
    const result = await dataSource.query(
      `UPDATE lige.dbo.regtelefonopersonal SET telefono = @1, aud_usuario_mod = @2, aud_ip_mod= @3, aud_fecha_mod = @4
      WHERE AND personal_id = @0`,
      [ personalId, telefono, usuario, ip, fecha ]
    );
    return result
  }
}