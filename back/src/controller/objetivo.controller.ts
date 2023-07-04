import { Response } from "express";
import { BaseController } from "./baseController";
import { dataSource } from "../data-source";
import { ObjetivoInfo } from "../schemas/ResponseJSON";

export class ObjetivoController extends BaseController {
  async ObjetivoInfoFromId(objetivoId: string, res) {
    try {
      const result: ObjetivoInfo[] = await dataSource.query(
        `SELECT obj.ObjetivoId objetivoId, obj.ClienteId clienteId, obj.ClienteElementoDependienteId elementoDependienteId, obj.ObjetivoDescripcion descripcion FROM Objetivo obj WHERE obj.ObjetivoId = @0`,
        [objetivoId]
      );
      const info = result[0];
      this.jsonRes(info, res);
    } catch (err) {
      this.errRes(err, res, "Error accediendo a la base de datos", 409);
    }
  }

  async getById(objetivoId: number, anio: number, mes: number, res: Response) {
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
            LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = perjer.PersonalId AND cuit.PersonalCUITCUILId = perjer.PersonalCUITCUILUltNro

            LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
            LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
            

            LEFT JOIN ClienteElementoDependienteDomicilio domdep ON domdep.ClienteId = clidep.ClienteId AND domdep.ClienteElementoDependienteId  = clidep.ClienteElementoDependienteId
            LEFT JOIN ClienteDomicilio domcli ON domcli.ClienteId = cli.ClienteId AND obj.ClienteElementoDependienteId IS NULL
            
            LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)
            

            WHERE obj.ObjetivoId=@1`,
        [fechaHasta, objetivoId]
      )
      .then((records: Array<any>) => {
        //                if (records.length != 1) throw new Error('Objetivo not found')
        this.jsonRes(records, res);
      })
      .catch((err) => {
        this.errRes(err, res, "Error accediendo a la base de datos", 409);
      });
  }

  async search(req: any, res: Response) {
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
      
      

WHERE suc.SucursalId = @0 AND `;
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
    } catch (err) {
      this.errRes(err, res, "Error accediendo a la base de datos", 409);
    }
  }
}
