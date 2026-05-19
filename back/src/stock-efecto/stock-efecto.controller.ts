import { BaseController } from "../controller/base.controller.ts";
import { dataSource } from "../data-source.ts";
import type { NextFunction, Request, Response } from "express";
import { getConnection } from "../data-source.ts";

const tiposDestino = [
  { value: "deposito", label: "Depósitos" },
  { value: "personal", label: "Personas" },
  { value: "objetivo", label: "Objetivos" },
  { value: "proveedor", label: "Proveedores" },
];

export class StockEfectoController extends BaseController {

  async getTiposDestino(req: Request, res: Response, next: NextFunction) {
    try {
      this.jsonRes(tiposDestino, res);
    } catch (error) {
      return next(error);
    }
  }

  async getPersonaInfo(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const personalId = Number(req.params.personalId);
      const anio = Number(req.params.anio);
      const mes = Number(req.params.mes);

      const queryRunner = await getConnection(res.locals.userName);

      const rows = await queryRunner.query(`
        SELECT
          TRIM(suc.SucursalDescripcion) AS SucursalDescripcion,
          TRIM(ga.GrupoActividadDetalle) AS GrupoActividadDetalle,
          TRIM(sit.SituacionRevistaDescripcion) AS SituacionRevistaDescripcion
        FROM Personal per
        LEFT JOIN PersonalSucursalPrincipal sucper
          ON sucper.PersonalId = per.PersonalId
          AND sucper.PersonalSucursalPrincipalId = (
            SELECT MAX(a.PersonalSucursalPrincipalId)
            FROM PersonalSucursalPrincipal a
            WHERE a.PersonalId = per.PersonalId
          )
        LEFT JOIN Sucursal suc ON suc.SucursalId = sucper.PersonalSucursalPrincipalSucursalId
        LEFT JOIN PersonalSituacionRevista psr
          ON psr.PersonalId = per.PersonalId
          AND psr.PersonalSituacionRevistaDesde <= EOMONTH(DATEFROMPARTS(@1, @2, 1))
          AND ISNULL(psr.PersonalSituacionRevistaHasta, '9999-12-31') >= DATEFROMPARTS(@1, @2, 1)
        LEFT JOIN SituacionRevista sit ON sit.SituacionRevistaId = psr.PersonalSituacionRevistaSituacionId
        LEFT JOIN GrupoActividadPersonal gap
          ON gap.GrupoActividadPersonalPersonalId = per.PersonalId
          AND gap.GrupoActividadPersonalDesde <= EOMONTH(DATEFROMPARTS(@1, @2, 1))
          AND ISNULL(gap.GrupoActividadPersonalHasta, '9999-12-31') >= DATEFROMPARTS(@1, @2, 1)
        LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId = gap.GrupoActividadId
        WHERE per.PersonalId = @0
      `, [personalId, anio, mes]);

      this.jsonRes(rows[0] ?? null, res);
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async getObjetivoInfo(req: any, res: Response, next: NextFunction) {
    try {
      const objetivoId = Number(req.params.objetivoId);
      const anio = Number(req.params.anio);
      const mes = Number(req.params.mes);

      const queryRunner = await getConnection(res.locals.userName);

      const objetivoRows = await queryRunner.query(`
        SELECT TOP 1 obj.ObjetivoId, obj.ClienteId, obj.ClienteElementoDependienteId
        FROM Objetivo obj
        WHERE obj.ObjetivoId = @0
      `, [objetivoId]);

      const objetivo = objetivoRows[0];
      if (!objetivo) {
        this.jsonRes(null, res);
        return;
      }

      const grupoRows = await queryRunner.query(`
        SELECT TOP 1 TRIM(ga.GrupoActividadDetalle) AS GrupoActividadDetalle
        FROM GrupoActividadObjetivo gao
        JOIN GrupoActividad ga ON ga.GrupoActividadId = gao.GrupoActividadId
        WHERE gao.GrupoActividadObjetivoObjetivoId = @0
          AND EOMONTH(DATEFROMPARTS(@1, @2, 1)) >= gao.GrupoActividadObjetivoDesde
          AND DATEFROMPARTS(@1, @2, 1) < ISNULL(gao.GrupoActividadObjetivoHasta, '9999-12-31')
      `, [objetivoId, anio, mes]);

      const contratoRows = await queryRunner.query(`
        SELECT TOP 1
          eledepcon.ClienteElementoDependienteContratoId AS ContratoId,
          eledepcon.ClienteElementoDependienteContratoFechaDesde AS ContratoFechaDesde,
          eledepcon.ClienteElementoDependienteContratoFechaHasta AS ContratoFechaHasta
        FROM ClienteElementoDependienteContrato eledepcon
        WHERE eledepcon.ClienteId = @0
          AND eledepcon.ClienteElementoDependienteId = @1
          AND EOMONTH(DATEFROMPARTS(@2, @3, 1)) >= eledepcon.ClienteElementoDependienteContratoFechaDesde
          AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaHasta, '9999-12-31') >= DATEFROMPARTS(@2, @3, 1)
          AND ISNULL(eledepcon.ClienteElementoDependienteContratoFechaFinalizacion, '9999-12-31') >= DATEFROMPARTS(@2, @3, 1)
      `, [objetivo.ClienteId, objetivo.ClienteElementoDependienteId, anio, mes]);

      const sucursalRows = await queryRunner.query(`
        SELECT TOP 1 TRIM(suc.SucursalDescripcion) AS SucursalDescripcion
        FROM Sucursal suc
        WHERE suc.SucursalId = ISNULL(
          (SELECT eledep.ClienteElementoDependienteSucursalId
           FROM ClienteElementoDependiente eledep
           WHERE eledep.ClienteId = @0 AND eledep.ClienteElementoDependienteId = @1),
          (SELECT cli.ClienteSucursalId FROM Cliente cli WHERE cli.ClienteId = @0)
        )
      `, [objetivo.ClienteId, objetivo.ClienteElementoDependienteId]);

      this.jsonRes({
        GrupoActividadDetalle: grupoRows[0]?.GrupoActividadDetalle ?? null,
        ContratoId: contratoRows[0]?.ContratoId ?? null,
        ContratoFechaDesde: contratoRows[0]?.ContratoFechaDesde ?? null,
        ContratoFechaHasta: contratoRows[0]?.ContratoFechaHasta ?? null,
        SucursalDescripcion: sucursalRows[0]?.SucursalDescripcion ?? null,
      }, res);
    } catch (error) {
      return next(error);
    }
  }

}
