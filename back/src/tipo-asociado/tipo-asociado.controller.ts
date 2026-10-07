import { BaseController, ClientException, ClientWarning } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import type { NextFunction, Request, Response } from "express";
import { filtrosToSql, getOptionsFromRequest, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros.ts";
import type { Options } from "../schemas/filtro.ts";

const listaColumnas: any[] = [
  {
    id: 'id',
    name: 'id',
    field: 'id',
    type: 'number',
    fieldName: 'TipoAsociadoId',
    searchType: 'number',
    sortable: true,
    hidden: true,
    searchHidden: true
  },
  {
    id: 'TipoAsociadoDescripcion',
    name: 'Descripcion',
    field: 'TipoAsociadoDescripcion',
    type: 'string',
    fieldName: 'TipoAsociadoDescripcion',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'Categorias',
    name: 'Categorías',
    field: 'Categorias',
    fieldName: 'Categorias',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
];

export class TipoAsociadoController extends BaseController {

  async getGridCols(req, res) {
    this.jsonRes(listaColumnas, res);
  }

  async list(req: any, res: Response, next: NextFunction) {
    const filterSql = filtrosToSql(req.body.options.filtros, listaColumnas);
    // const orderBy = orderToSQL(req.body.options.sort)
    const queryRunner = await getConnection(res.locals.userName);

    try {
      const tipoAsociados = await queryRunner.query(
          `SELECT tp.TipoAsociadoId AS id, TRIM(tp.TipoAsociadoDescripcion) AS TipoAsociadoDescripcion, TRIM(tp.TipoAsociadoAsigna) AS TipoAsociadoAsigna, TRIM(tp.TipoAsociadoTieneAsistencia) AS TipoAsociadoTieneAsistencia,
          STRING_AGG(TRIM(cp.CategoriaPersonalDescripcion), ', ') AS Categorias
          FROM TipoAsociado tp
          LEFT JOIN CategoriaPersonal cp ON tp.TipoAsociadoId = cp.TipoAsociadoId
          WHERE ${filterSql}
          GROUP BY
            tp.TipoAsociadoId,
            tp.TipoAsociadoDescripcion,
            tp.TipoAsociadoAsigna,
            tp.TipoAsociadoTieneAsistencia;`)

      this.jsonRes(
        {
          total: tipoAsociados.length,
          list: tipoAsociados,
        },
        res
      );

    } catch (error) {
        return next(error)
    } finally {
        await queryRunner.release();
    }
  }

  // Un 0 es un valor válido, por eso no se evalúa por truthy
  esVacio(valor: any):boolean { return (valor === null || valor === undefined || valor === '') }

  async validateForm(form: any, action: string, queryRunner: any) {
      let error: string[] = [];

      if (this.esVacio(form.TipoAsociadoDescripcion)) {
        error.push('- Descripcion');
      }
      // if (this.esVacio(form.TipoAsociadoAsigna)) {
      //   error.push('- Asigna');
      // }
      // if (this.esVacio(form.TipoAsociadoTieneAsistencia)) {
      //   error.push('- Tiene Asistencia');
      // }
  
      if (error.length) {
        error.unshift('Deben completar los siguientes campos:');
        throw new ClientWarning(error);
      }
  
      // Validar la cantidad de caracteres
      // if (form.TipoAsociadoAsigna.length !== 1) {
      //   throw new ClientException('El Asigna debe tener un caracter');
      // }
      // if (form.TipoAsociadoTieneAsistencia.length !== 1) {
      //   throw new ClientException('El Tiene Asistencia debe tener un caracter');
      // }
  
      // Validar que no haya duplicados
      if (action == 'I') {
        const existing = await queryRunner.query(`
          SELECT TipoAsociadoId AS id 
          FROM TipoAsociado 
          WHERE TipoAsociadoDescripcion = @0
        `, [form.TipoAsociadoDescripcion]);
  
        if (existing.length) {
          throw new ClientException('Ya existe un tipo asociado con esa descripción');
        }
        
      }
  
      if (action == 'U') {
        // Validar que no haya duplicados
        const existing = await queryRunner.query(`
          SELECT TipoAsociadoId AS id 
          FROM TipoAsociado 
          WHERE TipoAsociadoId = @0 AND TipoAsociadoDescripcion = @1
        `, [form.TipoAsociadoId, form.TipoAsociadoDescripcion]);
  
        if (existing.length) {
          throw new ClientException('Ya existe un tipo asociado con esa descripción');
        }
  
      }
    }

  async onchangecell(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);
    try {
      await queryRunner.startTransaction();

      const row = req.body;
      const TipoAsociadoDescripcion:string = row.TipoAsociadoDescripcion;
      const TipoAsociadoAsigna:string = row.TipoAsociadoAsigna;
      const TipoAsociadoTieneAsistencia:string = row.TipoAsociadoTieneAsistencia;

      // Si no tiene ID, es un nuevo registro
      if (!row.TipoAsociadoId) {
        // Validar antes de insertar
        await this.validateForm(row, 'I', queryRunner);

        const inserted = await queryRunner.query(
          `INSERT INTO TipoAsociado (
            TipoAsociadoDescripcion,
            TipoAsociadoAsigna,
            CategoriaPersonalUltNro,
            TipoAsociadoTieneAsistencia
          )
          OUTPUT INSERTED.TipoAsociadoId
          VALUES (@0, @1, @2, @3)`, 
          [ TipoAsociadoDescripcion,
            TipoAsociadoAsigna,
            null, // CategoriaPersonalUltNro
            TipoAsociadoTieneAsistencia ]
        );

        const newId: number = inserted[0]?.TipoAsociadoId ?? null;

        await queryRunner.commitTransaction();
        this.jsonRes({ TipoAsociadoId: newId }, res);
      } else {
        // Es una actualización
        await this.validateForm(row, 'U', queryRunner);

        // En actualización no se toca el período, solo los importes
        await queryRunner.query(`
          UPDATE TipoAsociado SET
            TipoAsociadoDescripcion = @1,
            TipoAsociadoAsigna = @2,
            TipoAsociadoTieneAsistencia = @3
          WHERE TipoAsociadoId = @0
        `, [
          row.TipoAsociadoId,
          TipoAsociadoDescripcion,
          TipoAsociadoAsigna,
          TipoAsociadoTieneAsistencia
        ]);

        await queryRunner.commitTransaction();
        this.jsonRes({}, res);
      }
    } catch (error) {
      await this.rollbackTransaction(queryRunner);
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async delete(req: any, res: Response, next: NextFunction) {

    const TipoAsociadoId = req.params.TipoAsociadoId;

    if (!TipoAsociadoId) {
      throw new ClientException('El ID del registro es requerido');
    }

    //throw new ClientException('test');
    const queryRunner = await getConnection(res.locals.userName);
    try {
      await queryRunner.startTransaction();

      const categorias = await queryRunner.query(`SELECT CategoriaPersonalId FROM CategoriaPersonal WHERE TipoAsociadoId = @0`, [TipoAsociadoId]);
      if (categorias.length > 0) {
        throw new ClientException('No se puede eliminar el tipo de asociado porque tiene categorías asociadas');
      }

      await queryRunner.query(`DELETE FROM TipoAsociado WHERE TipoAsociadoId = @0`, [TipoAsociadoId]);
      await queryRunner.commitTransaction();
      this.jsonRes({}, res, 'Registro eliminado exitoso');
    } catch (error) {
      await this.rollbackTransaction(queryRunner);
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }
}