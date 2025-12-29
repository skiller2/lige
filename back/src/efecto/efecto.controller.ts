import { BaseController, ClientException, ClientWarning } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, getOptionsFromRequest, isOptions, orderToSQL, } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";
import { mkdirSync, existsSync, renameSync, copyFileSync, unlinkSync, constants } from "fs";
import { TextItem } from "pdfjs-dist/types/src/display/api";
import * as path from 'path';
import { FileUploadController } from "src/controller/file-upload.controller";
import * as fs from 'fs';
import { promisify } from 'util';

const listaColumnasPersonal: any[] = [
  {
    id: "id",
    name: "id",
    field: "id",
    fieldName: "id",
    type: "number",
    sortable: true,
    hidden: true,
    searchHidden: true
  },
  // {
  //   id: "StockId",
  //   name: "Stock ID",
  //   field: "StockId",
  //   fieldName: "stk.StockId",
  //   type: "number",
  //   sortable: true,
  //   hidden: false,
  //   searchHidden: false
  // },
  {
    name: "Apellido Nombre ",
    type: "number",
    id: "PersonalId",
    field: "PersonalId",
    fieldName: "per.PersonalId",
    searchComponent: "inputForPersonalSearch",
    sortable: true,
    searchHidden: false,
    hidden: true,
  },
  {
    id: "ApellidoNombre",
    name: "Apellido Nombre",
    field: "ApellidoNombre",
    fieldName: "ApellidoNombre",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: "PersonalCUITCUILCUIT",
    name: "CUIT",
    field: "PersonalCUITCUILCUIT",
    fieldName: "PersonalCUITCUILCUIT",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: "SituacionRevistaId",
    name: "Situacion Revista",
    field: "SituacionRevistaId",
    type: "number",
    fieldName: "sitrev.SituacionRevistaId",
    searchComponent: "inputForSituacionRevistaSearch",
    searchType: "number",
    sortable: true,
    searchHidden: false,
    hidden: true,
  },
  {
    id: "SituacionRevistaDescripcion",
    name: "SituacionRevista",
    field: "SituacionRevistaDescripcion",
    fieldName: "sitrev.SituacionRevistaDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: "PersonalSituacionRevistaDesde",
    name: "Sit. Rev. Desde",
    field: "PersonalSituacionRevistaDesde",
    fieldName: "persitrev.PersonalSituacionRevistaDesde",
    type: "date",
    searchComponent: "inputForFechaSearch",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: "PersonalSituacionRevistaHasta",
    name: "Hasta",
    field: "PersonalSituacionRevistaHasta",
    fieldName: "persitrev.PersonalSituacionRevistaHasta",
    type: "date",
    searchComponent: "inputForFechaSearch",
    sortable: true,
    searchHidden: false,
    hidden: true,
  },
  // {
  //   id: "EfectoId",
  //   name: "Efecto ID",
  //   field: "EfectoId",
  //   fieldName: "stk.EfectoId",
  //   type: "number",
  //   sortable: true,
  //   hidden: false,
  //   searchHidden: false
  // },
  // {
  //   id: "EfectoEfectoIndividualId",
  //   name: "Efecto Individual ID",
  //   field: "EfectoEfectoIndividualId",
  //   fieldName: "stk.EfectoEfectoIndividualId",
  //   type: "number",
  //   sortable: true,
  //   hidden: false,
  //   searchHidden: false
  // },

  {
    id: "EfectoDescripcion",
    name: "Efecto",
    field: "EfectoDescripcion",
    fieldName: "efe.EfectoDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: "EfectoAtrDescripcion",
    name: "Atr. Efecto",
    field: "EfectoAtrDescripcion",
    fieldName: "efe.EfectoAtrDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: "EfectoEfectoIndividualDescripcion",
    name: "Efe. Individual",
    field: "EfectoEfectoIndividualDescripcion",
    fieldName: "efeind.EfectoEfectoIndividualDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: "EfectoIndividualAtrDescripcion",
    name: "Efe. Atr. Individual",
    field: "EfectoIndividualAtrDescripcion",
    fieldName: "efeind.EfectoIndividualAtrDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: "StockStock",
    name: "Stock",
    field: "StockStock",
    fieldName: "stk.StockStock",
    type: "number",
    sortable: true,
    hidden: false,
    searchHidden: true,
    maxWidth: 50
  }

]

const listaColumnasObjetivos: any[] = [
  {
    id: "id",
    name: "id",
    field: "id",
    fieldName: "id",
    type: "number",
    sortable: true,
    hidden: true,
    searchHidden: true
  },
  // {
  //   id: "ContieneEfectoIndividual",
  //   name: "Contiene Efecto Individual",
  //   field: "ContieneEfectoIndividual",
  //   fieldName: "efe.ContieneEfectoIndividual",
  //   searchComponent: "inputForActivo",
  //   type: "boolean",
  //   sortable: true,
  //   hidden: true,
  //   searchHidden: true
  // },
  // {
  //   id: "StockId",
  //   name: "StockId",
  //   field: "StockId",
  //   fieldName: "stk.StockId",
  //   type: "number",
  //   sortable: true,
  //   hidden: false,
  //   searchHidden: true
  // },
  {
    name: "Cliente",
    type: "string",
    id: "ClienteId",
    field: "ClienteId",
    fieldName: "obj.ClienteId",
    searchComponent: "inputForClientSearch",
    sortable: true,
    hidden: true,
    searchHidden: false
  },
  {
    name: "Cliente",
    type: "string",
    id: "ClienteDenominacion",
    field: "ClienteDenominacion",
    fieldName: "cli.ClienteDenominacion",
    sortable: true,
    searchHidden: true,
    hidden: false,
    editable: false
  },
  {
    name: "Objetivo",
    type: "number",
    id: "ObjetivoId",
    field: "ObjetivoId",
    fieldName: "obj.ObjetivoId",
    searchComponent: "inputForObjetivoSearch",
    sortable: true,
    hidden: true,
    searchHidden: false
  },
  {
    id: "ClienteElementoDependienteId",
    name: "ClienteElementoDependienteId",
    field: "ClienteElementoDependienteId",
    fieldName: "obj.ClienteElementoDependienteId",
    type: "number",
    sortable: true,
    hidden: true,
    searchHidden: true
  },
  {
    id: "ClienteElementoDependienteDescripcion",
    name: "Objetivo",
    field: "ClienteElementoDependienteDescripcion",
    fieldName: "ClienteElementoDependienteDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: "EfectoId",
    name: "Efecto",
    field: "EfectoId",
    fieldName: "stk.EfectoId",
    type: "number",
    sortable: true,
    hidden: false,
    searchHidden: true
  },

  {
    id: "EfectoDescripcion",
    name: "Efecto",
    field: "EfectoDescripcion",
    fieldName: "efe.EfectoDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true
  },

  {
    id: "EfectoAtrDescripcion",
    name: "Atributo del Efecto",
    field: "EfectoAtrDescripcion",
    fieldName: "efe.EfectoAtrDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    id: "EfectoEfectoIndividualId",
    name: "Efecto Individual Asociado al efecto",
    field: "EfectoEfectoIndividualId",
    fieldName: "stk.EfectoEfectoIndividualId",
    type: "number",
    sortable: true,
    hidden: true,
    searchHidden: false
  },
  {
    id: "EfectoEfectoIndividualDescripcion",
    name: "Efecto Individual Asociado al efecto",
    field: "EfectoEfectoIndividualDescripcion",
    fieldName: "efeind.EfectoEfectoIndividualDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: "EfectoIndividualAtrDescripcion",
    name: "Atributo del Efecto Individual",
    field: "EfectoIndividualAtrDescripcion",
    fieldName: "efeind.EfectoIndividualAtrDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    id: "StockStock",
    name: "Stock",
    field: "StockStock",
    fieldName: "ISNULL(stk.StockStock, 0)",
    type: "number",
    sortable: true,
    hidden: false,
    searchHidden: false,
    searchType: "numberAdvanced",
    searchComponent: "inputForNumberAdvancedSearch",
  },
  {
    id: "StockReservado",
    name: "Stock Reservado",
    field: "StockReservado",
    fieldName: "ISNULL(stk.StockReservado, 0)",
    type: "number",
    sortable: true,
    hidden: false,
    searchHidden: false,
    searchType: "numberAdvanced",
    searchComponent: "inputForNumberAdvancedSearch",
  },

]

export class EfectoController extends BaseController {


  async getGridColsPersonal(req, res) {
    this.jsonRes(listaColumnasPersonal, res);
  }

  async getGridColsObjetivos(req, res) {
    this.jsonRes(listaColumnasObjetivos, res);
  }

  private efectobyPersonalIdQuery(queryRunner: any, personalId: number) {
    return queryRunner.query(`
      SELECT efe.ContieneEfectoIndividual, stk.StockId, per.PersonalId, stk.EfectoId, stk.EfectoEfectoIndividualId, stk.StockStock, stk.StockReservado,
      efe.EfectoDescripcion, efe.EfectoAtrDescripcion, efeind.EfectoEfectoIndividualDescripcion, efeind.EfectoIndividualAtrDescripcion,  
      1
      FROM Stock stk
      JOIN Personal per ON per.PersonalId = stk.PersonalId
      JOIN EfectoDescripcion efe ON efe.EfectoId = stk.EfectoId
      LEFT JOIN EfectoIndividualDescripcion efeind ON efeind.EfectoId = stk.EfectoId AND efeind.EfectoEfectoIndividualId = stk.EfectoEfectoIndividualId

      WHERE stk.StockStock > 0 AND (efe.ContieneEfectoIndividual =0 OR (efe.ContieneEfectoIndividual =1 AND stk.EfectoEfectoIndividualId IS NOT NULL)) AND per.PersonalId = @0
    `, [personalId])
  }

  private getEfectoQuery(queryRunner: any, listOptions: any) {
    const filterSql = filtrosToSql(listOptions.filtros, listaColumnasPersonal)
    return queryRunner.query(`
    SELECT ROW_NUMBER() OVER (ORDER BY stk.StockId) AS id, CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre)) ApellidoNombre,per.PersonalId
		, cuit.PersonalCUITCUILCUIT , sitrev.SituacionRevistaId, sitrev.SituacionRevistaDescripcion, persitrev.PersonalSituacionRevistaDesde,persitrev.PersonalSituacionRevistaHasta
		, efe.ContieneEfectoIndividual, stk.StockId, per.PersonalId, stk.EfectoId, stk.EfectoEfectoIndividualId, stk.StockStock, stk.StockReservado,
		efe.EfectoDescripcion, efe.EfectoAtrDescripcion, efeind.EfectoEfectoIndividualDescripcion, efeind.EfectoIndividualAtrDescripcion,  
      1
    FROM Stock stk
    JOIN Personal per ON per.PersonalId = stk.PersonalId
    JOIN EfectoDescripcion efe ON efe.EfectoId = stk.EfectoId
    LEFT JOIN EfectoIndividualDescripcion efeind ON efeind.EfectoId = stk.EfectoId AND efeind.EfectoEfectoIndividualId = stk.EfectoEfectoIndividualId
    LEFT join PersonalSituacionRevista persitrev on persitrev.PersonalId=per.PersonalId and persitrev.PersonalSituacionRevistaDesde<=GETDATE() AND ISNULL(persitrev.PersonalSituacionRevistaHasta,'9999-12-31')>=GETDATE() 
    left JOIN SituacionRevista sitrev on sitrev.SituacionRevistaId=persitrev.PersonalSituacionRevistaSituacionId
    LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)
    WHERE stk.StockStock > 0 AND (efe.ContieneEfectoIndividual =0 OR (efe.ContieneEfectoIndividual =1 AND stk.EfectoEfectoIndividualId IS NOT NULL)) AND ${filterSql} `)
  }

  async getEfectoPersonal(req: any, res: Response, next: NextFunction) {
    const personalId = req.params.id
    const listOptions = req.body.listOptions
    const queryRunner = dataSource.createQueryRunner();
    try {
      const list = await this.getEfectoQuery(queryRunner, listOptions);
      this.jsonRes(list, res);
    } catch (error) {
      return next(error)
    }
  }

  async getEfectoByPersonalId(req: any, res: Response, next: NextFunction) {
    const personalId = req.params.id
    const queryRunner = dataSource.createQueryRunner();
    try {
      const list = await this.efectobyPersonalIdQuery(queryRunner, personalId);
      this.jsonRes(list, res);
    } catch (error) {
      return next(error)
    }
  }

  // usada para detalle asistencia, apartado de efectos por objetivo
  async getEfectoByObjetivoId(req: any, res: Response, next: NextFunction) {
    const objetivoId = req.params.id
    const queryRunner = dataSource.createQueryRunner();
    try {
      const list = await this.efectobyObjetivoIdQuery(queryRunner, objetivoId);
      this.jsonRes(list, res);
    } catch (error) {
      return next(error)
    }
  }

  private efectobyObjetivoIdQuery(queryRunner: any, objetivoId: number) {
    return queryRunner.query(`
      SELECT efe.ContieneEfectoIndividual,stk.StockId,obj.ClienteId,
       obj.ClienteElementoDependienteId, 
       
       stk.EfectoId, stk.EfectoEfectoIndividualId, stk.StockStock, stk.StockReservado,
      efe.EfectoDescripcion, efe.EfectoAtrDescripcion, efeind.EfectoEfectoIndividualDescripcion, efeind.EfectoIndividualAtrDescripcion,  
      1
      FROM Stock stk
      JOIN Objetivo obj ON obj.ObjetivoId = stk.ObjetivoId
      JOIN EfectoDescripcion efe ON efe.EfectoId = stk.EfectoId
      LEFT JOIN EfectoIndividualDescripcion efeind ON efeind.EfectoId = stk.EfectoId AND efeind.EfectoEfectoIndividualId = stk.EfectoEfectoIndividualId 

      WHERE stk.StockStock > 0 AND (efe.ContieneEfectoIndividual =0 OR (efe.ContieneEfectoIndividual =1 AND stk.EfectoEfectoIndividualId IS NOT NULL)) AND obj.ObjetivoId = @0
    `, [objetivoId])
  }


  // usada para la grilla de efectos por objetivos
  async getEfectoObjetivos(req: any, res: Response, next: NextFunction) {
    const listOptions = req.body.listOptions
    const queryRunner = dataSource.createQueryRunner();
    try {
      const list = await this.getEfectoObjetivosQuery(queryRunner, listOptions);
      this.jsonRes(list, res);
    } catch (error) {
      return next(error)
    }
  }

  private getEfectoObjetivosQuery(queryRunner: any, listOptions: any) {
    const filterSql = filtrosToSql(listOptions.filtros, listaColumnasObjetivos)
    return queryRunner.query(`
      SELECT ROW_NUMBER() OVER (ORDER BY stk.StockId) as id, 
             CASE WHEN efe.ContieneEfectoIndividual = 1 THEN 'Si' ELSE 'No' END as ContieneEfectoIndividual,
             stk.StockId,
      obj.ClienteId,
      cli.ClienteDenominacion, obj.ClienteElementoDependienteId, 
      CONCAT(cli.ClienteId,'/', ISNULL(ele.ClienteElementoDependienteId,0), ' ',ele.ClienteElementoDependienteDescripcion) as ClienteElementoDependienteDescripcion,
      stk.EfectoId, stk.EfectoEfectoIndividualId, ISNULL(stk.StockStock, 0) as StockStock, ISNULL(stk.StockReservado, 0) as StockReservado,
          efe.EfectoDescripcion, efe.EfectoAtrDescripcion, efeind.EfectoEfectoIndividualDescripcion, efeind.EfectoIndividualAtrDescripcion, con.ClienteElementoDependienteContratoId,con.ClienteElementoDependienteContratoFechaDesde,con.ClienteElementoDependienteContratoFechaHasta,
          1
    FROM Stock stk
    JOIN Objetivo obj ON obj.ObjetivoId = stk.ObjetivoId
    LEFT JOIN ClienteElementoDependiente ele on ele.ClienteElementoDependienteId=obj.ClienteElementoDependienteId and ele.ClienteId=obj.ClienteId
    JOIN EfectoDescripcion efe ON efe.EfectoId = stk.EfectoId
    LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
    LEFT JOIN EfectoIndividualDescripcion efeind ON efeind.EfectoId = stk.EfectoId AND efeind.EfectoEfectoIndividualId = stk.EfectoEfectoIndividualId 
    LEFT JOIN ClienteElementoDependienteContrato con on con.ClienteId=obj.ClienteId and con.ClienteElementoDependienteId=obj.ClienteElementoDependienteId and con.ClienteElementoDependienteContratoFechaDesde<=GETDATE() AND ISNULL(con.ClienteElementoDependienteContratoFechaHasta,'9999-12-31')>=GETDATE()
    WHERE stk.StockStock > 0 AND (efe.ContieneEfectoIndividual =0 OR (efe.ContieneEfectoIndividual =1 AND stk.EfectoEfectoIndividualId IS NOT NULL))
      AND ${filterSql} `)
  }


}