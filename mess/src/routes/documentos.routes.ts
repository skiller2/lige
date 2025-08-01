import { Router } from "express";
import { documentosController } from "../controller/controller.module.ts";

export const documentosRouter = Router();

documentosRouter.get("/download/:doc_id/:filename", (req, res, next) => {
  documentosController.downloadDocument(req, res, next);
});