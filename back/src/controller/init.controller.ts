import { getConnection, getManager, getRepository } from "typeorm";
import { Request, Response } from "express";
import { BaseController } from "./baseController";
import { PersonaObj } from "../schemas/personal.schemas";
import fetch from "node-fetch";

export class InitController extends BaseController {
  getStats(req: Request, res: Response) {
    const con = getConnection();

    con
      .query(
        `SELECT 

        obja.ObjetivoAsistenciaAnoAno, 
        objm.ObjetivoAsistenciaAnoMesMes, 
        -- cuit.PersonalCUITCUILCUIT, 
        -- persona.PersonalApellido, 
        -- persona.PersonalNombre, 
        -- obj.ObjetivoId, 
        -- obj.ClienteId,
        -- obj.ClienteElementoDependienteId,
        -- obj.ObjetivoDescripcion,
        
        -- perjer.PersonalNombre AS NombreCoordinadorZona, perjer.PersonalApellido AS ApellidoCoordinadorZona,
        -- objd.ObjetivoAsistenciaAnoMesPersonalDiasFormaLiquidacionHoras,
        -- cat.CategoriaPersonalDescripcion,
        -- val.ValorLiquidacionHoraNormal,
        -- CAST (objd.ObjetivoAsistenciaAnoMesPersonalDiasTotalGral AS FLOAT) AS HorasMensuales,
        -- CAST (objd.ObjetivoAsistenciaAnoMesPersonalDiasTotalGral AS FLOAT)*val.ValorLiquidacionHoraNormal AS HorasMensualesImporte,
        
        -- objd.ObjetivoAsistenciaTipoAsociadoId,
        -- objd.ObjetivoAsistenciaCategoriaPersonalId,
        -- suc.ObjetivoSucursalSucursalId,
        -- obj.ObjetivoSucursalUltNro,
        
        SUM ((ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias1Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias1Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias2Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias2Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias3Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias3Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias4Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias4Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias5Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias5Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias6Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias6Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias7Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias7Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias8Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias8Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias9Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias9Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias10Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias10Gral),2) AS INT),0)+
        
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias11Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias11Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias12Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias12Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias13Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias13Gral),2) AS INT),0)+
          ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias14Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias14Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias15Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias15Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias16Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias16Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias17Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias17Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias18Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias18Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias19Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias19Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias20Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias20Gral),2) AS INT),0)+
        
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias21Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias21Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias22Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias22Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias23Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias23Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias24Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias24Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias25Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias25Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias26Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias26Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias27Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias27Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias28Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias28Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias29Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias29Gral),2) AS INT),0)+
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias30Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias30Gral),2) AS INT),0)+
        
        ISNULL(CAST(LEFT(objd.ObjetivoAsistenciaAnoMesPersonalDias31Gral,2) AS INT) *60 + CAST(RIGHT(TRIM(objd.ObjetivoAsistenciaAnoMesPersonalDias31Gral),2) AS INT),0) )/ 60
        ) AS totalhorascalc
        
        
        
        
        
        FROM ObjetivoAsistenciaAnoMesPersonalDias objd
        JOIN ObjetivoAsistenciaAnoMes objm ON objm.ObjetivoAsistenciaAnoMesId = objd.ObjetivoAsistenciaAnoMesId AND objm.ObjetivoAsistenciaAnoId = objd.ObjetivoAsistenciaAnoId AND objm.ObjetivoId = objd.ObjetivoId
        JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objm.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objm.ObjetivoId
        JOIN Objetivo obj ON obj.ObjetivoId = obja.ObjetivoId
        JOIN Personal persona ON persona.PersonalId = objd.ObjetivoAsistenciaMesPersonalId
        JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = persona.PersonalId AND cuit.PersonalCUITCUILId = persona.PersonalCUITCUILUltNro
        JOIN CategoriaPersonal cat ON cat.CategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId AND cat.TipoAsociadoId=objd.ObjetivoAsistenciaTipoAsociadoId
        
        
        LEFT JOIN ObjetivoSucursal suc ON suc.ObjetivoId = obj.ObjetivoId AND suc.ObjetivoSucursalId = obj.ObjetivoSucursalUltNro
        
        
        LEFT JOIN ValorLiquidacion val ON val.ValorLiquidacionSucursalId = ISNULL(suc.ObjetivoSucursalSucursalId,1) AND val.ValorLiquidacionTipoAsociadoId = objd.ObjetivoAsistenciaTipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId 
        AND  DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') BETWEEN 
          val.ValorLiquidacionDesde and COALESCE (val.ValorLiquidacionHasta, '9999-01-01')
        
        LEFT JOIN ObjetivoPersonalJerarquico opj ON opj.ObjetivoId = obj.ObjetivoId AND  DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,'01') BETWEEN 
          opj.ObjetivoPersonalJerarquicoDesde and COALESCE (opj.ObjetivoPersonalJerarquicoHasta, '9999-01-01')
        LEFT JOIN Personal perjer ON perjer.PersonalId = opj.ObjetivoPersonalJerarquicoPersonalId
        
        WHERE obja.ObjetivoAsistenciaAnoAno = @0   -- AND cuit.PersonalCUITCUILCUIT = '20241355471'
        GROUP BY obja.ObjetivoAsistenciaAnoAno, objm.ObjetivoAsistenciaAnoMesMes`,
        [2023]
      )
      .then((records: Array<any>) => {
        let horasTrabajadas=[]
        if (records.length ==0) throw new Error('Data not found')
        records.forEach(rec => { 
          horasTrabajadas.push({x: rec.ObjetivoAsistenciaAnoAno+'-'+rec.ObjetivoAsistenciaAnoMesMes, y:rec.totalhorascalc})
        })

        this.jsonRes({ horasTrabajadas: horasTrabajadas },res);
      
      })
      .catch((err) => {
        this.errRes(err, res, "Error accediendo a la base de datos", 409);
      });
  }

  search(
    req: any,
    res: Response
  ) {
    const connection = getConnection();
    const { fieldName, value } = req.body;


    let query: string =
    `SELECT per.PersonalId, CONCAT(TRIM(per.PersonalNombre) , ' ', TRIM(per.PersonalApellido), ' CUIT:' , cuit.PersonalCUITCUILCUIT) fullName FROM dbo.Personal per 
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = per.PersonalCUITCUILUltNro
      WHERE`
    switch (fieldName) {
      case 'Nombre':
        const valueArray: Array<string> = value.split(" ");
        valueArray.forEach((element, index) => {
          query += `(per.PersonalNombre LIKE '%${element}%' OR per.PersonalApellido LIKE '%${element}%') AND `;
        });
        break;
      case 'CUIT':
          query += ` cuit.PersonalCUITCUILCUIT LIKE '%${value}%' AND `
      default:
        break;
    }
    

    connection
      .query((query += " 1=1"))
      .then((records) => {
        this.jsonRes({ recordsArray: records }, res);
      })
      .catch((err) => {
        this.errRes(err, res, "Error accediendo a la base de datos", 409);
      });
  }
  constructor() {
    super("");
  }

  async execProcedure(someParam: number) {
    /*
        const result = await this.connection.query(
          'EXEC procedures.MyProcedure @0', [someParam]
        );
        */
    // ... do something with the result
  }
}
