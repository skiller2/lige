import { BaseController, ClientException } from "./base.controller";
// import { PersonaObj } from "../schemas/personal.schemas";
// import fetch, { Request } from "node-fetch";
import { dataSource } from "../data-source";
// import { Response } from "express-serve-static-core";
// import { ParsedQs } from "qs";
import { NextFunction, Request, Response } from "express";
import * as CryptoJS from 'crypto-js';
import { botServer } from "src";

export class PersonalController extends BaseController {
  async delTelefonoPersona(telefono: string) {

      const result = await dataSource.query(
        `DELETE FROM lige.dbo.regtelefonopersonal WHERE telefono=@0`,
        [telefono]
      );
      return result
  }

  getRemoteAddress(req: any) {
    return req.headers['x-origin-ip'] ??
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ??
      req.socket.remoteAddress
  }

  async searchQuery(cuit: number) {
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

  async search(req: any, res: Response, next: NextFunction) {
    const cuit = req.params.cuit;
    try {
      const result = await this.searchQuery(cuit)
      return this.jsonRes(result, res);
    } catch (error) {
      return next(error)
    }
  }

  async getUltDepositoQuery(personalId: number) {
    const result = await dataSource.query(
      `SELECT TOP 1 mov.persona_id, mov.periodo_id, mov.importe, per.anio, per.mes
      FROM lige.dbo.liqmamovimientos mov
      JOIN lige.dbo.liqmaperiodo per ON per.periodo_id=mov.periodo_id
      WHERE persona_id = @0
      AND  tipo_movimiento_id=11
      ORDER BY per.anio DESC, per.mes DESC, mov.movimiento_id DESC`,
      [personalId]
    );
    return result
  }

  async getUltDeposito(req: any, res: Response, next: NextFunction) {
    const personalId = req.params.personalId;
    try {
      const result = await this.getUltDepositoQuery(personalId)
      return this.jsonRes(result, res);
    } catch (error) {
      return next(error)
    }
  }

  async checkTelefonoPersonal(personalId: number, telefono: string, usuario: string, ip: string) {
    try {
      let result: any
      const [telefonoPersonal] = await dataSource.query(
        `SELECT reg.personal_id personalId, reg.telefono telefonoPersonal
        FROM lige.dbo.regtelefonopersonal reg
        WHERE reg.personal_id = @0`,
        [personalId]
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

  async addTelefonoPersonalQuery(personalId: number, telefono: string, usuario: string, ip: string) {
    const fecha = new Date
    const result = await dataSource.query(
      `INSERT INTO lige.dbo.regtelefonopersonal (personal_id, telefono, aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod) 
      VALUES(@0,@1,@2,@3,@4,@2,@3,@4)`,
      [personalId, telefono, usuario, ip, fecha]
    );
    return result
  }

  async getPersonalfromTelefonoQuery(telefono: string) {
    const result = await dataSource.query(
      `SELECT reg.personal_id personalId, reg.telefono, per.PersonalNombre name, cuit.PersonalCUITCUILCUIT cuit, codigo
      FROM lige.dbo.regtelefonopersonal reg
      LEFT JOIN Personal per ON per.PersonalId = reg.personal_id
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = reg.personal_id
      WHERE reg.telefono = @0`,
      [telefono]
    );
    return result
  }

  async getPersonalfromTelefono(req: any, res: Response, next: NextFunction) {
    const telefono = req.params.telefono;
    try {
      const result = await this.getPersonalfromTelefonoQuery(telefono)
      return this.jsonRes(result, res);
    } catch (error) {
      return next(error)
    }
  }

  async linkDownloadComprobanteRecibo(
    personalId: number,
    year: number,
    month: number,
  ) {
    const result = `http://localhost:3010/api/recibos/download/${year}/${month}/${personalId}`
    return result
  }

  async updateTelefonoPersonalQuery(personalId: number, telefono: string, usuario: string, ip: string) {
    const fecha = new Date
    const result = await dataSource.query(
      `UPDATE lige.dbo.regtelefonopersonal SET telefono = @1, aud_usuario_mod = @2, aud_ip_mod= @3, aud_fecha_mod = @4
      WHERE personal_id = @0`,
      [personalId, telefono, usuario, ip, fecha]
    );
    return result
  }


  async genTelCode(telNro: string) {
    //const stmactual = new Date();
    //const usuario = 'anon'
    //const ip = 'localhost'
    //const queryRunner = dataSource.createQueryRunner();

    try {
      const _key = CryptoJS.default.enc.Utf8.parse(process.env.KEY_IDENT_TEL);
      const _iv = CryptoJS.default.enc.Utf8.parse(process.env.KEY_IDENT_TEL);
      const encrypted = CryptoJS.default.AES.encrypt(
        telNro, _key, {
        keySize: 16,
        iv: _iv,
        mode: CryptoJS.default.mode.ECB,
        padding: CryptoJS.default.pad.Pkcs7
      });
      return { encTelNro: encrypted.toString() }
    } catch (error) {
      console.log('encoding', error)
      throw error
    }
  }

  async getIdentCode(req: any, res: Response, next: NextFunction) {
    const des_doc_ident = req.query.identData
    const encTelNro = req.query.encTelNro

    const stmactual = new Date();
    const usuario = 'anon'
    const ip = this.getRemoteAddress(req)
    const cuit = '20148145610'
    const queryRunner = dataSource.createQueryRunner();

    try {

      const _key = CryptoJS.default.enc.Utf8.parse(process.env.KEY_IDENT_TEL);
      const _iv = CryptoJS.default.enc.Utf8.parse(process.env.KEY_IDENT_TEL);
      const decrypted = CryptoJS.default.AES.decrypt(
        encTelNro, _key, {
        keySize: 16,
        iv: _iv,
        mode: CryptoJS.default.mode.ECB,
        padding: CryptoJS.default.pad.Pkcs7
      });

      const telNro = decrypted.toString(CryptoJS.default.enc.Utf8)

      const valid = /^\d+$/.test(telNro);
      if (!valid || telNro.length < 8)
        throw new ClientException('No se puede verificar el número de teléfono')

      await queryRunner.startTransaction()

      const result = await queryRunner.query(
        `SELECT DISTINCT
        per.PersonalId, cuit2.PersonalCUITCUILCUIT AS CUIT, CONCAT(TRIM(per.PersonalApellido), ',', TRIM(per.PersonalNombre)) ApellidoNombre,
        1
        FROM Personal per
        JOIN PersonalCUITCUIL cuit2 ON cuit2.PersonalId = per.PersonalId AND cuit2.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)
        WHERE cuit2.PersonalCUITCUILCUIT = @0`,
        [cuit]
      )
      if (result.length == 0)
        throw new ClientException('No se pudo verificar el documento, contáctese con personal')
      const PersonalId = result[0].PersonalId
      const codigo = Math.floor(Math.random() * (999999 - 100000) + 100000)

      await queryRunner.query(
        `IF EXISTS(select * from lige.dbo.regtelefonopersonal where personal_id=@0) UPDATE lige.dbo.regtelefonopersonal SET codigo=@1, telefono=@2, des_doc_ident=@6, aud_usuario_mod=@3, aud_ip_mod=@4, aud_fecha_mod=@5 WHERE personal_id=@0 ELSE INSERT INTO lige.dbo.regtelefonopersonal (personal_id, codigo, telefono, des_doc_ident, aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod) values(@0,@1,@2,@6,@3,@4,@5,@3,@4,@5)   `,
        [PersonalId, codigo, telNro, usuario, ip, stmactual,des_doc_ident]
      )

      await queryRunner.commitTransaction()


      botServer.sendMsg(telNro,'Su número ha sido registrado correctamente')


      this.jsonRes({ codigo }, res);
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    }
  }

}