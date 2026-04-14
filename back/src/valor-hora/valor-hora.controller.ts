import type { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/base.controller.ts";
import { dataSource } from "../data-source.ts";
import { recibosController } from "../controller/controller.module.ts";
import { Utils } from "../liquidaciones/liquidaciones.utils.ts";

export class ValorHoraController extends BaseController {

  listaColumnas: any[] = [
    {
      id: "id",
      name: "id",
      field: "id",
      fieldName: "vl.ValorLiquidacionId",
      type: "number",
      sortable: true,
      searchHidden: true,
      hidden: true
    },
    {
      name: "Sucursal",
      type: "string",
      id: "SucursalId",
      field: "ValorLiquidacionSucursalId",
      fieldName: "vl.ValorLiquidacionSucursalId",
      formatter: 'collectionFormatter',
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Tipo Asociado",
      type: "string",
      id: "TipoAsociadoId",
      field: "ValorLiquidacionTipoAsociadoId",
      fieldName: "vl.ValorLiquidacionTipoAsociadoId",
      formatter: 'collectionFormatter',
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Categoría",
      type: "string",
      id: "CategoriaPersonalId",
      field: "ValorLiquidacionCategoriaPersonalId",
      fieldName: "vl.ValorLiquidacionCategoriaPersonalId",
      formatter: 'collectionFormatter',
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Importe",
      type: "currency",
      id: "ValorLiquidacionHoraNormal",
      field: "ValorLiquidacionHoraNormal",
      fieldName: "vl.ValorLiquidacionHoraNormal",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
  ];

  async getValorHoraCols(req: Request, res: Response) {
    this.jsonRes(this.listaColumnas, res);
  }

  async getCategoriasPersonal(req: Request, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await queryRunner.query(`
        SELECT catper.CategoriaPersonalId value, TRIM(catper.CategoriaPersonalDescripcion) label, catper.TipoAsociadoId
        FROM CategoriaPersonal catper
        WHERE ISNULL(catper.CategoriaPersonalInactivo, 0) = 0
      `);
      this.jsonRes(options, res);
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async getValorHoraData(req: Request, res: Response, next: NextFunction) {
    const anio = Number(req.body.anio);
    const mes = Number(req.body.mes);
    if (!anio || !mes) return next(new ClientException("Debe indicar año y mes"));

    const queryRunner = dataSource.createQueryRunner();
    try {
      const data = await queryRunner.query(`
        SELECT vl.ValorLiquidacionId AS id, vl.ValorLiquidacionSucursalId, vl.ValorLiquidacionTipoAsociadoId,
               ta.TipoAsociadoDescripcion, vl.ValorLiquidacionCategoriaPersonalId, vl.ValorLiquidacionHoraNormal,
               cp.CategoriaPersonalDescripcion, s.SucursalDescripcion,
               vl.ValorLiquidacionDesde, vl.ValorLiquidacionHasta
        FROM ValorLiquidacion vl
        LEFT JOIN TipoAsociado ta ON ta.TipoAsociadoId = vl.ValorLiquidacionTipoAsociadoId
        LEFT JOIN CategoriaPersonal cp ON cp.CategoriaPersonalId = vl.ValorLiquidacionCategoriaPersonalId
                                        AND vl.ValorLiquidacionTipoAsociadoId = cp.TipoAsociadoId
        LEFT JOIN Sucursal s ON s.SucursalId = vl.ValorLiquidacionSucursalId
        WHERE vl.ValorLiquidacionDesde <= EOMONTH(DATEFROMPARTS(@0,@1,1))
          AND ISNULL(vl.ValorLiquidacionHasta, '9999-12-31') >= DATEFROMPARTS(@0,@1,1)`,
        [anio, mes]
      );

      this.jsonRes(
        {
          total: data.length,
          list: data,
        },
        res
      );
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async changecellvalorHora(req: Request, res: Response, next: NextFunction) {

        const queryRunner = dataSource.createQueryRunner();
        let message = ""
        const params = req.body

        const { ValorLiquidacionSucursalId, ValorLiquidacionTipoAsociadoId, ValorLiquidacionCategoriaPersonalId, ValorLiquidacionHoraNormal, ValorLiquidacionDesde, anio, mes } = params

        if (!ValorLiquidacionSucursalId || !ValorLiquidacionTipoAsociadoId || !ValorLiquidacionCategoriaPersonalId || ValorLiquidacionHoraNormal == null)
          return next(new ClientException("Faltan datos obligatorios"))

        if (!anio || !mes)
          return next(new ClientException("Debe indicar año y mes"))

        try {
            await queryRunner.connect()
            await queryRunner.startTransaction()

            let dataResultado = {}

            // Validar que no existan recibos generados para el período
            const recibos = await queryRunner.query(`
              SELECT COUNT(*) AS cnt FROM lige.dbo.liqmadings
              WHERE anio = @0 AND mes = @1`,
              [anio, mes]
            )
            if (recibos[0].cnt > 0)
              throw new ClientException("No se puede modificar: existen recibos generados para este período")

            // Validar que la combinación TipoAsociado + CategoriaPersonal exista
            const catValid = await queryRunner.query(`
              SELECT 1 AS ok FROM CategoriaPersonal
              WHERE TipoAsociadoId = @0 AND CategoriaPersonalId = @1`,
              [ValorLiquidacionTipoAsociadoId, ValorLiquidacionCategoriaPersonalId]
            )
            if (!catValid.length)
              throw new ClientException("La categoría seleccionada no corresponde al tipo de asociado")

            if (ValorLiquidacionDesde) {
                // UPDATE: el registro ya existe en la base
                await queryRunner.query(`
                  UPDATE ValorLiquidacion
                  SET ValorLiquidacionSucursalId = @0,
                      ValorLiquidacionTipoAsociadoId = @1,
                      ValorLiquidacionCategoriaPersonalId = @2,
                      ValorLiquidacionHoraNormal = @3
                  WHERE ValorLiquidacionId = @4`,
                  [ValorLiquidacionSucursalId, ValorLiquidacionTipoAsociadoId, ValorLiquidacionCategoriaPersonalId, ValorLiquidacionHoraNormal, params.id]
                )

                dataResultado = { action: 'U', id: params.id }
                message = "Actualización exitosa"

            } else {
                // INSERT: registro nuevo - ValorLiquidacionId es IDENTITY
                const result = await queryRunner.query(`
                  INSERT INTO ValorLiquidacion (ValorLiquidacionSucursalId, ValorLiquidacionTipoAsociadoId, ValorLiquidacionCategoriaPersonalId, ValorLiquidacionHoraNormal, ValorLiquidacionDesde)
                  VALUES (@0, @1, @2, @3, DATEFROMPARTS(@4, @5, 1));
                  SELECT SCOPE_IDENTITY() AS id`,
                  [ValorLiquidacionSucursalId, ValorLiquidacionTipoAsociadoId, ValorLiquidacionCategoriaPersonalId, ValorLiquidacionHoraNormal, anio, mes]
                )

                dataResultado = { action: 'I', id: result[0].id }
                message = "Registro creado exitosamente"
            }
            //console.log("Data resultado:", dataResultado) // Log para verificar el resultado antes del commit
           // throw new Error("Error de prueba para rollback") // TODO: eliminar esta línea una vez probado el rollback
            await queryRunner.commitTransaction()
            return this.jsonRes(dataResultado, res, message)
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async deleteValorHora(req: Request, res: Response, next: NextFunction) {
    const { ids, anio, mes } = req.body;
    if (!ids || !ids.length) return next(new ClientException("Debe seleccionar al menos un registro"));
    if (!anio || !mes) return next(new ClientException("Debe indicar año y mes"));

    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Validar que no existan recibos generados para el período
      const recibos = await queryRunner.query(`
        SELECT COUNT(*) AS cnt FROM lige.dbo.liqmadings
        WHERE anio = @0 AND mes = @1`,
        [anio, mes]
      );
      if (recibos[0].cnt > 0)
        throw new ClientException("No se puede eliminar: existen recibos generados para este período");

      for (const id of ids) {
        await queryRunner.query(`DELETE FROM ValorLiquidacion WHERE ValorLiquidacionId = @0`, [id]);
      }

      await queryRunner.commitTransaction();
      return this.jsonRes({ success: true }, res, "Registro eliminado exitosamente");
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async aumentarValores(req: Request, res: Response, next: NextFunction) {
    const { anio, mes, tipo, valor } = req.body;
    if (!anio || !mes || !tipo || valor == null) return next(new ClientException("Datos incompletos"));
    if (!['porcentaje', 'fijo'].includes(tipo)) return next(new ClientException("Tipo debe ser 'porcentaje' o 'fijo'"));

    let usuario = res.locals.userName
    let ip = this.getRemoteAddress(req)
     let fechaActual = new Date()

    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction();

        const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, anio, mes, usuario, ip)
      
      const getRecibosGenerados = await recibosController.getRecibosGenerados(queryRunner, periodo_id)

      
      if (getRecibosGenerados[0].ind_recibos_generados == 1)
        throw new ClientException(`Los recibos para este periodo ya se generaron`)

      //console.log("Aumentando valores: tipo =", tipo, "valor =", valor) 
      if (tipo === 'porcentaje') {
        await queryRunner.query(`
          UPDATE vl SET vl.ValorLiquidacionHoraNormal = ROUND(vl.ValorLiquidacionHoraNormal * (1 + @2 / 100.0), 2)
          FROM ValorLiquidacion vl
          WHERE vl.ValorLiquidacionDesde <= EOMONTH(DATEFROMPARTS(@0,@1,1))
            AND ISNULL(vl.ValorLiquidacionHasta, '9999-12-31') >= DATEFROMPARTS(@0,@1,1)`,
          [anio, mes, valor]
        );
      } else {
        await queryRunner.query(`
          UPDATE vl SET vl.ValorLiquidacionHoraNormal = vl.ValorLiquidacionHoraNormal + @2
          FROM ValorLiquidacion vl
          WHERE vl.ValorLiquidacionDesde <= EOMONTH(DATEFROMPARTS(@0,@1,1))
            AND ISNULL(vl.ValorLiquidacionHasta, '9999-12-31') >= DATEFROMPARTS(@0,@1,1)`,
          [anio, mes, valor]
        );
      }
      //throw new Error("Error de prueba para rollback") // TODO: eliminar esta línea una vez probado el rollback
      await queryRunner.commitTransaction();
      this.jsonRes({ success: true }, res);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }
}
