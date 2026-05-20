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

  async getProveedores(req: any, res: Response, next: NextFunction) {
    try {
      const queryRunner = await getConnection(res.locals.userName);
      const rows = await queryRunner.query(`
        SELECT pro.ProveedorId,
               TRIM(pro.ProveedorRazonSocial) AS ProveedorRazonSocial,
               pro.ProveedorSucursalId,
               TRIM(suc.SucursalDescripcion) AS ProveedorSucursalDescripcion
        FROM Proveedor pro
        LEFT JOIN Sucursal suc ON suc.SucursalId = pro.ProveedorSucursalId
        ORDER BY pro.ProveedorRazonSocial
      `);
      this.jsonRes(rows, res);
    } catch (error) {
      return next(error);
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
        SucursalDescripcion: sucursalRows[0]?.SucursalDescripcion ?? null,
      }, res);
    } catch (error) {
      return next(error);
    }
  }

}
