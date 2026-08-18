import { BaseController } from "../controller/base.controller.ts";
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

export class OrdenVentaController extends BaseController {

  async getGridCols(req: Request, res: Response) {
    this.jsonRes(columnasGrilla, res);
  }

  // El detalle por producto vive en Facturacion: ItemOrdenVenta solo tiene el objetivo y el período.
  async getListOrdenVenta(req: Request, res: Response, next: NextFunction) {
    const ObjetivoId = Number(req.body.ObjetivoId);
    const anio = Number(req.body.anio);
    const mes = Number(req.body.mes);
    const queryRunner = await getConnection(res.locals.userName);

    try {
      const items = await queryRunner.query(`
        SELECT
          fac.FacturacionCodigo AS id,
          fac.ProductoCodigo,
          prod.Nombre AS Producto,
          fac.Cantidad,
          ISNULL(pre.Importe, fac.PrecioUnitario) AS ImporteUnitario,
          fac.TextoFactura,
          IIF(fac.ComprobanteNro IS NULL, NULL, fac.Cantidad) AS CantidadEnFactura,
          ISNULL(fac.Cantidad,0) * ISNULL(ISNULL(pre.Importe, fac.PrecioUnitario),0) AS ImporteTotal
        FROM Facturacion fac
        JOIN Objetivo obj ON obj.ClienteId = fac.ClienteId AND obj.ClienteElementoDependienteId = fac.ClienteElementoDependienteId
        LEFT JOIN Producto prod ON prod.ProductoCodigo = fac.ProductoCodigo
        OUTER APPLY (
          SELECT TOP 1 pp.Importe
          FROM ProductoPrecio pp
          WHERE pp.ProductoCodigo = fac.ProductoCodigo
            AND pp.ClienteId = fac.ClienteId
            AND pp.PeriodoDesdeAplica <= EOMONTH(DATEFROMPARTS(@1,@2,1))
          ORDER BY pp.PeriodoDesdeAplica DESC
        ) pre
        WHERE obj.ObjetivoId = @0 AND fac.Anio = @1 AND fac.Mes = @2
      `, [ObjetivoId, anio, mes]);

      this.jsonRes(
        {
          total: items.length,
          list: items,
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
          obj.ObjetivoId, obj.ClienteId, obj.ClienteElementoDependienteId,
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

      this.jsonRes(precio[0] ?? { ProductoCodigo, ImporteUnitario: null }, res);

    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }
}
