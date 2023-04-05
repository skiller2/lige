import { Response } from "express";
import { BaseController } from "./baseController";
import { dataSource } from "../data-source";

export class ObjetivoController extends BaseController {

    async search(
        req: any,
        res: Response
    ) {
        try {
            const { sucursalId, fieldName, value } = req.body;
            let query = `
        SELECT 
sucdes.SucursalId, sucdes.SucursalDescripcion, 

perjer.PersonalId, perjer.PersonalApellido, perjer.PersonalNombre, 

obj.ObjetivoDescripcion, 
obj.ObjetivoId, 

obj.ClienteId,
clidep.ClienteElementoDependienteId,

dom.ClienteElementoDependienteDomicilioDomCalle, dom.ClienteElementoDependienteDomicilioDomNro,
1
FROM Objetivo obj
LEFT JOIN ObjetivoSucursal suc ON suc.ObjetivoId = obj.ObjetivoId AND suc.ObjetivoSucursalId = obj.ObjetivoSucursalUltNro
LEFT JOIN ObjetivoPersonalJerarquico opj ON opj.ObjetivoId = obj.ObjetivoId AND GETDATE() BETWEEN 
 opj.ObjetivoPersonalJerarquicoDesde AND COALESCE (opj.ObjetivoPersonalJerarquicoHasta, '9999-01-01') AND  opj.ObjetivoPersonalJerarquicoComo = 'J'
LEFT JOIN Personal perjer ON perjer.PersonalId = opj.ObjetivoPersonalJerarquicoPersonalId
LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
LEFT JOIN ClienteElementoDependienteDomicilio dom ON dom.ClienteId = clidep.ClienteId AND dom.ClienteElementoDependienteId  = clidep.ClienteElementoDependienteId
LEFT JOIN Sucursal sucdes ON sucdes.SucursalId = suc.ObjetivoSucursalSucursalId

WHERE sucdes.SucursalId = @0`
            switch (fieldName) {
                case 'Descripcion':
                    query = `${query} AND obj.ObjetivoDescripcion LIKE @1`
                    break;
                case 'Codigo':
                    query = `${query} AND CONCAT(obj.ClienteId, '/', ISNULL(clidep.ClienteElementoDependienteId, 0)) LIKE @1`
                    break;
                default:
                    break;
            }


            const result = await dataSource.query(query, [sucursalId, `%${value}%`])
            this.jsonRes({ objetivos: result }, res);
        }
        catch (err) {
            this.errRes(err, res, "Error accediendo a la base de datos", 409);
        }
    }
}
