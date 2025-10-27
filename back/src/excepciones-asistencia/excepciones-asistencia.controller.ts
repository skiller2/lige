import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";
import { AsistenciaController } from "src/controller/asistencia.controller";

const getOptionsPersonalPrestamoAprobado: any[] = [
  { label: 'Aprobado', value: 'S' },
  { label: 'Rechazado', value: 'N' },
  { label: 'Anulado', value: 'A' },
  { label: 'Pendiente', value: null }
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
    id: 'PersonalId', name: 'Personal', field: 'PersonalId',
    type: 'number',
    fieldName: 'per.PersonalId',
    searchComponent: 'inpurForPersonalSearch',
    searchType: 'number',
    sortable: true,
    hidden: true,
    searchHidden: false,
  },
  {
    id: 'PersonalCUITCUILCUIT', name: 'CUIT', field: 'PersonalCUITCUILCUIT',
    fieldName: 'cuit.PersonalCUITCUILCUIT',
    type: 'number',
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
    id: 'ObjetivoCodigo', name: 'Objetivo Código', field: 'ObjetivoCodigo',
    fieldName: 'ObjetivoCodigo',
    type: 'number',
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: 'ObjetivoId', name: 'Objetivo', field: 'ObjetivoId',
    fieldName: ' obj.ObjetivoId',
    type: 'number',
    searchComponent: 'inpurForObjetivoSearch',
    searchType: 'number',
    sortable: true,
    hidden: true,
    searchHidden: false
  },
  {
    id: 'ObjetivoDescripcion', name: 'Descripcion Objetivo', field: 'ObjetivoDescripcion',
    fieldName: 'ObjetivoDescripcion',
    type: 'string',
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: 'PersonalArt14Autorizado', name: 'Estado', field: 'PersonalArt14Autorizado',
    type: 'string',
    fieldName: 'art.PersonalArt14Autorizado',
    formatter: 'collectionFormatter',
    params: { collection: getOptionsPersonalPrestamoAprobado, },
    searchComponent: 'inpurForPrestamoAprobadoSearch',
    searchType: 'string',
    sortable: true,
    searchHidden: false
  },
  {
    id: 'FechaDeAutorizacion', name: 'Fecha de Autorizacion', field: 'FechaDeAutorizacion',
    fieldName: '',
    type: 'dateTime',
    sortable: true,
    hidden: false,
    searchHidden: true
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
    id: 'PersonalArt14FormaArt14', name: 'Forma Art 14', field: 'PersonalArt14FormaArt14',
    fieldName: 'art.PersonalArt14FormaArt14',
    formatter: 'collectionFormatter',
    params: { collection: AsistenciaController.getMetodologias().map((obj:any)=>{ return { label: obj.descripcion, value: obj.id } }), },
    type: 'text',
    sortable: true,
    hidden: false,
    searchHidden: true
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
    type: 'number',
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
    type: 'number',
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: 'CategoriaPersonalDescripcion', name: 'Categoria', field: 'CategoriaPersonalDescripcion',
    fieldName: 'cat.CategoriaPersonalDescripcion',
    type: 'string',
    sortable: true,
    hidden: false,
    searchHidden: true
  },
]

export class ExcepcionesAsistenciaController extends BaseController {

  async getGridColums(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(columnsExcepcionesAsistencia, res)
  }

  async list(req: any, res: Response, next: NextFunction) {
    const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null }
    const filterSql = filtrosToSql(options.filtros, columnsExcepcionesAsistencia);
    const orderBy = orderToSQL(options.sort)
    const queryRunner = dataSource.createQueryRunner();
    const periodo = req.body.periodo? new Date(req.body.periodo) : null
    const year = periodo? periodo.getFullYear() : 0
    const month = periodo? periodo.getMonth()+1 : 0
    try {
      const list = await queryRunner.query(`
        SELECT CONCAT(art.PersonalArt14Id,'-',per.PersonalId) AS id, per.PersonalId, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre
          , art.PersonalArt14Autorizado, art.PersonalArt14FormaArt14, art.PersonalArt14CategoriaId
          , art.PersonalArt14TipoAsociadoId, art.PersonalArt14SumaFija, art.PersonalArt14AdicionalHora
          , art.PersonalArt14Horas, TRIM(cat.CategoriaPersonalDescripcion) AS CategoriaPersonalDescripcion
          , art.PersonalArt14Dia, art.PersonalArt14Tiempo, art.PersonalArt14DetalleMotivo 
          , CONVERT(datetime, CONVERT(varchar(10), art.PersonalArt14Dia, 120) + ' ' + art.PersonalArt14Tiempo) AS FechaDeAutorizacion
          , IIF(art.PersonalArt14Autorizado ='S',art.PersonalArt14AutorizadoDesde, art.PersonalArt14Desde) AS Desde
          , IIF(art.PersonalArt14Autorizado ='S',art.PersonalArt14AutorizadoHasta, art.PersonalArt14Hasta) AS Hasta
          , CONCAT(obj.ClienteId,'/',ISNULL(obj.ClienteElementoDependienteId,0)) ObjetivoCodigo
          , obj.ObjetivoId
          , CONCAT(cli.ClienteDenominacion,' ',eledep.ClienteElementoDependienteDescripcion) ObjetivoDescripcion
          , art.PersonalArt14ConceptoId,con.ConceptoArt14Descripcion
          , IIF(art.PersonalArt14FormaArt14='S','Suma fija',IIF(art.PersonalArt14FormaArt14='E','Equivalencia',IIF(art.PersonalArt14FormaArt14='A','Adicional hora',IIF(art.PersonalArt14FormaArt14='H','Horas adicionales','')))) AS FormaDescripcion
        FROM PersonalArt14 art
        JOIN Personal per ON per.PersonalId = art.PersonalId
        JOIN Objetivo obj ON obj.ObjetivoId = art.PersonalArt14ObjetivoId
        JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
        JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
        LEFT JOIN ConceptoArt14 con ON con.ConceptoArt14Id = art.PersonalArt14ConceptoId  
        LEFT JOIN CategoriaPersonal cat ON cat.TipoAsociadoId = art.PersonalArt14TipoAsociadoId  AND cat.CategoriaPersonalId = art.PersonalArt14CategoriaId
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
        WHERE 1=1
            AND ((art.PersonalArt14AutorizadoDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1))  AND (ISNULL(art.PersonalArt14AutorizadoHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1))) OR (art.PersonalArt14Desde <= EOMONTH(DATEFROMPARTS(@1,@2,1))  AND (art.PersonalArt14Hasta >= DATEFROMPARTS(@1,@2,1)) ))
          and ${filterSql} ${orderBy}
      `, [ ,year,month])
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

  async getPeriodoQuery(queryRunner:any, anio:number, mes:number){
    return await queryRunner.query(`
      SELECT periodo_id, anio, mes, ind_recibos_generados
      FROM lige.dbo.liqmaperiodo
      WHERE anio = @0 AND mes = @1
      `, [anio, mes])
  }

  async getPersonalArt14ByIdsQuery(queryRunner:any, personalArt14Id:number, personalId:number){
    return await queryRunner.query(`
      SELECT PersonalArt14Autorizado, PersonalArt14Desde, PersonalArt14Hasta
      FROM PersonalArt14
      WHERE PersonalArt14Id = @0 AND PersonalId = @1
      `, [personalArt14Id, personalId])
  }

  async personalArt14Aprobar(queryRunner: any, personalArt14Id: number, personalId: number, usuario:string, ip:string) {
    
    let PersonalPrestamo = await this.getPersonalArt14ByIdsQuery(queryRunner, personalArt14Id, personalId)
    if (!PersonalPrestamo.length)
      return new ClientException('No se encuentra el registro.')
    const PersonalArt14Desde = new Date(PersonalPrestamo[0].PersonalArt14Desde)
    const PersonalArt14Hasta = new Date(PersonalPrestamo[0].PersonalArt14Hasta)
    const anio:number = PersonalArt14Desde.getFullYear()
    const mes:number = PersonalArt14Desde.getMonth()+1

    let res = await this.getPeriodoQuery(queryRunner, anio, mes)
    if (res[0]?.ind_recibos_generados == 1)
      return new ClientException(`Ya se encuentran generados los recibos para el período ${anio}/${mes}`)
    
    res = await queryRunner.query(`
      SELECT PersonalArt14Autorizado FROM PersonalArt14 WHERE PersonalArt14Id IN (@0) AND PersonalId IN (@1)
    `, [personalArt14Id, personalId])

    if (res[0]?.PersonalArt14Autorizado != 'S') {
      const now:Date = new Date()
      await queryRunner.query(`
      UPDATE PersonalArt14
      SET PersonalArt14AutorizadoDesde = PersonalArt14Desde, PersonalArt14AutorizadoHasta = PersonalArt14Hasta, AudFechaMod = @2, AudIpMod = @3, AudUsuarioMod = @4, PersonalArt14Autorizado = 'S'
      WHERE PersonalArt14Id = @0 AND PersonalId = @1
      `, [personalArt14Id, personalId, now, ip, usuario])
      return 1
    }
    
    return 0
  }

  async personalArt14AprovarLista(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const ids:string[] = req.body.ids
    const numRows:number[] = req.body.rows
    let errors:string[] = []
    let numRowsError:number[] = []
    let cantAprobados:number = 0
    
    try {
      await queryRunner.startTransaction()
      const usuario = res.locals.userName
      const ip = this.getRemoteAddress(req)

      for (const [index, id] of ids.entries()) {
        const arrayIds = id.split('-')
        let personalArt14Id:number = Number.parseInt(arrayIds[0])
        let personalId:number = Number.parseInt(arrayIds[1])
        let res = await this.personalArt14Aprobar(queryRunner, personalArt14Id, personalId, usuario, ip)
        if (res instanceof ClientException) {
          let name = await queryRunner.query(`
            SELECT CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre
            FROM Personal per
            WHERE per.PersonalId = @0`,
            [personalId]
          )
          numRowsError.push(numRows[index])
          errors.push(`[FILA ${numRows[index]+1}]${name[0].ApellidoNombre}: `+res.messageArr[0])
        }else{
          cantAprobados = cantAprobados + res
        }
      }

      if (errors.length) {
        throw new ClientException(errors.join(`\n`), numRowsError)
      }

      let msj:string = ''
      if (cantAprobados == ids.length) msj = 'Carga Exitosa'
      else msj = `Carga Exitosa. ${cantAprobados} registros se modificaron. ${ids.length-cantAprobados} ya estaban en estado Aprobado`
      
      await queryRunner.commitTransaction()
      return this.jsonRes({}, res, msj);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async personalArt14Rechazar(queryRunner: any, personalArt14Id: number, personalId: number, usuario:string, ip:string) {
    let PersonalPrestamo = await this.getPersonalArt14ByIdsQuery(queryRunner, personalArt14Id, personalId)
    if (!PersonalPrestamo.length)
      return new ClientException('No se encuentra el registro.')
    const PersonalArt14Desde = new Date(PersonalPrestamo[0].PersonalArt14Desde)
    const anio:number = PersonalArt14Desde.getFullYear()
    const mes:number = PersonalArt14Desde.getMonth()+1

    let res = await this.getPeriodoQuery(queryRunner, anio, mes)
    if (res[0]?.ind_recibos_generados == 1)
      return new ClientException(`Ya se encuentran generados los recibos para el período ${anio}/${mes}`)
    
    res = await queryRunner.query(`
      SELECT PersonalArt14Autorizado FROM PersonalArt14 WHERE PersonalArt14Id IN (@0) AND PersonalId IN (@1)
    `, [personalArt14Id, personalId])

    if (res[0]?.PersonalArt14Autorizado != 'N') {
      const now:Date = new Date()
      await queryRunner.query(`
      UPDATE PersonalArt14
      SET PersonalArt14Anulacion = @2, PersonalArt14AutorizadoDesde = null, PersonalArt14AutorizadoHasta = null, AudFechaMod = @2, AudIpMod = @3, AudUsuarioMod = @4, PersonalArt14Autorizado = 'N'
      WHERE PersonalArt14Id = @0 AND PersonalId = @1
      `, [personalArt14Id, personalId, now, ip, usuario])
      return 1
    }
    
    return 0
  }

  async personalArt14RechazarLista(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const ids:string[] = req.body.ids
    const numRows:number[] = req.body.rows
    let errors:string[] = []
    let numRowsError:number[] = []
    let cantRechazado:number = 0

    try {
      await queryRunner.startTransaction()
      const usuario = res.locals.userName
      const ip = this.getRemoteAddress(req)

      for (const [index, id] of ids.entries()) {
        const arrayIds = id.split('-')
        let personalArt14Id:number = Number.parseInt(arrayIds[0])
        let personalId:number = Number.parseInt(arrayIds[1])
        let res = await this.personalArt14Rechazar(queryRunner, personalArt14Id, personalId, usuario, ip)
        if (res instanceof ClientException) {
          let name = await queryRunner.query(`
            SELECT CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre
            FROM Personal per
            WHERE per.PersonalId = @0`,
            [personalId]
          )
          numRowsError.push(numRows[index])
          errors.push(`[FILA ${numRows[index]+1}]${name[0].ApellidoNombre}: `+res.messageArr[0])
        }else{
          cantRechazado = cantRechazado + res
        }
      }

      if (errors.length) {
        throw new ClientException(errors.join(`\n`), numRowsError)
      }

      let msj:string = ''
      if (cantRechazado == ids.length) msj = 'Carga Exitosa'
      else msj = `Carga Exitosa. ${cantRechazado} registros se modificaron. ${ids.length-cantRechazado} ya estaban en estado Rechazado`
      
      await queryRunner.commitTransaction()
      return this.jsonRes({}, res, msj);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async personalArt14Pendiente(queryRunner: any, personalArt14Id: number, personalId: number, usuario:string, ip:string) {
    let PersonalPrestamo = await this.getPersonalArt14ByIdsQuery(queryRunner, personalArt14Id, personalId)
    if (!PersonalPrestamo.length)
      return new ClientException('No se encuentra el registro.')
    
    const PersonalArt14Desde = new Date(PersonalPrestamo[0].PersonalArt14Desde)
    const anio:number = PersonalArt14Desde.getFullYear()
    const mes:number = PersonalArt14Desde.getMonth()+1

    let res = await this.getPeriodoQuery(queryRunner, anio, mes)
    if (res[0]?.ind_recibos_generados == 1)
      return new ClientException(`Ya se encuentran generados los recibos para el período ${anio}/${mes}`)
    
    res = await queryRunner.query(`
      SELECT PersonalArt14Autorizado FROM PersonalArt14 WHERE PersonalArt14Id IN (@0) AND PersonalId IN (@1)
    `, [personalArt14Id, personalId])

    if (res[0]?.PersonalArt14Autorizado != null) {
      const now:Date = new Date()
      await queryRunner.query(`
      UPDATE PersonalArt14
      SET PersonalArt14AutorizadoDesde = null, PersonalArt14AutorizadoHasta = null, AudFechaMod = @2, AudIpMod = @3, AudUsuarioMod = @4, PersonalArt14Autorizado = null
      WHERE PersonalArt14Id = @0 AND PersonalId = @1
      `, [personalArt14Id, personalId, now, ip, usuario])
      return 1
    }
    
    return 0
  }

  async personalArt14PendienteLista(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const ids:string[] = req.body.ids
    const numRows:number[] = req.body.rows
    let errors:string[] = []
    let numRowsError:number[] = []
    let cantPendiente:number = 0

    try {
      await queryRunner.startTransaction()
      const usuario = res.locals.userName
      const ip = this.getRemoteAddress(req)

      for (const [index, id] of ids.entries()) {
        const arrayIds = id.split('-')
        let personalArt14Id:number = Number.parseInt(arrayIds[0])
        let personalId:number = Number.parseInt(arrayIds[1])
        let res = await this.personalArt14Pendiente(queryRunner, personalArt14Id, personalId, usuario, ip)
        if (res instanceof ClientException) {
          let name = await queryRunner.query(`
            SELECT CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre
            FROM Personal per
            WHERE per.PersonalId = @0`,
            [personalId]
          )
          numRowsError.push(numRows[index])
          errors.push(`[FILA ${numRows[index]+1}]${name[0].ApellidoNombre}: `+res.messageArr[0])
        }else{
          cantPendiente = cantPendiente + res
        }
      }

      if (errors.length) {
        throw new ClientException(errors.join(`\n`), numRowsError)
      }

      let msj:string = ''
      if (cantPendiente == ids.length) msj = 'Carga Exitosa'
      else msj = `Carga Exitosa. ${cantPendiente} registros se modificaron. ${ids.length-cantPendiente} ya estaban en estado Pendiente`
      
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