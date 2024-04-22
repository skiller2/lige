import { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { promises as fsPromises } from 'fs';
import { QueryRunner } from "typeorm";
import { DebugLogger } from "typeorm/logger/DebugLogger.js";


export class PersonalObjetivosController extends BaseController {


  async getObjetivo(req: Request, res: Response, next: NextFunction) {

    try {
      let user_id = Number(req.params.user)
      const queryRunner = dataSource.createQueryRunner();
      const resultPersona = await this.getPersonaAndGroup(queryRunner,user_id,true)
      this.jsonRes({ recordsArray:[resultPersona] }, res);
    } catch (error) {
      return next(error)
    }
    

  }
  
  async getpersonal (req: Request, res: Response, next: NextFunction) {

    try {
      let objetivo = Number(req.params.objetivo)
      const queryRunner = dataSource.createQueryRunner();
      const resultPersona = await this.getPersonaAndGroup(queryRunner,objetivo,false)
      this.jsonRes({ recordsArray:[resultPersona] }, res);
    } catch (error) {
      return next(error)
    }
    

  }  
  
  
  async getPersonaAndGroup(queryRunner:QueryRunner,parameter:number,isValue:boolean ){
    
    if(isValue){
      return queryRunner.query(`SELECT obj.ObjetivoId as id,obj.ObjetivoDescripcion AS Descripcion 
      FROM lige.dbo.percargadirecta per
      JOIN Objetivo AS obj ON obj.ObjetivoId = per.objetivo_id
      WHERE per.persona_id = @0;`, [parameter])
    }else{
      return queryRunner.query(`SELECT percarga.persona_id as id ,per.PersonalApellidoNombre AS Descripcion 
      FROM lige.dbo.percargadirecta percarga
      JOIN personal AS per ON per.PersonalId = percarga.objetivo_id
      WHERE percarga.objetivo_id = @0;`, [parameter])
    }

  }


  async setPersonalAndGroupDelete(req: Request, res: Response, next: NextFunction){

  
    const {userId, ObjetivoId} = req.body
    const queryRunner = dataSource.createQueryRunner();
    //await this.deletePersonaAndGroup(queryRunner,userId,ObjetivoId)

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      await  queryRunner.query(`DELETE FROM lige.dbo.percargadirecta
      WHERE persona_id=@0 AND objetivo_id=@1;`, [userId,ObjetivoId])
    
      await queryRunner.commitTransaction();
          return this.jsonRes([], res, `Se realizo la  eliminacion`);
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    }
   
  }

}




