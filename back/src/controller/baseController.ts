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

    const grupos = await this.getGruposActividad(queryRunner, res.locals.PersonalId)
    let listGrupos = []
    for (const row of grupos)
      listGrupos.push(row.GrupoActividadId)
    
    if (listGrupos.length > 0) {
      let resPers = await queryRunner.query(`SELECT * FROM GrupoActividadPersonal gap WHERE gap.GrupoActividadPersonalPersonalId = @0 AND gap.GrupoActividadPersonalDesde <= @1 AND gap.GrupoActividadPersonalHasta >= @1 AND gap.GrupoActividadId IN(${listGrupos.join(',')})`,
        [PersonalId_auth, new Date()])
      if (resPers.length > 0)
        return true
    }

    let ObjetivoIdList = []

    let resultObjs = await queryRunner.query(
      `SELECT suc.SucursalId,
         
      obj.ObjetivoId, 
      obj.ClienteId,
      obj.ClienteElementoDependienteId,
      obj.ObjetivoDescripcion,
      
      opj.GrupoActividadObjetivoDesde,
      opj.GrupoActividadObjetivoHasta,
      1
      
      FROM Objetivo obj 
     JOIN GrupoActividadObjetivo opj ON opj.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND  opj.GrupoActividadObjetivoDesde  <= @0 AND ISNULL(opj.GrupoActividadObjetivoHasta,'9999-12-31') >= @0
      JOIN GrupoActividadJerarquico gaj ON gaj.GrupoActividadId = opj.GrupoActividadId AND  gaj.GrupoActividadJerarquicoDesde  <= @0 AND ISNULL(gaj.GrupoActividadJerarquicoHasta,'9999-12-31') >= @0
  
  
      LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
      LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
      
      LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
  
      WHERE gaj.GrupoActividadJerarquicoPersonalId=@1`,
      [fechaHastaAuth, PersonalId]
    )

    for (const row of resultObjs)
      ObjetivoIdList.push(row.ObjetivoId)

    if (ObjetivoIdList.length > 0) {
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
                
                WHERE obja.ObjetivoAsistenciaAnoAno = @1 
                AND objm.ObjetivoAsistenciaAnoMesMes = @2 
                AND obj.ObjetivoId IN (${ObjetivoIdList.join(',')}) 
                AND persona.PersonalId = @0
                `,
        [PersonalId_auth, anio, mes]
      )
      if (resultPers.length > 0) { 
        //Encontré la persona.  Tengo permiso
        return true
      }
 
    }

    return false;
  }

  async hasAuthObjetivo(anio: number, mes: number, res: any, ObjetivoId: number, queryRunner: DataSource | QueryRunner) {
    let fechaHastaAuth = new Date(anio, mes, 1);
    fechaHastaAuth.setDate(fechaHastaAuth.getDate() - 1);
    let authSucursal = false
    let authAdministrativo = false
    const PersonalId = res.locals.PersonalId

    if (PersonalId == "") return

    const grupos = await this.getGruposActividad(queryRunner, res.locals.PersonalId)
    let listGrupos = []
    for (const row of grupos)
      listGrupos.push(row.GrupoActividadId)
    
    if (listGrupos.length > 0) { 
      let resultAuth = await queryRunner.query(
        `SELECT suc.SucursalId,
           
      obj.ObjetivoId, 
      obj.ClienteId,
      obj.ClienteElementoDependienteId,
      obj.ObjetivoDescripcion,
      
      1
      
      FROM Objetivo obj 
      LEFT JOIN GrupoActividadObjetivo gao ON gao.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND gao.GrupoActividadObjetivoDesde  <= @0 AND ISNULL(gao.GrupoActividadObjetivoHasta,'9999-12-31') >= @0
      LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
      LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
      LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
      
  
      WHERE obj.ObjetivoId=@1 AND gao.GrupoActividadId IN (${listGrupos})`,
        [fechaHastaAuth, ObjetivoId]
      );
      if (resultAuth.length > 0)
        return
    }


   /*

    res.locals.groups.forEach(group => {
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
*/
    
    if (authAdministrativo) return   //Si es administrativo no analizo el CUIT    
    

    throw new ClientException(`No tiene permisos para realizar operación`)
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

  async getGruposActividad(queryRunner: any, PersonalId:number) { 
    return await queryRunner.query(
      `SELECT DISTINCT ga.GrupoActividadId, ga.GrupoActividadJerarquicoComo, 1
      FroM GrupoActividadJerarquico ga 
      WHERE ga.GrupoActividadJerarquicoPersonalId = @0
      AND @1 > ga.GrupoActividadJerarquicoDesde AND @1 <  ISNULL(ga.GrupoActividadJerarquicoHasta, '9999-12-31')`,
      [PersonalId, new Date()])
  }

}
