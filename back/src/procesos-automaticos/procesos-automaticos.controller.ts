import { BaseController, ClientException, ClientWarning } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";

const listaColumnas: any[] = [
  {
    id: 'id', name: 'id', field: 'id',
    fieldName: 'id',
    type: 'number',
    sortable: true,
    hidden: true,
    searchHidden: true,
  },
  {
    id: 'ProcesoAutomaticoLogCodigo', name: 'Log Codigo', field: 'ProcesoAutomaticoLogCodigo',
    fieldName: 'palog.ProcesoAutomaticoLogCodigo',
    // searchComponent: '',
    type: 'number',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: false,
    maxWidth: 150,
    // minWidth: 10,
  },
  {
    id: 'NombreProceso', name: 'Nombre Proceso', field: 'NombreProceso',
    fieldName: 'palog.NombreProceso',
    // searchComponent: '',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'FechaInicio', name: 'Fecha Inicio', field: 'FechaInicio',
    fieldName: 'palog.FechaInicio',
    searchComponent: 'inpurForFechaSearch',
    type: 'date',
    searchType: 'date',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'FechaFin', name: 'Fecha Fin', field: 'FechaFin',
    fieldName: 'palog.FechaFin',
    searchComponent: 'inpurForFechaSearch',
    type: 'date',
    searchType: 'date',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'ProcesoAutomaticoEstadoCod', name: 'Descripcion', field: 'ProcesoAutomaticoEstadoCod',
    fieldName: 'paest.ProcesoAutomaticoEstadoCod',
    searchComponent: 'inpurForProcesoAutomaticoEstadosSearch',
    type: 'number',
    searchType: 'number',
    sortable: true,
    hidden: true,
    searchHidden: false,
  },
  {
    id: 'Descripcion', name: 'Descripcion', field: 'Descripcion',
    fieldName: 'paest.Descripcion',
    // searchComponent: '',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
]

export class ProcesosAutomaticosController extends BaseController {

  async getGridCols(req, res, next) {
    this.jsonRes(listaColumnas, res);
  }

  async listProcesosAutomaticos(req: any, res: Response, next: NextFunction ) {

    const queryRunner = dataSource.createQueryRunner();
    try {
      let list = await queryRunner.query(` 
        SELECT 
          ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) id,
          palog.ProcesoAutomaticoLogCodigo, palog.NombreProceso, 
          palog.FechaInicio, palog.FechaFin, paest.ProcesoAutomaticoEstadoCod, 
          paest.Descripcion, 1
        FROM ProcesoAutomaticoLog palog
        LEFT JOIN ProcesoAutomaticoEstado paest on paest.ProcesoAutomaticoEstadoCod=palog.ProcesoAutomaticoEstadoCod
      `,);

      this.jsonRes(list, res);
    } catch (error) {
      return next(error)
    }
  }

  async getProcesoAutomatico(req: any, res: Response, next: NextFunction ) {
    const logCodigo = req.params.logCodigo

    const queryRunner = dataSource.createQueryRunner();
    try {
      let result = await queryRunner.query(` 
        SELECT 
          palog.ProcesoAutomaticoLogCodigo, palog.NombreProceso, palog.FechaInicio,palog.FechaFin
          , paest.ProcesoAutomaticoEstadoCod, paest.Descripcion, palog.ParametroEntrada,palog.Resultado
          , palog.AudFechaIng, palog.AudUsuarioIng, palog.AudFechaMod, palog.AudUsuarioMod, 1
        FROM ProcesoAutomaticoLog palog
        LEFT JOIN ProcesoAutomaticoEstado paest on paest.ProcesoAutomaticoEstadoCod=palog.ProcesoAutomaticoEstadoCod
        WHERE palog.ProcesoAutomaticoLogCodigo = @0
      `, [logCodigo]);
      
      this.jsonRes(result, res);
    } catch (error) {
      return next(error)
    }
  }

  async getProcesoAutomaticoEstado(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await queryRunner.query(`
        SELECT ProcesoAutomaticoEstadoCod value, Descripcion label
        FROM ProcesoAutomaticoEstado
      `)
      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

}