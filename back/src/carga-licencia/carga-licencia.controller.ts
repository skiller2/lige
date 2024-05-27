import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, getOptionsFromRequest } from "../impuestos-afip/filtros-utils/filtros";
import { NextFunction, Request, Response } from "express";
import { ObjetivoController } from "src/controller/objetivo.controller";
import { AsistenciaController } from "../controller/asistencia.controller";

const columnasGrilla: any[] = [
  
  {
    name: "id",
    type: "number",
    id: "id",
    field: "id",
    fieldName: "id",
    hidden: true,
    searchHidden:true
  },
  {
    name: "Sucursal",
    type: "number",
    id: "SucursalId",
    field: "SucursalId",
    fieldName: "SucursalId",
    searchComponent:"inpurForSucursalSearch",
    hidden: true,
    searchHidden:false
  },
  {
    name: "Sucursal",
    type: "string",
    id: "SucursalDescripcion",
    field: "SucursalDescripcion",
    fieldName: "suc.SucursalDescripcion",
    hidden: false,
    searchHidden:true
  },
  {
    name: "PersonalLicenciaAplicaPeriodoAplicaEl",
    type: "string",
    id: "PersonalLicenciaAplicaPeriodoAplicaEl",
    field: "PersonalLicenciaAplicaPeriodoAplicaEl",
    fieldName: "licimp.PersonalLicenciaAplicaPeriodoAplicaEl",
    hidden: true,
    searchHidden:true
  },
  {
    name: "anio",
    type: "number",
    id: "anio",
    field: "anio",
    fieldName: "anio",
    hidden: true,
    searchHidden:true
  },
  {
    name: "mes",
    type: "number",
    id: "mes",
    field: "mes",
    fieldName: "mes",
    hidden: true,
    searchHidden:true
  },
  {
    name: "Personal",
    type: "number",
    id: "PersonalId",
    field: "PersonalId",
    fieldName: "persona.PersonalId",
    searchComponent: "inpurForPersonalSearch",
    hidden: true,
    searchHidden:false
  },
  {
    name: "Personal Apellido",
    type: "string",
    id: "PersonalApellido",
    field: "PersonalApellido",
    fieldName: "persona.PersonalApellido",
    hidden: false,
    searchHidden:true
  },
  {
    name: "Personal Nombre",
    type: "string",
    id: "PersonalNombre",
    field: "PersonalNombre",
    fieldName: "persona.PersonalNombre",
    hidden: false,
    searchHidden:true
  },
  {
    name: "PersonalLicenciaAplicaPeriodoHorasMensuales",
    type: "number",
    id: "PersonalLicenciaAplicaPeriodoHorasMensuales",
    field: "PersonalLicenciaAplicaPeriodoHorasMensuales",
    fieldName: "licimp.PersonalLicenciaAplicaPeriodoHorasMensuales",
    hidden: true,
    searchHidden:true
  },
  {
    name: "Horas",
    type: "number",
    id: "ValorLiquidacionHoraNormal",
    field: "ValorLiquidacionHoraNormal",
    fieldName: "val.ValorLiquidacionHoraNormal",
    hidden: false,
    searchHidden:true
  },
  {
    name: "ValorLiquidacionHoraNormal",
    type: "number",
    id: "ValorLiquidacionHoraNormal",
    field: "ValorLiquidacionHoraNormal",
    fieldName: "val.ValorLiquidacionHoraNormal",
    hidden: true,
    searchHidden:true
  },
 {
    name: "Total",
    type: "number",
    id: "PersonalLicenciaAplicaPeriodoHorasMensuales",
    field: "PersonalLicenciaAplicaPeriodoHorasMensuales",
    fieldName: "licimp.PersonalLicenciaAplicaPeriodoHorasMensuales",
    hidden: true,
    searchHidden:true
  },
  {
    name: "Personal Licencia SePaga",
    type: "strng",
    id: "PersonalLicenciaSePaga",
    field: "PersonalLicenciaSePaga",
    fieldName: "lic.PersonalLicenciaSePaga",
    hidden: true,
    searchHidden:true
  },
  {
    name: "Tipo Inasistencia",
    type: "strng",
    id: "TipoInasistenciaDescripcion",
    field: "TipoInasistenciaDescripcion",
    fieldName: "tli.TipoInasistenciaDescripcion",
    hidden: false,
    searchHidden:true
  },
  {
    name: "Inasistencia Apartado",
    type: "number",
    id: "TipoInasistenciaApartado",
    field: "TipoInasistenciaApartado",
    fieldName: "tli.TipoInasistenciaApartado",
    hidden: true,
    searchHidden:true
  },
  {
    name: "Desde",
    type: "date",
    id: "PersonalLicenciaDesde",
    field: "PersonalLicenciaDesde",
    fieldName: "lic.PersonalLicenciaDesde",
    searchComponent: "inpurForFechaSearch",
    hidden: false,
    searchHidden:false
  },
  {
    name: "Hasta",
    type: "date",
    id: "PersonalLicenciaHasta",
    field: "PersonalLicenciaHasta",
    fieldName: "lic.PersonalLicenciaHasta",
    searchComponent: "inpurForFechaSearch",
    hidden: false,
    searchHidden:false
  },
  {
    name: "Termina",
    type: "date",
    id: "PersonalLicenciaTermina",
    field: "PersonalLicenciaTermina",
    fieldName: "lic.PersonalLicenciaTermina",
    hidden: true,
    searchHidden:true
  },
  {
    name: "Categoria",
    type: "string",
    id: "CategoriaPersonalDescripcion",
    field: "CategoriaPersonalDescripcion",
    fieldName: "cat.CategoriaPersonalDescripcion",
    hidden: false,
    searchHidden:false
  },
  {
    name: "Observacion",
    type: "string",
    id: "PersonalLicenciaObservacion",
    field: "PersonalLicenciaObservacion",
    fieldName: "lic.PersonalLicenciaObservacion",
    hidden: false,
    searchHidden:true
  },
  {
    name: "Diagnostico Medico",
    type: "string",
    id: "PersonalLicenciaDiagnosticoMedicoDiagnostico",
    field: "PersonalLicenciaDiagnosticoMedicoDiagnostico",
    fieldName: "med.PersonalLicenciaDiagnosticoMedicoDiagnostico",
    hidden: false,
    searchHidden:true
  },
  {
    name: "PersonalLicenciaDiagnosticoMedicoFechaDiagnostico",
    type: "date",
    id: "PersonalLicenciaDiagnosticoMedicoFechaDiagnostico",
    field: "PersonalLicenciaDiagnosticoMedicoFechaDiagnostico",
    fieldName: "med.PersonalLicenciaDiagnosticoMedicoFechaDiagnostico",
    hidden: true,
    searchHidden:true
  }
];

export class CargaLicenciaController extends BaseController {


  async getGridCols(req, res) {
    this.jsonRes(columnasGrilla, res);
  }

  async list(
    req: any,
    res: Response,
    next:NextFunction
  ) {
   
    const filterSql = filtrosToSql(req.body[0]["options"].filtros, columnasGrilla);
    //const orderBy = orderToSQL(req.body.options.sort)
    const anio = Number( req.body[1])
    const mes = Number(req.body[2])
    const queryRunner = dataSource.createQueryRunner();
    try {

      const listCargaLicencia = await AsistenciaController.getAsistenciaAdminArt42(anio,mes,queryRunner, [],filterSql)
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

 

}
