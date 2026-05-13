import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { eventoLogController } from "../controller/controller.module.ts";

export const eventoLogRouter = Router();

eventoLogRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    eventoLogController.getGridCols(req, res, next);
});

eventoLogRouter.get("/colsBloqueadas", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  eventoLogController.getGridColsBloqueadas(req, res, next);
});

eventoLogRouter.post("/list", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    eventoLogController.listEventoLog(req, res, next);
});

eventoLogRouter.post("/listtablasbloqueadas", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  eventoLogController.listtablasbloqueadas(req, res, next);
});

eventoLogRouter.get("/:logCodigo", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  eventoLogController.getEventoLog(req, res, next);
});

eventoLogRouter.get(`/estado/options`, [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  eventoLogController.getEventoLogEstado(req, res, next);
});

eventoLogRouter.get("/clase/options", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  eventoLogController.getClases(req, res, next);
});
