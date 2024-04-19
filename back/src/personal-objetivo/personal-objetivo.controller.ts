import { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { promises as fsPromises } from 'fs';
import { QueryRunner } from "typeorm";


export class PersonalObjetivosController extends BaseController {


  async getpersonalObjetivo(req: Request, res: Response, next: NextFunction) {

console.log("estoy en el back")
    let user_id = req.params.user
    const queryRunner = dataSource.createQueryRunner();

    console.log("user", user_id)
    // if (isUnique) {
    //   await queryRunner.query(`delete from lige.dbo.docgeneral where idrecibo=@0 ; `, [idrecibo])
    // } else {
    //   await queryRunner.query(`delete from lige.dbo.docgeneral where periodo=@0 ; `, [periodo])
    // }
    this.jsonRes({ recordsArray:[] }, res);

  }        

}




