import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { procesosAutomaticosController } from "../controller/controller.module.ts";

export const procesosAutomaticosRouter = Router();

procesosAutomaticosRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    procesosAutomaticosController.getGridCols(req, res, next);
});

procesosAutomaticosRouter.post("/list", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    procesosAutomaticosController.listProcesosAutomaticos(req, res, next);
});

procesosAutomaticosRouter.get("/:logCodigo", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  procesosAutomaticosController.getProcesoAutomatico(req, res, next);
});

procesosAutomaticosRouter.get(`/estado/options`, [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  procesosAutomaticosController.getProcesoAutomaticoEstado(req, res, next);
});
