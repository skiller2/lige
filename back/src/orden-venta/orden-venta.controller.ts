import { BaseController, ClientException } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import { AsistenciaController } from "../controller/asistencia.controller.ts";
import type { NextFunction, Request, Response } from "express";

const columnasGrilla: any[] = [
  {
    id: "id",
    name: "id",
    field: "id",
    fieldName: "id",
    type: "number",
    sortable: false,
    hidden: true,
    searchHidden: true
  },
  {
    id: "ProductoCodigo",
    name: "Cód. Producto",
    field: "ProductoCodigo",
    fieldName: "fac.ProductoCodigo",
    type: "string",
    sortable: true,
    hidden: true,
    searchHidden: true
  },
  {
    id: "Producto",
    name: "Producto",
    field: "Producto",
    fieldName: "prod.Nombre",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: "Cantidad",
    name: "Cantidad",
    field: "Cantidad",
    fieldName: "fac.Cantidad",
    type: "number",
    sortable: true,
    hidden: false,
    searchHidden: true,
    maxWidth: 120
  },
  {
    id: "ImporteUnitario",
    name: "Importe Unitario",
    field: "ImporteUnitario",
    fieldName: "ImporteUnitario",
    type: "currency",
    sortable: true,
    hidden: false,
    searchHidden: true,
    maxWidth: 160
  },
  {
    id: "TextoFactura",
    name: "Texto de Factura",
    field: "TextoFactura",
    fieldName: "fac.TextoFactura",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: "CantidadEnFactura",
    name: "Cantidad en Factura",
    field: "CantidadEnFactura",
    fieldName: "CantidadEnFactura",
    type: "number",
    sortable: true,
    hidden: false,
    searchHidden: true,
    maxWidth: 160
  },
  {
    id: "ImporteTotal",
    name: "Importe Total",
    field: "ImporteTotal",
    fieldName: "ImporteTotal",
    type: "currency",
    sortable: true,
    hidden: false,
    searchHidden: true,
    maxWidth: 160
  }
];

const ESTADO_ORDEN_VENTA_INICIAL = 'PEN';
const TIPO_IMPORTE_LISTA_PRECIO = 'LP';

export class OrdenVentaController extends BaseController {

  async getGridCols(req: Request, res: Response) {
    this.jsonRes(columnasGrilla, res);
  }

  // Período anterior al recibido
  private static periodoAnterior(anio: number, mes: number) {
    return mes > 1 ? { anio, mes: mes - 1 } : { anio: anio - 1, mes: 12 };
  }

  // Orden de venta del objetivo para el período, o undefined si todavía no se generó
  private static async getOrdenVentaPeriodo(queryRunner: any, ObjetivoId: number, anio: number, mes: number) {
    const ordenes = await queryRunner.query(`
      SELECT TOP 1
        ord.NroOrdenVenta, ord.ClienteId, ord.ClienteElementoDependienteId,
        ord.PeriodoAnio, ord.PeriodoMes, ord.EstadoOrdenVentaCodigo, ord.ImporteTotalAFacturar
      FROM Objetivo obj
      JOIN OrdenVenta ord ON ord.ClienteId = obj.ClienteId
        AND ord.ClienteElementoDependienteId = ISNULL(obj.ClienteElementoDependienteId,0)
      WHERE obj.ObjetivoId = @0 AND ord.PeriodoAnio = @1 AND ord.PeriodoMes = @2
      ORDER BY ord.NroOrdenVenta DESC
    `, [ObjetivoId, anio, mes]);

    return ordenes[0];
  }

  // El detalle sale de ItemOrdenVenta. Si la orden del período todavía no existe, se inicializa
  // con los ítems del mes anterior, revaluados con el precio vigente del período pedido.
  async getListOrdenVenta(req: Request, res: Response, next: NextFunction) {
    const ObjetivoId = Number(req.body.ObjetivoId);
    const anio = Number(req.body.anio);
    const mes = Number(req.body.mes);
    const queryRunner = await getConnection(res.locals.userName);

    try {
      const orden = await OrdenVentaController.getOrdenVentaPeriodo(queryRunner, ObjetivoId, anio, mes);
      const anterior = OrdenVentaController.periodoAnterior(anio, mes);

      // Sin orden propia se copia la del mes anterior: los ítems son nuevos (id 0), pero el
      // detalle se arrastra completo.
      const ordenBase = orden ?? await OrdenVentaController.getOrdenVentaPeriodo(queryRunner, ObjetivoId, anterior.anio, anterior.mes);
      const esNueva = !orden;

      let items: any[] = [];

      if (ordenBase) {
        items = await queryRunner.query(`
          SELECT
            IIF(@1 = 1, 0, item.ItemOrdenVentaCodigo) AS id,
            item.ProductoCodigo,
            prod.Nombre AS Producto,
            item.TipoCantidad,
            IIF(pre.Importe IS NULL, 'V', 'LP') AS TipoImporte,
            IIF(pre.Importe IS NULL, 0, 1) AS PrecioDeLista,
            item.Cantidad,
            item.CantidadEstandar,
            item.Bonificacion,
            ISNULL(pre.Importe, item.ImporteUnitario) AS ImporteUnitario,
            item.TextoFactura,
            item.CantidadEnFactura,
            ISNULL(item.Cantidad,0) * ISNULL(ISNULL(pre.Importe, item.ImporteUnitario),0) AS ImporteTotal
          FROM ItemOrdenVenta item
          LEFT JOIN Producto prod ON prod.ProductoCodigo = item.ProductoCodigo
          OUTER APPLY (
            SELECT TOP 1 pp.Importe
            FROM ProductoPrecio pp
            WHERE pp.ProductoCodigo = item.ProductoCodigo
              AND pp.ClienteId = @2
              AND pp.PeriodoDesdeAplica <= EOMONTH(DATEFROMPARTS(@3,@4,1))
            ORDER BY pp.PeriodoDesdeAplica DESC
          ) pre
          WHERE item.NroOrdenVenta = @0
          ORDER BY item.ItemOrdenVentaCodigo
        `, [ordenBase.NroOrdenVenta, esNueva ? 1 : 0, ordenBase.ClienteId, anio, mes]);
      }

      this.jsonRes(
        {
          total: items.length,
          list: items,
          esNueva,
          NroOrdenVenta: orden?.NroOrdenVenta ?? null,
          // De dónde salió el detalle, para avisar en pantalla que es una orden inicializada
          origenAnio: esNueva && ordenBase ? anterior.anio : anio,
          origenMes: esNueva && ordenBase ? anterior.mes : mes,
        },
        res
      );

    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async getCabecera(req: Request, res: Response, next: NextFunction) {
    const ObjetivoId = Number(req.params.ObjetivoId);
    const anio = Number(req.params.anio);
    const mes = Number(req.params.mes);
    const queryRunner = await getConnection(res.locals.userName);

    try {
      const cabecera = await queryRunner.query(`
        SELECT
          @1 AS Anio,
          @2 AS Mes,
          obj.ObjetivoId, obj.ClienteId, ISNULL(obj.ClienteElementoDependienteId,0) AS ClienteElementoDependienteId,
          CONCAT(obj.ClienteId,'/',ISNULL(obj.ClienteElementoDependienteId,0),' ',TRIM(ISNULL(cli.ClienteDenominacion,'')),' ',TRIM(ISNULL(eledep.ClienteElementoDependienteDescripcion,''))) AS ObjetivoNombre,
          ord.NroOrdenVenta,
          ord.EstadoOrdenVentaCodigo,
          ord.ImporteTotalAFacturar,
          est.Descripcion AS EstadoOrdenVenta
        FROM Objetivo obj
        LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
        LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteId = obj.ClienteId AND eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
        OUTER APPLY (
          SELECT TOP 1 ov.NroOrdenVenta, ov.EstadoOrdenVentaCodigo, ov.ImporteTotalAFacturar
          FROM OrdenVenta ov
          WHERE ov.ClienteId = obj.ClienteId
            AND ov.ClienteElementoDependienteId = ISNULL(obj.ClienteElementoDependienteId,0)
            AND ov.PeriodoAnio = @1 AND ov.PeriodoMes = @2
          ORDER BY ov.NroOrdenVenta DESC
        ) ord
        LEFT JOIN EstadoOrdenVenta est ON est.EstadoOrdenVentaCod = ord.EstadoOrdenVentaCodigo
        WHERE obj.ObjetivoId = @0
      `, [ObjetivoId, anio, mes]);

      const asistencia = await AsistenciaController.getObjetivoAsistencia(anio, mes, [`obj.ObjetivoId = ${ObjetivoId}`], queryRunner)

      this.jsonRes(
        {
          ...(cabecera[0] ?? {}),
          TotalHorasNormales: Number(asistencia.TotalHorasReal ?? 0)
        },
        res
      );

    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  // Alta o modificación de la orden del período, con su detalle completo.
  async setOrdenVenta(req: Request, res: Response, next: NextFunction) {
    const ObjetivoId = Number(req.body.ObjetivoId);
    const anio = Number(req.body.anio);
    const mes = Number(req.body.mes);
    const ClienteId = Number(req.body.ClienteId);
    const ClienteElementoDependienteId = Number(req.body.ClienteElementoDependienteId);
    const detalle: any[] = Array.isArray(req.body.items) ? req.body.items : [];
    const Observaciones = req.body.Observaciones ?? null;

    const queryRunner = await getConnection(res.locals.userName);

    try {
      const usuario = res.locals.userName;
      const ip = this.getRemoteAddress(req);
      const ahora = new Date();

      const errores: string[] = [];

      if (req.body.anio == null || String(req.body.anio).trim() === '')
        errores.push('El año es obligatorio');

      if (req.body.mes == null || String(req.body.mes).trim() === '')
        errores.push('El mes es obligatorio');

      if (req.body.ClienteId == null || String(req.body.ClienteId).trim() === '')
        errores.push('El cliente es obligatorio');

      // Cero es un valor válido: es el objetivo sin elemento dependiente
      if (req.body.ClienteElementoDependienteId == null || String(req.body.ClienteElementoDependienteId).trim() === '')
        errores.push('El elemento dependiente del cliente es obligatorio');

      if (errores.length)
        throw new ClientException(errores);

      const items = detalle.filter(item => String(item?.ProductoCodigo ?? '').trim());
      if (!items.length)
        throw new ClientException('La orden de venta debe tener al menos un producto');

      // Los códigos del detalle tienen que existir en Producto: una sola consulta para todos
      const codigos = [...new Set(items.map(item => String(item.ProductoCodigo).trim()))];
      const productos = await queryRunner.query(
        `SELECT ProductoCodigo FROM Producto WHERE ProductoCodigo IN (${codigos.map((_, indice) => `@${indice}`).join(',')})`,
        codigos);

      const existentes = new Set(productos.map((producto: any) => String(producto.ProductoCodigo).trim().toUpperCase()));
      const inexistentes = codigos.filter(codigo => !existentes.has(codigo.toUpperCase()));
      if (inexistentes.length)
        throw new ClientException(inexistentes.map(codigo => `El producto ${codigo} no existe`));

      const objetivos = await queryRunner.query(`
        SELECT obj.ClienteId, ISNULL(obj.ClienteElementoDependienteId,0) AS ClienteElementoDependienteId
        FROM Objetivo obj WHERE obj.ObjetivoId = @0
      `, [ObjetivoId]);

      const objetivo = objetivos[0];
      if (!objetivo)
        throw new ClientException(`No se encontró el objetivo ${ObjetivoId}`);

      // La orden se guarda contra el cliente del objetivo: si no es el de la pantalla, los datos
      // terminarían en un cliente distinto al que se está editando
      if (Number(objetivo.ClienteId) !== ClienteId)
        throw new ClientException(`El objetivo ${ObjetivoId} no pertenece al cliente ${ClienteId}`);

      if (Number(objetivo.ClienteElementoDependienteId) !== ClienteElementoDependienteId)
        throw new ClientException(
          `El objetivo ${ObjetivoId} no corresponde al elemento dependiente ${ClienteElementoDependienteId} del cliente ${ClienteId}`);

      // El importe unitario de un producto con precio de lista lo fija la lista, no la pantalla:
      // el input llega deshabilitado, así que lo que mande el cliente para esos ítems se descarta.
      const precios = await queryRunner.query(`
        SELECT pp.ProductoCodigo, pp.Importe
        FROM ProductoPrecio pp
        JOIN (
          SELECT ProductoCodigo, MAX(PeriodoDesdeAplica) AS PeriodoDesdeAplica
          FROM ProductoPrecio
          WHERE ClienteId = @0
            AND PeriodoDesdeAplica <= EOMONTH(DATEFROMPARTS(@1,@2,1))
            AND ProductoCodigo IN (${codigos.map((_, indice) => `@${indice + 3}`).join(',')})
          GROUP BY ProductoCodigo
        ) ult ON ult.ProductoCodigo = pp.ProductoCodigo AND ult.PeriodoDesdeAplica = pp.PeriodoDesdeAplica
        WHERE pp.ClienteId = @0
      `, [objetivo.ClienteId, anio, mes, ...codigos]);

      const preciosLista = new Map<string, number>(precios.map(
        (precio: any) => [String(precio.ProductoCodigo).trim().toUpperCase(), Number(precio.Importe)]));

      for (const item of items) {
        const precio = preciosLista.get(String(item.ProductoCodigo).trim().toUpperCase());
        if (precio == null) continue;
        item.ImporteUnitario = precio;
        item.TipoImporte = TIPO_IMPORTE_LISTA_PRECIO;
      }

      // De la cantidad y el importe unitario sale el importe a facturar: tienen que ser números
      // no negativos en todos los ítems
      const camposNumericos = [
        { campo: 'Cantidad', nombre: 'La cantidad', obligatorio: 'obligatoria', negativo: 'negativa' },
        { campo: 'ImporteUnitario', nombre: 'El importe unitario', obligatorio: 'obligatorio', negativo: 'negativo' }
      ];
      const erroresItems: string[] = [];

      // TipoCantidad y TipoImporte son NOT NULL en la tabla
      const camposTipo = [
        { campo: 'TipoCantidad', nombre: 'El tipo de cantidad', obligatorio: 'obligatorio' },
        { campo: 'TipoImporte', nombre: 'El tipo de importe', obligatorio: 'obligatorio' }
      ];

      for (const [indice, item] of items.entries()) {
        const donde = `Ítem ${indice + 1} (${String(item.ProductoCodigo).trim()})`;

        for (const { campo, nombre, obligatorio } of camposTipo) {
          if (String(item[campo] ?? '').trim() === '')
            erroresItems.push(`${donde}: ${nombre} es ${obligatorio}`);
        }

        for (const { campo, nombre, obligatorio, negativo } of camposNumericos) {
          const valor = item[campo];

          if (valor == null || String(valor).trim() === '') {
            erroresItems.push(`${donde}: ${nombre} es ${obligatorio}`);
            continue;
          }

          const numero = Number(valor);
          if (!Number.isFinite(numero))
            erroresItems.push(`${donde}: ${nombre} '${valor}' no es un número válido`);
          else if (numero < 0)
            erroresItems.push(`${donde}: ${nombre} no puede ser ${negativo}`);
        }
      }

      if (erroresItems.length)
        throw new ClientException(erroresItems);


      await queryRunner.startTransaction();

      const orden = await OrdenVentaController.getOrdenVentaPeriodo(queryRunner, ObjetivoId, anio, mes);

      // Una vez emitida la factura el detalle ya no se toca
      if (orden) {
        const facturada = await queryRunner.query(
          `SELECT FechaGeneracionFactura FROM OrdenVenta WHERE NroOrdenVenta = @0`, [orden.NroOrdenVenta]);
        if (facturada[0]?.FechaGeneracionFactura)
          throw new ClientException(`La orden ${orden.NroOrdenVenta} ya tiene factura generada, no se puede modificar`);
      }

      const importeTotal = items.reduce(
        (total, item) => total + (Number(item.Cantidad ?? 0) * Number(item.ImporteUnitario ?? 0)), 0);

      let NroOrdenVenta = orden?.NroOrdenVenta;

      if (NroOrdenVenta) {
        await queryRunner.query(`
          UPDATE OrdenVenta
          SET ImporteTotalAFacturar = @1, Observaciones = @2, AudFechaMod = @3, AudUsuarioMod = @4, AudIpMod = @5
          WHERE NroOrdenVenta = @0
        `, [NroOrdenVenta, importeTotal, Observaciones, ahora, usuario, ip]);

      } else {
        const estados = await queryRunner.query(
          `SELECT EstadoOrdenVentaCod FROM EstadoOrdenVenta`);
        const codigos = estados.map((estado: any) => estado.EstadoOrdenVentaCod);
        if (!codigos.includes(ESTADO_ORDEN_VENTA_INICIAL))
          throw new ClientException(
            `El estado inicial '${ESTADO_ORDEN_VENTA_INICIAL}' no existe en EstadoOrdenVenta. Estados válidos: ${codigos.join(', ')}`);

        // NroOrdenVenta no es identity: se toma el siguiente dentro de la transacción
        const proximo = await queryRunner.query(
          `SELECT ISNULL(MAX(NroOrdenVenta),0) + 1 AS NroOrdenVenta FROM OrdenVenta WITH (UPDLOCK, HOLDLOCK)`);
        NroOrdenVenta = Number(proximo[0].NroOrdenVenta);

        await queryRunner.query(`
          INSERT INTO OrdenVenta (
            NroOrdenVenta, ClienteId, ClienteElementoDependienteId, PeriodoMes, PeriodoAnio,
            ImporteTotalAFacturar, EstadoOrdenVentaCodigo, Observaciones,
            UnificacionFactura, GeneracionFacturaReqCliente,
            AudFechaIng, AudFechaMod, AudUsuarioIng, AudUsuarioMod, AudIpIng, AudIpMod
          ) VALUES (@0, @1, @2, @3, @4, @5, @6, @7, 0, 0, @8, @8, @9, @9, @10, @10)
        `, [
          NroOrdenVenta, objetivo.ClienteId, objetivo.ClienteElementoDependienteId, mes, anio,
          importeTotal, ESTADO_ORDEN_VENTA_INICIAL, Observaciones, ahora, usuario, ip
        ]);
      }

      // El detalle se reescribe completo: así se resuelven altas, bajas y modificaciones juntas
      await queryRunner.query(`DELETE FROM ItemOrdenVenta WHERE NroOrdenVenta = @0`, [NroOrdenVenta]);

      for (const [indice, item] of items.entries()) {
        await queryRunner.query(`
          INSERT INTO ItemOrdenVenta (
            NroOrdenVenta, ItemOrdenVentaCodigo, ProductoCodigo, TextoFactura,
            TipoCantidad, Cantidad, TipoImporte, ImporteUnitario,
            CantidadEstandar, Bonificacion, CantidadEnFactura,
            AudFechaIng, AudFechaMod, AudUsuarioIng, AudUsuarioMod, AudIpIng, AudIpMod
          ) VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @11, @12, @12, @13, @13)
        `, [
          NroOrdenVenta,
          indice + 1,
          item.ProductoCodigo,
          item.TextoFactura ?? null,
          String(item.TipoCantidad).trim(),
          item.Cantidad != null ? Number(item.Cantidad) : null,
          String(item.TipoImporte).trim(),
          item.ImporteUnitario != null ? Number(item.ImporteUnitario) : null,
          item.CantidadEstandar != null ? Number(item.CantidadEstandar) : null,
          item.Bonificacion != null ? Number(item.Bonificacion) : null,
          item.CantidadEnFactura != null ? Number(item.CantidadEnFactura) : null,
          ahora, usuario, ip
        ]);
      }

      await queryRunner.commitTransaction();

      return this.jsonRes({ NroOrdenVenta, ImporteTotalAFacturar: importeTotal }, res,
        orden ? 'Orden de venta actualizada' : `Orden de venta ${NroOrdenVenta} generada`);

    } catch (error) {
      await this.rollbackTransaction(queryRunner);
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  // Precio sugerido del producto para el cliente del objetivo: el último vigente al cierre del período.
  async getPrecioProducto(req: Request, res: Response, next: NextFunction) {
    const ObjetivoId = Number(req.params.ObjetivoId);
    const anio = Number(req.params.anio);
    const mes = Number(req.params.mes);
    const ProductoCodigo = String(req.params.ProductoCodigo ?? '');
    const queryRunner = await getConnection(res.locals.userName);

    try {
      const precio = await queryRunner.query(`
        SELECT TOP 1
          pre.ProductoCodigo,
          pre.PeriodoDesdeAplica,
          pre.Importe AS ImporteUnitario
        FROM Objetivo obj
        JOIN ProductoPrecio pre ON pre.ClienteId = obj.ClienteId
        WHERE obj.ObjetivoId = @0
          AND pre.ProductoCodigo = @3
          AND pre.PeriodoDesdeAplica <= EOMONTH(DATEFROMPARTS(@1,@2,1))
        ORDER BY pre.PeriodoDesdeAplica DESC
      `, [ObjetivoId, anio, mes, ProductoCodigo]);

      // PrecioDeLista: el importe unitario sale de la lista del cliente y no se edita
      this.jsonRes(
        precio[0]
          ? { ...precio[0], PrecioDeLista: 1 }
          : { ProductoCodigo, ImporteUnitario: null, PrecioDeLista: 0 },
        res);

    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }
}
