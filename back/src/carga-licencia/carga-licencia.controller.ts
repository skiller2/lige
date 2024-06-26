import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, getOptionsFromRequest } from "../impuestos-afip/filtros-utils/filtros";
import { NextFunction, Request, Response } from "express";
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
    searchHidden: true
  },
  {
    name: "Sucursal",
    type: "number",
    id: "SucursalId",
    field: "SucursalId",
    fieldName: "SucursalId",
    searchComponent: "inpurForSucursalSearch",
    hidden: true,
    searchHidden: false
  },
  {
    name: "Sucursal",
    type: "string",
    id: "SucursalDescripcion",
    field: "SucursalDescripcion",
    fieldName: "suc.SucursalDescripcion",
    hidden: false,
    searchHidden: true
  },
  {
    name: "PersonalLicenciaAplicaPeriodoAplicaEl",
    type: "string",
    id: "PersonalLicenciaAplicaPeriodoAplicaEl",
    field: "PersonalLicenciaAplicaPeriodoAplicaEl",
    fieldName: "licimp.PersonalLicenciaAplicaPeriodoAplicaEl",
    hidden: true,
    searchHidden: true
  },
  {
    name: "anio",
    type: "number",
    id: "anio",
    field: "anio",
    fieldName: "anio",
    hidden: true,
    searchHidden: true
  },
  {
    name: "mes",
    type: "number",
    id: "mes",
    field: "mes",
    fieldName: "mes",
    hidden: true,
    searchHidden: true
  },
  {
    name: "Personal",
    type: "number",
    id: "PersonalId",
    field: "PersonalId",
    fieldName: "persona.PersonalId",
    searchComponent: "inpurForPersonalSearch",
    hidden: true,
    searchHidden: false
  },
  {
    name: "Nombre y Apellido",
    type: "string",
    id: "NombreCompleto",
    field: "NombreCompleto",
    fieldName: "NombreCompleto",
    hidden: false,
    searchHidden: true
  },
  {
    name: "PersonalLicenciaAplicaPeriodoHorasMensuales",
    type: "number",
    id: "PersonalLicenciaAplicaPeriodoHorasMensuales",
    field: "PersonalLicenciaAplicaPeriodoHorasMensuales",
    fieldName: "licimp.PersonalLicenciaAplicaPeriodoHorasMensuales",
    hidden: true,
    searchHidden: true
  },
  {
    name: "ValorLiquidacionHoraNormal",
    type: "currency",
    id: "ValorLiquidacionHoraNormal",
    field: "ValorLiquidacionHoraNormal",
    fieldName: "val.ValorLiquidacionHoraNormal",
    hidden: true,
    searchHidden: true
  },
  {
    name: "Total",
    type: "number",
    id: "PersonalLicenciaAplicaPeriodoHorasMensuales",
    field: "PersonalLicenciaAplicaPeriodoHorasMensuales",
    fieldName: "licimp.PersonalLicenciaAplicaPeriodoHorasMensuales",
    hidden: true,
    searchHidden: true
  },
  {
    name: "Personal Licencia SePaga",
    type: "strng",
    id: "PersonalLicenciaSePaga",
    field: "PersonalLicenciaSePaga",
    fieldName: "lic.PersonalLicenciaSePaga",
    hidden: true,
    searchHidden: true
  },
  {
    name: "Tipo Inasistencia",
    type: "strng",
    id: "TipoInasistenciaDescripcion",
    field: "TipoInasistenciaDescripcion",
    fieldName: "tli.TipoInasistenciaDescripcion",
    hidden: false,
    searchHidden: true
  },
  {
    name: "Inasistencia Apartado",
    type: "number",
    id: "TipoInasistenciaApartado",
    field: "TipoInasistenciaApartado",
    fieldName: "tli.TipoInasistenciaApartado",
    hidden: true,
    searchHidden: true
  },
  {
    name: "Desde",
    type: "date",
    id: "PersonalLicenciaDesde",
    field: "PersonalLicenciaDesde",
    fieldName: "lic.PersonalLicenciaDesde",
    searchComponent: "inpurForFechaSearch",
    hidden: false,
    searchHidden: false
  },
  {
    name: "Hasta",
    type: "date",
    id: "PersonalLicenciaHasta",
    field: "PersonalLicenciaHasta",
    fieldName: "lic.PersonalLicenciaHasta",
    searchComponent: "inpurForFechaSearch",
    hidden: false,
    searchHidden: false
  },
  {
    name: "Termina",
    type: "date",
    id: "PersonalLicenciaTermina",
    field: "PersonalLicenciaTermina",
    fieldName: "lic.PersonalLicenciaTermina",
    hidden: true,
    searchHidden: true
  },
  {
    name: "Categoria",
    type: "string",
    id: "CategoriaPersonalDescripcion",
    field: "CategoriaPersonalDescripcion",
    fieldName: "cat.CategoriaPersonalDescripcion",
    hidden: false,
    searchHidden: false
  },
  {
    name: "Observacion",
    type: "string",
    id: "PersonalLicenciaObservacion",
    field: "PersonalLicenciaObservacion",
    fieldName: "lic.PersonalLicenciaObservacion",
    hidden: false,
    searchHidden: true
  },
  {
    name: "Diagnostico Medico",
    type: "string",
    id: "PersonalLicenciaDiagnosticoMedicoDiagnostico",
    field: "PersonalLicenciaDiagnosticoMedicoDiagnostico",
    fieldName: "med.PersonalLicenciaDiagnosticoMedicoDiagnostico",
    hidden: false,
    searchHidden: true
  },
  {
    name: "PersonalLicenciaDiagnosticoMedicoFechaDiagnostico",
    type: "date",
    id: "PersonalLicenciaDiagnosticoMedicoFechaDiagnostico",
    field: "PersonalLicenciaDiagnosticoMedicoFechaDiagnostico",
    fieldName: "med.PersonalLicenciaDiagnosticoMedicoFechaDiagnostico",
    hidden: true,
    searchHidden: true
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
    searchHidden: true
  },
  {
    name: "Sucursal",
    type: "number",
    id: "SucursalId",
    field: "SucursalId",
    fieldName: "SucursalId",
    searchComponent: "inpurForSucursalSearch",
    hidden: true,
    searchHidden: false
  },
  {
    name: "Sucursal",
    type: "string",
    id: "SucursalDescripcion",
    field: "SucursalDescripcion",
    fieldName: "suc.SucursalDescripcion",
    searchHidden: true,
    hidden: false,
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
    hidden: true,
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
    hidden: true,
  },
  {
    name: "TipoInasistenciaId",
    type: "string",
    id: "TipoInasistenciaId",
    field: "TipoInasistenciaId",
    fieldName: "TipoInasistenciaId",
    searchHidden: true,
    hidden: true,
  },
  {
    name: "Tipo Inasistencia",
    type: "string",
    id: "TipoInasistenciaDescripcion",
    field: "TipoInasistenciaDescripcion",
    fieldName: "TipoInasistenciaDescripcion",
    searchHidden: true,
    hidden: false,
  },
  {
    name: "PersonalLicencia Id",
    type: "number",
    id: "PersonalLicenciaId",
    field: "PersonalLicenciaId",
    fieldName: "PersonalLicenciaId",
    searchHidden: true,
    hidden: true,
  },
  {
    name: "Periodo",
    type: "string",
    id: "PersonalLicenciaAplicaPeriodoAplicaEl",
    field: "PersonalLicenciaAplicaPeriodoAplicaEl",
    fieldName: "PersonalLicenciaAplicaPeriodoAplicaEl",
    searchHidden: true,
    hidden: true,
  },
  {
    name: "PeriodoSucursalId",
    type: "number",
    id: "PersonalLicenciaAplicaPeriodoSucursalId",
    field: "PersonalLicenciaAplicaPeriodoSucursalId",
    fieldName: "PersonalLicenciaAplicaPeriodoSucursalId",
    searchHidden: true,
    hidden: true,
  },
  {
    name: "Personal Licencia SePaga",
    type: "string",
    id: "PersonalLicenciaSePaga",
    field: "PersonalLicenciaSePaga",
    fieldName: "PersonalLicenciaSePaga",
    searchHidden: true,
    hidden: true,
  },
  {
    name: "Horas período",
    type: "number",
    id: "PersonalLicenciaAplicaPeriodoHorasMensuales",
    field: "PersonalLicenciaAplicaPeriodoHorasMensuales",
    fieldName: "PersonalLicenciaAplicaPeriodoHorasMensuales",
    searchHidden: true,
    hidden: false,
  },
  {
    name: "Total Valor Liquidacion",
    type: "currency",
    id: "total",
    field: "total",
    fieldName: "total",
    searchHidden: true,
    hidden: false,

  },
  {
    name: "PersonalLicenciaAplicaPeriodo",
    type: "number",
    id: "PersonalLicenciaAplicaPeriodo",
    field: "PersonalLicenciaAplicaPeriodo",
    fieldName: "PersonalLicenciaAplicaPeriodo",
    searchHidden: true,
    hidden: true,
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
      PersonalLicenciaDesde,
      PersonalLicenciaHasta,
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
      Archivos,PersonalIdForEdit

    } = req.body

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

      if (PersonalLicenciaDesde != null) {
        PersonalLicenciaDesde = this.formatDateToCustomFormat(PersonalLicenciaDesde)
      } else {
        throw new ClientException(`Debe seleccionar la fecha desde`)
      }


      if (PersonalLicenciaHasta != null)
        PersonalLicenciaHasta = this.formatDateToCustomFormat(PersonalLicenciaHasta)

      if (PersonalLicenciaId) {  //UPDATE

        if(PersonalIdForEdit != PersonalId)
          throw new ClientException(`No puede modificar la persona`)

        let valueAplicaPeriodo = await queryRunner.query(`select * from PersonalLicenciaAplicaPeriodo WHERE PersonalId = @0 AND PersonalLicenciaId = @1`,
          [PersonalId, PersonalLicenciaId]
        )


        if (valueAplicaPeriodo.length > 0 && PersonalLicenciaSePaga == "N")
          throw new ClientException(`No se puede actualizar el registro a se paga NO ya que tiene horas cargadas`)


        await queryRunner.query(`UPDATE PersonalLicencia
          SET PersonalLicenciaDesde = @0, PersonalLicenciaHasta = @1, PersonalLicenciaTermina = @1, 
              PersonalTipoInasistenciaId = @2, PersonalLicenciaSePaga = @3, PersonalLicenciaHorasMensuales = @4,
              PersonalLicenciaObservacion = @5, PersonalLicenciaTipoAsociadoId = @6,PersonalLicenciaCategoriaPersonalId = @7
          WHERE PersonalId = @8 AND PersonalLicenciaId = @9`
          , [PersonalLicenciaDesde, PersonalLicenciaHasta, TipoInasistenciaId, PersonalLicenciaSePaga, PersonalLicenciaHorasMensuales,
            PersonalLicenciaObservacion, PersonalLicenciaCategoriaPersonalId, PersonalLicenciaTipoAsociadoId, PersonalId, PersonalLicenciaId])

      } else {  //INSERT


        let PersonalLicenciaSelect = await queryRunner.query(` SELECT PersonalLicenciaUltNro from Personal WHERE PersonalId = @0`, [PersonalId,])
        let { PersonalLicenciaUltNro } = PersonalLicenciaSelect[0]
        PersonalLicenciaUltNro += 1
        await queryRunner.query(` UPDATE Personal SET PersonalLicenciaUltNro = @1 where PersonalId = @0 `, [PersonalId, PersonalLicenciaUltNro])

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
          VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@7,@8,@9,@10,@11,@12,@13,@14,@15,@16,@17,@18,@19)`
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
            PersonalLicenciaObservacion,
            null,
            null,
            TipoInasistenciaId,
            PersonalLicenciaSePaga,
            `${Math.trunc(PersonalLicenciaHorasMensuales)}.${(60*(PersonalLicenciaHorasMensuales-Math.trunc(PersonalLicenciaHorasMensuales))).toString().padStart(2,'0')}`,
            PersonalLicenciaCategoriaPersonalId,
            PersonalLicenciaTipoAsociadoId,
            null,
            null])
      }


      await this.handlePDFUpload(anioRequest, mesRequest, PersonalId, PersonalLicenciaId, res, req, Archivos, next)

      await queryRunner.commitTransaction();
      this.jsonRes({ list: [] }, res, (PersonalLicenciaId) ? `se Actualizó con exito el registro` : `se Agregó con exito el registro`);

    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    }

  }

  formatDateToCustomFormat(dateString: string): string {
    const date = new Date(dateString);

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day} 00:00:00.000`;

    return formattedDate;
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
      let selectquery = `SELECT suc.SucursalId, suc.SucursalDescripcion,
      persona.PersonalId,lic.PersonalLicenciaId, persona.PersonalApellido, persona.PersonalNombre, 
--       licimp.PersonalLicenciaAplicaPeriodoHorasMensuales,
--     (ROUND(CAST(licimp.PersonalLicenciaAplicaPeriodoHorasMensuales AS FLOAT),0,0) *60+ PARSENAME(licimp.PersonalLicenciaAplicaPeriodoHorasMensuales,1))/60 AS horas,
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
    lic.PersonalLicenciaHorasMensuales,
    med.PersonalLicenciaDiagnosticoMedicoDiagnostico,
    med.PersonalLicenciaDiagnosticoMedicoFechaDiagnostico,
      1
      FROM PersonalLicencia lic 
      JOIN Personal persona ON persona.PersonalId = lic.PersonalId
      JOIN TipoInasistencia tli ON tli.TipoInasistenciaId = lic.PersonalTipoInasistenciaId
      LEFT JOIN PersonalSucursalPrincipal sucpri ON sucpri.PersonalId = persona.PersonalId 
      LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(sucpri.PersonalSucursalPrincipalSucursalId,1)
      LEFT JOIN CategoriaPersonal cat ON cat.TipoAsociadoId = lic.PersonalLicenciaTipoAsociadoId AND cat.CategoriaPersonalId = lic.PersonalLicenciaCategoriaPersonalId
      LEFT JOIN ValorLiquidacion val ON val.ValorLiquidacionSucursalId = suc.SucursalId AND val.ValorLiquidacionTipoAsociadoId = lic.PersonalLicenciaTipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId = lic.PersonalLicenciaCategoriaPersonalId AND val.ValorLiquidacionDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND ISNULL(val.ValorLiquidacionHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1)
      LEFT JOIN PersonalLicenciaDiagnosticoMedico med ON med.PersonalId=persona.PersonalId AND med.PersonalLicenciaId = lic.PersonalLicenciaId
      WHERE lic.PersonalId=@3 AND lic.PersonalLicenciaId=@4 `

      const result = await queryRunner.query(selectquery, [, anio, mes, PersonalId, PersonalLicenciaId])

      this.jsonRes(result[0], res);
    } catch (error) {
      return next(error)
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
        const detalle = await queryRunner.query(`SELECT * FROM PersonalLicenciaAplicaPeriodo WHERE PersonalLicenciaAplicaPeriodoId=@0 AND PersonalId=@1 AND PersonalLicenciaId=@2`,[personalLicenciaIncrement,PersonalId,PersonalLicenciaId])
        det = detalle[0]
        
        const tmp = det.PersonalLicenciaAplicaPeriodoHorasMensuales.split('.')
        det.PersonalLicenciaAplicaPeriodoHorasMensuales = Number(tmp[0])+Number(tmp[1])/60
      }
      await queryRunner.commitTransaction();

      this.jsonRes(det, res, "Modificación con exito!");

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

}
