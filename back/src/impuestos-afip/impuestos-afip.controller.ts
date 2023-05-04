import { Response } from "express";
import { BaseController } from "../controller/baseController";

export class ImpuestosAfipController extends BaseController {
  async handlePDFUpload(file: Express.Multer.File, res: Response) {
    try {
      if (!file) throw new Error("File not recieved/did not pass filter.");
      this.jsonRes([], res, "PDF Recieved!");
    } catch (err) {
      this.errRes(err, res, "Something failed!", 400);
    }
  }
}
