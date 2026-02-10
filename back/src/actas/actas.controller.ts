import { BaseController, ClientException, ClientWarning } from "../controller/basecontroller.ts";
import { dataSource } from "../data-source.ts";
import type { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL, } from "../impuestos-afip/filtros-utils/filtros.ts";
import type { Options } from "../schemas/filtro.ts";

const columnsActas:any[] = [
  {
    id:'id', name:'id', field:'id',
    type:'number',
    searchType: 'number',
    sortable: true,
    hidden: true,
    searchHidden: true
  },
  {
    id:'ActaId', name:'ActaId', field:'ActaId',
    fieldName: 'ActaId',
    type:'number',
    searchType: 'number',
    sortable: true,
    hidden: true,
    searchHidden: true
  },
  {
    id:'ActaNroActa', name:'Nro.Acta', field:'ActaNroActa',
    fieldName: 'ActaNroActa',
    type:'number',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    id:'ActaDescripcion', name:'Descripcion', field:'ActaDescripcion',
    fieldName: 'ActaDescripcion',
    type:'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    id:'ActaFechaActa', name:'Desde', field:'ActaFechaActa',
    fieldName: 'ActaFechaActa',
    type:'date',
    searchType: 'date',
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    id:'ActaFechaHasta', name:'Hasta', field:'ActaFechaHasta',
    fieldName: 'ActaFechaHasta',
    type:'date',
    searchType: 'date',
    sortable: true,
    hidden: false,
    searchHidden: false
  },
]

export class ActasController extends BaseController {

  async getActasGridColumns(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(columnsActas, res)
  }

  private async actasListQuery(queryRunner: any, filterSql: any, orderBy: any) {
    return await queryRunner.query(`
      SELECT 
      ROW_NUMBER() OVER (ORDER BY ActaId) AS id,
      ActaId, ActaNroActa, ActaFechaActa, ActaFechaHasta, ActaDescripcion
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
    const ActaNroActa:number = req.body.ActaNroActa;
    const ActaDescripcion:string = req.body.ActaDescripcion;
    const ActaFechaActa:Date = req.body.ActaFechaActa? new Date(req.body.ActaFechaActa) : null;
    const ActaFechaHasta:Date = req.body.ActaFechaHasta?new Date(req.body.ActaFechaHasta) : null;
    try {
      await queryRunner.startTransaction()

      //Validaciones:
      await this.validateFormActa(req.body, 'I', queryRunner)

      await queryRunner.query(`
        INSERT INTO Acta (
          ActaNroActa,
          ActaDescripcion,
          ActaFechaActa,
          ActaFechaHasta
        ) VALUES (@0,@1,@2,@3)
      `, [ActaNroActa, ActaDescripcion, ActaFechaActa, ActaFechaHasta])

      const Acta = await queryRunner.query(`
        SELECT ActaId FROM Acta
        WHERE ActaNroActa IN (@0)
      `, [ActaNroActa])
      const newId:number = Acta[0].ActaId
      
      await queryRunner.commitTransaction()
      this.jsonRes({ActaId: newId}, res, 'Carga de nuevo registro exitoso');
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
    const ActaFechaActa:Date = req.body.ActaFechaActa? new Date(req.body.ActaFechaActa) : null;
    const ActaFechaHasta:Date = req.body.ActaFechaHasta?new Date(req.body.ActaFechaHasta) : null;
    try {
      await queryRunner.startTransaction()
      
      //Validaciones:
      await this.validateFormActa(req.body, 'U', queryRunner)

      await queryRunner.query(`
        UPDATE Acta SET
          ActaNroActa = @1,
          ActaDescripcion = @2,
          ActaFechaActa = @3,
          ActaFechaHasta = @4
        WHERE ActaId IN (@0)
      `, [ActaId, ActaNroActa, ActaDescripcion, ActaFechaActa, ActaFechaHasta])
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

      await queryRunner.query(`
        DELETE FROM Acta WHERE ActaId = @0
      `, [ActaId])
      
      await queryRunner.commitTransaction()
      this.jsonRes({}, res, 'Carga de nuevo registro exitoso');
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

  async validateFormActa(acta: any, action:string, queryRunner: any) {
    let error:string[] = []
    if (!acta.ActaNroActa) {
      error.push(` Nro.Acta`)
    }
    if (!acta.ActaDescripcion) {
      error.push(` Descripcion`)
    }
    if (!acta.ActaFechaActa) {
      error.push(` Desde`)
    }

    if (error.length) {
      error.unshift('Deben completar los siguientes campos:')
      throw new ClientWarning(error)
    }

    const fechaActa:Date = new Date(acta.ActaFechaActa)
    const fechaHasta:Date = new Date(acta.ActaFechaHasta)
    //  La FechaHasta debe de ser mayor a la FechaActa
    if (acta.ActaFechaActa && acta.ActaFechaHasta && (fechaActa.getTime() > fechaHasta.getTime())) {
      throw new ClientException('La fecha Hasta no debe ser menor a Desde')
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

}