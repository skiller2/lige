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
    searchType: 'number',
    sortable: true,
    hidden: true,
    searchHidden: true
  },
  {
    id: 'TipoAsociadoId',
    name: 'Tipo Asociado Id',
    field: 'TipoAsociadoId',
    type: 'number',
    fieldName: 'ta.TipoAsociadoId',
    searchType: 'number',
    sortable: true,
    hidden: true,
    searchHidden: true
  },
  {
    id: 'TipoAsociadoDescripcion',
    name: 'Tipo Asociado',
    field: 'TipoAsociadoDescripcion',
    type: 'string',
    fieldName: 'ta.TipoAsociadoDescripcion',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'CategoriaPersonalDescripcion',
    name: 'Descripcion',
    field: 'CategoriaPersonalDescripcion',
    type: 'string',
    fieldName: 'cp.CategoriaPersonalDescripcion',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: 'CategoriaPersonalInactivo',
    name: 'Inactivo',
    field: 'CategoriaPersonalInactivo',
    type: 'boolean',
    fieldName: 'cp.CategoriaPersonalInactivo',
    searchType: 'boolean',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
];

export class CategoriaPersonalController extends BaseController {

  async getGridCols(req, res) {
    this.jsonRes(listaColumnas, res);
  }

  async list(req: any, res: Response, next: NextFunction) {
    const filterSql = filtrosToSql(req.body.options.filtros, listaColumnas);
    const orderBy = orderToSQL(req.body.options.sort)
    const queryRunner = await getConnection(res.locals.userName);

    try {
      const tipoAsociados = await queryRunner.query(
          `SELECT CONCAT(ta.TipoAsociadoId,'-',cp.CategoriaPersonalId) AS id, TRIM(ta.TipoAsociadoDescripcion) AS TipoAsociadoDescripcion,
          cp.CategoriaPersonalId, TRIM(cp.CategoriaPersonalDescripcion) AS CategoriaPersonalDescripcion, cp.CategoriaPersonalInactivo
          FROM CategoriaPersonal cp
          LEFT JOIN TipoAsociado ta ON ta.TipoAsociadoId = cp.TipoAsociadoId
          WHERE ${filterSql}
          ${orderBy}`)

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
      const TipoAsociadoId:number = row.TipoAsociadoId;
      const CategoriaPersonalDescripcion:string = row.CategoriaPersonalDescripcion;
      const CategoriaPersonalInactivo:string = row.CategoriaPersonalInactivo;

      // Si no tiene ID, es un nuevo registro
      if (!TipoAsociadoId && !row.CategoriaPersonalId) {
        // Validar antes de insertar
        // await this.validateForm(row, 'I', queryRunner);

        const inserted = await queryRunner.query(
          `INSERT INTO CategoriaPersonal (
            TipoAsociadoId,
            CategoriaPersonalDescripcion,
            CategoriaPersonalConPreocupacional,
            CategoriaPersonalInactivo
          )
          OUTPUT INSERTED.CategoriaPersonalId
          VALUES (@0, @1, @2, @3, @4, @5)`, 
          [ TipoAsociadoId,
            CategoriaPersonalDescripcion,
            'N', // CategoriaPersonalConPreocupacional
            CategoriaPersonalInactivo ]
        );

        const newId: number = inserted[0]?.CategoriaPersonalId ?? null;

        await queryRunner.query(
          `UPDATE TipoAsociado SET
            CategoriaPersonalUltNro = @1
          WHERE TipoAsociadoId = @0`, 
          [ TipoAsociadoId, newId ]
        );

        await queryRunner.commitTransaction();
        this.jsonRes({ TipoAsociadoId: newId }, res);
      } else {
        // Es una actualización
        // await this.validateForm(row, 'U', queryRunner);

        await queryRunner.query(`
          UPDATE CategoriaPersonal SET
            CategoriaPersonalDescripcion = @2,
            CategoriaPersonalInactivo = @3
          WHERE CategoriaPersonalId = @0 AND TipoAsociadoId = @1
        `, [
          row.CategoriaPersonalId,
          TipoAsociadoId,
          CategoriaPersonalDescripcion,
          CategoriaPersonalInactivo
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
    const CategoriaPersonalId = req.params.CategoriaPersonalId;

    if (!TipoAsociadoId && !CategoriaPersonalId) {
      throw new ClientException('El ID del registro es requerido');
    }

    //throw new ClientException('test');
    const queryRunner = await getConnection(res.locals.userName);
    try {
      await queryRunner.startTransaction();

      const asistencia = await queryRunner.query(`SELECT CategoriaPersonalAsistenciaId FROM CategoriaPersonalAsistencia WHERE TipoAsociadoId = @0 AND CategoriaPersonalId = @1`, [TipoAsociadoId, CategoriaPersonalId]);
      if (asistencia.length > 0) {
        throw new ClientException('No se puede eliminar la categoria porque tiene asistencias asociadas');
      }

      await queryRunner.query(`DELETE FROM CategoriaPersonal WHERE TipoAsociadoId = @0 AND CategoriaPersonalId = @1`, [TipoAsociadoId, CategoriaPersonalId]);
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