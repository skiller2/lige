import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { precioEfectosController } from "../controller/controller.module.ts";

export const precioEfectosRouter = Router();

precioEfectosRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gLogistica', 'gLogisticaCon', 'gSistemas'])], (req, res) => {
  precioEfectosController.getGridCols(req, res);
});

precioEfectosRouter.post("/list", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gLogistica', 'gLogisticaCon', 'gSistemas'])], (req, res, next) => {
  precioEfectosController.listPrecioEfectos(req, res, next);
});
