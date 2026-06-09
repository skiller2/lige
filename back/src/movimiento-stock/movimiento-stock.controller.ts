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
      await queryRunner.startTransaction();

      const body = req.body ?? {};
      const simular         = body.simular === true;
      const tipoDestino     = String(body.tipoDestino ?? '');
      const depositoId      = Number(body.depositoId) || null;
      const personalId      = Number(body.personalId) || null;
      const objetivoId      = Number(body.objetivoId) || null;
      const proveedorId     = Number(body.proveedorId) || null;
      const observaciones   = String(body.observaciones ?? '');

      const efectos = Array.isArray(body.efectos) ? body.efectos : [];

      const fieldErrors: any[] = [];

      // validaciones 
      await this.validateForm(queryRunner, body.fecha, tipoDestino, depositoId, personalId, objetivoId, proveedorId, observaciones, fieldErrors , efectos);

     // Insert
     await this.insertMovimiento();

      if (simular) {
        await this.rollbackTransaction(queryRunner);
        return this.jsonRes({ ok: true, simulado: true }, res, 'Simulación correcta: el movimiento es válido.');
      }

      await queryRunner.commitTransaction();
      return this.jsonRes({ ok: true }, res, "Movimiento confirmado");
    } catch (error) {
      await this.rollbackTransaction(queryRunner);
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  private async insertMovimiento() {
  }

  private async validateForm( queryRunner: any, fechaRaw: any, tipoDestino: string, depositoId: number | null, personalId: number | null, objetivoId: number | null, proveedorId: number | null,
    observaciones: string | null, efectos: any[],
    fieldErrors: any[]
  ) {

    // Fecha
    const fecha = new Date(fechaRaw);
    if (!fechaRaw || isNaN(fecha.getTime()))
      fieldErrors.push({ fieldTree: 'fecha', kind: 'server', message: 'La fecha es obligatoria.' });

    // Tipo de destino obligatorio
    const tiposValidos = ['deposito', 'personal', 'objetivo', 'proveedor'];
    if (!tiposValidos.includes(tipoDestino))
      fieldErrors.push({ fieldTree: 'tipoDestino', kind: 'server', message: 'El tipo de destino es obligatorio.' });

    // El destino debe existir (id presente + registro en BD).
    const destinos = {
      deposito:  { id: depositoId,  tabla: 'Deposito',  columna: 'DepositoId',  field: 'depositoId',  obligatorio: 'El depósito es obligatorio.',  inexistente: 'El depósito no existe.' },
      personal:  { id: personalId,  tabla: 'Personal',  columna: 'PersonalId',  field: 'personalId',  obligatorio: 'La persona es obligatoria.',   inexistente: 'La persona no existe.' },
      objetivo:  { id: objetivoId,  tabla: 'Objetivo',  columna: 'ObjetivoId',  field: 'objetivoId',  obligatorio: 'El objetivo es obligatorio.',  inexistente: 'El objetivo no existe.' },
      proveedor: { id: proveedorId, tabla: 'Proveedor', columna: 'ProveedorId', field: 'proveedorId', obligatorio: 'El proveedor es obligatorio.', inexistente: 'El proveedor no existe.' },
    };
    const d = destinos[tipoDestino];
    if (d) {
      if (!d.id) {
        fieldErrors.push({ fieldTree: d.field, kind: 'server', message: d.obligatorio });
      } else {
        const rows = await queryRunner.query(`SELECT TOP 1 1 AS ok FROM ${d.tabla} WHERE ${d.columna} = @0`, [d.id]);
        if (!rows?.length) fieldErrors.push({ fieldTree: d.field, kind: 'server', message: d.inexistente });
      }

    // efecto
     if (!efectos.length) throw new ClientException("Debe ingresar al menos un efecto.");

    //////////////////////////////////////////////////////////////////////////////////////

      // --- Por renglón: requeridos, "Usado" y datos de StockReal (cacheados por StockId) ---
      const stockInfoById = new Map<number, any>();

      for (const [i, linea] of efectos.entries()) {
        if (!linea.EfectoId) fieldErrors.push({ fieldTree: `efectos[${i}].EfectoId`, kind: 'server', message: 'Efecto obligatorio.' });
        if (!linea.StockId)  fieldErrors.push({ fieldTree: `efectos[${i}].StockId`,  kind: 'server', message: 'Ubicación obligatoria.' });
        if (linea.Cantidad == null || Number(linea.Cantidad) <= 0)
          fieldErrors.push({ fieldTree: `efectos[${i}].Cantidad`, kind: 'server', message: 'La cantidad debe ser mayor a 0.' });

        // "Usado" tildado: pendiente de desarrollo.
        if (linea.Usado)
          fieldErrors.push({ fieldTree: `efectos[${i}].Usado`, kind: 'server', message: 'Pendiente de desarrollo.' });

        if (!linea.StockId) continue;

        if (!stockInfoById.has(Number(linea.StockId))) {
          const rows = await queryRunner.query(
            `SELECT TOP 1 stk.StockId, stk.StockStock, stk.EfectoId, stk.EfectoEfectoIndividualId,
                    stk.DepositoId, stk.PersonalId, stk.ObjetivoId, stk.ProveedorId
             FROM StockReal stk
             WHERE stk.StockId = @0`,
            [linea.StockId]
          );
          stockInfoById.set(Number(linea.StockId), rows?.[0] ?? null);
        }
        const row = stockInfoById.get(Number(linea.StockId));
        if (!row) {
          fieldErrors.push({ fieldTree: `efectos[${i}].StockId`, kind: 'server', message: 'La ubicación no existe.' });
          continue;
        }
        if (linea.EfectoId && Number(row.EfectoId) !== Number(linea.EfectoId))
          fieldErrors.push({ fieldTree: `efectos[${i}].StockId`, kind: 'server', message: 'La ubicación no corresponde al efecto seleccionado.' });
      }

      // --- Cantidades de stock: sumar Cantidad por StockId (mismo efecto+individual+lugar) y comparar contra el disponible ---
      const sumaPorStockId = new Map<number, { total: number; indices: number[] }>();
      for (const [i, linea] of efectos.entries()) {
        if (!linea.StockId || linea.Cantidad == null) continue;
        const acc = sumaPorStockId.get(Number(linea.StockId)) ?? { total: 0, indices: [] };
        acc.total += Number(linea.Cantidad);
        acc.indices.push(i);
        sumaPorStockId.set(Number(linea.StockId), acc);
      }
      for (const [stockId, acc] of sumaPorStockId) {
        const row = stockInfoById.get(stockId);
        if (!row) continue;
        const disponible = Number(row.StockStock ?? 0);
        if (acc.total > disponible)
          for (const i of acc.indices)
            fieldErrors.push({ fieldTree: `efectos[${i}].Cantidad`, kind: 'server', message: `La cantidad total (${acc.total}) para esta ubicación supera el stock disponible (${disponible}).` });
      }

      // --- Validar que no exista más de un StockId para el mismo lugar (por efecto/individual) ---
      const efectosChequeados = new Set<string>();
      for (const [i, linea] of efectos.entries()) {
        if (!linea.EfectoId) continue;
        const key = `${linea.EfectoId}|${linea.EfectoIndividualId ?? 'null'}`;
        if (efectosChequeados.has(key)) continue;
        efectosChequeados.add(key);
        const dup = await queryRunner.query(
          `SELECT TOP 1 1 AS dup
           FROM StockReal stk
           WHERE stk.EfectoId = @0
             AND ((@1 IS NULL AND stk.EfectoEfectoIndividualId IS NULL) OR stk.EfectoEfectoIndividualId = @1)
           GROUP BY stk.DepositoId, stk.PersonalId, stk.ObjetivoId, stk.ProveedorId
           HAVING COUNT(*) > 1`,
          [linea.EfectoId, linea.EfectoIndividualId ?? null]
        );
        if (dup?.length)
          fieldErrors.push({ fieldTree: `efectos[${i}].EfectoId`, kind: 'server', message: 'Existe más de un registro de stock para el mismo lugar (inconsistencia de datos).' });
      }

      if (fieldErrors.length > 0)
        throw new ClientException('Debe corregir los campos indicados.', { fieldErrors });


    }

    // Observación obligatoria según el destino.
    if (this.requiereObservacion(tipoDestino) && !observaciones?.trim())
      fieldErrors.push({ fieldTree: 'observaciones', kind: 'server', message: 'La observación es obligatoria para este destino.' });
  }

  private requiereObservacion(tipoDestino: string): boolean {
    const destinosConObservacion: string[] = [];
    return destinosConObservacion.includes(tipoDestino);
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
