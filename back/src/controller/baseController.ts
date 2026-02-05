import { NextFunction, Response } from "express";
import { stringify } from "node:querystring";
import { DataSource, QueryRunner } from "typeorm";

export class ClientException extends Error {
  messageArr: string[]
  constructor(message: string | string[], public extended: any = '', public code: number = 0) {
    if (message instanceof Array) {
      super(message.join(', '))
      this.messageArr = message
    } else {
      super(message)
      this.messageArr = [message]
    }
    this.name = "ClientException";
    if (extended)
      this.stack += "\nExtra: " + extended
  }
}

export class ClientWarning extends Error {
  messageArr: string[];

  constructor(
    message: string | string[],
    public extended: any = '',
    public code: number = 0
  ) {
    if (message instanceof Array) {
      super(message.join(', '));
      this.messageArr = message;
    } else {
      super(message);
      this.messageArr = [message];
    }

    this.name = "ClientWarning";

    if (extended) {
      this.stack += "\nExtra: " + extended;
    }
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
    res.status(200).json({ msg: msg, data: recordset, stamp: new Date(), ms: res.locals.stopTime - res.locals.startTime });
  }

  jsonResDirect(data: any, res: Response, msg = "ok") {
    res.status(200).json(data);
  }

  getRemoteAddress(req: any) {
    if (req?.headers)
      return req.headers['x-origin-ip'] ??
        (req.headers['x-forwarded-for'] as string)?.split(',')[0] ??
        req.socket.remoteAddress
    else
      return '127.0.0.1'
  }


  currencyPipe = Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  dateFormatter = new Intl.DateTimeFormat('es-AR', { year: 'numeric', month: 'numeric', day: 'numeric' });

  dateOutputFormat(date: Date, defaultText = 'sin fecha') {
    if (!date || date.getFullYear() == 9999) return defaultText
    return this.dateFormatter.format(date)
  }



  async hasGroup(req: any, group: string) {
    let inGroup = false
    if (req?.groups) {
      for (const rowgroup of req?.groups) {
        if (rowgroup.toLowerCase() === group.toLowerCase())
          inGroup = true
      }
    }
    return (inGroup) ? true : false
  }

  static async hasGroup(req: any, group: string) {
    let inGroup = false
    if (req?.groups) {
      for (const rowgroup of req?.groups) {
        if (rowgroup.toLowerCase() === group.toLowerCase())
          inGroup = true
      }
    }
    return (inGroup) ? true : false
  }



  async getUsuarioId(res: any, queryRunner: QueryRunner) {
    if (res.locals.PersonalId == 0) {
      const usuario = await queryRunner.query(`SELECT UsuarioId FROM Usuario WHERE UsuarioNombre =@0`, [res.locals.userName])
      if (usuario.length > 0)
        return usuario[0].UsuarioId
    }
    return null
  }


  async hasAuthPersona(res: any, anio: number, mes: number, PersonalId_auth: number, queryRunner: QueryRunner) {

    let fechaHastaAuth = new Date(anio, mes, 1);
    fechaHastaAuth.setDate(fechaHastaAuth.getDate() - 1);
    const PersonalId = res.locals.PersonalId
    if (PersonalId == PersonalId_auth)
      return true
    if (PersonalId < 1) {
      return false
    }

    const grupos = await BaseController.getGruposActividad(queryRunner, res.locals.PersonalId, anio, mes)
    let listGrupos = []
    for (const row of grupos)
      listGrupos.push(row.GrupoActividadId)
    if (listGrupos.length > 0) {
      let resPers = await queryRunner.query(`
      SELECT gap.GrupoActividadPersonalPersonalId FROM GrupoActividadPersonal gap 
      WHERE gap.GrupoActividadPersonalPersonalId = @0  AND gap.GrupoActividadPersonalDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND
      ISNULL(gap.GrupoActividadPersonalHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1) AND gap.GrupoActividadId IN (${listGrupos.join(',')})
      UNION
      SELECT gap.GrupoActividadJerarquicoPersonalId FROM GrupoActividadJerarquico gap 
      WHERE gap.GrupoActividadJerarquicoPersonalId = @0  AND gap.GrupoActividadJerarquicoDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND
      ISNULL(gap.GrupoActividadJerarquicoHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1) AND gap.GrupoActividadId IN (${listGrupos.join(',')})
      AND gap.GrupoActividadJerarquicoComo = 'J'
      `,
        [PersonalId_auth, anio, mes])
      if (resPers.length > 0)
        return true
    }
    let ObjetivoIdList = []

    let resultObjs = await queryRunner.query(
      `SELECT suc.SucursalId,
         
      obj.ObjetivoId, 
      obj.ClienteId,
      obj.ClienteElementoDependienteId,
      clidep.ClienteElementoDependienteDescripcion,
      
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

  getTimeString(stm: Date) {
    return (stm) ? `${stm.getHours().toString().padStart(2, '0')}:${stm.getMinutes().toString().padStart(2, '0')}:${stm.getSeconds().toString().padStart(2, '0')}` : null
  }

  async hasAuthObjetivo(anio: number, mes: number, res: any, ObjetivoId: number, queryRunner: DataSource | QueryRunner) {
    let fechaHastaAuth = new Date(anio, mes, 1);
    fechaHastaAuth.setDate(fechaHastaAuth.getDate() - 1);
    let authSucursal = false
    let authAdministrativo = false
    const PersonalId = res.locals.PersonalId

    if (PersonalId == "") return false

    const grupos = await BaseController.getGruposActividad(queryRunner, res.locals.PersonalId, anio, mes)
    let listGrupos = []
    for (const row of grupos)
      listGrupos.push(row.GrupoActividadId)


    if (listGrupos.length > 0) {
      let resultAuth = await queryRunner.query(
        `SELECT suc.SucursalId,
           
      obj.ObjetivoId, 
      obj.ClienteId,
      obj.ClienteElementoDependienteId,
      clidep.ClienteElementoDependienteDescripcion,
      
      1
      
      FROM Objetivo obj 
      LEFT JOIN GrupoActividadObjetivo gao ON gao.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND gao.GrupoActividadObjetivoDesde  <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND ISNULL(gao.GrupoActividadObjetivoHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1)
      LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
      LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
      LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
      
  
      WHERE obj.ObjetivoId=@0 AND gao.GrupoActividadId IN (${listGrupos})`,
        [ObjetivoId, anio, mes, fechaHastaAuth]
      );


      if (resultAuth.length > 0)
        return true
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

    if (authAdministrativo) return true  //Si es administrativo no analizo el CUIT    

    return false
  }
  async hasAuthCargaDirecta(anio: number, mes: number, res: any, ObjetivoId: number, queryRunner: DataSource | QueryRunner) {

    const PersonalId = res.locals.PersonalId

    if (PersonalId == "") return false

    let resultAuth = await queryRunner.query(
      `SELECT aut.* FROM lige.dbo.percargadirecta aut 
        WHERE aut.persona_id = @0 AND aut.objetivo_id = @1`,
      [PersonalId, ObjetivoId]
    );

    if (resultAuth.length > 0)
      return true

    return false
  }


  static async getProxNumero(queryRunner: any, NumeradorCodigo: String, usuario: string, ip: string) {
    const fechaActual = new Date()
    let DenNumero = 1
    const numerador = await queryRunner.query('SELECT DenNumero FROM GenNumerador WHERE NumeradorCodigo=@0', [NumeradorCodigo])
    if (numerador.length == 0) {
      await queryRunner.query(`INSERT INTO GenNumerador (NumeradorCodigo,DenNumero,AudUsuarioIng,AudIpIng,AudFechaIng,AudUsuarioMod,AudIpMod,AudFechaMod) 
      VALUES(@0,@1,@2,@3,@4,@5,@6,@7)`, [NumeradorCodigo, DenNumero, usuario, ip, fechaActual, usuario, ip, fechaActual])
    } else {
      DenNumero = numerador[0]['DenNumero'] + 1
      await queryRunner.query(`UPDATE GenNumerador SET DenNumero=@1, AudUsuarioMod=@2,AudIpMod=@3,AudFechaMod=@4 WHERE NumeradorCodigo=@0`,
        [NumeradorCodigo, DenNumero, usuario, ip, fechaActual])
    }
    return DenNumero
  }

  static async getGruposActividad(queryRunner: any, PersonalId: number, anio: number, mes: number) {
    return await queryRunner.query(
      `SELECT DISTINCT gaj.GrupoActividadId, gaj.GrupoActividadJerarquicoComo, ga.GrupoActividadNumero, 1
      FROM GrupoActividadJerarquico gaj
      left join GrupoActividad ga on ga.GrupoActividadId = gaj.GrupoActividadId
      WHERE gaj.GrupoActividadJerarquicoPersonalId = @0
      AND EOMONTh(DATEFROMPARTS(@1,@2,1)) >=   gaj.GrupoActividadJerarquicoDesde  AND DATEFROMPARTS(@1,@2,1) <=  ISNULL(gaj.GrupoActividadJerarquicoHasta,'9999-12-31')`,
      [PersonalId, anio, mes])
  }

  async rollbackTransaction(queryRunner: QueryRunner) {
    try {
      if (queryRunner.isTransactionActive)
        await queryRunner.rollbackTransaction()
    } catch (error2) {
      return Promise.resolve()
    }
  }

  static isEmpty(value: any) {
    return (value == null || (typeof value === "string" && value.trim().length === 0));
  }

  // TODO: FUNCION QUE HAGA INSERT DE DATOS EN TABLA DE REGISTROS DE PROCESOS AUTOMATICOS
  async procesoAutomaticoLogInicio(queryRunner: QueryRunner, NombreProceso: string, ParametroEntrada: object, usuario: string, ip: string) {
    if (queryRunner.isTransactionActive) throw new Error('No se puede iniciar procesoAutomaticoLogInicio dentro de una transacción activa')

    await queryRunner.startTransaction();
    const fechaActual = new Date()
    const ProcesoAutomaticoLogCodigo = await BaseController.getProxNumero(queryRunner, `ProcesoAutomaticoLog`, usuario, ip)
    const EstadoCod = 'EJE'

    await queryRunner.query(
      `INSERT INTO ProcesoAutomaticoLog (
      ProcesoAutomaticoLogCodigo,
      NombreProceso,
      FechaInicio,
      FechaFin,
      ProcesoAutomaticoEstadoCod,
      ParametroEntrada,
      Resultado,
      AudFechaIng,
      AudUsuarioIng,
      AudIpIng,
      AudFechaMod,
      AudUsuarioMod,
      AudIpMod

    ) VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @7, @8, @9)`,
      [
        ProcesoAutomaticoLogCodigo,
        NombreProceso,
        fechaActual,
        null,
        EstadoCod,
        JSON.stringify(ParametroEntrada),
        null,
        fechaActual,
        usuario,
        ip
      ]
    );
    await queryRunner.commitTransaction();
    return { ProcesoAutomaticoLogCodigo }
  }

  async procesoAutomaticoLogFin(queryRunner: QueryRunner, ProcesoAutomaticoLogCodigo: number, EstadoCod: string, Resultado: object, usuario: string, ip: string) {
    const fechaActual = new Date()
    if (queryRunner.isTransactionActive) throw new Error('No se puede iniciar procesoAutomaticoLogFin dentro de una transacción activa')
    await queryRunner.startTransaction();

    await queryRunner.query(
      `UPDATE ProcesoAutomaticoLog SET FechaFin=@1,
      ProcesoAutomaticoEstadoCod=@2,
      Resultado=@3,
      AudFechaMod=@4,
      AudUsuarioMod=@5,
      AudIpMod=@6
      WHERE ProcesoAutomaticoLogCodigo=@0`,
      [
        ProcesoAutomaticoLogCodigo,
        fechaActual,
        EstadoCod,
        JSON.stringify(Resultado),
        fechaActual,
        usuario,
        ip
      ]
    );
    await queryRunner.commitTransaction();
    return { ProcesoAutomaticoLogCodigo }
  }

}

