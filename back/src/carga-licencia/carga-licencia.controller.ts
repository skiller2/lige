import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, getOptionsFromRequest } from "../impuestos-afip/filtros-utils/filtros";
import { NextFunction, Request, Response, query } from "express";
import { ObjetivoController } from "src/controller/objetivo.controller";
import { AsistenciaController } from "../controller/asistencia.controller";
import { mkdirSync, renameSync, existsSync, readFileSync, unlinkSync, copyFileSync } from "fs";
import { Utils } from "./../liquidaciones/liquidaciones.utils";
import { IsNull } from "typeorm";
import { QueryRunner } from "typeorm";
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);

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
    name: "Personal",
    type: "number",
    id: "PersonalId",
    field: "PersonalId",
    fieldName: "persona.PersonalId",
    searchComponent: "inpurForPersonalSearch",
    hidden: true,
    searchHidden: false,
    sortable: true
  },
  {
    name: "Nombre y Apellido",
    type: "string",
    id: "NombreCompleto",
    field: "NombreCompleto",
    fieldName: "NombreCompleto",
    hidden: false,
    searchHidden: true,
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
    name: "Se Paga",
    type: "strng",
    id: "PersonalLicenciaSePaga",
    field: "PersonalLicenciaSePaga",
    fieldName: "lic.PersonalLicenciaSePaga",
    searchComponent: "inpurForSePaga",
    hidden: true,
    searchHidden: false,
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
    name: "Termina",
    type: "date",
    id: "PersonalLicenciaTermina",
    field: "PersonalLicenciaTermina",
    fieldName: "lic.PersonalLicenciaTermina",
    hidden: true,
    searchHidden: true,
    sortable: true
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
    type: "string",
    id: "PersonalLicenciaSePaga",
    field: "PersonalLicenciaSePaga",
    fieldName: "PersonalLicenciaSePaga",
    searchHidden: true,
    hidden: false,
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
    name: "Nombre y Apellido",
    type: "string",
    id: "NombreCompleto",
    field: "NombreCompleto",
    fieldName: "NombreCompleto",
    searchComponent: "inpurForPersonalSearch",
    searchType: "number",
    sortable: true,
    searchHidden: false,
    hidden: false,

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
    fieldName: "lic.PersonalLicenciaHasta",
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

  async getGridColsHoras(req, res) {
    this.jsonRes(columnasGrillaHoras, res);
  }


  async list(
    req: any,
    res: Response,
    next: NextFunction
  ) {

    const filterSql = filtrosToSql(req.body[0]["options"].filtros, columnasGrilla);
    //const orderBy = orderToSQL(req.body.options.sort)
    const anio = Number(req.body[1])
    const mes = Number(req.body[2])
    const queryRunner = dataSource.createQueryRunner();
    try {

      const listCargaLicencia = await AsistenciaController.getAsistenciaAdminArt42(anio, mes, queryRunner, [], filterSql, true)
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

  async listHoras(
    req: any,
    res: Response,
    next: NextFunction
  ) {

    const filterSql = filtrosToSql(req.body[0]["options"].filtros, columnasGrilla);
    //const orderBy = orderToSQL(req.body.options.sort)
    const anio = Number(req.body[1])
    const mes = Number(req.body[2])

    try {

      let queryRunner = dataSource.createQueryRunner();
      const listHorasLicencia = await AsistenciaController.getAsistenciaAdminArt42(anio, mes, queryRunner, [], filterSql, true)
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
      PersonalLicenciaDiagnosticoMedicoDiagnostico

    } = req.body

    let PersonalLicenciaHasta = new Date(req.body.PersonalLicenciaHasta)
    const PersonalLicenciaDesde = new Date(req.body.PersonalLicenciaDesde)
    PersonalLicenciaHasta.setHours(0, 0, 0, 0)
    PersonalLicenciaDesde.setHours(0,0,0,0)

    if (isNaN(PersonalLicenciaHasta.getTime()))
      PersonalLicenciaHasta = null
    
    const queryRunner = dataSource.createQueryRunner();
    try {

      await queryRunner.connect();
      await queryRunner.startTransaction();

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


      if (PersonalLicenciaDesde == null) 
        throw new ClientException(`Debe seleccionar la fecha desde`)



      let dateValid = await this.validateDates(PersonalLicenciaDesde,PersonalId)
      if (dateValid.length > 0) {
        throw new ClientException('ya existe un licencia para en el rango seleccionado. ');
      }

      const sitrev = await queryRunner.query(`
        SELECT TOP 1 PersonalSituacionRevistaId,PersonalSituacionRevistaMotivo,PersonalSituacionRevistaSituacionId,PersonalSituacionRevistaDesde,PersonalSituacionRevistaHasta
        FROM PersonalSituacionRevista
        WHERE PersonalId = @0 AND PersonalSituacionRevistaSituacionId <> 10
        ORDER BY PersonalSituacionRevistaDesde DESC, PersonalSituacionRevistaHasta DESC
    `, [PersonalId])

      const { PersonalSituacionRevistaId,PersonalSituacionRevistaSituacionId,PersonalSituacionRevistaMotivo, } =sitrev[0] 
        
      let PersonalLicenciaSelect = await queryRunner.query(` SELECT PersonalLicenciaUltNro,PersonalSituacionRevistaUltNro from Personal WHERE PersonalId = @0`, [PersonalId,])
      let { PersonalLicenciaUltNro,PersonalSituacionRevistaUltNro } = PersonalLicenciaSelect[0]
      PersonalLicenciaUltNro += 1
      PersonalSituacionRevistaUltNro += 1


      if (PersonalLicenciaId) {  //UPDATE


        if(PersonalIdForEdit != PersonalId)
          throw new ClientException(`No puede modificar la persona`)

        let valueAplicaPeriodo = await queryRunner.query(`select * from PersonalLicenciaAplicaPeriodo WHERE PersonalId = @0 AND PersonalLicenciaId = @1`,
          [PersonalId, PersonalLicenciaId]
        )

        if (valueAplicaPeriodo.length > 0 && PersonalLicenciaSePaga == "N")
          throw new ClientException(`No se puede actualizar el registro a se paga NO ya que tiene horas cargadas`)

        await this.UpdateDiagnosticoMedico(PersonalLicenciaDiagnosticoMedicoDiagnostico, PersonalId, PersonalLicenciaId, res, req, next)

        let DiagnosticoUpdate = 
        PersonalLicenciaDiagnosticoMedicoDiagnostico.trim() == "" 
        ? null
        : 1

        await queryRunner.query(`UPDATE PersonalLicencia
          SET PersonalLicenciaDesde = @0, PersonalLicenciaHasta = @1, PersonalLicenciaTermina = @1, 
              PersonalTipoInasistenciaId = @2, PersonalLicenciaSePaga = @3, PersonalLicenciaHorasMensuales = @4,PersonalLicenciaDiagnosticoMedicoUltNro = @10,
              PersonalLicenciaObservacion = @5, PersonalLicenciaTipoAsociadoId = @6,PersonalLicenciaCategoriaPersonalId = @7
          WHERE PersonalId = @8 AND PersonalLicenciaId = @9`
          , [PersonalLicenciaDesde, PersonalLicenciaHasta, TipoInasistenciaId, PersonalLicenciaSePaga, PersonalLicenciaHorasMensuales,
            PersonalLicenciaObservacion, PersonalLicenciaCategoriaPersonalId, PersonalLicenciaTipoAsociadoId, PersonalId, PersonalLicenciaId,DiagnosticoUpdate])

        // Busca el ultimo registro q sea 10 enPersonalSituacionRevistaId para actualizar las fechas    
        const sitrevUpdate = await queryRunner.query(`
              SELECT TOP 1 PersonalSituacionRevistaId
              FROM PersonalSituacionRevista
              WHERE PersonalId = @0 AND PersonalSituacionRevistaSituacionId == 10
              ORDER BY PersonalSituacionRevistaDesde DESC, PersonalSituacionRevistaHasta DESC
          `, [PersonalId])
      
        let  PersonalSituacionRevistaIdSearch = sitrevUpdate[0].PersonalSituacionRevistaId
        await queryRunner.query(`UPDATE PersonalSituacionRevista
        SET PersonalSituacionRevistaDesde = @1, PersonalSituacionRevistaHasta = @3
        WHERE PersonalId = @0 AND PersonalSituacionRevistaId= @2`,[PersonalId,PersonalLicenciaDesde,PersonalSituacionRevistaId,PersonalLicenciaHasta])

       if(PersonalSituacionRevistaId > PersonalSituacionRevistaIdSearch ){
 
        if (PersonalLicenciaHasta != null){
          //update 0
          await this.CreateSituacionRevista(0,queryRunner,PersonalId,PersonalLicenciaDesde,PersonalLicenciaHasta,PersonalSituacionRevistaId,PersonalSituacionRevistaMotivo,PersonalSituacionRevistaSituacionId)

        }else {
          // delete 1
          await this.CreateSituacionRevista(1,queryRunner,PersonalId,PersonalLicenciaDesde,PersonalLicenciaHasta,PersonalSituacionRevistaId,PersonalSituacionRevistaMotivo,PersonalSituacionRevistaSituacionId)
        }

        }else{
          //create 2
          await this.CreateSituacionRevista(2,queryRunner,PersonalId,PersonalLicenciaDesde,PersonalLicenciaHasta,PersonalSituacionRevistaUltNro,PersonalSituacionRevistaMotivo,PersonalSituacionRevistaSituacionId)
        }

      } else {  //INSERT

        let DiagnosticoUpdate


        if(PersonalLicenciaDiagnosticoMedicoDiagnostico.trim() == "" ){
          DiagnosticoUpdate = null
        }else{
          const ResultDiagnostico = await queryRunner.query(`SELECT PersonalLicenciaDiagnosticoMedicoId FROM PersonalLicenciaDiagnosticoMedico WHERE PersonalId = @0 AND PersonalLicenciaId = @1  `, 
            [PersonalId,PersonalLicenciaUltNro])
            if(ResultDiagnostico.length > 0){
              let {PersonalLicenciaDiagnosticoMedicoId} = ResultDiagnostico[0]
              DiagnosticoUpdate = PersonalLicenciaDiagnosticoMedicoId + 1
            }else{
              DiagnosticoUpdate = 1
            }
        }

        await queryRunner.query(` UPDATE Personal SET PersonalLicenciaUltNro = @1,PersonalSituacionRevistaUltNro = @2 where PersonalId = @0 `, [PersonalId, PersonalLicenciaUltNro,PersonalSituacionRevistaUltNro])

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
            DiagnosticoUpdate,
            null,
            TipoInasistenciaId,

            PersonalLicenciaSePaga,
            `${Math.trunc(PersonalLicenciaHorasMensuales)}.${(60*(PersonalLicenciaHorasMensuales-Math.trunc(PersonalLicenciaHorasMensuales))).toString().padStart(2,'0')}`,
            PersonalLicenciaCategoriaPersonalId,
            PersonalLicenciaTipoAsociadoId,
            null,

            PersonalSituacionRevistaSituacionId])


            await queryRunner.query(`INSERT INTO PersonalSituacionRevista (
              PersonalId,
              PersonalSituacionRevistaId,
              PersonalSituacionRevistaDesde,
              PersonalSituacionRevistaTomoConocimiento, 
              PersonalSituacionRevistaHasta,
              PersonalSituacionRevistaMotivo,
              PersonalSituacionRevistaAnula,
              PersonalSituacionRevistaSituacionId,
              PersonalSituacionRevistaSituacionClasificacionId,
              PersonalSituacionRevistaRetenerLiquidacion) 
              VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8,@9)`, 
              [PersonalId,
               PersonalSituacionRevistaUltNro,
               PersonalLicenciaDesde,
               null,
               PersonalLicenciaHasta,
               'LICENCIA',
               null,
               10,
               null,
               null
              ])

        // INSERT DE DIGANOSTICO       
        const PersonalLicenciaDesdeDiagnostico = new Date(req.body.PersonalLicenciaDesde)
        PersonalLicenciaDesdeDiagnostico.setHours(0,0,0,0)

        await queryRunner.query(`INSERT INTO PersonalLicenciaDiagnosticoMedico (
          PersonalLicenciaDiagnosticoMedicoId, 
          PersonalId, 
          PersonalLicenciaId, 
          PersonalLicenciaDiagnosticoMedicoFechaDiagnostico,
          PersonalLicenciaDiagnosticoMedicoDiagnostico)
        VALUES (@0,@1,@2,@3,@4)`,[DiagnosticoUpdate,PersonalId,PersonalLicenciaUltNro,PersonalLicenciaDesdeDiagnostico,PersonalLicenciaDiagnosticoMedicoDiagnostico])
      
        if (PersonalLicenciaDesde != null) 
          await this.CreateSituacionRevista(2,queryRunner,PersonalId,PersonalLicenciaDesde,PersonalLicenciaHasta,PersonalSituacionRevistaUltNro,PersonalSituacionRevistaMotivo,PersonalSituacionRevistaSituacionId)
      }
      //Actuliza la fecha del registro anterior
      await this.UpdateHastaSitucionRevistaAnterior(PersonalId,PersonalSituacionRevistaId,PersonalLicenciaHasta,queryRunner)
      await this.handlePDFUpload(anioRequest, mesRequest, PersonalId, PersonalLicenciaId, res, req, Archivos, next)
      await queryRunner.commitTransaction();
      this.jsonRes({ list: [] }, res, (PersonalLicenciaId) ? `se Actualizó con exito el registro` : `se Agregó con exito el registro`);

    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    }

  }

  formatDateToCustomFormat(dateString: string): Date {
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0)
    return date;
  }

  async CreateSituacionRevista(value:number,queryRunner:QueryRunner,
    PersonalId:any,
    PersonalLicenciaDesde:Date,
    PersonalLicenciaHasta:Date,
    PersonalSituacionRevistaUltNro: any,
    PersonalSituacionRevistaMotivo:any,
    PersonalSituacionRevistaSituacionId:any
    
  ){

    switch (value) {
      case 0:
          // update
          PersonalLicenciaHasta.setDate(PersonalLicenciaHasta.getDate() + 1);
          await queryRunner.query(`
          UPDATE PersonalSituacionRevista
          SET PersonalSituacionRevistaDesde = @2
          WHERE PersonalId = @0 AND PersonalSituacionRevistaId = @1`, 
            [PersonalId,
             PersonalSituacionRevistaUltNro,
             PersonalLicenciaHasta
            ])
          break;
      case 1:
          // Delete
          await queryRunner.query(`DELETE FROM PersonalSituacionRevista WHERE PersonalId = @0 AND PersonalSituacionRevistaId = @1`, 
              [PersonalId,PersonalSituacionRevistaUltNro])
          break;
      case 2:
          // Create
          PersonalLicenciaHasta.setDate(PersonalLicenciaHasta.getDate() + 1);
          await queryRunner.query(`INSERT INTO PersonalSituacionRevista (
            PersonalId,
            PersonalSituacionRevistaId,
            PersonalSituacionRevistaDesde,
            PersonalSituacionRevistaTomoConocimiento, 
            PersonalSituacionRevistaHasta,
            PersonalSituacionRevistaMotivo,
            PersonalSituacionRevistaAnula,
            PersonalSituacionRevistaSituacionId,
            PersonalSituacionRevistaSituacionClasificacionId,
            PersonalSituacionRevistaRetenerLiquidacion) 
            VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8,@9)`, 
            [PersonalId,
             PersonalSituacionRevistaUltNro + 1,
             PersonalLicenciaHasta,
             null,
             null,
             PersonalSituacionRevistaMotivo,
             null,
             PersonalSituacionRevistaSituacionId,
             null,
             null
            ])
          break;
    }
  }

  async UpdateHastaSitucionRevistaAnterior(PersonalId:any,PersonalSituacionRevistaId:any,PersonalLicenciaHasta:Date,queryRunner:QueryRunner){
    const DateHastaPersonalSituacionRevista = PersonalLicenciaHasta.setDate(PersonalLicenciaHasta.getDate() - 1)
    await queryRunner.query(`UPDATE PersonalSituacionRevista
      SET PersonalSituacionRevistaHasta = @2
      WHERE PersonalId = @0 AND PersonalSituacionRevistaId = @1`, 
      [PersonalId,
      PersonalSituacionRevistaId,
       DateHastaPersonalSituacionRevista])
  }

  async deleteLincencia(req: Request, res: Response, next: NextFunction) {

    const {
      SucursalId,
      PersonalLicenciaId,
      PersonalId
    } = req.query
    const queryRunner = dataSource.createQueryRunner();
    try {
      const result = await queryRunner.query(`select * from PersonalLicencia where PersonalId=@0 and PersonalLicenciaId=@1 `
        , [PersonalId, PersonalLicenciaId])

      console.log(result.length)
      if (result.length > 0) {
        await queryRunner.query(` DELETE FROM PersonalLicencia WHERE PersonalId = @0 and PersonalLicenciaId =@1`
          , [PersonalId, PersonalLicenciaId])

        await queryRunner.query(`DELETE FROM lige.dbo.docgeneral WHERE Persona_id = @0 AND doctipo_id = 'LIC' AND den_documento = @1`
          , [PersonalId, PersonalLicenciaId])

      } else {
        throw new ClientException(`No se puede eliminar la licencia`)
      }

      this.jsonRes({ list: [] }, res, `Licencia borrada con exito`);
    } catch (error) {
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
     
      let result = await this.getLicenciaQuery(queryRunner,anio, mes, PersonalId, PersonalLicenciaId)
      this.jsonRes(result[0], res);
    } catch (error) {
      return next(error)
    }
  }

  async getLicenciaQuery(queryRunner:QueryRunner,anio:any, mes:any, PersonalId:any, PersonalLicenciaId:any){
    let selectquery = `SELECT suc.SucursalId, suc.SucursalDescripcion,
    persona.PersonalId,lic.PersonalLicenciaId, persona.PersonalApellido, persona.PersonalNombre, 

    PARSENAME(lic.PersonalLicenciaHorasMensuales,2)+ CAST(PARSENAME(lic.PersonalLicenciaHorasMensuales,1) AS FLOAT)/60 AS PersonalLicenciaHorasMensuales,

    val.ValorLiquidacionHoraNormal,
    (PARSENAME(licimp.PersonalLicenciaAplicaPeriodoHorasMensuales,2)+ CAST(PARSENAME(licimp.PersonalLicenciaAplicaPeriodoHorasMensuales,1) AS FLOAT)/60) * val.ValorLiquidacionHoraNormal AS total,  

    lic.PersonalLicenciaSePaga,
    tli.TipoInasistenciaId,
    tli.TipoInasistenciaDescripcion,
    tli.TipoInasistenciaApartado,
    lic.PersonalLicenciaDesde,
    lic.PersonalLicenciaHasta,
    lic.PersonalLicenciaTermina,
    cat.CategoriaPersonalDescripcion,
    lic.PersonalLicenciaObservacion,
    lic.PersonalLicenciaTipoAsociadoId,
    lic.PersonalLicenciaCategoriaPersonalId,
    med.PersonalLicenciaDiagnosticoMedicoDiagnostico,
    med.PersonalLicenciaDiagnosticoMedicoFechaDiagnostico,
      1
    FROM PersonalLicencia lic 
    JOIN Personal persona ON persona.PersonalId = lic.PersonalId
    JOIN TipoInasistencia tli ON tli.TipoInasistenciaId = lic.PersonalTipoInasistenciaId
    LEFT JOIN PersonalSucursalPrincipal sucpri ON sucpri.PersonalId = persona.PersonalId
    LEFT JOIN PersonalLicenciaAplicaPeriodo licimp ON lic.PersonalId = licimp.PersonalId AND lic.PersonalLicenciaId = licimp.PersonalLicenciaId AND licimp.PersonalLicenciaAplicaPeriodoAplicaEl = CONCAT(RIGHT('  '+CAST(@2 AS VARCHAR(2)),2),'/',@1)
    LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(sucpri.PersonalSucursalPrincipalSucursalId,1)
    LEFT JOIN CategoriaPersonal cat ON cat.TipoAsociadoId = lic.PersonalLicenciaTipoAsociadoId AND cat.CategoriaPersonalId = lic.PersonalLicenciaCategoriaPersonalId
    LEFT JOIN ValorLiquidacion val ON val.ValorLiquidacionSucursalId = suc.SucursalId AND val.ValorLiquidacionTipoAsociadoId = lic.PersonalLicenciaTipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId = lic.PersonalLicenciaCategoriaPersonalId AND val.ValorLiquidacionDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND ISNULL(val.ValorLiquidacionHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1)
    LEFT JOIN PersonalLicenciaDiagnosticoMedico med ON med.PersonalId=persona.PersonalId AND med.PersonalLicenciaId = lic.PersonalLicenciaId
    WHERE lic.PersonalId=@3 AND lic.PersonalLicenciaId=@4 `

    const result = await queryRunner.query(selectquery, [null,anio, mes, PersonalId, PersonalLicenciaId])
    return result
  }

  async UpdateDiagnosticoMedico(
    PersonalLicenciaDiagnosticoMedicoDiagnostico:any, 
    PersonalId:any, 
    PersonalLicenciaId:any,
    res: Response,
    req: Request,
    next: NextFunction
  ) {

    const queryRunner = dataSource.createQueryRunner();

    try {
      //valida si existe diagnostico medico
      if(PersonalLicenciaDiagnosticoMedicoDiagnostico.trim() == ""){

         let result = await queryRunner.query(`SELECT * FROM
           PersonalLicenciaDiagnosticoMedico 
           WHERE personalId = @0 AND PersonalLicenciaId = @1`,[ PersonalId, PersonalLicenciaId])
           console.log("este es el result ", result)

           // valida si existe registro en PersonalLicenciaDiagnosticoMedico
           // si no es que ya venia null

           if (result.length > 0) {
            //borra el registro con el mayor numero en PersonalLicenciaDiagnosticoMedicoId
            await queryRunner.query(`DELETE FROM PersonalLicenciaDiagnosticoMedico
            WHERE PersonalLicenciaDiagnosticoMedicoId = (
                SELECT TOP 1 PersonalLicenciaDiagnosticoMedicoId
                FROM PersonalLicenciaDiagnosticoMedico
                WHERE personalId = @0 AND PersonalLicenciaId = @1
                ORDER BY PersonalLicenciaDiagnosticoMedicoId DESC
            ) AND personalId = @0 AND PersonalLicenciaId = @1`,[ PersonalId, PersonalLicenciaId])
        } 
      }else{
        await queryRunner.query(`UPDATE PersonalLicenciaDiagnosticoMedico
        SET PersonalLicenciaDiagnosticoMedicoDiagnostico = @0
        WHERE PersonalLicenciaDiagnosticoMedicoId = (
            SELECT MAX(PersonalLicenciaDiagnosticoMedicoId)
            FROM PersonalLicenciaDiagnosticoMedico
            WHERE PersonalId = @1 AND PersonalLicenciaId = @2) AND PersonalId = @1 AND PersonalLicenciaId = @2`
          , [PersonalLicenciaDiagnosticoMedicoDiagnostico.trim(), PersonalId, PersonalLicenciaId])
      }
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next('Error:' + error)
    }

  }


  async handlePDFUpload(
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
      this.rollbackTransaction(queryRunner)
      //return next(error)
      return next('Error processing files:' + error)
    }
  }

  moveFile(filename: any, newFilePath: any, dirtmp: any) {
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

  }

  async setLicenciaDocGeneral(
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

  }

  async getLicenciaAnteriores(
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
  }

  async getByDownLicencia(req: any, res: Response, next: NextFunction) {
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
  }

  async getLicenciatInfo(documentId: Number) {


    return dataSource.query(
      `SELECT doc_id AS id, path, nombre_archivo AS name FROM lige.dbo.docgeneral WHERE doc_id = @0`, [documentId])

  }

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

      let det:any = {}
      await queryRunner.query(`DELETE FROM  PersonalLicenciaAplicaPeriodo
        WHERE PersonalId = @0  AND PersonalLicenciaId = @1`,
        [PersonalId, PersonalLicenciaId]);

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
            `${Math.trunc(horas)}.${(60*(horas-Math.trunc(horas))).toString().padStart(2,'0')}`,
            `${mes.toString().padStart(2,' ')}/${anio}`,
            PersonalSucursal[0].PersonalSucursalPrincipalSucursalId
          ])

        det = await this.getLicenciaQuery(queryRunner,anio, mes, PersonalId, PersonalLicenciaId)
      }
      await queryRunner.commitTransaction();

      this.jsonRes(det[0], res, "Modificación con exito!");

    } catch (error) {
      this.rollbackTransaction(queryRunner)
      //return next(error)
      return next(`Error Procesando Cambios `)
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

  async validateDates (Fechadesde: Date, personalId: any) {
      return  await dataSource.query(
        `SELECT * FROM PersonalLicencia lic WHERE 
        lic.PersonalId = @0 AND 
        @1 >= lic.PersonalLicenciaDesde AND @1 < ISNULL(lic.PersonalLicenciaHasta,ISNULL(lic.PersonalLicenciaTermina , '9999-12-31')) 
        ` ,
        [personalId, Fechadesde]
      );
  }
}
