import { BaseController, ClientException } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import { AsistenciaController } from "../controller/asistencia.controller.ts";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros.ts";
import type { Options } from "../schemas/filtro.ts";
import type { NextFunction, Request, Response } from "express";


const ESTADO_ORDEN_VENTA_INICIAL = 'PEN';

// Estado de la orden con comprobante emitido
const ESTADO_ORDEN_VENTA_FACTURADA = 'FAC';
const TIPO_IMPORTE_LISTA_PRECIO = 'LP';

// Tipo de los comprobantes que emite la orden de venta. Comprobante se relaciona por NroOrdenVenta
// y una orden puede tener más de uno.
const TIPO_COMPROBANTE_ORDEN_VENTA = 'ORD';

// Productos que facturan las horas 'A' y 'B'. Su importe no sale de la lista de precios sino de
// ObjetivoImporteVenta.ImporteHoraA / ImporteHoraB, del último Anio/Mes <= al período del
// cliente/elemento.
const PRODUCTO_HORAS_A = 'SSF';
const PRODUCTO_HORAS_B = 'SSFB';

// Columnas de la grilla de órdenes de venta (cabecera), usadas por la pantalla Órdenes de Venta
const columnasGrillaOrdenes: any[] = [
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
    id: "NroOrdenVenta",
    name: "Número",
    field: "NroOrdenVenta",
    fieldName: "ord.NroOrdenVenta",
    type: "number",
    searchType: "numberAdvanced",
    searchComponent: "inputForNumberAdvancedSearch",
    sortable: true,
    hidden: false,
    searchHidden: false,
    maxWidth: 110
  },
  {
    id: "Fecha",
    name: "Fecha",
    field: "Fecha",
    fieldName: "ord.AudFechaIng",
    type: "date",
    searchType: "date",
    searchComponent: "inputForFechaSearch",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    id: "PeriodoAnio",
    name: "Año",
    field: "PeriodoAnio",
    fieldName: "ord.PeriodoAnio",
    type: "number",
    searchType: "numberAdvanced",
    searchComponent: "inputForNumberAdvancedSearch",
    sortable: true,
    hidden: false,
    searchHidden: false,
    maxWidth: 90
  },
  {
    id: "PeriodoMes",
    name: "Mes",
    field: "PeriodoMes",
    fieldName: "ord.PeriodoMes",
    type: "number",
    searchType: "numberAdvanced",
    searchComponent: "inputForNumberAdvancedSearch",
    sortable: true,
    hidden: false,
    searchHidden: false,
    maxWidth: 90
  },
  {
    id: "ClienteId",
    name: "Cliente",
    field: "ClienteId",
    fieldName: "ord.ClienteId",
    type: "number",
    searchComponent: "inputForClientSearch",
    sortable: true,
    hidden: true,
    searchHidden: false
  },
  {
    id: "Cliente",
    name: "Cliente",
    field: "Cliente",
    fieldName: "cli.ClienteDenominacion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: "ObjetivoId",
    name: "Objetivo",
    field: "ObjetivoId",
    fieldName: "obj.ObjetivoId",
    type: "number",
    searchComponent: "inputForObjetivoSearch",
    sortable: true,
    hidden: true,
    searchHidden: false
  },
  {
    id: "Objetivo",
    name: "Objetivo",
    field: "Objetivo",
    fieldName: "obj.ObjetivoDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: "Estado",
    name: "Estado",
    field: "Estado",
    fieldName: "est.Descripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: false,
    maxWidth: 140
  },
  {
    id: "ImporteTotalAFacturar",
    name: "Importe Total",
    field: "ImporteTotalAFacturar",
    fieldName: "ord.ImporteTotalAFacturar",
    type: "currency",
    searchType: "numberAdvanced",
    searchComponent: "inputForNumberAdvancedSearch",
    sortable: true,
    hidden: false,
    searchHidden: false,
    maxWidth: 160
  }
];

export class OrdenVentaController extends BaseController {

  async getGridColsOrdenes(req: Request, res: Response) {
    this.jsonRes(columnasGrillaOrdenes, res);
  }

  // Listado de cabeceras de órdenes de venta. El objetivo no está en OrdenVenta: se resuelve por
  // cliente/elemento dependiente, la misma relación que usa getOrdenVentaPeriodo.
  async getListOrdenesVenta(req: Request, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null };
      const filterSql = filtrosToSql(options.filtros, columnasGrillaOrdenes);
      const orderBy = orderToSQL(options.sort);

      const lista = await queryRunner.query(`
        SELECT
          ord.NroOrdenVenta AS id,
          ord.NroOrdenVenta,
         CONVERT(varchar(10), ord.AudFechaIng, 23) AS Fecha,
          ord.PeriodoAnio,
          ord.PeriodoMes,
          ord.ClienteId,
          ord.ClienteElementoDependienteId,
          TRIM(ISNULL(cli.ClienteDenominacion,'')) AS Cliente,
          obj.ObjetivoId,
          CONCAT(ord.ClienteId,'/',ord.ClienteElementoDependienteId,' ',TRIM(COALESCE(obj.ObjetivoDescripcion, eledep.ClienteElementoDependienteDescripcion, ''))) AS Objetivo,
          ord.EstadoOrdenVentaCodigo,
          ISNULL(est.Descripcion, ord.EstadoOrdenVentaCodigo) AS Estado,
          ISNULL(ord.ImporteTotalAFacturar,0) AS ImporteTotalAFacturar
        FROM OrdenVenta ord
        LEFT JOIN Cliente cli ON cli.ClienteId = ord.ClienteId
        LEFT JOIN ClienteElementoDependiente eledep
          ON eledep.ClienteId = ord.ClienteId
          AND eledep.ClienteElementoDependienteId = ord.ClienteElementoDependienteId
        LEFT JOIN EstadoOrdenVenta est ON est.EstadoOrdenVentaCod = ord.EstadoOrdenVentaCodigo
       OUTER APPLY (
          SELECT TOP 1 o.ObjetivoId, o.ObjetivoDescripcion
          FROM Objetivo o
          WHERE o.ClienteId = ord.ClienteId
            AND ISNULL(o.ClienteElementoDependienteId,0) = ISNULL(ord.ClienteElementoDependienteId,0)
          ORDER BY o.ObjetivoId
        ) obj
        WHERE (1=1)
        AND (${filterSql})
        ${orderBy ? orderBy : 'ORDER BY ord.PeriodoAnio DESC, ord.PeriodoMes DESC, ord.NroOrdenVenta DESC'}
      `);

      this.jsonRes({ total: lista.length, list: lista }, res);
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
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
            IIF(COALESCE(hs.ImporteHora, pre.Importe) IS NULL, 'V', 'LP') AS TipoImporte,
            IIF(COALESCE(hs.ImporteHora, pre.Importe) IS NULL, 0, 1) AS PrecioDeLista,
            item.Cantidad,
            item.CantidadEstandar,
            item.Bonificacion,
            COALESCE(hs.ImporteHora, pre.Importe, item.ImporteUnitario) AS ImporteUnitario,
            -- Todos los productos conservan el texto de factura que se les cargó, los de horas incluidos
            item.TextoFactura,
            item.CantidadEnFactura,
            ISNULL(item.Cantidad,0) * ISNULL(COALESCE(hs.ImporteHora, pre.Importe, item.ImporteUnitario),0) AS ImporteTotal
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
          OUTER APPLY (
            SELECT TOP 1
              IIF(item.ProductoCodigo = @6, oiv.ImporteHoraA, oiv.ImporteHoraB) AS ImporteHora
            FROM ObjetivoImporteVenta oiv
            WHERE item.ProductoCodigo IN (@6, @7)
              AND oiv.ClienteId = @2
              AND oiv.ClienteElementoDependienteId = @5
              AND (oiv.Anio < @3 OR (oiv.Anio = @3 AND oiv.Mes <= @4))
            ORDER BY oiv.Anio DESC, oiv.Mes DESC
          ) hs
          WHERE item.NroOrdenVenta = @0
          ORDER BY item.ItemOrdenVentaCodigo
        `, [ordenBase.NroOrdenVenta, esNueva ? 1 : 0, ordenBase.ClienteId, anio, mes,
            ordenBase.ClienteElementoDependienteId, PRODUCTO_HORAS_A, PRODUCTO_HORAS_B]);
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
          est.Descripcion AS EstadoOrdenVenta,
          com.ComprobanteNro AS NroFactura,
          ISNULL(com.Cantidad,0) AS CantidadComprobantes
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
        -- El número de factura vive en Comprobante. Una orden puede tener más de uno: se trae el
        -- último y cuántos hay, para que la pantalla sepa si el campo es editable.
        OUTER APPLY (
          SELECT
            (SELECT TOP 1 c.ComprobanteNro
             FROM Comprobante c
             WHERE c.NroOrdenVenta = ord.NroOrdenVenta AND c.ComprobanteTipoCodigo = @3
             ORDER BY c.AudFechaIng DESC) AS ComprobanteNro,
            (SELECT COUNT(*)
             FROM Comprobante c
             WHERE c.NroOrdenVenta = ord.NroOrdenVenta AND c.ComprobanteTipoCodigo = @3) AS Cantidad
        ) com
        LEFT JOIN EstadoOrdenVenta est ON est.EstadoOrdenVentaCod = ord.EstadoOrdenVentaCodigo
        WHERE obj.ObjetivoId = @0
      `, [ObjetivoId, anio, mes, TIPO_COMPROBANTE_ORDEN_VENTA]);

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
    // Número de comprobante. Sólo llega cuando la pantalla lo modificó: ausente no toca Comprobante.
    const NroFactura = req.body.NroFactura != null ? String(req.body.NroFactura).trim() : null;

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

      // Los productos de horas facturan con el importe del objetivo, que le gana a la lista de precios
      const importesObjetivo = await queryRunner.query(`
        SELECT TOP 1 oiv.ImporteHoraA, oiv.ImporteHoraB
        FROM ObjetivoImporteVenta oiv
        WHERE oiv.ClienteId = @0 AND oiv.ClienteElementoDependienteId = @1
          AND (oiv.Anio < @2 OR (oiv.Anio = @2 AND oiv.Mes <= @3))
        ORDER BY oiv.Anio DESC, oiv.Mes DESC
      `, [objetivo.ClienteId, objetivo.ClienteElementoDependienteId, anio, mes]);

      const importeHorasA = importesObjetivo[0]?.ImporteHoraA ?? null;
      const importeHorasB = importesObjetivo[0]?.ImporteHoraB ?? null;

      const importesHoras = new Map<string, number | null>([
        [PRODUCTO_HORAS_A, importeHorasA],
        [PRODUCTO_HORAS_B, importeHorasB]
      ]);

      for (const item of items) {
        const codigo = String(item.ProductoCodigo).trim().toUpperCase();
        const precio = importesHoras.has(codigo) ? importesHoras.get(codigo) : preciosLista.get(codigo);
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
          throw new ClientException('La orden ya tiene factura generada, no se puede modificar');
      }

      const importeTotal = items.reduce(
        (total, item) => total + (Number(item.Cantidad ?? 0) * Number(item.ImporteUnitario ?? 0)), 0);

      // Comprobantes que ya tiene la orden. Una orden nueva todavía no tiene ninguno.
      const comprobantes = orden
        ? await queryRunner.query(`
            SELECT ComprobanteNro FROM Comprobante
            WHERE NroOrdenVenta = @0 AND ComprobanteTipoCodigo = @1
          `, [orden.NroOrdenVenta, TIPO_COMPROBANTE_ORDEN_VENTA])
        : [];

      // Con más de un comprobante no se sabe cuál renumerar: eso se resuelve desde facturación
      if (NroFactura && comprobantes.length > 1)
        throw new ClientException(
          `La orden ${orden.NroOrdenVenta} tiene ${comprobantes.length} comprobantes, el número no se puede editar desde acá`);

      // Tanto en el alta como en la modificación, tener número de comprobante deja la orden facturada
      const numeroComprobante = NroFactura || String(comprobantes[0]?.ComprobanteNro ?? '').trim();
      const facturada = !!numeroComprobante;
      const estadoOrden = facturada ? ESTADO_ORDEN_VENTA_FACTURADA : ESTADO_ORDEN_VENTA_INICIAL;

      let NroOrdenVenta = orden?.NroOrdenVenta;

      // El estado se graba desde una constante, pero tiene que existir en la tabla de códigos
      if (facturada || !NroOrdenVenta) {
        const estados = await queryRunner.query(
          `SELECT EstadoOrdenVentaCod FROM EstadoOrdenVenta`);
        const codigos = estados.map((estado: any) => estado.EstadoOrdenVentaCod);
        if (!codigos.includes(estadoOrden))
          throw new ClientException(
            `El estado '${estadoOrden}' no existe en EstadoOrdenVenta. Estados válidos: ${codigos.join(', ')}`);
      }

      if (NroOrdenVenta) {
        // Sin comprobante el estado no se toca: la orden puede estar en cualquier punto del circuito
        await queryRunner.query(`
          UPDATE OrdenVenta
          SET ImporteTotalAFacturar = @1, Observaciones = @2, AudFechaMod = @3, AudUsuarioMod = @4, AudIpMod = @5
            ${facturada ? ', EstadoOrdenVentaCodigo = @6' : ''}
          WHERE NroOrdenVenta = @0
        `, facturada
          ? [NroOrdenVenta, importeTotal, Observaciones, ahora, usuario, ip, estadoOrden]
          : [NroOrdenVenta, importeTotal, Observaciones, ahora, usuario, ip]);

      } else {
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
          importeTotal, estadoOrden, Observaciones, ahora, usuario, ip
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

      // El número de factura vive en Comprobante, relacionado por NroOrdenVenta
      if (NroFactura) {
        if (comprobantes.length) {
          await queryRunner.query(`
            UPDATE Comprobante
            SET ComprobanteNro = @2, ImporteTotal = @3, AudFechaMod = @4, AudUsuarioMod = @5, AudIpMod = @6
            WHERE NroOrdenVenta = @0 AND ComprobanteNro = @1 AND ComprobanteTipoCodigo = @7
          `, [NroOrdenVenta, comprobantes[0].ComprobanteNro, NroFactura, importeTotal,
              ahora, usuario, ip, TIPO_COMPROBANTE_ORDEN_VENTA]);

        } else {
          await queryRunner.query(`
            INSERT INTO Comprobante (
              NroOrdenVenta, ComprobanteNro, ComprobanteTipoCodigo, ImporteTotal,
              AudFechaIng, AudFechaMod, AudUsuarioIng, AudUsuarioMod, AudIpIng, AudIpMod
            ) VALUES (@0, @1, @2, @3, @4, @4, @5, @5, @6, @6)
          `, [NroOrdenVenta, NroFactura, TIPO_COMPROBANTE_ORDEN_VENTA, importeTotal, ahora, usuario, ip]);
        }
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

  // Precio del producto para el cliente del objetivo: el último vigente al cierre del período.
  // Los productos de horas 'A' y 'B' se resuelven aparte, contra ObjetivoImporteVenta.
  async getPrecioProducto(req: Request, res: Response, next: NextFunction) {
    const ObjetivoId = Number(req.params.ObjetivoId);
    const anio = Number(req.params.anio);
    const mes = Number(req.params.mes);
    const ProductoCodigo = String(req.params.ProductoCodigo ?? '');
    const queryRunner = await getConnection(res.locals.userName);

    try {
      const codigoHoras = ProductoCodigo.trim().toUpperCase();

      if (codigoHoras === PRODUCTO_HORAS_A || codigoHoras === PRODUCTO_HORAS_B) {
        // La columna sale de una constante, no de la request
        const columnaImporte = codigoHoras === PRODUCTO_HORAS_A ? 'ImporteHoraA' : 'ImporteHoraB';

        const horas = await queryRunner.query(`
          SELECT TOP 1
            oiv.${columnaImporte} AS ImporteUnitario,
            oiv.Observaciones AS TextoFactura
          FROM Objetivo obj
          JOIN ObjetivoImporteVenta oiv ON oiv.ClienteId = obj.ClienteId
            AND oiv.ClienteElementoDependienteId = ISNULL(obj.ClienteElementoDependienteId,0)
          WHERE obj.ObjetivoId = @0
            AND (oiv.Anio < @1 OR (oiv.Anio = @1 AND oiv.Mes <= @2))
          ORDER BY oiv.Anio DESC, oiv.Mes DESC
        `, [ObjetivoId, anio, mes]);

        return this.jsonRes({
          ProductoCodigo,
          ImporteUnitario: horas[0]?.ImporteUnitario ?? null,
          TextoFactura: horas[0]?.TextoFactura ?? null,
          PrecioDeLista: horas[0]?.ImporteUnitario == null ? 0 : 1
        }, res);
      }

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
