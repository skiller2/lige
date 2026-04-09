import type { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/base.controller.ts";
import { dataSource } from "../data-source.ts";

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
        SELECT catper.CategoriaPersonalId value, TRIM(catper.CategoriaPersonalDescripcion) label
        FROM CategoriaPersonal catper
        WHERE catper.CategoriaPersonalInactivo IS NULL
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

        const ip = this.getRemoteAddress(req)
        const queryRunner = dataSource.createQueryRunner();
        const usuario = res.locals.userName

        const fechaActual = new Date()
        let message = ""
        const params = req.body
      

   console.log('params recibidos', params)

        try {
            await queryRunner.connect()
            await queryRunner.startTransaction()

           
            let dataResultado = {}

            if (true) { //Entro en update
                //Validar si cambio el código

                dataResultado = { action: 'U', GrupoActividadId: params.GrupoActividadId, GrupoActividadJerarquicoId: params.GrupoActividadJerarquicoId }
                message = "Actualización exitosa"

            } else {  //Es un nuevo registro
                // console.log('nuevo registro')
          
            }
           
            await queryRunner.commitTransaction()
            return this.jsonRes(dataResultado, res, message)
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

    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction();

      const recibos = await queryRunner.query(`
        SELECT COUNT(*) AS cnt FROM lige.dbo.liqmadings
        WHERE anio = @0 AND mes = @1`,
        [anio, mes]
      );
      if (recibos[0].cnt > 0) throw new ClientException("No se puede modificar: existen recibos generados para este período");

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
