import { Router } from "express";
import { recibosController } from "../controller/controller.module";

export const recibosRouter = Router();

recibosRouter.get("/download/:doc_id?", (req, res, next) => {
  recibosController.downloadRecibo(req, res, next);
});