import { Router } from "express";
import { recibosController } from "../controller/controller.module";

export const recibosRouter = Router();

// recibosRouter.get("/download/:anio/:mes/:personalIdRel?", (req, res, next) => {
//   recibosController.downloadComprobantesByPeriodo(req, res, next);
// });