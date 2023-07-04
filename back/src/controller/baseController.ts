import { Response } from "express";
import { DataSource, QueryRunner } from "typeorm";

export class BaseController {
  /**
   * Sends the document as JSON in the body of response, and sets status to 200
   * @param recordset the Database recordset to be returned to the client as JSON
   * @param res the response object that will be used to send http response
   */
  jsonRes(recordset: any, res: Response, msg = "ok") {
    const stopTime = performance.now()
    res.status(200).json({ msg: msg, data: recordset, stamp: new Date(), ms: stopTime-res.locals.startTime});
  }

  jsonResDirect(data: any, res: Response, msg = "ok") {
    res.status(200).json(data);
  }
  /**
   * @param err error object of any type genereated by the system
   * @param res response object to be used to to send
   * @param message custom response message to be provided to the client in a JSON body response ({error:'message'})
   * @param status custom status code, defaults to 500
   */
  errRes(
    err: any,
    res: Response,
    message = "No se pudo conectar a la base de datos.",
    status = 500
  ) {
    const stopTime = performance.now()
    if (process.env.DEBUG) {
      console.error(err);
    }
    res.status(status).json({ msg: message, data: [], stamp: new Date(), ms: stopTime-res.locals.startTime});
  }

  async hasAuthPersona(anio, mes, persona_cuit, queryRunner) {
    let fechaHastaAuth = new Date(anio, mes, 1);
    fechaHastaAuth.setDate(fechaHastaAuth.getDate() - 1);

    let autorizado = false;
    let resultAuth = await queryRunner.query(
      `SELECT suc.SucursalId,
         
    obj.ObjetivoId, 
    obj.ClienteId,
    obj.ClienteElementoDependienteId,
    obj.ObjetivoDescripcion,
    
    perjer.PersonalId,
    CONCAT(TRIM(perjer.PersonalApellido), ', ' ,TRIM(perjer.PersonalNombre) ) AS ApellidoNombreJerarquico,
    cuit.PersonalCUITCUILCUIT,
    opj.ObjetivoPersonalJerarquicoDesde,
    opj.ObjetivoPersonalJerarquicoHasta,
    opj.ObjetivoPersonalJerarquicoComo,
    1
    
    FROM Objetivo obj 
    LEFT JOIN ObjetivoPersonalJerarquico opj ON opj.ObjetivoId = obj.ObjetivoId AND  opj.ObjetivoPersonalJerarquicoDesde  <= @0 AND ISNULL(opj.ObjetivoPersonalJerarquicoHasta,'9999-12-31') >= @0
    LEFT JOIN Personal perjer ON perjer.PersonalId = opj.ObjetivoPersonalJerarquicoPersonalId
    LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = perjer.PersonalId AND cuit.PersonalCUITCUILId = perjer.PersonalCUITCUILUltNro

    LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
    LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
    
    LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)

    WHERE obj.ObjetivoId=@1`,
      [fechaHastaAuth]
    );

    for (let row of resultAuth) {
      if (row.PersonalCUITCUILCUIT == persona_cuit) {
        return true;
      }
    }

    return false;
  }

  async hasAuthObjetivo(anio: number, mes: number, req: any, ObjetivoId: number, queryRunner: DataSource | QueryRunner) {
    let fechaHastaAuth = new Date(anio, mes, 1);
    fechaHastaAuth.setDate(fechaHastaAuth.getDate() - 1);
    let authSucursal = false

    if (req.persona_cuit == "") return

    let resultAuth = await queryRunner.query(
      `SELECT suc.SucursalId,
         
    obj.ObjetivoId, 
    obj.ClienteId,
    obj.ClienteElementoDependienteId,
    obj.ObjetivoDescripcion,
    
    perjer.PersonalId,
    CONCAT(TRIM(perjer.PersonalApellido), ', ' ,TRIM(perjer.PersonalNombre) ) AS ApellidoNombreJerarquico,
    cuit.PersonalCUITCUILCUIT,
    opj.ObjetivoPersonalJerarquicoDesde,
    opj.ObjetivoPersonalJerarquicoHasta,
    opj.ObjetivoPersonalJerarquicoComo,
    1
    
    FROM Objetivo obj 
    LEFT JOIN ObjetivoPersonalJerarquico opj ON opj.ObjetivoId = obj.ObjetivoId AND  opj.ObjetivoPersonalJerarquicoDesde  <= @0 AND ISNULL(opj.ObjetivoPersonalJerarquicoHasta,'9999-12-31') >= @0
    LEFT JOIN Personal perjer ON perjer.PersonalId = opj.ObjetivoPersonalJerarquicoPersonalId
    LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = perjer.PersonalId AND cuit.PersonalCUITCUILId = perjer.PersonalCUITCUILUltNro

    LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
    LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
    LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
    

    WHERE obj.ObjetivoId=@1`,
      [fechaHastaAuth, ObjetivoId]
    );
    const SucursalId = (resultAuth.length > 0) ? resultAuth[0].SucursalId : 0




    req.groups.forEach(group => {
      switch (SucursalId) {
        case 0: //Sin sucursal
          authSucursal = true;
          break;
        case 1:  //Central
          if (group.indexOf("CENTRAL")!=-1)
            authSucursal = true;
          break;
        case 2: //Formosa
          if (group.indexOf("FORMOSA")!=-1)
            authSucursal = true;
          break;
        case 3: //MDQ
          if (group.indexOf("MDQ")!=-1)
            authSucursal = true;
          break;

        default:
          break;
      }

    })

    authSucursal = true;
    if (!authSucursal)
      throw `No tiene permisos para realizar operación en la sucursal ${SucursalId}`;

    for (let row of resultAuth) {
      if (row.PersonalCUITCUILCUIT == req.persona_cuit) {
        return true;
      }
    }

    throw `No tiene permisos para realizar operación identificado con CUIT ${req.persona_cuit}`;
    return false;
  }
}
