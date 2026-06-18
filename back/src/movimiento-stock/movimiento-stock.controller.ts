import { BaseController, ClientException } from "../controller/base.controller.ts";
import type { NextFunction, Request, Response } from "express";
import { getConnection } from "../data-source.ts";
import puppeteer from 'puppeteer';
import path from 'path';
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { unlink } from "fs/promises";

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

  // Raíz de documentos (igual criterio que recibos). Los PDF de stock van en la subcarpeta 'movimiento-stock'.
  directoryDocumentos = process.env.PATH_DOCUMENTS ? process.env.PATH_DOCUMENTS : '.';

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
      const simular = body.simular === true;
      const depositoId = Number(body.depositoId) || null;
      const personalId = Number(body.personalId) || null;
      const personalIdInter = Number(body.personalIdInter) || null;
      const objetivoId = Number(body.objetivoId) || null;
      const proveedorId = Number(body.proveedorId) || null;
      const observaciones = String(body.observaciones ?? '');
      const efectos = body.efectos;

      // validaciones 
      await this.validateForm(queryRunner, body.fecha, depositoId, personalId, personalIdInter, objetivoId, proveedorId, observaciones, efectos);

      const fecha = new Date(body.fecha)
      // Alta del movimiento (cabecera MovimientoStock + detalle). Consume el numerador.

      const movimientoCodigo = await this.insertMovimiento(queryRunner, req, res, depositoId, personalId, personalIdInter, objetivoId, proveedorId, observaciones, fecha, efectos);

      // Impacto en Stock: resta el origen, suma el destino
      await this.aplicarMovimientoStock(queryRunner, req, res, depositoId, personalId, objetivoId, proveedorId, efectos);

      // Documento PDF en blanco: genera el archivo en disco + registro Documento enlazado al movimiento.
      const { filesPathAbs, nombreArchivo } = await this.generarDocumentoIngresoStock(queryRunner, req, res, movimientoCodigo);

      // El PDF se devuelve en el body (base64) para que el front actualice estado y dispare la descarga
      // en una sola respuesta (no se puede res.download + jsonRes a la vez).
      const pdfBase64 = readFileSync(filesPathAbs).toString('base64');

      // Simular: corre los INSERT reales pero hace rollback (no persiste, no consume el numerador).
      // El archivo PDF ya quedó escrito en disco y devuelto en base64, se descarga igual en ambos casos.
      if (simular) {
        await this.rollbackTransaction(queryRunner);
        return this.jsonRes({ ...body, simulado: true, nombreArchivo, pdfBase64 }, res, 'Simulación correcta: el movimiento es válido.');
      }

      await queryRunner.commitTransaction();
      return this.jsonRes({ ...body, nombreArchivo, pdfBase64 }, res, "Movimiento confirmado");
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
    depositoId: number | null,
    personalId: number | null,
    personalIdIntermediario: number | null,
    objetivoId: number | null,
    proveedorId: number | null,
    observaciones: string, fecha: Date, efectos: any[]
  ) {
    const usuario = res.locals.userName;
    const ip = this.getRemoteAddress(req);
    const fechaActual = new Date();

    // Código del movimiento desde GenNumerador (lo crea en 1 si no existe, o incrementa).
    const movimientoCodigo = await BaseController.getProxNumero(queryRunner, 'MovimientoStock', usuario, ip);

    // Destino: cada tipo cae en su columna. El objetivo se resuelve a Cliente + ElementoDependiente.
    let clienteIdDestino: number | null = null;
    let clienteElemDepDestino: number | null = null;

    if (objetivoId) {
      const obj = await this.getObjetivoCliente(queryRunner, objetivoId);
      clienteIdDestino = obj?.ClienteId ?? null;
      clienteElemDepDestino = obj?.ClienteElementoDependienteId ?? null;
    }

    await queryRunner.query(
      `INSERT INTO MovimientoStock
        (MovimientoStockCodigo, Fecha, PersonalIdDestino, ProveedorIdDestino, ClienteIdDestino,
         ClienteElementoDependienteIdDestino, DepositoIdDestino, Observaciones,
         AudFechaIng, AudFechaMod, AudUsuarioIng, AudUsuarioMod, AudIpIng, AudIpMod)
       VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@11,@12,@13)`,
      [movimientoCodigo, fecha, personalId, proveedorId, clienteIdDestino,
        clienteElemDepDestino, depositoId, observaciones,
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
           AudFechaIng, AudFechaMod, AudIpIng, AudIpMod, AudUsuarioIng, AudUsuarioMod)
         VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@11,@12,@13,@14,@15,@16,@17)`,
        [detalleCodigo, linea.EfectoId, linea.EfectoIndividualId, linea.Cantidad,
          stk.PersonalId, stk.DepositoId, stk.ProveedorId, clienteIdOrigen, clienteElemDepOrigen,
          movimientoCodigo, linea.Usado ? 1 : 0, linea.Cantidad,
          fechaActual, fechaActual, ip, ip, usuario, usuario]
      );
    }

    return movimientoCodigo;
  }

  private async aplicarMovimientoStock(
    queryRunner: any, req: any, res: any,
    depositoId: number | null, personalId: number | null, objetivoId: number | null, proveedorId: number | null,
    efectos: any[]

  ) {
    const usuario = res.locals.userName;
    const ip = this.getRemoteAddress(req);
    let fieldErrors = []
    for (const [index, efecto] of efectos.entries()) {
      const EfectoId = Number(efecto.EfectoId)
      const EfectoEfectoIndividualId = efecto.EfectoEfectoIndividualId
      const Cantidad = efecto.Cantidad
      const StockId = efecto.StockId
      const usado = efecto.Usado
      const resStock = await queryRunner.query(
        `SELECT stk.StockId, stk.EfectoId, stk.EfectoEfectoIndividualId, stk.StockStock, stk.PersonalId, stk.DepositoId, stk.ObjetivoId, stk.ProveedorId 
            FROM Stock stk

            LEFT JOIN Stock stk1 
              ON (
                (stk1.PersonalId = stk.PersonalId OR (stk1.PersonalId IS NULL AND stk.PersonalId IS NULL))
                AND (stk1.DepositoId = stk.DepositoId OR (stk1.DepositoId IS NULL AND stk.DepositoId IS NULL))
                AND (stk1.ObjetivoId = stk.ObjetivoId OR (stk1.ObjetivoId IS NULL AND stk.ObjetivoId IS NULL))
                AND (stk1.ProveedorId = stk.ProveedorId OR (stk1.ProveedorId IS NULL AND stk.ProveedorId IS NULL))
                AND stk1.EfectoId = stk.EfectoId
                AND (
                  stk1.EfectoEfectoIndividualId = stk.EfectoEfectoIndividualId
                  OR (stk1.EfectoEfectoIndividualId IS NULL AND stk.EfectoEfectoIndividualId IS NULL)
                )
              )
            WHERE stk1.StockId = @0 AND stk1.EfectoId=@1
          AND (stk1.EfectoEfectoIndividualId = @2 OR (@2 IS NULL AND stk1.EfectoEfectoIndividualId IS NULL))
        `,
        [StockId, EfectoId, EfectoEfectoIndividualId]
      );
      if (resStock.length > 1) {
        fieldErrors.push({ fieldTree: `efectos[${index}].StockId`, kind: 'server', message: `La ubicación de origen tiene mas de un registro de stock (inconsistencia de datos)` });
      } else if (resStock[0]?.StockStock != StockId) {
        fieldErrors.push({ fieldTree: `efectos[${index}].StockId`, kind: 'server', message: `La ubicación no es válida para el Efecto (inconsistencia de datos)` });
      }

      if ((resStock[0]?.PersonalId && resStock[0]?.PersonalId == personalId) ||
        (resStock[0]?.DepositoId && resStock[0]?.DepositoId == depositoId) ||
        (resStock[0]?.ProveedorId && resStock[0]?.ProveedorId == proveedorId) ||
        (resStock[0]?.ObjetivoId && resStock[0]?.ObjetivoId == objetivoId)
      ) {
        fieldErrors.push({ fieldTree: `efectos[${index}].StockId`, kind: 'server', message: `Lugar destino es igual al origen` });
      }

      const CantidadActual = resStock[0]?.StockStock || 0

      // Restar al origen.
      if (Cantidad > CantidadActual) {
        fieldErrors.push({ fieldTree: `efectos[${index}].Cantidad`, kind: 'server', message: `La cantidad excede el stock ${CantidadActual}` });
      } else if (Cantidad == CantidadActual) {
        await queryRunner.query(`DELETE FROM Stock WHERE StockId = @0`, [StockId]);
      } else {
        await queryRunner.query(`UPDATE Stock SET StockStock = @1 WHERE StockId = @0`, [StockId, CantidadActual - Cantidad]);
      }

      if (usado) {
        //TODO: Cambia EfectoId o EfectoEfectoIndividualId y le agrega el indicador de usado.  Por ahí tiene que crear un nuevo EfectoId si no tiene ninguno como usado.
      }
      // Suma en destino.
      const ressuma = await queryRunner.query(`UPDATE Stock SET StockStock = StockStock + @6 WHERE 
            ( DepositoId = @0 OR (@0 IS NULL AND DepositoId IS NULL)) 
        AND ( PersonalId = @1 OR (@1 IS NULL AND PersonalId IS NULL))
        AND ( ObjetivoId = @2 OR (@2 IS NULL AND ObjetivoId IS NULL))
        AND ( ProveedorId = @3 OR (@3 IS NULL AND ProveedorId IS NULL))
        AND EfectoId = @4
        AND ( EfectoEfectoIndividualId = @5 OR (@5 IS NULL AND EfectoEfectoIndividualId IS NULL))
        SELECT @@ROWCOUNT as affected
`,
        [depositoId, personalId, objetivoId, proveedorId, EfectoId, EfectoEfectoIndividualId, Cantidad])

      const cantRegistros = ressuma[0]?.affected ?? 0;
      if (cantRegistros == 0) {
        await queryRunner.query(
          `INSERT INTO Stock (DepositoId,PersonalId,ObjetivoId,ProveedorId, EfectoId, EfectoEfectoIndividualId, StockStock)
          VALUES (@0, @1, @2, @3,@4,@5,@6)`,
          [depositoId, personalId, objetivoId, proveedorId, EfectoId, EfectoEfectoIndividualId, Cantidad]
        );

      } else if (cantRegistros > 1) {
        fieldErrors.push({ fieldTree: `efectos[${index}].StockId`, kind: 'server', message: `La ubicación destino tiene mas de un registro de stock para el efecto (inconsistencia de datos)` });
      }
    }

    if (fieldErrors.length > 0)
      throw new ClientException('Debe solucionar los errores indicados en el formulario', { fieldErrors });
  }

  /**
   * Reemplaza la relación de efecto de una línea: elimina la relación previa del efecto "De"
   * (el que se mueve) sin verificar si existe, y da de alta la nueva relación con el efecto "Con"
   * (RelacionEfectoId). El contexto de ubicación es el destino del movimiento (EfectoRelacionEfecto
   * solo tiene Personal/Deposito/Objetivo). Semántica De/Con según getEfectoRelaciones (efecto.controller).
   */
  /* RELACIONAR DESHABILITADO (por el momento no se usa). Se conserva para reactivar junto al front.
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
  */

  async descargarComprobante(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);
    try {
      await queryRunner.startTransaction();

      // Cuando se pase, vendrá en el body; hoy es null (botón suelto, sin movimiento de referencia).
      const movimientoCodigo = Number(req.body?.movimientoStockCodigo) || null;

      const { filesPathAbs, nombreArchivo } = await this.generarDocumentoIngresoStock(queryRunner, req, res, movimientoCodigo);

      await queryRunner.commitTransaction();

      res.download(filesPathAbs, nombreArchivo, (err) => {
        if (err) return next(err);
      });
    } catch (error) {
      await this.rollbackTransaction(queryRunner);
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  private async generarDocumentoIngresoStock(
    queryRunner: any,
    req: any,
    res: any,
    movimientoCodigo: number | null
  ): Promise<{ filesPathAbs: string; nombreArchivo: string }> {
    const usuario = res.locals.userName;
    const ip = this.getRemoteAddress(req);
    const fechaActual = new Date();
    const anio = fechaActual.getFullYear();
    const mes = fechaActual.getMonth() + 1;

    // DocumentoId nuevo desde el numerador (mismo numerador 'Documento' que usan los recibos).
    const documentoId = await BaseController.getProxNumero(queryRunner, 'Documento', usuario, ip);

    // Carpeta destino: <PATH_DOCUMENTS>/movimiento-stock. En Documento.DocumentoPath se guarda la ruta relativa.
    const subCarpeta = 'movimiento-stock';
    const dirAbs = path.join(this.directoryDocumentos, subCarpeta);
    if (!existsSync(dirAbs)) mkdirSync(dirAbs, { recursive: true });

    const nombreArchivo = movimientoCodigo ? `${documentoId}-${movimientoCodigo}.pdf` : `${documentoId}.pdf`;
    const filesPathRel = `${subCarpeta}/${nombreArchivo}`;
    const filesPathAbs = path.join(this.directoryDocumentos, filesPathRel);

    // PDF vacío (una página en blanco). Cuando se defina el diseño se reemplaza el HTML.
    const browser = await puppeteer.launch({ headless: 'new' });
    try {
      const page = await browser.newPage();
      await page.setContent('<html><body></body></html>');
      try { await unlink(filesPathAbs); } catch (error) { }
      await page.pdf({ path: filesPathAbs, format: 'A4', printBackground: true });
      await page.close();
    } finally {
      await browser.close();
    }

    await queryRunner.query(
      `INSERT INTO Documento
        (DocumentoId, DocumentoTipoCodigo, PersonalId, ObjetivoId,
         DocumentoDenominadorDocumento, DocumentoNombreArchivo, DocumentoFecha, DocumentoFechaDocumentoVencimiento,
         DocumentoPath, DocumentoDetalleDocumento, DocumentoIndividuoDescargaBot,
         DocumentoAudFechaIng, DocumentoAudUsuarioIng, DocumentoAudIpIng,
         DocumentoAudFechaMod, DocumentoAudUsuarioMod, DocumentoAudIpMod,
         DocumentoClienteId, DocumentoAnio, DocumentoMes, DocumentoVersion)
       VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@11,@12,@13,@14,@15,@16,@17,@18,@19,@20)`,
      [documentoId, 'MOVSTK', null, null,
        movimientoCodigo, nombreArchivo, fechaActual, null,
        filesPathRel, null, 0,
        fechaActual, usuario, ip,
        fechaActual, usuario, ip,
        null, anio, mes, 0]
    );

    // Solo si hay movimiento de referencia se enlaza el documento.
    if (movimientoCodigo) {
      await queryRunner.query(
        `UPDATE MovimientoStock SET MovimientoStockDocumentoId = @1 WHERE MovimientoStockCodigo = @0`,
        [movimientoCodigo, documentoId]
      );
    }

    return { filesPathAbs, nombreArchivo };
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

  private async validateForm(queryRunner: any, fechaRaw: any, depositoId: number | null, personalId: number | null, personalIdInter: number | null, objetivoId: number | null, proveedorId: number | null,
    observaciones: string | null, efectos: any
  ) {
    let fieldErrors = []



    const fecha = new Date(fechaRaw);
    if (!fechaRaw || isNaN(fecha.getTime()))
      fieldErrors.push({ fieldTree: 'fecha', kind: 'server', message: 'La fecha es obligatoria.' });

    if (depositoId == null && personalId == null && objetivoId == null && proveedorId == null)
      fieldErrors.push({ fieldTree: 'tipoDestino', kind: 'server', message: 'El tipo de destino es obligatorio.' });

    const countDestino = (depositoId != null ? 1 : 0) + (personalId != null ? 1 : 0) + (objetivoId != null ? 1 : 0) + (proveedorId != null ? 1 : 0);

    if (countDestino !== 1) {
      fieldErrors.push({
        fieldTree: 'tipoDestino',
        kind: 'server',
        message: 'Debe informar solo un tipo de destino.'
      });
    }

    if (personalIdInter && personalIdInter==personalId){
      fieldErrors.push({
        fieldTree: 'personalIdInter',
        kind: 'server',
        message: 'El intermediario no puede ser igual a la persona seleccionada'
      });

    }

    // Observación obligatoria según el destino.
    if (!observaciones.trim() && depositoId) {
      const deposito = await queryRunner.query(
        `SELECT dep.IndRequiereObservacion FROM Deposito dep
             WHERE dep.DepositoId = @0`,
        [depositoId]
      );
      const IndRequiereObservacion = (deposito[0]?.IndRequiereObservacion == 1) ? 1 : 0
      if (IndRequiereObservacion)
        fieldErrors.push({ fieldTree: 'observaciones', kind: 'server', message: 'La observación es obligatoria para este destino.' });
    }

    // efecto
    if (!efectos.length) throw new ClientException("Debe ingresar al menos un efecto.");

    //////////////////////////////////////////////////////////////////////////////////////

    // --- Por renglón: requeridos, "Usado" y datos de StockReal (cacheados por StockId) ---
    //const stockInfoById = new Map<number, any>();

    for (const [i, linea] of efectos.entries()) {
      if (!linea.EfectoId) fieldErrors.push({ fieldTree: `efectos[${i}].EfectoId`, kind: 'server', message: 'Efecto obligatorio.' });
      if (!linea.StockId) fieldErrors.push({ fieldTree: `efectos[${i}].StockId`, kind: 'server', message: 'Ubicación obligatoria.' });
      if (linea.Cantidad == null || Number(linea.Cantidad) <= 0)
        fieldErrors.push({ fieldTree: `efectos[${i}].Cantidad`, kind: 'server', message: 'La cantidad debe ser mayor a 0.' });

      // "Usado" tildado: pendiente de desarrollo.
      if (linea.Usado)
        fieldErrors.push({ fieldTree: `efectos[${i}].Usado`, kind: 'server', message: 'Pendiente de desarrollo.' });

      const rows = await queryRunner.query(
        `SELECT TOP 1 stk.StockId, stk.StockStock, stk.EfectoId, stk.EfectoEfectoIndividualId,
                    stk.DepositoId, stk.PersonalId, stk.ObjetivoId, stk.ProveedorId
             FROM StockReal stk
             WHERE stk.StockId = @0`,
        [linea.StockId]
      );

      if (rows.length==0) {
        fieldErrors.push({ fieldTree: `efectos[${i}].StockId`, kind: 'server', message: 'La ubicación no existe.' });
        continue;
      }
      const row = rows[0]
      if (linea.EfectoId && Number(row.EfectoId) !== Number(linea.EfectoId))
        fieldErrors.push({ fieldTree: `efectos[${i}].StockId`, kind: 'server', message: 'La ubicación no corresponde al efecto seleccionado.' });
    }


    /*
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
    */

    if (fieldErrors.length > 0)
      throw new ClientException('Debe solucionar los errores indicados en el formulario', { fieldErrors });
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
