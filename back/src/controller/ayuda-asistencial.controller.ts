import { NextFunction, Response } from "express";
import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";

const optionsSelect: any[] = [
  { label: 'Ayuda Asistencial', value: 1 },
  { label: 'Adelanto', value: 7 },
]

const getOptions: any[] = [
    { label: 'Si', value: '1' },
    { label: 'No', value: '0' }
]


const getOptionsPersonalPrestamoAprobado: any[] = [
  { label: 'Aprobado', value: 'S' },
  { label: 'Rechazado', value: 'N' },
  { label: 'Anulado', value: 'A' },
  { label: 'Pendiente', value: null }
]

const columnsAyudaAsistencial: any[] = [
    {
      id: "cuit",
      name: "CUIT",
      field: "PersonalCUITCUILCUIT",
      type: "string",
      fieldName: "cuit.PersonalCUITCUILCUIT",
      sortable: true,
      searchHidden: true
    },
    {
      id: "ApellidoNombre",
      name: "Apellido Nombre",
      field: "ApellidoNombre",
      type: "string",
      fieldName: "per.PersonalId",
      searchComponent: "inpurForPersonalSearch",
      searchType: "number",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      id: "personalId",
      name: "PersonalId",
      field: "personalId",
      type: "number",
      fieldName: "per.PersonalId",
      sortable: true,
      searchHidden: true,
      hidden: true,
    },
    {
      id: "tipo",
      name: "Tipo",
      type: "string",
      field: "FormaPrestamoDescripcion",
      fieldName: "form.FormaPrestamoId",
      searchComponent: "inpurForTipoPrestamoSearch",
      searchType: "number",
      sortable: true,
      searchHidden: false
    },
    // {
    //   id: "tipoId",
    //   name: "TipoId",
    //   type: "number",
    //   field: "FormaPrestamoId",
    //   fieldName: "form.FormaPrestamoId",
    //   sortable: true,
    //   searchHidden: true,
    //   hidden: true
    // },
    {
      id: "liquidoFinanzas",
      name: "Liquido Finanzas",
      type: "string",
      field: "PersonalPrestamoLiquidoFinanzas",
      fieldName: "pres.PersonalPrestamoLiquidoFinanzas",
      formatter: 'collectionFormatter',
      params: { collection: getOptions, },
      searchType: "boolean",
      sortable: true,
      searchHidden: false
    },
    // {
    //   id: "sitRevDescripcion",
    //   name: "SituacionRevistaDescripcion",
    //   field: "sitRevDescripcion",
    //   type: "string",
    //   fieldName: "sit.SituacionRevistaDescripcion",
    //   sortable: true,
    //   hidden: true,
    //   searchHidden: false
    // },
    {
      id: "PersonalPrestamoDia",
      name: "Fecha Solicitud",
      field: "PersonalPrestamoDia",
      type: "date",
      fieldName: "pres.PersonalPrestamoDia",
      searchComponent: "inpurForFechaSearch",
      searchType: "date",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      id: "PersonalPrestamoFechaAprobacion",
      name: "Fecha Aprobado",
      field: "PersonalPrestamoFechaAprobacion",
      type: "date",
      fieldName: "pres.PersonalPrestamoFechaAprobacion",
      searchComponent: "inpurForFechaSearch",
      searchType: "date",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      id: "PersonalPrestamoAplicaEl",
      name: "Aplica El",
      type: "string",
      field: "PersonalPrestamoAplicaEl",
      fieldName: "pres.PersonalPrestamoAplicaEl",
      searchType: "string",
      sortable: true,
      searchHidden: false
    },
    {
      id: "PersonalPrestamoCantidadCuotas",
      name: "Cant Cuotas",
      type: "number",
      field: "PersonalPrestamoCantidadCuotas",
      fieldName: "pres.PersonalPrestamoCantidadCuotas",
      searchType: "number",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      id: "PersonalPrestamoMonto",
      name: "Importe",
      field: "PersonalPrestamoMonto",
      type: "currency",
      fieldName: "pres.PersonalPrestamoMonto",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      id: "PersonalPrestamoAprobado",
      name: "Estado",
      type: "string",
      field: "PersonalPrestamoAprobado",
      fieldName: "pres.PersonalPrestamoAprobado",
      formatter: 'collectionFormatter',
      params: { collection: getOptionsPersonalPrestamoAprobado, },
      searchComponent: "inpurForPrestamoAprobadoSearch",
      searchType: "string",
      sortable: true,
      searchHidden: false
    },
    {
      id: "SituacionRevistaDescripcion",
      name: "Situación Revista",
      type: "string",
      field: "SituacionRevistaDescripcion",
      fieldName: "sit.SituacionRevistaDescripcion",
      searchType: "string",
      sortable: true,
    },
];

export class AyudaAsistencialController extends BaseController {

  async personalPrestamoAprobadoQuery(
    queryRunner:any, personalPrestamoId:number, personalId:number, PersonalPrestamoAplicaEl:string, 
    PersonalPrestamoCantidadCuotas:number ,PersonalPrestamoMonto:number
  ){
    const PersonalPrestamoAprobado = 'S'
    const PersonalPrestamoFechaAprobacion = new Date()
    return await queryRunner.query(`
      UPDATE PersonalPrestamo
      SET PersonalPrestamoAprobado = @2, PersonalPrestamoAplicaEl = @3, PersonalPrestamoCantidadCuotas = @4,
      PersonalPrestamoMontoAutorizado = @5, PersonalPrestamoMonto = @5, PersonalPrestamoFechaAprobacion = @6
      WHERE PersonalPrestamoId = @0 AND PersonalId = @1
    `, [personalPrestamoId, personalId, PersonalPrestamoAprobado, PersonalPrestamoAplicaEl,
      PersonalPrestamoCantidadCuotas, PersonalPrestamoMonto, PersonalPrestamoFechaAprobacion]
    )
  }
  async personalPrestamoRechazadoQuery(queryRunner:any, personalPrestamoId:number, personalId:number){
    const PersonalPrestamoAprobado = 'N'
    const PersonalPrestamoAplicaEl = null
    const PersonalPrestamoUltimaLiquidacion = ''
    const PersonalPrestamoCantidadCuotas= 0
    const PersonalPrestamoMontoAutorizado = 0
    const PersonalPrestamoFechaAprobacion = null
    return await queryRunner.query(`
      UPDATE PersonalPrestamo
      SET PersonalPrestamoAprobado = @2, PersonalPrestamoAplicaEl = @3, PersonalPrestamoUltimaLiquidacion = @4,
      PersonalPrestamoCantidadCuotas = @5, PersonalPrestamoMontoAutorizado = @6, PersonalPrestamoFechaAprobacion = @7
      WHERE PersonalPrestamoId = @0 AND PersonalId = @1
    `, [personalPrestamoId, personalId, PersonalPrestamoAprobado, PersonalPrestamoAplicaEl,
      PersonalPrestamoUltimaLiquidacion, PersonalPrestamoCantidadCuotas, PersonalPrestamoMontoAutorizado,
      PersonalPrestamoFechaAprobacion]
    )
  }

  async updateRowPersonalPrestamoQuery(
    queryRunner:any, personalPrestamoId:number, personalId:number, PersonalPrestamoAplicaEl:string, 
    PersonalPrestamoCantidadCuotas:number ,PersonalPrestamoMonto:number
  ){
    return await queryRunner.query(`
      UPDATE PersonalPrestamo
      SET PersonalPrestamoAplicaEl = @2, PersonalPrestamoCantidadCuotas = @3, PersonalPrestamoMonto = @4
      WHERE PersonalPrestamoId = @0 AND PersonalId = @1
    `, [personalPrestamoId, personalId, PersonalPrestamoAplicaEl, PersonalPrestamoCantidadCuotas,
      PersonalPrestamoMonto]
    )
  }

  async deletePersonalPrestamoCuotasQuery(
    queryRunner:any, personalPrestamoId:number, personalId:number
  ){
    return await queryRunner.query(`
      DELETE FROM PersonalPrestamoCuota
      WHERE PersonalPrestamoId = @0 AND PersonalId = @1
    `, [personalPrestamoId, personalId])
  }

  async getPersonalPrestamoByIdsQuery(queryRunner:any, personalPrestamoId:number, personalId:number){
    return await queryRunner.query(`
      SELECT *
      FROM PersonalPrestamo pres
      WHERE pres.PersonalPrestamoId = @0 AND pres.PersonalId = @1
      `, [personalPrestamoId, personalId])
  }

  async getPersonalPrestamoCuotasByIdsQuery(
    queryRunner:any, personalPrestamoId:number, personalId:number
  ){
    return await queryRunner.query(`
      SELECT PersonalPrestamoCuotaId, PersonalPrestamoId, PersonalId,
      PersonalPrestamoCuotaAno anio, PersonalPrestamoCuotaMes mes, PersonalPrestamoCuotaImporte importe
      FROM PersonalPrestamoCuota ppc
      WHERE ppc.PersonalPrestamoId = @0 AND ppc.PersonalId = @1
      `, [personalPrestamoId, personalId])
  }

  async getPersonalPrestamoCuotaByPeriodoQuery(
    queryRunner:any, personalPrestamoId:number, personalId:number, anio:number, mes:number
  ){
    return await queryRunner.query(`
      SELECT *
      FROM PersonalPrestamoCuota ppc
      WHERE ppc.PersonalPrestamoId = @0 AND ppc.PersonalId = @1 AND ppc.PersonalPrestamoCuotaAno = @2 AND ppc.PersonalPrestamoCuotaAno = @3
      `, [personalPrestamoId, personalId, anio, mes])
  }

  async getPeriodoQuery(queryRunner:any, anio:number, mes:number){
    return await queryRunner.query(`
      SELECT periodo_id, anio, mes, ind_recibos_generados
      FROM lige.dbo.liqmaperiodo
      WHERE anio = @0 AND mes = @1
      `, [anio, mes])
  }

  async getReciboQuery(queryRunner:any, PersonalId:number, anio:number, mes:number){
    return await queryRunner.query(`
      SELECT doc.doc_id
      FROM lige.dbo.docgeneral doc
      LEFT JOIN lige.dbo.liqmaperiodo liqp ON liqp.periodo_id = doc.periodo
      WHERE doc.persona_id = @0 AND liqp.anio = @1 AND liqp.mes = @2 
      `, [PersonalId, anio, mes])
  }

  async rowAyudaAsistencialQuery(queryRunner:any, personalPrestamoId:number, personalId:number){
    return await queryRunner.query(`
      SELECT CONCAT(pres.PersonalPrestamoId,'-', per.PersonalId) id,
      CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, cuit.PersonalCUITCUILCUIT, pres.PersonalId, pres.PersonalPrestamoMonto,
      pres.PersonalPrestamoDia, pres.PersonalPrestamoFechaAprobacion, pres.PersonalPrestamoCantidadCuotas,
      pres.PersonalPrestamoAplicaEl, form.FormaPrestamoId, form.FormaPrestamoDescripcion, IIF(pres.PersonalPrestamoLiquidoFinanzas=1,'1','0') PersonalPrestamoLiquidoFinanzas
      FROM PersonalPrestamo pres
      LEFT JOIN Personal per ON per.PersonalId = pres.PersonalId 
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = pres.PersonalId 
      LEFT JOIN FormaPrestamo form ON form.FormaPrestamoId = pres.FormaPrestamoId
      WHERE pres.PersonalPrestamoId = @0 AND pres.PersonalId = @1
    `,[personalPrestamoId, personalId])
  }

  async listAyudaAsistencialQuery(queryRunner:any, filterSql:any, orderBy:any, anio:number, mes:number){
    return await queryRunner.query(`
      SELECT DISTINCT CONCAT(pres.PersonalPrestamoId,'-', per.PersonalId) id,
      CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, cuit.PersonalCUITCUILCUIT, pres.PersonalId, pres.PersonalPrestamoMonto,
      pres.PersonalPrestamoDia, IIF(pres.PersonalPrestamoAprobado='S',pres.PersonalPrestamoFechaAprobacion,null) PersonalPrestamoFechaAprobacion, pres.PersonalPrestamoCantidadCuotas,
      pres.PersonalPrestamoAplicaEl, form.FormaPrestamoId, form.FormaPrestamoDescripcion, IIF(pres.PersonalPrestamoLiquidoFinanzas=1,'1','0') PersonalPrestamoLiquidoFinanzas,
      pres.PersonalPrestamoAprobado,
      sit.SituacionRevistaDescripcion 
      FROM PersonalPrestamo pres
      LEFT JOIN Personal per ON per.PersonalId = pres.PersonalId 
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = pres.PersonalId 
      LEFT JOIN FormaPrestamo form ON form.FormaPrestamoId = pres.FormaPrestamoId

      LEFT JOIN PersonalSituacionRevista sitrev ON sitrev.PersonalId = per.PersonalId AND sitrev.PersonalSituacionRevistaDesde<=IIF(pres.PersonalPrestamoAprobado='S',pres.PersonalPrestamoFechaAprobacion,@2) AND  ISNULL(sitrev.PersonalSituacionRevistaHasta,'9999-12-31') >= IIF(pres.PersonalPrestamoAprobado='S',pres.PersonalPrestamoFechaAprobacion,@2)
      LEFT JOIN SituacionRevista sit ON sit.SituacionRevistaId = sitrev.PersonalSituacionRevistaSituacionId

      
      WHERE 
      (pres.PersonalPrestamoAprobado IS NULL
      OR DATEFROMPARTS(SUBSTRING(pres.PersonalPrestamoAplicaEl,4,4),SUBSTRING(pres.PersonalPrestamoAplicaEl,1,2),1) >= DATEFROMPARTS(@0,@1,1)
      )
      AND (${filterSql})
      ${orderBy}
    `,[anio, mes,new Date()])
  }

  async personalPrestamoCuotaAddCuotaQuery(
    queryRunner: any, personalPrestamoCuotaId:number, personalPrestamoId: number, personalId: number,
    anio:number, mes:number, importe:number
  ) {
    return await queryRunner.query(`
      INSERT PersonalPrestamoCuota (PersonalPrestamoCuotaId, PersonalPrestamoId, PersonalId,
      PersonalPrestamoCuotaAno, PersonalPrestamoCuotaMes, PersonalPrestamoCuotaCuota,
      PersonalPrestamoCuotaImporte, PersonalPrestamoCuotaMantiene,PersonalPrestamoCuotaFinaliza,
      PersonalPrestamoCuotaProceso)
      VALUES (@0,@1,@2,@3,@4,@0,@5,@6,@6,@7)
    `,[personalPrestamoCuotaId, personalPrestamoId, personalId, anio, mes, importe, 0, 'FA'])
  }

  async updateCuotaPersonalPrestamo(
    queryRunner: any, personalPrestamoId: number, personalId: number, ultCuota:number,  anio:number, mes:number
  ) {
    return await queryRunner.query(`
      UPDATE PersonalPrestamo
      SET PersonalPrestamoUltimaLiquidacion = CONCAT(FORMAT(@2,'00'),'/',@3,' Cuota ', @4), PersonalPrestamoCuotaUltNro = @4
      WHERE PersonalPrestamoId = @0 AND PersonalId = @1
    `, [personalPrestamoId, personalId, mes, anio, ultCuota]
    )
  }

  async getLigmamovimientosQuery(
    queryRunner:any, personalId:number, anio:number, mes:number, tipocuenta_id:string
  ){
    return await queryRunner.query(`
      SELECT *
      FROM lige.dbo.liqmamovimientos liqm
      LEFT JOIN lige.dbo.liqmaperiodo liqp ON liqp.periodo_id = liqm.periodo_id
      WHERE liqm.persona_id = @0 AND liqp.anio = @1 AND liqp.mes = @2 AND liqm.tipocuenta_id = @3
      `, [ personalId, anio, mes, tipocuenta_id])
  }

  async personalPrestamoListAddCuotaQuery(
    queryRunner:any, anio:number, mes:number
  ){
    return await queryRunner.query(`
      SELECT pp.PersonalPrestamoId, pp.PersonalId,
      CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre,
      ISNULL(pp.PersonalPrestamoCuotaUltNro, 0) AS PersonalPrestamoCuotaUltNro,
      ROUND(pp.PersonalPrestamoMontoAutorizado/pp.PersonalPrestamoCantidadCuotas, 2) AS PersonalPrestamoCuotaImporte
      -- pp.PersonalPrestamoAplicaEl, pp.PersonalPrestamoUltimaLiquidacion,
      FROM PersonalPrestamo pp
      LEFT JOIN Personal per ON per.PersonalId = pp.PersonalId 
      WHERE pp.PersonalPrestamoAprobado = 'S' AND pp.PersonalPrestamoCantidadCuotas > ISNULL(pp.PersonalPrestamoCuotaUltNro, 0)
      AND DATEADD(MONTH,  ISNULL(pp.PersonalPrestamoCuotaUltNro, 0),  DATEFROMPARTS(SUBSTRING(pp.PersonalPrestamoAplicaEl, 4, 4), SUBSTRING(pp.PersonalPrestamoAplicaEl, 1, 2), 1)) = DATEFROMPARTS(@0,@1,1)
      `, [ anio, mes])
  }

  async getGridColumns(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(columnsAyudaAsistencial, res)
  }

  async getAyudaAsistencialList(req: any, res: Response, next: NextFunction) {
    const anio = req.body.anio
    const mes = req.body.mes
    const options: Options = isOptions(req.body.options)? req.body.options : { filtros: [], sort: null };
    // if (options.filtros.length == 0) { 
    //   return this.jsonRes([], res);
    // }
    const filterSql = filtrosToSql(options.filtros, columnsAyudaAsistencial);
    const orderBy = orderToSQL(options.sort)
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction()

      let list = await this.listAyudaAsistencialQuery(queryRunner, filterSql, orderBy, anio, mes)
      
      await queryRunner.commitTransaction()
      return this.jsonRes(list, res);
    }catch (error) {
        this.rollbackTransaction(queryRunner)
        return next(error)
    } finally {
        await queryRunner.release()
    }
  }

  async updateRowPersonalPrestamo(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner()
    const ids = req.body.id.split('-')
    const personalPrestamoId = Number.parseInt(ids[0])
    const personalId = Number.parseInt(ids[1])
    const personalPrestamoAplicaEl = req.body.PersonalPrestamoAplicaEl
    const personalPrestamoCantidadCuotas = req.body.PersonalPrestamoCantidadCuotas
    const personalPrestamoMonto = req.body.PersonalPrestamoMonto
    try {
      await queryRunner.startTransaction()
      const periodo = this.valAplicaEl(personalPrestamoAplicaEl)
      if (!periodo)
        throw new ClientException('Aplica El no es válido')

      if (Number(personalPrestamoCantidadCuotas)<=0)
        throw new ClientException('Cantidad de cuotas debe ser mayor a 0')

      if (parseFloat(personalPrestamoMonto)<=0)
        throw new ClientException('El monto debe ser mayor a 0')


      
      const per = await this.getPeriodoQuery(queryRunner, periodo.anio, periodo.mes)
      if (per[0]?.ind_recibos_generados==1)
        throw new ClientException(`No se puede modificar el período ${periodo.mes}/${periodo.anio}, ya que tiene los recibos generados.`)
      
      let PersonalPrestamo = await this.getPersonalPrestamoByIdsQuery(queryRunner, personalPrestamoId, personalId)
      if (!PersonalPrestamo.length) 
        throw new ClientException('No se encuentra el registro.')
      PersonalPrestamo = PersonalPrestamo[0]

      if (PersonalPrestamo.PersonalPrestamoAprobado == 'S') {
        throw new ClientException('No se puede editar en estado APROBADO.')
      }

      await this.updateRowPersonalPrestamoQuery(queryRunner, personalPrestamoId, personalId, `${periodo.mes.toString().padStart(2,'0')}/${periodo.anio}`, personalPrestamoCantidadCuotas, personalPrestamoMonto)
      
      let row = await this.rowAyudaAsistencialQuery(queryRunner, personalPrestamoId, personalId)
      
      await queryRunner.commitTransaction()
      return this.jsonRes(row[0], res, 'Carga Exitosa');
    }catch (error) {
        this.rollbackTransaction(queryRunner)
        return next(error)
    } finally {
        await queryRunner.release()
    }
  }

  async personalPrestamoAprobar(queryRunner: any, personalPrestamoId: number, personalId: number) {

    let PersonalPrestamo = await this.getPersonalPrestamoByIdsQuery(queryRunner, personalPrestamoId, personalId)
    if (!PersonalPrestamo.length)
      return new ClientException('No se encuentra el registro.')
    PersonalPrestamo = PersonalPrestamo[0]

    // Validaciones
    const periodo = this.valAplicaEl(PersonalPrestamo.PersonalPrestamoAplicaEl)
    if (!periodo || !PersonalPrestamo.PersonalPrestamoCantidadCuotas || !PersonalPrestamo.PersonalPrestamoMonto) {
      return new ClientException('Verifiquen que Cant Cuotas e Importe sean mayores a 0 y que Aplica El sea un periodo valido.')
    }
      
    if (PersonalPrestamo.PersonalPrestamoAprobado != null) {
      return new ClientException('El registro NO puede ser APROBADO.')
    }
    let res = await this.getPeriodoQuery(queryRunner, periodo.anio, periodo.mes)
    if (res[0]?.ind_recibos_generados == 1)
      return new ClientException(`Ya se encuentran generados los recibos para el período ${periodo.anio}/${periodo.mes}`)

    const recibos = await this.getReciboQuery(queryRunner, personalId, periodo.anio, periodo.mes)
    if (recibos.length) 
      return new ClientException(`Ya existe un recibo para ${PersonalPrestamo.ApellidoNombre} del periodo ${PersonalPrestamo.PersonalPrestamoAplicaEl}`)

    await this.personalPrestamoAprobadoQuery(queryRunner, personalPrestamoId, personalId, PersonalPrestamo.PersonalPrestamoAplicaEl, PersonalPrestamo.PersonalPrestamoCantidadCuotas, PersonalPrestamo.PersonalPrestamoMonto)
      
    let row = await this.rowAyudaAsistencialQuery(queryRunner, personalPrestamoId, personalId)
    return row[0]
  }

  async personalPrestamoAprobarList(req: any, res: Response, next: NextFunction){
    const queryRunner = dataSource.createQueryRunner();
    const ids : string[] = req.body.ids
    const numRows : number[] = req.body.rows
    let errors : string[] = []
    try {
      await queryRunner.startTransaction()

      for (const [index, id] of ids.entries()) {
        const arrayIds = id.split('-')
        let personalPrestamoId = Number.parseInt(arrayIds[0])
        let personalId = Number.parseInt(arrayIds[1])
        let res = await this.personalPrestamoAprobar(queryRunner,personalPrestamoId,personalId)
        if (res instanceof ClientException) {
          errors.push(`FILA ${numRows[index]+1}: `+res.messageArr[0])
        }
      }

      if (errors.length) {
        throw new ClientException(errors.join(`\n`))
      }
      
      await queryRunner.commitTransaction()
      return this.jsonRes({}, res, 'Carga Exitosa');
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    }finally{
      await queryRunner.release()
    }
  }

  async personalPrestamoRechazar(queryRunner: any, personalPrestamoId: number, personalId: number) {
    let PersonalPrestamo = await this.getPersonalPrestamoByIdsQuery(queryRunner, personalPrestamoId, personalId)
    if (!PersonalPrestamo.length) 
      return new ClientException('No se encuentra el registro.')
    PersonalPrestamo = PersonalPrestamo[0]

    // Validaciones
    if(PersonalPrestamo.PersonalPrestamoAprobado != 'S' &&  PersonalPrestamo.PersonalPrestamoAprobado != null)
      return new ClientException('El registro NO puede ser RECHAZADO.')
    if(PersonalPrestamo.PersonalPrestamoLiquidoFinanzas)
      return new ClientException('El registro ya se envió al banco.')
    if (PersonalPrestamo.PersonalPrestamoAplicaEl.length) {
      let cuotas = await this.getPersonalPrestamoCuotasByIdsQuery(queryRunner, personalPrestamoId, personalId)
      if(cuotas.length){
        for (const cuota of cuotas) {
          const recibos = await this.getReciboQuery(queryRunner, personalId, cuota.anio, cuota.mes)
          if (recibos.length) 
            return new ClientException(`Existe un recibo del período ${cuota.anio}/${cuota.mes} de este registro`)
        }
      }
    }
      
    await this.personalPrestamoRechazadoQuery(queryRunner, personalPrestamoId, personalId)
    await this.deletePersonalPrestamoCuotasQuery(queryRunner, personalPrestamoId, personalId)
      
    let row = await this.rowAyudaAsistencialQuery(queryRunner, personalPrestamoId, personalId)

    return row[0]
  }

  async personalPrestamoRechazarList(req: any, res: Response, next: NextFunction){
    const queryRunner = dataSource.createQueryRunner();
    const ids : string[] = req.body.ids
    const numRows : number[] = req.body.rows
    let errors : string[] = []
    try {
      await queryRunner.startTransaction()

      for (const [index, id] of ids.entries()) {
        const arrayIds = id.split('-')
        let personalPrestamoId = Number.parseInt(arrayIds[0])
        let personalId = Number.parseInt(arrayIds[1])
        
        let res = await this.personalPrestamoRechazar(queryRunner,personalPrestamoId,personalId)
        if (res instanceof ClientException) {
          errors.push(`FILA ${numRows[index]+1}: `+res.messageArr[0])
        }
      }
      
      if (errors.length) {
        throw new ClientException(errors.join(`\n`))
      }
      
      await queryRunner.commitTransaction()
      return this.jsonRes({}, res, 'Carga Exitosa');
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    }finally{
      await queryRunner.release()
    }
  }

  async personalPrestamoCuotaAddCuota(
    queryRunner: any, personalPrestamoId: number, personalId: number, anio:number, mes:number,
    importeCuota:number, ultCuota:number, apellidoNombre:string
  ) {
    ultCuota++

    let cuota = await this.getPersonalPrestamoCuotaByPeriodoQuery(queryRunner, personalPrestamoId, personalId, anio, mes)
    if (cuota.length) {
      return new ClientException(`La cuota para ${apellidoNombre} del período ${anio}/${mes} ya existe.`)
    }
    
    let ligm = await this.getLigmamovimientosQuery(queryRunner, personalId, anio, mes, 'G')
    if (!ligm.length) {
      return new ClientException(`${apellidoNombre} no tiene disponibilidad de su cuenta.`)
    }

    await this.personalPrestamoCuotaAddCuotaQuery(queryRunner, ultCuota, personalPrestamoId, personalId, anio, mes, importeCuota)
    await this.updateCuotaPersonalPrestamo(queryRunner, personalPrestamoId, personalId, ultCuota, anio, mes)
    
    return
  }

  async personalPrestamoListAddCuota(req: any, res: Response, next: NextFunction){
    const queryRunner = dataSource.createQueryRunner();
    const anio : number = req.body.year
    const mes : number = req.body.month
    let errors : string[] = []
    try {
      const per = await this.getPeriodoQuery(queryRunner, anio, mes)
      if (per[0]?.ind_recibos_generados == 1)
        return new ClientException(`Ya se encuentran generados los recibos para el período ${anio}/${mes}.`)
      const list = await this.personalPrestamoListAddCuotaQuery(queryRunner, anio, mes)
      
      for (const obj of list) {
        let res = await this.personalPrestamoCuotaAddCuota(
          queryRunner, obj.PersonalPrestamoId, obj.PersonalId, anio, mes,
          obj.PersonalPrestamoCuotaImporte, obj.PersonalPrestamoCuotaUltNro, obj.ApellidoNombre
        )
        if (res instanceof ClientException) {
          errors.push(res.messageArr[0])
        }
      }

      // if (errors.length) {
      //   throw new ClientException(errors.join(`\n`))
      // }

      await queryRunner.commitTransaction()
      return this.jsonRes({}, res, 'Carga Exitosa');
    }catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  getTipoPrestamo(req: any, res: Response, next: NextFunction){
    return this.jsonRes(optionsSelect, res)
  }

  getEstadoPrestamo(req: any, res: Response, next: NextFunction){
    return this.jsonRes(getOptionsPersonalPrestamoAprobado, res)
  }

  valAplicaEl(date:string):any{
    if (date == null) {
        return null
    }
    const periodo = date.split('/')
    if (periodo.length != 2) {
        return null
    }
    const mes = Number.parseInt(periodo[0])
    const anio = Number.parseInt(periodo[1])
    if (Number.isNaN(mes) || mes > 12 || mes < 1 || Number.isNaN(anio) || anio < 2000) {
        return null
    }
    return {anio, mes}
  }

  async addPersonalPrestamo(req: any, res: Response, next: NextFunction){
    const queryRunner = dataSource.createQueryRunner();
    const personalId = req.body.personalId
    const formaId = req.body.formaId
    const anio = req.body.aplicaEl.getFullYear()
    const mes = req.body.aplicaEl.getMonth()+1
    const importe = req.body.importe
    const cantCuotas = req.body.cantCuotas
    const ip = req.socket.remoteAddress
    try {
      await queryRunner.startTransaction()

      if (!formaId) throw new ClientException("Falta cargar el Tipo.");
      if (!personalId) throw new ClientException("Falta cargar la Persona.");

      const forma = optionsSelect.find((obj:any)=>{ obj.value == formaId })

      const checkrecibos = await this.getPeriodoQuery(queryRunner, anio, mes)
  
      if (checkrecibos[0]?.ind_recibos_generados ==1)
        throw new ClientException(`Ya se encuentran generados los recibos para el período ${anio}/${mes}, no se puede generar ${forma.label} para el período`)
  

      const aplicaEl = `${String(mes).padStart(2, '0')}/${String(anio).padStart(4, '0')}`
      
      const presPend = await queryRunner.query(`
        SELECT pre.PersonalPrestamoId 
        FROM PersonalPrestamo pre 
        WHERE pre.PersonalId = @0 AND pre.PersonalPrestamoAprobado = 'S' AND pre.PersonalPrestamoLiquidoFinanzas = 0 AND pre.FormaPrestamoId =@1`,
        [personalId,formaId]
      )
      if (presPend.length>0)
        throw new ClientException(`Ya se encuentra generado, aprobado y pendiente de acreditar en cuenta.  No se puede solicitar nuevo ${forma.label}.`)


      const adelantoExistente = await queryRunner.query(
        `DELETE From PersonalPrestamo 
        WHERE PersonalPrestamoAprobado IS NULL
        AND FormaPrestamoId = @1
        AND PersonalId = @0`,
        [personalId, formaId]
      );
      const now = new Date()
      const hora = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
      let today = now
      today.setHours(0, 0, 0, 0)

      if (importe > 0) {
        const prestamoId = Number((await queryRunner.query(`
          SELECT per.PersonalPrestamoUltNro as max 
          FROM Personal per WHERE per.PersonalId = @0`,
          [personalId]
        ))[0].max) + 1;

        const result = await queryRunner.query(
          `INSERT INTO PersonalPrestamo (PersonalPrestamoId, PersonalId, PersonalPrestamoMonto, FormaPrestamoId, 
          PersonalPrestamoAprobado, PersonalPrestamoFechaAprobacion, PersonalPrestamoCantidadCuotas, PersonalPrestamoAplicaEl, 
          PersonalPrestamoLiquidoFinanzas, PersonalPrestamoUltimaLiquidacion, PersonalPrestamoCuotaUltNro, PersonalPrestamoMontoAutorizado, 
          -- PersonalPrestamoJerarquicoId, PersonalPrestamoPuesto, PersonalPrestamoUsuarioId,
          PersonalPrestamoDia, PersonalPrestamoTiempo)
          VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11,
          -- @12, @13, @14,
          @15, @16)`,
          [
            prestamoId, //PersonalPrestamoId
            personalId, //PersonalId
            importe, //PersonalPrestamoMonto
            formaId, //FormaPrestamoId = 7 Adelanto / 1 Ayuda Asistencial

            null, //PersonalPrestamoAprobado
            null, //PersonalPrestamoFechaAprobacion
            cantCuotas,  //PersonalPrestamoCantidadCuotas
            aplicaEl, //PersonalPrestamoAplicaEl

            null, //PersonalPrestamoLiquidoFinanzas
            "", //PersonalPrestamoUltimaLiquidacion
            null, //PersonalPrestamoCuotaUltNro
            0, //PersonalPrestamoMontoAutorizado

            null, //PersonalPrestamoJerarquicoId
            ip, //PersonalPrestamoPuesto
            null, //PersonalPrestamoUsuarioId

            today, //PersonalPrestamoDia
            hora, //PersonalPrestamoTiempo  

          ]
        );

        const resultAdelanto = await queryRunner.query(
          `UPDATE Personal SET PersonalPrestamoUltNro=@1 WHERE PersonalId=@0 `,
          [personalId, prestamoId]
        );

      }
      
      await queryRunner.commitTransaction()
      return this.jsonRes({}, res, 'Carga Exitosa');
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    }finally{
      await queryRunner.release()
    }
  }

}