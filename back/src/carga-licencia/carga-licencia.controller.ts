import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, getOptionsFromRequest } from "../impuestos-afip/filtros-utils/filtros";
import { NextFunction, Request, Response, query } from "express";
import { ObjetivoController } from "src/controller/objetivo.controller";
import { AsistenciaController } from "../controller/asistencia.controller";
import { mkdirSync, renameSync, existsSync, readFileSync, unlinkSync, copyFileSync } from "fs";
import { Utils } from "./../liquidaciones/liquidaciones.utils";
import { Collection, IsNull } from "typeorm";
import { QueryRunner } from "typeorm";
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { FileUploadController } from "../controller/file-upload.controller"

const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);

const getOptions: any[] = [
  { label: 'Si', value: 'S' },
  { label: 'No', value: 'N' },
  { label: 'Indeterminado', value: null }
]

const columnasGrilla: any[] = [

  {
    name: "id",
    type: "number",
    id: "id",
    field: "id",
    fieldName: "id",
    hidden: true,
    searchHidden: true,
    sortable: true
  },
  {
    name: "Sucursal",
    type: "number",
    id: "SucursalId",
    field: "SucursalId",
    fieldName: "SucursalId",
    searchComponent: "inpurForSucursalSearch",
    hidden: true,
    searchHidden: false,
    sortable: true
  },
  {
    name: "Sucursal",
    type: "string",
    id: "SucursalDescripcion",
    field: "SucursalDescripcion",
    fieldName: "suc.SucursalDescripcion",
    hidden: false,
    searchHidden: true,
    sortable: true
  },
  {
    name: "PersonalLicenciaAplicaPeriodoAplicaEl",
    type: "string",
    id: "PersonalLicenciaAplicaPeriodoAplicaEl",
    field: "PersonalLicenciaAplicaPeriodoAplicaEl",
    fieldName: "licimp.PersonalLicenciaAplicaPeriodoAplicaEl",
    hidden: true,
    searchHidden: true,
    sortable: true
  },
  {
    name: "anio",
    type: "number",
    id: "anio",
    field: "anio",
    fieldName: "anio",
    hidden: true,
    searchHidden: true,
    sortable: true
  },
  {
    name: "mes",
    type: "number",
    id: "mes",
    field: "mes",
    fieldName: "mes",
    hidden: true,
    searchHidden: true,
    sortable: true
  },
  {
    name: "Apellido y Nombre",
    type: "string",
    id: "NombreCompleto",
    field: "NombreCompleto",
    fieldName: "persona.PersonalId",
    searchComponent: "inpurForPersonalSearch",
    hidden: false,
    searchHidden: false,
    sortable: true
  },
  {
    name: "PersonalLicenciaAplicaPeriodoHorasMensuales",
    type: "number",
    id: "PersonalLicenciaAplicaPeriodoHorasMensuales",
    field: "PersonalLicenciaAplicaPeriodoHorasMensuales",
    fieldName: "licimp.PersonalLicenciaAplicaPeriodoHorasMensuales",
    hidden: true,
    searchHidden: true,
    sortable: true
  },
  {
    name: "ValorLiquidacionHoraNormal",
    type: "currency",
    id: "ValorLiquidacionHoraNormal",
    field: "ValorLiquidacionHoraNormal",
    fieldName: "val.ValorLiquidacionHoraNormal",
    hidden: true,
    searchHidden: true,
    sortable: true
  },
  {
    name: "Total",
    type: "number",
    id: "PersonalLicenciaAplicaPeriodoHorasMensuales",
    field: "PersonalLicenciaAplicaPeriodoHorasMensuales",
    fieldName: "licimp.PersonalLicenciaAplicaPeriodoHorasMensuales",
    hidden: true,
    searchHidden: true,
    sortable: true
  },
  {
    name: "Tipo Inasistencia",
    type: "strng",
    id: "TipoInasistenciaDescripcion",
    field: "TipoInasistenciaDescripcion",
    fieldName: "tli.TipoInasistenciaDescripcion",
    hidden: false,
    searchHidden: true,
    sortable: true
  },
  {
    name: "Inasistencia Apartado",
    type: "number",
    id: "TipoInasistenciaApartado",
    field: "TipoInasistenciaApartado",
    fieldName: "tli.TipoInasistenciaApartado",
    hidden: true,
    searchHidden: true,
    sortable: true
  },
  {
    name: "Fecha",
    type: "date",
    id: "PersonalLicenciaDesde",
    field: "PersonalLicenciaDesde",
    fieldName: "lic.PersonalLicenciaDesde",
    searchComponent: "inpurForFechaSearch",
    hidden: false,
    searchHidden: false,
    sortable: true
  },
  {
    name: "Hasta",
    type: "date",
    id: "PersonalLicenciaHasta",
    field: "PersonalLicenciaHasta",
    fieldName: "ISNULL(lic.PersonalLicenciaHasta,lic.PersonalLicenciaTermina)",
    searchComponent: "inpurForFechaSearch",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    name: "Categoria",
    type: "string",
    id: "CategoriaPersonalDescripcion",
    field: "CategoriaPersonalDescripcion",
    fieldName: "cat.CategoriaPersonalDescripcion",
    hidden: false,
    searchHidden: false,
    sortable: true
  },
  {
    name: "Observacion",
    type: "string",
    id: "PersonalLicenciaObservacion",
    field: "PersonalLicenciaObservacion",
    fieldName: "lic.PersonalLicenciaObservacion",
    hidden: false,
    searchHidden: true,
    sortable: true
  },
  {
    name: "Diagnostico Medico",
    type: "string",
    id: "PersonalLicenciaDiagnosticoMedicoDiagnostico",
    field: "PersonalLicenciaDiagnosticoMedicoDiagnostico",
    fieldName: "med.PersonalLicenciaDiagnosticoMedicoDiagnostico",
    hidden: false,
    searchHidden: true,
    sortable: true
  },
  {
    name: "Se Paga",
    id: "PersonalLicenciaSePaga",
    field: "PersonalLicenciaSePaga",
    fieldName: "lic.PersonalLicenciaSePaga",
    formatter: 'collectionFormatter',
    exportWithFormatter: true,
    params: { collection: getOptions, },
    type: 'string',
    searchComponent: "inpurForSePaga",
    hidden: false,
    searchHidden: false,
    sortable: true
  },
  {
    name: "PersonalLicenciaDiagnosticoMedicoFechaDiagnostico",
    type: "date",
    id: "PersonalLicenciaDiagnosticoMedicoFechaDiagnostico",
    field: "PersonalLicenciaDiagnosticoMedicoFechaDiagnostico",
    fieldName: "med.PersonalLicenciaDiagnosticoMedicoFechaDiagnostico",
    hidden: true,
    searchHidden: true,
    sortable: true
  }
];

const columnasGrillaHistory: any[] = [

  {
    name: "id",
    type: "number",
    id: "id",
    field: "id",
    fieldName: "id",
    hidden: true,
    searchHidden: true,
    sortable: true
  },
  {
    name: "Tipo Inasistencia",
    type: "strng",
    id: "TipoInasistenciaDescripcion",
    field: "TipoInasistenciaDescripcion",
    fieldName: "tli.TipoInasistenciaDescripcion",
    hidden: false,
    searchHidden: true,
    sortable: true
  },
  {
    name: "Desde",
    type: "date",
    id: "PersonalLicenciaDesde",
    field: "PersonalLicenciaDesde",
    fieldName: "lic.PersonalLicenciaDesde",
    searchComponent: "inpurForFechaSearch",
    hidden: false,
    searchHidden: false,
    sortable: true
  },
  {
    name: "Hasta",
    type: "date",
    id: "PersonalLicenciaHasta",
    field: "PersonalLicenciaHasta",
    fieldName: "ISNULL(lic.PersonalLicenciaHasta,lic.PersonalLicenciaTermina)",
    searchComponent: "inpurForFechaSearch",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    name: "Diagnostico Medico",
    type: "string",
    id: "PersonalLicenciaDiagnosticoMedicoDiagnostico",
    field: "PersonalLicenciaDiagnosticoMedicoDiagnostico",
    fieldName: "med.PersonalLicenciaDiagnosticoMedicoDiagnostico",
    hidden: false,
    searchHidden: true,
    sortable: true
  },
  {
    name: "Se Paga",
    id: "PersonalLicenciaSePaga",
    field: "PersonalLicenciaSePaga",
    fieldName: "lic.PersonalLicenciaSePaga",
    formatter: 'collectionFormatter',
    exportWithFormatter: true,
    params: { collection: getOptions, },
    type: 'string',
    searchComponent: "inpurForSePaga",
    hidden: false,
    searchHidden: false,
    sortable: true
  }
];

const columnasGrillaHoras: any[] = [

  {
    name: "id",
    type: "number",
    id: "id",
    field: "id",
    fieldName: "id",
    hidden: true,
    searchHidden: true,
    sortable: true
  },
  {
    name: "Sucursal",
    type: "number",
    id: "SucursalId",
    field: "SucursalId",
    fieldName: "SucursalId",
    searchComponent: "inpurForSucursalSearch",
    hidden: true,
    searchHidden: false,
    sortable: true
  },
  {
    name: "Sucursal",
    type: "string",
    id: "SucursalDescripcion",
    field: "SucursalDescripcion",
    fieldName: "suc.SucursalDescripcion",
    searchHidden: true,
    hidden: false,
    sortable: true
  },
  {
    name: "Apellido y Nombre",
    type: "string",
    id: "NombreCompleto",
    field: "NombreCompleto",
    fieldName: "persona.PersonalId",
    searchComponent: "inpurForPersonalSearch",
    hidden: false,
    searchHidden: false,
    sortable: true
  },
  {
    name: "Desde",
    type: "date",
    id: "PersonalLicenciaDesde",
    field: "PersonalLicenciaDesde",
    fieldName: "lic.PersonalLicenciaDesde",
    searchComponent: "inpurForFechaSearch",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    name: "Hasta",
    type: "date",
    id: "PersonalLicenciaHasta",
    field: "PersonalLicenciaHasta",
    fieldName: "ISNULL(lic.PersonalLicenciaHasta,lic.PersonalLicenciaTermina)",
    searchComponent: "inpurForFechaSearch",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    name: "TipoInasistenciaId",
    type: "string",
    id: "TipoInasistenciaId",
    field: "TipoInasistenciaId",
    fieldName: "TipoInasistenciaId",
    searchHidden: true,
    hidden: true,
    sortable: true
  },
  {
    name: "Tipo Inasistencia",
    type: "string",
    id: "TipoInasistenciaDescripcion",
    field: "TipoInasistenciaDescripcion",
    fieldName: "TipoInasistenciaDescripcion",
    searchHidden: true,
    hidden: false,
    sortable: true
  },
  {
    name: "PersonalLicencia Id",
    type: "number",
    id: "PersonalLicenciaId",
    field: "PersonalLicenciaId",
    fieldName: "PersonalLicenciaId",
    searchHidden: true,
    hidden: true,
    sortable: true
  },
  {
    name: "Periodo",
    type: "string",
    id: "PersonalLicenciaAplicaPeriodoAplicaEl",
    field: "PersonalLicenciaAplicaPeriodoAplicaEl",
    fieldName: "PersonalLicenciaAplicaPeriodoAplicaEl",
    searchHidden: true,
    hidden: true,
    sortable: true
  },
  {
    name: "PeriodoSucursalId",
    type: "number",
    id: "PersonalLicenciaAplicaPeriodoSucursalId",
    field: "PersonalLicenciaAplicaPeriodoSucursalId",
    fieldName: "PersonalLicenciaAplicaPeriodoSucursalId",
    searchHidden: true,
    hidden: true,
    sortable: true
  },
  {
    name: "Personal Licencia SePaga",
    type: "string",
    id: "PersonalLicenciaSePaga",
    field: "PersonalLicenciaSePaga",
    fieldName: "PersonalLicenciaSePaga",
    searchHidden: true,
    hidden: true,
    sortable: true
  },
  {
    name: "Horas período",
    type: "number",
    id: "PersonalLicenciaAplicaPeriodoHorasMensuales",
    field: "PersonalLicenciaAplicaPeriodoHorasMensuales",
    fieldName: "PersonalLicenciaAplicaPeriodoHorasMensuales",
    searchHidden: true,
    hidden: false,
    sortable: true
  },
  {
    name: "Total Valor Liquidacion",
    type: "currency",
    id: "total",
    field: "total",
    fieldName: "total",
    searchHidden: true,
    hidden: false,
    sortable: true

  },
  {
    name: "PersonalLicenciaAplicaPeriodo",
    type: "number",
    id: "PersonalLicenciaAplicaPeriodo",
    field: "PersonalLicenciaAplicaPeriodo",
    fieldName: "PersonalLicenciaAplicaPeriodo",
    searchHidden: true,
    hidden: true,
    sortable: true
  },
];


export class CargaLicenciaController extends BaseController {


  async getGridCols(req, res) {
    this.jsonRes(columnasGrilla, res);
  }

  async getGridColsHistory(req, res) {
    this.jsonRes(columnasGrillaHistory, res);
  }

  async getGridColsHoras(req, res) {
    this.jsonRes(columnasGrillaHoras, res);
  }

  async getOptions(req, res) {
    this.jsonRes(getOptions, res);
  }

  async list(
    req: any,
    res: Response,
    next: NextFunction
  ) {

    const filterSql = filtrosToSql(req.body.filters["options"].filtros, columnasGrilla);

    const anio = Number(req.body.anio)
    const mes = Number(req.body.mes)
    const queryRunner = dataSource.createQueryRunner();

    try {

      const listCargaLicencia = await AsistenciaController.getAsistenciaAdminArt42(anio, mes, queryRunner, [], filterSql, false, false)
      this.jsonRes(
        {
          total: listCargaLicencia.length,
          list: listCargaLicencia,
        },
        res
      );

    } catch (error) {
      return next(error)
    }
  }

  async listHistory(
    req: any,
    res: Response,
    next: NextFunction
  ) {

    const filterSql = filtrosToSql(req.body.filters["options"].filtros, columnasGrilla);
    //const orderBy = orderToSQL(req.body.options.sort)
    let fechaActual = new Date()
    const anio = Number(fechaActual.getFullYear())
    const mes = Number(fechaActual.getMonth() + 1)
    const personalId = isNaN(Number(req.body.personalId)) ? 0 : Number(req.body.personalId)
    const queryRunner = dataSource.createQueryRunner();
    const perosnalIdarray = [personalId];
    try {

      const listCargaLicenciaHistory = await AsistenciaController.getAsistenciaAdminArt42(anio, mes, queryRunner, perosnalIdarray, filterSql, false, true)
      this.jsonRes(
        {
          total: listCargaLicenciaHistory.length,
          list: listCargaLicenciaHistory,
        },
        res
      );

    } catch (error) {
      return next(error)
    }
  }

  addDays(date: Date, days: number) {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    return newDate;
  }

  async listHoras(
    req: any,
    res: Response,
    next: NextFunction
  ) {

    const filterSql = filtrosToSql(req.body.filters["options"].filtros, columnasGrilla);
    //const orderBy = orderToSQL(req.body.options.sort)
    const anio = Number(req.body.anio)
    const mes = Number(req.body.mes)

    try {

      let queryRunner = dataSource.createQueryRunner();
      const listHorasLicencia = await AsistenciaController.getAsistenciaAdminArt42(anio, mes, queryRunner, [], filterSql, true, false)
      this.jsonRes(
        {
          total: listHorasLicencia.length,
          list: listHorasLicencia,
        },
        res
      );

    } catch (error) {
      return next(error)
    }
  }

  async setLicencia(req: Request, res: Response, next: NextFunction) {

    let {
      SucursalId,
      PersonalLicenciaId,
      PersonalId,
      TipoInasistenciaId,
      categoria,
      PersonalLicenciaSePaga,
      PersonalLicenciaHorasMensuales,
      PersonalLicenciaObservacion,
      PersonalLicenciaTipoAsociadoId,
      PersonalLicenciaCategoriaPersonalId,
      IsEdit,
      anioRequest,
      mesRequest,
      Archivos,
      PersonalIdForEdit,
      PersonalLicenciaDiagnosticoMedicoDiagnostico,
      PersonalLicenciaAplicaPeriodoHorasMensuales

    } = req.body

    const usuario = res.locals.userName;
    const ip = this.getRemoteAddress(req);
    let PersonalSituacionRevistaHastaNuevo: Date = null
    const queryRunner = dataSource.createQueryRunner();
    try {

      await queryRunner.connect();
      await queryRunner.startTransaction();


      if (PersonalLicenciaSePaga == null || PersonalLicenciaSePaga == "N") {
        if (PersonalLicenciaAplicaPeriodoHorasMensuales != null && PersonalLicenciaAplicaPeriodoHorasMensuales > 0) {
          throw new ClientException(`No puede modificar el se paga ya que tiene horas cargadas`)
        }
      }

      if (req.body.PersonalLicenciaDesde == null || req.body.PersonalLicenciaDesde == "")
        throw new ClientException(`Debe seleccionar la fecha desde`)

      let PersonalLicenciaHasta

      if (req.body.PersonalLicenciaHasta != null && req.body.PersonalLicenciaHasta != "") {
        PersonalLicenciaHasta = new Date(req.body.PersonalLicenciaHasta)
        PersonalLicenciaHasta.setHours(0, 0, 0, 0)
      } else {
        PersonalLicenciaHasta = null
      }

      const PersonalLicenciaDesde = new Date(req.body.PersonalLicenciaDesde)
      PersonalLicenciaDesde.setHours(0, 0, 0, 0)

      //if (isNaN(PersonalLicenciaHasta.getTime()))
      //PersonalLicenciaHasta = null
      if (PersonalLicenciaHasta != null && PersonalLicenciaHasta < PersonalLicenciaDesde)
        throw new ClientException(`La fecha Desde no puede ser mayor a la fecha Hasta`)

      if (PersonalLicenciaSePaga == "S") {
        if (!PersonalLicenciaCategoriaPersonalId)
          throw new ClientException(`Debe seleccionar categoría`)
      }

      if (PersonalId == "")
        throw new ClientException(`Debe seleccionar una persona`)

      if (!TipoInasistenciaId)
        throw new ClientException(`Debe seleccionar Tipo de Inasistencia`)


      if (PersonalLicenciaSePaga == "")
        PersonalLicenciaSePaga = null

      const dateValid = await this.validateDates(PersonalLicenciaDesde, PersonalId, Number(PersonalLicenciaId), queryRunner)

      if (dateValid.length > 0)
        throw new ClientException('La fecha desde se encuentra en un rango de otra licencia')


      await this.validateSituacionRevista(PersonalLicenciaDesde, PersonalLicenciaHasta, PersonalId, queryRunner)
      // if (PersonalSituacionRevistaHasta !== null && PersonalLicenciaDesde <= PersonalSituacionRevistaHasta) {
      //   throw new ClientException('Error: ya posee una licencia en la fecha hasta seleccionada');
      // }

      let PersonalLicenciaSelect = await queryRunner.query(` SELECT PersonalLicenciaUltNro,PersonalSituacionRevistaUltNro from Personal WHERE PersonalId = @0`, [PersonalId,])
      let PersonalLicenciaUltNro = Number(PersonalLicenciaSelect[0].PersonalLicenciaUltNro)
      let PersonalSituacionRevistaUltNro = Number(PersonalLicenciaSelect[0].PersonalSituacionRevistaUltNro)

      //optiene el tipo de inasistencia
      const tipoIns = await queryRunner.query(`SELECT TipoInasistenciaDescripcion FROM TipoInasistencia WHERE TipoInasistenciaId = @0`
        , [TipoInasistenciaId])
      const TipoInasistenciaDescripcion = tipoIns[0].TipoInasistenciaDescripcion.trim()

      if (PersonalLicenciaId) {  //UPDATE
        if (PersonalIdForEdit != PersonalId)
          throw new ClientException(`No puede modificar la persona`)

        let valueAplicaPeriodo = await queryRunner.query(`select PersonalId, PersonalLicenciaId from PersonalLicenciaAplicaPeriodo WHERE PersonalId = @0 AND PersonalLicenciaId = @1`,
          [PersonalId, PersonalLicenciaId]
        )

        if (valueAplicaPeriodo.length > 0 && PersonalLicenciaSePaga != "S")
          throw new ClientException(`No se puede actualizar el registro a se paga NO ya que tiene horas cargadas`)

        await this.UpdateDiagnosticoMedico(PersonalLicenciaDiagnosticoMedicoDiagnostico, PersonalId, PersonalLicenciaId, PersonalLicenciaDesde, queryRunner)


        const sitrevUpdate = await queryRunner.query(`
              SELECT sit.PersonalSituacionRevistaId, sit.PersonalSituacionRevistaDesde, sit.PersonalSituacionRevistaHasta, lic.PersonalLicenciaDesde, lic.PersonalLicenciaHasta,lic.PersonalLicenciaSituacionRevistaId
              FROM PersonalSituacionRevista sit
              JOIN PersonalLicencia lic ON lic.PersonalLicenciaDesde = sit.PersonalSituacionRevistaDesde AND sit.PersonalId = lic.PersonalId AND ISNULL(lic.PersonalLicenciaTermina,ISNULL(lic.PersonalLicenciaHasta,'9999-12-31')) = ISNULL(sit.PersonalSituacionRevistaHasta,'9999-12-31') 
              WHERE sit.PersonalId = @0 AND sit.PersonalSituacionRevistaSituacionId = 10 AND lic.PersonalLicenciaId = @1 
          `, [PersonalId, PersonalLicenciaId])
        if (sitrevUpdate.length != 1)
          throw new ClientException(`No se puede localizar situación de revista relacionada a la licencia ${sitrevUpdate.length}`)

        const PersonalSituacionRevistaIdSearch = sitrevUpdate[0].PersonalSituacionRevistaId
        const PersonalSituacionRevistaDesdeOrig = sitrevUpdate[0].PersonalSituacionRevistaDesde
        const PersonalSituacionRevistaHastaOrig = sitrevUpdate[0].PersonalSituacionRevistaHasta
        const PersonalLicenciaSituacionRevistaId = sitrevUpdate[0].PersonalLicenciaSituacionRevistaId


        await queryRunner.query(`UPDATE PersonalLicencia
          SET PersonalLicenciaDesde = @0, PersonalLicenciaHasta = @1, PersonalLicenciaTermina = @1, 
              PersonalTipoInasistenciaId = @2, PersonalLicenciaSePaga = @3, PersonalLicenciaHorasMensuales = @4,PersonalLicenciaDiagnosticoMedicoUltNro = @10,
              PersonalLicenciaObservacion = @5, PersonalLicenciaTipoAsociadoId = @6,PersonalLicenciaCategoriaPersonalId = @7
          WHERE PersonalId = @8 AND PersonalLicenciaId = @9`
          , [PersonalLicenciaDesde, PersonalLicenciaHasta, TipoInasistenciaId, PersonalLicenciaSePaga, PersonalLicenciaHorasMensuales,
            PersonalLicenciaObservacion, PersonalLicenciaCategoriaPersonalId, PersonalLicenciaTipoAsociadoId, PersonalId, PersonalLicenciaId, 1])


        if (PersonalSituacionRevistaDesdeOrig?.getTime() != PersonalLicenciaDesde?.getTime()) {
          const sitrevAnterior = await queryRunner.query(`
            SELECT TOP 1 sit.PersonalSituacionRevistaId, sit.PersonalSituacionRevistaDesde, sit.PersonalSituacionRevistaHasta
            FROM PersonalSituacionRevista sit
            WHERE sit.PersonalId = @0 AND sit.PersonalSituacionRevistaHasta <  @1
            ORDER BY sit.PersonalSituacionRevistaDesde DESC, sit.PersonalSituacionRevistaHasta DESC
        `, [PersonalId, PersonalSituacionRevistaDesdeOrig])
          if (sitrevAnterior.length > 0) {
            if (PersonalLicenciaDesde <= sitrevAnterior[0].PersonalSituacionRevistaDesde)
              throw new ClientException('La fecha desde no puede ser menor a la fecha desde de la situación de revista anterior a la licencia', { PersonalLicenciaDesde, PersonalSituacionRevistaDesde: sitrevAnterior[0].PersonalSituacionRevistaDesde })

            const PersonalSituacionRevistaId = sitrevAnterior[0].PersonalSituacionRevistaId
            await queryRunner.query(`UPDATE PersonalSituacionRevista
            SET PersonalSituacionRevistaHasta = @0
            WHERE PersonalId = @1 AND PersonalSituacionRevistaId= @2`, [this.addDays(PersonalLicenciaDesde, -1), PersonalId, PersonalSituacionRevistaId])
          }
        }


        await queryRunner.query(`UPDATE PersonalSituacionRevista
        SET PersonalSituacionRevistaDesde = @1, PersonalSituacionRevistaHasta = @3, PersonalSituacionRevistaMotivo = @4
        WHERE PersonalId = @0 AND PersonalSituacionRevistaId= @2`, [PersonalId, PersonalLicenciaDesde, PersonalSituacionRevistaIdSearch, PersonalLicenciaHasta, TipoInasistenciaDescripcion])

        if (PersonalSituacionRevistaHastaOrig?.getTime() != PersonalLicenciaHasta?.getTime()) {
          const sitrevPosterior = await queryRunner.query(`
            SELECT TOP 1 sit.PersonalSituacionRevistaId, sit.PersonalSituacionRevistaDesde, ISNULL(sit.PersonalSituacionRevistaHasta,'9999-12-31') PersonalSituacionRevistaHasta, sit.PersonalSituacionRevistaSituacionId
            FROM PersonalSituacionRevista sit
            WHERE sit.PersonalId = @0 AND sit.PersonalSituacionRevistaDesde >  @1
            ORDER BY sit.PersonalSituacionRevistaDesde ASC, ISNULL(sit.PersonalSituacionRevistaHasta,'9999-12-31') ASC
            `, [PersonalId, PersonalSituacionRevistaHastaOrig])

          if (PersonalSituacionRevistaHastaOrig != null && PersonalLicenciaHasta != null) {

            if (sitrevPosterior.length > 0) {
              if (PersonalLicenciaHasta >= sitrevPosterior[0].PersonalSituacionRevistaHasta)
                throw new ClientException('La fecha hasta no puede ser mayor a la fecha hasta de la situación de revista posterior a la licencia', { PersonalLicenciaHasta, PersonalSituacionRevistaHasta: sitrevPosterior[0].PersonalSituacionRevistaHasta })

              const PersonalSituacionRevistaId = sitrevPosterior[0].PersonalSituacionRevistaId
              await queryRunner.query(`UPDATE PersonalSituacionRevista
              SET PersonalSituacionRevistaDesde = @0
              WHERE PersonalId = @1 AND PersonalSituacionRevistaId= @2`, [this.addDays(PersonalLicenciaHasta, 1), PersonalId, PersonalSituacionRevistaId])
            }
          } else if (PersonalSituacionRevistaHastaOrig == null) {
            PersonalSituacionRevistaUltNro++
            await this.addSituacionRevista(queryRunner, PersonalId, PersonalSituacionRevistaUltNro, this.addDays(PersonalLicenciaHasta, 1), null, null, PersonalLicenciaSituacionRevistaId)
          } else if (PersonalLicenciaHasta == null) {
            if (sitrevPosterior.length > 0) {
              const PersonalSituacionRevistaId = sitrevPosterior[0].PersonalSituacionRevistaId
              const PersonalSituacionRevistaHasta = sitrevPosterior[0].PersonalSituacionRevistaHasta

              if (PersonalSituacionRevistaHasta < new Date('9999-12-31'))
                throw new ClientException('El hasta no puede estar vacío', { PersonalSituacionRevistaHasta })

              await queryRunner.query(`DELETE FROM PersonalSituacionRevista WHERE PersonalId = @0 AND PersonalSituacionRevistaId = @1`,
                [PersonalId, PersonalSituacionRevistaId])
            }
          }
        }

      } else {  //INSERT
        //Obtengo ultima situación distanta a la de Licencia
        const sitrevant = await queryRunner.query(`
          SELECT TOP 1 PersonalSituacionRevistaId,PersonalSituacionRevistaMotivo,PersonalSituacionRevistaSituacionId,PersonalSituacionRevistaDesde,PersonalSituacionRevistaHasta
          FROM PersonalSituacionRevista
          WHERE PersonalId = @0 AND PersonalSituacionRevistaSituacionId <> 10
          ORDER BY PersonalSituacionRevistaDesde DESC, ISNULL(PersonalSituacionRevistaHasta,'9999-12-31') DESC
      `, [PersonalId])
        const PersonalSituacionRevistaSituacionIdNot10 = sitrevant[0].PersonalSituacionRevistaSituacionId



        const sitrev = await queryRunner.query(`
          SELECT TOP 1 PersonalSituacionRevistaId,PersonalSituacionRevistaMotivo,PersonalSituacionRevistaSituacionId,PersonalSituacionRevistaDesde,PersonalSituacionRevistaHasta
          FROM PersonalSituacionRevista
          WHERE PersonalId = @0 
          ORDER BY PersonalSituacionRevistaDesde DESC, ISNULL(PersonalSituacionRevistaHasta,'9999-12-31') DESC
      `, [PersonalId, PersonalLicenciaDesde])

        const { PersonalSituacionRevistaId, PersonalSituacionRevistaSituacionId, PersonalSituacionRevistaMotivo, PersonalSituacionRevistaHasta, PersonalSituacionRevistaDesde } = sitrev[0]




        if (PersonalLicenciaDesde < PersonalSituacionRevistaDesde) {
          const sitrevpartir = await queryRunner.query(`
            SELECT PersonalSituacionRevistaId,PersonalSituacionRevistaMotivo,PersonalSituacionRevistaSituacionId,PersonalSituacionRevistaDesde,PersonalSituacionRevistaHasta
            FROM PersonalSituacionRevista
            WHERE PersonalId = @0 AND PersonalSituacionRevistaDesde <= @1 AND ISNULL(PersonalSituacionRevistaHasta,'9999-12-31') >= @1
        `, [PersonalId, PersonalLicenciaDesde])
          if (sitrevpartir.length == 1 && sitrevpartir[0].PersonalSituacionRevistaSituacionId != 10 && sitrevpartir[0].PersonalSituacionRevistaHasta >= PersonalLicenciaHasta && PersonalLicenciaHasta) {
            PersonalSituacionRevistaHastaNuevo = sitrevpartir[0].PersonalSituacionRevistaHasta
          } else


            throw new ClientException('La fecha desde no puede ser menor al desde de la última situación revista o la fecha desde y hasta deben pertenecer a una situación de revista activa')
        } else if (PersonalLicenciaDesde.getTime() == PersonalSituacionRevistaDesde.getTime() && PersonalSituacionRevistaSituacionId != 10) {

          await queryRunner.query(`DELETE FROM PersonalSituacionRevista
            WHERE PersonalId = @0 AND PersonalSituacionRevistaId= @1`, [PersonalId, PersonalSituacionRevistaId])
        }

  
        PersonalLicenciaUltNro++
        await queryRunner.query(`INSERT INTO PersonalLicencia (
          PersonalId, 
          PersonalLicenciaId, 
          PersonalLicenciaHistorica, 
          TipoLicenciaId, 
          PersonalLicenciaContraRenuncia, 

          PersonalLicenciaDesde, 
          PersonalLicenciaHasta, 
          PersonalLicenciaTermina, 
          PersonalLicenciaDesdeConsejo,
          PersonalLicenciaHastaConsejo, 

          PersonalLicenciaTerminaConsejo, 
          PersonalLicenciaObservacion,
          PersonalLicenciaDiagnosticoMedicoUltNro, 
          PersonalLicenciaLiquidacionUltNro,
          PersonalTipoInasistenciaId, 

          PersonalLicenciaSePaga, 
          PersonalLicenciaHorasMensuales, 
          PersonalLicenciaTipoAsociadoId, 
          PersonalLicenciaCategoriaPersonalId,
           PersonalLicenciaAplicaPeriodoUltNro, 

          PersonalLicenciaSituacionRevistaId)
          VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@11,@12,@13,@14,@15,@16,@17,@18,@19,@20)`
          , [PersonalId,
            PersonalLicenciaUltNro,
            null,
            null,
            'N',

            PersonalLicenciaDesde,
            PersonalLicenciaHasta,
            PersonalLicenciaHasta,
            null,
            null,

            null,
            PersonalLicenciaObservacion,
            1,
            null,
            TipoInasistenciaId,

            PersonalLicenciaSePaga,
            `${Math.trunc(PersonalLicenciaHorasMensuales)}.${(60 * (PersonalLicenciaHorasMensuales - Math.trunc(PersonalLicenciaHorasMensuales))).toString().padStart(2, '0')}`,
            PersonalLicenciaCategoriaPersonalId,
            PersonalLicenciaTipoAsociadoId,
            null,

            PersonalSituacionRevistaSituacionIdNot10])

        await this.UpdateDiagnosticoMedico(PersonalLicenciaDiagnosticoMedicoDiagnostico, PersonalId, PersonalLicenciaUltNro, PersonalLicenciaDesde, queryRunner)
        /*
                if (PersonalSituacionRevistaId) {
                  await queryRunner.query(`UPDATE PersonalSituacionRevista
                  SET PersonalSituacionRevistaHasta = @2
                  WHERE PersonalId = @0 AND PersonalSituacionRevistaId= @1`, [PersonalId, PersonalSituacionRevistaId, this.addDays(PersonalLicenciaDesde, -1)])
                }
        */

        const sr = await queryRunner.query(`SELECT PersonalSituacionRevistaId FROM PersonalSituacionRevista
          WHERE PersonalId = @0 AND PersonalSituacionRevistaDesde = @1 AND PersonalSituacionRevistaHasta = @2`, [PersonalId, PersonalLicenciaDesde, PersonalLicenciaHasta])
        if (sr.length == 1) {
          await queryRunner.query(`DELETE FROM PersonalSituacionRevista
            WHERE PersonalId = @0 AND PersonalSituacionRevistaDesde = @1 AND PersonalSituacionRevistaHasta = @2`, [PersonalId, PersonalLicenciaDesde, PersonalLicenciaHasta])
        } else {
          await queryRunner.query(`UPDATE PersonalSituacionRevista
            SET PersonalSituacionRevistaHasta = @2
            WHERE PersonalId = @0 AND PersonalSituacionRevistaDesde < @1 AND ISNULL(PersonalSituacionRevistaHasta,'9999-12-31') > @1`, [PersonalId, PersonalLicenciaDesde, this.addDays(PersonalLicenciaDesde, -1)])
        }
        PersonalSituacionRevistaUltNro++
        await this.addSituacionRevista(queryRunner, PersonalId, PersonalSituacionRevistaUltNro, PersonalLicenciaDesde, PersonalLicenciaHasta, TipoInasistenciaDescripcion, 10)

        if ((PersonalLicenciaHasta != null && PersonalSituacionRevistaHastaNuevo == null) || (PersonalSituacionRevistaHastaNuevo && this.addDays(PersonalLicenciaHasta, 1) <= PersonalSituacionRevistaHastaNuevo)) {
          PersonalSituacionRevistaUltNro++
          await this.addSituacionRevista(queryRunner, PersonalId, PersonalSituacionRevistaUltNro, this.addDays(PersonalLicenciaHasta, 1), PersonalSituacionRevistaHastaNuevo, '', PersonalSituacionRevistaSituacionId)
        }
      }


      await queryRunner.query(`UPDATE Personal SET PersonalLicenciaUltNro = @1,PersonalSituacionRevistaUltNro = @2 where PersonalId = @0 `, [PersonalId, PersonalLicenciaUltNro, PersonalSituacionRevistaUltNro])

    
      let doc_id = 0
      if (req.body.files) {
        for (const file of req.body.files) {
          

          const result = await FileUploadController.handleDOCUpload(PersonalId, 0, 0, 0, new Date(), null, '', file, usuario, ip, queryRunner)

          if (result && typeof result === 'object')
            ({ doc_id } = result)

          PersonalLicenciaId = PersonalLicenciaId ? PersonalLicenciaId : PersonalLicenciaUltNro
          if (file.tempfilename) {
            await queryRunner.query(`INSERT INTO DocumentoRelaciones (
            DocumentoId,
            PersonalId,
            ObjetivoId,
            ClienteId,
            PersonalLicenciaId,
            AudFechaIng,
            AudFechaMod,
            AudUsuarioIng,
            AudUsuarioMod,
            AudIpIng,
            AudIpMod
          ) VALUES (
            @0, @1, @2, @3, @4, @5, @5, @6, @6, @7, @7
          )`, [
              doc_id,
              PersonalId,
              null,
              null,
              PersonalLicenciaId,
              new Date(),
              usuario,
              ip
            ])
          } else {
            await queryRunner.query(`UPDATE DocumentoRelaciones SET AudFechaMod = @0, AudUsuarioMod = @1, AudIpMod = @2 WHERE DocumentoId = @3`, [
              new Date(),
              usuario,
              ip,
              doc_id
            ])
          }
        }
      }
      //throw new ClientException(`test`)
      await queryRunner.commitTransaction();
      this.jsonRes({ list: [{DocumentoId: doc_id}] }, res, (PersonalLicenciaId) ? `se Actualizó con exito el registro` : `se Agregó con exito el registro`);

    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    }

  }

  async validateSituacionRevista(licenciaDesde: Date,licenciaHasta: Date,personalId: number, queryRunner: QueryRunner ) {
    const situaciones = await queryRunner.query(`
      SELECT 
        psr.PersonalSituacionRevistaId,
        psr.PersonalSituacionRevistaDesde,
        ISNULL(psr.PersonalSituacionRevistaHasta, '9999-12-31') AS PersonalSituacionRevistaHasta
      FROM PersonalSituacionRevista psr
      WHERE psr.PersonalId = @0
    `, [personalId]);
  
    const situacionesInvalidas = situaciones.filter(sit => {
      const id = sit.PersonalSituacionRevistaId;
  
      // Situaciones Resvista validas
      const situacionesValidas = [2, 11, 12, 20];
      if (situacionesValidas.includes(id)) return false;
  
      const desde = new Date(sit.PersonalSituacionRevistaDesde);
      const hasta = new Date(sit.PersonalSituacionRevistaHasta);
  
      // Validar si hay superposicion con el período de la licencia
      return !(hasta < licenciaDesde || desde > licenciaHasta);
    });
  
    if (situacionesInvalidas.length > 0) {
      throw new ClientException(
        `La persona se encontraba en una situación de revista no permitida durante el período de la licencia.`
      );
    }
  }
  

  async addSituacionRevista(queryRunner: QueryRunner,
    PersonalId: number,
    PersonalSituacionRevistaId: number,
    PersonalSituacionRevistaDesde: Date,
    PersonalSituacionRevistaHasta: Date,
    PersonalSituacionRevistaMotivo: string,
    PersonalSituacionRevistaSituacionId: number
  ) {
    PersonalSituacionRevistaSituacionId = (PersonalSituacionRevistaSituacionId) ? PersonalSituacionRevistaSituacionId : 2
    await queryRunner.query(`INSERT INTO PersonalSituacionRevista (
            PersonalId,
            PersonalSituacionRevistaId,
            PersonalSituacionRevistaDesde,
            PersonalSituacionRevistaTomoConocimiento, 
            PersonalSituacionRevistaHasta,
            PersonalSituacionRevistaMotivo,
            PersonalSituacionRevistaAnula,
            PersonalSituacionRevistaSituacionId,
            PersonalSituacionRevistaRetenerLiquidacion) 
            VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8)`,
      [PersonalId,
        PersonalSituacionRevistaId,
        PersonalSituacionRevistaDesde,
        null,
        PersonalSituacionRevistaHasta,
        PersonalSituacionRevistaMotivo,
        null,
        PersonalSituacionRevistaSituacionId,
        null
      ])
  }

  async deleteLincencia(req: Request, res: Response, next: NextFunction) {

    const {
      PersonalLicenciaId,
      PersonalId,
      DocumentoId
    } = req.query
    
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();


      const ds = await queryRunner.query(`SELECT PersonalId,PersonalLicenciaId FROM  PersonalLicenciaAplicaPeriodo WHERE PersonalId = @0 and PersonalLicenciaId =@1`, [PersonalId, PersonalLicenciaId])

      if (ds.length > 0)
        throw new ClientException(`No puede eliminar porque tiene horas cargadas`)


      const recLicSit = await queryRunner.query(`SELECT lic.PersonalId, lic.PersonalLicenciaId, lic.PersonalLicenciaDesde, lic.PersonalLicenciaHasta, lic.PersonalLicenciaSituacionRevistaId, sit.PersonalSituacionRevistaId 
        FROM PersonalLicencia lic
        JOIN PersonalSituacionRevista sit ON sit.PersonalId = lic.PersonalId AND sit.PersonalSituacionRevistaSituacionId = 10 AND sit.PersonalSituacionRevistaDesde = lic.PersonalLicenciaDesde AND sit.PersonalSituacionRevistaHasta = lic.PersonalLicenciaHasta 
        WHERE lic.PersonalId = @0 AND lic.PersonalLicenciaId =@1
      `, [PersonalId, PersonalLicenciaId])

      if (recLicSit.length != 1)
        throw new ClientException(`No puede determinar la situación de revista para esta licencia`)


      const cierre = await queryRunner.query(`SELECT TOP 1 *, EOMONTH(DATEFROMPARTS(anio, mes, 1)) AS FechaCierre FROM lige.dbo.liqmaperiodo WHERE ind_recibos_generados = 1 ORDER BY anio DESC, mes DESC `)
      const FechaCierre = new Date(cierre[0].FechaCierre);
      if (FechaCierre >= recLicSit[0].PersonalLicenciaDesde) {
        throw new ClientException(`No puede eliminar ya que la fecha de la licencia es menor o igual a la fecha de cierre de liquidación`)
      }

      await this.UpdateDiagnosticoMedico('', Number(PersonalId), Number(PersonalLicenciaId), null, queryRunner)


      await queryRunner.query(`DELETE FROM PersonalLicencia WHERE PersonalId = @0 and PersonalLicenciaId =@1`
        , [PersonalId, PersonalLicenciaId])

      if (DocumentoId && Number(DocumentoId) > 0)
        await FileUploadController.deleteFile(Number(DocumentoId), 'docgeneral', queryRunner)

      if (recLicSit[0].PersonalLicenciaSituacionRevistaId == 10 )
        throw new ClientException(`La situación revista anterior no puede ser "Licencia", avise al administrador`)

      await queryRunner.query(`UPDATE PersonalSituacionRevista SET PersonalSituacionRevistaSituacionId = @0, PersonalSituacionRevistaMotivo = NULL WHERE PersonalId = @1 AND PersonalSituacionRevistaId = @2`,
        [recLicSit[0].PersonalLicenciaSituacionRevistaId, PersonalId, recLicSit[0].PersonalSituacionRevistaId])

      this.jsonRes({ list: [] }, res, `Licencia borrada con exito`);
      await queryRunner.commitTransaction();

    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    }

  }


  async getLicencia(req: Request, res: Response, next: NextFunction) {
    const PersonalId = Number(req.params.PersonalId)
    const PersonalLicenciaId = Number(req.params.PersonalLicenciaId)
    const anio = Number(req.params.anio)
    const mes = Number(req.params.mes)
    const queryRunner = dataSource.createQueryRunner();

    try {

      let result = await this.getLicenciaQuery(queryRunner, anio, mes, PersonalId, PersonalLicenciaId)
      this.jsonRes(result[0], res);
    } catch (error) {
      return next(error)
    }
  }

  async getLicenciaQuery(queryRunner: QueryRunner, anio: any, mes: any, PersonalId: any, PersonalLicenciaId: any) {
    let selectquery = `SELECT suc.SucursalId, suc.SucursalDescripcion,
    persona.PersonalId,lic.PersonalLicenciaId, persona.PersonalApellido, persona.PersonalNombre, 

    PARSENAME(lic.PersonalLicenciaHorasMensuales,2)+ CAST(PARSENAME(lic.PersonalLicenciaHorasMensuales,1) AS FLOAT)/60 AS PersonalLicenciaHorasMensuales,

    val.ValorLiquidacionHoraNormal,
    PARSENAME(licimp.PersonalLicenciaAplicaPeriodoHorasMensuales,2)+ CAST(PARSENAME(licimp.PersonalLicenciaAplicaPeriodoHorasMensuales,1) AS FLOAT)/60 AS PersonalLicenciaAplicaPeriodoHorasMensuales,
    (PARSENAME(licimp.PersonalLicenciaAplicaPeriodoHorasMensuales,2)+ CAST(PARSENAME(licimp.PersonalLicenciaAplicaPeriodoHorasMensuales,1) AS FLOAT)/60) * val.ValorLiquidacionHoraNormal AS total,  

    lic.PersonalLicenciaSePaga,
    tli.TipoInasistenciaId,
    tli.TipoInasistenciaDescripcion,
    tli.TipoInasistenciaApartado,
    lic.PersonalLicenciaDesde,
    lic.PersonalLicenciaSituacionRevistaId,
    ISNULL(lic.PersonalLicenciaTermina, lic.PersonalLicenciaHasta) PersonalLicenciaHasta,
    cat.CategoriaPersonalDescripcion,
    lic.PersonalLicenciaObservacion,
    lic.PersonalLicenciaTipoAsociadoId,
    lic.PersonalLicenciaCategoriaPersonalId,
    med.PersonalLicenciaDiagnosticoMedicoDiagnostico,
    med.PersonalLicenciaDiagnosticoMedicoFechaDiagnostico,
    doc.DocumentoId,
      1
    FROM PersonalLicencia lic 
    JOIN Personal persona ON persona.PersonalId = lic.PersonalId
    JOIN TipoInasistencia tli ON tli.TipoInasistenciaId = lic.PersonalTipoInasistenciaId
    LEFT JOIN PersonalSucursalPrincipal sucper ON sucper.PersonalId = persona.PersonalId AND sucper.PersonalSucursalPrincipalId = (SELECT MAX(a.PersonalSucursalPrincipalId) PersonalSucursalPrincipalId FROM PersonalSucursalPrincipal a WHERE a.PersonalId = persona.PersonalId)

    LEFT JOIN PersonalLicenciaAplicaPeriodo licimp ON lic.PersonalId = licimp.PersonalId AND lic.PersonalLicenciaId = licimp.PersonalLicenciaId AND licimp.PersonalLicenciaAplicaPeriodoAplicaEl = CONCAT(RIGHT('  '+CAST(@2 AS VARCHAR(2)),2),'/',@1)
    LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(sucper.PersonalSucursalPrincipalSucursalId,1)
    LEFT JOIN CategoriaPersonal cat ON cat.TipoAsociadoId = lic.PersonalLicenciaTipoAsociadoId AND cat.CategoriaPersonalId = lic.PersonalLicenciaCategoriaPersonalId
    LEFT JOIN ValorLiquidacion val ON val.ValorLiquidacionSucursalId = suc.SucursalId AND val.ValorLiquidacionTipoAsociadoId = lic.PersonalLicenciaTipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId = lic.PersonalLicenciaCategoriaPersonalId AND val.ValorLiquidacionDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND ISNULL(val.ValorLiquidacionHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1)
    LEFT JOIN PersonalLicenciaDiagnosticoMedico med ON med.PersonalId=persona.PersonalId AND med.PersonalLicenciaId = lic.PersonalLicenciaId
    LEFT JOIN DocumentoRelaciones doc ON doc.PersonalLicenciaId = lic.PersonalLicenciaId and persona.PersonalId = doc.PersonalId
    WHERE lic.PersonalId=@3 AND lic.PersonalLicenciaId=@4 `

    const result = await queryRunner.query(selectquery, [null, anio, mes, PersonalId, PersonalLicenciaId])
    return result
  }

  async UpdateDiagnosticoMedico(
    PersonalLicenciaDiagnosticoMedicoDiagnostico: string,
    PersonalId: number,
    PersonalLicenciaId: number,
    PersonalLicenciaDesde: Date,
    queryRunner: QueryRunner
  ) {
    PersonalLicenciaDiagnosticoMedicoDiagnostico = (PersonalLicenciaDiagnosticoMedicoDiagnostico) ? PersonalLicenciaDiagnosticoMedicoDiagnostico.trim() : ""
    //valida si existe diagnostico medico
    if (PersonalLicenciaDiagnosticoMedicoDiagnostico == "") {
      await queryRunner.query(`DELETE FROM PersonalLicenciaDiagnosticoMedico WHERE personalId = @0 AND PersonalLicenciaId = @1`, [PersonalId, PersonalLicenciaId])
    } else {
      const resultExists = await queryRunner.query(`SELECT PersonalId,PersonalLicenciaId FROM PersonalLicenciaDiagnosticoMedico WHERE personalId = @0 AND PersonalLicenciaId = @1`, [PersonalId, PersonalLicenciaId])

      if (resultExists.length > 0) {

        await queryRunner.query(`UPDATE PersonalLicenciaDiagnosticoMedico SET PersonalLicenciaDiagnosticoMedicoDiagnostico = @0 WHERE PersonalId = @1 AND PersonalLicenciaId = @2`
          , [PersonalLicenciaDiagnosticoMedicoDiagnostico.trim(), PersonalId, PersonalLicenciaId])

      } else {
        await queryRunner.query(`INSERT INTO PersonalLicenciaDiagnosticoMedico 
              (PersonalLicenciaDiagnosticoMedicoId, 
               PersonalId, 
               PersonalLicenciaId,
               PersonalLicenciaDiagnosticoMedicoFechaDiagnostico,
               PersonalLicenciaDiagnosticoMedicoDiagnostico )
                VALUES (@0,@1,@2,@3,@4)`
          , [1, PersonalId, PersonalLicenciaId, PersonalLicenciaDesde, PersonalLicenciaDiagnosticoMedicoDiagnostico])
      }

    }

  }


  /*async handlePDFUpload(
    anioRequest: number,
    mesRequest: number,
    persona_id: number,
    PersonalLicenciaId: number,
    res: Response,
    req: Request,
    Archivo: any, next: NextFunction
  ) {
    const file = req.file;
    const queryRunner = dataSource.createQueryRunner();
    let usuario = res.locals.userName;
    let ip = this.getRemoteAddress(req);
    let fechaActual = new Date();

    const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, anioRequest, mesRequest, usuario, ip);

    try {
      const dirtmp = `${process.env.PATH_LICENCIA}/temp`;
      const dirtmpNew = `${process.env.PATH_LICENCIA}/${periodo_id}`;

      for (const file of Archivo) {
        let docgeneral = await this.getProxNumero(queryRunner, 'docgeneral', usuario, ip);
        const newFilePath = `${dirtmpNew}/${docgeneral}-${persona_id}.pdf`;
        this.moveFile(`${file.fieldname}.pdf`, newFilePath, dirtmpNew);

        await this.setLicenciaDocGeneral(
          queryRunner,
          Number(docgeneral),
          periodo_id,
          fechaActual,
          persona_id,
          0,
          file.originalname,
          newFilePath,
          usuario,
          ip,
          fechaActual,
          'LIC',
          PersonalLicenciaId
        );
      }
      //this.jsonRes({}, res, 'PDF guardado con exito!');
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      //return next(error)
      return next('Error processing files:' + error)
    }
  }*/

  /*moveFile(filename: any, newFilePath: any, dirtmp: any) {
    const originalFilePath = `${process.env.PATH_LICENCIA}/temp/${filename}`;
    console.log("originalFilePath ", originalFilePath)
    console.log("newFilePath ", newFilePath)

    if (!existsSync(dirtmp)) {
      mkdirSync(dirtmp, { recursive: true });
    }
    try {
      renameSync(originalFilePath, newFilePath);
    } catch (error) {
      console.error('Error moviendo el archivo:', error);
    }

  }*/

  /*async setLicenciaDocGeneral(
    queryRunner: any,
    docgeneral: number,
    periodo: number,
    fecha: Date,
    persona_id: number,
    objetivo_id: number,
    nombre_archivo: string,
    path: string,
    usuario: string,
    ip: string,
    audfecha: Date,
    doctipo_id: string,
    den_documento: number

  ) {

    return queryRunner.query(`INSERT INTO lige.dbo.docgeneral ("doc_id", "periodo", "fecha", "persona_id", "objetivo_id", "path", "nombre_archivo", "aud_usuario_ins", "aud_ip_ins", "aud_fecha_ins", "aud_usuario_mod", "aud_ip_mod", "aud_fecha_mod", "doctipo_id", "den_documento")
    VALUES
    (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14);`,
      [
        docgeneral,
        periodo,
        fecha,
        persona_id,
        objetivo_id,
        path,
        nombre_archivo,
        usuario, ip, fecha,
        usuario, ip, audfecha,
        doctipo_id, den_documento
      ])

  }*/

  /*async getLicenciaAnteriores(
    Anio: string,
    Mes: string,
    PersonalId: string,
    PersonalLicenciaId: string,
    req: Request,
    res: Response,
    next: NextFunction
  ) {

    try {
      const queryRunner = dataSource.createQueryRunner();
      let usuario = res.locals.userName
      let ip = this.getRemoteAddress(req)
      let fechaActual = new Date()
      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, Number(Anio), Number(Mes), usuario, ip)

      const importacionesAnteriores = await dataSource.query(

        `SELECT doc_id AS id, path, nombre_archivo AS nombre,  aud_fecha_ins AS fecha FROM lige.dbo.docgeneral WHERE periodo = @0 AND persona_id = @1 AND den_documento = @2`,
        [periodo_id, Number(PersonalId), Number(PersonalLicenciaId)])

      this.jsonRes(
        {
          total: importacionesAnteriores.length,
          list: importacionesAnteriores,
        },

        res
      );

    } catch (error) {
      return next(error)
    }
  }*/

  /*async getByDownLicencia(req: any, res: Response, next: NextFunction) {
    const documentId = Number(req.body.documentId);
    try {

      const document = await this.getLicenciatInfo(documentId);

      const finalurl = `${document[0]["path"]}`
      if (!existsSync(finalurl))
        throw new ClientException(`Archivo ${document[0]["name"]} no localizado`, { path: finalurl })

      res.download(finalurl, document[0]["name"])

    } catch (error) {
      return next(error)
    }
  }*/

  /*async getLicenciatInfo(documentId: Number) {


    return dataSource.query(
      `SELECT doc_id AS id, path, nombre_archivo AS name FROM lige.dbo.docgeneral WHERE doc_id = @0`, [documentId])

  }*/

  async changehours(req: any, res: Response, next: NextFunction) {

    const queryRunner = dataSource.createQueryRunner();
    try {

      await queryRunner.connect();
      await queryRunner.startTransaction();
      const horas = req.body.PersonalLicenciaAplicaPeriodoHorasMensuales
      const PersonalId = req.body.PersonalId;
      const PersonalLicenciaId = req.body.PersonalLicenciaId
      const anio = req.body.anio
      const mes = req.body.mes
      const aplicaEl = `${mes.toString().padStart(2, ' ')}/${anio}`

      const recibo = await queryRunner.query(`
        SELECT liqp.ind_recibos_generados FROM lige.dbo.liqmaperiodo liqp WHERE liqp.anio = @1 AND liqp.mes = @2
        `, [null, anio, mes])
      if (recibo.length > 0 && recibo[0]['ind_recibos_generados'] == 1)
        throw new ClientException(`Ya se generó recibo para el período ${mes}/${anio}, no se pueden modificar las horas`)


      let det: any = {}
      await queryRunner.query(`DELETE FROM  PersonalLicenciaAplicaPeriodo
        WHERE PersonalId = @0  AND PersonalLicenciaId = @1 AND PersonalLicenciaAplicaPeriodoAplicaEl = @2`,
        [PersonalId, PersonalLicenciaId, aplicaEl]);

      if (horas > 0) {
        const PersonalLicencia = await queryRunner.query(`SELECT PersonalLicenciaAplicaPeriodoUltNro FROM PersonalLicencia WHERE PersonalId = @0 AND  PersonalLicenciaId = @1`,
          [PersonalId, PersonalLicenciaId])

        const PersonalSucursal = await queryRunner.query(`SELECT PersonalSucursalPrincipalSucursalId FROM PersonalSucursalPrincipal WHERE personalId = @0`,
          [PersonalId])


        const personalLicenciaIncrement =
          PersonalLicencia[0].PersonalLicenciaAplicaPeriodoUltNro != undefined
            ? PersonalLicencia[0].PersonalLicenciaAplicaPeriodoUltNro + 1
            : 1

        await queryRunner.query(`UPDATE PersonalLicencia SET PersonalLicenciaAplicaPeriodoUltNro = @2 WHERE PersonalId = @0 AND  PersonalLicenciaId = @1`,
          [PersonalId, PersonalLicenciaId, personalLicenciaIncrement])

        await queryRunner.query(`INSERT INTO PersonalLicenciaAplicaPeriodo (
            PersonalLicenciaAplicaPeriodoId, 
            PersonalId, 
            PersonalLicenciaId, 
            PersonalLicenciaAplicaPeriodoHorasMensuales, 
            PersonalLicenciaAplicaPeriodoAplicaEl, 
            PersonalLicenciaAplicaPeriodoSucursalId
            )
            VALUES (@0,@1,@2,@3,@4,@5)`
          , [personalLicenciaIncrement,
            PersonalId,
            PersonalLicenciaId,
            `${Math.trunc(horas)}.${(60 * (horas - Math.trunc(horas))).toString().padStart(2, '0')}`,
            aplicaEl,
            PersonalSucursal[0].PersonalSucursalPrincipalSucursalId
          ])

        det = await this.getLicenciaQuery(queryRunner, anio, mes, PersonalId, PersonalLicenciaId)
      }
      await queryRunner.commitTransaction();

      this.jsonRes(det[0], res, "Modificación con exito!");

    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    }
  }

  async deleleTemporalFiles(req, res, next) {
    try {

      const tempFolderPath = path.join(process.env.PATH_LICENCIA, 'temp');
      const files = await fs.promises.readdir(tempFolderPath);
      const limiteFecha = Date.now() - (24 * 60 * 60 * 1000);
      const deletePromises = files.map(async (file) => {
        const filePath = path.join(tempFolderPath, file);
        const stats = await stat(filePath);
        const fechaCreacion = stats.birthtime.getTime();

        if (fechaCreacion < limiteFecha) {
          await unlink(filePath);
          console.log(`Archivo ${file} borrado.`);
        }
      });

      await Promise.all(deletePromises);
      res.json({ message: 'Se borraron los archivos temporales con éxito' });
    } catch (error) {
      next(error);
    }
  }

  async validateDates(Fechadesde: Date, personalId: any, PersonalLicenciaId: number, queryRunner: QueryRunner) {
    return queryRunner.query(
      `SELECT lic.PersonalId, lic.PersonalLicenciaId FROM PersonalLicencia lic WHERE 
        lic.PersonalId = @0 AND lic.PersonalLicenciaId <> @2 AND
        @1 >= lic.PersonalLicenciaDesde AND @1 < ISNULL(lic.PersonalLicenciaHasta,ISNULL(lic.PersonalLicenciaTermina , '9999-12-31')) 
        ` ,
      [personalId, Fechadesde, PersonalLicenciaId]
    );
  }
}
