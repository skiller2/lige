import { BaseController, ClientException } from "../controller/base.controller.ts";
import { FileUploadController } from "../controller/file-upload.controller.ts";
import type { NextFunction, Request, Response } from "express";
import { getConnection } from "../data-source.ts";
import puppeteer from 'puppeteer';
import path from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from "node:fs";
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


  directoryDocumentos = process.env.PATH_DOCUMENTS ? process.env.PATH_DOCUMENTS : '.';

  PathComprobanteTemplate = {
    header: `${this.directoryDocumentos}/config/comprobante-stock/comprobante-stock-header.html`,
    body: `${this.directoryDocumentos}/config/comprobante-stock/comprobante-stock-body.html`,
    footer: `${this.directoryDocumentos}/config/comprobante-stock/comprobante-stock-footer.html`,
    headerDef: './assets/comprobante-stock/comprobante-stock-header.def.html',
    bodyDef: './assets/comprobante-stock/comprobante-stock-body.def.html',
    footerDef: './assets/comprobante-stock/comprobante-stock-footer.def.html',
  };

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

      const movimientoCodigo = await this.insertMovimiento(queryRunner, req, res, depositoId, personalId, objetivoId, proveedorId, observaciones, fecha, efectos);

      // Impacto en Stock: resta el origen, suma el destino
      await this.aplicarMovimientoStock(queryRunner, req, res, depositoId, personalId, objetivoId, proveedorId, efectos);

      // Simular: corre los INSERT reales pero hace rollback (no persiste, no consume el numerador).
      // No se genera el PDF (ni archivo ni descarga): la simulación solo valida que el movimiento es válido.
      if (simular) {
        await this.rollbackTransaction(queryRunner);
        return this.jsonRes({ ...body, simulado: true }, res, 'Simulación correcta: el movimiento es válido.');
      }

      // El comprobante NO se genera acá: la descarga es una petición única a POST /comprobante
      // (la dispara el front tras confirmar y también el botón de descarga manual).
      await queryRunner.commitTransaction();
      return this.jsonRes({ ...body, movimientoStockCodigo: movimientoCodigo }, res, "Movimiento confirmado");
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
      const EfectoEfectoIndividualId = efecto.EfectoIndividualId ?? null
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
      } else if (Number(resStock[0]?.StockId) !== Number(StockId)) {
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
        fieldErrors.push({ fieldTree: `efectos[${index}].Usado`, kind: 'server', message: 'Pendiente de desarrollo.' });
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

      const movimientoCodigo = Number(req.body?.movimientoStockCodigo) || null;

      // Idempotente: si el movimiento ya tiene comprobante generado se reutiliza ese archivo;
      // si no, se genera (y queda enlazado al movimiento). Así descargas repetidas no duplican Documentos.
      let filesPathAbs: string;
      let nombreArchivo: string;
      const existente = movimientoCodigo ? await this.getComprobanteExistente(queryRunner, movimientoCodigo) : null;
      const rutaExistente = existente ? path.join(this.directoryDocumentos, existente.DocumentoPath) : '';
      if (existente && existsSync(rutaExistente)) {
        // Reutiliza el comprobante ya generado (idempotente).
        filesPathAbs = rutaExistente;
        nombreArchivo = existente.DocumentoNombreArchivo || path.basename(existente.DocumentoPath);
      } else {
        // No hay comprobante previo, o el archivo físico no existe (registro huérfano): se (re)genera
        // con la plantilla actual y queda enlazado al movimiento.
        ({ filesPathAbs, nombreArchivo } = await this.generarDocumentoIngresoStock(queryRunner, req, res, movimientoCodigo));
      }

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

  // Devuelve el Documento ya enlazado al movimiento (si existe), para reutilizarlo en la descarga.
  private async getComprobanteExistente(queryRunner: any, movimientoCodigo: number) {
    const rows = await queryRunner.query(`
      SELECT TOP 1 doc.DocumentoId, doc.DocumentoPath, doc.DocumentoNombreArchivo
      FROM MovimientoStock mov
      JOIN Documento doc ON doc.DocumentoId = mov.MovimientoStockDocumentoId
      WHERE mov.MovimientoStockCodigo = @0 AND mov.MovimientoStockDocumentoId IS NOT NULL
    `, [movimientoCodigo]);
    return rows?.[0] ?? null;
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

    // El alta del Documento (numerador, INSERT, copia del archivo y ruta según DocumentoTipo) la
    // centraliza FileUploadController.handleDOCUpload. Acá solo generamos el PDF en la carpeta
    // temporal para que esa función lo tome como si fuera un archivo subido.
    const tempCarpeta = path.join(this.directoryDocumentos, 'temp');
    if (!existsSync(tempCarpeta)) mkdirSync(tempCarpeta, { recursive: true });

    const tempfilename = `movstk-${movimientoCodigo ?? 'sin-mov'}-${fechaActual.getTime()}.pdf`;
    const tempPathAbs = path.join(tempCarpeta, tempfilename);

    // Renderiza el comprobante con la plantilla configurada (config/comprobante-stock) y los
    // datos del movimiento recién generado.
    await this.renderComprobantePdf(queryRunner, tempPathAbs, movimientoCodigo, usuario);

    // Denominador del documento: el código de movimiento cuando existe.
    const denDocumento = movimientoCodigo ? `${movimientoCodigo}` : 'ingreso';

    // Objeto "file" mínimo que espera handleDOCUpload (mismo shape que un upload real).
    const file = {
      tableForSearch: 'Documento',
      doctipo_id: 'MOVSTK',
      ind_descarga_bot: 0,
      tempfilename,
      mimetype: 'application/pdf',
    };

    const { doc_id, newFilePath } = await FileUploadController.handleDOCUpload(
      null,          // personal_id
      null,          // objetivo_id
      null,          // cliente_id
      0,             // doc_id (0 => alta de un nuevo documento)
      fechaActual,   // fecha
      null,          // fec_doc_ven
      denDocumento,  // den_documento
      anio,
      mes,
      file,
      usuario,
      ip,
      queryRunner
    );

    // Limpia el archivo temporal una vez copiado a su ubicación definitiva.
    try { await unlink(tempPathAbs); } catch (error) { }

    // Solo si hay movimiento de referencia se enlaza el documento.
    if (movimientoCodigo) {
      await queryRunner.query(
        `UPDATE MovimientoStock SET MovimientoStockDocumentoId = @1 WHERE MovimientoStockCodigo = @0`,
        [movimientoCodigo, doc_id]
      );
    }

    const filesPathAbs = path.join(this.directoryDocumentos, newFilePath);
    const nombreArchivo = path.basename(newFilePath);

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

    // El intermediario no puede ser la misma persona seleccionada como destino.
    if (personalIdInter && (personalIdInter===personalId)) {
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

  // ----- Configuración de la plantilla del comprobante (config/comprobante-stock) -----

  // Guarda las plantillas editadas; conserva la versión previa con sufijo .old (igual que recibos/novedades).
  async setComprobanteConfig(req: Request, res: Response, next: NextFunction) {
    const header = req.body.header;
    const body = req.body.body;
    const footer = req.body.footer;

    try {
      if (body == "")
        throw new ClientException(`El cuerpo no puede estar vacio`);

      if (header == "")
        throw new ClientException(`La cabecera no puede estar vacia`);

      try {
        renameSync(this.PathComprobanteTemplate.header, this.PathComprobanteTemplate.header + '.old');
        renameSync(this.PathComprobanteTemplate.body, this.PathComprobanteTemplate.body + '.old');
        renameSync(this.PathComprobanteTemplate.footer, this.PathComprobanteTemplate.footer + '.old');
      } catch (_e) { }

      mkdirSync(path.dirname(this.PathComprobanteTemplate.header), { recursive: true });
      writeFileSync(this.PathComprobanteTemplate.header, header);
      writeFileSync(this.PathComprobanteTemplate.body, body);
      writeFileSync(this.PathComprobanteTemplate.footer, footer);

      this.jsonRes([], res, `Se guardo el nuevo formato de comprobante`);
    } catch (error) {
      return next(error);
    } finally {
    }
  }

  // Devuelve las plantillas (raw, sin reemplazo de variables) para mostrarlas en el editor.
  // prev=true devuelve la versión .old (la anterior a la última guardada).
  async getComprobanteConfig(req: Request, res: Response, next: NextFunction) {
    const prev: boolean = (req.params.prev === 'true');
    try {
      const htmlContent = await this.getComprobanteHtmlContentGeneral(new Date(), '', '', '', true, prev);
      this.jsonRes({ header: htmlContent.header, body: htmlContent.body, footer: htmlContent.footer }, res);
    } catch (error) {
      return next(error);
    } finally {
    }
  }

  // Resuelve las tres partes de la plantilla. Si raw=false reemplaza las variables independientes
  // del movimiento (logo, fecha). Las variables que dependen del movimiento las reemplaza createPdf.
  async getComprobanteHtmlContentGeneral(fecha: Date, header: string = "", body: string = "", footer: string = "", raw: boolean = false, prev: boolean = false) {
    const imgBuffer = readFileSync(`./assets/logo-lince-full.svg`);
    const imgBase64 = imgBuffer.toString('base64');

    header = (header) ? header : (existsSync(this.PathComprobanteTemplate.header) ? readFileSync(this.PathComprobanteTemplate.header + ((prev) ? '.old' : ''), 'utf-8') : readFileSync(this.PathComprobanteTemplate.headerDef, 'utf-8'));
    body = (body) ? body : (existsSync(this.PathComprobanteTemplate.body) ? readFileSync(this.PathComprobanteTemplate.body + ((prev) ? '.old' : ''), 'utf-8') : readFileSync(this.PathComprobanteTemplate.bodyDef, 'utf-8'));
    footer = (footer) ? footer : (existsSync(this.PathComprobanteTemplate.footer) ? readFileSync(this.PathComprobanteTemplate.footer + ((prev) ? '.old' : ''), 'utf-8') : readFileSync(this.PathComprobanteTemplate.footerDef, 'utf-8'));

    if (!raw) {
      header = header.replace(/\${imgBase64}/g, imgBase64);
      header = header.replace(/\${fechaFormateada}/g, this.dateOutputFormat(fecha));
    }
    return { header, body, footer };
  }

  // Cabecera del movimiento + nombre del destino resuelto (depósito/persona/proveedor/objetivo).
  private async getMovimientoCabecera(queryRunner: any, movimientoCodigo: number) {
    const rows = await queryRunner.query(`
      SELECT TOP 1 mov.MovimientoStockCodigo, mov.Fecha, mov.Observaciones,
        COALESCE(
          TRIM(depd.DepositoNombre),
          CONCAT(TRIM(perd.PersonalApellido), ', ', TRIM(perd.PersonalNombre)),
          TRIM(prod.ProveedorRazonSocial),
          IIF(mov.ClienteIdDestino IS NULL, NULL,
            CONCAT(mov.ClienteIdDestino, IIF(mov.ClienteElementoDependienteIdDestino IS NULL, '', CONCAT('/', mov.ClienteElementoDependienteIdDestino)),
              IIF(eled.ClienteElementoDependienteDescripcion IS NULL, '', CONCAT(' ', TRIM(eled.ClienteElementoDependienteDescripcion)))))
        ) AS Destino
      FROM MovimientoStock mov
      LEFT JOIN Deposito depd ON depd.DepositoId = mov.DepositoIdDestino
      LEFT JOIN Personal perd ON perd.PersonalId = mov.PersonalIdDestino
      LEFT JOIN Proveedor prod ON prod.ProveedorId = mov.ProveedorIdDestino
      LEFT JOIN ClienteElementoDependiente eled ON eled.ClienteId = mov.ClienteIdDestino AND eled.ClienteElementoDependienteId = mov.ClienteElementoDependienteIdDestino
      WHERE mov.MovimientoStockCodigo = @0
    `, [movimientoCodigo]);
    return rows?.[0] ?? null;
  }

  // Detalle del movimiento: descripción del efecto, origen resuelto y cantidad.
  private async getMovimientoDetalle(queryRunner: any, movimientoCodigo: number) {
    return queryRunner.query(`
      SELECT det.MovimientoStockDetalleCodigo, det.Cantidad,
        CONCAT(TRIM(efe.EfectoDescripcion),
          IIF(efeind.EfectoEfectoIndividualDescripcion IS NULL, '', CONCAT(' - ', TRIM(efeind.EfectoEfectoIndividualDescripcion)))) AS EfectoDescripcionCompleto,
        COALESCE(
          TRIM(depo.DepositoNombre),
          CONCAT(TRIM(pero.PersonalApellido), ', ', TRIM(pero.PersonalNombre)),
          TRIM(proo.ProveedorRazonSocial),
          IIF(det.ClienteIdOrigen IS NULL, NULL,
            CONCAT(det.ClienteIdOrigen, IIF(det.ClienteElementoDependienteOrigen IS NULL, '', CONCAT('/', det.ClienteElementoDependienteOrigen))))
        ) AS Origen
      FROM MovimientoStockDetalle det
      LEFT JOIN EfectoDescripcion efe ON efe.EfectoId = det.EfectoId
      LEFT JOIN EfectoIndividualDescripcion efeind ON efeind.EfectoId = det.EfectoId AND efeind.EfectoEfectoIndividualId = det.EfectoIndividualId
      LEFT JOIN Deposito depo ON depo.DepositoId = det.DepositoIdOrigen
      LEFT JOIN Personal pero ON pero.PersonalId = det.PersonalIdOrigen
      LEFT JOIN Proveedor proo ON proo.ProveedorId = det.ProveedorIdOrigen
      WHERE det.MovimientoStockCodigo = @0
      ORDER BY det.MovimientoStockDetalleCodigo
    `, [movimientoCodigo]);
  }

  // Genera el PDF del comprobante a partir de la plantilla configurada y los datos del movimiento.
  // Si no hay movimiento de referencia (botón suelto) las variables quedan vacías.
  private async renderComprobantePdf(
    queryRunner: any,
    filePathAbs: string,
    movimientoCodigo: number | null,
    usuario: string = "",
    header: string = "",
    body: string = "",
    footer: string = "",
    waterMark: string = ""
  ) {
    const cabecera = movimientoCodigo ? await this.getMovimientoCabecera(queryRunner, movimientoCodigo) : null;
    const detalle = movimientoCodigo ? await this.getMovimientoDetalle(queryRunner, movimientoCodigo) : [];

    const fecha = cabecera?.Fecha ? new Date(cabecera.Fecha) : new Date();
    const content = await this.getComprobanteHtmlContentGeneral(fecha, header, body, footer);

    // Origen del movimiento: distintos orígenes del detalle (puede variar por renglón).
    const origenes = [...new Set((detalle ?? []).map((d: any) => d.Origen).filter(Boolean))];
    const origen = origenes.join(' / ') || 'Sin especificar';
    const destino = cabecera?.Destino || 'Sin especificar';
    const observaciones = cabecera?.Observaciones || '';

    let textefectos = '';
    for (const linea of detalle ?? []) {
      textefectos += `<tr><td>${linea.EfectoDescripcionCompleto ?? ''}</td><td>${linea.Origen ?? ''}</td><td class="cant">${linea.Cantidad}</td></tr>`;
    }

    let headerContent = content.header.replace(/\${movimientoCodigo}/g, movimientoCodigo ? movimientoCodigo.toString() : '');

    // Pie: fecha de impresión (ahora) y usuario que genera el comprobante.
    let footerContent = content.footer.replace(/\${fechaImpresion}/g, this.dateOutputFormat(new Date()));
    footerContent = footerContent.replace(/\${usuario}/g, usuario || '');

    let htmlContent = content.body;
    htmlContent = htmlContent.replace(/\${origen}/g, origen);
    htmlContent = htmlContent.replace(/\${destino}/g, destino);
    htmlContent = htmlContent.replace(/\${observaciones}/g, observaciones);
    htmlContent = htmlContent.replace(/\${textefectos}/g, textefectos);
    htmlContent = htmlContent.replace(/\${movimientoCodigo}/g, movimientoCodigo ? movimientoCodigo.toString() : '');
    htmlContent = htmlContent.replace(/\${fechaFormateada}/g, this.dateOutputFormat(fecha));

    const browser = await puppeteer.launch({ headless: 'new' });
    try {
      const page = await browser.newPage();
      await page.setContent(htmlContent + waterMark);
      try { await unlink(filePathAbs); } catch (error) { }
      await page.pdf({
        path: filePathAbs,
        margin: { top: '80px', right: '0px', bottom: '50px', left: '0px' },
        printBackground: true,
        format: 'A4',
        displayHeaderFooter: true,
        headerTemplate: headerContent,
        footerTemplate: footerContent,
      });
      await page.close();
    } finally {
      await browser.close();
    }
  }

  // Descarga un comprobante de prueba con marca de agua, renderizando la plantilla recibida
  // (sin guardar) usando los datos de un movimiento existente.
  async downloadComprobantePrueba(req: Request, res: Response, next: NextFunction) {
    const header = req.body.header;
    const body = req.body.body;
    const footer = req.body.footer;
    const movimientoCodigo = Number(req.body.movimientoStockCodigo);
    const queryRunner = await getConnection(res.locals.userName);
    const fechaActual = new Date();
    let filePath = "";

    try {
      if (!movimientoCodigo)
        throw new ClientException(`Debe indicar un código de movimiento`);

      const cabecera = await this.getMovimientoCabecera(queryRunner, movimientoCodigo);
      if (!cabecera)
        throw new ClientException(`Movimiento no encontrado`);

      const waterMark = `<div style="position: fixed; bottom: 500px; left: 50px; z-index: 10000; font-size:200px; color: red; transform:rotate(-60deg);
                        opacity: 0.6;">PRUEBA</div>`;

      const tempCarpeta = path.join(this.directoryDocumentos, 'temp');
      if (!existsSync(tempCarpeta)) mkdirSync(tempCarpeta, { recursive: true });
      filePath = path.join(tempCarpeta, `comprobante-test-${movimientoCodigo}-${fechaActual.getTime()}.pdf`);

      await this.renderComprobantePdf(queryRunner, filePath, movimientoCodigo, res.locals.userName, header, body, footer, waterMark);

      res.download(filePath, `ComprobanteTest-${movimientoCodigo}.pdf`, async (err) => {
        try { await unlink(filePath); } catch (error) { }
        if (err) return next(err);
      });
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

}
