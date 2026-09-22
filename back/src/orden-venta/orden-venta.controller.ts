import { BaseController, ClientException } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import { AsistenciaController } from "../controller/asistencia.controller.ts";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros.ts";
import type { Options } from "../schemas/filtro.ts";
import type { NextFunction, Request, Response } from "express";
import type { QueryRunner } from "typeorm";
import { ParametrosVentaController } from "../parametro-venta/parametro-venta.controller.ts";


const ESTADO_ORDEN_VENTA_INICIAL = 'PEN';

// Estado de la orden con comprobante emitido
const ESTADO_ORDEN_VENTA_FACTURADA = 'FAC';

// Estado con el que quedan las órdenes anuladas desde la grilla
const ESTADO_ORDEN_VENTA_CANCELADA = 'CAN';

const TIPO_IMPORTE_LISTA_PRECIO = 'LP';

// Comprobante se relaciona con la orden por NroOrdenVenta, y una orden puede tener más de uno.
// El tipo lo elige la pantalla contra ComprobanteTipo.
// Tipo 'Factura' de ComprobanteTipo: tenerlo cargado es lo que deja facturada a la orden
const TIPO_COMPROBANTE_FACTURA = 'FAC';

// El estado de la grilla es el que la orden tiene guardado en EstadoOrdenVentaCodigo, que es lo
// que graban tanto el detalle como la edición masiva. Deducirlo de los comprobantes dejaba la
// columna pegada en 'Facturado' aunque se lo cambiara a mano.
const sqlEstadoOrden = `TRIM(ISNULL(est.Descripcion,''))`;

const cargado = (valor: any) => valor != null && String(valor).trim() !== '';

// Estados (por descripción de EstadoOrdenVenta) en los que la orden ya no se puede modificar
const ESTADOS_ORDEN_VENTA_NO_MODIFICABLES = ['A FACTURAR', 'FACTURADO'];


// Productos que facturan las horas 'A' y 'B'. Su importe no sale de la lista de precios sino de
// ObjetivoImporteVenta.ImporteHoraA / ImporteHoraB, del último Anio/Mes <= al período del
// cliente/elemento.
const PRODUCTO_HORAS_A = 'SSF';
const PRODUCTO_HORAS_B = 'SSFB';

// Hasta cuántos períodos hacia atrás se busca la orden con la que se inicializa una nueva. Se
// toma la más reciente de la ventana: un objetivo puede no tener orden todos los meses.
const MESES_ORDEN_BASE = 6;

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
    fieldName: "CONCAT(ord.ClienteId,'/',ord.ClienteElementoDependienteId,' ',TRIM(eledep.ClienteElementoDependienteDescripcion))",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: "Estado",
    name: "Estado",
    field: "Estado",
    fieldName: sqlEstadoOrden,
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
  },
  {
    name: "Asistencia",
    type: "string",
    id: "EstadoAsistencia",
    field: "EstadoAsistencia",
    fieldName: "EstadoAsistencia",
    searchType: "string",
    sortable: true,
    hidden: false,
    editable: false,
    maxWidth: 140

  },
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
          CONCAT(ord.ClienteId,'/',ord.ClienteElementoDependienteId,' ',TRIM(eledep.ClienteElementoDependienteDescripcion)) AS Objetivo,
          ord.EstadoOrdenVentaCodigo,
          ${sqlEstadoOrden} AS Estado,
          ISNULL(ord.ImporteTotalAFacturar,0) AS ImporteTotalAFacturar,
          IIF((objm.ObjetivoAsistenciaAnoMesHasta IS NULL),'Pendiente','Cerrado') AS EstadoAsistencia
        FROM OrdenVenta ord
        LEFT JOIN Cliente cli ON cli.ClienteId = ord.ClienteId
        LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteId = ord.ClienteId AND isnull(eledep.ClienteElementoDependienteId,0) = isnull(ord.ClienteElementoDependienteId,0)
        LEFT JOIN EstadoOrdenVenta est ON est.EstadoOrdenVentaCod = ord.EstadoOrdenVentaCodigo
        LEFT JOIN Objetivo obj ON obj.ClienteId = eledep.ClienteId and obj.ClienteElementoDependienteId = isnull(eledep.ClienteElementoDependienteId,0)
        LEFT JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoId = obj.ObjetivoId AND obja.ObjetivoAsistenciaAnoAno = ord.PeriodoAnio
        LEFT JOIN ObjetivoAsistenciaAnoMes objm ON objm.ObjetivoAsistenciaAnoId  = obja.ObjetivoAsistenciaAnoId AND  objm.ObjetivoId = obja.ObjetivoId AND objm.ObjetivoAsistenciaAnoMesMes = ord.PeriodoMes
      
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

  // Última orden de venta del objetivo dentro de los MESES_ORDEN_BASE períodos anteriores al
  // recibido, o undefined si en toda la ventana no hay ninguna. Es el modelo con el que se
  // inicializa una orden que todavía no existe.
  static async getOrdenVentaBase(queryRunner: any, ClienteId: number, ClienteElementoDependienteId: number, anio: number, mes: number) {
    // Extremos de la ventana: desde MESES_ORDEN_BASE períodos atrás hasta el anterior al pedido
    const hasta = OrdenVentaController.sumarMeses(anio, mes, -1);
    const desde = OrdenVentaController.sumarMeses(anio, mes, -MESES_ORDEN_BASE);

    const ordenventabase = await queryRunner.query(`
      SELECT TOP 1
        ord.NroOrdenVenta, ord.ClienteId, ord.ClienteElementoDependienteId,
        ord.PeriodoAnio, ord.PeriodoMes, ord.EstadoOrdenVentaCodigo, ord.ImporteTotalAFacturar
      FROM OrdenVenta ord 
      WHERE ord.ClienteId = @5 AND ord.ClienteElementoDependienteId=@6 
        AND (ord.PeriodoAnio > @1 OR (ord.PeriodoAnio = @1 AND ord.PeriodoMes >= @2))
        AND (ord.PeriodoAnio < @3 OR (ord.PeriodoAnio = @3 AND ord.PeriodoMes <= @4))
      ORDER BY ord.PeriodoAnio DESC, ord.PeriodoMes DESC, ord.NroOrdenVenta ASC
    `, [null, desde.anio, desde.mes, hasta.anio, hasta.mes, ClienteId, ClienteElementoDependienteId]);


    return ordenventabase[0]?.NroOrdenVenta;
  }

  // Período desplazado en meses, con el año corregido cuando la cuenta lo cruza
  private static sumarMeses(anio: number, mes: number, meses: number) {
    const corrido = anio * 12 + (mes - 1) + meses;
    return { anio: Math.floor(corrido / 12), mes: (corrido % 12) + 1 };
  }

  // Órdenes de venta del objetivo en el período, de la más nueva a la más vieja. Un período puede
  // tener más de una: desde la carga de asistencia se da de alta otra sin pisar la que ya está.
  private static async getOrdenesVentaPeriodo(queryRunner: any, ClienteId: number, ClienteElementoDependienteId: number, anio: number, mes: number) {
    return await queryRunner.query(`
      SELECT
        ord.NroOrdenVenta, ord.ClienteId, ord.ClienteElementoDependienteId,
        ord.PeriodoAnio, ord.PeriodoMes, ord.EstadoOrdenVentaCodigo, ord.ImporteTotalAFacturar,
        est.Descripcion AS EstadoOrdenVenta
      FROM OrdenVenta ord
      LEFT JOIN EstadoOrdenVenta est ON est.EstadoOrdenVentaCod = ord.EstadoOrdenVentaCodigo
      WHERE  ord.PeriodoAnio = @1 AND ord.PeriodoMes = @2 AND ord.ClienteId = @3 AND ord.ClienteElementoDependienteId=@4
      ORDER BY ord.NroOrdenVenta DESC
    `, [null, anio, mes, ClienteId, ClienteElementoDependienteId]);
  }

  // Una orden del período: la pedida por número, o la última si no se pide ninguna. Undefined si
  // el período no tiene órdenes, o si la pedida no es de este objetivo y período.
  private static async getOrdenVentaPeriodo(queryRunner: any, ClienteId: number, ClienteElementoDependienteId: number, anio: number, mes: number, NroOrdenVenta = 0) {
    const ordenes = await OrdenVentaController.getOrdenesVentaPeriodo(queryRunner, ClienteId, ClienteElementoDependienteId, anio, mes);

    return NroOrdenVenta
      ? ordenes.find((orden: any) => Number(orden.NroOrdenVenta) === Number(NroOrdenVenta))
      : ordenes[0];
  }


  async getOrdenVentaQuery(queryRunner: QueryRunner, NroOrdenVenta: number) {
    const ordenDs = await queryRunner.query(`SELECT ord.NroOrdenVenta, ord.ClienteId, ord.ClienteElementoDependienteId,
        ord.PeriodoAnio,ord.PeriodoMes, ord.EstadoOrdenVentaCodigo, ord.Observaciones, est.Descripcion
        FROM OrdenVenta ord 
        JOIN EstadoOrdenVenta est ON est.EstadoOrdenVentaCod = ord.EstadoOrdenVentaCodigo
        WHERE ord.NroOrdenVenta =@0
        `, [NroOrdenVenta])
    if (ordenDs.length == 0)
      throw new ClientException(`Orden de Venta ${NroOrdenVenta} no encontrada`)



    const itemsTmp = await queryRunner.query(`SELECT item.NroOrdenVenta, item.ItemOrdenVentaCodigo, item.ProductoCodigo, item.TextoFactura, item.TipoCantidad, item.Cantidad, item.TipoImporte, item.ImporteUnitario, item.CantidadEnFactura
          FROM ItemOrdenVenta item
          WHERE item.NroOrdenVenta =@0
        `, [NroOrdenVenta])

    const items = itemsTmp.map(item => ({
      ...item,
      Cantidad: item.Cantidad?.toString() ?? '',
      ImporteUnitario: item.ImporteUnitario?.toString() ?? '',
      CantidadEnFactura: item.CantidadEnFactura?.toString() ?? '',
    }));

    const comprobantes = await queryRunner.query(`SELECT com.NroOrdenVenta, com.ComprobanteNro, com.ComprobanteTipoCodigo, com.ImporteTotal
          FROM Comprobante com
          WHERE com.NroOrdenVenta =@0
        `, [NroOrdenVenta])

    ordenDs[0].items = items
    ordenDs[0].comprobantes = comprobantes
    ordenDs[0].Periodo = new Date(ordenDs[0].PeriodoAnio, ordenDs[0].PeriodoMes-1, 1)
    return ordenDs[0]
  }

  async getOrdenVenta(req: Request, res: Response, next: NextFunction) {
    const NroOrdenVenta = Number(req.params.NroOrdenVenta) || 0;
    const queryRunner = await getConnection(res.locals.userName);

    try {
      const ordenDs = await this.getOrdenVentaQuery(queryRunner, NroOrdenVenta)
      this.jsonRes(ordenDs, res);

    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }
  async getPlantillaOrdenVenta(req: Request, res: Response, next: NextFunction) {
    const ClienteId = Number(req.params.ClienteId) || 0;
    const ClienteElementoDependienteId = Number(req.params.ClienteElementoDependienteId) || 0;
    const anio = Number(req.params.anio) || 0;
    const mes = Number(req.params.mes) || 0;

    const queryRunner = await getConnection(res.locals.userName);

    try {
      const NroOrdenVentaBase = await OrdenVentaController.getOrdenVentaBase(queryRunner, ClienteId, ClienteElementoDependienteId, anio, mes);
      if (!NroOrdenVentaBase)
        throw new ClientException('No existe plantilla')
      const ordenDs = await this.getOrdenVentaQuery(queryRunner, NroOrdenVentaBase)
      ordenDs.NroOrdenVenta = 0
      ordenDs.PeriodoAnio = anio
      ordenDs.PeriodoMes = mes
      ordenDs.Periodo= new Date(anio,mes-1,1)

      const { ImporteUnitarioA, ImporteUnitarioB, TotalHoraA, TotalHoraB } = await this.getImporteHorasAB(ClienteElementoDependienteId, ClienteId, anio, mes, queryRunner)


      for (const item of ordenDs.items) {
        const ProductoCodigo = String(item.ProductoCodigo ?? '').trim()
        if (!ProductoCodigo)
          continue

        switch (ProductoCodigo) {
          case 'SSF':
            item.Cantidad = TotalHoraA
            item.ImporteUnitario = ImporteUnitarioA
            break;
          case 'SSFB':
            item.Cantidad = TotalHoraB
            item.ImporteUnitario = ImporteUnitarioB
            break;
          default:
            const precio = await ParametrosVentaController.getPrecioListaPreciosQuery(ClienteId, anio, mes, ProductoCodigo, queryRunner);
            if (precio.Importe)
              item.ImporteUnitario = precio.Importe
            break;
        }
      }

      this.jsonRes(ordenDs, res);

    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }


  // El detalle sale de ItemOrdenVenta. Si la orden del período todavía no existe, se inicializa
  // con los ítems de la última orden de los MESES_ORDEN_BASE meses anteriores, revaluados con el
  // precio vigente del período pedido.
  async getListOrdenVenta(req: Request, res: Response, next: NextFunction) {
    const ClienteId = Number(req.body.ClienteId);
    const ClienteElementoDependienteId = Number(req.body.ClienteElementoDependienteId);
    const anio = Number(req.body.anio);
    const mes = Number(req.body.mes);
    // Con más de una orden en el período la pantalla elige cuál ver. Sin número se trae la última.
    const NroOrdenVenta = Number(req.body.NroOrdenVenta) || 0;
    // Con plantilla se ignoran las órdenes del período: el detalle sale de la última orden de
    // los meses anteriores, que es el modelo de una orden nueva
    const plantilla = req.body.Plantilla === true;
    const queryRunner = await getConnection(res.locals.userName);

    try {
      const orden = plantilla
        ? undefined
        : await OrdenVentaController.getOrdenVentaPeriodo(queryRunner, ClienteId, ClienteElementoDependienteId, anio, mes, NroOrdenVenta);

      if (NroOrdenVenta && !orden)
        throw new ClientException(`La orden de venta ${NroOrdenVenta} no es del objetivo ${ClienteId}/${ClienteElementoDependienteId} en el período ${mes}/${anio}`);

      // Sin orden propia se copia la última de los meses anteriores: los ítems son nuevos (id 0),
      // pero el detalle se arrastra completo, salvo la cantidad de los productos de horas.
      const ordenBase = orden ?? await OrdenVentaController.getOrdenVentaBase(queryRunner, ClienteId, ClienteElementoDependienteId, anio, mes);


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
            IIF(@1 = 1 AND item.ProductoCodigo IN (@6, @7), NULL, item.Cantidad) AS Cantidad,
            item.CantidadEstandar,
            item.Bonificacion,
            COALESCE(hs.ImporteHora, pre.Importe, item.ImporteUnitario) AS ImporteUnitario,
            item.TextoFactura,
            item.CantidadEnFactura,
            ISNULL(IIF(@1 = 1 AND item.ProductoCodigo IN (@6, @7), NULL, item.Cantidad),0)
              * ISNULL(COALESCE(hs.ImporteHora, pre.Importe, item.ImporteUnitario),0) AS ImporteTotal
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
        `, [ordenBase.NroOrdenVenta, 0, ordenBase.ClienteId, anio, mes,
        ordenBase.ClienteElementoDependienteId, PRODUCTO_HORAS_A, PRODUCTO_HORAS_B]);
      }

      this.jsonRes(
        {
          total: items.length,
          list: items,
          //esNueva,
          NroOrdenVenta: orden?.NroOrdenVenta ?? null,
          // De dónde salió el detalle, para avisar en pantalla que es una orden inicializada
          //origenAnio: esNueva && ordenBase ? Number(ordenBase.PeriodoAnio) : anio,
          //origenMes: esNueva && ordenBase ? Number(ordenBase.PeriodoMes) : mes,
        },
        res
      );

    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async getImporteHorasAB(ClienteElementoDependienteId: number, ClienteId: number, anio: number, mes: number, queryRunner: QueryRunner) {
    const ds = await queryRunner.query(
      `SELECT ImporteHoraA, ImporteHoraB, TotalHoraA, TotalHoraB
     FROM ObjetivoImporteVenta
     WHERE ClienteElementoDependienteId = @0
       AND ClienteId = @1
       AND Anio = @2
       AND Mes = @3`,
      [ClienteElementoDependienteId, ClienteId, anio, mes]
    );

    return ds[0]
      ? {
        ImporteUnitarioA: ds[0].ImporteHoraA,
        ImporteUnitarioB: ds[0].ImporteHoraB,
        TotalHoraA: ds[0].TotalHoraA,
        TotalHoraB: ds[0].TotalHoraB,
      }
      : {
        ImporteUnitarioA: 0,
        ImporteUnitarioB: 0,
        TotalHoraA: 0,
        TotalHoraB: 0
      };
  }


  async getCabecera(req: Request, res: Response, next: NextFunction) {
    const ClienteElementoDependienteId = Number(req.params.ClienteElementoDependienteId);
    const ClienteId = Number(req.params.ClienteId);
    const anio = Number(req.params.anio);
    const mes = Number(req.params.mes);
    const queryRunner = await getConnection(res.locals.userName);

    try {
      const ordenes = await OrdenVentaController.getOrdenesVentaPeriodo(queryRunner, ClienteId, ClienteElementoDependienteId, anio, mes);
      const NroOrdenVentaBase = await OrdenVentaController.getOrdenVentaBase(queryRunner, ClienteId, ClienteElementoDependienteId, anio, mes);

      this.jsonRes(
        {
          Ordenes: ordenes,
          NroOrdenVentaBase: NroOrdenVentaBase
        },
        res
      );

    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async setOrdenVentaQuery(PeriodoAnio: number, PeriodoMes: number, ClienteId: number, ClienteElementoDependienteId: number, NroOrdenVenta: number, items: any[], comprobantes: any[], Observaciones: string, EstadoOrdenVentaCodigo: string, queryRunner: QueryRunner, usuario: string, ip: string, ahora: Date) {
    if (!EstadoOrdenVentaCodigo)
      EstadoOrdenVentaCodigo = 'PEN'

    if (comprobantes.some((c: any) => String(c.ComprobanteTipoCodigo ?? '').trim().toUpperCase() === 'FAC'))
      EstadoOrdenVentaCodigo = 'FAC'

    if (comprobantes.length == 0 && EstadoOrdenVentaCodigo == 'FAC')
      throw new ClientException(`No se puede tener Estado Facturado sin ningún comprobante cargado`)

    const ImporteTotalAFacturar = items.reduce(
      (total, item) => total + (Number(item.Cantidad ?? 0) * Number(item.ImporteUnitario ?? 0)), 0);


    if (NroOrdenVenta) {
      const ov = await this.getOrdenVentaQuery(queryRunner, NroOrdenVenta)
      if (ov.EstadoOrdenVentaCodigo == 'FAC')
        throw new ClientException(`No se puede modificar orden de venta en estado ${ov.Descripcion}`)

      await queryRunner.query(`
          UPDATE OrdenVenta SET ImporteTotalAFacturar=@1, EstadoOrdenVentaCodigo=@2, Observaciones=@3,
          AudFechaMod = @4, AudUsuarioMod = @5, AudIpMod = @6 
          WHERE NroOrdenVenta = @0
        `, [NroOrdenVenta, ImporteTotalAFacturar, EstadoOrdenVentaCodigo, Observaciones, ahora, usuario, ip]);

    } else {
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
        NroOrdenVenta, ClienteId, ClienteElementoDependienteId, PeriodoMes, PeriodoAnio,
        ImporteTotalAFacturar, EstadoOrdenVentaCodigo, Observaciones, ahora, usuario, ip
      ]);
    }

    await queryRunner.query(`DELETE FROM ItemOrdenVenta WHERE NroOrdenVenta = @0`, [NroOrdenVenta]);
    const { ImporteUnitarioA, ImporteUnitarioB } = await this.getImporteHorasAB(ClienteElementoDependienteId, ClienteId, PeriodoAnio, PeriodoMes, queryRunner)

    for (const [indice, item] of items.entries()) {
      let ImporteUnitario = Number(item.ImporteUnitario)
      if (item.ProductoCodigo == 'SSF') ImporteUnitario = ImporteUnitarioA
      if (item.ProductoCodigo == 'SSFB') ImporteUnitario = ImporteUnitarioB

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
        ImporteUnitario,
        item.CantidadEstandar != null ? Number(item.CantidadEstandar) : null,
        item.Bonificacion != null ? Number(item.Bonificacion) : null,
        item.CantidadEnFactura != null ? Number(item.CantidadEnFactura) : null,
        ahora, usuario, ip
      ]);
    }

    await queryRunner.query(`DELETE FROM Comprobante WHERE NroOrdenVenta = @0`, [NroOrdenVenta]);

    for (const comprobante of comprobantes) {
      await queryRunner.query(`
            INSERT INTO Comprobante (
              NroOrdenVenta, ComprobanteNro, ComprobanteTipoCodigo, ImporteTotal,
              AudFechaIng, AudFechaMod, AudUsuarioIng, AudUsuarioMod, AudIpIng, AudIpMod
            ) VALUES (@0, @1, @2, @3, @4, @4, @5, @5, @6, @6)
          `, [
        NroOrdenVenta,
        String(comprobante.ComprobanteNro).trim(),
        String(comprobante.ComprobanteTipoCodigo).trim(),
        Number(comprobante.ImporteTotal),
        ahora, usuario, ip
      ]);
    }
    return { NroOrdenVenta, EstadoOrdenVentaCodigo }
  }


  // Alta o modificación de la orden del período, con su detalle completo.
  async setOrdenVenta(req: Request, res: Response, next: NextFunction) {
    const ClienteId = Number(req.body.ClienteId);
    const ClienteElementoDependienteId = Number(req.body.ClienteElementoDependienteId);
    const itemsTmp: any[] = Array.isArray(req.body.items) ? req.body.items : [];
    const Observaciones = req.body.Observaciones ?? null;
    let EstadoOrdenVentaCodigo = String(req.body.EstadoOrdenVentaCodigo ?? '').trim();
    const comprobantesTmp = Array.isArray(req.body.comprobantes) ? req.body.comprobantes : [];
    let NroOrdenVenta = req.body.NroOrdenVenta ?? null;
    const queryRunner = await getConnection(res.locals.userName);
    const PeriodoMes = new Date(req.body.Periodo).getFullYear();
    const PeriodoAnio = new Date(req.body.Periodo).getMonth()+1;

    try {
      const usuario = res.locals.userName;
      const ip = this.getRemoteAddress(req);
      const ahora = new Date();

      const fieldErrors: any[] = [];
      if (!PeriodoAnio)
        fieldErrors.push({ fieldTree: ``, kind: 'server', message: 'El año es obligatorio' })

      if (!PeriodoMes)
        fieldErrors.push({ fieldTree: ``, kind: 'server', message: 'El mes es obligatorio' })

      if (!ClienteId || !ClienteElementoDependienteId)
        fieldErrors.push({ fieldTree: ``, kind: 'server', message: 'El cliente es obligatorio' })

      const items = itemsTmp.filter(item => String(item?.ProductoCodigo ?? '').trim());
      const comprobantes = comprobantesTmp.filter(com => String(com.ComprobanteNro ?? '').trim());
      if (!items.length)
        fieldErrors.push({ fieldTree: ``, kind: 'server', message: 'La orden de venta debe tener al menos un producto' })

      if (fieldErrors.length > 0)
        throw new ClientException(`Debe completar los campos requeridos.`, { fieldErrors })

      await queryRunner.startTransaction();



      const ov = await this.setOrdenVentaQuery(PeriodoAnio, PeriodoMes, ClienteId, ClienteElementoDependienteId, NroOrdenVenta, items, comprobantes, Observaciones, EstadoOrdenVentaCodigo, queryRunner, usuario, ip, ahora)
      NroOrdenVenta = ov.NroOrdenVenta
      EstadoOrdenVentaCodigo = ov.EstadoOrdenVentaCodigo


      const primerOrdenVenta = await queryRunner.query(`
        SELECT TOP 1 ord.NroOrdenVenta FROM OrdenVenta ord WHERE ord.ClienteId = @3 AND ord.ClienteElementoDependienteId = @4 AND ord.PeriodoAnio=@1 AND ord.PeriodoMes=@2
        ORDER BY ord.NroOrdenVenta
        `, [null, PeriodoAnio, PeriodoMes, ClienteId, ClienteElementoDependienteId])


      if (primerOrdenVenta[0] && primerOrdenVenta[0].NroOrdenVenta == NroOrdenVenta) {
        const HorasFacturar = items.reduce(
          (acc, item) => {
            const codigo = String(item.ProductoCodigo ?? '').trim().toUpperCase();
            const cantidad = Number(item.Cantidad ?? 0);

            if (codigo === 'SSF')
              acc.HorasFacturarA += cantidad;

            if (codigo === 'SSFB')
              acc.HorasFacturarB += cantidad;

            return acc;
          },
          {
            HorasFacturarA: 0,
            HorasFacturarB: 0
          }
        );

        const asistenciaController = new AsistenciaController()
        await asistenciaController.setHorasFacturacionQuery(PeriodoAnio, PeriodoMes, ClienteId, ClienteElementoDependienteId, HorasFacturar.HorasFacturarA, HorasFacturar.HorasFacturarB, Observaciones, queryRunner, usuario, ip);
      }
      await queryRunner.commitTransaction();

      return this.jsonRes({ NroOrdenVenta, EstadoOrdenVentaCodigo }, res,
        `Orden de venta ${NroOrdenVenta} generada/actualizada`);

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

  async setOrdenVentaMasiva(req: Request, res: Response, next: NextFunction) {
    const todosLosGrupos: any[] = Array.isArray(req.body?.clientes) ? req.body.clientes : [];

    const comprobantesEditados: any[] = Array.isArray(req.body?.comprobantes)
      ? req.body.comprobantes : [];

    const queryRunner = await getConnection(res.locals.userName);

    try {
      const usuario = res.locals.userName;
      const ip = this.getRemoteAddress(req);
      const ahora = new Date();

      if (!todosLosGrupos.length)
        throw new ClientException('No hay órdenes de venta seleccionadas');

      // Un cliente sin estado ni comprobante cargado no tiene nada para aplicar: se ignora, así
      // se puede guardar una edición de comprobantes sin tocar el resto de los clientes
      const grupos = todosLosGrupos.filter(grupo =>
        cargado(grupo?.EstadoOrdenVentaCodigo) ||
        cargado(grupo?.ComprobanteTipoCodigo) ||
        cargado(grupo?.ComprobanteNro) ||
        cargado(grupo?.ImporteTotal));

      if (!grupos.length && !comprobantesEditados.length)
        throw new ClientException('No hay nada para aplicar, cargue el comprobante o el estado');

      const errores: string[] = [];

      // Cada grupo tiene que traer sus órdenes, y el comprobante va completo o vacío
      for (const grupo of grupos) {
        const donde = `Cliente ${grupo?.ClienteId}`;
        const ordenes: number[] = Array.isArray(grupo?.NroOrdenVentas)
          ? grupo.NroOrdenVentas.map(Number).filter(Number.isFinite) : [];

        if (!ordenes.length)
          errores.push(`${donde}: no tiene órdenes seleccionadas`);

        const tipo = String(grupo?.ComprobanteTipoCodigo ?? '').trim();
        const numero = String(grupo?.ComprobanteNro ?? '').trim();
        const conComprobante = !!tipo || !!numero || cargado(grupo?.ImporteTotal);

        if (conComprobante) {
          if (!tipo) errores.push(`${donde}: el tipo de comprobante es obligatorio`);
          if (!numero) errores.push(`${donde}: el número de comprobante es obligatorio`);

          if (!cargado(grupo?.ImporteTotal))
            errores.push(`${donde}: el importe total es obligatorio`);
          else if (!Number.isFinite(Number(grupo.ImporteTotal)))
            errores.push(`${donde}: el importe total '${grupo.ImporteTotal}' no es un número válido`);
        }

        // Pasar a "Facturado" obliga a cargar el comprobante, con todos sus datos
        if (String(grupo?.EstadoOrdenVentaCodigo ?? '').trim() === ESTADO_ORDEN_VENTA_FACTURADA && !conComprobante)
          errores.push(`${donde}: para pasar a Facturado debe cargar el comprobante (tipo, número e importe total)`);
      }

      // Los tres campos del comprobante editado son NOT NULL: van completos o no se manda
      for (const [indice, comprobante] of comprobantesEditados.entries()) {
        const tipoOriginal = String(comprobante?.ComprobanteTipoCodigoOriginal ?? '').trim();
        const numeroOriginal = String(comprobante?.ComprobanteNroOriginal ?? '').trim();
        const donde = `Comprobante ${tipoOriginal || '?'} ${numeroOriginal || indice + 1}`;

        if (!tipoOriginal || !numeroOriginal) {
          errores.push(`${donde}: no se puede identificar el comprobante a editar`);
          continue;
        }

        if (!String(comprobante?.ComprobanteTipoCodigo ?? '').trim())
          errores.push(`${donde}: el tipo de comprobante es obligatorio`);

        if (!String(comprobante?.ComprobanteNro ?? '').trim())
          errores.push(`${donde}: el número de comprobante es obligatorio`);

        if (!cargado(comprobante?.ImporteTotal))
          errores.push(`${donde}: el importe total es obligatorio`);
        else if (!Number.isFinite(Number(comprobante.ImporteTotal)))
          errores.push(`${donde}: el importe total '${comprobante.ImporteTotal}' no es un número válido`);
      }

      if (errores.length)
        throw new ClientException(errores);

      // Los tipos de comprobante y los estados elegidos tienen que existir
      const tipos = [...new Set([
        ...grupos.map(grupo => String(grupo?.ComprobanteTipoCodigo ?? '').trim()),
        ...comprobantesEditados.map(comprobante => String(comprobante?.ComprobanteTipoCodigo ?? '').trim())
      ].filter(Boolean))];

      if (tipos.length) {
        const tiposValidos = await queryRunner.query(
          `SELECT ComprobanteTipoCodigo FROM ComprobanteTipo WHERE ComprobanteTipoCodigo IN (${tipos.map((_, indice) => `@${indice}`).join(',')})`,
          tipos);

        const existentes = new Set(tiposValidos.map(
          (tipo: any) => String(tipo.ComprobanteTipoCodigo).trim().toUpperCase()));
        const inexistentes = tipos.filter(tipo => !existentes.has(tipo.toUpperCase()));

        if (inexistentes.length)
          throw new ClientException(inexistentes.map(tipo => `El tipo de comprobante ${tipo} no existe`));
      }

      const estadosElegidos = [...new Set(grupos
        .map(grupo => String(grupo?.EstadoOrdenVentaCodigo ?? '').trim()).filter(Boolean))];

      const estados = await queryRunner.query(`SELECT EstadoOrdenVentaCod FROM EstadoOrdenVenta`);
      const codigosEstado = estados.map((estado: any) => String(estado.EstadoOrdenVentaCod).trim());

      const estadosInexistentes = estadosElegidos.filter(estado => !codigosEstado.includes(estado));
      if (estadosInexistentes.length)
        throw new ClientException(
          estadosInexistentes.map(estado => `El estado '${estado}' no existe en EstadoOrdenVenta`));

      await queryRunner.startTransaction();

      let actualizadas = 0;

      for (const grupo of grupos) {
        const ClienteId = Number(grupo.ClienteId);
        const ordenes: number[] = grupo.NroOrdenVentas.map(Number).filter(Number.isFinite);
        const tipo = String(grupo?.ComprobanteTipoCodigo ?? '').trim();
        const numero = String(grupo?.ComprobanteNro ?? '').trim();
        const conComprobante = !!tipo && !!numero;
        const estadoElegido = String(grupo?.EstadoOrdenVentaCodigo ?? '').trim();

        for (const NroOrdenVenta of ordenes) {
          const cabecera = await queryRunner.query(`
            SELECT ClienteId, FechaGeneracionFactura FROM OrdenVenta WHERE NroOrdenVenta = @0
          `, [NroOrdenVenta]);

          if (!cabecera[0])
            throw new ClientException(`No se encontró la orden de venta ${NroOrdenVenta}`);

          // La selección viene de la grilla, pero el cliente se revalida contra la orden
          if (Number(cabecera[0].ClienteId) !== ClienteId)
            throw new ClientException(
              `La orden ${NroOrdenVenta} no pertenece al cliente ${ClienteId}`);

          if (cabecera[0].FechaGeneracionFactura)
            throw new ClientException(
              `La orden ${NroOrdenVenta} ya tiene factura generada, no se puede modificar`);

          // Los comprobantes de la orden: el nuevo se suma a los que ya tenga
          const comprobantesActuales = await queryRunner.query(`
            SELECT ComprobanteNro, ComprobanteTipoCodigo FROM Comprobante WHERE NroOrdenVenta = @0
          `, [NroOrdenVenta]);

          if (conComprobante) {
            const repetido = comprobantesActuales.some((comprobante: any) =>
              String(comprobante.ComprobanteTipoCodigo ?? '').trim().toUpperCase() === tipo.toUpperCase() &&
              String(comprobante.ComprobanteNro ?? '').trim().toUpperCase() === numero.toUpperCase());

            if (repetido)
              throw new ClientException(
                `La orden ${NroOrdenVenta} ya tiene el comprobante ${tipo} ${numero}`);

            await queryRunner.query(`
              INSERT INTO Comprobante (
                NroOrdenVenta, ComprobanteNro, ComprobanteTipoCodigo, ImporteTotal,
                AudFechaIng, AudFechaMod, AudUsuarioIng, AudUsuarioMod, AudIpIng, AudIpMod
              ) VALUES (@0, @1, @2, @3, @4, @4, @5, @5, @6, @6)
            `, [NroOrdenVenta, numero, tipo, Number(grupo.ImporteTotal), ahora, usuario, ip]);

            comprobantesActuales.push({ ComprobanteNro: numero, ComprobanteTipoCodigo: tipo });
          }

          // Sin estado elegido vale la misma regla que el detalle: con factura queda facturada
          const facturada = comprobantesActuales.some((comprobante: any) =>
            String(comprobante.ComprobanteTipoCodigo ?? '').trim().toUpperCase() === TIPO_COMPROBANTE_FACTURA);

          const estadoOrden = estadoElegido
            || (facturada ? ESTADO_ORDEN_VENTA_FACTURADA : ESTADO_ORDEN_VENTA_INICIAL);

          // Una orden que pasa a facturada no puede tener ítems sin cantidad o sin importe unitario
          if (estadoOrden === ESTADO_ORDEN_VENTA_FACTURADA) {
            const [detalle] = await queryRunner.query(`
              SELECT COUNT(*) AS Incompletos FROM ItemOrdenVenta
              WHERE NroOrdenVenta = @0 AND (Cantidad IS NULL OR ImporteUnitario IS NULL)
            `, [NroOrdenVenta]);

            if (detalle.Incompletos)
              throw new ClientException(`No se puede facturar la orden ${NroOrdenVenta}: hay ítems sin cantidad o sin importe unitario`);
          }

          await queryRunner.query(`
            UPDATE OrdenVenta
            SET EstadoOrdenVentaCodigo = @1, AudFechaMod = @2, AudUsuarioMod = @3, AudIpMod = @4
            WHERE NroOrdenVenta = @0
          `, [NroOrdenVenta, estadoOrden, ahora, usuario, ip]);

          actualizadas++;
        }
      }

      // Comprobantes editados: se actualizan todas las filas con el tipo y número originales,
      // que son las de las órdenes seleccionadas
      let comprobantes = 0;

      for (const comprobante of comprobantesEditados) {
        const tipoOriginal = String(comprobante.ComprobanteTipoCodigoOriginal).trim();
        const numeroOriginal = String(comprobante.ComprobanteNroOriginal).trim();
        const tipo = String(comprobante.ComprobanteTipoCodigo).trim();
        const numero = String(comprobante.ComprobanteNro).trim();
        const importe = Number(comprobante.ImporteTotal);

        await queryRunner.query(`
          UPDATE Comprobante
          SET ComprobanteTipoCodigo = @2, ComprobanteNro = @3, ImporteTotal = @4,
            AudFechaMod = @5, AudUsuarioMod = @6, AudIpMod = @7
          WHERE ComprobanteTipoCodigo = @0 AND TRIM(ComprobanteNro) = @1
        `, [tipoOriginal, numeroOriginal, tipo, numero, importe, ahora, usuario, ip]);

        comprobantes++;
      }

      await queryRunner.commitTransaction();

      const detalle = [
        actualizadas ? `${actualizadas} ${actualizadas === 1 ? 'orden de venta actualizada' : 'órdenes de venta actualizadas'}` : '',
        comprobantes ? `${comprobantes} ${comprobantes === 1 ? 'comprobante actualizado' : 'comprobantes actualizados'}` : ''
      ].filter(Boolean);

      return this.jsonRes({ actualizadas, comprobantes }, res, detalle.join(', '));

    } catch (error) {
      await this.rollbackTransaction(queryRunner);
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  // Anulación de las órdenes tildadas en la grilla: pasan a estado cancelado. El detalle y los
  // comprobantes no se tocan, sólo el estado.
  async anularOrdenesVenta(req: Request, res: Response, next: NextFunction) {
    const NroOrdenVentas: number[] = Array.isArray(req.body?.NroOrdenVentas)
      ? [...new Set(req.body.NroOrdenVentas.map(Number).filter(Number.isFinite))] as number[]
      : [];

    const queryRunner = await getConnection(res.locals.userName);

    try {
      if (!NroOrdenVentas.length)
        throw new ClientException('No hay órdenes de venta seleccionadas');

      // El estado se graba desde una constante, pero tiene que existir en la tabla de códigos
      const estados = await queryRunner.query(`SELECT EstadoOrdenVentaCod FROM EstadoOrdenVenta`);
      const codigos = estados.map((estado: any) => String(estado.EstadoOrdenVentaCod).trim());

      if (!codigos.includes(ESTADO_ORDEN_VENTA_CANCELADA))
        throw new ClientException(
          `El estado '${ESTADO_ORDEN_VENTA_CANCELADA}' no existe en EstadoOrdenVenta. Estados válidos: ${codigos.join(', ')}`);

      const usuario = res.locals.userName;
      const ip = this.getRemoteAddress(req);
      const ahora = new Date();

      await queryRunner.startTransaction();

      let anuladas = 0;

      for (const NroOrdenVenta of NroOrdenVentas) {
        const cabecera = await queryRunner.query(
          `SELECT FechaGeneracionFactura FROM OrdenVenta WHERE NroOrdenVenta = @0`, [NroOrdenVenta]);

        if (!cabecera[0])
          throw new ClientException(`No se encontró la orden de venta ${NroOrdenVenta}`);

        // Una vez emitida la factura la orden ya no se toca, igual que en el detalle
        if (cabecera[0].FechaGeneracionFactura)
          throw new ClientException(`La orden ${NroOrdenVenta} ya tiene factura generada, no se puede anular`);

        await queryRunner.query(`
          UPDATE OrdenVenta
          SET EstadoOrdenVentaCodigo = @1, AudFechaMod = @2, AudUsuarioMod = @3, AudIpMod = @4
          WHERE NroOrdenVenta = @0
        `, [NroOrdenVenta, ESTADO_ORDEN_VENTA_CANCELADA, ahora, usuario, ip]);

        anuladas++;
      }

      await queryRunner.commitTransaction();

      return this.jsonRes({ anuladas }, res,
        `${anuladas} ${anuladas === 1 ? 'orden de venta anulada' : 'órdenes de venta anuladas'}`);

    } catch (error) {
      await this.rollbackTransaction(queryRunner);
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async getComprobantesSeleccion(req: Request, res: Response, next: NextFunction) {
    const NroOrdenVentas: number[] = Array.isArray(req.body?.NroOrdenVentas)
      ? [...new Set(req.body.NroOrdenVentas.map(Number).filter(Number.isFinite))] as number[]
      : [];

    const queryRunner = await getConnection(res.locals.userName);

    try {
      if (!NroOrdenVentas.length) return this.jsonRes([], res);

      const parametros = NroOrdenVentas.map((_, indice) => `@${indice}`).join(',');

      const comprobantes = await queryRunner.query(`
        SELECT
          com.ComprobanteTipoCodigo,
          TRIM(com.ComprobanteNro) AS ComprobanteNro,
          MAX(tip.Descripcion) AS ComprobanteTipo,
          MAX(com.ImporteTotal) AS ImporteTotal,
          MIN(ord.ClienteId) AS ClienteId,
          COUNT(*) AS CantidadOrdenes
        FROM Comprobante com
        LEFT JOIN ComprobanteTipo tip ON tip.ComprobanteTipoCodigo = com.ComprobanteTipoCodigo
        LEFT JOIN OrdenVenta ord ON ord.NroOrdenVenta = com.NroOrdenVenta
        WHERE EXISTS (
          SELECT 1 FROM Comprobante sel
          WHERE sel.ComprobanteTipoCodigo = com.ComprobanteTipoCodigo
            AND sel.ComprobanteNro = com.ComprobanteNro
            AND sel.NroOrdenVenta IN (${parametros})
        )
        GROUP BY com.ComprobanteTipoCodigo, com.ComprobanteNro
        -- Todas las órdenes del comprobante están seleccionadas
        HAVING COUNT(*) = SUM(CASE WHEN com.NroOrdenVenta IN (${parametros}) THEN 1 ELSE 0 END)
        ORDER BY com.ComprobanteTipoCodigo, TRIM(com.ComprobanteNro)
      `, NroOrdenVentas);

      this.jsonRes(comprobantes, res);
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  // Estados posibles de una orden de venta, para el combo de la edición masiva
  async getEstados(req: Request, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const estados = await queryRunner.query(`
        SELECT EstadoOrdenVentaCod AS value, TRIM(Descripcion) AS label FROM EstadoOrdenVenta
      `);

      this.jsonRes(estados, res);
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async getOrdenVentaAuditoria(req: Request, res: Response, next: NextFunction) {
    const NroOrdenVenta = Number(req.params.NroOrdenVenta);
    if (!NroOrdenVenta) return this.jsonRes(null, res);

    const queryRunner = await getConnection(res.locals.userName);

    try {
      const auditoria = await queryRunner.query(`
        SELECT ord.NroOrdenVenta,
          ord.AudUsuarioIng, ord.AudFechaIng, ord.AudIpIng,
          ord.AudUsuarioMod, ord.AudFechaMod, ord.AudIpMod
        FROM OrdenVenta ord
        WHERE ord.NroOrdenVenta = @0
      `, [NroOrdenVenta]);

      this.jsonRes(auditoria[0] ?? null, res);
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  // Datos de facturación de los clientes de las órdenes seleccionadas. Es la misma información
  // que muestra la edición masiva de custodias, pero servida desde este módulo para que quede
  // bajo el mismo permiso que el resto de la pantalla.
  async getDatosFacturacion(req: Request, res: Response, next: NextFunction) {
    const ClienteIds: number[] = Array.isArray(req.body?.ClienteIds)
      ? req.body.ClienteIds.map(Number).filter(Number.isFinite)
      : [];

    const queryRunner = await getConnection(res.locals.userName);

    try {
      if (!ClienteIds.length) return this.jsonRes([], res);

      const clientes = await queryRunner.query(`
        SELECT
          cli.ClienteId,
          TRIM(cli.ClienteDenominacion) AS ClienteDenominacion,
          fac.ClienteFacturacionCUIT AS CUIT,
          CONCAT_WS(' ', TRIM(dom.DomicilioDomCalle), TRIM(dom.DomicilioDomNro),
            TRIM(loc.LocalidadDescripcion), TRIM(prov.ProvinciaDescripcion)) AS Domicilio
        FROM Cliente cli
        LEFT JOIN ClienteFacturacion fac ON fac.ClienteId = cli.ClienteId
          AND fac.ClienteFacturacionDesde <= @0
          AND ISNULL(fac.ClienteFacturacionHasta, '9999-12-31') >= @0
        LEFT JOIN NexoDomicilio nex ON nex.ClienteId = cli.ClienteId AND nex.NexoDomicilioActual = 1
        LEFT JOIN Domicilio dom ON dom.DomicilioId = nex.DomicilioId
        LEFT JOIN Localidad loc ON loc.LocalidadId = dom.DomicilioLocalidadId
          AND loc.ProvinciaId = dom.DomicilioProvinciaId AND loc.PaisId = dom.DomicilioPaisId
        LEFT JOIN Provincia prov ON prov.ProvinciaId = dom.DomicilioProvinciaId AND prov.PaisId = dom.DomicilioPaisId
        WHERE cli.ClienteId IN (${ClienteIds.map((_, indice) => `@${indice + 1}`).join(',')})
      `, [new Date(), ...ClienteIds]);

      this.jsonRes(clientes, res);
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }
}
