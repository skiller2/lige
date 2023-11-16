import { NextFunction, Response } from "express";
import { DataSource, QueryRunner } from "typeorm";

export class ClientException extends Error {
  constructor(message: string, public extended: any = '') {
    super(message);
    this.name = "ClientException";
    if (extended)
      this.stack += "\nExtra: "+extended  
  }
  
}


export class BaseController {
  /**
   * Sends the document as JSON in the body of response, and sets status to 200
   * @param recordset the Database recordset to be returned to the client as JSON
   * @param res the response object that will be used to send http response
   */
  jsonRes(recordset: any, res: Response, msg = "ok") {
    res.locals.stopTime = performance.now()
    res.status(200).json({ msg: msg, data: recordset, stamp: new Date(), ms: res.locals.stopTime-res.locals.startTime});
  }

  jsonResDirect(data: any, res: Response, msg = "ok") {
    res.status(200).json(data);
  }

  getRemoteAddress(req:any) { 
    return req.headers['x-origin-ip'] ??
			(req.headers['x-forwarded-for'] as string)?.split(',')[0] ??
			req.socket.remoteAddress
  }

  async hasGroup(req:any,group:string) { 
    let inGroup = false
    if (req?.groups) {
      for (const rowgroup of req?.groups) {
        if (rowgroup.toLowerCase().indexOf(group.toLowerCase()) != -1)
          inGroup = true
      }
    }
    return (inGroup) ? true:false 
  }

  async hasAuthPersona(res:any, anio:number, mes:number, PersonalId_auth:number, queryRunner:QueryRunner) {
    let fechaHastaAuth = new Date(anio, mes, 1);
    fechaHastaAuth.setDate(fechaHastaAuth.getDate() - 1);
    const PersonalId = res.locals.PersonalId
    if (PersonalId == PersonalId_auth)
      return true

    if (PersonalId < 1) { 
      return false
    }

    let ObjetivoIdList = []

    let resultObjs = await queryRunner.query(
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
    LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = perjer.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = perjer.PersonalId) 


    LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
    LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
    
    LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)

    WHERE opj.ObjetivoPersonalJerarquicoPersonalId=@1`,
      [fechaHastaAuth, PersonalId]
    )

    for (const row of resultObjs)
      ObjetivoIdList.push(row.ObjetivoId)

   
    //Busco si la persona está en un objetivo
    let resultPers = await queryRunner.query(
      `
    SELECT DISTINCT 
                persona.PersonalId,
                1 as last
                FROM ObjetivoAsistenciaAnoMesPersonalDias objd
                JOIN ObjetivoAsistenciaAnoMes objm ON objm.ObjetivoAsistenciaAnoMesId = objd.ObjetivoAsistenciaAnoMesId AND objm.ObjetivoAsistenciaAnoId = objd.ObjetivoAsistenciaAnoId AND objm.ObjetivoId = objd.ObjetivoId
                JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objm.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objm.ObjetivoId
                JOIN Objetivo obj ON obj.ObjetivoId = obja.ObjetivoId
                JOIN Personal persona ON persona.PersonalId = objd.ObjetivoAsistenciaMesPersonalId
                LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = persona.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = persona.PersonalId) 
                JOIN CategoriaPersonal cat ON cat.CategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId AND cat.TipoAsociadoId=objd.ObjetivoAsistenciaTipoAsociadoId
                
                LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
                LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
                
                
                LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
                
                LEFT JOIN ValorLiquidacion val ON val.ValorLiquidacionSucursalId = suc.SucursalId AND val.ValorLiquidacionTipoAsociadoId = objd.ObjetivoAsistenciaTipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId AND 
                
                DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,1)BETWEEN 
                    val.ValorLiquidacionDesde AND ISNULL(val.ValorLiquidacionHasta,'9999-12-31')
                
                LEFT JOIN ObjetivoPersonalJerarquico opj ON opj.ObjetivoId = obj.ObjetivoId AND  DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'28')  BETWEEN opj.ObjetivoPersonalJerarquicoDesde  AND ISNULL(opj.ObjetivoPersonalJerarquicoHasta,'9999-12-31') AND opj.ObjetivoPersonalJerarquicoComo = 'J'
                LEFT JOIN Personal perjer ON perjer.PersonalId = opj.ObjetivoPersonalJerarquicoPersonalId
                
                LEFT JOIN PersonalArt14 art14S ON art14S.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14S.PersonalId = objd.ObjetivoAsistenciaMesPersonalId   AND art14S.PersonalArt14FormaArt14 = 'S' AND art14S.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') >= art14S.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14S.PersonalArt14AutorizadoHasta OR art14S.PersonalArt14AutorizadoHasta IS NULL) AND  ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14S.PersonalArt14Anulacion   OR art14S.PersonalArt14Anulacion IS NULL)
                LEFT JOIN PersonalArt14 art14E ON art14E.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14E.PersonalId = objd.ObjetivoAsistenciaMesPersonalId   AND art14E.PersonalArt14FormaArt14 = 'E' AND art14E.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') >= art14E.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14E.PersonalArt14AutorizadoHasta OR art14E.PersonalArt14AutorizadoHasta IS NULL) AND  ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14E.PersonalArt14Anulacion   OR art14E.PersonalArt14Anulacion IS NULL)
                LEFT JOIN PersonalArt14 art14H ON art14H.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14H.PersonalId = objd.ObjetivoAsistenciaMesPersonalId   AND art14H.PersonalArt14FormaArt14 = 'H' AND art14H.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') >= art14H.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14H.PersonalArt14AutorizadoHasta OR art14H.PersonalArt14AutorizadoHasta IS NULL) AND  ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14H.PersonalArt14Anulacion   OR art14H.PersonalArt14Anulacion IS NULL)
                LEFT JOIN PersonalArt14 art14A ON art14A.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14A.PersonalId = objd.ObjetivoAsistenciaMesPersonalId   AND art14A.PersonalArt14FormaArt14 = 'A' AND art14A.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') >= art14A.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14A.PersonalArt14AutorizadoHasta OR art14A.PersonalArt14AutorizadoHasta IS NULL) AND  ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') < art14A.PersonalArt14Anulacion   OR art14A.PersonalArt14Anulacion IS NULL)
                
                LEFT JOIN ValorLiquidacion valart14cat ON valart14cat.ValorLiquidacionSucursalId = suc.SucursalId AND valart14cat.ValorLiquidacionTipoAsociadoId = art14E.PersonalArt14TipoAsociadoId AND valart14cat.ValorLiquidacionCategoriaPersonalId = art14E.PersonalArt14CategoriaId AND 
                DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,1)BETWEEN 
                valart14cat.ValorLiquidacionDesde AND ISNULL(valart14cat.ValorLiquidacionHasta,'9999-12-31')
                
                LEFT JOIN CategoriaPersonal art14cat ON art14cat.TipoAsociadoId = art14E.PersonalArt14TipoAsociadoId AND art14cat.CategoriaPersonalId  = art14E.PersonalArt14CategoriaId 
                LEFT JOIN ObjetivoHabilitacion objhab ON objhab.ObjetivoHabilitacionObjetivoId = obj.ObjetivoId
                
                WHERE obja.ObjetivoAsistenciaAnoAno = @1 
                AND objm.ObjetivoAsistenciaAnoMesMes = @2 
                AND obj.ObjetivoId IN (${ObjetivoIdList.join(',')}) 
                AND persona.PersonalId = @0
                `,
        [PersonalId_auth,anio, mes]
      )
    if (resultPers.length > 0) { 
      //Encontré la persona.  Tengo permiso
      return true
    }

    let resultPers2 = await queryRunner.query(
      `    
    SELECT DISTINCT 
        perrel.OperacionesPersonalAAsignarPersonalId,
        CONCAT(TRIM(per.PersonalApellido), ',', TRIM(per.PersonalNombre)) ApellidoNombre, 
        perrel.PersonalCategoriaPersonalId,
        CONCAT(TRIM(perjer.PersonalApellido), ', ',TRIM(perjer.PersonalNombre)) ApellidoNombreJ, 
        1
        FroM OperacionesPersonalAsignarAJerarquico perrel 

        JOIN Personal perjer ON perjer.PersonalId = perrel.PersonalCategoriaPersonalId
        
        JOIN Personal per ON per.PersonalId = perrel.OperacionesPersonalAAsignarPersonalId
       
        
        WHERE DATEFROMPARTS(@1,@2,28) > perrel.OperacionesPersonalAsignarAJerarquicoDesde AND DATEFROMPARTS(@1,@2,1) <  ISNULL(perrel.OperacionesPersonalAsignarAJerarquicoHasta, '9999-12-31')
        AND perrel.OperacionesPersonalAAsignarPersonalId=@0 AND    perrel.PersonalCategoriaPersonalId=@3`,
      [PersonalId_auth, anio, mes, PersonalId])
    
      if (resultPers2.length > 0) { 
        //Encontré la persona.  Tengo permiso
        return true
      }
    
    return false;
  }

  async hasAuthObjetivo(anio: number, mes: number, req: any, ObjetivoId: number, queryRunner: DataSource | QueryRunner) {
    let fechaHastaAuth = new Date(anio, mes, 1);
    fechaHastaAuth.setDate(fechaHastaAuth.getDate() - 1);
    let authSucursal = false
    let authAdministrativo = false

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
    LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = perjer.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = perjer.PersonalId) 

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
      if (group.indexOf("Administrativo")!=-1)
        authAdministrativo = true;
    })

    authSucursal = true;
    if (!authSucursal)
      throw new ClientException(`No tiene permisos para realizar operación en la sucursal ${SucursalId}`)

    
    if (authAdministrativo) return   //Si es administrativo no analizo el CUIT    
    
    for (let row of resultAuth) {
      if (row.PersonalCUITCUILCUIT == req.persona_cuit) {
        return
      }
    }

    throw new ClientException(`No tiene permisos para realizar operación identificado con CUIT ${req.persona_cuit}`)
  }


  async getProxNumero(queryRunner: any, den_numerador: String, usuario: string, ip: string) {
    const fechaActual = new Date()
    let den_numero = 1
    const numerador = await queryRunner.query('SELECT den_numero FROM lige.dbo.genmanumerador WHERE den_numerador=@0', [den_numerador])
    if (numerador.length == 0) {
      await queryRunner.query(`INSERT INTO lige.dbo.genmanumerador (den_numerador,den_numero,aud_usuario_ins,aud_ip_ins,aud_fecha_ins,aud_usuario_mod,aud_ip_mod,aud_fecha_mod) 
      VALUES(@0,@1,@2,@3,@4,@5,@6,@7)`, [den_numerador, den_numero, usuario, ip, fechaActual, usuario, ip, fechaActual])
    } else {
      den_numero = numerador[0]['den_numero'] + 1
      await queryRunner.query(`UPDATE lige.dbo.genmanumerador SET den_numero=@1, aud_usuario_mod=@2,aud_ip_mod=@3,aud_fecha_mod=@4 WHERE den_numerador=@0`,
        [den_numerador, den_numero, usuario, ip, fechaActual])
    }
    return den_numero
  }

}
