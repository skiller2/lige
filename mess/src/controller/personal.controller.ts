import { BaseController, ClientException } from "./base.controller";
// import { PersonaObj } from "../schemas/personal.schemas";
// import fetch, { Request } from "node-fetch";
import { dataSource } from "../data-source";
import { Response } from "express-serve-static-core";
// import { ParsedQs } from "qs";
import { NextFunction } from "express";

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
      WHERE persona_id=${personalId} 
      AND  tipo_movimiento_id=11
      ORDER BY periodo_id DESC ,movimiento_id DESC`
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

  async getPersonalMonotributo(req: any, res: Response, next:NextFunction) {
    const personalId = req.params.personalId;
    const anio = req.params.anio;
    const mes = req.params.mes;
    try {
      const result = await this.getPersonalMonotributoQuery(personalId, anio, mes)

      return this.jsonRes(result, res);
    } catch (error) {
      return next(error)
    }
  }

  async downloadComprobanteLink(
    personalId: number,
    cuit: number,
    year: number,
    month: number,
  ){
    const result = `https://gestion.linceseguridad.com.ar/ext/api/impuestos_afip/${year}/${month}/${cuit}/${personalId}`
    return result
  }

  async addTelefonoPersonalQuery( personalId : number, telefono : number, usuario : string , fecha : Date, ip : string){
    let reg_id = await dataSource.query(`SELECT MAX(reg_id) max_reg_id FROM lige.dbo.regtelefonopersonal`)
    reg_id = (reg_id[0].max_reg_id != undefined) ? reg_id[0].max_reg_id : 0
    const result = await dataSource.query(
      `INSERT INTO lige.dbo.regtelefonopersonal (reg_id, personal_id, telefono, aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod) 
      VALUES(@0,@1,@2,@3,@4,@5,@3,@4,@5)`,
      [++reg_id, personalId, telefono, usuario, ip, fecha ]
    );
    return
  }

  async addTelefonoPersonal(req: any, res: Response, next:NextFunction) {
    const personalId = req.params.personalId;
    const telefono = req.params.telefono;
    const usuario = req.params.usuario;
    const fecha = new Date
    const ip = this.getRemoteAddress(req)
    try {
      const result = await this.addTelefonoPersonalQuery(personalId, telefono, usuario, fecha, ip)

      return this.jsonRes(result, res);
    } catch (error) {
      return next(error)
    }
  }

  async getTelefonoPersonalQuery( personalId : number ){
    const result = await dataSource.query(
      `SELECT reg_id, personal_id, telefono, aud_usuario_mod
      FROM lige.dbo.regtelefonopersonal 
      WHERE personal_id = @0`,
      [ personalId ]
    );
    return result
  }

  async getTelefonoPersonal(req: any, res: Response, next:NextFunction) {
    const personalId = req.params.personalId;
    try {
      const result = await this.getTelefonoPersonalQuery( personalId )
      return this.jsonRes(result, res);
    } catch (error) {
      return next(error)
    }
  }

}