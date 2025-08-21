import { BaseController, ClientException } from "./base.controller.ts";
import type { NextFunction, Request, Response } from "express";
import * as CryptoJS from 'crypto-js';
import { botServer, dbServer } from "../index.ts";

export class ObjetivoController extends BaseController {

  async getObjetivoByCodObjetivo(CodObjetivo: string) {
    const array = CodObjetivo.split('/')
    const ClienteId:number = parseInt(array[0])
    const ClienteElementoDependienteId:number = parseInt(array[1])
    const res = await dbServer.dataSource.query(`
      SELECT obj.ObjetivoId, obj.ClienteId, obj.ClienteElementoDependienteId,
        CONCAT(TRIM(cli.ClienteDenominacion), ' - ', TRIM(ele.ClienteElementoDependienteDescripcion)) descripcion, 
        ISNULL(ISNULL(ele.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1) SucursalId
        FROM Objetivo obj 
        JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
        JOIN ClienteElementoDependiente ele ON ele.ClienteId = obj.ClienteId AND ele.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
      WHERE obj.ClienteId = @0 AND obj.ClienteElementoDependienteId = @1
      `, [ClienteId, ClienteElementoDependienteId]
    )
    return res
  }

  static async getObjetivoResponsables(anio: number, mes: number, ClienteId:number,ClienteElementoDependienteId:number) {
    await dbServer.dataSource.query(`
        SELECT 
            1 AS ord, obj.ObjetivoId as id, 'Grupo' tipo,
            ga.GrupoActividadId, CONCAT (ga.GrupoActividadNumero, ' ',ga.GrupoActividadDetalle) AS detalle, gap.GrupoActividadObjetivoDesde AS desde , gap.GrupoActividadObjetivoHasta hasta,
            1
        FROM Objetivo obj 
        JOIN GrupoActividadObjetivo gap ON gap.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND EOMONTh(DATEFROMPARTS(@1,@2,1)) >=   gap.GrupoActividadObjetivoDesde  AND DATEFROMPARTS(@1,@2,1) <  ISNULL(gap.GrupoActividadObjetivoHasta,'9999-12-31') 
        JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId
        WHERE  obj.ClienteId = @3 AND obj.ClienteElementoDependienteId=@4
        UNION
        SELECT
            2, obj.ObjetivoId, 'Coordinador' tipo,
            per.PersonalId, CONCAT(TRIM(per.PersonalApellido),', ',TRIM(per.PersonalNombre)) AS ApellidoNombre, opj.ObjetivoPersonalJerarquicoDesde, opj.ObjetivoPersonalJerarquicoHasta,
            1
        FROM Objetivo obj 
        JOIN ObjetivoPersonalJerarquico opj ON opj.ObjetivoId = obj.ObjetivoId AND EOMONTh(DATEFROMPARTS(@1,@2,1)) >   opj.ObjetivoPersonalJerarquicoDesde  AND DATEFROMPARTS(@1,@2,1) <  ISNULL(opj.ObjetivoPersonalJerarquicoHasta,'9999-12-31') 
        JOIN Personal per ON per.PersonalId = opj.ObjetivoPersonalJerarquicoPersonalId
        WHERE  obj.ClienteId = @3 AND obj.ClienteElementoDependienteId=@4
        UNION
        SELECT 3, obj.ObjetivoId, 'Supervisor' tipo,
            per.PersonalId, CONCAT(TRIM(per.PersonalApellido),', ',TRIM(per.PersonalNombre)) AS ApellidoNombre, gaj.GrupoActividadJerarquicoDesde AS desde , gaj.GrupoActividadJerarquicoHasta hasta,
            1
          
        FROM Objetivo obj 
        LEFT JOIN GrupoActividadObjetivo gap ON gap.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND EOMONTh(DATEFROMPARTS(@1,@2,1)) >=   gap.GrupoActividadObjetivoDesde  AND DATEFROMPARTS(@1,@2,1) <  ISNULL(gap.GrupoActividadObjetivoHasta,'9999-12-31') 
        LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId
        LEFT JOIN GrupoActividadJerarquico gaj ON gaj.GrupoActividadId = ga.GrupoActividadId AND EOMONTh(DATEFROMPARTS(@1,@2,1)) >=   gaj.GrupoActividadJerarquicoDesde  AND DATEFROMPARTS(@1,@2,1) <  ISNULL(gaj.GrupoActividadJerarquicoHasta,'9999-12-31') AND gaj.GrupoActividadJerarquicoComo = 'J'
        JOIN Personal per ON per.PersonalId = gaj.GrupoActividadJerarquicoPersonalId
        WHERE  obj.ClienteId = @3 AND obj.ClienteElementoDependienteId=@4
        UNION
        SELECT 
            4, obj.ObjetivoId, 'Administrador' tipo,
            per.PersonalId, CONCAT(TRIM(per.PersonalApellido),', ',TRIM(per.PersonalNombre)) AS ApellidoNombre, gaj.GrupoActividadJerarquicoDesde AS desde , gaj.GrupoActividadJerarquicoHasta hasta,
            1
        FROM Objetivo obj 
        LEFT JOIN GrupoActividadObjetivo gap ON gap.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND EOMONTh(DATEFROMPARTS(@1,@2,1)) >=   gap.GrupoActividadObjetivoDesde  AND DATEFROMPARTS(@1,@2,1) <  ISNULL(gap.GrupoActividadObjetivoHasta,'9999-12-31') 
        LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId
        LEFT JOIN GrupoActividadJerarquico gaj ON gaj.GrupoActividadId = ga.GrupoActividadId AND EOMONTh(DATEFROMPARTS(@1,@2,1)) >=   gaj.GrupoActividadJerarquicoDesde  AND DATEFROMPARTS(@1,@2,1) <  ISNULL(gaj.GrupoActividadJerarquicoHasta,'9999-12-31') AND gaj.GrupoActividadJerarquicoComo = 'A'
        JOIN Personal per ON per.PersonalId = gaj.GrupoActividadJerarquicoPersonalId
        WHERE  obj.ClienteId = @3 AND obj.ClienteElementoDependienteId=@4
        ORDER BY ord
    `, [null, anio, mes,ClienteId,ClienteElementoDependienteId])

  }

}