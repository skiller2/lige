import { BaseController, ClientException } from "../controller/base.controller.ts";
import type { NextFunction, Request, Response } from "express";
import { getConnection } from "../data-source.ts";

const tiposDestino = [
  { value: "deposito", label: "Depósitos" },
  { value: "personal", label: "Personas" },
  { value: "objetivo", label: "Objetivos" },
  { value: "proveedor", label: "Proveedores" },
];

// Orígenes válidos para precargar las líneas de movimiento (buscador suelto bajo "Origen").
const tiposOrigen = [
  { value: "persona", label: "Persona" },
  { value: "objetivo", label: "Objetivo" },
];

export class MovimientoStockController extends BaseController {

  async getTiposDestino(req: Request, res: Response, next: NextFunction) {
    try {
      this.jsonRes(tiposDestino, res);
    } catch (error) {
      return next(error);
    } finally {
    }
  }

  async getTiposOrigen(req: Request, res: Response, next: NextFunction) {
    try {
      this.jsonRes(tiposOrigen, res);
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
      console.log('[confirmarMovimiento] body recibido:', JSON.stringify(body, null, 2));
      const fecha           = new Date(body.fecha);
      const tipoDestino     = String(body.tipoDestino ) ?? null ;
      const depositoId      = Number(body.depositoId) ?? null;
      const personalId      = Number(body.personalId) ?? null;
      const objetivoId      = Number(body.objetivoId) ?? null;
      const proveedorId     = Number(body.proveedorId) ?? null;
      const personalIdInter = Number(body.personalIdInter) ?? null;
      const observaciones   = String(body.observaciones) ?? '';
      
      const efectos: Array<{ EfectoId: number; StockId: number; Cantidad: number; EfectoIndividualId: number | null; Usado: boolean; isDelete?: boolean }> = Array.isArray(body.efectos) ? body.efectos : [];

      const fieldErrors: any[] = [];

      if (!fecha) fieldErrors.push({ fieldTree: 'fecha', kind: 'server', message: 'La fecha es obligatoria.' });
      //TODO:  Ojo lo está repitiendo
      const tiposValidos = ['deposito', 'personal', 'objetivo', 'proveedor'];
      if (!tiposValidos.includes(tipoDestino)) fieldErrors.push({ fieldTree: 'tipoDestino', kind: 'server', message: 'El tipo de destino es obligatorio.' });
      if (tipoDestino === 'deposito' && !depositoId) fieldErrors.push({ fieldTree: 'depositoId', kind: 'server', message: 'El depósito es obligatorio.' });
      if (tipoDestino === 'personal' && !personalId) fieldErrors.push({ fieldTree: 'personalId', kind: 'server', message: 'La persona es obligatoria.' });
      if (tipoDestino === 'objetivo' && !objetivoId) fieldErrors.push({ fieldTree: 'objetivoId', kind: 'server', message: 'El objetivo es obligatorio.' });
      if (tipoDestino === 'proveedor' && !proveedorId) fieldErrors.push({ fieldTree: 'proveedorId', kind: 'server', message: 'El proveedor es obligatorio.' });
      if (!efectos.length) throw new ClientException("Debe ingresar al menos un efecto.");

      for (let i = 0; i < efectos.length; i++) {
        const linea = efectos[i];
        const n = i + 1;
        console.log(`[confirmarMovimiento] linea ${n} -> EfectoId:`, linea.EfectoId, 'StockId:', linea.StockId, 'Cantidad:', linea.Cantidad, 'EfectoIndividualId:', linea.EfectoIndividualId, 'Usado:', linea.Usado, 'isDelete:', linea.isDelete);
        if (!linea.EfectoId) fieldErrors.push({ fieldTree: `efectos[${i}].EfectoId`, kind: 'server', message: 'Efecto obligatorio.' });
        if (!linea.StockId) fieldErrors.push({ fieldTree: `efectos[${i}].StockId`, kind: 'server', message: 'Ubicación obligatoria.' });
        if (linea.Cantidad == null || Number(linea.Cantidad) <= 0)
          fieldErrors.push({ fieldTree: `efectos[${i}].Cantidad`, kind: 'server', message: 'La cantidad debe ser mayor a 0.' });

        if (!linea.StockId) continue;

        const rows = await queryRunner.query(
          `SELECT TOP 1 stk.StockStock, stk.EfectoId
           FROM StockReal stk
           WHERE stk.StockId = @0`,
          [linea.StockId]
        );
        const row = rows?.[0];
        if (!row) {
          fieldErrors.push({ fieldTree: `efectos[${i}].StockId`, kind: 'server', message: 'La ubicación no existe.' });
          continue;
        }
        if (linea.EfectoId && Number(row.EfectoId) !== Number(linea.EfectoId))
          fieldErrors.push({ fieldTree: `efectos[${i}].StockId`, kind: 'server', message: 'La ubicación no corresponde al efecto seleccionado.' });
        const disponible = Number(row.StockStock ?? 0);
        if (linea.Cantidad != null && Number(linea.Cantidad) > disponible)
          fieldErrors.push({ fieldTree: `efectos[${i}].Cantidad`, kind: 'server', message: `La cantidad (${linea.Cantidad}) supera el stock disponible (${disponible}).` });
      }

      if (fieldErrors.length > 0)
        throw new ClientException('Debe corregir los campos indicados.', { fieldErrors });

      console.log('[confirmarMovimiento] observaciones:', observaciones);

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
