import { NextFunction, Response, query } from "express";
import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { QueryRunner } from "typeorm";
import { ObjetivoController } from "./objetivo.controller";
import { filtrosToSql, orderToSQL } from "src/impuestos-afip/filtros-utils/filtros";
import { CustodiaController } from "./custodia.controller";
import CryptoJS from "crypto-js";
import { float } from "@zxing/library/esm/customTypings";
import * as fs from 'fs';
import { ObjetivosPendasisController } from "src/objetivos-pendasis/objetivos-pendasis.controller";
import { AccesoBotController } from "src/acceso-bot/acceso-bot.controller";
import { FileUploadController } from "./file-upload.controller";
import { fileUploadController } from "./controller.module";

interface DigestAuthOptions {
  username: string;
  password: string;
  method: string;
  uri: string;
  realm: string;
  nonce: string;
  qop: string;
  nc: number;
  cnonce: string;
}


class ClientExceptionArt14 extends ClientException {
  constructor(metodo: string) {
    const etiqueta = AsistenciaController.getMetodologias().find(val => val.metodo == metodo).etiqueta
    super(`Existe una excepción ${etiqueta} para la persona`);
  }
}

const columnasPersonalxResponsable: any[] = [
  {
    name: "CUIT",
    id: "PersonalCUITCUILCUIT",
    field: "PersonalCUITCUILCUIT",
    fieldName: "cuit.PersonalCUITCUILCUIT",
    type: "number",
    sortable: true,
    minWidth: 100,
    maxWidth: 100
  },
  {
    name: "PersonalId",
    id: "PersonalId",
    field: "PersonalId",
    fieldName: "per.PersonalId",
    type: "number",
    sortable: true,
    hidden: true
  },
  {
    name: "Apellido Nombre",
    type: "string",
    id: "PersonaDes",
    field: "PersonaDes",
    fieldName: "PersonaDes",
    sortable: true,
    customTooltip: {
      useRegularTooltip: true, // note regular tooltip will try to find a "title" attribute in the cell formatter (it won't work without a cell formatter)
    },
  },
  {
    name: "Ingresos",
    type: "currency",
    id: "ingresosG_importe",
    field: "ingresosG_importe",
    fieldName: "ingresosG_importe",
    sortable: true,
  },
  {
    name: "Horas",
    type: "number",
    id: "ingresos_horas",
    field: "ingresos_horas",
    fieldName: "ingresos_horas",
    sortable: true,
    minWidth: 50,
    maxWidth: 50
  },
  {
    name: "Descuentos",
    type: "currency",
    id: "egresosG_importe",
    field: "egresosG_importe",
    fieldName: "egresosG_importe",
    sortable: true,
    hidden: false
  },
  {
    name: "Retiro",
    type: "currency",
    id: "retiroG_importe",
    field: "retiroG_importe",
    fieldName: "retiroG_importe",
    sortable: true,
    hidden: false
  },
  {
    name: "BOT Lince",
    type: "string",
    id: "det_status_bot",
    field: "det_status_bot",
    fieldName: "det_status_bot",
    sortable: true,
  },
  {
    name: "Situación Revista",
    type: "string",
    id: "SituacionRevistaDescripcion",
    field: "SituacionRevistaDescripcion",
    fieldName: "SituacionRevistaDescripcion",
    sortable: true,
  },
  {
    name: "Desde",
    type: "date",
    id: "PersonalSituacionRevistaDesde",
    field: "PersonalSituacionRevistaDesde",
    fieldName: "PersonalSituacionRevistaDesde",
    sortable: true,
  },
];

const columnasPersonalxResponsableDesc: any[] = [
  {
    name: "CUIT",
    id: "PersonalCUITCUILCUIT",
    field: "PersonalCUITCUILCUIT",
    fieldName: "cuit.PersonalCUITCUILCUIT",
    type: "number",
    sortable: true,

  },
  {
    name: "PersonalId",
    id: "PersonalId",
    field: "PersonalId",
    fieldName: "per.PersonalId",
    type: "number",
    sortable: true,
    hidden: true
  },
  {
    name: "Apellido Nombre",
    type: "string",
    id: "ApellidoNombre",
    field: "ApellidoNombre",
    fieldName: "ApellidoNombre",
    sortable: true,
    customTooltip: {
      useRegularTooltip: true, // note regular tooltip will try to find a "title" attribute in the cell formatter (it won't work without a cell formatter)
    },
  },
  {
    name: "Tipo",
    type: "string",
    id: "tipomov",
    field: "tipomov",
    fieldName: "tipomov",
    sortable: true,
    customTooltip: {
      useRegularTooltip: true, // note regular tooltip will try to find a "title" attribute in the cell formatter (it won't work without a cell formatter)
    },
  },
  {
    name: "Cuenta",
    type: "string",
    id: "tipocuenta_id",
    field: "tipocuenta_id",
    fieldName: "tipocuenta_id",
    sortable: true,
  },
  {
    name: "Detalle",
    type: "string",
    id: "desmovimiento",
    field: "desmovimiento",
    fieldName: "desmovimiento",
    sortable: true,
    customTooltip: {
      useRegularTooltip: true, // note regular tooltip will try to find a "title" attribute in the cell formatter (it won't work without a cell formatter)
    },
  },

  {
    name: "Importe",
    type: "currency",
    id: "importe",
    field: "importe",
    fieldName: "importe",
    sortable: false,
    hidden: false
  },

];

export class AsistenciaController extends BaseController {
  async setHorasFacturacion(req: any, res: Response, next: NextFunction) {
    const {
      anio,
      mes,
      ObjetivoId,
      TotalHoraA,
      TotalHoraB,
      Observaciones
    } = req.body

    const queryRunner = dataSource.createQueryRunner();
    const usuario = res.locals.userName
    const ip = this.getRemoteAddress(req)
    const fechaActual = new Date()


    try {
      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasAuthObjetivo(anio, mes, res, Number(ObjetivoId), queryRunner))
        throw new ClientException(`No tiene permisos para cargar valores de facturación`)

      await queryRunner.startTransaction()

      const objetivo = await queryRunner.query(
        `SELECT val.TotalHoraA, val.TotalHoraB, val.ImporteHoraA, val.ImporteHoraB, obj.ClienteElementoDependienteId, obj.ClienteId, val.ClienteId as ClienteIdImporteVenta
       FROM Objetivo obj 
       LEFT JOIN ObjetivoImporteVenta val ON obj.ClienteElementoDependienteId = val.ClienteElementoDependienteId AND obj.ClienteId = val.ClienteId AND val.Anio = @1 AND val.Mes = @2
       WHERE obj.ObjetivoId = @0
       `, [ObjetivoId, anio, mes])

      if (objetivo.length == 0)
        throw new ClientException(`No se encontró el objetivo`)

      const ClienteElementoDependienteId = objetivo[0].ClienteElementoDependienteId
      const ClienteId = objetivo[0].ClienteId
      const asistencia = await AsistenciaController.getObjetivoAsistencia(anio, mes, [`obj.ObjetivoId = ${ObjetivoId}`], queryRunner)

      if (objetivo[0].ClienteIdImporteVenta) {
        await queryRunner.query(
          `UPDATE ObjetivoImporteVenta SET TotalHoraA=@4, TotalHoraB=@5, Observaciones=@6,
           AudFechaMod=@7, AudUsuarioMod=@8, AudIpMod=@9
           WHERE ClienteId=@0 AND Anio=@1 AND Mes=@2 AND ClienteElementoDependienteId=@3`,
          [ClienteId, anio, mes, ClienteElementoDependienteId, TotalHoraA, TotalHoraB, Observaciones, fechaActual, usuario, ip])
      } else {
        await queryRunner.query(
          `INSERT INTO ObjetivoImporteVenta (ClienteId,Anio,Mes,ClienteElementoDependienteId,TotalHoraA,TotalHoraB,ImporteHoraA,ImporteHoraB,Observaciones,
         AudFechaIng,AudUsuarioIng,AudIpIng,AudFechaMod,AudIpMod,AudUsuarioMod)
         VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8 ,@9,@10,@11 ,@9,@10,@11)`,
          [ClienteId, anio, mes, ClienteElementoDependienteId, TotalHoraA, TotalHoraB, 0, 0,Observaciones,
            fechaActual, usuario, ip])
      }

      await queryRunner.commitTransaction();
      this.jsonRes([], res, `Horas Actualizadas`);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      // you need to release query runner which is manually created:
      await queryRunner.release();
    }

  }

  async addAsistenciaPeriodoResJson(req: any, res: Response, next: NextFunction) {
    const {
      anio,
      mes,
      ObjetivoId,
    } = req.body

    const queryRunner = dataSource.createQueryRunner();

    try {

      await queryRunner.startTransaction()
      await this.addAsistenciaPeriodo(anio, mes, ObjetivoId, queryRunner, req, res)
      await queryRunner.commitTransaction();
      this.jsonRes([], res, `Período habilitado para el objetivo`);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      // you need to release query runner which is manually created:
      await queryRunner.release();
    }

  }

  static async objetivosPendAsis(anio: number, mes: number) {
    return await ObjetivosPendasisController.listObjetivosAsis({
      filtros: [
        { index: 'anio', operador: '=', condition: 'AND', valor: anio },
        { index: 'mes', operador: '=', condition: 'AND', valor: mes }
      ],
      sort: null,
      extra: null
    })


    /*
    let porGrupo: { GrupoActividadDetalle: string; CantidadObjetivos: number; }[] = []
    let data: { x: string; y: any; }[] = []
    let total = 0


    result.forEach(rec => {
      const cant: number = (Number(porGrupo[rec.GrupoActividadId]?.CantidadObjetivos) > 0) ? porGrupo[rec.GrupoActividadId].CantidadObjetivos : 0
      const GrupoActividadId = (rec.GrupoActividadId) ? rec.GrupoActividadId : 0
      const GrupoActividadDetalle = (rec.GrupoActividadDetalle) ? rec.GrupoActividadDetalle : 'Sin Grupo'
      porGrupo[GrupoActividadId] = { GrupoActividadDetalle, CantidadObjetivos: cant + 1 }
      total++
    })

*/

  }

  async addAsistenciaPeriodo(anio: number, mes: number, ObjetivoId: number, queryRunner: QueryRunner, req: any, res: Response) {
    let cabecera = await AsistenciaController.getObjetivoAsistenciaCabecera(anio, mes, ObjetivoId, queryRunner)
    if (cabecera.length == 0)
      throw new ClientException('Objetivo no localizado')

    const contratos = await ObjetivoController.getObjetivoContratos(ObjetivoId, anio, mes, queryRunner)
    if (contratos.length == 0)
      throw new ClientException(`No tiene contrato vigente para el período ${anio}/${mes}`)

    const checkrecibos = await queryRunner.query(
      `SELECT per.ind_recibos_generados FROM lige.dbo.liqmaperiodo per WHERE per.anio=@1 AND per.mes=@2`, [, anio, mes]
    );

    if (checkrecibos[0]?.ind_recibos_generados == 1)
      throw new ClientException(`Ya se encuentran generados los recibos para el período ${anio}/${mes}, no se puede hacer modificaciones`)

    let ObjetivoAsistenciaAnoUltNro = cabecera[0].ObjetivoAsistenciaAnoId

    if (cabecera[0].ObjetivoAsistenciaAnoAno == null) {
      ObjetivoAsistenciaAnoUltNro = cabecera[0].ObjetivoAsistenciaAnoUltNro + 1

      await queryRunner.query(
        `INSERT ObjetivoAsistenciaAno (ObjetivoAsistenciaAnoId,ObjetivoId,ObjetivoAsistenciaAnoAno,ObjetivoAsistenciaAnoMesUltNro) VALUES(@0,@1,@2,@3)
          `, [ObjetivoAsistenciaAnoUltNro, ObjetivoId, anio, 0]
      );
      await queryRunner.query(
        ` UPDATE Objetivo SET ObjetivoAsistenciaAnoUltNro = @1 WHERE ObjetivoId = @0
          `, [ObjetivoId, ObjetivoAsistenciaAnoUltNro]
      );
    }

    if (cabecera[0].ObjetivoAsistenciaAnoMesMes == null) { //Da de alta el mes para el objetivo
      const ano = await queryRunner.query(`SELECT ObjetivoAsistenciaAnoMesUltNro FROM ObjetivoAsistenciaAno WHERE ObjetivoId = @0 AND ObjetivoAsistenciaAnoId =@1 `, [ObjetivoId, ObjetivoAsistenciaAnoUltNro])
      const ObjetivoAsistenciaAnoMesUltNro = Number(ano[0].ObjetivoAsistenciaAnoMesUltNro) + 1
      let fechaActual = new Date()
      fechaActual.setHours(0, 0, 0, 0)

      await queryRunner.query(
        `INSERT ObjetivoAsistenciaAnoMes (ObjetivoAsistenciaAnoMesId, ObjetivoAsistenciaAnoId, ObjetivoId, ObjetivoAsistenciaAnoMesMes, ObjetivoAsistenciaAnoMesMeses, ObjetivoAsistenciaAnoMesDesde, ObjetivoAsistenciaAnoMesHasta,
            ObjetivoAsistenciaAnoMesDiaUltNro, ObjetivoAsistenciaAnoMesPersonalUltNro, ObjetivoAsistenciaAnoMesDiasPersonalUltNro, ObjetivoAsistenciaAnoMesPersonalDiasUltNro, ObjetivoAsistenciaAnoMesDiaPersonalUltNro,
            ObjetivoAsistenciaAnoMesTraspasaUltimaAsistencia, ObjetivoAsistenciaAnoMesRectificativa)
          VALUES(@0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@11,@12,@13)
        `, [ObjetivoAsistenciaAnoMesUltNro, ObjetivoAsistenciaAnoUltNro, ObjetivoId, mes, mes, fechaActual, null, 0, 0, 0, 0, 0, 'N', 0]
      );

      await queryRunner.query(
        ` UPDATE ObjetivoAsistenciaAno SET ObjetivoAsistenciaAnoMesUltNro=@2 WHERE ObjetivoId = @0 AND ObjetivoAsistenciaAnoId = @1
        `, [ObjetivoId, ObjetivoAsistenciaAnoUltNro, ObjetivoAsistenciaAnoMesUltNro]
      );

    }

    if (cabecera[0].ObjetivoAsistenciaAnoMesHasta != null) {
      if (req && !await this.hasGroup(req, 'Liquidaciones')) throw new ClientException(`No tiene permisos para rehabilitar la carga de asistencia. Para volver a habilitarla, debe ser miembro del grupo 'Liquidaciones'`)
      const result = await queryRunner.query(
        `UPDATE ObjetivoAsistenciaAnoMes SET ObjetivoAsistenciaAnoMesHasta = NULL WHERE ObjetivoAsistenciaAnoMesId=@2 AND ObjetivoAsistenciaAnoId=@1 AND ObjetivoId=@0
          `, [cabecera[0].ObjetivoId, cabecera[0].ObjetivoAsistenciaAnoId, cabecera[0].ObjetivoAsistenciaAnoMesId]
      );
    }
    cabecera = await AsistenciaController.getObjetivoAsistenciaCabecera(anio, mes, ObjetivoId, queryRunner)
    return cabecera[0]

  }

  async getAsistenciaPeriodo(req: any, res: Response, next: NextFunction) {
    const ObjetivoId = req.params.ObjetivoId;
    const anio = req.params.anio;
    const mes = req.params.mes;

    const queryRunner = dataSource.createQueryRunner();
    try {
      const periodo = await AsistenciaController.getObjetivoAsistenciaCabecera(anio, mes, ObjetivoId, queryRunner)
      this.jsonRes(periodo, res)

    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      // you need to release query runner which is manually created:
      await queryRunner.release()
    }
  }

  async endAsistenciaPeriodo(req: any, res: Response, next: NextFunction) {
    const {
      anio,
      mes,
      ObjetivoId
    } = req.body;

    const queryRunner = dataSource.createQueryRunner();
    let fechaActual = new Date()
    fechaActual.setHours(0, 0, 0, 0)

    try {
      await queryRunner.startTransaction()
      const cabecera = await AsistenciaController.getObjetivoAsistenciaCabecera(anio, mes, ObjetivoId, queryRunner)
      if (cabecera.length == 0)
        throw new ClientException('Objetivo no localizado')

      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasAuthObjetivo(anio, mes, res, Number(ObjetivoId), queryRunner))
        throw new ClientException(`No tiene permisos para finalizar la carga del objetivo, no se encuentra en el grupo liquidaciones`)


      if (cabecera[0].ObjetivoAsistenciaAnoId == null || cabecera[0].ObjetivoAsistenciaAnoMesId == null)
        throw new ClientException('Periodo de carga de asitencia no generado')

      const valGrid = await this.valGrid(ObjetivoId, anio, mes, queryRunner)
      if (valGrid instanceof ClientException)
        throw valGrid

      if (cabecera[0].TotalHoras == 0) {
        throw new ClientException('Horas a facturar debe ser mayor a 0', cabecera[0].TotalHoras)
      }


      if (cabecera[0].ImporteHora < 1 && cabecera[0].ImporteFijo < 1) {
        //        throw new ClientException('Facturación Hora o Facturación Fijo debe tener un valor mayor a 0')
      }

      if (cabecera[0].ImporteHora > 0 && cabecera[0].ImporteFijo > 0) {
        throw new ClientException('Solo Facturación Hora o Facturación Fijo debe tener un valor mayor a 0')
      }


      //TODO incorporar validaciones de todo la carga.

      if (cabecera[0].ObjetivoAsistenciaAnoMesHasta == null) {
        const result = await queryRunner.query(
          `UPDATE ObjetivoAsistenciaAnoMes SET ObjetivoAsistenciaAnoMesHasta = @3 WHERE ObjetivoAsistenciaAnoMesId=@2 AND ObjetivoAsistenciaAnoId=@1 AND ObjetivoId=@0
          `, [ObjetivoId, cabecera[0].ObjetivoAsistenciaAnoId, cabecera[0].ObjetivoAsistenciaAnoMesId, fechaActual]
        );
      }

      await queryRunner.commitTransaction();

      this.jsonRes([], res, `Período finalizado para el objetivo ${cabecera[0].ObjetivoCodigo} ${cabecera[0].ClienteElementoDependienteDescripcion}`)
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      // you need to release query runner which is manually created:
      await queryRunner.release()
    }
  }

  static async getIngresosExtra(anio: number, mes: number, queryRunner: QueryRunner, personalId: number[]) {
    const listPersonaId = (personalId.length == 0) ? '' : 'AND ingext.persona_id IN (' + personalId.join(',') + ')'
    let ingesosExtra = await queryRunner.query(`SELECT peri.anio, peri.mes, ingext.persona_id, tipo.des_movimiento, ingext.tipocuenta_id, ingext.importe
    FROM lige.dbo.liqmamovimientos ingext 
    JOiN lige.dbo.liqmaperiodo peri ON peri.periodo_id = ingext.periodo_id
    JOIN lige.dbo.liqcotipomovimiento tipo ON tipo.tipo_movimiento_id = ingext.tipo_movimiento_id
    WHERE tipo.tipo_movimiento = 'I' AND peri.anio =@0 AND peri.mes=@1 ${listPersonaId} `, [anio, mes])
    return ingesosExtra
  }


  static async getAsistenciaAdminArt42(anio: number, mes: number, queryRunner: QueryRunner, personalId: number[], filterSql: any, PersonalLicenciaSePaga: boolean, ishistory: boolean) {
    if (anio == 0 || mes == 0)
      return []

    const listPersonaId = (personalId.length == 0) ? '' : 'AND persona.PersonalId IN (' + personalId.join(',') + ')'

    let selectquery = `SELECT ROW_NUMBER() OVER (ORDER BY suc.SucursalId) AS id,suc.SucursalId, suc.SucursalDescripcion, licimp.PersonalLicenciaAplicaPeriodoAplicaEl,
  @1 anio, @2 mes,
  persona.PersonalId,lic.PersonalLicenciaId, persona.PersonalApellido, persona.PersonalNombre, 
  CONCAT(persona.PersonalApellido, ' ', persona.PersonalNombre) AS NombreCompleto,
  PARSENAME(licimp.PersonalLicenciaAplicaPeriodoHorasMensuales,2)+ CAST(PARSENAME(licimp.PersonalLicenciaAplicaPeriodoHorasMensuales,1) AS FLOAT)/60 AS PersonalLicenciaAplicaPeriodoHorasMensuales,
  val.ValorLiquidacionHoraNormal,
  (PARSENAME(licimp.PersonalLicenciaAplicaPeriodoHorasMensuales,2)+ CAST(PARSENAME(licimp.PersonalLicenciaAplicaPeriodoHorasMensuales,1) AS FLOAT)/60) * val.ValorLiquidacionHoraNormal AS total,
  lic.PersonalLicenciaSePaga,  
  tli.TipoInasistenciaId,
  tli.TipoInasistenciaDescripcion,
  tli.TipoInasistenciaApartado,
	lic.PersonalLicenciaDesde,
	ISNULL(lic.PersonalLicenciaHasta,lic.PersonalLicenciaTermina) PersonalLicenciaHasta,
   cat.CategoriaPersonalDescripcion,
	lic.PersonalLicenciaObservacion,
	med.PersonalLicenciaDiagnosticoMedicoDiagnostico,
	med.PersonalLicenciaDiagnosticoMedicoFechaDiagnostico,
  lic.PersonalLicenciaTipoAsociadoId,
  lic.PersonalLicenciaCategoriaPersonalId,

    1
    FROM PersonalLicencia lic 
    JOIN Personal persona ON persona.PersonalId = lic.PersonalId
    JOIN TipoInasistencia tli ON tli.TipoInasistenciaId = lic.PersonalTipoInasistenciaId
    LEFT JOIN PersonalSucursalPrincipal sucper ON sucper.PersonalId = persona.PersonalId AND sucper.PersonalSucursalPrincipalId = (SELECT MAX(a.PersonalSucursalPrincipalId) PersonalSucursalPrincipalId FROM PersonalSucursalPrincipal a WHERE a.PersonalId = persona.PersonalId)
 
    LEFT JOIN PersonalLicenciaAplicaPeriodo licimp ON lic.PersonalId = licimp.PersonalId AND lic.PersonalLicenciaId = licimp.PersonalLicenciaId AND licimp.PersonalLicenciaAplicaPeriodoAplicaEl = CONCAT(RIGHT('  '+CAST(@2 AS VARCHAR(2)),2),'/',@1)
    LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(licimp.PersonalLicenciaAplicaPeriodoSucursalId,sucper.PersonalSucursalPrincipalSucursalId),1)
    LEFT JOIN CategoriaPersonal cat ON cat.TipoAsociadoId = lic.PersonalLicenciaTipoAsociadoId AND cat.CategoriaPersonalId = lic.PersonalLicenciaCategoriaPersonalId
    LEFT JOIN ValorLiquidacion val ON val.ValorLiquidacionSucursalId = licimp.PersonalLicenciaAplicaPeriodoSucursalId AND val.ValorLiquidacionTipoAsociadoId = lic.PersonalLicenciaTipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId = lic.PersonalLicenciaCategoriaPersonalId AND val.ValorLiquidacionDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND ISNULL(val.ValorLiquidacionHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1)
    LEFT JOIN PersonalLicenciaDiagnosticoMedico med ON med.PersonalId=persona.PersonalId AND med.PersonalLicenciaId = lic.PersonalLicenciaId
    WHERE lic.PersonalLicenciaDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) `

    if (!ishistory)
      selectquery += `AND ISNULL(ISNULL(lic.PersonalLicenciaTermina,lic.PersonalLicenciaHasta),'9999-12-31') >= DATEFROMPARTS(@1,@2,1)`

    selectquery += `${listPersonaId} `

    if (PersonalLicenciaSePaga)
      selectquery += ` AND (lic.PersonalLicenciaSePaga = 'S' OR PARSENAME(licimp.PersonalLicenciaAplicaPeriodoHorasMensuales,2)+ CAST(PARSENAME(licimp.PersonalLicenciaAplicaPeriodoHorasMensuales,1) AS FLOAT)/60 >0)`

    if (filterSql && filterSql.length > 0)
      selectquery += ` AND ${filterSql}`

    return await queryRunner.query(selectquery, [, anio, mes])
    /*
        let asisadmin = await queryRunner.query(`
        SELECT suc.SucursalId, suc.SucursalDescripcion, 
        asisa.SucursalAsistenciaAnoAno, asism.SucursalAsistenciaAnoMesMes, 
        asis.SucursalAsistenciaMesPersonalId, cuit.PersonalCUITCUILCUIT, persona.PersonalApellido, persona.PersonalNombre, 
        persona.PersonalId,    
        
        asis.SucursalAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras,
        cat.CategoriaPersonalDescripcion,
        
        (
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias1Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias1Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias2Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias2Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias3Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias3Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias4Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias4Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias5Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias5Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias6Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias6Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias7Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias7Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias8Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias8Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias9Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias9Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias10Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias10Gral),2) AS INT),0)+
        
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias11Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias11Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias12Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias12Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias13Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias13Gral),2) AS INT),0)+
          ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias14Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias14Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias15Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias15Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias16Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias16Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias17Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias17Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias18Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias18Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias19Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias19Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias20Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias20Gral),2) AS INT),0)+
        
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias21Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias21Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias22Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias22Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias23Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias23Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias24Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias24Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias25Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias25Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias26Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias26Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias27Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias27Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias28Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias28Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias29Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias29Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias30Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias30Gral),2) AS INT),0)+
        
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias31Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias31Gral),2) AS INT),0)
        ) / 60 AS horas,
        
        val.ValorLiquidacionHoraNormal,
        
        (
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias1Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias1Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias2Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias2Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias3Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias3Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias4Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias4Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias5Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias5Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias6Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias6Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias7Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias7Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias8Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias8Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias9Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias9Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias10Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias10Gral),2) AS INT),0)+
        
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias11Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias11Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias12Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias12Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias13Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias13Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias14Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias14Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias15Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias15Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias16Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias16Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias17Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias17Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias18Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias18Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias19Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias19Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias20Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias20Gral),2) AS INT),0)+
        
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias21Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias21Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias22Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias22Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias23Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias23Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias24Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias24Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias25Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias25Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias26Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias26Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias27Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias27Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias28Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias28Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias29Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias29Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias30Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias30Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(asis.SucursalAsistenciaAnoMesPersonalDias31Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(asis.SucursalAsistenciaAnoMesPersonalDias31Gral),2) AS INT),0) 
        )
        / 60 * val.ValorLiquidacionHoraNormal AS total,
        
        asis.SucursalAsistenciaAnoMesPersonalDiasCualArt42,
        
        1
        
        
        FROM SucursalAsistenciaAnoMesPersonalDias asis
        JOIN SucursalAsistenciaAnoMes asism ON asism.SucursalAsistenciaAnoMesId = asis.SucursalAsistenciaAnoMesId AND asism.SucursalAsistenciaAnoId = asis.SucursalAsistenciaAnoId AND asism.SucursalId = asis.SucursalId
        JOIN SucursalAsistenciaAno asisa ON asisa.SucursalAsistenciaAnoId = asism.SucursalAsistenciaAnoId AND asisa.SucursalId = asism.SucursalId
        JOIN Sucursal suc ON suc.SucursalId = asisa.SucursalId
        JOIN Personal persona ON persona.PersonalId = asis.SucursalAsistenciaMesPersonalId
        
        JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = persona.PersonalId AND cuit.PersonalCUITCUILId = persona.PersonalCUITCUILUltNro
        
        LEFT JOIN CategoriaPersonal cat ON cat.TipoAsociadoId = asis.SucursalAsistenciaTipoAsociadoId AND cat.CategoriaPersonalId = asis.SucursalAsistenciaCategoriaPersonalId
        
        LEFT JOIN ValorLiquidacion val ON val.ValorLiquidacionSucursalId = asisa.SucursalId AND val.ValorLiquidacionTipoAsociadoId = asis.SucursalAsistenciaTipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId = asis.SucursalAsistenciaCategoriaPersonalId AND val.ValorLiquidacionDesde <= DATEFROMPARTS(asisa.SucursalAsistenciaAnoAno,asism.SucursalAsistenciaAnoMesMes,'28') AND ISNULL(val.ValorLiquidacionHasta,'9999-12-31') >= DATEFROMPARTS(asisa.SucursalAsistenciaAnoAno,asism.SucursalAsistenciaAnoMesMes,'1')
        
        WHERE asisa.SucursalAsistenciaAnoAno = @1 AND asism.SucursalAsistenciaAnoMesMes = @2 ${listPersonaId} `, [, anio, mes])
    
        return asisadmin
        */
  }
  async getCategoria(req: any, res: Response, next: NextFunction) {
    try {
      const result = await dataSource.query(
        `SELECT val.ValorLiquidacionSucursalId, tip.TipoAsociadoId, tip.TipoAsociadoDescripcion, cat.CategoriaPersonalId, cat.CategoriaPersonalDescripcion, val.ValorLiquidacionHoraNormal
                FROM CategoriaPersonal cat
                JOIN TipoAsociado tip ON tip.TipoAsociadoId = cat.TipoAsociadoId
                JOIN ValorLiquidacion val ON val.ValorLiquidacionTipoAsociadoId = tip.TipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId=cat.CategoriaPersonalId
                WHERE GETDATE() BETWEEN val.ValorLiquidacionDesde AND COALESCE(val.ValorLiquidacionHasta, '9999-12-31') 
                AND val.ValorLiquidacionHoraNormal > 0
                AND ISNULL(cat.CategoriaPersonalInactivo,0) <> 1
                AND tip.TipoAsociadoId = 3
                `
      );
      this.jsonRes(result, res);
    } catch (error) {
      return next(error)
    }
  }

  static async getObjetivoAsistenciaCabecera(anio: number, mes: number, objetivoId: number, queryRunner: QueryRunner) {
    return queryRunner.query(
      `SELECT obja.ObjetivoAsistenciaAnoAno, objm.ObjetivoAsistenciaAnoMesMes, 
      obj.ObjetivoId, 
      obja.ObjetivoAsistenciaAnoId, 
      objm.ObjetivoAsistenciaAnoMesId,
      obj.ObjetivoAsistenciaAnoUltNro,
      objm.ObjetivoAsistenciaAnoMesPersonalUltNro,
      objm.ObjetivoAsistenciaAnoMesDiasPersonalUltNro,
      objm.ObjetivoAsistenciaAnoMesPersonalDiasUltNro,
      suc.SucursalId,
      
      CONCAT(obj.ClienteId,'/', ISNULL(obj.ClienteElementoDependienteId,0)) AS ObjetivoCodigo,
      clidep.ClienteElementoDependienteDescripcion,
      cli.ClienteDenominacion,
      objm.ObjetivoAsistenciaAnoMesDesde, objm.ObjetivoAsistenciaAnoMesHasta,
      objm.ObjetivoAsistenciaAnoMesDesde desde, ISNULL(objm.ObjetivoAsistenciaAnoMesHasta,'9999-12-31') hasta,
      val.TotalHoraA, val.TotalHoraB, val.ImporteHoraA, val.ImporteHoraB, val.Observaciones,
      2 as last
      
      FROM Objetivo obj 

      LEFT JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoId = obj.ObjetivoId AND obja.ObjetivoAsistenciaAnoAno = @1 
      LEFT JOIN ObjetivoAsistenciaAnoMes objm ON objm.ObjetivoId = obj.ObjetivoId AND objm.ObjetivoAsistenciaAnoId = obja.ObjetivoAsistenciaAnoId AND objm.ObjetivoAsistenciaAnoMesMes = @2
      LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
      LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId 
      LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
      LEFT JOIN ObjetivoImporteVenta val ON val.ClienteId = obj.ClienteId AND val.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND val.Anio = obja.ObjetivoAsistenciaAnoAno AND val.Mes = objm.ObjetivoAsistenciaAnoMesMes
        WHERE obj.ObjetivoId = @0
      `, [objetivoId, anio, mes]
    );
  }

  static async checkAsistenciaObjetivo(ObjetivoId: number, anio: number, mes: number, queryRunner: any) {
    let resultObjs = await this.getObjetivoAsistenciaCabecera(anio, mes, ObjetivoId, queryRunner)

    if (resultObjs.length == 0)
      return new ClientException(`El objetivo no se localizó`)
    if (resultObjs[0].ObjetivoAsistenciaAnoAno == null || resultObjs[0].ObjetivoAsistenciaAnoMesMes == null)
      return new ClientException(`El objetivo seleccionado no tiene habilitada la carga de asistencia para el período ${anio}/${mes}`, {}, 100102)
    if (resultObjs[0].ObjetivoAsistenciaAnoMesHasta != null)
      return new ClientException(`El objetivo seleccionado tiene cerrada la carga de asistencia para el período ${anio}/${mes} el ${new Date(resultObjs[0].ObjetivoAsistenciaAnoMesHasta).toLocaleDateString('en-GB')}`)

    return resultObjs
  }



  async setExcepcion(req: any, res: Response, next: NextFunction) {
    let ConceptoId: number | null = null
    const queryRunner = dataSource.createQueryRunner();

    try {
      const usuarioId = await this.getUsuarioId(res, queryRunner)
      let {
        SucursalId,
        anio,
        mes,
        ObjetivoId,
        PersonalId,
        metodo,
        Equivalencia,
        SumaFija,
        AdicionalHora,
        Horas,
        metodologiaId,
      } = req.body;
      const persona_cuit = req.persona_cuit;
      const fechaDesde = new Date(anio, mes - 1, 1);
      let fechaHasta = new Date(anio, mes, 1);
      fechaHasta.setDate(fechaHasta.getDate() - 1);

      if (!Equivalencia) {
        Equivalencia = {
          TipoAsociadoId: null,
          CategoriaPersonalId: null,
        };
      }

      if (SumaFija == undefined) SumaFija = null;

      if (AdicionalHora == undefined) AdicionalHora = null;
      if (Horas == undefined) Horas = null;


      if (Number(PersonalId) == 0)
        throw new ClientException("Debe seleccionar una persona")

      if (Number(ObjetivoId) == 0)
        throw new ClientException("Debe seleccionar un objetivo")

      switch (metodo) {
        case "S":
          if (!SumaFija)
            throw new ClientException("Debe ingresar una monto");

          break;
        case "E":
          if (!Equivalencia.TipoAsociadoId)
            throw new ClientException("Debe seleccionar una categoria");

          break;
        case "H":
          if (!Horas)
            throw new ClientException("Debe ingresar horas adicionales");

          break;
        case "A":
          if (!AdicionalHora)
            throw new ClientException("Debe ingresar una monto adicional por hora");

          break;

        default:
          throw new ClientException("Debe seleccionar metodología");
          break;
      }
      await queryRunner.connect();
      await queryRunner.startTransaction();

      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasAuthObjetivo(anio, mes, res, Number(ObjetivoId), queryRunner))
        throw new ClientException(`No tiene permisos para grabar la excepción`)

      if (metodologiaId == "F")
        ConceptoId = 3


      let result = await queryRunner.query(
        `SELECT percat.PersonalCategoriaTipoAsociadoId,percat.PersonalCategoriaCategoriaPersonalId, cat.CategoriaPersonalDescripcion, percat.PersonalCategoriaDesde, percat.PersonalCategoriaHasta
                FROM Personal per
                JOIN PersonalCategoria percat ON percat.PersonalCategoriaPersonalId = per.PersonalId
                JOIN CategoriaPersonal cat ON cat.TipoAsociadoId = percat.PersonalCategoriaTipoAsociadoId AND  cat.CategoriaPersonalId = percat.PersonalCategoriaCategoriaPersonalId
                WHERE per.PersonalId = @0 AND percat.PersonalCategoriaDesde <= @1 AND (percat.PersonalCategoriaHasta >= @1 OR percat.PersonalCategoriaHasta IS NULL)
                `,
        [Number(PersonalId), fechaDesde]
      );

      let row: any;
      if ((row = result[0])) {
        if (metodo == "E") {
          if (
            Equivalencia.CategoriaPersonalId ==
            row["PersonalCategoriaCategoriaPersonalId"] &&
            Equivalencia.TipoAsociadoId ==
            row["PersonalCategoriaTipoAsociadoId"]
          ) {
            throw new ClientException("Categoría de equivalencia, debe ser distinta a la vigente de la persona")
          }
        } else {

          Equivalencia.CategoriaPersonalId =
            row["PersonalCategoriaCategoriaPersonalId"]
          Equivalencia.TipoAsociadoId =
            row["PersonalCategoriaTipoAsociadoId"]
        }
      }

      const val = await AsistenciaController.checkAsistenciaObjetivo(ObjetivoId, anio, mes, queryRunner)
      if (val instanceof ClientException) {
        if (val.code == 100102) {
          try {
            await this.addAsistenciaPeriodo(anio, mes, ObjetivoId, queryRunner, req, res)
          } catch (e) {
            throw new e
          }
        } else
          throw val
      }

      //Traigo la excepcion para analizarlo

      let resultAutoriz = await queryRunner.query(
        `SELECT art.PersonalArt14Id, art.Personalid, art.PersonalArt14ObjetivoId, art.PersonalArt14Autorizado, art.PersonalArt14FormaArt14, art.PersonalArt14CategoriaId, art.PersonalArt14TipoAsociadoId, art.PersonalArt14SumaFija, art.PersonalArt14AdicionalHora, art.PersonalArt14Horas, 
                art.PersonalArt14AutorizadoDesde, art.PersonalArt14Desde, art.PersonalArt14AutorizadoHasta, art.PersonalArt14Hasta,
                1
                
                FROM PersonalArt14 art
                WHERE art.Personalid = @0 AND art.PersonalArt14ObjetivoId=@1 
                --AND art.PersonalArt14FormaArt14 = @2
                AND art.PersonalArt14Autorizado = 'S'
                AND ISNULL(art.PersonalArt14ConceptoId,0) = ISNULL(@4,0)
                AND art.PersonalArt14AutorizadoDesde <= @3 AND (ISNULL(art.PersonalArt14AutorizadoHasta,'9999-12-31') >= @3) AND art.PersonalArt14Anulacion is null`,
        [PersonalId, ObjetivoId, metodo, fechaDesde, ConceptoId]
      );

      let resultNoAutoriz = await queryRunner.query(
        `SELECT art.PersonalArt14Id, art.Personalid, art.PersonalArt14ObjetivoId, art.PersonalArt14Autorizado, art.PersonalArt14FormaArt14, art.PersonalArt14CategoriaId, art.PersonalArt14TipoAsociadoId, art.PersonalArt14SumaFija, art.PersonalArt14AdicionalHora, art.PersonalArt14Horas, 
                art.PersonalArt14AutorizadoDesde, art.PersonalArt14Desde, art.PersonalArt14AutorizadoHasta, art.PersonalArt14Hasta,
                
                1
                
                FROM PersonalArt14 art
                WHERE art.Personalid = @0 AND art.PersonalArt14ObjetivoId=@1
                --AND art.PersonalArt14FormaArt14 = @2 
                AND art.PersonalArt14Autorizado is null
                AND ISNULL(art.PersonalArt14ConceptoId,0) = ISNULL(@4,0)
                AND art.PersonalArt14Desde <= @3 AND (ISNULL(art.PersonalArt14Hasta,'9999-12-31') >= @3) AND art.PersonalArt14Anulacion is null`,
        [PersonalId, ObjetivoId, metodo, fechaDesde, ConceptoId]
      );

      for (row of resultAutoriz) {
        //            resultAutoriz.forEach(row => {
        //Actualizo la fecha de los registros autorizados para finalizarlos.
        const PersonalArt14FormaArt14 = row["PersonalArt14FormaArt14"];
        const PersonalArt14CategoriaId = row["PersonalArt14CategoriaId"];
        const PersonalArt14TipoAsociadoId = row["PersonalArt14TipoAsociadoId"];
        const PersonalArt14SumaFija = row["PersonalArt14SumaFija"];
        const PersonalArt14Horas = row["PersonalArt14Horas"];
        const PersonalArt14AdicionalHora = row["PersonalArt14AdicionalHora"];

        if (
          PersonalArt14FormaArt14 == metodo &&
          PersonalArt14CategoriaId == Equivalencia.CategoriaPersonalId &&
          PersonalArt14TipoAsociadoId == Equivalencia.TipoAsociadoId &&
          PersonalArt14SumaFija == SumaFija &&
          PersonalArt14AdicionalHora == AdicionalHora &&
          PersonalArt14Horas == Horas
        ) {
          throw new ClientException("Ya se encuentra registrada la excepción")
        }

        let hasta: Date = new Date(fechaDesde);
        hasta.setDate(fechaDesde.getDate() - 1);

        switch (metodo) {
          case "A":
            if (PersonalArt14FormaArt14 == "E" || PersonalArt14FormaArt14 == "H")
              throw new ClientExceptionArt14(PersonalArt14FormaArt14)

            if (PersonalArt14FormaArt14 == "E") {
              await queryRunner.query(
                `UPDATE PersonalArt14 SET PersonalArt14AutorizadoHasta=@2
                            WHERE PersonalArt14Id = @0 AND PersonalId=@1 `,
                [row["PersonalArt14Id"], PersonalId, hasta]
              );
            }
            break;
          case "E":
            if (PersonalArt14FormaArt14 == "A" || PersonalArt14FormaArt14 == "H")
              throw new ClientExceptionArt14(PersonalArt14FormaArt14)

            if (PersonalArt14FormaArt14 == "A") {
              await queryRunner.query(
                `UPDATE PersonalArt14 SET PersonalArt14AutorizadoHasta=@2
                                WHERE PersonalArt14Id = @0 AND PersonalId=@1 `,
                [row["PersonalArt14Id"], PersonalId, hasta]
              );
            }
            break;
          case "H":
            if (PersonalArt14FormaArt14 == "A" || PersonalArt14FormaArt14 == "E")
              throw new ClientExceptionArt14(PersonalArt14FormaArt14)

            break;

          default:
            break;
        }
        if (PersonalArt14FormaArt14 == metodo) {
          await queryRunner.query(
            `UPDATE PersonalArt14 SET PersonalArt14AutorizadoHasta=@2
                    WHERE PersonalArt14Id = @0 AND PersonalId=@1 `,
            [row["PersonalArt14Id"], PersonalId, hasta]
          );
        }
      }

      //resultNoAutoriz.forEach(row => {
      for (row of resultNoAutoriz) {
        const PersonalArt14FormaArt14 = row["PersonalArt14FormaArt14"];
        const PersonalArt14CategoriaId = row["PersonalArt14CategoriaId"];
        const PersonalArt14TipoAsociadoId = row["PersonalArt14TipoAsociadoId"];
        const PersonalArt14SumaFija = row["PersonalArt14SumaFija"];
        const PersonalArt14Horas = row["PersonalArt14Horas"];
        const PersonalArt14AdicionalHora = row["PersonalArt14AdicionalHora"];

        if (
          PersonalArt14FormaArt14 == metodo &&
          PersonalArt14CategoriaId == Equivalencia.CategoriaPersonalId &&
          PersonalArt14TipoAsociadoId == Equivalencia.TipoAsociadoId &&
          PersonalArt14SumaFija == SumaFija &&
          PersonalArt14AdicionalHora == AdicionalHora &&
          PersonalArt14Horas == Horas
        ) {
          throw new ClientException("Ya se encuentra cargada la información");
        }

        //Borro los registros que no están autorizados.
        switch (metodo) {
          case "A":
            if (PersonalArt14FormaArt14 == "H" || PersonalArt14FormaArt14 == "E")
              throw new ClientExceptionArt14(PersonalArt14FormaArt14)

            if (PersonalArt14FormaArt14 == "E") {
              await queryRunner.query(
                `DELETE FROM PersonalArt14 
                                WHERE PersonalArt14Id = @0 AND PersonalId=@1 `,
                [row["PersonalArt14Id"], PersonalId]
              );
            }
            break;
          case "E":
            if (PersonalArt14FormaArt14 == "A" || PersonalArt14FormaArt14 == "H")
              throw new ClientExceptionArt14(PersonalArt14FormaArt14)

            if (PersonalArt14FormaArt14 == "A") {
              await queryRunner.query(
                `DELETE FROM PersonalArt14 
                                WHERE PersonalArt14Id = @0 AND PersonalId=@1 `,
                [row["PersonalArt14Id"], PersonalId]
              );
            }
            break;
          case "H":
            if (PersonalArt14FormaArt14 == "A" || PersonalArt14FormaArt14 == "E")
              throw new ClientExceptionArt14(PersonalArt14FormaArt14)


          default:
            break;
        }
        if (PersonalArt14FormaArt14 == metodo) {
          await queryRunner.query(
            `DELETE FROM PersonalArt14 
                    WHERE PersonalArt14Id = @0 AND PersonalId=@1 `,
            [row["PersonalArt14Id"], PersonalId]
          );
        }
      }

      const resPersona = await queryRunner.query(`SELECT DISTINCT 
        obj.ObjetivoId,
        persona.PersonalId, 
        persona.PersonalApellido, persona.PersonalNombre, 
        1 AS colend

        FROM ObjetivoAsistenciaAnoMesPersonalDias objd
        JOIN ObjetivoAsistenciaAnoMes objm ON objm.ObjetivoAsistenciaAnoMesId = objd.ObjetivoAsistenciaAnoMesId AND objm.ObjetivoAsistenciaAnoId = objd.ObjetivoAsistenciaAnoId AND objm.ObjetivoId = objd.ObjetivoId
        JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objm.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objm.ObjetivoId
        JOIN Objetivo obj ON obj.ObjetivoId = obja.ObjetivoId
        JOIN Personal persona ON persona.PersonalId = objd.ObjetivoAsistenciaMesPersonalId


        WHERE obja.ObjetivoAsistenciaAnoAno = @0 AND objm.ObjetivoAsistenciaAnoMesMes = @1  AND objd.ObjetivoAsistenciaMesPersonalId = @2 AND obja.ObjetivoId = @3`, [anio, mes, PersonalId, ObjetivoId])
      if (resPersona.length == 0)
        throw new ClientException('Antes de cargar la Excepción, debe cargarle al menos una hora en el objetivo a la persona')


      result = await queryRunner.query(
        `SELECT MAX(art14.PersonalArt14Id) PersonalArt14UltNro, art14.PersonalId 
        FROM PersonalArt14 art14 
        WHERE art14.Personalid = @0
        GROUP BY art14.PersonalId
            `,
        [PersonalId]
      );

      let PersonalArt14UltNro: number = 0;
      if ((row = result[0])) {
        if (row["PersonalArt14UltNro"] > 0)
          PersonalArt14UltNro = row["PersonalArt14UltNro"];
      }
      PersonalArt14UltNro++;
      if (Equivalencia.TipoAsociadoId == "NULL")
        Equivalencia.TipoAsociadoId = null;

      if (Equivalencia.CategoriaPersonalId == "NULL")
        Equivalencia.CategoriaPersonalId = null;


      result = await queryRunner.query(
        `INSERT INTO PersonalArt14(PersonalArt14Id, PersonalArt14FormaArt14, PersonalArt14SumaFija, PersonalArt14AdicionalHora, PersonalArt14Horas, PersonalArt14Porcentaje, PersonalArt14Desde, 
                    PersonalArt14Hasta, PersonalArt14Autorizado, PersonalArt14AutorizadoDesde, PersonalArt14AutorizadoHasta, PersonalArt14Anulacion, PersonalArt14Puesto, PersonalArt14Dia, PersonalArt14Tiempo, PersonalId, 
                    PersonalArt14TipoAsociadoId, PersonalArt14CategoriaId, PersonalArt14ConceptoId, PersonalArt14ObjetivoId, PersonalArt14QuienAutorizoId, PersonalArt14UsuarioId) 
                    VALUES(@0, @1, 
                    @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15, @16, @17, @18, @19, @20, @21)
                `,
        [
          PersonalArt14UltNro,
          metodo,
          SumaFija,
          AdicionalHora,
          Horas,
          null,
          fechaDesde,
          fechaHasta,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          PersonalId,
          Equivalencia.TipoAsociadoId,
          Equivalencia.CategoriaPersonalId,
          ConceptoId,
          ObjetivoId,
          null,
          usuarioId,
        ]
      );

      result = await queryRunner.query(
        `UPDATE Personal SET PersonalArt14UltNro=@1  WHERE PersonalId = @0
                `,
        [PersonalId, PersonalArt14UltNro]
      );

      await queryRunner.commitTransaction();

      this.jsonRes([], res);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      // you need to release query runner which is manually created:
      await queryRunner.release();
    }
  }

  async deleteExcepcion(req: any, res: Response, next: NextFunction) {
    const anio: number = req.params.anio;
    const mes: number = req.params.mes;
    const ObjetivoId: number = Number(req.params.ObjetivoId);
    const PersonalId: number = (isNaN(Number(req.params.PersonalId))) ? 0 : Number(req.params.PersonalId);
    const metodologiaId: string = req.params.metodologiaId;
    const metodo: string = req.params.metodo;
    const persona_cuit = req.persona_cuit;
    let ConceptoId: number | null = null

    if (metodologiaId == "F")
      ConceptoId = 3


    const queryRunner = dataSource.createQueryRunner();
    try {

      const fechaDesde = new Date(anio, mes - 1, 1);

      if (PersonalId == 0)
        throw new ClientException("Debe ingresar una persona")



      await queryRunner.connect();
      await queryRunner.startTransaction();

      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasAuthObjetivo(anio, mes, res, Number(ObjetivoId), queryRunner))
        throw new ClientException(`No tiene permisos para eliminar la excepción`)

      const val = await AsistenciaController.checkAsistenciaObjetivo(ObjetivoId, anio, mes, queryRunner)
      if (val instanceof ClientException)
        throw val

      //Traigo el Art14 para analizarlo
      let resultAutoriz = await queryRunner.query(
        `SELECT art.PersonalArt14Id, art.Personalid, art.PersonalArt14ObjetivoId, art.PersonalArt14Autorizado, art.PersonalArt14FormaArt14, art.PersonalArt14CategoriaId, art.PersonalArt14TipoAsociadoId, art.PersonalArt14SumaFija, art.PersonalArt14AdicionalHora, art.PersonalArt14Horas, 
                art.PersonalArt14AutorizadoDesde, art.PersonalArt14Desde, art.PersonalArt14AutorizadoHasta, art.PersonalArt14Hasta,
                1
                
                FROM PersonalArt14 art
                WHERE art.Personalid = @0 AND art.PersonalArt14ObjetivoId=@1 
                AND art.PersonalArt14FormaArt14 = @2
                AND art.PersonalArt14Autorizado = 'S'
                AND ISNULL(art.PersonalArt14ConceptoId,0) = ISNULL(@4,0)

                AND art.PersonalArt14AutorizadoDesde <= @3 AND (ISNULL(art.PersonalArt14AutorizadoHasta,'9999-12-31') >= @3) AND art.PersonalArt14Anulacion is null`,
        [PersonalId, ObjetivoId, metodo, fechaDesde, ConceptoId]
      );

      let resultNoAutoriz = await queryRunner.query(
        `SELECT art.PersonalArt14Id, art.Personalid, art.PersonalArt14ObjetivoId, art.PersonalArt14Autorizado, art.PersonalArt14FormaArt14, art.PersonalArt14CategoriaId, art.PersonalArt14TipoAsociadoId, art.PersonalArt14SumaFija, art.PersonalArt14AdicionalHora, art.PersonalArt14Horas, 
                art.PersonalArt14AutorizadoDesde, art.PersonalArt14Desde, art.PersonalArt14AutorizadoHasta, art.PersonalArt14Hasta,
                
                1
                
                FROM PersonalArt14 art
                WHERE art.Personalid = @0 AND art.PersonalArt14ObjetivoId=@1
                AND art.PersonalArt14FormaArt14 = @2
                AND ISNULL(art.PersonalArt14ConceptoId,0) = ISNULL(@4,0) 
                AND art.PersonalArt14Autorizado is null
                AND art.PersonalArt14Desde <= @3 AND (art.PersonalArt14Hasta >= @3) AND art.PersonalArt14Anulacion is null`,
        [PersonalId, ObjetivoId, metodo, fechaDesde, ConceptoId]
      );

      let hasta: Date = new Date(fechaDesde);
      hasta.setDate(fechaDesde.getDate() - 1);
      let recupdate = 0;
      let recdelete = 0;
      for (const row of resultAutoriz) {
        recupdate++;
        await queryRunner.query(
          `UPDATE PersonalArt14 SET PersonalArt14AutorizadoHasta=@2 WHERE PersonalArt14Id = @0 AND PersonalId=@1 `,
          [row["PersonalArt14Id"], PersonalId, hasta]
        );
      }

      for (const row of resultNoAutoriz) {
        recdelete++;
        await queryRunner.query(
          `DELETE FROM PersonalArt14 
                                  WHERE PersonalArt14Id = @0 AND PersonalId=@1 `,
          [row["PersonalArt14Id"], PersonalId]
        );
      }

      if (recdelete + recupdate == 0)
        throw new ClientException("No se localizaron registros para finalizar para la persona y metodología indicados");

      await queryRunner.commitTransaction();
      this.jsonRes([], res);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      // you need to release query runner which is manually created:
      await queryRunner.release();
    }
  }

  async getExcepAsistenciaPorObjetivoQuery(objetivoId: any, desde: Date, queryRunner: any) {
    return await queryRunner.query(
      `SELECT per.PersonalId, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, art.PersonalArt14Autorizado, art.PersonalArt14FormaArt14, art.PersonalArt14CategoriaId, art.PersonalArt14TipoAsociadoId, art.PersonalArt14SumaFija, art.PersonalArt14AdicionalHora, art.PersonalArt14Horas, TRIM(cat.CategoriaPersonalDescripcion) AS CategoriaPersonalDescripcion,
              suc.SucursalId, 
              IIF(art.PersonalArt14Autorizado ='S',art.PersonalArt14AutorizadoDesde, art.PersonalArt14Desde) AS Desde,
              IIF(art.PersonalArt14Autorizado ='S',art.PersonalArt14AutorizadoHasta, art.PersonalArt14Hasta) AS Hasta,
              art.PersonalArt14ConceptoId,con.ConceptoArt14Descripcion,
              IIF(art.PersonalArt14FormaArt14='S','Suma fija',IIF(art.PersonalArt14FormaArt14='E','Equivalencia',IIF(art.PersonalArt14FormaArt14='A','Adicional hora',IIF(art.PersonalArt14FormaArt14='H','Horas adicionales','')))) AS FormaDescripcion,
              1
              FROM PersonalArt14 art
              JOIN Personal per ON per.PersonalId = art.PersonalId
              JOIN Objetivo obj ON obj.ObjetivoId = art.PersonalArt14ObjetivoId
              LEFT JOIN ConceptoArt14 con ON con.ConceptoArt14Id = art.PersonalArt14ConceptoId
              LEFT JOIN CategoriaPersonal cat ON cat.TipoAsociadoId = art.PersonalArt14TipoAsociadoId  AND cat.CategoriaPersonalId = art.PersonalArt14CategoriaId
              LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 

              LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
              LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
              
              
              LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
              


              WHERE obj.ObjetivoId = @0 
              -- AND (art.PersonalArt14AutorizadoDesde <= @1 OR art.PersonalArt14AutorizadoDesde IS NULL) AND (art.PersonalArt14Desde <= @1 OR art.PersonalArt14Desde IS NULL) 
              AND ((art.PersonalArt14AutorizadoDesde <= @1  AND (ISNULL(art.PersonalArt14AutorizadoHasta,'9999-12-31') >= @1)) OR (art.PersonalArt14Autorizado is null AND (art.PersonalArt14Desde <= @1  AND (art.PersonalArt14Hasta >= @1))) )
              AND art.PersonalArt14Anulacion is null

              `,
      [objetivoId, desde]
    );
  }

  async getExcepAsistenciaPorObjetivo(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner()
    try {
      const objetivoId = req.params.objetivoId;
      const anio = req.params.anio;
      const mes = req.params.mes;
      var desde = new Date(anio, mes - 1, 1);

      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasGroup(req, 'Liquidaciones Consultas') && !await this.hasAuthObjetivo(anio, mes, res, Number(objetivoId), dataSource))
        throw new ClientException(`No tiene permisos para listar asistencia del objetivo`)

      await queryRunner.connect();
      await queryRunner.startTransaction();

      const result = await this.getExcepAsistenciaPorObjetivoQuery(objetivoId, desde, queryRunner)

      await queryRunner.commitTransaction();
      return this.jsonRes(result, res);
    } catch (error) {
      //      await this.rollbackTransaction(queryRunner)
      return next(error)
    }
  }

  static async getDescuentosObjetivo(queryRunner: QueryRunner, anio: number, mes: number, ObjetivoId: number[]) {
    //TODO: cuando Pablo agregue el indicador de dto telefono debería filtrar por ese dato
    const descuentos = await queryRunner.query(
      `SELECT CONCAT('cuo',cuo.ObjetivoDescuentoCuotaId,'-',cuo.ObjetivoDescuentoId,'-',cuo.ObjetivoId) id, 0, des.ObjetivoId, 0 as PersonalId, 'G' as tipocuenta_id, null as PersonalCUITCUILCUIT, null AS ApellidoNombre, 
      @1 AS anio, @2 AS mes, det.DescuentoDescripcion AS tipomov,
      des.ObjetivoDescuentoDetalle AS desmovimiento, 
      des.ObjetivoDescuentoDetalle AS desmovimiento2,
      des.ObjetivoDescuentoDescontar, 
      'OTRO' tipoint,
      cuo.ObjetivoDescuentoCuotaImporte AS importe, cuo.ObjetivoDescuentoCuotaCuota AS cuotanro, des.ObjetivoDescuentoCantidadCuotas  AS cantcuotas, des.ObjetivoDescuentoImporteVariable * des.ObjetivoDescuentoCantidad AS importetotal
      FROM ObjetivoDescuentoCuota cuo
      JOIN ObjetivoDescuento des ON cuo.ObjetivoDescuentoId = des.ObjetivoDescuentoId AND cuo.ObjetivoId = des.ObjetivoId
      JOIN Descuento det ON det.DescuentoId = des.ObjetivoDescuentoDescuentoId 
      WHERE cuo.ObjetivoId = @0 AND cuo.ObjetivoDescuentoCuotaAno = @1 AND cuo.ObjetivoDescuentoCuotaMes = @2
       `, [ObjetivoId, anio, mes])
    return descuentos
  }



  static async getDescuentos(anio: number, mes: number, personalId: number[]) {
    const listPersonaId = (personalId.length == 0) ? '' : 'AND per.PersonalId IN (' + personalId.join(',') + ')'
    //TODO: cuando Pablo agregue el indicador de dto telefono debería filtrar por ese dato
    const descuentos = await dataSource.query(
      `
      SELECT CONCAT('cuo',cuo.PersonalOtroDescuentoCuotaId,'-',cuo.PersonalOtroDescuentoId,'-',cuo.PersonalId) id, gap.GrupoActividadId, 0 as ObjetivoId, per.PersonalId, 'G' as tipocuenta_id, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, 
      @1 AS anio, @2 AS mes, det.DescuentoDescripcion AS tipomov,
      des.PersonalOtroDescuentoDetalle AS desmovimiento, 
      des.PersonalOtroDescuentoDetalle AS desmovimiento2, 
      'OTRO' tipoint,
      cuo.PersonalOtroDescuentoCuotaImporte AS importe, cuo.PersonalOtroDescuentoCuotaCuota AS cuotanro, des.PersonalOtroDescuentoCantidadCuotas  AS cantcuotas, des.PersonalOtroDescuentoImporteVariable * des.PersonalOtroDescuentoCantidad AS importetotal
      FROM PersonalOtroDescuentoCuota cuo
      JOIN PersonalOtroDescuento des ON cuo.PersonalOtroDescuentoId = des.PersonalOtroDescuentoId AND cuo.PersonalId = des.PersonalId
      JOIN Descuento det ON det.DescuentoId = des.PersonalOtroDescuentoDescuentoId
      JOIN Personal per ON per.PersonalId = des.PersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN(SELECT gapx.GrupoActividadPersonalPersonalId, MAX(gapx.GrupoActividadPersonalDesde) GrupoActividadPersonalDesde FROM GrupoActividadPersonal gapx 
        WHERE EOMONTH(DATEFROMPARTS(@1,@2,1)) > gapx.GrupoActividadPersonalDesde AND EOMONTH(DATEFROMPARTS(@1,@2,1)) < ISNULL(gapx.GrupoActividadPersonalHasta , '9999-12-31')
        GROUP BY gapx.GrupoActividadPersonalPersonalId) AS gapx ON gapx.GrupoActividadPersonalPersonalId = per.PersonalId
      LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND gap.GrupoActividadPersonalDesde = gapx.GrupoActividadPersonalDesde
      
      WHERE cuo.PersonalOtroDescuentoCuotaAno = @1 AND cuo.PersonalOtroDescuentoCuotaMes = @2 ${listPersonaId}
      
      UNION
             
      SELECT CONCAT('efe',cuo.PersonalDescuentoCuotaId,'-',cuo.PersonalDescuentoId,'-',cuo.PersonalDescuentoPersonalId) id, gap.GrupoActividadId, 0 as ObjetivoId, per.PersonalId, 'G' as tipocuenta_id, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, 
      @1 AS anio, @2 AS mes, 'Efecto' AS tipomov, 
      efe.EfectoDescripcion AS desmovimiento,
      efe.EfectoDescripcion AS desmovimiento2, 'DESC' tipoint,
      cuo.PersonalDescuentoCuotaImporte*des.PersonalDescuentoCantidadEfectos AS importe, cuo.PersonalDescuentoCuotaCuota AS cuotanro, des.PersonalDescuentoCuotas AS cantcuotas, des.PersonalDescuentoImporte - (des.PersonalDescuentoImporte * des.PersonalDescuentoPorcentajeDescuento /100)   AS importetotal
      FROM PersonalDescuento des 
      JOIN PersonalDescuentoCuota cuo ON cuo.PersonalDescuentoId = des.PersonalDescuentoId AND cuo.PersonalDescuentoPersonalId = des.PersonalDescuentoPersonalId
      JOIN Efecto efe ON efe.EfectoId = des.PersonalDescuentoEfectoId
              JOIN Personal per ON per.PersonalId = des.PersonalDescuentoPersonalId
              LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 



      LEFT JOIN(SELECT gapx.GrupoActividadPersonalPersonalId, MAX(gapx.GrupoActividadPersonalDesde) GrupoActividadPersonalDesde FROM GrupoActividadPersonal gapx 
        WHERE EOMONTH(DATEFROMPARTS(@1,@2,1)) > gapx.GrupoActividadPersonalDesde AND EOMONTH(DATEFROMPARTS(@1,@2,1)) < ISNULL(gapx.GrupoActividadPersonalHasta , '9999-12-31')
        GROUP BY gapx.GrupoActividadPersonalPersonalId) AS gapx ON gapx.GrupoActividadPersonalPersonalId = per.PersonalId
      LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND gap.GrupoActividadPersonalDesde = gapx.GrupoActividadPersonalDesde

      
      WHERE cuo.PersonalDescuentoCuotaAno = @1 AND cuo.PersonalDescuentoCuotaMes = @2 ${listPersonaId}
      
      UNION
      
      SELECT CONCAT('ayu',cuo.PersonalPrestamoCuotaId,'-',cuo.PersonalPrestamoId,'-',cuo.PersonalId) id, gap.GrupoActividadId, 0 as ObjetivoId, per.PersonalId, 'G' as tipocuenta_id, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, 
      @1 AS anio, @2 AS mes, TRIM(form.FormaPrestamoDescripcion) AS tipomov, 
      CONCAT(TRIM(form.FormaPrestamoDescripcion),' ',des.personalId,'/',des.PersonalPrestamoId) AS desmovimiento,
      CONCAT(TRIM(form.FormaPrestamoDescripcion),' ',des.personalId,'/',des.PersonalPrestamoId) AS desmovimiento2, 
     'AYUD' tipoint,
      cuo.PersonalPrestamoCuotaImporte AS importe, cuo.PersonalPrestamoCuotaCuota AS cuotanro, des.PersonalPrestamoCantidadCuotas AS cantcuotas, des.PersonalPrestamoMonto importetotal
      
      FROM PersonalPrestamo des
      JOIN FormaPrestamo form ON form.FormaPrestamoId = des.FormaPrestamoId
      JOIN PersonalPrestamoCuota cuo ON cuo.PersonalPrestamoId = des.PersonalPrestamoId AND cuo.PersonalId = des.PersonalId
              JOIN Personal per ON per.PersonalId = des.PersonalId
              LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN(SELECT gapx.GrupoActividadPersonalPersonalId, MAX(gapx.GrupoActividadPersonalDesde) GrupoActividadPersonalDesde FROM GrupoActividadPersonal gapx 
        WHERE EOMONTH(DATEFROMPARTS(@1,@2,1)) > gapx.GrupoActividadPersonalDesde AND EOMONTH(DATEFROMPARTS(@1,@2,1)) < ISNULL(gapx.GrupoActividadPersonalHasta , '9999-12-31')
        GROUP BY gapx.GrupoActividadPersonalPersonalId) AS gapx ON gapx.GrupoActividadPersonalPersonalId = per.PersonalId
      LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND gap.GrupoActividadPersonalDesde = gapx.GrupoActividadPersonalDesde
      
      WHERE cuo.PersonalPrestamoCuotaAno = @1 AND cuo.PersonalPrestamoCuotaMes = @2 ${listPersonaId}
      
      UNION
      
      SELECT CONCAT('pre',dis.PersonalPrepagaDescuentoDiscriminadoId,'-',dis.PersonalPrepagaDescuentoId,'-',dis.PersonalId) id, gap.GrupoActividadId, 0 as ObjetivoId, per.PersonalId, 'G' as tipocuenta_id, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, 
      -- pre.PrepagaDescripcion, pla.PrepagaPlanDescripcion, dis.PersonalPrepagaDescuentoDiscriminadoCUITCUIL,  dis.PersonalPrepagaDescuentoDiscriminadoGravado, dis.PersonalPrepagaDescuentoDiscriminadoExento, dis.PersonalPrepagaDescuentoDiscriminadoTipo,
      
      @1 AS anio, @2 AS mes, 'Prepaga' AS tipomov, 
      CONCAT(TRIM(pre.PrepagaDescripcion), ' ', TRIM(pla.PrepagaPlanDescripcion), ' ' ,dis.PersonalPrepagaDescuentoDiscriminadoCUITCUIL, ' ',dis.PersonalPrepagaDescuentoDiscriminadoTipo) AS desmovimiento, 
      CONCAT(TRIM(pre.PrepagaDescripcion), ' ', TRIM(pla.PrepagaPlanDescripcion), ' ' ,dis.PersonalPrepagaDescuentoDiscriminadoCUITCUIL, ' ',dis.PersonalPrepagaDescuentoDiscriminadoTipo) AS desmovimiento2, 
      'PREP' tipoint,
     
      IIF(dis.PersonalPrepagaDescuentoDiscriminadoTipo='C',(dis.PersonalPrepagaDescuentoDiscriminadoExento+dis.PersonalPrepagaDescuentoDiscriminadoGravado)*-1,(dis.PersonalPrepagaDescuentoDiscriminadoExento+dis.PersonalPrepagaDescuentoDiscriminadoGravado)) AS importe,  1 AS cuotanro, 1 AS cantcuotas, 0 AS importetotal

      FROM PersonalPrepagaDescuento des
      JOIN Prepaga pre ON pre.PrepagaId = des.PrepagaId
      JOIN PrepagaPlan pla ON pla.PrepagaPlanId = des.PrepagaPlanId AND pla.PrepagaId = des.PrepagaId
      JOIN PersonalPrepagaDescuentoDiscriminado dis ON dis.PersonalId = des.PersonalId AND dis.PersonalPrepagaDescuentoId = des.PersonalPrepagaDescuentoId
      
        JOIN Personal per ON per.PersonalId = des.PersonalId
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN(SELECT gapx.GrupoActividadPersonalPersonalId, MAX(gapx.GrupoActividadPersonalDesde) GrupoActividadPersonalDesde FROM GrupoActividadPersonal gapx 
        WHERE EOMONTH(DATEFROMPARTS(@1,@2,1)) > gapx.GrupoActividadPersonalDesde AND EOMONTH(DATEFROMPARTS(@1,@2,1)) < ISNULL(gapx.GrupoActividadPersonalHasta , '9999-12-31')
        GROUP BY gapx.GrupoActividadPersonalPersonalId) AS gapx ON gapx.GrupoActividadPersonalPersonalId = per.PersonalId
      LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND gap.GrupoActividadPersonalDesde = gapx.GrupoActividadPersonalDesde
      
      WHERE des.PersonalPrepagaDescuentoPeriodo=CONCAT(FORMAT(CONVERT(INT, @2), '00'),'/',@1) ${listPersonaId}

      UNION

      SELECT CONCAT('ren',ren.PersonalRentasPagosId,ren.PersonalId) id, gap.GrupoActividadId, 0 as ObjetivoId, per.PersonalId, 'G' as tipocuenta_id, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, 
      -- pre.PrepagaDescripcion, pla.PrepagaPlanDescripcion, dis.PersonalPrepagaDescuentoDiscriminadoCUITCUIL,  dis.PersonalPrepagaDescuentoDiscriminadoGravado, dis.PersonalPrepagaDescuentoDiscriminadoExento, dis.PersonalPrepagaDescuentoDiscriminadoTipo,
      
      @1 AS anio, @2 AS mes, 'Rentas' AS tipomov, 
      '' AS desmovimiento, 
      '' AS desmovimiento2, 'RENT' tipoint, 
     
     	ren.PersonalRentasPagosImporte AS importe,  1 AS cuotanro, 1 AS cantcuotas, 0 AS importetotal

      FROM PersonalRentasPagos ren
      JOIN Personal per ON per.PersonalId = ren.PersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN(SELECT gapx.GrupoActividadPersonalPersonalId, MAX(gapx.GrupoActividadPersonalDesde) GrupoActividadPersonalDesde FROM GrupoActividadPersonal gapx 
        WHERE EOMONTH(DATEFROMPARTS(@1,@2,1)) > gapx.GrupoActividadPersonalDesde AND EOMONTH(DATEFROMPARTS(@1,@2,1)) < ISNULL(gapx.GrupoActividadPersonalHasta , '9999-12-31')
        GROUP BY gapx.GrupoActividadPersonalPersonalId) AS gapx ON gapx.GrupoActividadPersonalPersonalId = per.PersonalId
      LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND gap.GrupoActividadPersonalDesde = gapx.GrupoActividadPersonalDesde
      
      WHERE ren.PersonalRentasPagosPeriodo=CONCAT(FORMAT(CONVERT(INT, @2), '00'),'/',@1) ${listPersonaId}

      UNION

      SELECT CONCAT('ddjj',ren.PersonalRentasPagosId,ren.PersonalId) id, gap.GrupoActividadId, 0 as ObjetivoId, per.PersonalId, 'G' as tipocuenta_id, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, 
      
      @1 AS anio, @2 AS mes, 'Honorarios DDJJ' AS tipomov, 
      '' AS desmovimiento, 
      '' AS desmovimiento2, 'DDJJ' tipoint,
     
     	vdj.ValorDDJJImporte AS importe,  1 AS cuotanro, 1 AS cantcuotas, 0 AS importetotal

      FROM PersonalRentasPagos ren
      JOIN ValorDDJJ vdj ON vdj.ValorDDJJDesde <= DATEFROMPARTS(@1,@2,1) AND ISNULL(vdj.ValorDDJJHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,28)
      JOIN Personal per ON per.PersonalId = ren.PersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN(SELECT gapx.GrupoActividadPersonalPersonalId, MAX(gapx.GrupoActividadPersonalDesde) GrupoActividadPersonalDesde FROM GrupoActividadPersonal gapx 
        WHERE EOMONTH(DATEFROMPARTS(@1,@2,1)) > gapx.GrupoActividadPersonalDesde AND EOMONTH(DATEFROMPARTS(@1,@2,1)) < ISNULL(gapx.GrupoActividadPersonalHasta , '9999-12-31')
        GROUP BY gapx.GrupoActividadPersonalPersonalId) AS gapx ON gapx.GrupoActividadPersonalPersonalId = per.PersonalId
      LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND gap.GrupoActividadPersonalDesde = gapx.GrupoActividadPersonalDesde
      
      WHERE ren.PersonalRentasPagosPeriodo=CONCAT(FORMAT(CONVERT(INT, @2), '00'),'/',@1) ${listPersonaId}

      UNION

      SELECT CONCAT('otr2',cuo.ObjetivoDescuentoCuotaId,'-',cuo.ObjetivoDescuentoId,'-',cuo.ObjetivoId) id, gap.GrupoActividadId, des.ObjetivoId, per.PersonalId, IIF(des.ObjetivoId>0,'C','G') tipocuenta_id,   cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, 
@1 AS anio, @2 AS mes, det.DescuentoDescripcion AS tipomov, 
CONCAT(des.ObjetivoDescuentoDetalle,' ',CONCAT(' ',obj.ClienteId,'/',ISNULL(obj.ClienteElementoDependienteId,0),' ',eledep.ClienteElementoDependienteDescripcion)) AS desmovimiento, 
'' AS desmovimiento2, 'OTRO' tipoint,
cuo.ObjetivoDescuentoCuotaImporte AS importe, cuo.ObjetivoDescuentoCuotaCuota AS cuotanro, des.ObjetivoDescuentoCantidadCuotas  AS cantcuotas, (des.ObjetivoDescuentoImporteVariable * des.ObjetivoDescuentoCantidad) AS importetotal

FROM ObjetivoDescuentoCuota cuo 
JOIN ObjetivoDescuento des ON cuo.ObjetivoDescuentoId = des.ObjetivoDescuentoId AND cuo.ObjetivoId = des.ObjetivoId
LEFT JOIN ObjetivoPersonalJerarquico coo ON coo.ObjetivoId = des.ObjetivoId AND DATEFROMPARTS(@1,@2,28) > coo.ObjetivoPersonalJerarquicoDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(coo.ObjetivoPersonalJerarquicoHasta, '9999-12-31') AND coo.ObjetivoPersonalJerarquicoDescuentos = 1
JOIN Descuento det ON det.DescuentoId = des.ObjetivoDescuentoDescuentoId
JOIN Objetivo obj ON obj.ObjetivoId = des.ObjetivoId
JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
        JOIN Personal per ON per.PersonalId = coo.ObjetivoPersonalJerarquicoPersonalId
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN(SELECT gapx.GrupoActividadPersonalPersonalId, MAX(gapx.GrupoActividadPersonalDesde) GrupoActividadPersonalDesde FROM GrupoActividadPersonal gapx 
        WHERE EOMONTH(DATEFROMPARTS(@1,@2,1)) > gapx.GrupoActividadPersonalDesde AND EOMONTH(DATEFROMPARTS(@1,@2,1)) < ISNULL(gapx.GrupoActividadPersonalHasta , '9999-12-31')
        GROUP BY gapx.GrupoActividadPersonalPersonalId) AS gapx ON gapx.GrupoActividadPersonalPersonalId = per.PersonalId
      LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND gap.GrupoActividadPersonalDesde = gapx.GrupoActividadPersonalDesde

WHERE cuo.ObjetivoDescuentoCuotaAno = @1 AND cuo.ObjetivoDescuentoCuotaMes = @2
AND des.ObjetivoDescuentoDescontar = 'CO'
 ${listPersonaId}

      UNION

      SELECT CONCAT('tel',con.ConsumoTelefoniaAnoMesTelefonoConsumoId,'-',con.ConsumoTelefoniaAnoMesTelefonoAsignadoId,'-',con.ConsumoTelefoniaAnoMesId,'-',con.ConsumoTelefoniaAnoId) id, gap.GrupoActividadId, obj.ObjetivoId, per.PersonalId, IIF(obj.ObjetivoId>0,'C','G') tipocuenta_id,
      cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, 
      anio.ConsumoTelefoniaAnoAno, mes.ConsumoTelefoniaAnoMesMes, 'Telefonía' AS tipomov,
      CONCAT(TRIM(tel.TelefoniaNro), IIF(TRIM(tel.TelefoniaObservacion)>'',CONCAT(' ',tel.TelefoniaObservacion),''),IIF(tel.TelefoniaObjetivoId>0,CONCAT(' ',obj.ClienteId,'/',ISNULL(obj.ClienteElementoDependienteId,0),' ',eledep.ClienteElementoDependienteDescripcion),'')) AS desmovimiento,
      
      TRIM(tel.TelefoniaNro) AS desmovimiento2, 'TELE' tipoint, 
       con.ConsumoTelefoniaAnoMesTelefonoConsumoImporte+ (con.ConsumoTelefoniaAnoMesTelefonoConsumoImporte * imp.ImpuestoInternoTelefoniaImpuesto / 100 ) AS importe, 1 AS cuotanro, 1 AS cantcuotas, 0 AS importetotal
      FROM ConsumoTelefoniaAno anio
      JOIN ConsumoTelefoniaAnoMes mes ON mes.ConsumoTelefoniaAnoId = anio.ConsumoTelefoniaAnoId
      JOIN ConsumoTelefoniaAnoMesTelefonoAsignado asi ON asi.ConsumoTelefoniaAnoMesId=mes.ConsumoTelefoniaAnoMesId AND asi.ConsumoTelefoniaAnoId = anio.ConsumoTelefoniaAnoId
      JOIN ConsumoTelefoniaAnoMesTelefonoConsumo con ON con.ConsumoTelefoniaAnoMesId = mes.ConsumoTelefoniaAnoMesId AND con.ConsumoTelefoniaAnoId = anio.ConsumoTelefoniaAnoId AND con.ConsumoTelefoniaAnoMesTelefonoAsignadoId= asi.ConsumoTelefoniaAnoMesTelefonoAsignadoId
      JOIN ImpuestoInternoTelefonia imp ON DATEFROMPARTS(@1,@2,28) > imp.ImpuestoInternoTelefoniaDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(imp.ImpuestoInternoTelefoniaHasta ,'9999-12-31') 
      JOIN Telefonia tel ON tel.TelefoniaId = asi.TelefoniaId
      
      LEFT JOIN Objetivo obj ON obj.ObjetivoId = asi.TelefonoConsumoFacturarAObjetivoId
      LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
      LEFT JOIN ObjetivoPersonalJerarquico coo ON coo.ObjetivoId = obj.ObjetivoId 
		AND coo.ObjetivoPersonalJerarquicoDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1))
		AND ISNULL(coo.ObjetivoPersonalJerarquicoHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1)
		AND coo.ObjetivoPersonalJerarquicoDescuentos = 1  AND coo.ObjetivoPersonalJerarquicoPersonalId IN (3530,1278,3032)
      
      
		JOIN Personal per ON  (obj.ObjetivoId IS NULL AND per.PersonalId = asi.TelefonoConsumoFacturarAPersonalId) OR (obj.ObjetivoId IS NOT NULL AND per.PersonalId = coo.ObjetivoPersonalJerarquicoPersonalId)
      LEFT JOIN(SELECT gapx.GrupoActividadPersonalPersonalId, MAX(gapx.GrupoActividadPersonalDesde) GrupoActividadPersonalDesde FROM GrupoActividadPersonal gapx 
        WHERE EOMONTH(DATEFROMPARTS(@1,@2,1)) > gapx.GrupoActividadPersonalDesde AND EOMONTH(DATEFROMPARTS(@1,@2,1)) < ISNULL(gapx.GrupoActividadPersonalHasta , '9999-12-31')
        GROUP BY gapx.GrupoActividadPersonalPersonalId) AS gapx ON gapx.GrupoActividadPersonalPersonalId = per.PersonalId
      LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND gap.GrupoActividadPersonalDesde = gapx.GrupoActividadPersonalDesde


    LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      
      WHERE anio.ConsumoTelefoniaAnoAno = @1 AND mes.ConsumoTelefoniaAnoMesMes = @2 ${listPersonaId}

      ORDER BY ApellidoNombre,tipomov,desmovimiento2
      `,
      //      [personalId.join(','), anio,mes]
      ['', anio, mes]
    );
    /*
        descuentos.forEach((row, index) => {
          if (row.PersonalId == 3032 || row.PersonalId == 1278 || row.PersonalId == 3530)
            descuentos[index].tipocuenta_id = 'G'
        });
    */
    return descuentos
  }


  async getHabilitacionesPorPersonaQuery(anio: number, mes: number, personalId: number, queryRunner: QueryRunner) {
    return queryRunner.query(
      `SELECT DISTINCT
      per.PersonalId PersonalId,
      hab.PersonalHabilitacionDesde, hab.PersonalHabilitacionHasta, hab.PersonalHabilitacionLugarHabilitacionId, hab.PersonalHabilitacionPresentacionPapeles,
      lug.LugarHabilitacionDescripcion,
      hab.PersonalHabilitacionRechazado, hab.PersonalHabilitacionClase,
      1   
          
   FROM Personal per
   JOIN PersonalHabilitacion hab ON hab.PersonalId = per.PersonalId AND hab.PersonalHabilitacionDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND ISNULL(hab.PersonalHabilitacionHasta,'9999-12-31')>=DATEFROMPARTS(@1,@2,1)
   JOIN LugarHabilitacion lug ON lug.LugarHabilitacionId = hab.PersonalHabilitacionLugarHabilitacionId
   WHERE 
      per.PersonalId = @0
   `, [personalId, anio, mes])

  }


  async getHabilitacionesPorPersona(req: any, res: Response, next: NextFunction) {
    try {
      const personalId = req.params.personalId;
      const anio = req.params.anio;
      const mes = req.params.mes;
      const queryRunner = dataSource.createQueryRunner();

      //      if (!await this.hasGroup(req, 'liquidaciones') && await this.hasAuthPersona(res, anio, mes, personalId, queryRunner) == false)
      //        throw new ClientException(`No tiene permiso para obtener información de categorías de persona`)

      const habilitaciones = await this.getHabilitacionesPorPersonaQuery(anio, mes, personalId, queryRunner)
      this.jsonRes({ habilitaciones }, res);
    } catch (error) {
      return next(error)
    }
  }



  async getCategoriasPorPersonaQuery(anio: number, mes: number, personalId: number, SucursalId: number, queryRunner: QueryRunner) {
    return queryRunner.query(
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

  async getCategoriasPorPersona(req: any, res: Response, next: NextFunction) {
    try {
      const personalId = req.params.personalId;
      const anio = req.params.anio;
      const mes = req.params.mes;
      const SucursalId = Number(req.params.SucursalId);
      const ObjetivoId = Number(req.params.ObjetivoId);
      const queryRunner = dataSource.createQueryRunner();

      //      if (!await this.hasGroup(req, 'liquidaciones') && await this.hasAuthPersona(res, anio, mes, personalId, queryRunner) == false)
      //        throw new ClientException(`No tiene permiso para obtener información de categorías de persona`)

      let categorias = await this.getCategoriasPorPersonaQuery(anio, mes, personalId, SucursalId, queryRunner)
      if (ObjetivoId && ![1102, 1646].includes(ObjetivoId)) {
        categorias = categorias.filter((i: any) => i.TipoAsociadoId === 1)
      }
      this.jsonRes({ categorias: categorias }, res);
    } catch (error) {
      return next(error)
    }
  }


  async getDescuentosPorPersona(req: any, res: Response, next: NextFunction) {
    try {
      const personalId = req.params.personalId;
      const anio = req.params.anio;
      const mes = req.params.mes;
      const queryRunner = dataSource.createQueryRunner();
      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasGroup(req, 'Liquidaciones Consultas') && await this.hasAuthPersona(res, anio, mes, personalId, queryRunner) == false)
        throw new ClientException(`No tiene permiso para obtener información de descuentos`)


      const result = await AsistenciaController.getDescuentos(anio, mes, [personalId])

      const resultG = result.filter(row => row.tipocuenta_id == 'G')
      let totalG: number = resultG.reduce((totalG, row) => totalG + row.importe, 0)

      this.jsonRes({ descuentos: resultG, totalG }, res);
    } catch (error) {
      return next(error)
    }
  }
  async getDescuentosPorObjetivo(req: any, res: Response, next: NextFunction) {
    try {
      const ObjetivoId = req.params.objetivoId;
      const anio = req.params.anio;
      const mes = req.params.mes;
      const queryRunner = dataSource.createQueryRunner();
      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasGroup(req, 'Liquidaciones Consultas') && await this.hasAuthObjetivo(anio, mes, res, ObjetivoId, queryRunner) == false)
        throw new ClientException(`No tiene permiso para obtener información de descuentos`)

      const result = await AsistenciaController.getDescuentosObjetivo(queryRunner, anio, mes, ObjetivoId)
      let total: number = result.reduce((total, row) => total + row.importe, 0)

      this.jsonRes({ descuentos: result, total }, res);
    } catch (error) {
      return next(error)
    }
  }

  async getDescuentosPorPersonaCoord(req: any, res: Response, next: NextFunction) {
    try {
      const personalId = req.params.personalId;
      const anio = req.params.anio;
      const mes = req.params.mes;

      const queryRunner = dataSource.createQueryRunner();
      if (!await this.hasGroup(req, 'liquidaciones')  && !await this.hasGroup(req, 'Liquidaciones Consultas') && await this.hasAuthPersona(res, anio, mes, personalId, queryRunner) == false)
        throw new ClientException(`No tiene permiso para obtener información de descuentos`)

      const result = await AsistenciaController.getDescuentos(anio, mes, [personalId])

      const resultC = result.filter(row => row.tipocuenta_id == 'C')
      let totalC: number = resultC.reduce((totalC, row) => totalC + row.importe, 0)

      this.jsonRes({ descuentos: resultC, totalC }, res);
    } catch (error) {
      return next(error)
    }
  }


  async getPersonalxResponsableCols(req: any, res: Response, next: NextFunction) {
    this.jsonRes(columnasPersonalxResponsable, res);
  }

  async getPersonalxResponsableDescCols(req: any, res: Response, next: NextFunction) {
    this.jsonRes(columnasPersonalxResponsableDesc, res);
  }

  async getPersonalxResponsable(req: any, res: Response, next: NextFunction) {
    try {
      const personalId = Number(req.body.PersonalId);
      const anio = Number(req.body.anio);
      const mes = Number(req.body.mes);

      let prevAnio = anio;
      let prevMes = mes - 1;

      if (prevMes === 0) {
        prevMes = 12;
        prevAnio -= 1;
      }


      const options = req.body.options;

      if (!anio || !mes)
        return this.jsonRes({ persxresp: [], total: 0 }, res);

      const queryRunner = dataSource.createQueryRunner();
      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasGroup(req, 'Liquidaciones Consultas') && res.locals.PersonalId != personalId)
        throw new ClientException(`No tiene permisos para listar la información`)

      //Busco la lista de PersonalId que le corresponde al responsable
      let personalIdList: number[] = []
      const filterSql = filtrosToSql(options.filtros, columnasPersonalxResponsable);
      const orderBy = orderToSQL(options.sort)

      const personal = await queryRunner.query(
        `SELECT 0,0,'', per.PersonalId, per.PersonalId id, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS PersonaDes,
        cuit.PersonalCUITCUILCUIT,
        0 as ingresosG_importe,
        0 as ingresosC_importe,
        0 as ingresos_horas,
        0 as egresosG_importe,
        0 as egresosC_importe,
        sitrev.SituacionRevistaDescripcion,sitrev.PersonalSituacionRevistaDesde,
        1
        FROM Personal per
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)
        LEFT JOIN (
          SELECT p.PersonalId, p.PersonalSituacionRevistaSituacionId, s.SituacionRevistaDescripcion,p.PersonalSituacionRevistaDesde
          FROM PersonalSituacionRevista p
          JOIN SituacionRevista s
          ON p.PersonalSituacionRevistaSituacionId = s.SituacionRevistaId AND p.PersonalSituacionRevistaDesde <= GETDATE() AND ISNULL(p.PersonalSituacionRevistaHasta,'9999-12-31') >= CAST(GETDATE() AS DATE)
			 ) sitrev ON sitrev.PersonalId = per.PersonalId


        
        WHERE per.PersonalId IN (
          SELECT gap.GrupoActividadPersonalPersonalId
          FROM GrupoActividadJerarquico gaj 
          JOIN GrupoActividadPersonal gap ON gap.GrupoActividadId=gaJ.GrupoActividadId AND EOMONTH(DATEFROMPARTS(@1,@2,1)) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31')
          WHERE EOMONTH(DATEFROMPARTS(@1,@2,1)) > gaj.GrupoActividadJerarquicoDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(gaj.GrupoActividadJerarquicoHasta , '9999-12-31') AND gaj.GrupoActividadJerarquicoPersonalId = @0
          UNION
          
          SELECT gap.GrupoActividadJerarquicoPersonalId
                   FROM GrupoActividadJerarquico gaj 
                   JOIN GrupoActividadJerarquico gap ON gap.GrupoActividadId=gaJ.GrupoActividadId AND EOMONTH(DATEFROMPARTS(@1,@2,1)) > gap.GrupoActividadJerarquicoDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(gap.GrupoActividadJerarquicoHasta , '9999-12-31') AND gap.GrupoActividadJerarquicoComo = 'J' 
                   WHERE EOMONTH(DATEFROMPARTS(@1,@2,1)) > gaj.GrupoActividadJerarquicoDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(gaj.GrupoActividadJerarquicoHasta , '9999-12-31') AND gaj.GrupoActividadJerarquicoPersonalId = @0 
          
          UNION
          SELECT @0
        )
        -- AND (${filterSql}) ${orderBy}
        ORDER BY PersonaDes
         `, [personalId, anio, mes])

      if (personal.length == 0)
        return this.jsonRes({ persxresp: [], total: 0 }, res);

      for (let ds of personal)
        personalIdList.push(ds.PersonalId)

      const resDescuentos = await AsistenciaController.getDescuentos(anio, mes, personalIdList)

      const resAsisObjetiv = await AsistenciaController.getAsistenciaObjetivos(anio, mes, personalIdList)

      const resAsisAdmArt42 = await AsistenciaController.getAsistenciaAdminArt42(anio, mes, queryRunner, personalIdList, [], false, false)

      const resCustodias = await CustodiaController.listPersonalCustodiaQuery({ filtros: [{ index: "ApellidoNombre", valor: personalIdList, operador: "=", condition: "AND" }] }, queryRunner, anio, mes, 0)

      const resIngreExtra = await AsistenciaController.getIngresosExtra(anio, mes, queryRunner, personalIdList)
      const resBot = await AccesoBotController.getBotStatus(prevAnio, prevMes, queryRunner, personalIdList)

      for (const row of resAsisObjetiv) {
        const key = personal.findIndex(i => i.PersonalId == row.PersonalId)
        if (key >= 0) {
          personal[key].ingresosG_importe += row.totalminutoscalcimporteconart14
          personal[key].ingresos_horas += row.totalhorascalc
          personal[key].retiroG_importe = personal[key].ingresosG_importe
        }
      }

      for (const row of resAsisAdmArt42) {
        const key = personal.findIndex(i => i.PersonalId == row.PersonalId)
        if (key >= 0 && row.total > 0) {
          personal[key].ingresosG_importe += row.total
          personal[key].ingresos_horas += row.PersonalLicenciaAplicaPeriodoHorasMensuales
          personal[key].retiroG_importe = personal[key].ingresosG_importe
        }

      }

      for (const row of resCustodias) {
        const key = personal.findIndex(i => i.PersonalId == row.PersonalId)
        if (key >= 0 && row.importe > 0) {
          personal[key].ingresosG_importe += row.importe
          personal[key].ingresos_horas += row.horas
          personal[key].retiroG_importe = personal[key].ingresosG_importe
        }
      }

      for (const row of resIngreExtra) {
        const key = personal.findIndex(i => i.PersonalId == row.persona_id)
        if (key >= 0) {

          personal[key].ingresos_horas += 0
          if (row.tipocuenta_id == 'C') {
            personal[key].ingresosC_importe += row.importe
            personal[key].retiroC_importe = personal[key].ingresosC_importe - personal[key].egresosC_importe
          } else if (row.tipocuenta_id == 'G') {
            personal[key].ingresosG_importe += row.importe
            personal[key].retiroG_importe = personal[key].ingresosG_importe - personal[key].egresosG_importe
          }
        }
      }

      for (const row of resDescuentos) {
        const key = personal.findIndex(i => i.PersonalId == row.PersonalId)
        if (key >= 0) {

          if (row.tipocuenta_id == 'C') {
            personal[key].egresosC_importe += row.importe
            personal[key].retiroC_importe = personal[key].ingresosC_importe - personal[key].egresosC_importe
          } else if (row.tipocuenta_id == 'G') {
            personal[key].egresosG_importe += row.importe
            personal[key].retiroG_importe = personal[key].ingresosG_importe - personal[key].egresosG_importe
          }
        }
      }

      for (const row of resBot) {
        const key = personal.findIndex(i => i.PersonalId == row.PersonalId)
        if (key >= 0) {
          personal[key].det_status_bot = (row.registro == 'OK') ? row.descarga : row.registro
        }
      }


      //      const total = result.map(row => row.importe).reduce((prev, curr) => prev + curr, 0)

      this.jsonRes({ persxresp: personal, total: 0 }, res);
    } catch (error) {
      return next(error)
    }
  }
  async getPersonalxResponsableDesc(req: any, res: Response, next: NextFunction) {
    //ACA
    try {
      const personalId = Number(req.body.PersonalId);
      const anio = Number(req.body.anio);
      const mes = Number(req.body.mes);
      const options = req.body.options;

      if (!anio || !mes)
        return this.jsonRes({ descuentos: [], total: 0 }, res);

      const queryRunner = dataSource.createQueryRunner();
      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasGroup(req, 'Liquidaciones Consultas') && res.locals.PersonalId != personalId)
        throw new ClientException(`No tiene permisos para listar la información`)

      //Busco la lista de PersonalId que le corresponde al responsable
      let personalIdList: number[] = []
      const personal = await queryRunner.query(
        `SELECT 0,0,'', per.PersonalId, per.PersonalId id, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS PersonaDes,
        cuit.PersonalCUITCUILCUIT,
        0 as ingresosG_importe,
        0 as ingresosC_importe,
        0 as ingresos_horas,
        0 as egresosG_importe,
        0 as egresosC_importe,
        1
        FROM Personal per
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
        WHERE per.PersonalId IN (
          SELECT gap.GrupoActividadPersonalPersonalId
          FROM GrupoActividadJerarquico gaj 
          JOIN GrupoActividadPersonal gap ON gap.GrupoActividadId=gaJ.GrupoActividadId AND EOMONTH(DATEFROMPARTS(@1,@2,1)) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31') 
          WHERE EOMONTH(DATEFROMPARTS(@1,@2,1)) > gaj.GrupoActividadJerarquicoDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(gaj.GrupoActividadJerarquicoHasta , '9999-12-31') AND gaj.GrupoActividadJerarquicoPersonalId = @0
          UNION
          
          SELECT gap.GrupoActividadJerarquicoPersonalId
                   FROM GrupoActividadJerarquico gaj 
                   JOIN GrupoActividadJerarquico gap ON gap.GrupoActividadId=gaJ.GrupoActividadId AND EOMONTH(DATEFROMPARTS(@1,@2,1)) > gap.GrupoActividadJerarquicoDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(gap.GrupoActividadJerarquicoHasta , '9999-12-31') AND gap.GrupoActividadJerarquicoComo = 'J' 
                   WHERE EOMONTH(DATEFROMPARTS(@1,@2,1)) > gaj.GrupoActividadJerarquicoDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(gaj.GrupoActividadJerarquicoHasta , '9999-12-31') AND gaj.GrupoActividadJerarquicoPersonalId = @0 
          
          UNION
          SELECT @0
        )
        ORDER BY PersonaDes
         `, [personalId, anio, mes])

      for (let ds of personal)
        personalIdList.push(ds.PersonalId)

      const filterSql = filtrosToSql(options.filtros, columnasPersonalxResponsable);
      const orderBy = orderToSQL(options.sort)

      const resDescuentos = await AsistenciaController.getDescuentos(anio, mes, personalIdList)

      this.jsonRes({ descuentos: resDescuentos, total: 0 }, res);
    } catch (error) {
      return next(error)
    }
  }

  async getIngresosPorPersona(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const personalId = req.params.personalId;
      const anio = req.params.anio;
      const mes = req.params.mes;

      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasGroup(req, 'Liquidaciones Consultas') && await this.hasAuthPersona(res, anio, mes, personalId, queryRunner) == false)
        throw new ClientException(`No tiene permiso para obtener información de ingresos`)

      const result = await AsistenciaController.getAsistenciaAdminArt42(anio, mes, queryRunner, [personalId], [], false, false)

      const total = result.map(row => row.total).reduce((prev, curr) => prev + curr, 0)
      const totalHoras = result.map(row => row.PersonalLicenciaAplicaPeriodoHorasMensuales).reduce((prev, curr) => prev + curr, 0)

      // Objetngo el id del documento de recibo

      const listRecibos = await queryRunner.query(`SELECT doc.DocumentoId, doc.DocumentoDenominadorDocumento
        FROM Documento doc
        WHERE doc.PersonalId=@0 AND doc.DocumentoTipoCodigo=@3 and doc.DocumentoAnio=@1 and doc.DocumentoMes=@2`, [personalId, anio, mes, 'REC'])

      const DocumentoId = (listRecibos.length > 0) ? listRecibos[0].DocumentoId : null
      const DocumentoDenominadorDocumento = (listRecibos.length > 0) ? listRecibos[0].DocumentoDenominadorDocumento : null
      this.jsonRes({ ingresos: result, total, totalHoras, DocumentoId, DocumentoDenominadorDocumento }, res);
    } catch (error) {
      return next(error)
    }
  }
  async getIngresosExtraPorPersona(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const personalId = req.params.personalId;
      const anio = req.params.anio;
      const mes = req.params.mes;

      if (!await this.hasGroup(req, 'liquidaciones') &&  !await this.hasGroup(req, 'Liquidaciones Consultas') && await this.hasAuthPersona(res, anio, mes, personalId, queryRunner) == false)
        throw new ClientException(`No tiene permiso para obtener información de ingresos`)

      const result = await AsistenciaController.getIngresosExtra(anio, mes, queryRunner, [personalId])
      let totalG = 0
      let totalC = 0

      for (const row of result) {
        if (row.tipocuenta_id == 'G')
          totalG += row.importe
        if (row.tipocuenta_id == 'C')
          totalC += row.importe
      }

      const totalHoras = 0

      this.jsonRes({ ingresos: result, totalG, totalC, totalHoras }, res);
    } catch (error) {
      return next(error)
    }
  }


  async getExcepAsistenciaPorPersona(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();

    try {
      const personalId = req.params.personalId;
      const anio = req.params.anio;
      const mes = req.params.mes;
      var desde = new Date(anio, mes - 1, 1);

      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasGroup(req, 'Liquidaciones Consultas') && await this.hasAuthPersona(res, anio, mes, personalId, queryRunner) == false)
        throw new ClientException(`No tiene permiso para obtener información de excepciones`)

      const result = await queryRunner.query(
        `SELECT CONCAT(art.PersonalArt14Id,'-',per.PersonalId) as id, per.PersonalId, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, art.PersonalArt14Autorizado, art.PersonalArt14FormaArt14, art.PersonalArt14CategoriaId, art.PersonalArt14TipoAsociadoId, art.PersonalArt14SumaFija, art.PersonalArt14AdicionalHora, art.PersonalArt14Horas, TRIM(cat.CategoriaPersonalDescripcion) AS CategoriaPersonalDescripcion,
                IIF(art.PersonalArt14Autorizado ='S',art.PersonalArt14AutorizadoDesde, art.PersonalArt14Desde) AS Desde,
                IIF(art.PersonalArt14Autorizado ='S',art.PersonalArt14AutorizadoHasta, art.PersonalArt14Hasta) AS Hasta,
                CONCAT(obj.ClienteId,'/',ISNULL(obj.ClienteElementoDependienteId,0)) ObjetivoCodigo,
                obj.ObjetivoId,
                CONCAT(cli.ClienteDenominacion,' ',eledep.ClienteElementoDependienteDescripcion) ClienteElementoDependienteDescripcion,
                art.PersonalArt14ConceptoId,con.ConceptoArt14Descripcion,
                IIF(art.PersonalArt14FormaArt14='S','Suma fija',IIF(art.PersonalArt14FormaArt14='E','Equivalencia',IIF(art.PersonalArt14FormaArt14='A','Adicional hora',IIF(art.PersonalArt14FormaArt14='H','Horas adicionales','')))) AS FormaDescripcion,
                
                1 id
                FROM PersonalArt14 art 
                JOIN Personal per ON per.PersonalId = art.PersonalId
                JOIN Objetivo obj ON obj.ObjetivoId = art.PersonalArt14ObjetivoId
                JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
                JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
                LEFT JOIN ConceptoArt14 con ON con.ConceptoArt14Id = art.PersonalArt14ConceptoId
                LEFT JOIN CategoriaPersonal cat ON cat.TipoAsociadoId = art.PersonalArt14TipoAsociadoId  AND cat.CategoriaPersonalId = art.PersonalArt14CategoriaId
                LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
                WHERE art.PersonalId = @0 
                -- AND (art.PersonalArt14AutorizadoDesde <= @1 OR art.PersonalArt14AutorizadoDesde IS NULL) AND (art.PersonalArt14Desde <= @1 OR art.PersonalArt14Desde IS NULL) 
                AND ((art.PersonalArt14AutorizadoDesde <= @1  AND (ISNULL(art.PersonalArt14AutorizadoHasta,'9999-12-31') >= @1)) OR (art.PersonalArt14Autorizado is null AND (art.PersonalArt14Desde <= @1  AND (art.PersonalArt14Hasta >= @1) )) )
                AND art.PersonalArt14Anulacion is null

                `,
        [personalId, desde]
      );
      this.jsonRes(result, res);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    }
  }

  static async getObjetivoAsistencia(anio: number, mes: number, extraFilters: string[], queryRunner: any) {
    const cleanFilters = extraFilters.filter(r => r != '')
    const extraFiltersStr = `${(cleanFilters.length > 0) ? 'AND' : ''} ${cleanFilters.join(' AND ')}`

    const asistencia = await queryRunner.query(
      `
      SELECT DISTINCT suc.SucursalId, obja.ObjetivoAsistenciaAnoAno, objm.ObjetivoAsistenciaAnoMesMes, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(persona.PersonalApellido),', ',TRIM(persona.PersonalNombre)) PersonaDes,
      persona.PersonalId,
      obj.ObjetivoId, 
      CONCAT(obj.ClienteId,'/', ISNULL(obj.ClienteElementoDependienteId,0)) AS ObjetivoCodigo,
      clidep.ClienteElementoDependienteDescripcion,

--      ga.GrupoActividadId, ga.GrupoActividadNumero, ga.GrupoActividadDetalle,
--      gap.GrupoActividadObjetivoDesde, gap.GrupoActividadObjetivoHasta,
                      
      objd.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras,
      cat.CategoriaPersonalDescripcion,
      val.ValorLiquidacionHoraNormal,
      
      objd.ObjetivoAsistenciaTipoAsociadoId,
      objd.ObjetivoAsistenciaCategoriaPersonalId,
      
      
      (
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias1Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias1Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias2Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias2Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias3Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias3Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias4Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias4Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias5Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias5Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias6Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias6Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias7Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias7Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias8Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias8Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias9Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias9Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias10Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias10Gral),2) AS INT),0)+
      
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias11Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias11Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias12Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias12Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias13Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias13Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias14Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias14Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias15Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias15Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias16Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias16Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias17Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias17Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias18Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias18Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias19Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias19Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias20Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias20Gral),2) AS INT),0)+
      
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias21Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias21Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias22Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias22Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias23Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias23Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias24Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias24Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias25Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias25Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias26Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias26Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias27Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias27Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias28Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias28Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias29Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias29Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias30Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias30Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias31Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias31Gral),2) AS INT),0) 
      ) / CAST(60 AS FLOAT) AS totalhorascalc ,
      
      ((
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias1Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias1Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias2Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias2Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias3Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias3Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias4Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias4Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias5Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias5Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias6Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias6Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias7Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias7Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias8Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias8Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias9Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias9Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias10Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias10Gral),2) AS INT),0)+
      
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias11Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias11Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias12Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias12Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias13Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias13Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias14Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias14Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias15Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias15Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias16Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias16Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias17Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias17Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias18Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias18Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias19Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias19Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias20Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias20Gral),2) AS INT),0)+
      
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias21Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias21Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias22Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias22Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias23Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias23Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias24Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias24Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias25Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias25Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias26Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias26Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias27Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias27Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias28Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias28Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias29Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias29Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias30Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias30Gral),2) AS INT),0)+
      ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias31Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias31Gral),2) AS INT),0) 
      ) / CAST(60 AS FLOAT) + IIF(objd.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras='N',ISNULL(art14H.PersonalArt14Horas,0),0)) * (COALESCE (valart14cat.ValorLiquidacionHoraNormal, val.ValorLiquidacionHoraNormal)+ ISNULL(art14A.PersonalArt14AdicionalHora,0)) + 
		IIF(objd.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras='N',ISNULL(art14S.PersonalArt14SumaFija,0),0)
      AS totalminutoscalcimporteconart14,
      IIF(objd.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras='N',ISNULL(art14S.PersonalArt14SumaFija,0),0) AS PersonalArt14SumaFija,
      IIF(objd.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras='N',ISNULL(art14H.PersonalArt14Horas,0),0) AS PersonalArt14Horas,
      art14A.PersonalArt14AdicionalHora,
      art14E.PersonalArt14TipoAsociadoId,
      art14E.PersonalArt14CategoriaId,
      val.ValorLiquidacionHoraNormal AS ValorHoraNorm,
      art14cat.CategoriaPersonalDescripcion as art14CategoriaDescripcion,
      val.ValorLiquidacionHorasTrabajoHoraNormal,
      valart14cat.ValorLiquidacionHoraNormal AS ValorHoraArt14Categoria,
      
      -- ISNULL(CAST(Substring(objd.ObjetivoAsistenciaAnoMesPersonalDiasTotalGral, 1,CHARINDEX('.', objd.ObjetivoAsistenciaAnoMesPersonalDiasTotalGral)-1) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDiasTotalGral),2) AS INT),0) as MinutosMensuales,
      
--                objhab.ObjetivoHabilitacionVigenteDesde, objhab.ObjetivoHabilitacionVigenteHasta,
      
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
      
      -- aca3
      LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
      LEFT JOIN ValorLiquidacion val ON val.ValorLiquidacionSucursalId = suc.SucursalId AND val.ValorLiquidacionTipoAsociadoId = objd.ObjetivoAsistenciaTipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId AND 

      DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,1)BETWEEN 
          val.ValorLiquidacionDesde AND ISNULL(val.ValorLiquidacionHasta,'9999-12-31')
      
--      LEFT JOIN GrupoActividadObjetivo gap ON gap.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND  DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'28')  BETWEEN gap.GrupoActividadObjetivoDesde AND ISNULL(gap.GrupoActividadObjetivoHasta,'9999-12-31')

--      LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId

      LEFT JOIN (
		SELECT art14SX.PersonalArt14ObjetivoId, art14SX.PersonalId, SUM(art14SX.PersonalArt14SumaFija) PersonalArt14SumaFija FROM 
			PersonalArt14 art14SX 
			WHERE art14SX.PersonalArt14FormaArt14 = 'S' AND art14SX.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(@1,@2,'01') >= art14SX.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(@1,@2,'02') <= ISNULL(art14SX.PersonalArt14AutorizadoHasta,'9999-12-31') ) AND  art14SX.PersonalArt14Anulacion IS NULL
			GROUP BY art14SX.PersonalArt14ObjetivoId, art14SX.PersonalId
		) art14s ON art14S.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14S.PersonalId = objd.ObjetivoAsistenciaMesPersonalId
      LEFT JOIN PersonalArt14 art14E ON art14E.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14E.PersonalId = objd.ObjetivoAsistenciaMesPersonalId   AND art14E.PersonalArt14FormaArt14 = 'E' AND art14E.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') >= art14E.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') <= ISNULL(art14E.PersonalArt14AutorizadoHasta,'9999-12-31') ) AND  art14E.PersonalArt14Anulacion IS NULL
      LEFT JOIN PersonalArt14 art14H ON art14H.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14H.PersonalId = objd.ObjetivoAsistenciaMesPersonalId   AND art14H.PersonalArt14FormaArt14 = 'H' AND art14H.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') >= art14H.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') <= ISNULL(art14H.PersonalArt14AutorizadoHasta,'9999-12-31') ) AND  art14H.PersonalArt14Anulacion IS NULL
      LEFT JOIN PersonalArt14 art14A ON art14A.PersonalArt14ObjetivoId = obj.ObjetivoId AND art14A.PersonalId = objd.ObjetivoAsistenciaMesPersonalId   AND art14A.PersonalArt14FormaArt14 = 'A' AND art14A.PersonalArt14Autorizado = 'S' AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') >= art14A.PersonalArt14AutorizadoDesde AND ( DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'02') <= ISNULL(art14A.PersonalArt14AutorizadoHasta,'9999-12-31') ) AND  art14A.PersonalArt14Anulacion IS NULL
      
      LEFT JOIN ValorLiquidacion valart14cat ON valart14cat.ValorLiquidacionSucursalId = suc.SucursalId AND valart14cat.ValorLiquidacionTipoAsociadoId = art14E.PersonalArt14TipoAsociadoId AND valart14cat.ValorLiquidacionCategoriaPersonalId = art14E.PersonalArt14CategoriaId AND 
      DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,1)BETWEEN 
      valart14cat.ValorLiquidacionDesde AND ISNULL(valart14cat.ValorLiquidacionHasta,'9999-12-31')
      
      LEFT JOIN CategoriaPersonal art14cat ON art14cat.TipoAsociadoId = art14E.PersonalArt14TipoAsociadoId AND art14cat.CategoriaPersonalId  = art14E.PersonalArt14CategoriaId 
--                LEFT JOIN ObjetivoHabilitacion objhab ON objhab.ObjetivoHabilitacionObjetivoId = obj.ObjetivoId
      
      WHERE obja.ObjetivoAsistenciaAnoAno = @1 
      AND objm.ObjetivoAsistenciaAnoMesMes = @2
      AND objd.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras IN ('N','C','R')

      ${extraFiltersStr}
`,
      [, anio, mes]
    );

    const TotalHorasReal = asistencia.map(row => { return (row.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras == 'N') ? row.totalhorascalc : 0 }).reduce((prev, curr) => prev + curr, 0)

    for (const row of asistencia) {
    }
    return { asistencia, TotalHorasReal }
  }

  static async getAsistenciaObjetivos(anio: number, mes: number, personalId: number[]) {
    const listPersonaId = (personalId.length == 0) ? '' : 'objd.ObjetivoAsistenciaMesPersonalId IN (' + personalId.join(',') + ')'
    const queryRunner = dataSource.createQueryRunner();
    const result = await AsistenciaController.getObjetivoAsistencia(anio, mes, [listPersonaId], queryRunner)
    return result.asistencia
  }

  async getAsistenciaPorPersona(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const personalId = req.params.personalId;
      const anio = req.params.anio;
      const mes = req.params.mes;
      var desde = new Date(anio, mes - 1, 1);

      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasGroup(req, 'Liquidaciones Consultas') && await this.hasAuthPersona(res, anio, mes, personalId, queryRunner) == false)
        throw new ClientException(`No tiene permiso para obtener información de asistencia`)

      const result = await AsistenciaController.getAsistenciaObjetivos(anio, mes, [personalId])

      const totalImporte = result.map(row => row.totalminutoscalcimporteconart14).reduce((prev, curr) => prev + curr, 0)
      const totalHoras = result.map(row => row.totalhorascalc).reduce((prev, curr) => prev + curr, 0)


      this.jsonRes({ asistencia: result, totalImporte, totalHoras }, res);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    }
  }
  async getCustodiasPorPersona(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const personalId = req.params.personalId;
      const anio = req.params.anio;
      const mes = req.params.mes;
      var desde = new Date(anio, mes - 1, 1);

      if (!await this.hasGroup(req, 'liquidaciones') &&  !await this.hasGroup(req, 'Liquidaciones Consultas') && await this.hasAuthPersona(res, anio, mes, personalId, queryRunner) == false)
        throw new ClientException(`No tiene permiso para obtener información de asistencia`)

      const result = await CustodiaController.listPersonalCustodiaQuery({ filtros: [{ index: "ApellidoNombre", valor: [personalId], operador: "=", condition: "AND" }] }, queryRunner, anio, mes, 0)

      const totalImporte = result.map(row => row.importe).reduce((prev, curr) => prev + curr, 0)
      const totalHoras = result.map(row => row.horas).reduce((prev, curr) => prev + curr, 0)

      this.jsonRes({ custodias: result, totalImporte, totalHoras }, res);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    }
  }

  async getDescuentosPerPorObjetivo(req: any, res: Response, next: NextFunction) {
    try {
      const objetivoId = req.params.objetivoId;
      const anio = req.params.anio;
      const mes = req.params.mes;
      let personalId: number[] = []

      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasGroup(req, 'Liquidaciones Consultas') && !await this.hasAuthObjetivo(anio, mes, res, Number(objetivoId), dataSource))
        throw new ClientException(`No tiene permisos para listar descuentos de personal del objetivo`)

      const personas = await dataSource.query(
        `SELECT DISTINCT 
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
                
-- aca2
                LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
                LEFT JOIN ValorLiquidacion val ON val.ValorLiquidacionSucursalId = suc.SucursalId AND val.ValorLiquidacionTipoAsociadoId = objd.ObjetivoAsistenciaTipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId AND 
                
                DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,1)BETWEEN 
                    val.ValorLiquidacionDesde AND ISNULL(val.ValorLiquidacionHasta,'9999-12-31')
                
                LEFT JOIN GrupoActividadObjetivo gap ON gap.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND  DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'28')  BETWEEN gap.GrupoActividadObjetivoDesde AND ISNULL(gap.GrupoActividadObjetivoHasta,'9999-12-31') 
                LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId
                
                
                WHERE obja.ObjetivoAsistenciaAnoAno = @1 
                AND objm.ObjetivoAsistenciaAnoMesMes = @2 
                AND obj.ObjetivoId = @0 

                `,
        [objetivoId, anio, mes]
      )

      for (const row of personas)
        personalId.push(row.PersonalId)


      if (personalId.length > 0) {

        const result = await AsistenciaController.getDescuentos(anio, mes, personalId)
        this.jsonRes(result, res);
      } else
        this.jsonRes([], res)


    } catch (error) {
      //      await this.rollbackTransaction(queryRunner)
      return next(error)
    }
  }

  async getAsistenciaPorObjetivo(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();

    try {
      const objetivoId = req.params.objetivoId;
      const anio = req.params.anio;
      const mes = req.params.mes;
      var desde = new Date(anio, mes - 1, 1);


      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasGroup(req, 'Liquidaciones Consultas') && !await this.hasAuthObjetivo(anio, mes, res, Number(objetivoId), queryRunner))
        throw new ClientException(`No tiene permisos para realizar consulta de asistencia por objetivo`)

      const result = await AsistenciaController.getObjetivoAsistencia(anio, mes, [`obj.ObjetivoId = ${objetivoId}`], queryRunner)

      const totalImporte = result.asistencia.map(row => row.totalminutoscalcimporteconart14).reduce((prev, curr) => prev + curr, 0)
      const totalHoras = result.asistencia.map(row => row.totalhorascalc).reduce((prev, curr) => prev + curr, 0)
      const totalHorasN = result.asistencia.map(row => { return (row.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras == 'N') ? row.totalhorascalc : 0 }).reduce((prev, curr) => prev + curr, 0)
      const totalHorasC = result.asistencia.map(row => { return (row.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras == 'C') ? row.totalhorascalc : 0 }).reduce((prev, curr) => prev + curr, 0)
      const totalHorasR = result.asistencia.map(row => { return (row.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras == 'R') ? row.totalhorascalc : 0 }).reduce((prev, curr) => prev + curr, 0)


      this.jsonRes({ asistencia: result.asistencia, totalImporte, totalHoras, totalHorasN, totalHorasC, totalHorasR }, res);

    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    }
  }

  static getMetodologias() {
    const recordSet = new Array();
    recordSet.push({
      id: "F",
      metodo: "S",
      descripcion: "Fiestas Importe Adicional",
      etiqueta: "Imp. Adicional Fiesta",
    });

    recordSet.push({
      id: "S",
      metodo: "S",
      descripcion: "Monto fijo a sumar",
      etiqueta: "Imp. Adicional",
    });
    recordSet.push({
      id: "E",
      metodo: "E",
      descripcion: "Equivalencia de categoría",
      etiqueta: "Equivalencia",
    });
    recordSet.push({
      id: "A",
      metodo: "A",
      descripcion: "Monto adicional por hora",
      etiqueta: "Imp. Adicional Hora",
    });

    recordSet.push({
      id: "H",
      metodo: "H",
      descripcion: "Se suman a las cargadas",
      etiqueta: "Horas adicionales",
    });

    return recordSet
  }

  async getMetodologia(req: any, res: Response, next: NextFunction) {
    this.jsonRes(AsistenciaController.getMetodologias(), res);
  }

  async addOrUpdateAsistencia(queryRunner: QueryRunner, personalIdExiste: number, objetivoId: number, anioId: number, mesId: number, mes: number, personalId: number, tipoAsociadoId: number, categoriaPersonalId: number, formaLiquidacion: string, columnsDays: string, columnsDay: string, valueColumnsDays: string, totalhs: number, row: any) {

    let newAsistenciaPersonalDiasId = 0

    const num = Math.round(totalhs % 1 * 60)
    let min = ''
    if (num < 10)
      min = '0' + num.toString()
    else
      min = num.toString()
    const horas = Math.trunc(totalhs).toString()

    if (!personalIdExiste) {

      const objAsistenciaUltsNros = await queryRunner.query(`
      SELECT ObjetivoAsistenciaAnoMesPersonalUltNro, ObjetivoAsistenciaAnoMesDiasPersonalUltNro, ObjetivoAsistenciaAnoMesPersonalDiasUltNro 
      FROM ObjetivoAsistenciaAnoMes
      WHERE ObjetivoAsistenciaAnoMesId = @2
      AND ObjetivoAsistenciaAnoId = @1
      AND ObjetivoId = @0`,
        [objetivoId, anioId, mesId])
      newAsistenciaPersonalDiasId = objAsistenciaUltsNros[0].ObjetivoAsistenciaAnoMesPersonalDiasUltNro + 1
      const newAsistenciaDiasPersonalId = objAsistenciaUltsNros[0].ObjetivoAsistenciaAnoMesDiasPersonalUltNro + 1
      const newAsistenciaPersonalAsignadoId = objAsistenciaUltsNros[0].ObjetivoAsistenciaAnoMesPersonalUltNro + 1
      await queryRunner.query(`
      INSERT INTO ObjetivoAsistenciaAnoMesPersonalDias (ObjetivoAsistenciaAnoMesPersonalDiasId, ObjetivoAsistenciaAnoMesId, ObjetivoAsistenciaAnoId, ObjetivoId, ObjetivoAsistenciaMesPersonalId, ObjetivoAsistenciaTipoAsociadoId, ObjetivoAsistenciaCategoriaPersonalId, ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras ${columnsDays}, ObjetivoAsistenciaAnoMesPersonalDiasTotalGral, ObjetivoAsistenciaAnoMesPersonalAsignadoSu2Id)
      VALUES (
        ${newAsistenciaPersonalDiasId}, @2, @1, @0, @3, @4, @5, @6${valueColumnsDays}, @7, ${newAsistenciaPersonalDiasId})
      DELETE FROM ObjetivoAsistenciaMesDiasPersonal WHERE ObjetivoAsistenciaMesDiasPersonalId=${newAsistenciaPersonalAsignadoId} AND ObjetivoAsistenciaAnoMesId=@2 AND ObjetivoAsistenciaAnoId=@1 AND ObjetivoId=@0
      INSERT INTO ObjetivoAsistenciaMesDiasPersonal (ObjetivoAsistenciaMesDiasPersonalId, ObjetivoAsistenciaAnoMesId, ObjetivoAsistenciaAnoId, ObjetivoId, ObjetivoAsistenciaMesPersonalId, ObjetivoAsistenciaTipoAsociadoId, ObjetivoAsistenciaCategoriaPersonalId, ObjetivoAsistenciaMesDiasPersonalFormaLiquidacionHoras ${columnsDay}, ObjetivoAsistenciaAnoMesPersonalDiaTotalGral, ObjetivoAsistenciaAnoMesPersonalAsignadoSuId)
      VALUES (
        ${newAsistenciaDiasPersonalId}, @2, @1, @0, @3, @4, @5, @6${valueColumnsDays}, @7, ${newAsistenciaDiasPersonalId})
      DELETE FROM ObjetivoAsistenciaAnoMesPersonalAsignado WHERE ObjetivoAsistenciaAnoMesPersonalAsignadoId=${newAsistenciaPersonalAsignadoId} AND ObjetivoAsistenciaAnoMesId=@2 AND ObjetivoAsistenciaAnoId=@1 AND ObjetivoId=@0
      INSERT INTO ObjetivoAsistenciaAnoMesPersonalAsignado (ObjetivoAsistenciaAnoMesPersonalAsignadoId, ObjetivoAsistenciaAnoMesId, ObjetivoAsistenciaAnoId, ObjetivoId, ObjetivoAsistenciaMesPersonalId, ObjetivoAsistenciaTipoAsociadoId, ObjetivoAsistenciaCategoriaPersonalId, ObjetivoAsistenciaAnoMesPersonalAsignadoFormaLiquidacionHoras, ObjetivoAsistenciaAnoMesPersonalAsignadoIngresaPersonal)
      VALUES (
        ${newAsistenciaPersonalAsignadoId}, @2, @1, @0, @3, @4, @5, @6, 'P')`,
        [objetivoId, anioId, mesId, personalId, tipoAsociadoId, categoriaPersonalId, formaLiquidacion, `${horas}.${min}`]
      )

      await queryRunner.query(
        `UPDATE ObjetivoAsistenciaAnoMes 
      SET ObjetivoAsistenciaAnoMesPersonalDiasUltNro = @4, ObjetivoAsistenciaAnoMesPersonalUltNro = @5 , ObjetivoAsistenciaAnoMesDiasPersonalUltNro = @6
      WHERE ObjetivoAsistenciaAnoMesId = @3 AND ObjetivoId = @0 AND ObjetivoAsistenciaAnoId = @1 AND ObjetivoAsistenciaAnoMesMes = @2`,
        [objetivoId, anioId, mes, mesId, newAsistenciaPersonalDiasId, newAsistenciaPersonalAsignadoId, newAsistenciaDiasPersonalId]
      )
    } else {
      const asistencia = await queryRunner.query(`
        SELECT 
          objp.ObjetivoAsistenciaAnoMesPersonalDiasId,
          objp.ObjetivoAsistenciaAnoId,
          objp.ObjetivoAsistenciaAnoMesId,
          objp.ObjetivoId,
          objp.ObjetivoAsistenciaMesPersonalId,
          objp.ObjetivoAsistenciaTipoAsociadoId,
          objp.ObjetivoAsistenciaCategoriaPersonalId,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias1Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias1Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias2Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias2Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias3Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias3Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias4Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias4Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias5Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias5Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias6Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias6Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias7Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias7Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias8Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias8Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias9Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias9Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias10Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias10Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias11Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias11Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias12Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias12Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias13Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias13Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias14Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias14Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias15Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias15Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias16Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias16Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias17Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias17Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias18Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias18Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias19Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias19Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias20Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias20Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias21Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias21Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias22Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias22Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias23Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias23Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias24Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias24Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias25Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias25Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias26Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias26Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias27Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias27Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias28Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias28Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias29Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias29Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias30Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias30Gral,
          TRIM(ISNULL(objp.ObjetivoAsistenciaAnoMesPersonalDias31Gral,'')) ObjetivoAsistenciaAnoMesPersonalDias31Gral,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia1,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia2,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia3,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia4,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia5,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia6,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia7,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia8,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia9,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia10,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia11,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia12,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia13,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia14,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia15,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia16,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia17,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia18,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia19,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia20,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia21,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia22,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia23,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia24,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia25,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia26,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia27,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia28,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia29,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia30,
          objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia31,

          1
        FROM ObjetivoAsistenciaAnoMesPersonalDias objp
        WHERE objp.ObjetivoAsistenciaAnoMesPersonalDiasId = @0 AND objp.ObjetivoAsistenciaAnoId=@1 AND objp.ObjetivoAsistenciaAnoMesId=@2 AND objp.ObjetivoId=@3  
      `, [personalIdExiste, anioId, mesId, objetivoId])


      await this.deleteAsistencia(objetivoId, anioId, mesId, personalIdExiste, queryRunner)


      for (let daynum = 1; daynum <= 31; daynum++) {
        const horas = row['day' + daynum]
        if (horas) {
          const horafrac = horas - Math.trunc(horas)
          const h = String(Math.trunc(horas))
          const m = String(60 * horafrac)
          row['day' + daynum] = `${h.padStart(2, '0')}.${m.padStart(2, '0')}`
        } else
          row['day' + daynum] = ''
      }

      await queryRunner.query(`
      INSERT INTO ObjetivoAsistenciaAnoMesPersonalDias (ObjetivoAsistenciaAnoMesPersonalDiasId, ObjetivoAsistenciaAnoMesId, ObjetivoAsistenciaAnoId, ObjetivoId, ObjetivoAsistenciaMesPersonalId, ObjetivoAsistenciaTipoAsociadoId, ObjetivoAsistenciaCategoriaPersonalId, ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras ${columnsDays}, ObjetivoAsistenciaAnoMesPersonalDiasTotalGral, ObjetivoAsistenciaAnoMesPersonalAsignadoSu2Id,
      ObjetivoAsistenciaAnoMesPersonalDiasFormaDia1,ObjetivoAsistenciaAnoMesPersonalDiasFormaDia2,ObjetivoAsistenciaAnoMesPersonalDiasFormaDia3,ObjetivoAsistenciaAnoMesPersonalDiasFormaDia4,ObjetivoAsistenciaAnoMesPersonalDiasFormaDia5,ObjetivoAsistenciaAnoMesPersonalDiasFormaDia6,
      ObjetivoAsistenciaAnoMesPersonalDiasFormaDia7,ObjetivoAsistenciaAnoMesPersonalDiasFormaDia8,ObjetivoAsistenciaAnoMesPersonalDiasFormaDia9,ObjetivoAsistenciaAnoMesPersonalDiasFormaDia10,ObjetivoAsistenciaAnoMesPersonalDiasFormaDia11,ObjetivoAsistenciaAnoMesPersonalDiasFormaDia12,
      ObjetivoAsistenciaAnoMesPersonalDiasFormaDia13,ObjetivoAsistenciaAnoMesPersonalDiasFormaDia14,ObjetivoAsistenciaAnoMesPersonalDiasFormaDia15,ObjetivoAsistenciaAnoMesPersonalDiasFormaDia16,ObjetivoAsistenciaAnoMesPersonalDiasFormaDia17,ObjetivoAsistenciaAnoMesPersonalDiasFormaDia18,
      ObjetivoAsistenciaAnoMesPersonalDiasFormaDia19,ObjetivoAsistenciaAnoMesPersonalDiasFormaDia20,ObjetivoAsistenciaAnoMesPersonalDiasFormaDia21,ObjetivoAsistenciaAnoMesPersonalDiasFormaDia22,ObjetivoAsistenciaAnoMesPersonalDiasFormaDia23,ObjetivoAsistenciaAnoMesPersonalDiasFormaDia24,
      ObjetivoAsistenciaAnoMesPersonalDiasFormaDia25,ObjetivoAsistenciaAnoMesPersonalDiasFormaDia26,ObjetivoAsistenciaAnoMesPersonalDiasFormaDia27,ObjetivoAsistenciaAnoMesPersonalDiasFormaDia28,ObjetivoAsistenciaAnoMesPersonalDiasFormaDia29,ObjetivoAsistenciaAnoMesPersonalDiasFormaDia30,
      ObjetivoAsistenciaAnoMesPersonalDiasFormaDia31)
      VALUES (
        @8, @2, @1, @0, @3, @4, @5, @6${valueColumnsDays}, @7, @8, @9, @10, @11, @12, @13, @14, @15, @16, @17, @18, @19, @20, @21, @22, @23, @24, @25, @26, @27, @28, @29, @30, @31, @32, @33, @34, @35, @36, @37, @38, @39 )
      INSERT INTO ObjetivoAsistenciaMesDiasPersonal (ObjetivoAsistenciaMesDiasPersonalId, ObjetivoAsistenciaAnoMesId, ObjetivoAsistenciaAnoId, ObjetivoId, ObjetivoAsistenciaMesPersonalId, ObjetivoAsistenciaTipoAsociadoId, ObjetivoAsistenciaCategoriaPersonalId, ObjetivoAsistenciaMesDiasPersonalFormaLiquidacionHoras ${columnsDay}, ObjetivoAsistenciaAnoMesPersonalDiaTotalGral, ObjetivoAsistenciaAnoMesPersonalAsignadoSuId,
            ObjetivoAsistenciaAnoMesPersonalFormaDia1,ObjetivoAsistenciaAnoMesPersonalFormaDia2,ObjetivoAsistenciaAnoMesPersonalFormaDia3,ObjetivoAsistenciaAnoMesPersonalFormaDia4,ObjetivoAsistenciaAnoMesPersonalFormaDia5,ObjetivoAsistenciaAnoMesPersonalFormaDia6,
      ObjetivoAsistenciaAnoMesPersonalFormaDia7,ObjetivoAsistenciaAnoMesPersonalFormaDia8,ObjetivoAsistenciaAnoMesPersonalFormaDia9,ObjetivoAsistenciaAnoMesPersonalFormaDia10,ObjetivoAsistenciaAnoMesPersonalFormaDia11,ObjetivoAsistenciaAnoMesPersonalFormaDia12,
      ObjetivoAsistenciaAnoMesPersonalFormaDia13,ObjetivoAsistenciaAnoMesPersonalFormaDia14,ObjetivoAsistenciaAnoMesPersonalFormaDia15,ObjetivoAsistenciaAnoMesPersonalFormaDia16,ObjetivoAsistenciaAnoMesPersonalFormaDia17,ObjetivoAsistenciaAnoMesPersonalFormaDia18,
      ObjetivoAsistenciaAnoMesPersonalFormaDia19,ObjetivoAsistenciaAnoMesPersonalFormaDia20,ObjetivoAsistenciaAnoMesPersonalFormaDia21,ObjetivoAsistenciaAnoMesPersonalFormaDia22,ObjetivoAsistenciaAnoMesPersonalFormaDia23,ObjetivoAsistenciaAnoMesPersonalFormaDia24,
      ObjetivoAsistenciaAnoMesPersonalFormaDia25,ObjetivoAsistenciaAnoMesPersonalFormaDia26,ObjetivoAsistenciaAnoMesPersonalFormaDia27,ObjetivoAsistenciaAnoMesPersonalFormaDia28,ObjetivoAsistenciaAnoMesPersonalFormaDia29,ObjetivoAsistenciaAnoMesPersonalFormaDia30,
      ObjetivoAsistenciaAnoMesPersonalFormaDia31)
      VALUES (
        @8, @2, @1, @0, @3, @4, @5, @6${valueColumnsDays}, @7, @8,  @9, @10, @11, @12, @13, @14, @15, @16, @17, @18, @19, @20, @21, @22, @23, @24, @25, @26, @27, @28, @29, @30, @31, @32, @33, @34, @35, @36, @37, @38, @39)
      INSERT INTO ObjetivoAsistenciaAnoMesPersonalAsignado (ObjetivoAsistenciaAnoMesPersonalAsignadoId, ObjetivoAsistenciaAnoMesId, ObjetivoAsistenciaAnoId, ObjetivoId, ObjetivoAsistenciaMesPersonalId, ObjetivoAsistenciaTipoAsociadoId, ObjetivoAsistenciaCategoriaPersonalId, ObjetivoAsistenciaAnoMesPersonalAsignadoFormaLiquidacionHoras, ObjetivoAsistenciaAnoMesPersonalAsignadoIngresaPersonal)
      VALUES (
        @8, @2, @1, @0, @3, @4, @5, @6, 'P')`,
        [objetivoId, anioId, mesId, personalId, tipoAsociadoId, categoriaPersonalId, formaLiquidacion, `${horas}.${min}`, personalIdExiste,
          (row.day1 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias1Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia1,
          (row.day2 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias2Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia2,
          (row.day3 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias3Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia3,
          (row.day4 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias4Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia4,
          (row.day5 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias5Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia5,
          (row.day6 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias6Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia6,
          (row.day7 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias7Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia7,
          (row.day8 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias8Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia8,
          (row.day9 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias9Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia9,
          (row.day10 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias10Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia10,
          (row.day11 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias11Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia11,
          (row.day12 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias12Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia12,
          (row.day13 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias13Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia13,
          (row.day14 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias14Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia14,
          (row.day15 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias15Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia15,
          (row.day16 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias16Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia16,
          (row.day17 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias17Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia17,
          (row.day18 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias18Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia18,
          (row.day19 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias19Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia19,
          (row.day20 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias20Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia20,
          (row.day21 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias21Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia21,
          (row.day22 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias22Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia22,
          (row.day23 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias23Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia23,
          (row.day24 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias24Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia24,
          (row.day25 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias25Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia25,
          (row.day26 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias26Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia26,
          (row.day27 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias27Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia27,
          (row.day28 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias28Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia28,
          (row.day29 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias29Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia29,
          (row.day30 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias30Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia30,
          (row.day31 != asistencia[0].ObjetivoAsistenciaAnoMesPersonalDias31Gral) ? 'MA' : asistencia[0].ObjetivoAsistenciaAnoMesPersonalDiasFormaDia31
        ]
      )
    }
    return newAsistenciaPersonalDiasId
  }



  async addAsistencia(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const usuario = res.locals.userName
    const ip = this.getRemoteAddress(req)

    try {
      await queryRunner.startTransaction()
      const anio: number = req.body.year
      const mes: number = req.body.month
      const objetivoId: number = req.body.objetivoId

      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasAuthObjetivo(anio, mes, res, Number(req.body.objetivoId), queryRunner) && !await this.hasAuthCargaDirecta(anio, mes, res, Number(req.body.objetivoId), queryRunner))
        throw new ClientException(`No tiene permisos para grabar/modificar asistencia`)


      //Validación de los datos ingresados
      if (!req.body.personalId || !req.body.formaLiquidacion || !req.body.categoriaPersonalId || !req.body.tipoAsociadoId)
        throw new ClientException(`Los campos de Persona, Forma y Categoria NO pueden estar vacios`)

      //Validación de Objetivo
      const valObjetivo = await AsistenciaController.checkAsistenciaObjetivo(objetivoId, anio, mes, queryRunner)
      if (valObjetivo instanceof ClientException)
        throw valObjetivo
      const anioId = valObjetivo[0].ObjetivoAsistenciaAnoId
      const mesId = valObjetivo[0].ObjetivoAsistenciaAnoMesId
      const sucursalId = valObjetivo[0].SucursalId

      //Validación Categoria del Personal
      const valCategoriaPersonal: any = await this.valCategoriaPersonal(req.body, sucursalId, queryRunner)
      if (valCategoriaPersonal instanceof ClientException) {
        if (!valCategoriaPersonal.extended.categoria)
          throw valCategoriaPersonal
        req.body.tipoAsociadoId = valCategoriaPersonal.extended.categoria.tipoId
        req.body.categoriaPersonalId = valCategoriaPersonal.extended.categoria.id
      }



      //Validación de Personal ya registrado
      let personal: any = null
      const valPersonalRegistrado = await this.valPersonalRegistrado(req.body, queryRunner)


      if (valPersonalRegistrado instanceof ClientException) {
        if (!valPersonalRegistrado.extended.forma) {
          if (valCategoriaPersonal instanceof ClientException && valCategoriaPersonal.extended.categoria)
            valPersonalRegistrado.extended.categoria = valCategoriaPersonal.extended.categoria
          throw valPersonalRegistrado

        }
        req.body.formaLiquidacion = valPersonalRegistrado.extended.forma.id
        personal = valPersonalRegistrado.extended.personal

      } else {

        personal = valPersonalRegistrado

        if (Number(personal?.total) == 0 || personal?.total==null) {
          const perUltRecibo = await queryRunner.query(`SELECT TOP 1 *, EOMONTH(DATEFROMPARTS(anio, mes, 1)) AS FechaCierre FROM lige.dbo.liqmaperiodo WHERE ind_recibos_generados = 1 ORDER BY anio DESC, mes DESC `)

          const bot = await AccesoBotController.getBotStatus(perUltRecibo[0].anio, perUltRecibo[0].mes, queryRunner, [req.body.personalId])

          if (bot[0].visto != 1 && bot[0].doc_id > 0 && bot[0].visto_ant != 1 && bot[0].doc_id_ant > 0) {
            let errormsg: string[] = []

            if (bot[0].registrado == 0) {
              errormsg.push(`No se puede cargar horas, la persona no se encuentra registrada en el Bot`)
            } else {
              const msgRecPend = `No se puede cargar horas, recibos no vistos:  ` + bot[0].descarga + ((bot[0].mes_ant) ? `, ${bot[0].descarga_ant}` : '')
              errormsg.push(msgRecPend)

              const sendit = await AccesoBotController.enqueBotMsg(req.body.personalId, `Recuerde descargar el recibo ${perUltRecibo[0].mes}/${perUltRecibo[0].anio}, se encuentra disponible`, `RECIBO${bot[0].doc_id}`, usuario, ip)
              if (sendit) errormsg.push('Se envió notificación a la persona recordando que descargue el recibo')
            }
            throw new ClientException(errormsg)
          }
        }

      }

      //Validaciónes de los días del mes

      const valsDiasMes = await this.valsDiasMes(req.body, queryRunner, personal)
      if (valsDiasMes instanceof ClientException) {
        throw valsDiasMes
      }

      let columnsDays = valsDiasMes.columnsDays
      let columnsDay = valsDiasMes.columnsDay
      let valueColumnsDays = valsDiasMes.valueColumnsDays
      let totalhs = valsDiasMes.totalhs

      const gridId: number = req.body.id
      const personalId: number = req.body.personalId
      const tipoAsociadoId: number = req.body.tipoAsociadoId
      const categoriaPersonalId: number = req.body.categoriaPersonalId
      const formaLiquidacion: string = req.body.formaLiquidacion

      if (!totalhs && personal?.id) {
        await this.deleteAsistencia(objetivoId, anioId, mesId, personal.id, queryRunner)
        await queryRunner.commitTransaction()
        return this.jsonRes({ deleteRowId: gridId }, res);
      }

      /*
            let num = Math.round(totalhs % 1 * 60)
            let min = ''
            if (num < 10)
              min = '0' + num.toString()
            else
              min = num.toString()
            const horas = Math.trunc(totalhs).toString()
            //req.body.total = `${horas}.${min}`
      */
      let result: any = {}
      result.newRowId = await this.addOrUpdateAsistencia(queryRunner, personal?.id, objetivoId, anioId, mesId, mes, personalId, tipoAsociadoId, categoriaPersonalId, formaLiquidacion, columnsDays, columnsDay, valueColumnsDays, totalhs, req.body)
      if (valCategoriaPersonal instanceof ClientException && valCategoriaPersonal.extended.categoria)
        result.categoria = valCategoriaPersonal.extended.categoria
      if (valPersonalRegistrado instanceof ClientException && valPersonalRegistrado.extended.forma)
        result.forma = valPersonalRegistrado.extended.forma
      await queryRunner.commitTransaction()
      return this.jsonRes(result, res);
    } catch (error) {

      await this.rollbackTransaction(queryRunner)

      return next(error)
    } finally {
      await queryRunner.release()
    }

  }

  deleteAsistencia(objetivoId: number, anioId: number, mesId: number, personalId: number, queryRunner: QueryRunner) {
    return queryRunner.query(`
          DELETE ObjetivoAsistenciaAnoMesPersonalDias
          WHERE ObjetivoAsistenciaAnoMesPersonalDiasId = @3
          AND ObjetivoId = @0 
          AND ObjetivoAsistenciaAnoId = @1 
          AND ObjetivoAsistenciaAnoMesId = @2
          DELETE ObjetivoAsistenciaMesDiasPersonal
          WHERE ObjetivoAsistenciaMesDiasPersonalId = @3
          AND ObjetivoId = @0 
          AND ObjetivoAsistenciaAnoId = @1 
          AND ObjetivoAsistenciaAnoMesId = @2
          DELETE ObjetivoAsistenciaAnoMesPersonalAsignado
          WHERE ObjetivoAsistenciaAnoMesPersonalAsignadoId = @3
          AND ObjetivoId = @0 
          AND ObjetivoAsistenciaAnoId = @1
          AND ObjetivoAsistenciaAnoMesId = @2`,
      [objetivoId, anioId, mesId, personalId]
    )
  }

  async valPersonalRegistrado(item: any, queryRunner: QueryRunner) {
    const anio: number = item.year
    const mes: number = item.month
    const objetivoId: number = item.objetivoId
    const rowId: number = item.dbid
    const personalId: number = item.personalId
    const tipoAsociadoId: number = item.tipoAsociadoId
    const categoriaPersonalId: number = item.categoriaPersonalId
    const formaLiquidacion: string = item.formaLiquidacion
    let formas = await this.getTiposHoraQuery()
    let formasEncontradas = []
    let forma = null

    const lista = await this.listaAsistenciaPersonalAsignado(objetivoId, anio, mes, queryRunner)

    let personal: any = null
    let personalRegistrado: any = null
    lista.forEach((obj: any) => {
      if (obj.id == rowId)
        personal = obj
      if (obj.id != rowId && obj.apellidoNombre.id == personalId && obj.categoria.id == categoriaPersonalId && obj.categoria.tipoId == tipoAsociadoId) {
        formasEncontradas.push(obj.forma.id)
        if (obj.forma.id == formaLiquidacion)
          personalRegistrado = obj
      }
    })
    if (personalRegistrado) {
      //return new ClientException(`La persona ya tiene un registro existente en el objetivo con misma forma y categoría`, {})
      let data = {}
      forma = formas.find((obj: any) => !formasEncontradas.includes(obj.TipoHoraId))
      if (forma && !(personal && personal.apellidoNombre.id == personalId && personal.categoria.id == categoriaPersonalId && personal.categoria.tipoId == tipoAsociadoId && !formasEncontradas.includes(personal.forma.id))) {
        data = {
          personal,
          /*
          forma: {
            id: forma.TipoHoraId,
            fullName: forma.Descripcion,
          }
          */
        }
      }
      return new ClientException(`La persona ya tiene un registro existente en el objetivo con misma forma y categoría`, data)
    }
    return personal
  }

  async valCategoriaPersonal(item: any, sucursalId: number, queryRunner: QueryRunner) {
    const anio: number = item.year
    const mes: number = item.month
    const personalId: number = item.personalId
    const tipoAsociadoId: number = item.tipoAsociadoId
    const categoriaPersonalId: number = item.categoriaPersonalId

    const categorias = await this.getCategoriasPorPersonaQuery(anio, mes, personalId, sucursalId, queryRunner)
    const filterres = categorias.filter((cat: any) => cat.TipoAsociadoId == tipoAsociadoId && cat.PersonalCategoriaCategoriaPersonalId == categoriaPersonalId && cat.ValorLiquidacionHoraNormal)

    if (filterres.length == 0) {
      const cateDisponible: any = categorias.find((cat: any) => cat.ValorLiquidacionHoraNormal)
      let data = {}
      if (categorias.length && cateDisponible) {
        data = {
          categoria: {
            fullName: `${cateDisponible.CategoriaPersonalDescripcion.trim()} ${(cateDisponible.ValorLiquidacionHorasTrabajoHoraNormal > 0) ? cateDisponible.ValorLiquidacionHorasTrabajoHoraNormal : ''}`,
            id: cateDisponible.PersonalCategoriaCategoriaPersonalId,
            tipoFullName: cateDisponible.TipoAsociadoDescripcion,
            tipoId: cateDisponible.TipoAsociadoId,
            horasRecomendadas: cateDisponible.ValorLiquidacionHorasTrabajoHoraNormal
          }
        }
        return new ClientException(`Se actualizó la categoría de la persona`, data)
      }
      return new ClientException(`La categoría no se encuentra habilitada para la persona`, data)
    }
    return null
  }

  async valsDiasMes(item: any, queryRunner: QueryRunner, comparar: any = null) {
    const anio: number = item.year
    const mes: number = item.month
    const objetivoId: number = item.objetivoId
    const rowId: number = item.dbid
    const personalId: number = item.personalId
    const tipoAsociadoId: number = item.tipoAsociadoId
    const categoriaPersonalId: number = item.categoriaPersonalId
    const formaLiquidacion: string = item.formaLiquidacion
    let errores: any[] = []

    //Validación de Licencias
    const licencias = await this.getLicenciasPorPersonaQuery(anio, mes, personalId, queryRunner)

    //Validación de Personal Situación de Revista
    const situacionesRevista = await queryRunner.query(`
    SELECT sit.PersonalSituacionRevistaId, sit.PersonalSituacionRevistaSituacionId, sr.SituacionRevistaDescripcion, sit.PersonalSituacionRevistaDesde desde, ISNULL(sit.PersonalSituacionRevistaHasta,'9999-12-31') hasta
    FROM PersonalSituacionRevista sit
    JOIN SituacionRevista sr ON sr.SituacionRevistaId = sit.PersonalSituacionRevistaSituacionId 
    WHERE sit.PersonalId = @0  AND sit.PersonalSituacionRevistaSituacionId NOT IN (2,5,11,12,20,26) -- (2,4,5,6,10,11,12,20,23,26)
    AND sit.PersonalSituacionRevistaDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) 
    AND ISNULL(sit.PersonalSituacionRevistaHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1) 

      `, [personalId, anio, mes]
    )

    //Validación de Personal total de horas por dia
    let querydias = ''
    for (let index = 1; index <= 31; index++)
      querydias = querydias + `, SUM(CAST(LEFT(ObjetivoAsistenciaAnoMesPersonalDias${index}Gral,2) AS INT) + CAST(RIGHT(TRIM(ObjetivoAsistenciaAnoMesPersonalDias${index}Gral),2) AS INT) / CAST(60 AS FLOAT)) day${index}`

    const totalhsxdia = await queryRunner.query(`
      SELECT objp.ObjetivoAsistenciaMesPersonalId personalId
      ${querydias}
      FROM ObjetivoAsistenciaAnoMesPersonalDias objp
      INNER JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objp.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objp.ObjetivoId 
      INNER JOIN ObjetivoAsistenciaAnoMes objm  ON objm.ObjetivoAsistenciaAnoMesId = objp.ObjetivoAsistenciaAnoMesId AND objm.ObjetivoAsistenciaAnoId = objp.ObjetivoAsistenciaAnoId AND objm.ObjetivoId = objp.ObjetivoId
      WHERE objp.ObjetivoAsistenciaMesPersonalId = @0 
      AND obja.ObjetivoAsistenciaAnoAno = @1
      AND objm.ObjetivoAsistenciaAnoMesMes = @2
      -- AND objp.ObjetivoAsistenciaTipoAsociadoId != @3
      -- AND objp.ObjetivoAsistenciaCategoriaPersonalId != @4
      -- AND  objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras != @5
      AND objp.ObjetivoAsistenciaAnoMesPersonalDiasId <> @6
      GROUP BY objp.ObjetivoAsistenciaMesPersonalId
      `, [personalId, anio, mes, tipoAsociadoId, categoriaPersonalId, formaLiquidacion, rowId]
    )
    let keepvalue = false
    //Validación de horas dentro del perido de contrato
    let periodoContrato = await ObjetivoController.getObjetivoContratos(objetivoId, anio, mes, queryRunner)

    let columnsDays = ''
    let columnsDay = ''
    let valueColumnsDays = ''
    let totalhs = 0
    let numdia = ''
    let fecha
    for (const key in item) {
      if (key.startsWith('day')) {
        numdia = key.slice(3)
        const horas = Number(item[key])
        columnsDays = columnsDays + `, ObjetivoAsistenciaAnoMesPersonalDias${numdia}Gral`
        columnsDay = columnsDay + `, ObjetivoAsistenciaAnoMesPersonalDia${numdia}Gral`
        if (!horas) {
          valueColumnsDays = valueColumnsDays + `, NULL`
        } else {

          if (comparar && comparar.apellidoNombre.id == personalId && comparar.categoria.id == categoriaPersonalId && comparar.categoria.tipoId == tipoAsociadoId && item[key] == comparar[key]) {
            continue
          }
          //VALIDACIONES

          fecha = new Date(`${anio}-${mes}-${numdia} 0:0:0`)
          //Validación Licencia



          const licencia = licencias.find((fechas: any) => (fechas.desde <= fecha && fechas.hasta >= fecha))
          if (licencia && (formaLiquidacion != 'A')) {
            errores.push(`La persona se encuentra de licencia desde ${this.dateOutputFormat(licencia.desde)} hasta ${this.dateOutputFormat(licencia.hasta2)}. dia:${numdia} horas:${horas}`)
            keepvalue = true
          }

          if (formaLiquidacion == 'A' && !licencia) {
            errores.push(`La persona no se encuentra de licencia. dia:${numdia}`)
          }
          //Validación Situación de Revista
          const situacion = situacionesRevista.find((fechas: any) => (fechas.desde <= fecha && fechas.hasta >= fecha))
          if (situacion && (formaLiquidacion != 'A')) {
            errores.push(`La persona se encuentra en una situación de revista ${situacion.SituacionRevistaDescripcion} desde ${this.dateOutputFormat(situacion.desde)} hasta ${this.dateOutputFormat(situacion.hasta)}. dia:${numdia}`)
          }

          if (formaLiquidacion == 'A') {
            if (!situacion)
              errores.push(`La persona no se encuentra en una situación de revista para la forma seleccionada.  dia:${numdia}`)
            else if (situacion.PersonalSituacionRevistaSituacionId != 9)
              errores.push(`La persona se encuentra en una situación de revista ${situacion.SituacionRevistaDescripcion} desde ${this.dateOutputFormat(situacion.desde)} hasta ${this.dateOutputFormat(situacion.hasta)} no habilitada para carga de horas. dia:${numdia}`)
          }

          //Validación de Personal total de horas por dia
          if (totalhsxdia.length && (totalhsxdia[0][key] + horas) > 24.0) {
            // throw new ClientException(`La cantidad de horas por dia no puede superar las 24, cargadas previamente ${totalhsxdia[0][key]} horas`)
            errores.push(`La cantidad de horas por dia no puede superar las 24, cargadas previamente ${totalhsxdia[0][key]} horas`)
          }

          //Validación de horas dentro del perido de contrato
          const contrato = periodoContrato.find((fechas: any) => (fechas.desde <= fecha && fechas.hasta >= fecha))
          if (!contrato) {
            //throw new ClientException(`El dia ${numdia} no pertenece al periodo del contrato`)
            errores.push(`El dia${numdia} no pertenece al periodo del contrato`)
          }
          if (horas > 24) {
            // throw new ClientException(`La cantidad de horas no puede superar las 24`)
            errores.push(`La cantidad de horas no puede superar las 24`)
          }
          const horafrac = horas - Math.trunc(horas)

          if (horafrac != 0 && horafrac != 0.5) {
            // throw new ClientException(`La fracción de hora debe ser .5 únicamente, ej: 0.5; 8.5 `)
            errores.push(`La fracción de hora debe ser .5 únicamente, ej: 0.5; 8.5`)
          }

          const h = String(Math.trunc(horas))

          const m = String(60 * horafrac)
          valueColumnsDays = valueColumnsDays + `, '${h.padStart(2, '0')}.${m.padStart(2, '0')}'`
          totalhs = totalhs + horas

        }
      }
    }
    if (errores.length)
      return new ClientException(errores, { keepvalue })
    return { columnsDays, columnsDay, valueColumnsDays, totalhs }
  }

  async getListaAsistenciaPersonalAsignado(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      //      await queryRunner.startTransaction()
      const objetivoId = req.params.ObjetivoId;
      const anio = req.params.anio;
      const mes = req.params.mes;

      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasGroup(req, 'Liquidaciones Consultas') && !await this.hasAuthObjetivo(anio, mes, res, Number(objetivoId), queryRunner) &&
        !await this.hasAuthCargaDirecta(anio, mes, res, Number(objetivoId), queryRunner))
        throw new ClientException(`No tiene permisos para ver asistencia`)

      const lista = await this.listaAsistenciaPersonalAsignado(objetivoId, anio, mes, queryRunner)

      //      await queryRunner.commitTransaction()
      this.jsonRes(lista, res);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async listaAsistenciaPersonalAsignado(objetivoId: number, anio: number, mes: number, queryRunner: any, hasta: number = 31) {
    let dias = ''
    for (let index = 1; index <= hasta; index++)
      dias = dias + `, TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias${index}Gral) day${index}`

    let personal = await queryRunner.query(`
      SELECT objp.ObjetivoAsistenciaAnoMesPersonalDiasId id,
        objp.ObjetivoAsistenciaAnoMesPersonalDiasId dbid,
        objp.ObjetivoAsistenciaMesPersonalId PersonalId,
        CONCAT(TRIM(per.PersonalApellido) , ', ', TRIM(per.PersonalNombre), ' CUIT:' , cuit.PersonalCUITCUILCUIT) fullName,
        objp.ObjetivoAsistenciaTipoAsociadoId TipoAsociadoId,
        tipoas.TipoAsociadoDescripcion,
        objp.ObjetivoAsistenciaCategoriaPersonalId CategoriaId,
        catep.CategoriaPersonalDescripcion CategoriaDescripcion,
        val.ValorLiquidacionHorasTrabajoHoraNormal,
        objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras FormaLiquidacion
        ${dias}

      FROM ObjetivoAsistenciaAnoMesPersonalDias objp
        INNER JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objp.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objp.ObjetivoId AND obja.ObjetivoAsistenciaAnoAno = @1
        INNER JOIN ObjetivoAsistenciaAnoMes objm  ON objm.ObjetivoAsistenciaAnoMesId = objp.ObjetivoAsistenciaAnoMesId AND objm.ObjetivoAsistenciaAnoId = objp.ObjetivoAsistenciaAnoId AND objm.ObjetivoId = objp.ObjetivoId AND objm.ObjetivoAsistenciaAnoMesMes = @2
        INNER JOIN TipoAsociado tipoas ON tipoas.TipoAsociadoId = objp.ObjetivoAsistenciaTipoAsociadoId
        INNER JOIN CategoriaPersonal catep ON catep.TipoAsociadoId = objp.ObjetivoAsistenciaTipoAsociadoId AND catep.CategoriaPersonalId = objp.ObjetivoAsistenciaCategoriaPersonalId
        INNER JOIN Personal per ON per.PersonalId = objp.ObjetivoAsistenciaMesPersonalId
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)  

        JOIN Objetivo obj ON obj.ObjetivoId = obja.ObjetivoId
        JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
        LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId

        LEFT JOIN ValorLiquidacion val ON val.ValorLiquidacionTipoAsociadoId = objp.ObjetivoAsistenciaTipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId = objp.ObjetivoAsistenciaCategoriaPersonalId AND EOMONTH(DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno, objm.ObjetivoAsistenciaAnoMesMes,1)) >= val.ValorLiquidacionDesde AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno, objm.ObjetivoAsistenciaAnoMesMes,1) <= ISNULL(val.ValorLiquidacionHasta,'9999-12-31')   
          AND val.ValorLiquidacionSucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
      WHERE objp.ObjetivoId = @0
      ORDER BY per.PersonalApellido
    `, [objetivoId, anio, mes])
    const formas = await this.getTiposHoraQuery()
    const data = personal.map((obj: any, index: number) => {
      const camposDay = Object.keys(obj).filter(clave => clave.startsWith('day'));
      const days = {};
      let total = hasta ? 0 : undefined
      camposDay.forEach(clave => {
        if (String(obj[clave]).indexOf('.') >= 0) {
          const hm = obj[clave].split('.')
          const horas = Number(hm[0]) + Number(hm[1]) / 60
          if (horas > 0) {
            days[clave] = horas;
          }
          total += horas
        }
      });
      let forma = formas.find((objForma: any) => obj.FormaLiquidacion == objForma.TipoHoraId)
      return {
        id: hasta ? obj.id : index + 1,
        dbid: obj.dbid,
        apellidoNombre: {
          id: obj.PersonalId,
          fullName: obj.fullName
        },
        categoria: {
          id: `${obj.TipoAsociadoId}-${obj.CategoriaId}`,
          fullName: `${obj.CategoriaDescripcion.trim()} ${(obj.ValorLiquidacionHorasTrabajoHoraNormal > 0) ? obj.ValorLiquidacionHorasTrabajoHoraNormal : ''}`,
          tipoId: obj.TipoAsociadoId,
          tipoFullName: obj.TipoAsociadoDescripcion.trim(),
          horasRecomendadas: obj.ValorLiquidacionHorasTrabajoHoraNormal,
          categoriaId: obj.CategoriaId
        },
        forma: {
          id: forma.TipoHoraId,
          fullName: forma.Descripcion
        },
        ...days,
        total
      }
    })
    return data
  }

  async getLicenciasPorPersonaQuery(anio: number, mes: number, personalId: number, queryRunner: QueryRunner) {
    return queryRunner.query(
      `
        SELECT PersonalLicenciaDesde desde, ISNULL( ISNULL(PersonalLicenciaTermina,PersonalLicenciaHasta), '9999-12-31') hasta, ISNULL(PersonalLicenciaTermina,PersonalLicenciaHasta) hasta2
        FROM PersonalLicencia 
        WHERE PersonalId = @0 
        AND PersonalLicenciaDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) 
        AND ISNULL(PersonalLicenciaHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1) 
        AND ISNULL(PersonalLicenciaTermina,'9999-12-31') >= DATEFROMPARTS(@1,@2,1)
        `, [personalId, anio, mes]
    )
  }

  async getLicenciasPorPersona(req: any, res: Response, next: NextFunction) {
    try {
      const personalId = req.params.personalId;
      const anio = req.params.anio;
      const mes = req.params.mes;
      const queryRunner = dataSource.createQueryRunner();
      const licencias = await this.getLicenciasPorPersonaQuery(anio, mes, personalId, queryRunner)
      this.jsonRes({ licencias }, res);
    } catch (error) {
      return next(error)
    }
  }

  async getListaAsistenciaPersonalAsignadoAnterior(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      //      await queryRunner.startTransaction()
      const objetivoId = req.params.ObjetivoId;
      let anio = req.params.anio;
      let mes = req.params.mes;

      if (!await this.hasGroup(req, 'liquidaciones') && !await this.hasAuthObjetivo(anio, mes, res, Number(objetivoId), queryRunner) &&
        !await this.hasAuthCargaDirecta(anio, mes, res, Number(req.body.objetivoId), queryRunner))
        throw new ClientException(`No tiene permisos para ver asistencia`)

      if (mes == 1) {
        mes = 12
        anio--
      } else {
        mes--
      }
      const lista = await this.listaAsistenciaPersonalAsignado(objetivoId, anio, mes, queryRunner, 0)
      const listares = lista.map(r => { r.dbid = null; return r })
      //      await queryRunner.commitTransaction()
      this.jsonRes(listares, res);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  minsToHourMins(mins: number) {
    const hours = Math.floor(mins / 60)
    const minutes = mins % 60
    return String(hours).padStart(2, '0') + "." + String(minutes).padStart(2, '0')
  }

  hoursToHourMins(hoursin: number) {
    const hours = Math.floor(hoursin)
    const minutes = hoursin % 1 * 60
    return String(hours).padStart(2, '0') + "." + String(minutes).padStart(2, '0')
  }

  async getListaAsistenciaControAcceso(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const anio = req.params.anio
      const mes = req.params.mes
      let listado = [];

      listado = await this.getAccessControlAsistance(anio, mes);

      let ClienteId = 0
      let ClienteElementoDependienteId = 0

      //      fs.writeFile('C:/temp/listado.json', JSON.stringify(listado, null, 2), (err) => { })
      let listadoProcessed = {}
      for (const personal of listado) {
        const CUIT = personal.employeeNo
        ClienteId = 0
        ClienteElementoDependienteId = 0
        let matches = /^(\d*)\/(\d*)/g.exec(personal.groupName)
        if (matches)
          [, ClienteId, ClienteElementoDependienteId] = matches.map(m => parseInt(m) || 0)

        for (const day of personal.detailInfo) {
          //          const dayNum = new Date(day.dateTime).getUTCDate().getDate() + 1

          const dayNum = new Date(day.dateTime).getUTCDate();

          if (day.timeList.length) {
            const maxMinsMidnight = Math.max(...day.timeList)
            const minMinsMidnight = Math.min(...day.timeList)
            const diffMins = maxMinsMidnight - minMinsMidnight


            let diffHours: float = Math.floor(diffMins / 60)
            if (diffMins % 60 > 15) diffHours += 0.5
            if (diffMins % 60 > 45) diffHours += 0.5

            if (diffHours > 0) {
              if (!listadoProcessed[personal.groupName]) listadoProcessed[personal.groupName] = { ClienteId, ClienteElementoDependienteId, personal: {} }
              listadoProcessed[personal.groupName].personal[personal.employeeNo] = { ...listadoProcessed[personal.groupName].personal[personal.employeeNo], ['day' + dayNum + 'det']: this.minsToHourMins(diffMins), ['day' + dayNum]: this.hoursToHourMins(diffHours), ['day' + dayNum + 'hs']: diffHours, ['day' + dayNum + 'fec']: day.dateTime }
            }
          }
        }
      }
      //            fs.writeFile('C:/temp/listadoProcessed.json', JSON.stringify(listadoProcessed, null, 2), (err) => { })
      //          throw new ClientException('debug')

      await queryRunner.startTransaction()

      interface ObjetivoDetalle {
        ClienteId: number;
        ClienteElementoDependienteId: number;
        personal: Record<string, any>;
      }

      for (const [key, detalle] of Object.entries(listadoProcessed) as [string, ObjetivoDetalle][]) {
        const Clienteid = Number(detalle.ClienteId)
        const ClienteElementoDependienteId = Number(detalle.ClienteElementoDependienteId)

        if (Clienteid) {
          const objetivo = await queryRunner.query('SELECT obj.ObjetivoId FROM Objetivo obj WHERE obj.ClienteId=@0 AND obj.ClienteElementoDependienteId=@1', [ClienteId, ClienteElementoDependienteId])
          const ObjetivoId = objetivo[0]?.ObjetivoId
          if (!ObjetivoId)
            throw new ClientException(`Objetivo no localizado ${ClienteId}/${ClienteElementoDependienteId}`,)
          const cabecera = await this.addAsistenciaPeriodo(anio, mes, ObjetivoId, queryRunner, null, null)

          if (!cabecera.ObjetivoAsistenciaAnoMesId || !cabecera.ObjetivoAsistenciaAnoId)
            throw new ClientException(`Error habilitando período ${mes}/${anio} para la carga del objetivo ${ObjetivoId}`, cabecera)

          const asistencia = await queryRunner.query(`
            SELECT 
              objp.ObjetivoAsistenciaAnoMesPersonalDiasId,
              objp.ObjetivoAsistenciaAnoId,
              objp.ObjetivoAsistenciaAnoMesId,
              objp.ObjetivoId,
              objp.ObjetivoAsistenciaMesPersonalId PersonalId,
              CONCAT(TRIM(per.PersonalApellido) , ', ', TRIM(per.PersonalNombre), ' CUIT:' , cuit.PersonalCUITCUILCUIT) fullName,
              cuit.PersonalCUITCUILCUIT,
              objp.ObjetivoAsistenciaTipoAsociadoId TipoAsociadoId,
              tipoas.TipoAsociadoDescripcion,
              objp.ObjetivoAsistenciaCategoriaPersonalId CategoriaId,
              catep.CategoriaPersonalDescripcion CategoriaDescripcion,
              val.ValorLiquidacionHorasTrabajoHoraNormal,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras FormaLiquidacion,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias1Gral) ObjetivoAsistenciaAnoMesPersonalDias1Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias2Gral) ObjetivoAsistenciaAnoMesPersonalDias2Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias3Gral) ObjetivoAsistenciaAnoMesPersonalDias3Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias4Gral) ObjetivoAsistenciaAnoMesPersonalDias4Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias5Gral) ObjetivoAsistenciaAnoMesPersonalDias5Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias6Gral) ObjetivoAsistenciaAnoMesPersonalDias6Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias7Gral) ObjetivoAsistenciaAnoMesPersonalDias7Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias8Gral) ObjetivoAsistenciaAnoMesPersonalDias8Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias9Gral) ObjetivoAsistenciaAnoMesPersonalDias9Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias10Gral) ObjetivoAsistenciaAnoMesPersonalDias10Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias11Gral) ObjetivoAsistenciaAnoMesPersonalDias11Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias12Gral) ObjetivoAsistenciaAnoMesPersonalDias12Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias13Gral) ObjetivoAsistenciaAnoMesPersonalDias13Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias14Gral) ObjetivoAsistenciaAnoMesPersonalDias14Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias15Gral) ObjetivoAsistenciaAnoMesPersonalDias15Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias16Gral) ObjetivoAsistenciaAnoMesPersonalDias16Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias17Gral) ObjetivoAsistenciaAnoMesPersonalDias17Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias18Gral) ObjetivoAsistenciaAnoMesPersonalDias18Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias19Gral) ObjetivoAsistenciaAnoMesPersonalDias19Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias20Gral) ObjetivoAsistenciaAnoMesPersonalDias20Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias21Gral) ObjetivoAsistenciaAnoMesPersonalDias21Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias22Gral) ObjetivoAsistenciaAnoMesPersonalDias22Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias23Gral) ObjetivoAsistenciaAnoMesPersonalDias23Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias24Gral) ObjetivoAsistenciaAnoMesPersonalDias24Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias25Gral) ObjetivoAsistenciaAnoMesPersonalDias25Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias26Gral) ObjetivoAsistenciaAnoMesPersonalDias26Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias27Gral) ObjetivoAsistenciaAnoMesPersonalDias27Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias28Gral) ObjetivoAsistenciaAnoMesPersonalDias28Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias29Gral) ObjetivoAsistenciaAnoMesPersonalDias29Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias30Gral) ObjetivoAsistenciaAnoMesPersonalDias30Gral,
              TRIM(objp.ObjetivoAsistenciaAnoMesPersonalDias31Gral) ObjetivoAsistenciaAnoMesPersonalDias31Gral,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia1,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia2,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia3,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia4,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia5,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia6,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia7,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia8,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia9,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia10,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia11,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia12,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia13,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia14,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia15,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia16,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia17,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia18,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia19,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia20,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia21,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia22,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia23,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia24,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia25,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia26,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia27,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia28,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia29,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia30,
              objp.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia31,
    
              1
            FROM ObjetivoAsistenciaAnoMesPersonalDias objp
              INNER JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objp.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objp.ObjetivoId AND obja.ObjetivoAsistenciaAnoAno = @1
              INNER JOIN ObjetivoAsistenciaAnoMes objm  ON objm.ObjetivoAsistenciaAnoMesId = objp.ObjetivoAsistenciaAnoMesId AND objm.ObjetivoAsistenciaAnoId = objp.ObjetivoAsistenciaAnoId AND objm.ObjetivoId = objp.ObjetivoId AND objm.ObjetivoAsistenciaAnoMesMes = @2
              INNER JOIN TipoAsociado tipoas ON tipoas.TipoAsociadoId = objp.ObjetivoAsistenciaTipoAsociadoId
              INNER JOIN CategoriaPersonal catep ON catep.TipoAsociadoId = objp.ObjetivoAsistenciaTipoAsociadoId AND catep.CategoriaPersonalId = objp.ObjetivoAsistenciaCategoriaPersonalId
              INNER JOIN Personal per ON per.PersonalId = objp.ObjetivoAsistenciaMesPersonalId
              INNER JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)  
      
              JOIN Objetivo obj ON obj.ObjetivoId = obja.ObjetivoId
              JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
              LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
      
              LEFT JOIN ValorLiquidacion val ON val.ValorLiquidacionTipoAsociadoId = objp.ObjetivoAsistenciaTipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId = objp.ObjetivoAsistenciaCategoriaPersonalId AND EOMONTH(DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno, objm.ObjetivoAsistenciaAnoMesMes,1)) >= val.ValorLiquidacionDesde AND DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno, objm.ObjetivoAsistenciaAnoMesMes,1) <= ISNULL(val.ValorLiquidacionHasta,'9999-12-31')   
                AND val.ValorLiquidacionSucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
            WHERE obj.ClienteId=@0 AND obj.ClienteElementoDependienteId=@3 AND cuit.PersonalCUITCUILCUIT IN ('${Object.keys(detalle.personal).join('\',\'')}') 
            ORDER BY objp.ObjetivoAsistenciaAnoMesPersonalDiasId
          `, [ClienteId, anio, mes, ClienteElementoDependienteId])

          interface AsistenciaProcessed {
            [key: string]: string;
          }
          const ObjetivoAsistenciaAnoId = cabecera.ObjetivoAsistenciaAnoId
          const ObjetivoAsistenciaAnoMesId = cabecera.ObjetivoAsistenciaAnoMesId


          for (const [cuit, perAsistencia] of Object.entries(detalle.personal) as [string, AsistenciaProcessed][]) {
            const asistenciaRow = asistencia.find((p: any) => p.PersonalCUITCUILCUIT == cuit)

            if (asistenciaRow) {
              await queryRunner.query(`UPDATE ObjetivoAsistenciaAnoMesPersonalDias 
                SET ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio1Gral = @4, ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio2Gral = @5, ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio3Gral = @6, ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio4Gral = @7, ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio5Gral = @8,
                ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio6Gral =  @9, ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio7Gral = @10, ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio8Gral = @11, ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio9Gral = @12, ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio10Gral = @13,
                ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio11Gral = @14, ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio12Gral = @15, ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio13Gral = @16, ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio14Gral = @17, ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio15Gral = @18,
                ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio16Gral = @19, ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio17Gral = @20, ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio18Gral = @21, ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio19Gral = @22, ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio20Gral = @23,
                ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio21Gral = @24, ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio22Gral = @25, ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio23Gral = @26, ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio24Gral = @27, ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio25Gral = @28,
                ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio26Gral = @29, ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio27Gral = @30, ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio28Gral = @31, ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio29Gral = @32, ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio30Gral = @33,
                ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio31Gral = @34,
                ObjetivoAsistenciaAnoMesPersonalDias1Gral = @35, ObjetivoAsistenciaAnoMesPersonalDias2Gral = @36, ObjetivoAsistenciaAnoMesPersonalDias3Gral = @37, ObjetivoAsistenciaAnoMesPersonalDias4Gral = @38, ObjetivoAsistenciaAnoMesPersonalDias5Gral = @39,
                ObjetivoAsistenciaAnoMesPersonalDias6Gral = @40, ObjetivoAsistenciaAnoMesPersonalDias7Gral = @41, ObjetivoAsistenciaAnoMesPersonalDias8Gral = @42, ObjetivoAsistenciaAnoMesPersonalDias9Gral = @43, ObjetivoAsistenciaAnoMesPersonalDias10Gral = @44,
                ObjetivoAsistenciaAnoMesPersonalDias11Gral = @45, ObjetivoAsistenciaAnoMesPersonalDias12Gral = @46, ObjetivoAsistenciaAnoMesPersonalDias13Gral = @47, ObjetivoAsistenciaAnoMesPersonalDias14Gral = @48, ObjetivoAsistenciaAnoMesPersonalDias15Gral = @49,
                ObjetivoAsistenciaAnoMesPersonalDias16Gral = @50, ObjetivoAsistenciaAnoMesPersonalDias17Gral = @51, ObjetivoAsistenciaAnoMesPersonalDias18Gral = @52, ObjetivoAsistenciaAnoMesPersonalDias19Gral = @53, ObjetivoAsistenciaAnoMesPersonalDias20Gral = @54,
                ObjetivoAsistenciaAnoMesPersonalDias21Gral = @55, ObjetivoAsistenciaAnoMesPersonalDias22Gral = @56, ObjetivoAsistenciaAnoMesPersonalDias23Gral = @57, ObjetivoAsistenciaAnoMesPersonalDias24Gral = @58, ObjetivoAsistenciaAnoMesPersonalDias25Gral = @59,
                ObjetivoAsistenciaAnoMesPersonalDias26Gral = @60, ObjetivoAsistenciaAnoMesPersonalDias27Gral = @61, ObjetivoAsistenciaAnoMesPersonalDias28Gral = @62, ObjetivoAsistenciaAnoMesPersonalDias29Gral = @63, ObjetivoAsistenciaAnoMesPersonalDias30Gral = @64, ObjetivoAsistenciaAnoMesPersonalDias31Gral = @65
                WHERE ObjetivoAsistenciaAnoMesPersonalDiasId = @0  AND ObjetivoAsistenciaAnoId = @1 AND ObjetivoAsistenciaAnoMesId = @2 AND ObjetivoId = @3`,
                [asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasId, asistenciaRow.ObjetivoAsistenciaAnoId, asistenciaRow.ObjetivoAsistenciaAnoMesId, asistenciaRow.ObjetivoId,
                perAsistencia.day1, perAsistencia.day2, perAsistencia.day3, perAsistencia.day4, perAsistencia.day5,
                perAsistencia.day6, perAsistencia.day7, perAsistencia.day8, perAsistencia.day9, perAsistencia.day10,
                perAsistencia.day11, perAsistencia.day12, perAsistencia.day13, perAsistencia.day14, perAsistencia.day15,
                perAsistencia.day16, perAsistencia.day17, perAsistencia.day18, perAsistencia.day19, perAsistencia.day20,
                perAsistencia.day21, perAsistencia.day22, perAsistencia.day23, perAsistencia.day24, perAsistencia.day25,
                perAsistencia.day26, perAsistencia.day27, perAsistencia.day28, perAsistencia.day29, perAsistencia.day30, perAsistencia.day31,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia1 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias1Gral : perAsistencia.day1,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia2 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias2Gral : perAsistencia.day2,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia3 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias3Gral : perAsistencia.day3,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia4 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias4Gral : perAsistencia.day4,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia5 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias5Gral : perAsistencia.day5,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia6 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias6Gral : perAsistencia.day6,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia7 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias7Gral : perAsistencia.day7,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia8 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias8Gral : perAsistencia.day8,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia9 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias9Gral : perAsistencia.day9,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia10 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias10Gral : perAsistencia.day10,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia11 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias11Gral : perAsistencia.day11,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia12 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias12Gral : perAsistencia.day12,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia13 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias13Gral : perAsistencia.day13,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia14 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias14Gral : perAsistencia.day14,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia15 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias15Gral : perAsistencia.day15,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia16 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias16Gral : perAsistencia.day16,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia17 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias17Gral : perAsistencia.day17,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia18 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias18Gral : perAsistencia.day18,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia19 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias19Gral : perAsistencia.day19,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia20 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias20Gral : perAsistencia.day20,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia21 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias21Gral : perAsistencia.day21,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia22 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias22Gral : perAsistencia.day22,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia23 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias23Gral : perAsistencia.day23,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia24 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias24Gral : perAsistencia.day24,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia25 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias25Gral : perAsistencia.day25,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia26 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias26Gral : perAsistencia.day26,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia27 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias27Gral : perAsistencia.day27,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia28 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias28Gral : perAsistencia.day28,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia29 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias29Gral : perAsistencia.day29,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia30 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias30Gral : perAsistencia.day30,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia31 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias31Gral : perAsistencia.day31
                ])

              await queryRunner.query(`UPDATE ObjetivoAsistenciaMesDiasPersonal 
                SET ObjetivoAsistenciaAnoMesPersonalConAsiBio1Gral = @4, ObjetivoAsistenciaAnoMesPersonalConAsiBio2Gral = @5, ObjetivoAsistenciaAnoMesPersonalConAsiBio3Gral = @6,   ObjetivoAsistenciaAnoMesPersonalConAsiBio4Gral = @7,   ObjetivoAsistenciaAnoMesPersonalConAsiBio5Gral = @8,
                ObjetivoAsistenciaAnoMesPersonalConAsiBio6Gral =  @9,  ObjetivoAsistenciaAnoMesPersonalConAsiBio7Gral  = @10, ObjetivoAsistenciaAnoMesPersonalConAsiBio8Gral = @11,  ObjetivoAsistenciaAnoMesPersonalConAsiBio9Gral = @12,  ObjetivoAsistenciaAnoMesPersonalConAsiBio10Gral = @13,
                ObjetivoAsistenciaAnoMesPersonalConAsiBio11Gral = @14, ObjetivoAsistenciaAnoMesPersonalConAsiBio12Gral = @15, ObjetivoAsistenciaAnoMesPersonalConAsiBio13Gral = @16, ObjetivoAsistenciaAnoMesPersonalConAsiBio14Gral = @17, ObjetivoAsistenciaAnoMesPersonalConAsiBio15Gral = @18,
                ObjetivoAsistenciaAnoMesPersonalConAsiBio16Gral = @19, ObjetivoAsistenciaAnoMesPersonalConAsiBio17Gral = @20, ObjetivoAsistenciaAnoMesPersonalConAsiBio18Gral = @21, ObjetivoAsistenciaAnoMesPersonalConAsiBio19Gral = @22, ObjetivoAsistenciaAnoMesPersonalConAsiBio20Gral = @23,
                ObjetivoAsistenciaAnoMesPersonalConAsiBio21Gral = @24, ObjetivoAsistenciaAnoMesPersonalConAsiBio22Gral = @25, ObjetivoAsistenciaAnoMesPersonalConAsiBio23Gral = @26, ObjetivoAsistenciaAnoMesPersonalConAsiBio24Gral = @27, ObjetivoAsistenciaAnoMesPersonalConAsiBio25Gral = @28,
                ObjetivoAsistenciaAnoMesPersonalConAsiBio26Gral = @29, ObjetivoAsistenciaAnoMesPersonalConAsiBio27Gral = @30, ObjetivoAsistenciaAnoMesPersonalConAsiBio28Gral = @31, ObjetivoAsistenciaAnoMesPersonalConAsiBio29Gral = @32, ObjetivoAsistenciaAnoMesPersonalConAsiBio30Gral = @33,
                ObjetivoAsistenciaAnoMesPersonalConAsiBio31Gral = @34,
                ObjetivoAsistenciaAnoMesPersonalDia1Gral = @35, ObjetivoAsistenciaAnoMesPersonalDia2Gral = @36, ObjetivoAsistenciaAnoMesPersonalDia3Gral = @37, ObjetivoAsistenciaAnoMesPersonalDia4Gral = @38, ObjetivoAsistenciaAnoMesPersonalDia5Gral = @39,
                ObjetivoAsistenciaAnoMesPersonalDia6Gral = @40, ObjetivoAsistenciaAnoMesPersonalDia7Gral = @41, ObjetivoAsistenciaAnoMesPersonalDia8Gral = @42, ObjetivoAsistenciaAnoMesPersonalDia9Gral = @43, ObjetivoAsistenciaAnoMesPersonalDia10Gral = @44,
                ObjetivoAsistenciaAnoMesPersonalDia11Gral = @45, ObjetivoAsistenciaAnoMesPersonalDia12Gral = @46, ObjetivoAsistenciaAnoMesPersonalDia13Gral = @47, ObjetivoAsistenciaAnoMesPersonalDia14Gral = @48, ObjetivoAsistenciaAnoMesPersonalDia15Gral = @49,
                ObjetivoAsistenciaAnoMesPersonalDia16Gral = @50, ObjetivoAsistenciaAnoMesPersonalDia17Gral = @51, ObjetivoAsistenciaAnoMesPersonalDia18Gral = @52, ObjetivoAsistenciaAnoMesPersonalDia19Gral = @53, ObjetivoAsistenciaAnoMesPersonalDia20Gral = @54,
                ObjetivoAsistenciaAnoMesPersonalDia21Gral = @55, ObjetivoAsistenciaAnoMesPersonalDia22Gral = @56, ObjetivoAsistenciaAnoMesPersonalDia23Gral = @57, ObjetivoAsistenciaAnoMesPersonalDia24Gral = @58, ObjetivoAsistenciaAnoMesPersonalDia25Gral = @59,
                ObjetivoAsistenciaAnoMesPersonalDia26Gral = @60, ObjetivoAsistenciaAnoMesPersonalDia27Gral = @61, ObjetivoAsistenciaAnoMesPersonalDia28Gral = @62, ObjetivoAsistenciaAnoMesPersonalDia29Gral = @63, ObjetivoAsistenciaAnoMesPersonalDia30Gral = @64, ObjetivoAsistenciaAnoMesPersonalDia31Gral = @65
    
                WHERE ObjetivoAsistenciaMesDiasPersonalId = @0  AND ObjetivoAsistenciaAnoId = @1 AND ObjetivoAsistenciaAnoMesId = @2 AND ObjetivoId = @3`,
                [asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasId, asistenciaRow.ObjetivoAsistenciaAnoId, asistenciaRow.ObjetivoAsistenciaAnoMesId, asistenciaRow.ObjetivoId,
                perAsistencia.day1, perAsistencia.day2, perAsistencia.day3, perAsistencia.day4, perAsistencia.day5,
                perAsistencia.day6, perAsistencia.day7, perAsistencia.day8, perAsistencia.day9, perAsistencia.day10,
                perAsistencia.day11, perAsistencia.day12, perAsistencia.day13, perAsistencia.day14, perAsistencia.day15,
                perAsistencia.day16, perAsistencia.day17, perAsistencia.day18, perAsistencia.day19, perAsistencia.day20,
                perAsistencia.day21, perAsistencia.day22, perAsistencia.day23, perAsistencia.day24, perAsistencia.day25,
                perAsistencia.day26, perAsistencia.day27, perAsistencia.day28, perAsistencia.day29, perAsistencia.day30, perAsistencia.day31,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia1 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias1Gral : perAsistencia.day1,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia2 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias2Gral : perAsistencia.day2,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia3 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias3Gral : perAsistencia.day3,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia4 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias4Gral : perAsistencia.day4,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia5 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias5Gral : perAsistencia.day5,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia6 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias6Gral : perAsistencia.day6,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia7 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias7Gral : perAsistencia.day7,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia8 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias8Gral : perAsistencia.day8,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia9 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias9Gral : perAsistencia.day9,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia10 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias10Gral : perAsistencia.day10,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia11 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias11Gral : perAsistencia.day11,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia12 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias12Gral : perAsistencia.day12,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia13 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias13Gral : perAsistencia.day13,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia14 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias14Gral : perAsistencia.day14,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia15 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias15Gral : perAsistencia.day15,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia16 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias16Gral : perAsistencia.day16,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia17 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias17Gral : perAsistencia.day17,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia18 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias18Gral : perAsistencia.day18,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia19 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias19Gral : perAsistencia.day19,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia20 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias20Gral : perAsistencia.day20,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia21 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias21Gral : perAsistencia.day21,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia22 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias22Gral : perAsistencia.day22,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia23 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias23Gral : perAsistencia.day23,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia24 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias24Gral : perAsistencia.day24,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia25 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias25Gral : perAsistencia.day25,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia26 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias26Gral : perAsistencia.day26,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia27 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias27Gral : perAsistencia.day27,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia28 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias28Gral : perAsistencia.day28,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia29 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias29Gral : perAsistencia.day29,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia30 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias30Gral : perAsistencia.day30,
                (asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDiasFormaDia31 == 'MA') ? asistenciaRow.ObjetivoAsistenciaAnoMesPersonalDias31Gral : perAsistencia.day31

                ])

            } else {
              const PersonalIdBus = await queryRunner.query(`
                SELECT per.PersonalId, cuit.PersonalCUITCUILCUIT, cat.PersonalCategoriaTipoAsociadoId TipoAsociadoId, cat.PersonalCategoriaCategoriaPersonalId CategoriaPersonalId, 1      
                FROM Personal per 
                JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)
                JOIN PersonalCategoria cat ON cat.PersonalCategoriaPersonalId = cuit.PersonalId AND cat.PersonalCategoriaTipoAsociadoId IN (1,3) AND cat.PersonalCategoriaDesde <= DATEFROMPARTS(@1,@2,1) AND DATEFROMPARTS(@1,@2,1) <= ISNULL(cat.PersonalCategoriaHasta,'9999-12-31')
                WHERE cuit.PersonalCUITCUILCUIT = @0`, [cuit, anio, mes])

              if (PersonalIdBus.length > 0) {
                const PersonalId = PersonalIdBus[0].PersonalId
                const TipoAsociadoId = PersonalIdBus[0].TipoAsociadoId
                const CategoriaPersonalId = PersonalIdBus[0].CategoriaPersonalId
                let columnsDays = ''
                let columnsDay = ''
                let valueColumnsDays = ''
                let totalhs = 0
                for (let numdia = 1; numdia <= 31; numdia++) {
                  columnsDays += `, ObjetivoAsistenciaAnoMesPersonalDias${numdia}Gral, ObjetivoAsistenciaAnoMesPersonalDiasConAsiBio${numdia}Gral, ObjetivoAsistenciaAnoMesPersonalDiasFormaDia${numdia}`
                  columnsDay += `, ObjetivoAsistenciaAnoMesPersonalDia${numdia}Gral, ObjetivoAsistenciaAnoMesPersonalConAsiBio${numdia}Gral, ObjetivoAsistenciaAnoMesPersonalFormaDia${numdia}`
                  valueColumnsDays += `, '${perAsistencia['day' + numdia] ? perAsistencia['day' + numdia] : ''}', '${perAsistencia['day' + numdia] ? perAsistencia['day' + numdia] : ''}', '${perAsistencia['day' + numdia] ? 'AB' : ''}'`
                  totalhs += (Number(perAsistencia['day' + numdia + 'hs'])) ? Number(perAsistencia['day' + numdia + 'hs']) : 0
                }
                await this.addOrUpdateAsistencia(queryRunner, 0, ObjetivoId, ObjetivoAsistenciaAnoId, ObjetivoAsistenciaAnoMesId, mes, PersonalId, TipoAsociadoId, CategoriaPersonalId, 'N', columnsDays, columnsDay, valueColumnsDays, totalhs, {})
              }
            }
          }
        }
      }


      await queryRunner.commitTransaction();
      this.jsonRes(listadoProcessed, res);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }



  async eliminaCargaGrilla(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const {
        anio,
        mes,
        ObjetivoId
      } = req.body;

      const checkrecibos = await queryRunner.query(
        `SELECT per.ind_recibos_generados FROM lige.dbo.liqmaperiodo per WHERE per.anio=@1 AND per.mes=@2`, [, anio, mes]
      );

      if (checkrecibos[0]?.ind_recibos_generados == 1)
        throw new ClientException(`Ya se encuentran generados los recibos para el período ${anio}/${mes}, no se puede eliminar la carga`)


      await queryRunner.startTransaction();
      await queryRunner.query(`DELETE objp
      FROM ObjetivoAsistenciaAnoMesPersonalDias objp
        JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objp.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objp.ObjetivoId AND obja.ObjetivoAsistenciaAnoAno = @1
        JOIN ObjetivoAsistenciaAnoMes objm  ON objm.ObjetivoAsistenciaAnoMesId = objp.ObjetivoAsistenciaAnoMesId AND objm.ObjetivoAsistenciaAnoId = objp.ObjetivoAsistenciaAnoId AND objm.ObjetivoId = objp.ObjetivoId AND objm.ObjetivoAsistenciaAnoMesMes = @2
      WHERE objp.ObjetivoId = @0
    `, [ObjetivoId, anio, mes])

      await queryRunner.query(`DELETE objp
      FROM ObjetivoAsistenciaAnoMesPersonalAsignado objp
        JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objp.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objp.ObjetivoId AND obja.ObjetivoAsistenciaAnoAno = @1
        JOIN ObjetivoAsistenciaAnoMes objm  ON objm.ObjetivoAsistenciaAnoMesId = objp.ObjetivoAsistenciaAnoMesId AND objm.ObjetivoAsistenciaAnoId = objp.ObjetivoAsistenciaAnoId AND objm.ObjetivoId = objp.ObjetivoId AND objm.ObjetivoAsistenciaAnoMesMes = @2
      WHERE objp.ObjetivoId = @0
    `, [ObjetivoId, anio, mes])

      await queryRunner.query(`DELETE objp
      FROM ObjetivoAsistenciaMesDiasPersonal objp
        JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objp.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objp.ObjetivoId AND obja.ObjetivoAsistenciaAnoAno = @1
        JOIN ObjetivoAsistenciaAnoMes objm  ON objm.ObjetivoAsistenciaAnoMesId = objp.ObjetivoAsistenciaAnoMesId AND objm.ObjetivoAsistenciaAnoId = objp.ObjetivoAsistenciaAnoId AND objm.ObjetivoId = objp.ObjetivoId AND objm.ObjetivoAsistenciaAnoMesMes = @2
      WHERE objp.ObjetivoId = @0

    `, [ObjetivoId, anio, mes])

      await queryRunner.query(`DELETE objm
        FROM ObjetivoAsistenciaAnoMes objm  
        JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objm.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objm.ObjetivoId AND obja.ObjetivoAsistenciaAnoAno = @1
        WHERE objm.ObjetivoId = @0 AND objm.ObjetivoAsistenciaAnoMesMes = @2
    `, [ObjetivoId, anio, mes])

      await queryRunner.commitTransaction();

      this.jsonRes([], res, 'Todas las personas se eliminaron correctamente');
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }
  async eliminaCargaGrillaPersona(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const {
        anio,
        mes,
        ObjetivoId,
        PersonalId
      } = req.body;

      const checkrecibos = await queryRunner.query(
        `SELECT per.ind_recibos_generados FROM lige.dbo.liqmaperiodo per WHERE per.anio=@1 AND per.mes=@2`, [, anio, mes]
      );

      if (checkrecibos[0]?.ind_recibos_generados == 1)
        throw new ClientException(`Ya se encuentran generados los recibos para el período ${anio}/${mes}, no se puede eliminar la carga`)

      if (!PersonalId)
        throw new ClientException(`Debe selccionar una persona`)


      //      throw new ClientException(`Persona ${PersonalId}`);

      await queryRunner.startTransaction();
      await queryRunner.query(`DELETE objp
      FROM ObjetivoAsistenciaAnoMesPersonalDias objp
        JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objp.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objp.ObjetivoId AND obja.ObjetivoAsistenciaAnoAno = @1
        JOIN ObjetivoAsistenciaAnoMes objm  ON objm.ObjetivoAsistenciaAnoMesId = objp.ObjetivoAsistenciaAnoMesId AND objm.ObjetivoAsistenciaAnoId = objp.ObjetivoAsistenciaAnoId AND objm.ObjetivoId = objp.ObjetivoId AND objm.ObjetivoAsistenciaAnoMesMes = @2
      WHERE objp.ObjetivoId = @0 and objp.ObjetivoAsistenciaMesPersonalId=@3
    `, [ObjetivoId, anio, mes, PersonalId])

      await queryRunner.query(`DELETE objp
      FROM ObjetivoAsistenciaAnoMesPersonalAsignado objp
        JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objp.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objp.ObjetivoId AND obja.ObjetivoAsistenciaAnoAno = @1
        JOIN ObjetivoAsistenciaAnoMes objm  ON objm.ObjetivoAsistenciaAnoMesId = objp.ObjetivoAsistenciaAnoMesId AND objm.ObjetivoAsistenciaAnoId = objp.ObjetivoAsistenciaAnoId AND objm.ObjetivoId = objp.ObjetivoId AND objm.ObjetivoAsistenciaAnoMesMes = @2
      WHERE objp.ObjetivoId = @0 and objp.ObjetivoAsistenciaMesPersonalId=@3
    `, [ObjetivoId, anio, mes, PersonalId])

      await queryRunner.query(`DELETE objp
      FROM ObjetivoAsistenciaMesDiasPersonal objp
        JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objp.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objp.ObjetivoId AND obja.ObjetivoAsistenciaAnoAno = @1
        JOIN ObjetivoAsistenciaAnoMes objm  ON objm.ObjetivoAsistenciaAnoMesId = objp.ObjetivoAsistenciaAnoMesId AND objm.ObjetivoAsistenciaAnoId = objp.ObjetivoAsistenciaAnoId AND objm.ObjetivoId = objp.ObjetivoId AND objm.ObjetivoAsistenciaAnoMesMes = @2
      WHERE objp.ObjetivoId = @0 and objp.ObjetivoAsistenciaMesPersonalId=@3

    `, [ObjetivoId, anio, mes, PersonalId])


      const lista = await queryRunner.query(`SELECT *
      FROM ObjetivoAsistenciaAnoMesPersonalDias objp
        JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objp.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objp.ObjetivoId AND obja.ObjetivoAsistenciaAnoAno = @1
        JOIN ObjetivoAsistenciaAnoMes objm  ON objm.ObjetivoAsistenciaAnoMesId = objp.ObjetivoAsistenciaAnoMesId AND objm.ObjetivoAsistenciaAnoId = objp.ObjetivoAsistenciaAnoId AND objm.ObjetivoId = objp.ObjetivoId AND objm.ObjetivoAsistenciaAnoMesMes = @2
      WHERE objp.ObjetivoId = @0
    `, [ObjetivoId, anio, mes])

      if (lista.length == 0) {

        await queryRunner.query(`DELETE objm
        FROM ObjetivoAsistenciaAnoMes objm  
        JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objm.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objm.ObjetivoId AND obja.ObjetivoAsistenciaAnoAno = @1
        WHERE objm.ObjetivoId = @0 AND objm.ObjetivoAsistenciaAnoMesMes = @2
        `, [ObjetivoId, anio, mes])

      }

      await queryRunner.commitTransaction();

      this.jsonRes([], res, 'La persona se eliminó correctamente');
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }


  async validaGrilla(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const {
        anio,
        mes,
        ObjetivoId
      } = req.body;

      const valGrid = await this.valGrid(ObjetivoId, anio, mes, queryRunner)
      if (valGrid instanceof ClientException)
        throw valGrid

      this.jsonRes([], res, 'Todas las personas se validaron correctamente');
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }


  async valGrid(objetivoId: number, anio: number, mes: number, queryRunner: QueryRunner) {

    const gridData: any[] = await this.listaAsistenciaPersonalAsignado(objetivoId, anio, mes, queryRunner)

    const TotalHorasReal = gridData.map(row => { return (row.forma.id == 'N') ? row.total : 0 }).reduce((prev, curr) => prev + curr, 0)



    let errores: any[] = []
    let index: number
    let desde = new Date(anio, mes - 1, 1)

    //Validación de Objetivo
    const valObjetivo: any = await AsistenciaController.getObjetivoAsistenciaCabecera(anio, mes, objetivoId, queryRunner)
    if (valObjetivo.length == 0) {
      errores.push(`El objetivo no se localizó`)
    } else {

      if (TotalHorasReal > 0 && Number(valObjetivo[0].TotalHoras) == 0)
        errores.push(`Horas a facturar debe ser mayor a 0`)

      //Validación de Excepción de Asistencia
      const excepAsistencia = await this.getExcepAsistenciaPorObjetivoQuery(objetivoId, desde, queryRunner)

      for (index = 0; index < gridData.length; index++) {
        let item = gridData[index]
        item.year = anio
        item.month = mes
        item.objetivoId = objetivoId
        item.personalId = item.apellidoNombre.id
        item.tipoAsociadoId = item.categoria.tipoId
        item.categoriaPersonalId = item.categoria.categoriaId
        item.formaLiquidacion = item.forma.id

        let error: any[] = []
        //Validación de los datos ingresados
        if (!item.apellidoNombre.id || !item.forma.id || !item.categoria.id || !item.categoria.tipoId) {
          error.push(`Los campos de Persona, Forma y Categoria NO pueden estar vacios`)
          errores.push(`Fila ${index + 1}:\n${error.join(`\n`)}`)
          continue
        }

        //Validación que exista la misma persona con la misma categoria y forma
        let sucursalId = valObjetivo[0].SucursalId
        const cant = gridData.find((i: any) => (i.apellidoNombre.id == item.apellidoNombre.id && i.forma.id == item.forma.id && i.categoria.id == item.categoria.id && i.categoria.tipoId == item.categoria.tipoId && i.id != item.id))

        if (cant)
          error.push(`La persona ya tiene un registro existente con misma forma y categoría`)

        //Validación Categoria del Personal
        const valCategoriaPersonal: any = await this.valCategoriaPersonal(item, sucursalId, queryRunner)
        if (valCategoriaPersonal instanceof ClientException) {
          error.push(`La categoría ${item.categoria.fullName} no se encuentra habilitada para ${item.apellidoNombre.fullName}`)
        }



        //Validaciónes de los días del mes
        const valsDiasMes: any = await this.valsDiasMes(item, queryRunner)
        if (valsDiasMes instanceof ClientException) {
          error.push(valsDiasMes.messageArr[0])
        } else {
          let totalhs = valsDiasMes.totalhs
          if (totalhs < 1)
            error.push(`El total de horas tiene que ser superior o igual a 1`)
          //Validación de Excepción de Asistencia
          if (!totalhs && excepAsistencia.length && excepAsistencia.find((obj: any) => { (obj.PersonalId == item.personalId) })) {
            error.push(`La persona tiene Art14 y no tienen horas cargadas`)
          }
        }

        if (error.length) {
          let fullName = gridData[index].apellidoNombre.fullName
          let ultimaComa = fullName.lastIndexOf(" ");
          errores.push(`${fullName.substring(0, ultimaComa)} [Fila ${index + 1}]:\n${error.join(`, `)}`)
        }
      }

    }
    if (gridData.length == 0) {
      errores.push(`El objetivo debe poseer al menos una persona con una hora registrada`)
    }
    if (errores.length) {
      return new ClientException(errores)
    }
  }

  async getTiposHoraQuery() {
    return [
      { TipoHoraId: 'N', Descripcion: 'Normal' },
      { TipoHoraId: 'C', Descripcion: 'Capacitacion' },
      { TipoHoraId: 'R', Descripcion: 'No Facturable' },
    ]
  }

  async getTiposHora(req: any, res: Response, next: NextFunction) {
    const formas = await this.getTiposHoraQuery()
    return this.jsonRes(formas, res);
  }











  generateDigestAuthHeader(options: DigestAuthOptions): string {
    const { username, password, method, uri, realm, nonce, qop, nc, cnonce } = options;

    // Hash functions
    const ha1 = CryptoJS.MD5(`${username}:${realm}:${password}`).toString();
    const ha2 = CryptoJS.MD5(`${method}:${uri}`).toString();
    const response = CryptoJS.MD5(
      `${ha1}:${nonce}:${nc.toString().padStart(8, "0")}:${cnonce}:${qop}:${ha2}`
    ).toString();

    return `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}", qop=${qop}, nc=${nc.toString(16).padStart(8, "0")}, cnonce="${cnonce}", response="${response}"`;
  }

  static createDigestAuthOptions(authHeader: string, username: string, password: string, url: string) {
    if (!authHeader) {
      throw new Error("Digest authentication not supported on this endpoint.");
    }

    // Parse authHeader to extract realm, nonce, and qop
    const realmMatch = /realm="([^"]+)"/.exec(authHeader);
    const nonceMatch = /nonce="([^"]+)"/.exec(authHeader);
    const qopMatch = /qop="([^"]+)"/.exec(authHeader);

    if (!realmMatch || !nonceMatch || !qopMatch) {
      throw new Error("Failed to parse authentication header.");
    }

    const realm = realmMatch[1];
    const nonce = nonceMatch[1];
    const qop = qopMatch[1];

    // Generate client nonce
    const cnonce = CryptoJS.lib.WordArray.random(16).toString();
    const nc = 1;

    // Create the Digest auth header
    const authOptions: DigestAuthOptions = {
      username,
      password,
      method: "POST",
      uri: new URL(url).pathname,
      realm,
      nonce,
      qop,
      nc,
      cnonce,
    };
    return authOptions
  }

  async getAccessControlAsistance(anio: number, mes: number) {
    const url = process.env.CA_URL_GETASISTANCE
    const username = process.env.CA_USERNAME
    const password = process.env.CA_PASSWORD
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const initialResponse = await fetch(url, { method: 'POST', body: JSON.stringify({ validateStatus: () => true }), })
    const authHeader = initialResponse.headers.get('www-authenticate')
    let authOptions = AsistenciaController.createDigestAuthOptions(authHeader, username, password, url)
    let recordsArray = []
    let searchResultPosition = 1
    let retryfetch = 1
    const data = {
      "searchID": CryptoJS.lib.WordArray.random(16).toString(), //Es un valor aleatorio tipo string, generado para parametro de control fb967efe5ddb4c8abc4847ce2673b6e0
      "searchResultPosition": searchResultPosition, //Parametro inicial de busqueda de la peticion
      "maxResults": 10, //Cantidad de resultados que devuelve
      "statisticalTime": "month",
      "month": `${anio}-${mes}` // Año-mes del periodo de datos obtenidos
    }
    do {
      const digestAuthHeader = this.generateDigestAuthHeader(authOptions)
      const headers = { 'Content-Type': 'application/json', 'Authorization': digestAuthHeader }

      const response = await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(data), })
      if (response.status == 401 && retryfetch < 5) {
        retryfetch++
        authOptions = AsistenciaController.createDigestAuthOptions(response.headers.get('www-authenticate'), username, password, url)
        continue
      }

      if (response.status != 200)
        throw new ClientException('Error obteniendo resultados del control de acceso', { status: response.status, response, body: await response.text() })

      authOptions.nc++
      searchResultPosition += 10
      data.searchResultPosition = searchResultPosition

      const dataRes: any = await response.json()
      recordsArray.push(...dataRes.matchResults)

      if (dataRes.responseStatus != 'MORE')
        break;
    } while (true)

    return recordsArray
  }

}
