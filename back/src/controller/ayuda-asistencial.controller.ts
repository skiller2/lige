import { NextFunction, Response } from "express";
import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";

const getOptions: any[] = [
    { label: 'Si', value: true },
    { label: 'No', value: false },
    { label: 'Indeterminado', value: null }
]

const columnsAyudaAsistencial: any[] = [
    {
      id: "cuit",
      name: "CUIT",
      field: "PersonalCUITCUILCUIT",
      type: "string",
      fieldName: "cuit.PersonalCUITCUILCUIT",
      sortable: true,
      searchHidden: false
    },
    {
      id: "apellidoNombre",
      name: "Apellido Nombre",
      field: "apellidoNombre",
      type: "string",
      fieldName: "per.PersonalId",
      searchComponent: "inpurformersonalSearch",
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
      name: "Tipo de Prestamo",
      type: "string",
      field: "FormaPrestamoDescripcion",
      fieldName: "form.FormaPrestamoDescripcion",
      searchType: "string",
      sortable: true,
      searchHidden: false
    },
    {
      id: "tipoId",
      name: "TipoId",
      type: "number",
      field: "FormaPrestamoId",
      fieldName: "form.FormaPrestamoId",
      searchType: "number",
      sortable: true,
      searchHidden: false,
      hidden: true
    },
    {
      id: "liquidoFinanzas",
      name: "Liquido Finanzas",
      type: "boolean",
      field: "PersonalPrestamoLiquidoFinanzas",
      fieldName: "pre.PersonalPrestamoLiquidoFinanzas",
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
      fieldName: "pre.PersonalPrestamoDia",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      id: "PersonalPrestamoFechaAprobacion",
      name: "Fecha Aprobado",
      field: "PersonalPrestamoFechaAprobacion",
      type: "date",
      fieldName: "pre.PersonalPrestamoFechaAprobacion",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      id: "PersonalPrestamoAplicaEl",
      name: "Aplica El",
      type: "string",
      field: "PersonalPrestamoAplicaEl",
      fieldName: "pre.PersonalPrestamoAplicaEl",
      searchType: "string",
      sortable: true,
      searchHidden: false
    },
    {
      id: "PersonalPrestamoCantidadCuotas",
      name: "Cant Cuotas",
      type: "number",
      field: "PersonalPrestamoCantidadCuotas",
      fieldName: "pre.PersonalPrestamoCantidadCuotas",
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
      fieldName: "pre.PersonalPrestamoMonto",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
];

export class AyudaAsistencialController extends BaseController {

  async personalPrestamoRechazadoQuery(queryRunner:any, personalPrestamoId:number, personalId:number){
    const PersonalPrestamoAprobado = 'N'
    const PersonalPrestamoAplicaEl = ''
    const PersonalPrestamoCantidadCuotas= 0
    const PersonalPrestamoMontoAutorizado = 0
    const PersonalPrestamoFechaAprobacion = null
    return await queryRunner.query(`
      UPDATE PersonalPrestamo
      SET PersonalPrestamoAprobado = @2, PersonalPrestamoAplicaEl = @3, PersonalPrestamoCantidadCuotas = @4,
      PersonalPrestamoMontoAutorizado = @5, PersonalPrestamoFechaAprobacion = @6
      WHERE PersonalPrestamoId = @0 AND PersonalId = @1
    `, [personalPrestamoId, personalId, PersonalPrestamoAprobado,PersonalPrestamoAplicaEl,PersonalPrestamoCantidadCuotas,PersonalPrestamoMontoAutorizado,PersonalPrestamoFechaAprobacion])
  }

  async deletePersonalPrestamoCuotasQuery(
    queryRunner:any, personalPrestamoId:number, personalId:number
  ){
    return await queryRunner.query(`
      DELETE FROM PersonalPrestamoCuota ppc
      WHERE ppr.PersonalPrestamoId = @0 AND ppr.PersonalId = @1
    `, [personalPrestamoId, personalId])
  }

  async getPersonalPrestamoByIdQuery(queryRunner:any, personalPrestamoId:number, personalId:number){
    return await queryRunner.query(`
      SELECT *
      FROM PersonalPrestamo pres
      WHERE pres.PersonalPrestamoId = @0 AND pres.PersonalId = @1
      `, [personalPrestamoId, personalId])
  }

  async getPersonalPrestamoCuotaByPeriodoQuery(
    queryRunner:any, personalPrestamoId:number, personalId:number, personalPrestamoAplicaEl:string
  ){
    const periodo = personalPrestamoAplicaEl.split('/')
    const mes = periodo[0]
    const anio = periodo[1]
    return await queryRunner.query(`
      SELECT *
      FROM PersonalPrestamoCuota ppc
      WHERE ppc.PersonalPrestamoId = @0 AND ppc.PersonalId = @1 AND ppc.PersonalPrestamoCuotaAno = @2 AND ppc.PersonalPrestamoCuotaAno = @3
      `, [personalPrestamoId, personalId, anio, mes])
  }

  async getReciboByPeriodoQuery(queryRunner:any, PersonalId:number, PersonalPrestamoAplicaEl:string){
    const periodo = PersonalPrestamoAplicaEl.split('/')
    const mes = periodo[0]
    const anio = periodo[1]
    return await queryRunner.query(`
      SELECT *
      FROM lige.dbo.liqmamovimientos liq
      LEFT JOIN lige.dbo.liqmaperiodo liqp per ON liqp.periodo_id = liq.periodo_id
      WHERE liq.PersonalId = @0 AND liqp.anio = @1 AND liqp.mes = @2
      `, [PersonalId, anio, mes])
  }

  async listAyudaAsistencialQuery(queryRunner:any, filterSql:any, orderBy:any, anio:number, mes:number){
    return await queryRunner.query(`
      SELECT DISTINCT CONCAT(pres.PersonalPrestamoId,'-', per.PersonalId) id,
      TRIM(per.PersonalApellidoNombre) apellidoNombre, cuit.PersonalCUITCUILCUIT, pres.PersonalId, pres.PersonalPrestamoMonto,
      pres.PersonalPrestamoDia, pres.PersonalPrestamoFechaAprobacion, pres.PersonalPrestamoCantidadCuotas,
      pres.PersonalPrestamoAplicaEl, form.FormaPrestamoId, form.FormaPrestamoDescripcion, pres.PersonalPrestamoLiquidoFinanzas
      FROM PersonalPrestamo pres
      LEFT JOIN Personal per ON per.PersonalId = pres.PersonalId 
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = pres.PersonalId 
      LEFT JOIN FormaPrestamo form ON form.FormaPrestamoId = pres.FormaPrestamoId
      WHERE (pres.PersonalPrestamoFechaProceso BETWEEN DATEFROMPARTS(@0, @1, 1) AND EOMONTH(DATEFROMPARTS(@0, @1, 1)))
      -- OR (pres.PersonalPrestamoAplicaEl IS NULL AND pres.PersonalPrestamoAprobado IS NULL)
      AND (${filterSql})
      ${orderBy}
    `,[anio, mes])
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

  async personalPrestamoAprobado(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const ids = req.body.id.split('-')
    const PersonalPrestamoId = ids[0]
    const PersonalId = ids[1]
    try {
      await queryRunner.startTransaction()
      let PersonalPrestamo = await this.getPersonalPrestamoByIdQuery(queryRunner, PersonalPrestamoId, PersonalId)
      if (!PersonalPrestamo.length) 
        throw new ClientException('El registro NO existe')
      PersonalPrestamo = PersonalPrestamo[0]

      // Validaciones

      await queryRunner.commitTransaction()
      return this.jsonRes([], res, 'Carga Exitosa');
    }catch (error) {
        this.rollbackTransaction(queryRunner)
        return next(error)
    } finally {
        await queryRunner.release()
    }
  }

  async personalPrestamoRechazado(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    const ids = req.body.id.split('-')
    const personalPrestamoId = ids[0]
    const personalId = ids[1]
    try {
      await queryRunner.startTransaction()
      let PersonalPrestamo = await this.getPersonalPrestamoByIdQuery(queryRunner, personalPrestamoId, personalId)
      if (!PersonalPrestamo.length) 
        throw new ClientException('El registro NO existe')
      PersonalPrestamo = PersonalPrestamo[0]

      // Validaciones
      if(PersonalPrestamo.PersonalPrestamoAprobado != 'S' &&  PersonalPrestamo.PersonalPrestamoAprobado != null)
        return new ClientException('El registro NO puede ser RECHAZADO.')
      if(PersonalPrestamo.PersonalPrestamoLiquidoFinanzas)
        return new ClientException('El registro ya se envió al banco.')
      if (PersonalPrestamo.PersonalPrestamoAplicaEl.length) {
        const PersonalPrestamoAplicaEl = PersonalPrestamo.PersonalPrestamoAplicaEl
        let cuota = await this.getReciboByPeriodoQuery(queryRunner, personalId, PersonalPrestamoAplicaEl)
        if (cuota.length) {
          return new ClientException('Existe un recibo de este registro')
        }
      }

      await this.personalPrestamoRechazadoQuery(queryRunner, personalPrestamoId, personalId)
      // await this.deletePersonalPrestamoCuotasQuery(queryRunner, personalPrestamoId, personalId)

      await queryRunner.commitTransaction()
      return this.jsonRes([], res, 'Carga Exitosa');
    }catch (error) {
        this.rollbackTransaction(queryRunner)
        return next(error)
    } finally {
        await queryRunner.release()
    }
  }

}