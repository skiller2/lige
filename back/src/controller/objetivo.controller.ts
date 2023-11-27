import { Response } from "express";
import { BaseController } from "./baseController";
import { dataSource } from "../data-source";
import { ObjetivoInfo } from "../schemas/ResponseJSON";
import { NextFunction } from "express-serve-static-core";

export class ObjetivoController extends BaseController {
  async ObjetivoInfoFromId(objetivoId: string, res,next:NextFunction) {
    try {
      const result: ObjetivoInfo[] = await dataSource.query(
        `SELECT obj.ObjetivoId objetivoId, obj.ClienteId clienteId, obj.ClienteElementoDependienteId elementoDependienteId, obj.ObjetivoDescripcion descripcion FROM Objetivo obj WHERE obj.ObjetivoId = @0`,
        [objetivoId]
      );
      const info = result[0];
      this.jsonRes(info, res);
    } catch (error) {
      return next(error)
    }
  }

  async getById(objetivoId: number, anio: number, mes: number, res: Response,next:NextFunction) {
    let fechaHasta = new Date(anio, mes, 1);
    fechaHasta.setDate(fechaHasta.getDate() - 1);

    dataSource
      .query(
        `SELECT DISTINCT suc.SucursalId,
                 
            obj.ObjetivoId, 
            obj.ClienteId,
            obj.ClienteElementoDependienteId,
            obj.ObjetivoDescripcion,
            
            perjer.PersonalId,
            CONCAT(TRIM(perjer.PersonalApellido), ', ' ,TRIM(perjer.PersonalNombre) ) AS ApellidoNombreJerarquico,
            cuit.PersonalCUITCUILCUIT,
            opj.ObjetivoPersonalJerarquicoDesde,
            opj.ObjetivoPersonalJerarquicoHasta,
            opj.ObjetivoPersonalJerarquicoComo,
            1
            
            FROM Objetivo obj 
            LEFT JOIN ObjetivoPersonalJerarquico opj ON opj.ObjetivoId = obj.ObjetivoId AND  opj.ObjetivoPersonalJerarquicoDesde  <= @0 AND ISNULL(opj.ObjetivoPersonalJerarquicoHasta,'9999-12-31') >= @0
            LEFT JOIN Personal perjer ON perjer.PersonalId = opj.ObjetivoPersonalJerarquicoPersonalId
            LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = perjer.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = perjer.PersonalId) 

            LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
            LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
            

            LEFT JOIN ClienteElementoDependienteDomicilio domdep ON domdep.ClienteId = clidep.ClienteId AND domdep.ClienteElementoDependienteId  = clidep.ClienteElementoDependienteId
            LEFT JOIN ClienteDomicilio domcli ON domcli.ClienteId = cli.ClienteId AND obj.ClienteElementoDependienteId IS NULL
            
            LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
            

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

  async objetivosGrupos(req: any, res: Response, next: NextFunction) {

    const queryRunner = dataSource.createQueryRunner();
    let fechaActual = new Date()

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

        const catactual = await queryRunner.query(
          `UPDATE gru
          SET 		  gru.GrupoActividadObjetivoHasta=ISNULL(clicon.ClienteContratoFechaHasta,eledepcon.ClienteElementoDependienteContratoFechaHasta)
                      
                             
                      
                  FROM GrupoActividadObjetivo gru
          
                JOIN Objetivo obj  ON gru.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId
          
                  LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
                  LEFT JOIN ClienteElementoDependienteContrato eledepcon ON eledepcon.ClienteId = obj.ClienteId AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledepcon.ClienteElementoDependienteContratoId = eledep.ClienteElementoDependienteContratoUltNro
                  
                  LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId 
                  LEFT JOIN ClienteContrato clicon ON clicon.ClienteId = obj.ClienteId AND clicon.ClienteContratoId = cli.ClienteContratoUltNro AND obj.ClienteElementoDependienteId IS NULL 
          
                      
                      
                  WHERE ISNULL(ISNULL(clicon.ClienteContratoFechaHasta,eledepcon.ClienteElementoDependienteContratoFechaHasta),'9999-12-31') < ISNULL(gru.GrupoActividadObjetivoHasta,'9999-12-31') AND 
                  ISNULL(ISNULL(clicon.ClienteContratoFechaHasta,eledepcon.ClienteElementoDependienteContratoFechaHasta),'9999-12-31') < @0`,
          [fechaActual]
        )


      await queryRunner.commitTransaction();
      if (res)
        this.jsonRes({list:[] }, res, `Se actualizaron los grupos `);
    } catch (error) {
      if (queryRunner.isTransactionActive)
        await queryRunner.rollbackTransaction();
      return next(error)
    } finally {
      await queryRunner.release();
    }
  }


  async search(req: any, res: Response,next:NextFunction) {
    try {
      const { sucursalId, fieldName, value } = req.body;
      if (sucursalId == "") {
        this.jsonRes({ objetivos: [] }, res);
        return;
      }
      let buscar = false;
      let query = `
      SELECT 
      suc.SucursalId, suc.SucursalDescripcion, 
      
      perjer.PersonalId, perjer.PersonalApellido, perjer.PersonalNombre, 
      
      obj.ObjetivoDescripcion, 
      obj.ObjetivoId, 
      
      obj.ClienteId,
      clidep.ClienteElementoDependienteId,
      
      domdep.ClienteElementoDependienteDomicilioDomCalle, domdep.ClienteElementoDependienteDomicilioDomNro,
      domcli.ClienteDomicilioDomCalle, domcli.ClienteDomicilioDomNro,
      
      1
      FROM Objetivo obj
      LEFT JOIN ObjetivoPersonalJerarquico opj ON opj.ObjetivoId = obj.ObjetivoId AND GETDATE() BETWEEN 
       opj.ObjetivoPersonalJerarquicoDesde AND COALESCE (opj.ObjetivoPersonalJerarquicoHasta, '9999-01-01') AND  opj.ObjetivoPersonalJerarquicoComo = 'J'
      LEFT JOIN Personal perjer ON perjer.PersonalId = opj.ObjetivoPersonalJerarquicoPersonalId
      
      LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
      LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
      
      LEFT JOIN ClienteElementoDependienteDomicilio domdep ON domdep.ClienteId = clidep.ClienteId AND domdep.ClienteElementoDependienteId  = clidep.ClienteElementoDependienteId
      LEFT JOIN ClienteDomicilio domcli ON domcli.ClienteId = cli.ClienteId AND obj.ClienteElementoDependienteId IS NULL AND domcli.ClienteDomicilioActual = 0
      
      LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
      
      

WHERE  `;
      
      if (sucursalId > 0)
        query += ' suc.SucursalId = @0 AND '
      
      switch (fieldName) {
        case "Descripcion":
          const valueArray: Array<string> = value.split(/[\s,.-]+/);
          valueArray.forEach((element, index) => {
            if (element.trim().length > 1) {
              query += ` obj.ObjetivoDescripcion LIKE '%${element.trim()}%' AND `;
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
        const result = await dataSource.query(query, [sucursalId]);
        this.jsonRes({ objetivos: result }, res);
      } else this.jsonRes({ objetivos: [] }, res);
    } catch (error) {
      return next(error);
    }
  }
}
