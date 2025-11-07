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

export class EfectoController extends BaseController {

  private efectobyPersonalIdQuery(queryRunner:any, personalId:number) {
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

  private efectobyObjetivoIdQuery(queryRunner:any, objetivoId:number) {
    return queryRunner.query(`
      SELECT efe.ContieneEfectoIndividual,stk.StockId,obj.ClienteId, obj.ClienteElementoDependienteId, stk.EfectoId, stk.EfectoEfectoIndividualId, stk.StockStock, stk.StockReservado,
      efe.EfectoDescripcion, efe.EfectoAtrDescripcion, efeind.EfectoEfectoIndividualDescripcion, efeind.EfectoIndividualAtrDescripcion,  
      1
      FROM Stock stk
      JOIN Objetivo obj ON obj.ObjetivoId = stk.ObjetivoId
      JOIN EfectoDescripcion efe ON efe.EfectoId = stk.EfectoId
      LEFT JOIN EfectoIndividualDescripcion efeind ON efeind.EfectoId = stk.EfectoId AND efeind.EfectoEfectoIndividualId = stk.EfectoEfectoIndividualId 

      WHERE stk.StockStock > 0 AND (efe.ContieneEfectoIndividual =0 OR (efe.ContieneEfectoIndividual =1 AND stk.EfectoEfectoIndividualId IS NOT NULL)) AND obj.ObjetivoId = @0
    `,[objetivoId])
  }

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

}