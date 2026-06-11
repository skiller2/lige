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

      const efectos = body.efectos;
      const fieldErrors: any[] = [];

      // validaciones 
      await this.validateForm(queryRunner, body.fecha, tipoDestino, depositoId, personalId, objetivoId, proveedorId, observaciones, efectos,fieldErrors );

      // Alta del movimiento (cabecera MovimientoStock + detalle). Consume el numerador.
      const movimientoCodigo = await this.insertMovimiento(queryRunner, req, res, tipoDestino, depositoId, personalId, objetivoId, proveedorId, observaciones, body.fecha, efectos);

      // Impacto en Stock: resta el origen, suma el destino (unificando duplicados) y reemplaza relaciones de efecto.
      await this.aplicarMovimientoStock(queryRunner, req, res, tipoDestino, depositoId, personalId, objetivoId, proveedorId, efectos);

      // Simular: corre los INSERT reales pero hace rollback (no persiste, no consume el numerador).
      if (simular) {
        await this.rollbackTransaction(queryRunner);
        return this.jsonRes({ ...body, simulado: true }, res, 'Simulación correcta: el movimiento es válido.');
      }

      await queryRunner.commitTransaction();
      return this.jsonRes({ ...body }, res, "Movimiento confirmado");
    } catch (error) {
      await this.rollbackTransaction(queryRunner);
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  /** INSERT en MovimientoStock + MovimientoStockDetalle. Devuelve el MovimientoStockCodigo generado. */
  private async insertMovimiento(
    queryRunner: any, req: any, res: any,
    tipoDestino: string,
    depositoId: number | null,
     personalId: number | null, 
     objetivoId: number | null,
      proveedorId: number | null,
    observaciones: string, fechaRaw: any, efectos: any[]
  ) {
    const usuario = res.locals.userName;
    const ip = this.getRemoteAddress(req);
    const fechaActual = new Date();
    const fecha = new Date(fechaRaw);

    // Código del movimiento desde GenNumerador (lo crea en 1 si no existe, o incrementa).
    const movimientoCodigo = await BaseController.getProxNumero(queryRunner, 'MovimientoStock', usuario, ip);

    // Destino: cada tipo cae en su columna. El objetivo se resuelve a Cliente + ElementoDependiente.
    let personalIdDestino: number | null = null;
    let proveedorIdDestino: number | null = null;
    let clienteIdDestino: number | null = null;
    let clienteElemDepDestino: number | null = null;
    let depositoIdDestino: number | null = null;
    switch (tipoDestino) {
      case 'personal':  personalIdDestino  = personalId;  break;
      case 'proveedor': proveedorIdDestino = proveedorId; break;
      case 'deposito':  depositoIdDestino  = depositoId;  break;
      case 'objetivo': {
        const obj = await this.getObjetivoCliente(queryRunner, objetivoId);
        clienteIdDestino = obj?.ClienteId ?? null;
        clienteElemDepDestino = obj?.ClienteElementoDependienteId ?? null;
        break;
      }
    }

    await queryRunner.query(
      `INSERT INTO MovimientoStock
        (MovimientoStockCodigo, Fecha, PersonalIdDestino, ProveedorIdDestino, ClienteIdDestino,
         ClienteElementoDependienteIdDestino, DepositoIdDestino, Observaciones,
         AudFechaIng, AudFechaMod, AudUsuarioIng, AudUsuarioMod, AudIpIng, AudIpMod)
       VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@11,@12,@13)`,
      [movimientoCodigo, fecha, personalIdDestino, proveedorIdDestino, clienteIdDestino,
       clienteElemDepDestino, depositoIdDestino, observaciones,
       fechaActual, fechaActual, usuario, usuario, ip, ip]
    );

    // Detalle: un INSERT por renglón. MovimientoStockDetalleCodigo incremental desde 1 en este movimiento.
    let detalleCodigo = 0;
    for (const linea of efectos) {
      detalleCodigo++;

      // Origen: sale del StockReal de la ubicación elegida. El objetivo se resuelve a Cliente + ElementoDependiente.
      const stkRows = await queryRunner.query(
        `SELECT TOP 1 DepositoId, PersonalId, ObjetivoId, ProveedorId FROM StockReal WHERE StockId = @0`,
        [linea.StockId]
      );
      const stk = stkRows?.[0] ?? {};
      let clienteIdOrigen: number | null = null;
      let clienteElemDepOrigen: number | null = null;
      if (stk.ObjetivoId) {
        const obj = await this.getObjetivoCliente(queryRunner, stk.ObjetivoId);
        clienteIdOrigen = obj?.ClienteId ?? null;
        clienteElemDepOrigen = obj?.ClienteElementoDependienteId ?? null;
      }

      await queryRunner.query(
        `INSERT INTO MovimientoStockDetalle
          (MovimientoStockDetalleCodigo, EfectoId, EfectoIndividualId, Cantidad,
           PersonalIdOrigen, DepositoIdOrigen, ProveedorIdOrigen, ClienteIdOrigen, ClienteElementoDependienteOrigen,
           MovimientoStockCodigo, IndEfectoUsado, CantidadOrigen,
           AudFechaIng, AudFechaMod, AudIpIng, AudIpMod, AudUsuarioIng, AudUsuarioMod, StockIdOrigen)
         VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@11,@12,@13,@14,@15,@16,@17,@18)`,
        [detalleCodigo, linea.EfectoId, linea.EfectoIndividualId , linea.Cantidad,
         stk.PersonalId, stk.DepositoId, stk.ProveedorId , clienteIdOrigen, clienteElemDepOrigen,
         movimientoCodigo, linea.Usado ? 1 : 0, linea.Cantidad,
         fechaActual, fechaActual, ip, ip, usuario, usuario, linea.StockId]
      );
    }

    return movimientoCodigo;
  }

  // Columnas de ubicación de la tabla Stock (una sola se completa por registro; el resto va NULL).
  private static readonly STOCK_UBIC_COLS = ['DepositoId', 'PersonalId', 'ObjetivoId', 'ProveedorId', 'SucursalAreaId'];

  private async aplicarMovimientoStock(
    queryRunner: any, req: any, res: any,
    tipoDestino: string,
    depositoId: number | null, personalId: number | null, objetivoId: number | null, proveedorId: number | null,
    efectos: any[]
  ) {
    const usuario = res.locals.userName;
    const ip = this.getRemoteAddress(req);
    const fechaActual = new Date();

    const destino = this.resolverUbicacionDestino(tipoDestino, depositoId, personalId, objetivoId, proveedorId);

    // Agrupar la cantidad a mover por StockId de origen (un StockId define ubicación + efecto + individual).
    const totalPorStock = new Map<number, number>();
    for (const linea of efectos) {
      if (!linea.StockId || linea.Cantidad == null) continue;
      const id = Number(linea.StockId);
      totalPorStock.set(id, (totalPorStock.get(id) ?? 0) + Number(linea.Cantidad));
    }

    for (const [stockIdOrigen, cantidad] of totalPorStock) {
      // Lectura fresca dentro de la transacción (no se confía en el StockStock del front).
      const origenRows = await queryRunner.query(
        `SELECT TOP 1 StockId, EfectoId, EfectoEfectoIndividualId, StockStock FROM Stock WHERE StockId = @0`,
        [stockIdOrigen]
      );
      const origen = origenRows?.[0];
      if (!origen)
        throw new ClientException(`No se encontró el stock de origen (StockId ${stockIdOrigen}).`);
      if (cantidad > Number(origen.StockStock ?? 0))
        throw new ClientException(`La cantidad a mover (${cantidad}) supera el stock disponible (${Number(origen.StockStock ?? 0)}) en la ubicación de origen.`);

      // Restar al origen.
      await queryRunner.query(`UPDATE Stock SET StockStock = StockStock - @1 WHERE StockId = @0`, [stockIdOrigen, cantidad]);

      // Sumar al destino (mismo efecto/individual).
      await this.sumarStockDestino(queryRunner, destino, origen.EfectoId, origen.EfectoEfectoIndividualId, cantidad, usuario, ip);
    }

    for (const linea of efectos) {
      if (!linea.RelacionEfectoId) continue;
      await this.reemplazarRelacionEfecto(queryRunner, linea, tipoDestino, depositoId, personalId, objetivoId, usuario, ip, fechaActual);
    }
  }

  /** Mapea el tipo de destino a la columna de ubicación de Stock y su id. */
  private resolverUbicacionDestino(
    tipoDestino: string,
    depositoId: number | null, personalId: number | null, objetivoId: number | null, proveedorId: number | null
  ): { columna: string; valor: number } {
    switch (tipoDestino) {
      case 'deposito':  return { columna: 'DepositoId',  valor: depositoId! };
      case 'personal':  return { columna: 'PersonalId',  valor: personalId! };
      case 'objetivo':  return { columna: 'ObjetivoId',  valor: objetivoId! };
      case 'proveedor': return { columna: 'ProveedorId', valor: proveedorId! };
      default: throw new ClientException('Tipo de destino inválido.');
    }
  }

  /**
   * Suma `cantidad` al registro de Stock del destino para el efecto+individual dados.
   * Si no existe lo crea (StockId nuevo, SucursalId NULL). Si existe más de uno (datos
   * inconsistentes) unifica todo en el de menor StockId y borra el resto.
   */
  private async sumarStockDestino(
    queryRunner: any,
    destino: { columna: string; valor: number },
    efectoId: number | null, efectoIndividualId: number | null,
    cantidad: number, usuario: string, ip: string
  ) {
    const otrasNull = MovimientoStockController.STOCK_UBIC_COLS
      .filter(c => c !== destino.columna)
      .map(c => `${c} IS NULL`)
      .join(' AND ');

    const rows = await queryRunner.query(
      `SELECT StockId, StockStock FROM Stock
       WHERE ${destino.columna} = @0
         AND EfectoId = @1
         AND ((@2 IS NULL AND EfectoEfectoIndividualId IS NULL) OR EfectoEfectoIndividualId = @2)
         AND ${otrasNull}
       ORDER BY StockId`,
      [destino.valor, efectoId, efectoIndividualId]
    );

    if (!rows?.length) {
      // No existe: alta con StockId nuevo desde el numerador.
      const nuevoStockId = await BaseController.getProxNumero(queryRunner, 'Stock', usuario, ip);
      await queryRunner.query(
        `INSERT INTO Stock (StockId, ${destino.columna}, EfectoId, EfectoEfectoIndividualId, StockStock)
         VALUES (@0, @1, @2, @3, @4)`,
        [nuevoStockId, destino.valor, efectoId, efectoIndividualId, cantidad]
      );
      return;
    }

    // Unificar en el registro ganador (menor StockId): suma cantidad + el stock de los duplicados.
    const ganadora = rows[0];
    const resto = rows.slice(1);
    const sumaResto = resto.reduce((acc: number, r: any) => acc + Number(r.StockStock ?? 0), 0);

    await queryRunner.query(
      `UPDATE Stock SET StockStock = StockStock + @1 WHERE StockId = @0`,
      [ganadora.StockId, cantidad + sumaResto]
    );
    for (const r of resto) {
      await queryRunner.query(`DELETE FROM Stock WHERE StockId = @0`, [r.StockId]);
    }
  }

  /**
   * Reemplaza la relación de efecto de una línea: elimina la relación previa del efecto "De"
   * (el que se mueve) sin verificar si existe, y da de alta la nueva relación con el efecto "Con"
   * (RelacionEfectoId). El contexto de ubicación es el destino del movimiento (EfectoRelacionEfecto
   * solo tiene Personal/Deposito/Objetivo). Semántica De/Con según getEfectoRelaciones (efecto.controller).
   */
  private async reemplazarRelacionEfecto(
    queryRunner: any, linea: any,
    tipoDestino: string, depositoId: number | null, personalId: number | null, objetivoId: number | null,
    usuario: string, ip: string, fechaActual: Date
  ) {
    const deEfectoId = linea.EfectoId;
    const deIndividual = linea.EfectoIndividualId ?? null;
    const conEfectoId = linea.RelacionEfectoId;
    const conIndividual = linea.RelacionEfectoIndividualId ?? null;

    const relPersonalId = tipoDestino === 'personal' ? personalId : null;
    const relDepositoId = tipoDestino === 'deposito' ? depositoId : null;
    const relObjetivoId = tipoDestino === 'objetivo' ? objetivoId : null;

    // DELETE directo de la relación anterior (sin SELECT previo).
    await queryRunner.query(
      `DELETE FROM EfectoRelacionEfecto
       WHERE EfectoRelacionDeEfectoId = @0
         AND ((@1 IS NULL AND EfectoRelacionDeEfectoEfectoIndividualId IS NULL) OR EfectoRelacionDeEfectoEfectoIndividualId = @1)
         AND ((@2 IS NULL AND PersonalId IS NULL) OR PersonalId = @2)
         AND ((@3 IS NULL AND DepositoId IS NULL) OR DepositoId = @3)
         AND ((@4 IS NULL AND ObjetivoId IS NULL) OR ObjetivoId = @4)`,
      [deEfectoId, deIndividual, relPersonalId, relDepositoId, relObjetivoId]
    );

    // Alta de la nueva relación.
    const relId = await BaseController.getProxNumero(queryRunner, 'EfectoRelacionEfecto', usuario, ip);
    await queryRunner.query(
      `INSERT INTO EfectoRelacionEfecto
        (EfectoRelacionEfectoId, EfectoRelacionDeEfectoId, EfectoRelacionDeEfectoEfectoIndividualId,
         EfectoRelacionConEfectoId, EfectoRelacionConEfectoEfectoIndividualId,
         PersonalId, DepositoId, ObjetivoId,
         EfectoRelacionEfectoAudFechaIng, EfectoRelacionEfectoAudUsuarioIng, EfectoRelacionEfectoAudIpIng,
         EfectoRelacionEfectoAudFechaMod, EfectoRelacionEfectoAudUsuarioMod, EfectoRelacionEfectoAudIpMod)
       VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@11,@12,@13)`,
      [relId, deEfectoId, deIndividual, conEfectoId, conIndividual,
       relPersonalId, relDepositoId, relObjetivoId,
       fechaActual, usuario, ip, fechaActual, usuario, ip]
    );
  }

  /** Resuelve un ObjetivoId a su Cliente + ElementoDependiente (para columnas de origen/destino). */
  private async getObjetivoCliente(queryRunner: any, objetivoId: number | null) {
    if (!objetivoId) return null;
    const rows = await queryRunner.query(
      `SELECT TOP 1 ClienteId, ClienteElementoDependienteId FROM Objetivo WHERE ObjetivoId = @0`,
      [objetivoId]
    );
    return rows?.[0] ?? null;
  }

  private async validateForm( queryRunner: any, fechaRaw: any, tipoDestino: string, depositoId: number | null, personalId: number | null, objetivoId: number | null, proveedorId: number | null,
    observaciones: string | null, efectos: any,
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
    }

    // Observación obligatoria según el destino.
    if (this.requiereObservacion(tipoDestino) && !observaciones?.trim())
      fieldErrors.push({ fieldTree: 'observaciones', kind: 'server', message: 'La observación es obligatoria para este destino.' });

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
