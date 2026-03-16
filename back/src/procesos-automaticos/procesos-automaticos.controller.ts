import { BaseController, ClientException, ClientWarning } from "../controller/basecontroller.ts";
import { dataSource } from "../data-source.ts";
import type { NextFunction, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros.ts";
import type { Options } from "../schemas/filtro.ts";

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
    id: 'ProcesoAutomaticoLogCodigo', name: 'Codigo', field: 'ProcesoAutomaticoLogCodigo',
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
    id: 'NombreProceso', name: 'Nombre', field: 'NombreProceso',
    fieldName: 'palog.NombreProceso',
    // searchComponent: '',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'FechaInicio', name: 'Inicio', field: 'FechaInicio',
    fieldName: 'palog.FechaInicio',
    searchComponent: 'inputForFechaSearch',
    type: 'date',
    searchType: 'date',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'FechaFin', name: 'Fin', field: 'FechaFin',
    fieldName: 'palog.FechaFin',
    searchComponent: 'inputForFechaSearch',
    type: 'date',
    searchType: 'date',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'ProcesoAutomaticoEstadoCod', name: 'Descripcion', field: 'ProcesoAutomaticoEstadoCod',
    fieldName: 'paest.ProcesoAutomaticoEstadoCod',
    searchComponent: 'inputForProcesoAutomaticoEstadosSearch',
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


const listaColumnasBloqueadas: any[] = [
  {
    id: 'id', name: 'id', field: 'id',
    fieldName: 'id',
    type: 'number',
    sortable: true,
    hidden: true,
    searchHidden: true,
  },
  {
    id: 'ObjectName', name: 'Objeto', field: 'ObjectName',
    fieldName: 'o.name',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'TypeDesc', name: 'Tipo Objeto', field: 'TypeDesc',
    fieldName: 'o.type_desc',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'RequestType', name: 'Tipo Request', field: 'RequestType',
    fieldName: 'request_type',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'LoginTime', name: 'Login Time', field: 'LoginTime',
    fieldName: 'login_time',
    type: 'date',
    searchType: 'date',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'HostName', name: 'Host', field: 'HostName',
    fieldName: 'host_name',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'ProgramName', name: 'Programa', field: 'ProgramName',
    fieldName: 'program_name',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'ClientInterfaceName', name: 'Interface', field: 'ClientInterfaceName',
    fieldName: 'client_interface_name',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'LoginName', name: 'Login', field: 'LoginName',
    fieldName: 'login_name',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'NtDomain', name: 'Dominio NT', field: 'NtDomain',
    fieldName: 'nt_domain',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'NtUserName', name: 'Usuario NT', field: 'NtUserName',
    fieldName: 'nt_user_name',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'Status', name: 'Estado', field: 'Status',
    fieldName: 's.status',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'LastRequestStartTime', name: 'Ultimo Request Inicio', field: 'LastRequestStartTime',
    fieldName: 'last_request_start_time',
    type: 'date',
    searchType: 'date',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'LastRequestEndTime', name: 'Ultimo Request Fin', field: 'LastRequestEndTime',
    fieldName: 'last_request_end_time',
    type: 'date',
    searchType: 'date',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'LogicalReads', name: 'Lecturas Logicas', field: 'LogicalReads',
    fieldName: 's.logical_reads',
    type: 'number',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'Reads', name: 'Lecturas', field: 'Reads',
    fieldName: 's.reads',
    type: 'number',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'RequestStatus', name: 'Estado Request', field: 'RequestStatus',
    fieldName: 'request_status',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'RequestOwnerType', name: 'Tipo Owner', field: 'RequestOwnerType',
    fieldName: 'request_owner_type',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'ObjectId', name: 'Object ID', field: 'ObjectId',
    fieldName: 'objectid',
    type: 'number',
    searchType: 'number',
    sortable: true,
    hidden: true,
    searchHidden: true,
  },
  {
    id: 'DbId', name: 'DB ID', field: 'DbId',
    fieldName: 'dbid',
    type: 'number',
    searchType: 'number',
    sortable: true,
    hidden: true,
    searchHidden: true,
  },
  {
    id: 'Number', name: 'Numero', field: 'Number',
    fieldName: 'a.number',
    type: 'number',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'Encrypted', name: 'Encriptado', field: 'Encrypted',
    fieldName: 'a.encrypted',
    type: 'number',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'BlockingSessionId', name: 'Sesion Bloqueante', field: 'BlockingSessionId',
    fieldName: 'a.blocking_session_id',
    type: 'number',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'Text', name: 'Texto SQL', field: 'Text',
    fieldName: 'a.text',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'RequestMode', name: 'Modo Request', field: 'RequestMode',
    fieldName: 'request_mode',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'SessionID', name: 'Session ID', field: 'SessionID',
    fieldName: 's.Session_id',
    type: 'number',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'ResourceType', name: 'Tipo Recurso', field: 'ResourceType',
    fieldName: 'resource_type',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: 'DatabaseName', name: 'Base de Datos', field: 'DatabaseName',
    fieldName: 'DB_NAME(resource_database_id)',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
 
]


export class ProcesosAutomaticosController extends BaseController {

  async getGridCols(req, res, next) {
    this.jsonRes(listaColumnas, res);
  }

  async getGridColsBloqueadas(req, res, next) {
    this.jsonRes(listaColumnasBloqueadas, res);
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
        Order by palog.ProcesoAutomaticoLogCodigo DESC
      `,);

      this.jsonRes(list, res);
    } catch (error) {
      return next(error)
    }
  }


  async listtablasbloqueadas(req: any, res: Response, next: NextFunction ) {

    const queryRunner = dataSource.createQueryRunner();
    try {
      let list = await queryRunner.query(` SELECT 
        ROW_NUMBER() OVER(ORDER BY s.session_id) AS id,
          o.name, o.type_desc,
          request_type,
          login_time,
          host_name,
          program_name,
          client_interface_name,
          login_name,
          nt_domain,
          nt_user_name,
          s.status,
          last_request_start_time,
          last_request_end_time,
          s.logical_reads,
          s.reads,
          request_status,
          request_owner_type,
          objectid,
          dbid,
          o.name, o.type_desc,
          a.number,
          a.encrypted ,
          a.blocking_session_id,
          a.text,
          request_mode,
          SessionID = s.Session_id,
          resource_type,   
          DatabaseName = DB_NAME(resource_database_id)

      FROM   
          sys.dm_tran_locks l
          JOIN sys.dm_exec_sessions s ON l.request_session_id = s.session_id
          LEFT JOIN   
          (
              SELECT  *
              FROM    sys.dm_exec_requests r
              CROSS APPLY sys.dm_exec_sql_text(sql_handle)
          ) a ON s.session_id = a.session_id
          LEFT JOIN sys.objects o ON o.object_id = l.resource_associated_entity_id
      WHERE  
          s.session_id > 50 AND program_name = 'node-mssql' AND o.name IS NOT NULL `,);
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