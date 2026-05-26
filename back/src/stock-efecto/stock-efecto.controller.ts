import { BaseController, ClientException } from "../controller/base.controller.ts";
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
    } finally {
    }
  }

  async getProveedores(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);

    try {
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
    } finally {
      await queryRunner.release();
    }
  }

  async confirmarMovimiento(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const body = req.body ?? {};
      const fecha = body.fecha;
      const tipoDestino: string = body.tipoDestino ?? '';
      const depositoId = body.depositoId ?? null;
      const personalId = body.personalId ?? null;
      const objetivoId = body.objetivoId != null ? Number(body.objetivoId) : null;
      const proveedorId = body.proveedorId ?? null;
      const efectos: Array<{ EfectoId: number; UbicacionStockId: number; Cantidad: number }> = Array.isArray(body.efectos) ? body.efectos : [];

      if (!fecha) throw new ClientException("La fecha es obligatoria.");
      const tiposValidos = ['deposito', 'personal', 'objetivo', 'proveedor'];
      if (!tiposValidos.includes(tipoDestino)) throw new ClientException("El tipo de destino es obligatorio.");
      if (tipoDestino === 'deposito' && !depositoId) throw new ClientException("El depósito es obligatorio.");
      if (tipoDestino === 'personal' && !personalId) throw new ClientException("La persona es obligatoria.");
      if (tipoDestino === 'objetivo' && !objetivoId) throw new ClientException("El objetivo es obligatorio.");
      if (tipoDestino === 'proveedor' && !proveedorId) throw new ClientException("El proveedor es obligatorio.");
      if (!efectos.length) throw new ClientException("Debe ingresar al menos un efecto.");

      for (let i = 0; i < efectos.length; i++) {
        const linea = efectos[i];
        const n = i + 1;
        if (!linea.EfectoId) throw new ClientException(`Línea ${n}: efecto obligatorio.`);
        if (!linea.UbicacionStockId) throw new ClientException(`Línea ${n}: ubicación obligatoria.`);
        if (linea.Cantidad == null || Number(linea.Cantidad) <= 0) throw new ClientException(`Línea ${n}: cantidad debe ser mayor a 0.`);

        const rows = await queryRunner.query(
          `SELECT TOP 1 stk.StockStock, stk.EfectoId
           FROM StockReal stk
           WHERE stk.StockId = @0`,
          [linea.UbicacionStockId]
        );
        const row = rows?.[0];
        if (!row) throw new ClientException(`Línea ${n}: la ubicación no existe.`);
        if (Number(row.EfectoId) !== Number(linea.EfectoId)) throw new ClientException(`Línea ${n}: la ubicación no corresponde al efecto seleccionado.`);
        const disponible = Number(row.StockStock ?? 0);
        if (Number(linea.Cantidad) > disponible) {
          throw new ClientException(`Línea ${n}: cantidad (${linea.Cantidad}) supera el stock disponible (${disponible}).`);
        }
      }

      this.jsonRes({ ok: true }, res, "Movimiento confirmado");
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async getObjetivoInfo(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);

    try {
      const objetivoId = Number(req.params.objetivoId);
      const anio = Number(req.params.anio);
      const mes = Number(req.params.mes);


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
    } finally {
      await queryRunner.release();
    }
  }

}
