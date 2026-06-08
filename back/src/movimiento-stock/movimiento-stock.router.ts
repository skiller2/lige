import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { movimientoStockController } from "../controller/controller.module.ts";

export const movimientoStockRouter = Router();

movimientoStockRouter.get("/tipos-destino",[authMiddleware.verifyToken, authMiddleware.hasGroup(['gLogistica', 'gLogisticaCon'])], (req, res, next) => {
  movimientoStockController.getTiposDestino(req, res, next);
});

movimientoStockRouter.get("/tipos-origen",[authMiddleware.verifyToken, authMiddleware.hasGroup(['gLogistica', 'gLogisticaCon'])], (req, res, next) => {
  movimientoStockController.getTiposOrigen(req, res, next);
});

movimientoStockRouter.get("/objetivo-info/:objetivoId/:anio/:mes", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gLogistica', 'gLogisticaCon'])], (req, res, next) => {
  movimientoStockController.getObjetivoInfo(req, res, next);
});

movimientoStockRouter.get("/proveedores", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gLogistica', 'gLogisticaCon'])], (req, res, next) => {
  movimientoStockController.getProveedores(req, res, next);
});

movimientoStockRouter.post("/confirmar", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  movimientoStockController.confirmarMovimiento(req, res, next);
});
