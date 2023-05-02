import { Response } from "express";

export class BaseController {

  /**
   * Sends the document as JSON in the body of response, and sets status to 200
   * @param recordset the Database recordset to be returned to the client as JSON
   * @param res the response object that will be used to send http response
   */
  jsonRes(recordset: any, res: Response) {
    res.status(200).json({ msg: "ok", data: recordset });
  }
  /**
   * @param err error object of any type genereated by the system
   * @param res response object to be used to to send
   * @param message custom response message to be provided to the client in a JSON body response ({error:'message'})
   * @param status custom status code, defaults to 500
   */
  errRes(err: any, res: Response, message = "error", status = 500) {

    if (process.env.DEBUG) {
      console.error(err);
    }
    res.status(status).json({ msg: message, data: [] });
  }

  async hasAuthPersona(anio, mes, persona_cuit, queryRunner) {
    let fechaHastaAuth = new Date(anio, mes, 1)
    fechaHastaAuth.setDate(fechaHastaAuth.getDate() - 1)

    let autorizado = false
    let resultAuth = await queryRunner.query(`SELECT suc.ObjetivoSucursalSucursalId,
         
    obj.ObjetivoId, 
    obj.ClienteId,
    obj.ClienteElementoDependienteId,
    obj.ObjetivoDescripcion,
    
    perjer.PersonalId,
    CONCAT(TRIM(perjer.PersonalApellido), ', ' ,TRIM(perjer.PersonalNombre) ) AS ApellidoNombreJerarquico,
    cuit.PersonalCUITCUILCUIT,
    -- obj.ObjetivoSucursalUltNro,
    opj.ObjetivoPersonalJerarquicoDesde,
    opj.ObjetivoPersonalJerarquicoHasta,
    opj.ObjetivoPersonalJerarquicoComo,
    1
    
    FROM Objetivo obj 
    LEFT JOIN ObjetivoSucursal suc ON suc.ObjetivoId = obj.ObjetivoId AND suc.ObjetivoSucursalId = obj.ObjetivoSucursalUltNro
    LEFT JOIN ObjetivoPersonalJerarquico opj ON opj.ObjetivoId = obj.ObjetivoId AND  opj.ObjetivoPersonalJerarquicoDesde  <= @0 AND ISNULL(opj.ObjetivoPersonalJerarquicoHasta,'9999-12-31') >= @0
    LEFT JOIN Personal perjer ON perjer.PersonalId = opj.ObjetivoPersonalJerarquicoPersonalId
    LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = perjer.PersonalId AND cuit.PersonalCUITCUILId = perjer.PersonalCUITCUILUltNro

    WHERE obj.ObjetivoId=@1`,
      [fechaHastaAuth])

    for (let row of resultAuth) {
      if (row.PersonalCUITCUILCUIT == persona_cuit) {
        return true
      }
    }

    return false
  }


  async hasAuthObjetivo(anio, mes, persona_cuit, ObjetivoId, queryRunner) {
    let fechaHastaAuth = new Date(anio, mes, 1)
    fechaHastaAuth.setDate(fechaHastaAuth.getDate() - 1)

    let autorizado = false
    let resultAuth = await queryRunner.query(`SELECT suc.ObjetivoSucursalSucursalId,
         
    obj.ObjetivoId, 
    obj.ClienteId,
    obj.ClienteElementoDependienteId,
    obj.ObjetivoDescripcion,
    
    perjer.PersonalId,
    CONCAT(TRIM(perjer.PersonalApellido), ', ' ,TRIM(perjer.PersonalNombre) ) AS ApellidoNombreJerarquico,
    cuit.PersonalCUITCUILCUIT,
    -- obj.ObjetivoSucursalUltNro,
    opj.ObjetivoPersonalJerarquicoDesde,
    opj.ObjetivoPersonalJerarquicoHasta,
    opj.ObjetivoPersonalJerarquicoComo,
    1
    
    FROM Objetivo obj 
    LEFT JOIN ObjetivoSucursal suc ON suc.ObjetivoId = obj.ObjetivoId AND suc.ObjetivoSucursalId = obj.ObjetivoSucursalUltNro
    LEFT JOIN ObjetivoPersonalJerarquico opj ON opj.ObjetivoId = obj.ObjetivoId AND  opj.ObjetivoPersonalJerarquicoDesde  <= @0 AND ISNULL(opj.ObjetivoPersonalJerarquicoHasta,'9999-12-31') >= @0
    LEFT JOIN Personal perjer ON perjer.PersonalId = opj.ObjetivoPersonalJerarquicoPersonalId
    LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = perjer.PersonalId AND cuit.PersonalCUITCUILId = perjer.PersonalCUITCUILUltNro

    WHERE obj.ObjetivoId=@1`,
      [fechaHastaAuth, ObjetivoId])

    for (let row of resultAuth) {
      if (row.PersonalCUITCUILCUIT == persona_cuit) {
        return true
      }
    }

    return false
  }


}
