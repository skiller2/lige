import { BaseController } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import { filtrosToSql, orderToSQL } from "../impuestos-afip/filtros-utils/filtros.ts";

export class PrecioEfectosController extends BaseController {

  listaColumnas: any[] = [
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
      id: "EfectoId",
      name: "Efecto",
      field: "EfectoId",
      fieldName: "pre.EfectoId",
      type: "number",
      searchComponent: "inputForEfectoSearch",
      sortable: true,
      hidden: true,
      searchHidden: false
    },
    {
      id: "EfectoEfectoIndividualId",
      name: "Efecto Individual",
      field: "EfectoEfectoIndividualId",
      fieldName: "pre.EfectoEfectoIndividualId",
      type: "number",
      sortable: false,
      hidden: true,
      searchHidden: true
    },
    {
      id: "EfectoDescripcionCompleto",
      name: "Efecto Descripción",
      field: "EfectoDescripcionCompleto",
      fieldName: "pre.EfectoDescripcionCompleto",
      type: "string",
      sortable: true,
      hidden: false,
      searchHidden: false
    },
    {
      id: "Importe",
      name: "Importe",
      field: "Importe",
      fieldName: "pre.Importe",
      type: "currency",
      searchType: "numberAdvanced",
      searchComponent: "inputForNumberAdvancedSearch",
      sortable: true,
      hidden: false,
      searchHidden: false,
      maxWidth: 140
    },
    {
      id: "FechaDesde",
      name: "Desde",
      field: "FechaDesde",
      fieldName: "pre.FechaDesde",
      type: "date",
      searchComponent: "inputForFechaSearch",
      sortable: true,
      hidden: false,
      searchHidden: false,
      maxWidth: 140
    },
    {
      id: "FechaHasta",
      name: "Hasta",
      field: "FechaHasta",
      fieldName: "ISNULL(pre.FechaHasta,'9999-12-31')",
      type: "date",
      searchComponent: "inputForFechaSearch",
      sortable: true,
      hidden: false,
      searchHidden: false,
      maxWidth: 140
    }
  ];

  async getGridCols(req, res) {
    this.jsonRes(this.listaColumnas, res);
  }

  async listPrecioEfectos(req: any, res: any, next: any) {
    const filterSql = filtrosToSql(req.body.filters.filtros, this.listaColumnas);
    const orderBy = orderToSQL(req.body.filters.sort)
    const queryRunner = await getConnection(res.locals.userName);

    try {
      const precios = await queryRunner.query(
        `
        SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) id, pre.*
        FROM (
          SELECT DISTINCT efe.EfectoId, efeind.EfectoEfectoIndividualId,
            CASE WHEN efeind.EfectoEfectoIndividualId IS NULL
              THEN CONCAT(TRIM(efe.EfectoDescripcion), ' (', efe.EfectoAtrDescripcion, ' )')
              ELSE CONCAT(TRIM(efe.EfectoDescripcion), ' - ', TRIM(efeind.EfectoEfectoIndividualDescripcion), ' (', efe.EfectoAtrDescripcion, ', ', efeind.EfectoIndividualAtrDescripcion, ' )')
            END AS EfectoDescripcionCompleto,
            ISNULL(lpi.ListaPrecioIndividualPrecio, lp.ListaPrecioPrecio) AS Importe,
            CASE WHEN lpi.ListaPrecioIndividualPrecio IS NULL THEN lp.ListaPrecioDesde ELSE lpi.ListaPrecioIndividualDesde END AS FechaDesde,
            CASE WHEN lpi.ListaPrecioIndividualPrecio IS NULL THEN lp.ListaPrecioHasta ELSE lpi.ListaPrecioIndividualHasta END AS FechaHasta
          FROM EfectoDescripcion efe
          LEFT JOIN EfectoIndividualDescripcion efeind ON efeind.EfectoId = efe.EfectoId
          LEFT JOIN ListaPrecio lp ON lp.EfectoId = efe.EfectoId
          LEFT JOIN ListaPrecioIndividual lpi ON lpi.EfectoId = efeind.EfectoId AND lpi.EfectoEfectoIndividualId = efeind.EfectoEfectoIndividualId
        ) pre
        WHERE
          ${filterSql} ${orderBy}`)

      this.jsonRes(
        {
          total: precios.length,
          list: precios,
        },
        res
      );

    } catch (error) {
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }
}
