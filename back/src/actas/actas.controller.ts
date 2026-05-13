import { BaseController, ClientException, ClientWarning } from "../controller/base.controller.ts";
import { dataSource } from "../data-source.ts";
import type { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL, } from "../impuestos-afip/filtros-utils/filtros.ts";
import type { Options } from "../schemas/filtro.ts";


const columnsActas: any[] = [
  {
    id: 'id', name: 'id', field: 'id',
    type: 'number',
    searchType: 'number',
    sortable: true,
    hidden: true,
    searchHidden: true
  },
  {
    id: 'ActaId', name: 'ActaId', field: 'ActaId',
    fieldName: 'ActaId',
    type: 'number',
    searchType: 'number',
    sortable: true,
    hidden: true,
    searchHidden: true
  },
  {
    id: 'ActaNroActa', name: 'Número Acta', field: 'ActaNroActa',
    fieldName: 'ActaNroActa',
    type: 'number',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: false,
    maxWidth: 120,
    minWidth: 80
  },
  {
    id: 'ActaDescripcion', name: 'Descripción', field: 'ActaDescripcion',
    fieldName: 'ActaDescripcion',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    id: 'ActaFechaActa', name: 'Fecha Acta', field: 'ActaFechaActa',
    fieldName: 'ActaFechaActa',
    type: 'date',
    searchType: 'date',
    sortable: true,
    hidden: false,
    searchHidden: false,
    searchComponent: "inputForFechaSearch",

  },
]

const columnsActasPersonal: any[] = [
  {
    id: 'id', name: 'id', field: 'id',
    type: 'number',
    searchType: 'number',
    sortable: true,
    hidden: true,
    searchHidden: true
  },
  {
    id: "PersonalId",
    name: "PersonalId",
    field: "per.PersonalId",
    type: "number",
    fieldName: "per.PersonalId",
    sortable: true,
    searchHidden: true,
    hidden: true,
  },
  {
    id: "ApellidoNombre",
    name: "Apellido Nombre",
    field: "ApellidoNombre",
    type: "string",
    fieldName: "per.PersonalId",
    searchComponent: "inputForPersonalSearch",
    searchType: "number",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: "PersonalCUITCUILCUIT",
    name: "CUIT",
    field: "PersonalCUITCUILCUIT",
    type: "string",
    fieldName: "cuit.PersonalCUITCUILCUIT",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: 'ActaId', name: 'ActaId', field: 'ActaId',
    fieldName: 'a.ActaId',
    type: 'number',
    searchType: 'number',
    sortable: true,
    hidden: true,
    searchHidden: true
  },
  {
    id: 'ActaNroActa', name: 'Número Acta', field: 'ActaNroActa',
    fieldName: 'a.ActaNroActa',
    type: 'number',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: false,
    maxWidth: 120,
    minWidth: 80,
  },
  {
    id: "PersonalActaDescripcion",
    name: "Descripción",
    field: "PersonalActaDescripcion",
    type: "string",
    fieldName: "pa.PersonalActaDescripcion",
    sortable: true,
    searchType: "string",
    hidden: false,
    searchHidden: false

  },
  {
    id: 'TipoPersonalActaCodigo', name: 'Tipo Acta', field: 'TipoPersonalActaCodigo',
    fieldName: 'pa.TipoPersonalActaCodigo',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: true,
    searchHidden: false
  },
  {
    id: 'TipoPersonalActaDescripcion', name: 'Tipo Acta', field: 'TipoPersonalActaDescripcion',
    fieldName: 'pa.TipoPersonalActaDescripcion',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: true,
    maxWidth: 120,
    minWidth: 80,
  },
  {
    id: 'ActaFechaActa', name: 'Fecha Acta', field: 'ActaFechaActa',
    fieldName: 'a.ActaFechaActa',
    type: 'date',
    searchType: 'date',
    sortable: true,
    hidden: false,
    searchHidden: false,
    searchComponent: "inputForFechaSearch",
    maxWidth: 120,
  },
]
export class ActasController extends BaseController {

  async getActasGridColumns(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(columnsActas, res)
  }

  async getActasPersonalGridColumns(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(columnsActasPersonal, res)
  }

  private async actasListQuery(queryRunner: any, filterSql: any, orderBy: any) {
    return await queryRunner.query(`
      SELECT 
      ROW_NUMBER() OVER (ORDER BY ActaId) AS id,
      ActaId, ActaNroActa, ActaFechaActa, ActaDescripcion
      FROM Acta
      WHERE (1=1) 
      AND (${filterSql})
      ${orderBy}
    `)
  }

  async getGridList(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction()

      const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null };
      const filterSql = filtrosToSql(options.filtros, columnsActas);
      const orderBy = orderToSQL(options.sort)

      const lista: any[] = await this.actasListQuery(queryRunner, filterSql, orderBy)

      await queryRunner.commitTransaction()
      this.jsonRes(lista, res);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async addActa(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const ActaNroActa: number = req.body.ActaNroActa;
    const ActaDescripcion: string = req.body.ActaDescripcion;
    const ActaFechaActa: Date = req.body.ActaFechaActa ? new Date(req.body.ActaFechaActa) : null;
    try {
      await queryRunner.startTransaction()

      //Validaciones:
      await this.validateFormActa(req.body, 'I', queryRunner)

      await queryRunner.query(`
        INSERT INTO Acta (
          ActaNroActa,
          ActaDescripcion,
          ActaFechaActa
        ) VALUES (@0,@1,@2)
      `, [ActaNroActa, ActaDescripcion, ActaFechaActa])

      const Acta = await queryRunner.query(`
        SELECT ActaId FROM Acta
        WHERE ActaNroActa IN (@0)
      `, [ActaNroActa])
      const newId: number = Acta[0].ActaId

      await queryRunner.commitTransaction()
      this.jsonRes({ ActaId: newId }, res, 'Carga de nuevo registro exitoso');
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async updateActa(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const ActaId = req.body.ActaId;
    const ActaNroActa = req.body.ActaNroActa;
    const ActaDescripcion = req.body.ActaDescripcion;
    const ActaFechaActa: Date = req.body.ActaFechaActa ? new Date(req.body.ActaFechaActa) : null;
    try {
      await queryRunner.startTransaction()

      //Validaciones:
      await this.validateFormActa(req.body, 'U', queryRunner)

      await queryRunner.query(`
        UPDATE Acta SET
          ActaNroActa = @1,
          ActaDescripcion = @2,
          ActaFechaActa = @3
        WHERE ActaId IN (@0)
      `, [ActaId, ActaNroActa, ActaDescripcion, ActaFechaActa])
      await queryRunner.commitTransaction()
      this.jsonRes({}, res, 'Actualización de registro exitoso');
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async deleteActa(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const ActaId = req.query[0]
    try {
      await queryRunner.startTransaction()

      const personalActa = await queryRunner.query(`
        SELECT COUNT(*) AS count FROM PersonalActa WHERE ActaId = @0
      `, [ActaId])

      if (personalActa[0].count > 0)
        throw new ClientException(`No se puede eliminar el acta porque tiene ${personalActa[0].count} registro(s) asociado(s) en Personal.`)

      await queryRunner.query(`
        DELETE FROM Acta WHERE ActaId = @0
      `, [ActaId])
      await queryRunner.commitTransaction()
      this.jsonRes({}, res, 'Eliminación de registro exitoso');
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async getNrosActas(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await queryRunner.query(`
        SELECT TOP 100 ActaId value
        , CONCAT(ActaNroActa, ' - ', TRIM(ActaDescripcion)) label
        , ActaFechaActa 
        FROM Acta
        ORDER BY ActaFechaActa desc
      `)
      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

  async validateFormActa(acta: any, action: string, queryRunner: any) {
    let error: string[] = []
    if (!acta.ActaNroActa) {
      error.push(` Nro.Acta`)
    }
    if (!acta.ActaDescripcion) {
      error.push(` Descripcion`)
    }
    if (!acta.ActaFechaActa) {
      error.push(` Fecha`)
    }

    if (error.length) {
      error.unshift('Deben completar los siguientes campos:')
      throw new ClientWarning(error)
    }
    const antActa = await queryRunner.query(`
          SELECT TOP 1 ActaNroActa, ActaFechaActa  FROM Acta WHERE ActaNroActa < @0
          ORDER BY ActaNroActa DESC
        `, [acta.ActaNroActa])

    if (antActa.length && antActa[0].ActaFechaActa > new Date(acta.ActaFechaActa)) {
      throw new ClientException(`La fecha del acta no puede ser anterior a la fecha del acta Nro ${antActa[0].ActaNroActa} (${new Date(antActa[0].ActaFechaActa).toLocaleDateString()})`)
    }


    //  El NroActa no debe coincidir con los ya registrados
    if (action == 'I' && acta.ActaNroActa) {
      const oldActa = await queryRunner.query(`
          SELECT ActaId AS id FROM Acta WHERE ActaNroActa IN (@0)
        `, [acta.ActaNroActa])
      if (oldActa.length) throw new ClientException('Ya existe un Acta con ese numero')
    }
    //  El NroActa no debe coincidir con los ya registrados
    if (action == 'U' && acta.ActaNroActa) {
      const oldActa = await queryRunner.query(`
          SELECT ActaId AS id FROM Acta WHERE ActaNroActa IN (@0) AND ActaId NOT IN (@1)
        `, [acta.ActaNroActa, acta.ActaId])
      if (oldActa.length) throw new ClientException('Ya existe un Acta con ese numero')
    }

  }

  async getGridActasPersonalList(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction()

      const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null };
      const filterSql = filtrosToSql(options.filtros, columnsActasPersonal);
      const orderBy = orderToSQL(options.sort)

      const lista: any[] = await this.actasPersonalListQuery(queryRunner, filterSql, orderBy)

      await queryRunner.commitTransaction()
      this.jsonRes(lista, res);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }


  private async actasPersonalListQuery(queryRunner: any, filterSql: any, orderBy: any) {
    return await queryRunner.query(`
         select  ROW_NUMBER() OVER (ORDER BY per.PersonalId) AS id, per.PersonalId, 
        CONCAT(trim(per.PersonalApellido), ', ', TRIM(per.PersonalNombre)) ApellidoNombre, cuit.PersonalCUITCUILCUIT,
        a.ActaId,pa.PersonalActaDescripcion, a.ActaNroActa, a.ActaFechaActa,pa.TipoPersonalActaCodigo, ta.TipoPersonalActaDescripcion
      from Personal per
      join PersonalActa pa on pa.PersonalId = per.PersonalId
      LEFT JOIN TipoPersonalActa ta on ta.TipoPersonalActaCodigo= pa.TipoPersonalActaCodigo
      left join Acta a on a.ActaId = pa.ActaId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 

      WHERE (${filterSql})
      ${orderBy}
    `)
  }


}