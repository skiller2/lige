import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { stockEfectoController } from "../controller/controller.module.ts";

export const stockEfectoRouter = Router();

stockEfectoRouter.get("/tipos-destino",[authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  stockEfectoController.getTiposDestino(req, res, next);
});

stockEfectoRouter.get("/objetivo-info/:objetivoId/:anio/:mes", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  stockEfectoController.getObjetivoInfo(req, res, next);
});

stockEfectoRouter.get("/proveedores", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  stockEfectoController.getProveedores(req, res, next);
});

stockEfectoRouter.post("/confirmar", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  stockEfectoController.confirmarMovimiento(req, res, next);
});
