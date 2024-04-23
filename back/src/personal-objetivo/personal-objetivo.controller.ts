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
      const result = await this.getPersonaAndGroup(queryRunner,user_id,true)
      this.jsonRes({ recordsArray:[result] }, res);
    } catch (error) {
      return next(error)
    }
    

  }
  
  async getpersonal (req: Request, res: Response, next: NextFunction) {

    try {
      let objetivo = Number(req.params.objetivo)
      const queryRunner = dataSource.createQueryRunner();
      const result = await this.getPersonaAndGroup(queryRunner,objetivo,false)
      this.jsonRes({ recordsArray:[result] }, res);
    } catch (error) {
      return next(error)
    }
    
  } 
  
  async setPersonaAndGroup (req: Request, res: Response, next: NextFunction) {

    try {
      const {userId, ObjetivoId} = req.body
      let usuario = res.locals.userName
      let ip = this.getRemoteAddress(req)
      let fechaActual = new Date();
      const queryRunner = dataSource.createQueryRunner();

      if(userId == 0)
        throw new ClientException(`Usuario no identificado`)

      if(ObjetivoId == 0)
        throw new ClientException(`Cliente no identificado`)


      await this.AddPersonaAndGroup(queryRunner,userId,ObjetivoId,usuario,ip,fechaActual)
      return this.jsonRes([], res, `Se realizo la tarea con exito`);
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
      JOIN personal AS per ON per.PersonalId = percarga.persona_id
      WHERE percarga.objetivo_id = @0;`, [parameter])
    }

  }

  async AddPersonaAndGroup(
    queryRunner:QueryRunner,
    userId:any,
    ObjetivoId:any,
    usuario:any,
    ip:any,
    fechaActual:any ){
   
      return queryRunner.query(`INSERT INTO lige.dbo.percargadirecta
      (persona_id, objetivo_id,aud_usuario_ins,aud_ip_ins,aud_fecha_ins,aud_usuario_mod,aud_ip_mod,aud_fecha_mod)
      VALUES (@0, @1, @2, @3, @4, @2, @3, @4);`, [ userId,ObjetivoId,usuario,ip,fechaActual])

  }


  async setPersonalAndGroupDelete(req: Request, res: Response, next: NextFunction){

  
    const {userId, ObjetivoId} = req.body
    const queryRunner = dataSource.createQueryRunner();
    //await this.deletePersonaAndGroup(queryRunner,userId,ObjetivoId)

    try {

      if(userId == 0)
        throw new ClientException(`Usuario no identificado`)

      if(ObjetivoId == 0)
        throw new ClientException(`Cliente no identificado`) 

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




