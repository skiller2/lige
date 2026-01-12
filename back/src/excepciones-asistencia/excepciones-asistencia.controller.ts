import { BaseController, ClientException, ClientWarning } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";
import { AsistenciaController } from "src/controller/asistencia.controller";

const getOptionsExcepcionAsistenciaAprobado: any[] = [
  { label: 'Aprobado', value: 'S' },
  { label: 'Rechazado', value: 'N' },
  { label: 'Anulado', value: 'A' },
  { label: 'Pendiente', value: 'P' },
  { label: 'Anulado (Coordinador Zona)', value: 'AC' },
]

const columnsExcepcionesAsistencia: any[] = [
  {
    id: 'id', name: 'id', field: 'id',
    fieldName: 'id',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: true,
    searchHidden: true,
  },
  {
    name: "Sucursal Persona",
    type: "string",
    id: "SucursalDescripcionP",
    field: "SucursalDescripcionP",
    fieldName: "sucp.SucursalId",
    searchComponent: "inputForSucursalSearch",
    sortable: true,
    hidden: true,
    searchHidden: false
  },
  {
    id: 'PersonalId', name: 'Personal', field: 'PersonalId',
    type: 'number',
    fieldName: 'per.PersonalId',
    searchComponent: 'inputForPersonalSearch',
    searchType: 'number',
    sortable: true,
    hidden: true,
    searchHidden: false,
  },
  {
    id: 'PersonalCUITCUILCUIT', name: 'CUIT', field: 'PersonalCUITCUILCUIT',
    fieldName: 'cuit.PersonalCUITCUILCUIT',
    type: 'string',
    searchType: 'number',
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
  {
    id: 'ApellidoNombre', name: 'Apellido Nombre', field: 'ApellidoNombre',
    fieldName: 'ApellidoNombre',
    type: 'text',
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
  {
    id: 'ObjetivoId', name: 'Objetivo', field: 'ObjetivoId',
    fieldName: ' obj.ObjetivoId',
    type: 'number',
    searchComponent: 'inputForObjetivoSearch',
    searchType: 'number',
    sortable: true,
    hidden: true,
    searchHidden: false
  },
  {
    name: "Sucursal Objetivo",
    type: "string",
    id: "SucursalDescripcionO",
    field: "SucursalDescripcionO",
    fieldName: "suco.SucursalId",
    searchComponent: "inputForSucursalSearch",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    id: 'ObjetivoDescripcion', name: 'Objetivo', field: 'ObjetivoDescripcion',
    fieldName: 'ObjetivoDescripcion',
    type: 'string',
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    name: "Grupo Actividad Objetivo",
    type: "string",
    id: "GrupoActividadObjetivo",
    field: "GrupoActividadObjetivo",
    fieldName: "GrupoActividadObjetivo",
    sortable: true,
    searchHidden: true
  },
  {
    name: "Grupo Actividad Objetivo",
    type: "number",
    id: "GrupoActividadId",
    field: "GrupoActividadId",
    fieldName: "ga.GrupoActividadId",
    searchComponent: 'inputForGrupoActividadSearch',
    sortable: false,
    hidden: true,
    searchHidden: false
  },
  {
    id: 'PersonalArt14Autorizado', name: 'Estado', field: 'PersonalArt14Autorizado',
    type: 'string',
    fieldName: 'art.PersonalArt14Autorizado',
    formatter: 'collectionFormatter',
    params: { collection: getOptionsExcepcionAsistenciaAprobado },
    searchComponent: 'inputForExcepcionAsistenciaAprobadoSearch',
    searchType: 'string',
    sortable: true,
    searchHidden: false
  },
  {
    id: 'AutorizadoFecha', name: 'Fecha Aprobación', field: 'AutorizadoFecha',
    fieldName: 'art.AutorizadoFecha',
    type: 'date',
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: 'AutorizadoPor', name: 'Aprobado Por', field: 'AutorizadoPor',
    fieldName: 'art.AutorizadoPor',
    type: 'string',
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: 'PersonalArt14Anulacion', name: 'Fecha Anulación/Rechazo', field: 'PersonalArt14Anulacion',
    fieldName: 'art.PersonalArt14Anulacion',
    type: 'date',
    sortable: true,
    hidden: false,
    searchHidden: true,
    showGridColumn: false

  },
  {
    id: 'AnulacionUsuario', name: 'Anulado/Rechazado Por', field: 'AnulacionUsuario',
    fieldName: 'art.AnulacionUsuario',
    type: 'string',
    sortable: true,
    hidden: false,
    searchHidden: true,
    showGridColumn: false

  },
  {
    id: 'PersonalArt14DetalleMotivo', name: 'Motivo', field: 'PersonalArt14DetalleMotivo',
    fieldName: 'art.PersonalArt14DetalleMotivo',
    type: 'text',
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: 'PersonalArt14FormaCompuesto', name: 'Forma Art 17', field: 'PersonalArt14FormaCompuesto',
    fieldName: "CONCAT(ISNULL(art.PersonalArt14FormaArt14,''), '/', ISNULL(art.PersonalArt14ConceptoId, 0))",
    type: 'string',
    formatter: 'collectionFormatter',
    params: { collection: AsistenciaController.getMetodologias().map((obj: any) => { return { label: `${obj.etiqueta} (${obj.descripcion})`, value: `${obj.metodo}/${(obj.conceptoId ?? 0)}` } }), },
    searchComponent: 'inputForMetodologiasSearch',
    searchType: 'string',
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    id: 'Desde', name: 'Desde', field: 'Desde',
    fieldName: 'Desde',
    type: 'date',
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: 'Hasta', name: 'Hasta', field: 'Hasta',
    fieldName: 'Hasta',
    type: 'date',
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: 'PersonalArt14SumaFija', name: 'Suma Fija', field: 'PersonalArt14SumaFija',
    fieldName: 'art.PersonalArt14SumaFija',
    type: 'currency',
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: 'PersonalArt14Horas', name: 'Horas Adicionales', field: 'PersonalArt14Horas',
    fieldName: 'art.PersonalArt14Horas',
    type: 'number',
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: 'PersonalArt14AdicionalHora', name: 'Importe adicional Hora', field: 'PersonalArt14AdicionalHora',
    fieldName: 'art.PersonalArt14AdicionalHora',
    type: 'currency',
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: 'CategoriaPersonalDescripcion', name: 'Categoria Art. 17', field: 'CategoriaPersonalDescripcion',
    fieldName: 'cat.CategoriaPersonalDescripcion',
    type: 'string',
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: 'PersonalArt14AudFechaIng', name: 'Fecha Ingreso', field: 'PersonalArt14AudFechaIng',
    fieldName: 'art.PersonalArt14AudFechaIng',
    type: 'date',
    sortable: true,
    hidden: false,
    searchHidden: true,
    showGridColumn: false

  },
  {
    id: 'PersonalArt14AudUsuarioIng', name: 'Usuario Ingreso', field: 'PersonalArt14AudUsuarioIng',
    fieldName: 'art.PersonalArt14AudUsuarioIng',
    type: 'string',
    sortable: true,
    hidden: false,
    searchHidden: true,
    showGridColumn: false
  },
  {
    id: 'PersonalArt14AudFechaMod', name: 'Fecha Ultima Modificación.', field: 'PersonalArt14AudFechaMod',
    fieldName: 'art.PersonalArt14AudFechaMod',
    type: 'date',
    sortable: true,
    hidden: false,
    searchHidden: true,
    showGridColumn: false
  },
  {
    id: 'PersonalArt14AudUsuarioMod', name: 'Usuario Ultima Modificación.', field: 'PersonalArt14AudUsuarioMod',
    fieldName: 'art.PersonalArt14AudUsuarioMod',
    type: 'string',
    sortable: true,
    hidden: false,
    searchHidden: true,
    showGridColumn: false
  },

]

export class ExcepcionesAsistenciaController extends BaseController {

  getEstadoExcepcionAsistencia(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(getOptionsExcepcionAsistenciaAprobado, res)
  }


  async getGridColums(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(columnsExcepcionesAsistencia, res)
  }

  async list(req: any, res: Response, next: NextFunction) {
    const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null }
    const filterSql = filtrosToSql(options.filtros, columnsExcepcionesAsistencia);
    const orderBy = orderToSQL(options.sort)
    const queryRunner = dataSource.createQueryRunner();
    const periodo = req.body.periodo ? new Date(req.body.periodo) : null
    const year = periodo ? periodo.getFullYear() : 0
    const month = periodo ? periodo.getMonth() + 1 : 0


    try {
      const list = await queryRunner.query(`
        SELECT CONCAT(art.PersonalArt14Id,'-',per.PersonalId) AS id, per.PersonalId, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre,
              art.PersonalArt14Id, art.PersonalArt14Autorizado,
              art.PersonalArt14FormaArt14,
              CONCAT(ISNULL(art.PersonalArt14FormaArt14,''),'/',ISNULL(art.PersonalArt14ConceptoId,0)) AS PersonalArt14FormaCompuesto,
              art.PersonalArt14CategoriaId
              , art.PersonalArt14TipoAsociadoId, art.PersonalArt14SumaFija, art.PersonalArt14AdicionalHora
              , art.PersonalArt14Horas, TRIM(cat.CategoriaPersonalDescripcion) AS CategoriaPersonalDescripcion
              , art.PersonalArt14AudFechaIng,art.PersonalArt14AudUsuarioIng,art.PersonalArt14AudIpIng,art.PersonalArt14AudFechaMod,art.PersonalArt14AudUsuarioMod,art.PersonalArt14AudIpMod
              , art.AutorizadoFecha
              , art.AutorizadoPor
              , art.PersonalArt14Anulacion
              , art.AnulacionUsuario
              , IIF(art.PersonalArt14Autorizado ='S',art.PersonalArt14AutorizadoDesde, art.PersonalArt14Desde) AS Desde
              , IIF(art.PersonalArt14Autorizado ='S',art.PersonalArt14AutorizadoHasta, art.PersonalArt14Hasta) AS Hasta
              , CONCAT(obj.ClienteId,'/',ISNULL(obj.ClienteElementoDependienteId,0)) ObjetivoCodigo
              , obj.ObjetivoId
              , CONCAT(CONCAT(obj.ClienteId,'/',ISNULL(obj.ClienteElementoDependienteId,0)), ' ', cli.ClienteDenominacion,' ',eledep.ClienteElementoDependienteDescripcion) ObjetivoDescripcion
              , ISNULL(art.PersonalArt14ConceptoId,0) as PersonalArt14ConceptoId,con.ConceptoArt14Descripcion
              , IIF(art.PersonalArt14FormaArt14='S','Suma fija',IIF(art.PersonalArt14FormaArt14='E','Equivalencia',IIF(art.PersonalArt14FormaArt14='A','Adicional hora',IIF(art.PersonalArt14FormaArt14='H','Horas adicionales','')))) AS FormaDescripcion
              , art.PersonalArt14DetalleMotivo
              , sucp.SucursalId , TRIM(sucp.SucursalDescripcion) AS SucursalDescripcionP,
          suco.SucursalId , TRIM(suco.SucursalDescripcion) AS SucursalDescripcionO,

          ga.GrupoActividadId,
          CASE
            WHEN gaobj.GrupoActividadId IS NOT NULL THEN CONCAT(TRIM(ga.GrupoActividadDetalle), ' (Desde: ', FORMAT(gaobj.GrupoActividadObjetivoDesde, 'dd/MM/yyyy')
          , ' - Hasta: ', IIF(gaobj.GrupoActividadObjetivoHasta IS NULL, '', FORMAT(gaobj.GrupoActividadObjetivoHasta, 'dd/MM/yyyy')), ')')
            ELSE NULL END as GrupoActividadObjetivo,
          1
            FROM PersonalArt14 art
            JOIN Personal per ON per.PersonalId = art.PersonalId
            JOIN Objetivo obj ON obj.ObjetivoId = art.PersonalArt14ObjetivoId
            JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
            JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
            LEFT JOIN ConceptoArt14 con ON con.ConceptoArt14Id = art.PersonalArt14ConceptoId  
            LEFT JOIN CategoriaPersonal cat ON cat.TipoAsociadoId = art.PersonalArt14TipoAsociadoId  AND cat.CategoriaPersonalId = art.PersonalArt14CategoriaId
            LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 

        LEFT JOIN PersonalSucursalPrincipal sucper ON sucper.PersonalId = per.PersonalId AND sucper.PersonalSucursalPrincipalId = (SELECT MAX(a.PersonalSucursalPrincipalId) PersonalSucursalPrincipalId FROM PersonalSucursalPrincipal a WHERE a.PersonalId = per.PersonalId)
        LEFT JOIN Sucursal sucp ON sucp.SucursalId=sucper.PersonalSucursalPrincipalSucursalId

						
        LEFT JOIN Sucursal suco ON suco.SucursalId=eledep.ClienteElementoDependienteSucursalId

        OUTER APPLY (
              SELECT TOP 1 gaobj.GrupoActividadObjetivoId,gaobj.GrupoActividadObjetivoObjetivoId,gaobj.GrupoActividadId, gaobj.GrupoActividadObjetivoDesde,gaobj.GrupoActividadObjetivoHasta
              FROM GrupoActividadObjetivo gaobj
              WHERE 
                gaobj.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId
                AND gaobj.GrupoActividadObjetivoDesde <= DATEFROMPARTS(@1,@2,1)
                AND ISNULL(gaobj.GrupoActividadObjetivoHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1)
              ORDER BY 
                gaobj.GrupoActividadId DESC,
                gaobj.GrupoActividadObjetivoId DESC
            ) gaobj

            LEFT JOIN GrupoActividad ga on ga.GrupoActividadId=gaobj.GrupoActividadId

            WHERE 1=1
            -- art.PersonalId = @0 
            -- AND (art.PersonalArt14AutorizadoDesde <= @1 OR art.PersonalArt14AutorizadoDesde IS NULL) AND (art.PersonalArt14Desde <= @1 OR art.PersonalArt14Desde IS NULL)
              AND ((art.PersonalArt14AutorizadoDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1))  AND (ISNULL(art.PersonalArt14AutorizadoHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1))) OR (art.PersonalArt14Desde <= EOMONTH(DATEFROMPARTS(@1,@2,1))  AND (art.PersonalArt14Hasta >= DATEFROMPARTS(@1,@2,1)) ))
          and ${filterSql} ${orderBy}
      `, [, year, month])
      this.jsonRes(
        {
          total: list.length,
          list,
        },
        res
      );

    } catch (error) {
      return next(error)
    }

  }

  async getPeriodoQuery(queryRunner: any, anio: number, mes: number) {
    return await queryRunner.query(`
      SELECT periodo_id, anio, mes, ind_recibos_generados
      FROM lige.dbo.liqmaperiodo
      WHERE anio = @0 AND mes = @1
      `, [anio, mes])
  }

  async getPersonalArt14ByIdsQuery(queryRunner: any, personalArt14Id: number, personalId: number) {
    return await queryRunner.query(`
      SELECT PersonalArt14Autorizado, PersonalArt14Desde, PersonalArt14Hasta, PersonalArt14ConceptoId, PersonalArt14FormaArt14, PersonalArt14ObjetivoId
      FROM PersonalArt14
      WHERE PersonalArt14Id = @0 AND PersonalId = @1
      `, [personalArt14Id, personalId])
  }

  async personalArt14Aprobar(queryRunner: any, personalArt14Id: number, personalId: number, usuario: string, ip: string) {

    let PersonalPrestamo = await this.getPersonalArt14ByIdsQuery(queryRunner, personalArt14Id, personalId)
    if (!PersonalPrestamo.length) return new ClientException('No se encuentra el registro.')

    const PersonalArt14Desde = new Date(PersonalPrestamo[0].PersonalArt14Desde)
    // const PersonalArt14Hasta = new Date(PersonalPrestamo[0].PersonalArt14Hasta)
    const anio: number = PersonalArt14Desde.getFullYear()
    const mes: number = PersonalArt14Desde.getMonth() + 1

    const periodo = await this.getPeriodoQuery(queryRunner, anio, mes)
    if (periodo[0]?.ind_recibos_generados == 1)
      return new ClientException(`Ya se encuentran generados los recibos para el período ${anio}/${mes}`)

    if (PersonalPrestamo[0]?.PersonalArt14Autorizado == 'A' || PersonalPrestamo[0]?.PersonalArt14Autorizado == 'AC' || PersonalPrestamo[0]?.PersonalArt14Autorizado == 'N') return new ClientException(`La excepción se encuentra anulada y no puede ser aprobada.`)

    let conceptoId = PersonalPrestamo[0]?.PersonalArt14ConceptoId ? `PersonalArt14ConceptoId = ${PersonalPrestamo[0]?.PersonalArt14ConceptoId}` : `PersonalArt14ConceptoId IS NULL`
    
    const duplicadoAprobado = await queryRunner.query(` SELECT COUNT(PersonalArt14Id) AS Cantidad FROM PersonalArt14
      WHERE PersonalId = @0 AND PersonalArt14Desde = @1 AND PersonalArt14Hasta = @2 AND PersonalArt14FormaArt14 = @3 AND PersonalArt14ObjetivoId = @5 and PersonalArt14Autorizado='S' and ${conceptoId}
      `, [personalId, PersonalPrestamo[0]?.PersonalArt14Desde, PersonalPrestamo[0]?.PersonalArt14Hasta, PersonalPrestamo[0]?.PersonalArt14FormaArt14, PersonalPrestamo[0]?.PersonalArt14ConceptoId, PersonalPrestamo[0]?.PersonalArt14ObjetivoId])

    if (duplicadoAprobado[0]?.Cantidad > 0) return new ClientException(`Ya existe una excepción aprobada del mismo tipo para la persona en el período indicado`)

    if (PersonalPrestamo[0]?.PersonalArt14Autorizado == 'P' || PersonalPrestamo[0]?.PersonalArt14Autorizado == null) {
      const now: Date = new Date()
      await queryRunner.query(`
      UPDATE PersonalArt14
      SET PersonalArt14AutorizadoDesde = PersonalArt14Desde, PersonalArt14AutorizadoHasta = PersonalArt14Hasta, PersonalArt14Autorizado = 'S', PersonalArt14Anulacion = null, AnulacionUsuario = null,
      AutorizadoPor = @4, AutorizadoFecha = @2,
      PersonalArt14AudFechaMod = @2, PersonalArt14AudIpMod = @3, PersonalArt14AudUsuarioMod = @4      
      WHERE PersonalArt14Id = @0 AND PersonalId = @1
      `, [personalArt14Id, personalId, now, ip, usuario])
      return 1
    }

    return 0
  }

  async personalArt14AprovarLista(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const ids: Array<{ PersonalArt14Id: number, PersonalId: number, ObjetivoId: number, PersonalArt14ConceptoId: number, PersonalArt14FormaArt14: string }> = req.body.ids
    const numRows: number[] = req.body.rows
    let errors: string[] = []
    let numRowsError: number[] = []
    let cantAprobados: number = 0

    try {
      await queryRunner.startTransaction()
      const usuario = res.locals.userName
      const ip = this.getRemoteAddress(req)

      // Validar duplicados: misma persona con mismo tipo de excepción en mismo objetivo
      let duplicados: string[] = []

      if (ids.length > 0) {
        const excepciones = ids.map(id => `${id.PersonalId}-${id.PersonalArt14FormaArt14}-${id.PersonalArt14ConceptoId}-${id.ObjetivoId}`);
        // Buscar duplicados
        duplicados = excepciones.filter((item, index) => excepciones.indexOf(item) !== index)
      } else {
        throw new ClientWarning('No se recibieron registros para procesar.')
      }

      for (const [index, id] of ids.entries()) {
        const personalArt14Id: number = id.PersonalArt14Id
        const personalId: number = id.PersonalId
        const PersonalArt14Forma: string = id.PersonalArt14FormaArt14
        const PersonalArt14ConceptoId: number = id.PersonalArt14ConceptoId
        const PersonalArt14ObjetivoId: number = id.ObjetivoId

        const excepcion = `${personalId}-${PersonalArt14Forma}-${PersonalArt14ConceptoId}-${PersonalArt14ObjetivoId}`

        // Validar si esta excepción está en los duplicados
        if (duplicados.includes(excepcion)) {
          const name = await queryRunner.query(`
            SELECT CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre
            FROM Personal per
            WHERE per.PersonalId = @0`,
            [personalId]
          )
          numRowsError.push(numRows[index])
          errors.push(`[FILA ${numRows[index] + 1}]${name[0].ApellidoNombre}: No se pueden aprobar múltiples excepciones del mismo tipo para el mismo objetivo y período..`)
          continue
        }

        let res = await this.personalArt14Aprobar(queryRunner, personalArt14Id, personalId, usuario, ip)
        if (res instanceof ClientException) {
          const name = await queryRunner.query(`
            SELECT CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre
            FROM Personal per
            WHERE per.PersonalId = @0`,
            [personalId]
          )
          numRowsError.push(numRows[index])
          errors.push(`[FILA ${numRows[index] + 1}]${name[0].ApellidoNombre}: ` + res.messageArr[0])
        } else {
          cantAprobados = cantAprobados + res
        }
      }

      if (errors.length) {
        throw new ClientException(errors.join(`\n`), numRowsError)
      }

      let msj: string = ''
      if (cantAprobados == ids.length) msj = 'Carga Exitosa'
      else msj = `Carga Exitosa. ${cantAprobados} registros se modificaron. ${ids.length - cantAprobados} ya estaban en estado Aprobado`

      await queryRunner.commitTransaction()
      return this.jsonRes({}, res, msj);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async personalArt14Rechazar(queryRunner: any, personalArt14Id: number, personalId: number, usuario: string, ip: string) {
    let PersonalPrestamo = await this.getPersonalArt14ByIdsQuery(queryRunner, personalArt14Id, personalId)
    if (!PersonalPrestamo.length)
      return new ClientException('No se encuentra el registro.')
    const PersonalArt14Desde = new Date(PersonalPrestamo[0].PersonalArt14Desde)
    const anio: number = PersonalArt14Desde.getFullYear()
    const mes: number = PersonalArt14Desde.getMonth() + 1

    let res = await this.getPeriodoQuery(queryRunner, anio, mes)
    if (res[0]?.ind_recibos_generados == 1)
      return new ClientException(`Ya se encuentran generados los recibos para el período ${anio}/${mes}`)

    res = await queryRunner.query(`
      SELECT PersonalArt14Autorizado FROM PersonalArt14 WHERE PersonalArt14Id IN (@0) AND PersonalId IN (@1)
    `, [personalArt14Id, personalId])

    if (res[0]?.PersonalArt14Autorizado != 'N') {
      const now: Date = new Date()
      await queryRunner.query(`
      UPDATE PersonalArt14
      SET PersonalArt14Anulacion = @2,AnulacionUsuario = @4, PersonalArt14AutorizadoDesde = null, PersonalArt14AutorizadoHasta = null, PersonalArt14AudFechaMod = @2, PersonalArt14AudIpMod = @3, PersonalArt14AudUsuarioMod = @4, PersonalArt14Autorizado = 'N'
      WHERE PersonalArt14Id = @0 AND PersonalId = @1
      `, [personalArt14Id, personalId, now, ip, usuario])
      return 1
    }

    return 0
  }

  async personalArt14RechazarLista(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const ids: string[] = req.body.ids
    const numRows: number[] = req.body.rows
    let errors: string[] = []
    let numRowsError: number[] = []
    let cantRechazado: number = 0

    try {
      await queryRunner.startTransaction()
      const usuario = res.locals.userName
      const ip = this.getRemoteAddress(req)

      for (const [index, id] of ids.entries()) {
        const arrayIds = id.split('-')
        let personalArt14Id: number = Number.parseInt(arrayIds[0])
        let personalId: number = Number.parseInt(arrayIds[1])
        let res = await this.personalArt14Rechazar(queryRunner, personalArt14Id, personalId, usuario, ip)
        if (res instanceof ClientException) {
          let name = await queryRunner.query(`
            SELECT CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre
            FROM Personal per
            WHERE per.PersonalId = @0`,
            [personalId]
          )
          numRowsError.push(numRows[index])
          errors.push(`[FILA ${numRows[index] + 1}]${name[0].ApellidoNombre}: ` + res.messageArr[0])
        } else {
          cantRechazado = cantRechazado + res
        }
      }

      if (errors.length) {
        throw new ClientException(errors.join(`\n`), numRowsError)
      }

      let msj: string = ''
      if (cantRechazado == ids.length) msj = 'Carga Exitosa'
      else msj = `Carga Exitosa. ${cantRechazado} registros se modificaron. ${ids.length - cantRechazado} ya estaban en estado Rechazado`

      await queryRunner.commitTransaction()
      return this.jsonRes({}, res, msj);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async personalArt14Pendiente(queryRunner: any, personalArt14Id: number, personalId: number, usuario: string, ip: string) {
    let PersonalPrestamo = await this.getPersonalArt14ByIdsQuery(queryRunner, personalArt14Id, personalId)
    if (!PersonalPrestamo.length)
      return new ClientException('No se encuentra el registro.')

    const PersonalArt14Desde = new Date(PersonalPrestamo[0].PersonalArt14Desde)
    const anio: number = PersonalArt14Desde.getFullYear()
    const mes: number = PersonalArt14Desde.getMonth() + 1

    let res = await this.getPeriodoQuery(queryRunner, anio, mes)
    if (res[0]?.ind_recibos_generados == 1)
      return new ClientException(`Ya se encuentran generados los recibos para el período ${anio}/${mes}`)

    res = await queryRunner.query(`
      SELECT PersonalArt14Autorizado FROM PersonalArt14 WHERE PersonalArt14Id IN (@0) AND PersonalId IN (@1)
    `, [personalArt14Id, personalId])

    if (res[0]?.PersonalArt14Autorizado != null) {
      const now: Date = new Date()
      await queryRunner.query(`
      UPDATE PersonalArt14
      SET PersonalArt14AutorizadoDesde = null, PersonalArt14AutorizadoHasta = null, PersonalArt14Autorizado = 'P', PersonalArt14Anulacion = null, AnulacionUsuario = null, AutorizadoPor = null, AutorizadoFecha = null,
      PersonalArt14AudFechaMod = @2, PersonalArt14AudIpMod = @3, PersonalArt14AudUsuarioMod = @4
      WHERE PersonalArt14Id = @0 AND PersonalId = @1
      `, [personalArt14Id, personalId, now, ip, usuario])
      return 1
    }

    return 0
  }

  async personalArt14PendienteLista(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const ids: string[] = req.body.ids
    const numRows: number[] = req.body.rows
    let errors: string[] = []
    let numRowsError: number[] = []
    let cantPendiente: number = 0

    try {
      await queryRunner.startTransaction()
      const usuario = res.locals.userName
      const ip = this.getRemoteAddress(req)

      for (const [index, id] of ids.entries()) {
        const arrayIds = id.split('-')
        let personalArt14Id: number = Number.parseInt(arrayIds[0])
        let personalId: number = Number.parseInt(arrayIds[1])
        let res = await this.personalArt14Pendiente(queryRunner, personalArt14Id, personalId, usuario, ip)
        if (res instanceof ClientException) {
          let name = await queryRunner.query(`
            SELECT CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre
            FROM Personal per
            WHERE per.PersonalId = @0`,
            [personalId]
          )
          numRowsError.push(numRows[index])
          errors.push(`[FILA ${numRows[index] + 1}]${name[0].ApellidoNombre}: ` + res.messageArr[0])
        } else {
          cantPendiente = cantPendiente + res
        }
      }

      if (errors.length) {
        throw new ClientException(errors.join(`\n`), numRowsError)
      }

      let msj: string = ''
      if (cantPendiente == ids.length) msj = 'Carga Exitosa'
      else msj = `Carga Exitosa. ${cantPendiente} registros se modificaron. ${ids.length - cantPendiente} ya estaban en estado Pendiente`

      await queryRunner.commitTransaction()
      return this.jsonRes({}, res, msj);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

}