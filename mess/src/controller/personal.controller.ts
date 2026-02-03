import { BaseController, ClientException } from "./base.controller.ts";
import type { NextFunction, Request, Response } from "express";
import * as CryptoJS from 'crypto-js';
import { botServer, dbServer } from "../index.ts";

export class PersonalController extends BaseController {
  async setPersonalAdelanto(personalId: any, anio: any, mes: any, monto: number) {
    const now = new Date()
    const ip = this.getRemoteAddress(null)
    const FormaPrestamoId = 7 //Adelanto
    const usuario = 'bot'


    await dbServer.dataSource.query(
      `DELETE FROM PersonalPrestamo WHERE PersonalPrestamoAprobado IS NULL AND FormaPrestamoId = @1 AND PersonalId = @0 AND PersonalPrestamoAplicaEl = CONCAT(FORMAT(@3,'00'),'/',@2)`
      , [personalId, FormaPrestamoId, anio, mes]
    );

    const prestamoId =
      Number((
        await dbServer.dataSource.query(
          `SELECT per.PersonalPrestamoUltNro as max FROM Personal per WHERE per.PersonalId = @0`,
          [personalId]
        )
      )[0].max) + 1;

    await dbServer.dataSource.query(
      `INSERT INTO PersonalPrestamo(
      PersonalPrestamoId, PersonalId, PersonalPrestamoMonto, FormaPrestamoId, 
      PersonalPrestamoAprobado, PersonalPrestamoFechaAprobacion, PersonalPrestamoCantidadCuotas, PersonalPrestamoAplicaEl, 
      PersonalPrestamoLiquidoFinanzas, PersonalPrestamoUltimaLiquidacion, PersonalPrestamoCuotaUltNro, PersonalPrestamoMontoAutorizado, 
      PersonalPrestamoAudFechaIng, PersonalPrestamoAudUsuarioIng, PersonalPrestamoAudIpIng, PersonalPrestamoAudFechaMod, PersonalPrestamoAudUsuarioMod, PersonalPrestamoAudIpMod)
      VALUES(
      @0, @1, @2, @3,
      @4, @5, @6, @7,
      @8, @9, @10, @11,
      @12, @13, @14, @12, @13, @14)`,
      [
        prestamoId, //PersonalPrestamoId
        personalId, //PersonalId
        monto, //PersonalPrestamoMonto
        FormaPrestamoId, //FormaPrestamoId = 7 Adelanto

        null, //PersonalPrestamoAprobado
        null, //PersonalPrestamoFechaAprobacion
        1,  //PersonalPrestamoCantidadCuotas
        `${mes.toString().padStart(2, '0')}/${anio}`, //PersonalPrestamoAplicaEl

        null, //PersonalPrestamoLiquidoFinanzas
        "", //PersonalPrestamoUltimaLiquidacion
        null, //PersonalPrestamoCuotaUltNro
        0, //PersonalPrestamoMontoAutorizado

        now, usuario, ip //Aud data
      ]
    );

    await dbServer.dataSource.query(
      `UPDATE Personal SET PersonalPrestamoUltNro=@1 WHERE PersonalId=@0 `,
      [
        personalId,
        prestamoId,
      ]
    );
  }

  async deletePersonalAdelanto(personalId: any, anio: any, mes: any) {
    const FormaPrestamoId = 7 //Adelanto

    const adelanto: any = await dbServer.dataSource.query(`
      SELECT ade.PersonalId, ade.PersonalPrestamoMonto, ade.PersonalPrestamoFechaAprobacion, ade.PersonalPrestamoAplicaEl FROM PersonalPrestamo ade
      WHERE ade.FormaPrestamoId = 7 AND ade.PersonalPrestamoAplicaEl = CONCAT(FORMAT(@2,'00'),'/',@1) 
      AND ade.PersonalId = @0
      `, [personalId, anio, mes]
    )

    if (adelanto.length && !adelanto[0].PersonalPrestamoFechaAprobacion) {
      await dbServer.dataSource.query(
        `DELETE FROM PersonalPrestamo WHERE PersonalPrestamoAprobado IS NULL AND FormaPrestamoId = @1 AND PersonalId = @0 AND PersonalPrestamoAplicaEl = CONCAT(FORMAT(@3,'00'),'/',@2)`
        , [personalId, FormaPrestamoId, anio, mes]
      );
    }
  }

  async getDocsPendDescarga(PersonalId: number) {
    const result = await dbServer.dataSource.query(
      `SELECT doc.personalid PersonalId, 
        doc.DocumentoId, doc.Documentofecha, doc.DocumentoTipoCodigo, tip.DocumentoTipoDetalle, tip.DocumentoTipoDescripcionDenominadorDocumento, doc.DocumentoDenominadorDocumento, pr.anio, pr.mes, doc.DocumentoNombreArchivo,
        MAX(dl.FechaDescarga) fecha_descarga, IIF(dl.DocumentoId IS NOT NULL,1,0) AS visto
        FROM Documento doc
        JOIN DocumentoTipo tip ON tip.DocumentoTipoCodigo = doc.DocumentoTipoCodigo
        LEFT JOIN lige.dbo.liqmaperiodo pr ON pr.anio = doc.DocumentoAnio AND pr.mes = doc.DocumentoMes
        LEFT JOIN DocumentoDescargaLog dl ON dl.DocumentoId=doc.DocumentoId AND dl.PersonalId = @0
        WHERE doc.DocumentoIndividuoDescargaBot = 1  AND dl.FechaDescarga IS NULL AND (doc.personalid =0 OR doc.personalid =  @0) AND Documentofecha > '2025-01-01'
        GROUP BY doc.personalid, doc.DocumentoId, doc.Documentofecha, doc.DocumentoTipoCodigo, tip.DocumentoTipoDetalle, DocumentoTipoDescripcionDenominadorDocumento, doc.DocumentoDenominadorDocumento, dl.DocumentoId, pr.anio, pr.mes, doc.DocumentoNombreArchivo`
      ,
      [PersonalId]
    )
    return result
  }

  async removeCode(telefono: string) {
    return dbServer.dataSource.query(
      `UPDATE BotRegTelefonoPersonal SET Codigo=NULL WHERE Telefono=@0`,
      [telefono]
    );
  }

  linkVigenciaHs: number = (process.env.LINK_VIGENCIA) ? Number(process.env.LINK_VIGENCIA) : 3

  async delTelefonoPersona(telefono: string) {

    const result = await dbServer.dataSource.query(
      `DELETE FROM BotRegTelefonoPersonal WHERE Telefono=@0`,
      [telefono]
    );
    return result
  }

  /*
    getRemoteAddress(req: any) {
      return req.headers['x-origin-ip'] ??
        (req.headers['x-forwarded-for'] as string)?.split(',')[0] ??
        req.socket.remoteAddress
    }
  
    async searchQuery(cuit: number) {
      const result = await dbServer.dataSource.query(
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
    */
  /*
    async search(req: any, res: Response, next: NextFunction) {
      const cuit = req.params.cuit;
      try {
        const result = await this.searchQuery(cuit)
        return this.jsonRes(result, res);
      } catch (error) {
        return next(error)
      }
    }
  
  */

  async getPersonaState(telefono: string) {
    const res = await this.getPersonalQuery(telefono, 0)
    let activo = false
    let PersonalSituacionRevistaSituacionId = 0
    let stateData = {}
    let firstName = ""
    let codigo = 0
    //force
    /*
    if (process.env.PERSONALID_TEST) {
      res.length = 0
      res.push({ cuit: '20300000001', codigo: '', PersonalSituacionRevistaSituacionId: 2, PersonalId: process.env.PERSONALID_TEST, name: 'Prueba probador' })
    }*/

    if (res.length) {
      stateData = { personalId: res[0].PersonalId, cuit: res[0].cuit, codigo: res[0].codigo, name: res[0].name.trim() }
      if ([2, 9, 23, 12, 10, 16, 28, 18, 26, 11, 20, 22].includes(res[0].PersonalSituacionRevistaSituacionId))
        activo = true
      PersonalSituacionRevistaSituacionId = res[0].PersonalSituacionRevistaSituacionId

      const tmpName = String(res[0].name).trim().split(" ")[0].trim();
      firstName = tmpName.charAt(0).toUpperCase() + tmpName.slice(1).toLowerCase()

      codigo = res[0].Codigo
    }

    return { activo, stateData, PersonalSituacionRevistaSituacionId, firstName, codigo }
  }

  async getPersonalQuery(telefono: string, PersonalId: number) {
    return await dbServer.dataSource.query(
      `SELECT reg.PersonalId, reg.Telefono, TRIM(per.PersonalNombre) name,CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) fullName, cuit.PersonalCUITCUILCUIT cuit, reg.Codigo, 
      sitrev.PersonalSituacionRevistaSituacionId, sitrev.PersonalSituacionRevistaDesde, sitrev.PersonalSituacionRevistaHasta, 
      sit.SituacionRevistaDescripcion, per.PersonalNroLegajo, ing.PersonalFechaIngreso, ing.PersonalFechaBaja 
      FROM BotRegTelefonoPersonal reg
      LEFT JOIN Personal per ON per.PersonalId = reg.PersonalId
      LEFT JOIN PersonalIngresoEgreso ing ON ing.PersonalId = per.PersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = reg.PersonalId AND cuit.PersonalCUITCUILId =( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = reg.PersonalId)
      LEFT JOIN PersonalSituacionRevista sitrev ON sitrev.PersonalId = per.PersonalId AND sitrev.PersonalSituacionRevistaDesde<=@2 AND  ISNULL(sitrev.PersonalSituacionRevistaHasta,'9999-12-31')>=CAST(@2 AS DATE) 
      LEFT JOIN SituacionRevista sit ON sit.SituacionRevistaId = sitrev.PersonalSituacionRevistaSituacionId


      WHERE reg.Telefono = @0 or reg.PersonalId = @1`,
      [telefono, PersonalId, new Date()]
    );
  }



  async genTelCode(data: string) {
    const stmgen = new Date();
    //const usuario = 'anon'
    //const ip = 'localhost'
    //const queryRunner = dataSource.createQueryRunner();
    const dataStr = JSON.stringify({ stmgen, data });

    try {
      const _key = CryptoJS.default.enc.Utf8.parse(process.env.KEY_IDENT_TEL);
      const _iv = CryptoJS.default.enc.Utf8.parse(process.env.KEY_IDENT_TEL);
      const encrypted = CryptoJS.default.AES.encrypt(
        dataStr, _key, {
        keySize: 16,
        iv: _iv,
        mode: CryptoJS.default.mode.ECB,
        padding: CryptoJS.default.pad.Pkcs7
      });

      console.log('Cryptos', CryptoJS)


      return { encTelNro: encrypted.ciphertext.toString(CryptoJS.default.enc.Hex) }
    } catch (error) {
      console.log('Encoding:', error)
      throw error
    }
  }

  async getIdentCode(req: any, res: Response, next: NextFunction) {
    const CUIT = req.query.cuit
    const des_doc_ident = req.query.identData || ""
    //    const des_doc_ident = '00417052787@OROFINO@ALFREDO GONZALO@M@7595775@A@24/05/1973@22/01/2016@239'
    const encryptedData = req.query.encTelNro

    const stmactual = new Date();
    const usuario = 'anon'
    const ip = this.getRemoteAddress(req)
    let dni = ''
    const des_doc_ident_parts = des_doc_ident.split('@')



    const queryRunner = dbServer.dataSource.createQueryRunner();

    try {
      if (des_doc_ident_parts.length > 4) {
        if (des_doc_ident_parts[0] == '')
          dni = des_doc_ident_parts[1].trim()
        else
          dni = des_doc_ident_parts[4].trim()
      } else if (CUIT) {

      } else
        throw new ClientException('No se pudo obtener el número de dni', { des_doc_ident })

      const _key = CryptoJS.default.enc.Utf8.parse(process.env.KEY_IDENT_TEL);
      const _iv = CryptoJS.default.enc.Utf8.parse(process.env.KEY_IDENT_TEL);
      const decrypted = CryptoJS.default.AES.decrypt(
        encryptedData, _key, {
        keySize: 16,
        iv: _iv,
        mode: CryptoJS.default.mode.ECB,
        padding: CryptoJS.default.pad.Pkcs7,
        format: CryptoJS.format.Hex
      });

      const dataObj = JSON.parse(decrypted.toString(CryptoJS.default.enc.Utf8))
      if (!dataObj.stmgen || (new Date().getTime() - Date.parse(dataObj?.stmgen)) / 1000 / 60 / 60 > this.linkVigenciaHs) {
        throw new ClientException('El enlace proporcionado expiró, vuelve a saludar al BOT para recibir uno nuevo')
      }

      const telNro = String(dataObj?.data)

      const telValid = /^\d+$/.test(telNro);
      const dniValid = /^\d+$/.test(dni);
      let bus = ''
      if (CUIT) {
        bus = CUIT
      } else {
        if (!telValid || telNro.length < 8)
          throw new ClientException('No se puede verificar el número de teléfono', { telNro })

        if (!dniValid || dni.length < 6)
          throw new ClientException('No se puede verificar el número de dni', { dni })
        bus = "%${dni}_"
      }
      await queryRunner.startTransaction()

      const result = await queryRunner.query(
        `SELECT DISTINCT
        per.PersonalId, cuit2.PersonalCUITCUILCUIT AS CUIT, CONCAT(TRIM(per.PersonalApellido), ',', TRIM(per.PersonalNombre)) ApellidoNombre,
        1
        FROM Personal per
        JOIN PersonalCUITCUIL cuit2 ON cuit2.PersonalId = per.PersonalId AND cuit2.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)
        WHERE cuit2.PersonalCUITCUILCUIT LIKE @0`,
        [bus]
      )
      if (result.length == 0)
        throw new ClientException('No se pudo verificar el documento, contáctese con personal')
      if (result.length > 1)
        throw new ClientException('Se encontraron múltiples coincidencias para el DNI, contáctese con personal')
      const PersonalId = result[0].PersonalId
      const codigo = Math.floor(Math.random() * (999999 - 100000) + 100000)

      await queryRunner.query(
        `IF EXISTS(select Telefono from BotRegTelefonoPersonal where PersonalId=@0) UPDATE BotRegTelefonoPersonal SET Codigo=@1, Telefono=@2, DesDocIdent=@6, AudUsuarioMod=@3, AudIpMod=@4, AudFechaMod=@5 WHERE PersonalId=@0 ELSE INSERT INTO BotRegTelefonoPersonal (PersonalId, Codigo, Telefono, DesDocIdent, AudUsuarioIng, AudIpIng, AudFechaIng, AudUsuarioMod, AudIpMod, AudFechaMod) values(@0,@1,@2,@6,@3,@4,@5,@3,@4,@5)   `,
        [PersonalId, codigo, telNro, usuario, ip, stmactual, des_doc_ident]
      )

      await queryRunner.commitTransaction()

      botServer.runFlow(telNro, 'REGISTRO_FINAL')


      this.jsonRes({ codigo }, res);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    }
  }

  async getIdentDecode(req: any, res: Response, next: NextFunction) {
    const encryptedData = req.query.encTelNro

    const stmactual = new Date();
    const usuario = 'anon'
    const ip = this.getRemoteAddress(req)



    const queryRunner = dbServer.dataSource.createQueryRunner();

    try {

      const _key = CryptoJS.default.enc.Utf8.parse(process.env.KEY_IDENT_TEL);
      const _iv = CryptoJS.default.enc.Utf8.parse(process.env.KEY_IDENT_TEL);
      const decrypted = CryptoJS.default.AES.decrypt(
        encryptedData, _key, {
        keySize: 16,
        iv: _iv,
        mode: CryptoJS.default.mode.ECB,
        padding: CryptoJS.default.pad.Pkcs7,
        format: CryptoJS.format.Hex
      });

      const clearTextStr = decrypted.toString(CryptoJS.default.enc.Utf8)
      if (clearTextStr == '')
        throw new ClientException('El enlace proporcionado no es válido, vuelve a saludar al BOT para recibir uno nuevo')

      const dataObj = JSON.parse(clearTextStr)
      if (!dataObj.stmgen || (new Date().getTime() - Date.parse(dataObj?.stmgen)) / 1000 / 60 / 60 > this.linkVigenciaHs) {
        throw new ClientException('El enlace proporcionado expiró, vuelve a saludar al BOT para recibir uno nuevo')
      }
      const telNro = String(dataObj?.data)
      this.jsonRes({ telNro }, res);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    }
  }

  static async getPersonalSitRevista(personalId: number, anio: number, mes: number) {
    const responsables = await dbServer.dataSource.query(
      `SELECT DISTINCT sitrev.PersonalSituacionRevistaDesde, sitrev.PersonalSituacionRevistaHasta, sit.*, ISNULL(sitrev.PersonalSituacionRevistaHasta,'9999-12-31') hastafull
        FROM Personal per
        JOIN PersonalSituacionRevista sitrev ON sitrev.PersonalId = per.PersonalId AND ((DATEPART(YEAR,sitrev.PersonalSituacionRevistaDesde)=@1 AND  DATEPART(MONTH, sitrev.PersonalSituacionRevistaDesde)=@2) OR (DATEPART(YEAR,sitrev.PersonalSituacionRevistaHasta)=@1 AND  DATEPART(MONTH, sitrev.PersonalSituacionRevistaHasta)=@2) OR (sitrev.PersonalSituacionRevistaDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND ISNULL(sitrev.PersonalSituacionRevistaHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1)))
        LEFT JOIN SituacionRevista sit ON sit.SituacionRevistaId = sitrev.PersonalSituacionRevistaSituacionId
        WHERE per.PersonalId=@0
        ORDER BY sitrev.PersonalSituacionRevistaDesde, hastafull`, [personalId, anio, mes])

    return responsables
  }


  static async getCategoriasPorPersonaQuery(anio: number, mes: number, personalId: number, SucursalId: number) {
    return dbServer.dataSource.query(
      `SELECT cat.TipoAsociadoId, catrel.PersonalCategoriaCategoriaPersonalId, catrel.PersonalCategoriaPersonalId, CONCAT(cat.TipoAsociadoId, '-',catrel.PersonalCategoriaCategoriaPersonalId) AS id, catrel.PersonalCategoriaDesde, catrel.PersonalCategoriaHasta,
        TRIM(tip.TipoAsociadoDescripcion) as TipoAsociadoDescripcion ,TRIM(cat.CategoriaPersonalDescripcion) as CategoriaPersonalDescripcion ,
        TRIM(cat.CategoriaPersonalDescripcion) as fullName,
        val.ValorLiquidacionHoraNormal, val.ValorLiquidacionHorasTrabajoHoraNormal, val.ValorLiquidacionSucursalId
                  FROM PersonalCategoria catrel
                    JOIN CategoriaPersonal cat ON cat.TipoAsociadoId = catrel.PersonalCategoriaTipoAsociadoId AND cat.CategoriaPersonalId = catrel.PersonalCategoriaCategoriaPersonalId
                   JOIN TipoAsociado tip ON tip.TipoAsociadoId = cat.TipoAsociadoId
                   LEFT JOIN ValorLiquidacion val ON val.ValorLiquidacionTipoAsociadoId = cat.TipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId = cat.CategoriaPersonalId AND val.ValorLiquidacionSucursalId = @3
                   AND val.ValorLiquidacionDesde <= DATEFROMPARTS(@1,@2,1) AND ISNULL(val.ValorLiquidacionHasta,'9999-12-31')>=DATEFROMPARTS(@1,@2,1)
                WHERE ((DATEPART(YEAR,catrel.PersonalCategoriaDesde)=@1 AND  DATEPART(MONTH, catrel.PersonalCategoriaDesde)=@2) OR (DATEPART(YEAR,catrel.PersonalCategoriaHasta)=@1 AND  DATEPART(MONTH, catrel.PersonalCategoriaHasta)=@2) OR (catrel.PersonalCategoriaDesde <= DATEFROMPARTS(@1,@2,28) AND ISNULL(catrel.PersonalCategoriaHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,28))
                ) AND catrel.PersonalCategoriaPersonalId=@0`, [personalId, anio, mes, SucursalId])

  }


  static async getResponsablesListByPersonal(personalId: number) {
    return await dbServer.dataSource.query(`
        SELECT ga.GrupoActividadId, ga.GrupoActividadNumero Numero, ga.GrupoActividadDetalle Detalle,
        gap.GrupoActividadPersonalDesde Desde, gap.GrupoActividadPersonalHasta Hasta,
        gaj.GrupoActividadJerarquicoPersonalId PersonalId,
        CONCAT(TRIM(PersonalApellido),', ',TRIM(PersonalNombre)) Supervisor
        FROM GrupoActividadPersonal gap
        LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId = gap.GrupoActividadId
        LEFT JOIN GrupoActividadJerarquico gaj ON gaj.GrupoActividadId = ga.GrupoActividadId AND gaj.GrupoActividadJerarquicoComo = 'J' AND gaj.GrupoActividadJerarquicoHasta IS NULL
        LEFT JOIN Personal per ON per.PersonalId = gaj.GrupoActividadJerarquicoPersonalId
        WHERE gap.GrupoActividadPersonalPersonalId IN (@0)
        ORDER BY gap.GrupoActividadPersonalDesde DESC
      `, [personalId]
    );

  }

  static async getPersonalAdelanto(personalId: number, anio: number, mes: number) {
    return await dbServer.dataSource.query(`
      SELECT ade.PersonalId, ade.PersonalPrestamoMonto, ade.PersonalPrestamoFechaAprobacion, ade.PersonalPrestamoAplicaEl, ade.PersonalPrestamoAprobado FROM PersonalPrestamo ade
      WHERE ade.FormaPrestamoId = 7 AND ade.PersonalPrestamoAplicaEl = CONCAT(FORMAT(@2,'00'),'/',@1) 
      AND ade.PersonalId = @0
      `, [personalId, anio, mes]
    )

  }

  static async getTelefono(personalId: number) {
    return await dbServer.dataSource.query(`SELECT tel.Telefono FROM BotRegTelefonoPersonal tel WHERE tel.PersonalId IN (@0)`, [personalId])
  }



}