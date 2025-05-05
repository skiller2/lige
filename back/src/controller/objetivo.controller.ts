import { Response } from "express";
import { BaseController } from "./baseController";
import { dataSource } from "../data-source";
import { ObjetivoInfo } from "../schemas/ResponseJSON";
import { NextFunction } from "express-serve-static-core";
import { QueryRunner, QueryRunnerAlreadyReleasedError } from "typeorm";

export class ObjetivoController extends BaseController {
  async ObjetivoInfoFromId(objetivoId: string, res, next: NextFunction) {
    try {
      const result: ObjetivoInfo[] = await dataSource.query(
        `SELECT obj.ObjetivoId objetivoId, obj.ClienteId clienteId, obj.ClienteElementoDependienteId elementoDependienteId,
        ISNULL(ele.ClienteElementoDependienteDescripcion,cli.ClienteApellidoNombre) descripcion, 
        ISNULL(ISNULL(ele.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1) SucursalId
        FROM Objetivo obj 
        JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
        LEFT JOIN ClienteElementoDependiente ele ON ele.ClienteId = obj.ClienteId AND ele.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
        WHERE obj.ObjetivoId = @0`,
        [objetivoId]
      );
      const info = result[0];
      this.jsonRes(info, res);
    } catch (error) {
      return next(error)
    }
  }

  static async getObjetivoContratos(objetivoId: number, anio: number, mes: number, queryRunner: QueryRunner) {
    const buscaObjetivo = (objetivoId != 0) ? ' AND obj.ObjetivoId=@0' : ''
    return queryRunner
      .query(
        `SELECT  DISTINCT obj.ObjetivoId, obj.ClienteId, obj.ClienteElementoDependienteId,
     obj.ObjetivoDescripcion,
    ISNULL(ISNULL(eledep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1) SucursalId,
  eledepcon.ClienteElementoDependienteContratoFechaDesde ContratoFechaDesde,
  eledepcon.ClienteElementoDependienteContratoFechaHasta ContratoFechaHasta,
  eledepcon.ClienteElementoDependienteContratoFechaDesde desde,
  ISNULL(eledepcon.ClienteElementoDependienteContratoFechaHasta,'9999-12-31') hasta,
  
    1
    
    FROM Objetivo obj 

    LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
    LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteId = obj.ClienteId  AND eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
    LEFT JOIN ClienteElementoDependienteContrato eledepcon ON eledepcon.ClienteId = obj.ClienteId AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId 
    AND EOMONTH(DATEFROMPARTS(@1,@2,1)) >= eledepcon.ClienteElementoDependienteContratoFechaDesde AND ISNuLL(eledepcon.ClienteElementoDependienteContratoFechaHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1) AND ISNuLL(eledepcon.ClienteElementoDependienteContratoFechaFinalizacion,'9999-12-31') >= DATEFROMPARTS(@1,@2,1)
    
    LEFT JOIN ClienteElementoDependienteDomicilio domdep ON domdep.ClienteId = eledep.ClienteId AND domdep.ClienteElementoDependienteId  = eledep.ClienteElementoDependienteId
    LEFT JOIN ClienteDomicilio domcli ON domcli.ClienteId = cli.ClienteId AND obj.ClienteElementoDependienteId IS NULL
    
  WHERE 
     eledepcon.ClienteElementoDependienteContratoFechaDesde IS NOT NULL
    ${buscaObjetivo}`,
        [objetivoId, anio, mes]
      )

  }

  static async getObjetivoResponsables(objetivoId: number, anio: number, mes: number, queryRunner: QueryRunner) {
    return queryRunner
      .query(
        `SELECT 1 AS ord, obj.ObjetivoId as id, 'Grupo' tipo,
        ga.GrupoActividadId, CONCAT (ga.GrupoActividadNumero, ' ',ga.GrupoActividadDetalle) AS detalle, gap.GrupoActividadObjetivoDesde AS desde , gap.GrupoActividadObjetivoHasta hasta,
          1
          
          FROM Objetivo obj 
           JOIN GrupoActividadObjetivo gap ON gap.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND EOMONTh(DATEFROMPARTS(@1,@2,1)) >=   gap.GrupoActividadObjetivoDesde  AND DATEFROMPARTS(@1,@2,1) <  ISNULL(gap.GrupoActividadObjetivoHasta,'9999-12-31') 
         JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId
          WHERE  obj.ObjetivoId = @0
    UNION
    SELECT 2, obj.ObjetivoId, 'Coordinador' tipo,
        per.PersonalId, CONCAT(TRIM(per.PersonalApellido),', ',TRIM(per.PersonalNombre)) AS ApellidoNombre, opj.ObjetivoPersonalJerarquicoDesde, opj.ObjetivoPersonalJerarquicoHasta,
          1
          
          FROM Objetivo obj 
          JOIN ObjetivoPersonalJerarquico opj ON opj.ObjetivoId = obj.ObjetivoId AND 
        EOMONTh(DATEFROMPARTS(@1,@2,1)) >   opj.ObjetivoPersonalJerarquicoDesde  AND DATEFROMPARTS(@1,@2,1) <  ISNULL(opj.ObjetivoPersonalJerarquicoHasta,'9999-12-31') 
          JOIN Personal per ON per.PersonalId = opj.ObjetivoPersonalJerarquicoPersonalId
        WHERE  obj.ObjetivoId = @0
    UNION
    SELECT 3, obj.ObjetivoId, 'Supervisor' tipo,
        per.PersonalId, CONCAT(TRIM(per.PersonalApellido),', ',TRIM(per.PersonalNombre)) AS ApellidoNombre, gaj.GrupoActividadJerarquicoDesde AS desde , gaj.GrupoActividadJerarquicoHasta hasta,
          1
          
          FROM Objetivo obj 
          LEFT JOIN GrupoActividadObjetivo gap ON gap.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND EOMONTh(DATEFROMPARTS(@1,@2,1)) >=   gap.GrupoActividadObjetivoDesde  AND DATEFROMPARTS(@1,@2,1) <  ISNULL(gap.GrupoActividadObjetivoHasta,'9999-12-31') 
        LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId
        LEFT JOIN GrupoActividadJerarquico gaj ON gaj.GrupoActividadId = ga.GrupoActividadId AND EOMONTh(DATEFROMPARTS(@1,@2,1)) >=   gaj.GrupoActividadJerarquicoDesde  AND DATEFROMPARTS(@1,@2,1) <  ISNULL(gaj.GrupoActividadJerarquicoHasta,'9999-12-31') AND gaj.GrupoActividadJerarquicoComo = 'J'
        JOIN Personal per ON per.PersonalId = gaj.GrupoActividadJerarquicoPersonalId
          WHERE  obj.ObjetivoId = @0
    UNION
    SELECT 4, obj.ObjetivoId, 'Administrador' tipo,
        per.PersonalId, CONCAT(TRIM(per.PersonalApellido),', ',TRIM(per.PersonalNombre)) AS ApellidoNombre, gaj.GrupoActividadJerarquicoDesde AS desde , gaj.GrupoActividadJerarquicoHasta hasta,
          1
          
          FROM Objetivo obj 
          LEFT JOIN GrupoActividadObjetivo gap ON gap.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND EOMONTh(DATEFROMPARTS(@1,@2,1)) >=   gap.GrupoActividadObjetivoDesde  AND DATEFROMPARTS(@1,@2,1) <  ISNULL(gap.GrupoActividadObjetivoHasta,'9999-12-31') 
        LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId
        LEFT JOIN GrupoActividadJerarquico gaj ON gaj.GrupoActividadId = ga.GrupoActividadId AND EOMONTh(DATEFROMPARTS(@1,@2,1)) >=   gaj.GrupoActividadJerarquicoDesde  AND DATEFROMPARTS(@1,@2,1) <  ISNULL(gaj.GrupoActividadJerarquicoHasta,'9999-12-31') AND gaj.GrupoActividadJerarquicoComo = 'A'
        JOIN Personal per ON per.PersonalId = gaj.GrupoActividadJerarquicoPersonalId
          WHERE  obj.ObjetivoId = @0
    ORDER BY ord
    `,
        [objetivoId, anio, mes]
      )

  }

  async getObjetivoContratosResponse(objetivoId: number, anio: number, mes: number, res: Response, next: NextFunction) {
    try {
      const queryRunner = dataSource.createQueryRunner();
      const records = await ObjetivoController.getObjetivoContratos(objetivoId, anio, mes, queryRunner)
      this.jsonRes(records, res);

    } catch (error) {
      return next(error);

    }
  }

  async getObjetivoResponsablesResponse(objetivoId: number, anio: number, mes: number, res: Response, next: NextFunction) {
    try {
      const queryRunner = dataSource.createQueryRunner();
      const records = await ObjetivoController.getObjetivoResponsables(objetivoId, anio, mes, queryRunner)
      this.jsonRes(records, res);

    } catch (error) {
      return next(error);

    }
  }


  async getById(objetivoId: number, anio: number, mes: number, res: Response, next: NextFunction) {
    let fechaHasta = new Date(anio, mes, 1);
    fechaHasta.setDate(fechaHasta.getDate() - 1);

    dataSource
      .query(
        `SELECT DISTINCT suc.SucursalId,
                 
        obj.ObjetivoId, 
        obj.ClienteId,
        obj.ClienteElementoDependienteId,
        obj.ObjetivoDescripcion,
        ga.GrupoActividadId, ga.GrupoActividadNumero, ga.GrupoActividadDetalle,
        gap.GrupoActividadObjetivoDesde, gap.GrupoActividadObjetivoHasta,
		  CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombreCoordinador,
      opj.ObjetivoPersonalJerarquicoDesde,opj.ObjetivoPersonalJerarquicoHasta,
		  per.PersonalId AS PersonalIdCoordinador,
      
        1
        
        FROM Objetivo obj 
        
  LEFT JOIN ObjetivoPersonalJerarquico opj ON opj.ObjetivoId = obj.ObjetivoId AND  opj.ObjetivoPersonalJerarquicoDesde  <= @0 AND ISNULL(opj.ObjetivoPersonalJerarquicoHasta,'9999-12-31') >= @0
  LEFT JOIN Personal per ON per.PersonalId = opj.ObjetivoPersonalJerarquicoPersonalId
  
  LEFT JOIN GrupoActividadObjetivo gap ON gap.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND  gap.GrupoActividadObjetivoDesde  <= @0 AND ISNULL(gap.GrupoActividadObjetivoHasta,'9999-12-31') >= @0
  LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId



        LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
        LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteId = obj.ClienteId  AND eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
        
      LEFT JOIN ClienteElementoDependienteDomicilio domdep ON domdep.ClienteId = clidep.ClienteId AND domdep.ClienteElementoDependienteId  = clidep.ClienteElementoDependienteId AND domdep.ClienteElementoDependienteDomicilioDomicilioActual = 1
      LEFT JOIN ClienteDomicilio domcli ON domcli.ClienteId = cli.ClienteId AND obj.ClienteElementoDependienteId IS NULL AND domcli.ClienteDomicilioActual = 1
        
        LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(eledep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
        

            WHERE obj.ObjetivoId=@1`,
        [fechaHasta, objetivoId]
      )
      .then((records: Array<any>) => {
        //                if (records.length != 1) throw new ClientException('Objetivo not found')
        this.jsonRes(records, res);
      })
      .catch((error) => {
        return next(error);
      });
  }


  async search(req: any, res: Response, next: NextFunction) {
    try {
      const { sucursalId, fieldName, value } = req.body;
      if (sucursalId == "") {
        this.jsonRes({ objetivos: [] }, res);
        return;
      }
      let buscar = false;
      let query = `
      SELECT DISTINCT
      suc.SucursalId, suc.SucursalDescripcion, 
      
      ga.GrupoActividadId, ga.GrupoActividadNumero, ga.GrupoActividadDetalle,
      gap.GrupoActividadObjetivoDesde, gap.GrupoActividadObjetivoHasta,

	    ISNULL(clidep.ClienteElementoDependienteDescripcion,cli.ClienteApellidoNombre) ObjetivoDescripcion,
      obj.ObjetivoId, 
      
      obj.ClienteId,
      clidep.ClienteElementoDependienteId,
      
      domdep.ClienteElementoDependienteDomicilioDomCalle, domdep.ClienteElementoDependienteDomicilioDomNro,
      domcli.ClienteDomicilioDomCalle, domcli.ClienteDomicilioDomNro,
      
      1
      FROM Objetivo obj
      
      LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
      LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
      
      LEFT JOIN ClienteElementoDependienteDomicilio domdep ON domdep.ClienteId = clidep.ClienteId AND domdep.ClienteElementoDependienteId  = clidep.ClienteElementoDependienteId AND domdep.ClienteElementoDependienteDomicilioDomicilioActual = 1
      LEFT JOIN ClienteDomicilio domcli ON domcli.ClienteId = cli.ClienteId AND obj.ClienteElementoDependienteId IS NULL AND domcli.ClienteDomicilioActual = 1
      
      LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)

      LEFT JOIN GrupoActividadObjetivo gap ON gap.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND  gap.GrupoActividadObjetivoDesde  <= @0 AND ISNULL(gap.GrupoActividadObjetivoHasta,'9999-12-31') >= @0
      LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId
WHERE  `;

      if (sucursalId > 0)
        query += ' suc.SucursalId = @1 AND '

      switch (fieldName) {
        case "Descripcion":
          const valueArray: Array<string> = value.split(/[\s,.-]+/);
          valueArray.forEach((element, index) => {
            if (element.trim().length > 1) {
              query += `ISNULL(clidep.ClienteElementoDependienteDescripcion,cli.ClienteApellidoNombre) LIKE '%${element.trim()}%' AND `;
              buscar = true;
            }
          });

          query += ` 1=1 `;
          break;
        case "Codigo":
          buscar = true;
          query = `${query} CONCAT(obj.ClienteId, '/', ISNULL(clidep.ClienteElementoDependienteId, 0)) LIKE '%${value}%'`;
          break;
        default:
          break;
      }

      if (buscar) {
        const result = await dataSource.query(query, [new Date(), sucursalId]);
        this.jsonRes({ objetivos: result }, res);
      } else this.jsonRes({ objetivos: [] }, res);
    } catch (error) {
      return next(error);
    }
  }
}
