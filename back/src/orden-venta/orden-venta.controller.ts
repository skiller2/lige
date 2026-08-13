import { BaseController } from "../controller/base.controller.ts";
import type { NextFunction, Request, Response } from "express";

const columnasGrilla: any[] = [];

export class OrdenVentaController extends BaseController {

  async getGridCols(req: Request, res: Response) {
    this.jsonRes(columnasGrilla, res);
  }

  async getListOrdenVenta(req: Request, res: Response, next: NextFunction) {
    try {
      this.jsonRes(
        {
          total: 0,
          list: [],
        },
        res
      );
    } catch (error) {
      return next(error);
    }
  }
}
