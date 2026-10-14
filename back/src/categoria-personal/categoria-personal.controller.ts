import { BaseController, ClientException, ClientWarning } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import type { NextFunction, Request, Response } from "express";
import { filtrosToSql, getOptionsFromRequest, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros.ts";
import type { Options } from "../schemas/filtro.ts";

const getOptions: any[] = [
    { label: 'No', value: '1' },
    { label: 'Si', value: '0' },
]

const listaColumnas: any[] = [
  {
    id: 'id',
    name: 'id',
    field: 'id',
    type: 'number',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: 'TipoAsociadoId',
    name: 'Tipo Asociado',
    field: 'TipoAsociadoId',
    type: 'string',
    formatter: 'collectionFormatter',
    fieldName: 'ta.TipoAsociadoId',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  // {
  //   id: 'TipoAsociadoDescripcion',
  //   name: 'Tipo Asociado',
  //   field: 'TipoAsociadoDescripcion',
  //   type: 'string',
  //   fieldName: 'ta.TipoAsociadoDescripcion',
  //   searchType: 'string',
  //   sortable: true,
  //   hidden: false,
  //   searchHidden: false,
  // },
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
    name: 'Activo',
    field: 'CategoriaPersonalInactivo',
    type: 'string',
    fieldName: 'ISNULL(cp.CategoriaPersonalInactivo, 0)',
    formatter: 'collectionFormatter',
    params: { collection: getOptions },
    searchComponent: "inputForInactivo",
    searchType: "number",
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
];

export class CategoriaPersonalController extends BaseController {

  async getGridCols(req, res) {
    this.jsonRes(listaColumnas, res);
  }

  async getOptions(req, res) {
    this.jsonRes(getOptions, res);
  }

  async list(req: any, res: Response, next: NextFunction) {
    const filterSql = filtrosToSql(req.body.options.filtros, listaColumnas);
    const orderBy = orderToSQL(req.body.options.sort)
    const queryRunner = await getConnection(res.locals.userName);

    try {
      const tipoAsociados = await queryRunner.query(
          `SELECT CONCAT(ta.TipoAsociadoId,'-',cp.CategoriaPersonalId) AS id, 
          TRIM(ta.TipoAsociadoDescripcion) AS TipoAsociadoDescripcion,
          cp.CategoriaPersonalId, TRIM(cp.CategoriaPersonalDescripcion) AS CategoriaPersonalDescripcion, ta.TipoAsociadoId,
          CONVERT(VARCHAR(1), ISNULL(cp.CategoriaPersonalInactivo, 0)) AS CategoriaPersonalInactivo
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

      if (this.esVacio(form.TipoAsociadoId)) {
        error.push('- Tipo Asociado');
      }
      if (this.esVacio(form.CategoriaPersonalDescripcion)) {
        error.push('- Descripcion');
      }
      if (this.esVacio(form.CategoriaPersonalInactivo)) {
        error.push('- Activo');
      }
  
      if (error.length) {
        error.unshift('Deben completar los siguientes campos:');
        throw new ClientWarning(error);
      }
  
      // Validar que no haya duplicados
      if (action == 'I') {
        const existing = await queryRunner.query(`
          SELECT CategoriaPersonalId AS id 
          FROM CategoriaPersonal 
          WHERE TipoAsociadoId = @0 AND CategoriaPersonalDescripcion = @1
        `, [form.TipoAsociadoId, form.CategoriaPersonalDescripcion]);
  
        if (existing.length) {
          throw new ClientException('Ya existe una categoría personal con esa descripción para el tipo de asociado seleccionado');
        }
        
      }
  
      if (action == 'U') {
        // Validar que no haya duplicados
        const existing = await queryRunner.query(`
          SELECT CategoriaPersonalId AS id 
          FROM CategoriaPersonal 
          WHERE TipoAsociadoId = @0 AND CategoriaPersonalId != @1 AND CategoriaPersonalDescripcion = @2
        `, [form.TipoAsociadoId, form.CategoriaPersonalId, form.CategoriaPersonalDescripcion]);
  
        if (existing.length) {
          throw new ClientException('Ya existe una categoría personal con esa descripción');
        }
  
      }
    }

  async onchangecell(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);
    try {
      await queryRunner.startTransaction();

      const row = req.body;
      const [TipoAsociadoId, CategoriaPersonalId] = row.id.split('-').map(Number)
      // 
      const CategoriaPersonalDescripcion:string = row.CategoriaPersonalDescripcion;
      const CategoriaPersonalInactivo:string = row.CategoriaPersonalInactivo;

      // Si no tiene ID, es un nuevo registro
      if (!TipoAsociadoId && !CategoriaPersonalId) {
        // Validar antes de insertar
        await this.validateForm(row, 'I', queryRunner);

        const update = await queryRunner.query(
          `UPDATE TipoAsociado
          SET CategoriaPersonalUltNro = ISNULL(CategoriaPersonalUltNro, 0) + 1
          OUTPUT INSERTED.CategoriaPersonalUltNro
          WHERE TipoAsociadoId = @0`, 
          [ row.TipoAsociadoId ]
        );
        const newId = update[0]?.CategoriaPersonalUltNro ?? null;
        
        await queryRunner.query(
          `INSERT INTO CategoriaPersonal (
            TipoAsociadoId,
            CategoriaPersonalId,
            CategoriaPersonalDescripcion,
            CategoriaPersonalConPreocupacional,
            CategoriaPersonalInactivo
          ) VALUES (@0, @1, @2, @3, @4)`, 
          [ row.TipoAsociadoId,
            newId, //CategoriaPersonalId
            CategoriaPersonalDescripcion,
            'N', // CategoriaPersonalConPreocupacional
            CategoriaPersonalInactivo ]
        );

        await queryRunner.commitTransaction();
        this.jsonRes({ CategoriaPersonalId: newId }, res);
      } else {
        // Es una actualización
        await this.validateForm(row, 'U', queryRunner);

        await queryRunner.query(`
          UPDATE CategoriaPersonal SET
            CategoriaPersonalDescripcion = @2,
            CategoriaPersonalInactivo = @3
          WHERE CategoriaPersonalId = @0 AND TipoAsociadoId = @1
        `, [
          CategoriaPersonalId,
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

    const TipoAsociadoId = Number(req.params.TipoAsociadoId);
    const CategoriaPersonalId = Number(req.params.CategoriaPersonalId);

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