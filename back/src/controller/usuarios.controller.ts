import { getConnection, getManager, getRepository } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { Usuarios } from "../entities/Usuarios";
import { BaseController } from "./baseController";

export class UsuariosController extends BaseController {

  constructor() {
    super(Usuarios);
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
