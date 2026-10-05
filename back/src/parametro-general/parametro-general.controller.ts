import { BaseController, ClientException } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros.ts";
import type { Options } from "../schemas/filtro.ts";
import type { NextFunction, Request, Response } from "express";

// Columnas de la grilla de parámetros generales
const columnasGrillaParametrosGenerales: any[] = [
  {
    id: "id",
    name: "id",
    field: "id",
    fieldName: "par.ParametroGeneralCodigo",
    type: "string",
    sortable: false,
    hidden: true,
    searchHidden: true
  },
  {
    id: "ParametroGeneralCodigo",
    name: "Código",
    field: "ParametroGeneralCodigo",
    fieldName: "par.ParametroGeneralCodigo",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: false,
    maxWidth: 110
  },
  {
    id: "Parametros",
    name: "Parámetros",
    field: "Parametros",
    fieldName: "par.Parametros",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
];

export class ParametroGeneralController extends BaseController {

  async getGridColsParametrosGenerales(req: Request, res: Response) {
    this.jsonRes(columnasGrillaParametrosGenerales, res);
  }

  async getListParametrosGenerales(req: Request, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null };
      const filterSql = filtrosToSql(options.filtros, columnasGrillaParametrosGenerales);
      const orderBy = orderToSQL(options.sort);

      const lista = await queryRunner.query(`
        SELECT
          par.ParametroGeneralCodigo AS id,
          par.ParametroGeneralCodigo,
          par.Parametros
        FROM ParametroGeneral par
        WHERE (1=1)
        AND (${filterSql})
        ${orderBy ? orderBy : 'ORDER BY par.ParametroGeneralCodigo'}
      `);

      this.jsonRes({ total: lista.length, list: lista }, res);
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async getParametroGeneral(req: Request, res: Response, next: NextFunction) {
    const ParametroGeneralCodigo = String(req.params.ParametroGeneralCodigo ?? '').trim().toUpperCase();
    const queryRunner = await getConnection(res.locals.userName);

    try {
      const parametroDs = await queryRunner.query(`
        SELECT par.ParametroGeneralCodigo, par.Parametros
        FROM ParametroGeneral par
        WHERE par.ParametroGeneralCodigo = @0
      `, [ParametroGeneralCodigo]);

      if (parametroDs.length == 0)
        throw new ClientException(`Parámetro general ${ParametroGeneralCodigo} no encontrado`)

      this.jsonRes(parametroDs[0], res);
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  // Alta o modificación. El código es la clave: en el alta lo carga el usuario y no puede existir;
  // en la modificación tiene que existir.
  async setParametroGeneral(req: Request, res: Response, next: NextFunction) {
    const Alta = req.body.Alta === true;
    const ParametroGeneralCodigo = String(req.body.ParametroGeneralCodigo ?? '').trim().toUpperCase();
    const Parametros = String(req.body.Parametros ?? '');
    const queryRunner = await getConnection(res.locals.userName);

    try {
      const usuario = res.locals.userName;
      const ip = this.getRemoteAddress(req);
      const ahora = new Date();

      const fieldErrors: any[] = [];
      if (!ParametroGeneralCodigo)
        fieldErrors.push({ fieldTree: `ParametroGeneralCodigo`, kind: 'server', message: 'El código es obligatorio' })
      else if (ParametroGeneralCodigo.length > 5)
        fieldErrors.push({ fieldTree: `ParametroGeneralCodigo`, kind: 'server', message: 'El código no puede tener más de 5 caracteres' })

      if (!Parametros.trim())
        fieldErrors.push({ fieldTree: `Parametros`, kind: 'server', message: 'Los parámetros no pueden estar vacíos' })
      else if (Parametros.trim().startsWith('{') || Parametros.trim().startsWith('[')) {
        // Si tiene forma de JSON, tiene que ser un JSON válido
        try {
          JSON.parse(Parametros)
        } catch (error) {
          fieldErrors.push({ fieldTree: `Parametros`, kind: 'server', message: `JSON inválido: ${error instanceof Error ? error.message : String(error)}` })
        }
      }

      if (fieldErrors.length > 0)
        throw new ClientException(`Debe corregir los campos indicados.`, { fieldErrors })

      await queryRunner.startTransaction();

      const existe = await queryRunner.query(
        `SELECT ParametroGeneralCodigo FROM ParametroGeneral WITH (UPDLOCK, HOLDLOCK) WHERE ParametroGeneralCodigo = @0`,
        [ParametroGeneralCodigo]);

      if (Alta) {
        if (existe.length > 0)
          throw new ClientException(`El parámetro general ${ParametroGeneralCodigo} ya existe`, {
            fieldErrors: [{ fieldTree: `ParametroGeneralCodigo`, kind: 'server', message: `El código ${ParametroGeneralCodigo} ya existe` }]
          })

        await queryRunner.query(`
          INSERT INTO ParametroGeneral (
            ParametroGeneralCodigo, Parametros,
            AudFechaIng, AudFechaMod, AudUsuarioIng, AudUsuarioMod, AudIpIng, AudIpMod
          ) VALUES (@0, @1, @2, @2, @3, @3, @4, @4)
        `, [ParametroGeneralCodigo, Parametros, ahora, usuario, ip]);
      } else {
        if (existe.length == 0)
          throw new ClientException(`Parámetro general ${ParametroGeneralCodigo} no encontrado`)

        await queryRunner.query(`
          UPDATE ParametroGeneral SET Parametros = @1,
          AudFechaMod = @2, AudUsuarioMod = @3, AudIpMod = @4
          WHERE ParametroGeneralCodigo = @0
        `, [ParametroGeneralCodigo, Parametros, ahora, usuario, ip]);
      }

      await queryRunner.commitTransaction();

      return this.jsonRes({ ParametroGeneralCodigo }, res,
        `Parámetro general ${ParametroGeneralCodigo} ${Alta ? 'generado' : 'actualizado'}`);

    } catch (error) {
      await this.rollbackTransaction(queryRunner);
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async deleteParametroGeneral(req: Request, res: Response, next: NextFunction) {
    const ParametroGeneralCodigo = String(req.body?.ParametroGeneralCodigo ?? '').trim().toUpperCase();
    const queryRunner = await getConnection(res.locals.userName);

    try {
      if (!ParametroGeneralCodigo)
        throw new ClientException('No hay parámetro general seleccionado');

      await queryRunner.startTransaction();

      const existe = await queryRunner.query(
        `SELECT ParametroGeneralCodigo FROM ParametroGeneral WHERE ParametroGeneralCodigo = @0`,
        [ParametroGeneralCodigo]);

      if (existe.length == 0)
        throw new ClientException(`Parámetro general ${ParametroGeneralCodigo} no encontrado`)

      await queryRunner.query(`DELETE FROM ParametroGeneral WHERE ParametroGeneralCodigo = @0`, [ParametroGeneralCodigo]);

      await queryRunner.commitTransaction();

      return this.jsonRes({ ParametroGeneralCodigo }, res, `Parámetro general ${ParametroGeneralCodigo} eliminado`);

    } catch (error) {
      await this.rollbackTransaction(queryRunner);
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }
}
