import { BaseController, ClientException } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import { recibosController } from "../controller/controller.module.ts";
import { Utils } from "../liquidaciones/liquidaciones.utils.ts";
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
      searchHidden: true
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

  async modificarValor(req: any, res: any, next: any) {
    const queryRunner = await getConnection(res.locals.userName);
    const EfectoId = Number(req.body.EfectoId) || null
    const EfectoEfectoIndividualId = (req.body.EfectoEfectoIndividualId === null || req.body.EfectoEfectoIndividualId === undefined || req.body.EfectoEfectoIndividualId === '')
      ? null : Number(req.body.EfectoEfectoIndividualId)
    const Importe = Number(req.body.Importe)

    try {
      if (!EfectoId)
        throw new ClientException("Debe indicar el efecto")

      if (!req.body.FechaDesde)
        throw new ClientException("Debe indicar la fecha desde")

      if (!Importe || Importe <= 0)
        throw new ClientException("Ingrese un importe válido distinto de 0")

      const FechaDesde = new Date(req.body.FechaDesde)
      FechaDesde.setHours(0, 0, 0, 0)

      const FechaHastaAnterior = new Date(FechaDesde)
      FechaHastaAnterior.setDate(FechaHastaAnterior.getDate() - 1)

      await queryRunner.startTransaction()

      // No se puede modificar el precio si la vigencia cae en un período con los recibos generados
      const periodo_id = await Utils.getPeriodoId(queryRunner, new Date(), FechaDesde.getFullYear(), FechaDesde.getMonth() + 1, res.locals.userName, this.getRemoteAddress(req))
      const getRecibosGenerados = await recibosController.getRecibosGenerados(queryRunner, periodo_id)

      if (getRecibosGenerados[0]?.ind_recibos_generados == 1)
        throw new ClientException(`No se puede modificar el precio con vigencia ${this.dateOutputFormat(FechaDesde)}. Se encuentran generados los recibos para el período ${FechaDesde.getMonth() + 1}/${FechaDesde.getFullYear()}.`)

      if (EfectoEfectoIndividualId === null)
        await this.setListaPrecio(queryRunner, EfectoId, Importe, FechaDesde, FechaHastaAnterior)
      else
        await this.setListaPrecioIndividual(queryRunner, EfectoId, EfectoEfectoIndividualId, Importe, FechaDesde, FechaHastaAnterior)

      await queryRunner.commitTransaction()
      return this.jsonRes({}, res, 'Valor modificado');

    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  private async setListaPrecio(queryRunner: any, EfectoId: number, Importe: number, FechaDesde: Date, FechaHastaAnterior: Date) {
    const mismaFecha = await queryRunner.query(`
      SELECT ListaPrecioId FROM ListaPrecio WHERE EfectoId = @0 AND ListaPrecioDesde = @1
    `, [EfectoId, FechaDesde])

    if (mismaFecha.length) {
      await queryRunner.query(`
        UPDATE ListaPrecio SET ListaPrecioPrecio = @0
        WHERE EfectoId = @1 AND ListaPrecioId = @2
      `, [Importe, EfectoId, mismaFecha[0].ListaPrecioId])
      return
    }

    const anterior = await queryRunner.query(`
      SELECT TOP 1 ListaPrecioId FROM ListaPrecio
      WHERE EfectoId = @0 AND ListaPrecioDesde < @1 AND ISNULL(ListaPrecioHasta,'9999-12-31') >= @1
      ORDER BY ListaPrecioDesde DESC
    `, [EfectoId, FechaDesde])

    if (anterior.length) {
      await queryRunner.query(`
        UPDATE ListaPrecio SET ListaPrecioHasta = @0
        WHERE EfectoId = @1 AND ListaPrecioId = @2
      `, [FechaHastaAnterior, EfectoId, anterior[0].ListaPrecioId])
    }

    // ListaPrecioId es secuencial por efecto: MAX+1 del efecto.
    const maxId = await queryRunner.query(`
      SELECT ISNULL(MAX(ListaPrecioId), 0) AS MaxId FROM ListaPrecio WHERE EfectoId = @0
    `, [EfectoId])

    await queryRunner.query(`
      INSERT INTO ListaPrecio (ListaPrecioId, EfectoId, ListaPrecioPrecio, ListaPrecioDesde, ListaPrecioHasta)
      VALUES (@0, @1, @2, @3, NULL)
    `, [Number(maxId[0]?.MaxId ?? 0) + 1, EfectoId, Importe, FechaDesde])
  }

  private async setListaPrecioIndividual(queryRunner: any, EfectoId: number, EfectoEfectoIndividualId: number, Importe: number, FechaDesde: Date, FechaHastaAnterior: Date) {
    const mismaFecha = await queryRunner.query(`
      SELECT ListaPrecioIndividualId FROM ListaPrecioIndividual
      WHERE EfectoId = @0 AND EfectoEfectoIndividualId = @1 AND ListaPrecioIndividualDesde = @2
    `, [EfectoId, EfectoEfectoIndividualId, FechaDesde])

    if (mismaFecha.length) {
      await queryRunner.query(`
        UPDATE ListaPrecioIndividual SET ListaPrecioIndividualPrecio = @0
        WHERE EfectoId = @1 AND EfectoEfectoIndividualId = @2 AND ListaPrecioIndividualId = @3
      `, [Importe, EfectoId, EfectoEfectoIndividualId, mismaFecha[0].ListaPrecioIndividualId])
      return
    }

    const anterior = await queryRunner.query(`
      SELECT TOP 1 ListaPrecioIndividualId FROM ListaPrecioIndividual
      WHERE EfectoId = @0 AND EfectoEfectoIndividualId = @1
        AND ListaPrecioIndividualDesde < @2 AND ISNULL(ListaPrecioIndividualHasta,'9999-12-31') >= @2
      ORDER BY ListaPrecioIndividualDesde DESC
    `, [EfectoId, EfectoEfectoIndividualId, FechaDesde])

    if (anterior.length) {
      await queryRunner.query(`
        UPDATE ListaPrecioIndividual SET ListaPrecioIndividualHasta = @0
        WHERE EfectoId = @1 AND EfectoEfectoIndividualId = @2 AND ListaPrecioIndividualId = @3
      `, [FechaHastaAnterior, EfectoId, EfectoEfectoIndividualId, anterior[0].ListaPrecioIndividualId])
    }

    // ListaPrecioIndividualId es secuencial por efecto/individual (parte de la PK compuesta): MAX+1.
    const maxId = await queryRunner.query(`
      SELECT ISNULL(MAX(ListaPrecioIndividualId), 0) AS MaxId FROM ListaPrecioIndividual
      WHERE EfectoId = @0 AND EfectoEfectoIndividualId = @1
    `, [EfectoId, EfectoEfectoIndividualId])

    await queryRunner.query(`
      INSERT INTO ListaPrecioIndividual (ListaPrecioIndividualId, EfectoId, EfectoEfectoIndividualId, ListaPrecioIndividualPrecio, ListaPrecioIndividualDesde, ListaPrecioIndividualHasta)
      VALUES (@0, @1, @2, @3, @4, NULL)
    `, [Number(maxId[0]?.MaxId ?? 0) + 1, EfectoId, EfectoEfectoIndividualId, Importe, FechaDesde])
  }
}
