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
      IsEdit
    } = req.body


    const queryRunner = dataSource.createQueryRunner();

    try {

      await queryRunner.connect();
      await queryRunner.startTransaction();

      if(PersonalLicenciaSePaga ==  "S"){
          if(!PersonalLicenciaCategoriaPersonalId)
            throw new ClientException(`Debe seleccionar categoría`)
      }

      if (!TipoInasistenciaId) 
        throw new ClientException(`Debe seleccionar Tipo de Inasistencia`)


      if (PersonalLicenciaId) {  //UPDATE

        console.log("voy a editar.....")

        const result = await queryRunner.query(`UPDATE PersonalLicencia
          SET PersonalLicenciaDesde = @0, PersonalLicenciaHasta = @1, PersonalLicenciaTermina = @1, 
              PersonalTipoInasistenciaId = @2, PersonalLicenciaSePaga = @3, PersonalLicenciaHorasMensuales = @4,
              PersonalLicenciaObservacion = @5, PersonalLicenciaTipoAsociadoId = @6,PersonalLicenciaCategoriaPersonalId = @7
          WHERE PersonalId = @8 AND PersonalLicenciaId = @9;`
          , [PersonalLicenciaDesde,PersonalLicenciaHasta,TipoInasistenciaId,PersonalLicenciaSePaga,PersonalLicenciaHorasMensuales,
            PersonalLicenciaObservacion,PersonalLicenciaCategoriaPersonalId,PersonalLicenciaTipoAsociadoId,PersonalId,PersonalLicenciaId]) 

      }else{  //INSERT

        console.log("voy a agregar uno nuevo.....")


        let PersonalLicenciaSelect = await queryRunner.query(` SELECT PersonalLicenciaUltNro from Personal WHERE PersonalId = @0`, [27,]) 
        let {PersonalLicenciaUltNro} = PersonalLicenciaSelect[0]
        PersonalLicenciaUltNro += 1
        await queryRunner.query(` UPDATE Personal SET PersonalLicenciaUltNro = @1 where PersonalId = @0 `, [PersonalId,PersonalLicenciaUltNro]) 

        const result = await queryRunner.query(`INSERT INTO PersonalLicencia (PersonalId, PersonalLicenciaId, PersonalLicenciaHistorica, TipoLicenciaId, PersonalLicenciaContraRenuncia, 
          PersonalLicenciaDesde, PersonalLicenciaHasta, PersonalLicenciaTermina, PersonalLicenciaDesdeConsejo, PersonalLicenciaHastaConsejo, 
          PersonalLicenciaTerminaConsejo, PersonalLicenciaObservacion, PersonalLicenciaDiagnosticoMedicoUltNro, PersonalLicenciaLiquidacionUltNro, PersonalTipoInasistenciaId, 
          PersonalLicenciaSePaga, PersonalLicenciaHorasMensuales, PersonalLicenciaTipoAsociadoId, PersonalLicenciaCategoriaPersonalId, PersonalLicenciaAplicaPeriodoUltNro, 
          PersonalLicenciaSituacionRevistaId)
          VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@7,@8,@9,@10,@11,@12,@13,@14,@15,@16,@17,@18,@19)`
          , [PersonalId, PersonalLicenciaUltNro, null, null, 'N',
            PersonalLicenciaDesde, PersonalLicenciaHasta, PersonalLicenciaHasta, null, null,
            null, PersonalLicenciaObservacion, null, null, TipoInasistenciaId,
            PersonalLicenciaSePaga,  PersonalLicenciaHorasMensuales, PersonalLicenciaTipoAsociadoId, PersonalLicenciaCategoriaPersonalId,null]) 
             
      }

      

      await queryRunner.commitTransaction();
      this.jsonRes({ list: [] }, res, (PersonalLicenciaId)? `se Actualizó con exito el registro`:`se Agregó con exito el registro`);
      
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
       const result = await queryRunner.query(`select * from PersonalLicenciaAplicaPeriodo where PersonalId=@0 and PersonalLicenciaId=@1 `
        , [PersonalId,PersonalLicenciaId]) 

        console.log(result.length)
        if(result.length > 0) {
          const result = await queryRunner.query(` DELETE FROM PersonalLicencia WHERE PersonalId = @0 and PersonalLicenciaId =@1`
            , [PersonalId,PersonalLicenciaId]) 
        }else{
          throw new ClientException(`No se puede eliminar la licencia`)
        }

        this.jsonRes({ list: [] }, res, `Licencia borrada con exito`);
    } catch (error) {
      return next(error)
    }

  }

  async getLicencia(req: Request, res: Response, next: NextFunction) {
    const PersonalId = Number(req.params.PersonalId)
    const  PersonalLicenciaId = Number(req.params.PersonalLicenciaId)
    const  anio = Number(req.params.anio)
    const  mes = Number(req.params.mes)
    const queryRunner = dataSource.createQueryRunner();

    try {
      let selectquery = `SELECT suc.SucursalId, suc.SucursalDescripcion,
      persona.PersonalId,lic.PersonalLicenciaId, persona.PersonalApellido, persona.PersonalNombre, 
--       licimp.PersonalLicenciaAplicaPeriodoHorasMensuales,
--     (ROUND(CAST(licimp.PersonalLicenciaAplicaPeriodoHorasMensuales AS FLOAT),0,0) *60+ PARSENAME(licimp.PersonalLicenciaAplicaPeriodoHorasMensuales,1))/60 AS horas,
     val.ValorLiquidacionHoraNormal,
--     (ROUND(CAST(licimp.PersonalLicenciaAplicaPeriodoHorasMensuales AS FLOAT),0,0) *60+ PARSENAME(licimp.PersonalLicenciaAplicaPeriodoHorasMensuales,1))/60 * val.ValorLiquidacionHoraNormal AS total,
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
      
      const result = await queryRunner.query(selectquery, [,anio,mes,PersonalId,PersonalLicenciaId]) 
      this.jsonRes(result[0], res);
    } catch (error) {
      return next(error)
    }
  }

}
