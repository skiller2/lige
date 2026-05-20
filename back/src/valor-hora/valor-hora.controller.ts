import type { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import { recibosController } from "../controller/controller.module.ts";
import { Utils } from "../liquidaciones/liquidaciones.utils.ts";
import { filtrosToSql, orderToSQL } from "../impuestos-afip/filtros-utils/filtros.ts";

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
      id: "ValorLiquidacionId",
      name: "ValorLiquidacionId",
      field: "ValorLiquidacionId",
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
      searchType: "number",
      searchComponent: "inputForSucursalSearch",
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
      searchType: "number",
      searchComponent: "inputForTipoAsociadoSearch",
    },
    {
      name: "Categoría",
      type: "string",
      id: "CategoriaCod",
      field: "CategoriaCod",
      fieldName: "percat.CategoriaCod",
      searchComponent: "inputForTipoAsociadoCategoriaSearch",
      sortable: true,
      hidden: true,
      searchHidden: false
    },
    {
      name: "Categoría",
      type: "string",
      id: "CategoriaPersonalId",
      field: "ValorLiquidacionCategoriaPersonalId",
      fieldName: "vl.ValorLiquidacionCategoriaPersonalId",
      formatter: 'collectionFormatter',
      sortable: true,
      hidden: false,
      searchHidden: true,
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
      searchType: "numberAdvanced",
      searchComponent: "inputForNumberAdvancedSearch",
    },
  ];

  async getValorHoraCols(req: Request, res: Response) {
    this.jsonRes(this.listaColumnas, res);
  }

  async getCategoriasPersonal(req: Request, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const options = await queryRunner.query(`
        SELECT catper.CategoriaPersonalId value, TRIM(catper.CategoriaPersonalDescripcion) label, catper.TipoAsociadoId
        FROM CategoriaPersonal catper
    
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

    const filterSql = filtrosToSql(req.body?.options?.filtros ?? [], this.listaColumnas);
    const orderBy = orderToSQL(req.body?.options?.sort);

    const queryRunner = await getConnection(res.locals.userName);
    try {
      const data = await queryRunner.query(`
        SELECT vl.ValorLiquidacionId AS id, vl.ValorLiquidacionId, vl.ValorLiquidacionSucursalId, vl.ValorLiquidacionTipoAsociadoId,
               ta.TipoAsociadoDescripcion, vl.ValorLiquidacionCategoriaPersonalId, vl.ValorLiquidacionHoraNormal,
               cp.CategoriaPersonalDescripcion, s.SucursalDescripcion,
               vl.ValorLiquidacionDesde, vl.ValorLiquidacionHasta,
               percat.CategoriaCod, percat.PersonalCategoriaCom
        FROM ValorLiquidacion vl
        LEFT JOIN TipoAsociado ta ON ta.TipoAsociadoId = vl.ValorLiquidacionTipoAsociadoId
        LEFT JOIN CategoriaPersonal cp ON cp.CategoriaPersonalId = vl.ValorLiquidacionCategoriaPersonalId AND vl.ValorLiquidacionTipoAsociadoId = cp.TipoAsociadoId
        LEFT JOIN Sucursal s ON s.SucursalId = vl.ValorLiquidacionSucursalId
        CROSS APPLY (
          SELECT
            CONCAT(vl.ValorLiquidacionTipoAsociadoId, '/', vl.ValorLiquidacionCategoriaPersonalId) AS CategoriaCod,
            CONCAT(TRIM(ta.TipoAsociadoDescripcion), ' - ', TRIM(cp.CategoriaPersonalDescripcion)) AS PersonalCategoriaCom
        ) percat
        WHERE vl.ValorLiquidacionDesde <= EOMONTH(DATEFROMPARTS(@0,@1,1))
          AND ISNULL(vl.ValorLiquidacionHasta, '9999-12-31') >= DATEFROMPARTS(@0,@1,1) and ISNULL(cp.CategoriaPersonalInactivo, 0) = 0
          AND (${filterSql})
        ${orderBy}`,
        [anio, mes]
      );

      const per = await this.getPeriodoQuery(queryRunner, anio, mes)
      const recibosGenerados = Number(per?.[0]?.ind_recibos_generados ?? 0) === 1;

      this.jsonRes(
        {
          total: data.length,
          list: data,
          recibosGenerados,
        },
        res
      );
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async getPeriodoQuery(queryRunner: any, anio: number, mes: number) {
    return await queryRunner.query(`
      SELECT periodo_id, anio, mes, ind_recibos_generados
      FROM lige.dbo.liqmaperiodo
      WHERE anio = @0 AND mes = @1
    `, [anio, mes])
  }

  async changecellvalorHora(req: Request, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);
    const params = req.body;
    const usuario = res.locals.userName;
    const ip = this.getRemoteAddress(req);
    const fechaActual = new Date();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const { dataResultado, message } = await this.setValorHora(queryRunner, params, usuario, ip, fechaActual);

      await queryRunner.commitTransaction();
      return this.jsonRes(dataResultado, res, message);
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

    const usuario = res.locals.userName
    const ip = this.getRemoteAddress(req)
    const fechaActual = new Date()

    const queryRunner = await getConnection(res.locals.userName);
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Validar que no existan recibos generados para el período
      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, anio, mes, usuario, ip)

      const getRecibosGenerados = await recibosController.getRecibosGenerados(queryRunner, periodo_id)

      if (getRecibosGenerados[0].ind_recibos_generados == 1)
        throw new ClientException(`No se puede eliminar el Importe, debido a que el periodo ${mes}/${anio} cuenta con los recibos generados.`)


      for (const id of ids) {
        // Obtener los datos del registro a eliminar
        const registros = await queryRunner.query(`
          SELECT ValorLiquidacionSucursalId, ValorLiquidacionTipoAsociadoId, ValorLiquidacionCategoriaPersonalId, ValorLiquidacionDesde
          FROM ValorLiquidacion
          WHERE ValorLiquidacionId = @0
        `, [id]);

        if (registros.length > 0) {
          const {
            ValorLiquidacionSucursalId,
            ValorLiquidacionTipoAsociadoId,
            ValorLiquidacionCategoriaPersonalId,
            ValorLiquidacionDesde
          } = registros[0];

          const periodoValorExistente = await Utils.getPeriodoId(queryRunner, fechaActual, ValorLiquidacionDesde.getFullYear(), ValorLiquidacionDesde.getMonth() + 1, usuario, ip)
          const getRecibosGeneradosValorExistente = await recibosController.getRecibosGenerados(queryRunner, periodoValorExistente)

          if (getRecibosGeneradosValorExistente[0].ind_recibos_generados == 1)
            throw new ClientException(`No se puede eliminar el Importe, debido a que dicho importe cuenta con fecha desde ${ValorLiquidacionDesde.getMonth() + 1}/${ValorLiquidacionDesde.getFullYear()} y ya se encuentran generados los recibos.`)


          // Traer todos los registros de la misma combinación ordenados, excluyendo el que se va a borrar
          const registrosRestantes = await queryRunner.query(`
            SELECT ValorLiquidacionId, ValorLiquidacionDesde
            FROM ValorLiquidacion
            WHERE ValorLiquidacionSucursalId = @0 
              AND ValorLiquidacionTipoAsociadoId = @1 
              AND ValorLiquidacionCategoriaPersonalId = @2
              AND ValorLiquidacionId != @3
            ORDER BY ValorLiquidacionDesde ASC
          `, [ValorLiquidacionSucursalId, ValorLiquidacionTipoAsociadoId, ValorLiquidacionCategoriaPersonalId, id]);

          // Borrar el registro
          await queryRunner.query(`DELETE FROM ValorLiquidacion WHERE ValorLiquidacionId = @0`, [id]);

          // Encontrar el registro anterior y siguiente
          const pasados = registrosRestantes.filter((r: any) => new Date(r.ValorLiquidacionDesde) < new Date(ValorLiquidacionDesde));
          const futuros = registrosRestantes.filter((r: any) => new Date(r.ValorLiquidacionDesde) > new Date(ValorLiquidacionDesde));

          // Si existe un registro anterior, debemos actualizar su "Hasta" para tapar el hueco
          if (pasados.length > 0) {
            const registroAnterior = pasados[pasados.length - 1]; // El más reciente del pasado

            let nuevoHasta = null;
            if (futuros.length > 0) {
              const registroSiguiente = futuros[0];
              const refDesdeSig = new Date(registroSiguiente.ValorLiquidacionDesde);
              nuevoHasta = new Date(refDesdeSig.getFullYear(), refDesdeSig.getMonth(), 0); // Último día del mes anterior al siguiente
            }

            await queryRunner.query(`
              UPDATE ValorLiquidacion
              SET ValorLiquidacionHasta = @0,
                  AudFechaMod = @1, AudIpMod = @2, AudUsuarioMod = @3
              WHERE ValorLiquidacionId = @4`,
              [nuevoHasta, fechaActual, ip, usuario, registroAnterior.ValorLiquidacionId]
            );
          }
        } else {
          throw new ClientException(`Error al eliminar el siguiente registro: Id= ${id}, SucursalId= ${registros[0].ValorLiquidacionSucursalId}, TipoAsociadoId= ${registros[0].ValorLiquidacionTipoAsociadoId}, CategoriaPersonalId= ${registros[0].ValorLiquidacionCategoriaPersonalId}, Desde= ${registros[0].ValorLiquidacionDesde}`)
        }

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

    const queryRunner = await getConnection(res.locals.userName);
    try {
      await queryRunner.startTransaction();

      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, anio, mes, usuario, ip)

      const getRecibosGenerados = await recibosController.getRecibosGenerados(queryRunner, periodo_id)


      if (getRecibosGenerados[0].ind_recibos_generados == 1)
        throw new ClientException(`No se puede modificar los Importes del período ${mes}/${anio}, los recibos se encuentran generados para ese período.`)


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

  async setValorHora(queryRunner: any, params: any, usuario: string, ip: string, fechaActual: Date = new Date()) {
    const { ValorLiquidacionSucursalId, ValorLiquidacionTipoAsociadoId, ValorLiquidacionCategoriaPersonalId, ValorLiquidacionHoraNormal, anio, mes } = params;

    if (!ValorLiquidacionSucursalId || !ValorLiquidacionTipoAsociadoId || !ValorLiquidacionCategoriaPersonalId || ValorLiquidacionHoraNormal == null)
      throw new ClientException("Faltan datos obligatorios (Sucursal, Tipo Asociado, Categoría o Importe)");

    if (!anio || !mes)
      throw new ClientException("Debe indicar año y mes.");

    let dataResultado = {};
    let message = "";

    // Validar que no existan recibos generados para el período
    const periodo_id = await Utils.getPeriodoId(queryRunner, new Date(), anio, mes, usuario, ip);
    const getRecibosGenerados = await recibosController.getRecibosGenerados(queryRunner, periodo_id);

    if (getRecibosGenerados[0].ind_recibos_generados == 1)
      throw new ClientException(`No se puede modificar el Importe, debido a que el periodo ${mes}/${anio} cuenta con los recibos generados.`);

    // Validar que la combinación TipoAsociado + CategoriaPersonal exista
    const catValid = await queryRunner.query(`
            SELECT 1 AS ok FROM CategoriaPersonal
            WHERE TipoAsociadoId = @0 AND CategoriaPersonalId = @1`,
      [ValorLiquidacionTipoAsociadoId, ValorLiquidacionCategoriaPersonalId]
    );
    if (!catValid.length)
      throw new ClientException("La categoría seleccionada no corresponde al tipo de asociado");

    const newValorLiquidacionDesde = new Date(anio, mes - 1, 1);

    const registrosExistentes = await queryRunner.query(`
      SELECT vl.ValorLiquidacionId AS id, vl.ValorLiquidacionId, vl.ValorLiquidacionSucursalId, vl.ValorLiquidacionTipoAsociadoId,
             vl.ValorLiquidacionCategoriaPersonalId, vl.ValorLiquidacionHoraNormal,
             vl.ValorLiquidacionDesde, isnull(vl.ValorLiquidacionHasta, '9999-12-31') AS ValorLiquidacionHasta
      FROM ValorLiquidacion vl
      WHERE vl.ValorLiquidacionSucursalId = @0 
        AND vl.ValorLiquidacionTipoAsociadoId = @1 
        AND vl.ValorLiquidacionCategoriaPersonalId = @2
      ORDER BY vl.ValorLiquidacionDesde ASC
    `, [ValorLiquidacionSucursalId, ValorLiquidacionTipoAsociadoId, ValorLiquidacionCategoriaPersonalId]);

    if (registrosExistentes.length === 0) {
      // No existe ningún registro previo
      const result = await queryRunner.query(`
        INSERT INTO ValorLiquidacion (ValorLiquidacionSucursalId, ValorLiquidacionTipoAsociadoId, ValorLiquidacionCategoriaPersonalId, ValorLiquidacionHoraNormal, ValorLiquidacionDesde,
          AudFechaIng, AudFechaMod, AudIpIng, AudIpMod, AudUsuarioIng, AudUsuarioMod)
        VALUES (@0, @1, @2, @3, DATEFROMPARTS(@4, @5, 1), @6, @6, @7, @7, @8, @8);
        SELECT SCOPE_IDENTITY() AS id`,
        [ValorLiquidacionSucursalId, ValorLiquidacionTipoAsociadoId, ValorLiquidacionCategoriaPersonalId, ValorLiquidacionHoraNormal, anio, mes, fechaActual, ip, usuario]
      );
      dataResultado = { action: 'I', id: result[0].id };
      message = "Registro creado exitosamente";
    } else {
      // Existen registros
      // Se Evalua si existe uno con Desde igual a newDesde (UPDATE)
      const registroMismoMes = registrosExistentes.find((r: any) => {
        const d = new Date(r.ValorLiquidacionDesde);
        return d.getFullYear() === anio && d.getMonth() === (mes - 1);
      });

      if (registroMismoMes) {
        // Existe uno pero con Desde igual a newDesde (UPDATE)
        await queryRunner.query(`
          UPDATE ValorLiquidacion
          SET ValorLiquidacionHoraNormal = @0,
              AudFechaMod = @1,
              AudIpMod = @2,
              AudUsuarioMod = @3
          WHERE ValorLiquidacionId = @4`,
          [ValorLiquidacionHoraNormal, fechaActual, ip, usuario, registroMismoMes.ValorLiquidacionId]
        );
        dataResultado = { action: 'U', id: registroMismoMes.ValorLiquidacionId };
        message = "Actualización exitosa";
      } else {
        // Verificamos dónde cae en la línea de tiempo
        const futuros = registrosExistentes.filter((r: any) => new Date(r.ValorLiquidacionDesde) > newValorLiquidacionDesde);
        const pasados = registrosExistentes.filter((r: any) => new Date(r.ValorLiquidacionDesde) < newValorLiquidacionDesde);

        if (pasados.length > 0 && futuros.length === 0) {
          // Existen registros hacia el pasado solo
          const ultimoRegistro = pasados[pasados.length - 1]; // El más reciente del pasado
          const newHastaAnterior = new Date(anio, mes - 1, 0); // Último día del mes anterior

          // Update del registro anterior para cerrarlo
          await queryRunner.query(`
            UPDATE ValorLiquidacion
            SET ValorLiquidacionHasta = @0,
                AudFechaMod = @1, AudIpMod = @2, AudUsuarioMod = @3
            WHERE ValorLiquidacionId = @4`,
            [newHastaAnterior, fechaActual, ip, usuario, ultimoRegistro.ValorLiquidacionId]
          );

          // Insert del nuevo
          const result = await queryRunner.query(`
            INSERT INTO ValorLiquidacion (ValorLiquidacionSucursalId, ValorLiquidacionTipoAsociadoId, ValorLiquidacionCategoriaPersonalId, ValorLiquidacionHoraNormal, ValorLiquidacionDesde,
              AudFechaIng, AudFechaMod, AudIpIng, AudIpMod, AudUsuarioIng, AudUsuarioMod)
            VALUES (@0, @1, @2, @3, DATEFROMPARTS(@4, @5, 1), @6, @6, @7, @7, @8, @8);
            SELECT SCOPE_IDENTITY() AS id`,
            [ValorLiquidacionSucursalId, ValorLiquidacionTipoAsociadoId, ValorLiquidacionCategoriaPersonalId, ValorLiquidacionHoraNormal, anio, mes, fechaActual, ip, usuario]
          );
          dataResultado = { action: 'I', id: result[0].id };
          message = "Registro insertado exitosamente";
        } else if (futuros.length > 0 && pasados.length === 0) {
          // Existen registros hacia el futuro solo
          const primerRegistro = futuros[0]; // El más antiguo del futuro
          const refDesde = new Date(primerRegistro.ValorLiquidacionDesde);
          const newHasta = new Date(refDesde.getFullYear(), refDesde.getMonth(), 0); // Último día del mes anterior al siguiente

          const result = await queryRunner.query(`
            INSERT INTO ValorLiquidacion (ValorLiquidacionSucursalId, ValorLiquidacionTipoAsociadoId, ValorLiquidacionCategoriaPersonalId, ValorLiquidacionHoraNormal, ValorLiquidacionDesde, ValorLiquidacionHasta,
              AudFechaIng, AudFechaMod, AudIpIng, AudIpMod, AudUsuarioIng, AudUsuarioMod)
            VALUES (@0, @1, @2, @3, DATEFROMPARTS(@4, @5, 1), @9, @6, @6, @7, @7, @8, @8);
            SELECT SCOPE_IDENTITY() AS id`,
            [ValorLiquidacionSucursalId, ValorLiquidacionTipoAsociadoId, ValorLiquidacionCategoriaPersonalId, ValorLiquidacionHoraNormal, anio, mes, fechaActual, ip, usuario, newHasta]
          );
          dataResultado = { action: 'I', id: result[0].id };
          message = "Registro insertado exitosamente";
        } else {
          // Hay registros antes y después
          const registroAnterior = pasados[pasados.length - 1];
          const registroSiguiente = futuros[0];

          const newHastaAnterior = new Date(anio, mes - 1, 0); // Cerrar el anterior
          const refDesdeSig = new Date(registroSiguiente.ValorLiquidacionDesde);
          const newHastaNuevo = new Date(refDesdeSig.getFullYear(), refDesdeSig.getMonth(), 0); // Cerrar el nuevo

          // Cerrar el anterior
          await queryRunner.query(`
            UPDATE ValorLiquidacion
            SET ValorLiquidacionHasta = @0,
                AudFechaMod = @1, AudIpMod = @2, AudUsuarioMod = @3
            WHERE ValorLiquidacionId = @4`,
            [newHastaAnterior, fechaActual, ip, usuario, registroAnterior.ValorLiquidacionId]
          );

          // Insert del nuevo
          const result = await queryRunner.query(`
            INSERT INTO ValorLiquidacion (ValorLiquidacionSucursalId, ValorLiquidacionTipoAsociadoId, ValorLiquidacionCategoriaPersonalId, ValorLiquidacionHoraNormal, ValorLiquidacionDesde, ValorLiquidacionHasta,
              AudFechaIng, AudFechaMod, AudIpIng, AudIpMod, AudUsuarioIng, AudUsuarioMod)
            VALUES (@0, @1, @2, @3, DATEFROMPARTS(@4, @5, 1), @9, @6, @6, @7, @7, @8, @8);
            SELECT SCOPE_IDENTITY() AS id`,
            [ValorLiquidacionSucursalId, ValorLiquidacionTipoAsociadoId, ValorLiquidacionCategoriaPersonalId, ValorLiquidacionHoraNormal, anio, mes, fechaActual, ip, usuario, newHastaNuevo]
          );
          dataResultado = { action: 'I', id: result[0].id };
          message = "Registro insertado exitosamente";
        }
      }
    }

    return { dataResultado, message };
  }
}
