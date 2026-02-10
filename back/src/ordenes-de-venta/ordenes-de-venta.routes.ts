import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { ordenesDeVentaController } from "../controller/controller.module.ts";

export const ordenesDeVentaRouter = Router();

ordenesDeVentaRouter.get("/cols", authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas', 'Liquidaciones', 'Liquidaciones Consultas']), (req, res) => {
    ordenesDeVentaController.getGridCols(req, res);
  });

ordenesDeVentaRouter.post('/list', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas','Liquidaciones', 'Liquidaciones Consultas'])], (req, res, next) => {
    ordenesDeVentaController.getListOrdenesDeVenta(req, res, next)
})
