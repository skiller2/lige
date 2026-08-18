import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { ordenVentaController } from "../controller/controller.module.ts";

export const ordenVentaRouter = Router();

ordenVentaRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res) => {
  ordenVentaController.getGridCols(req, res);
});

ordenVentaRouter.post("/list", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  ordenVentaController.getListOrdenVenta(req, res, next);
});

ordenVentaRouter.get("/cabecera/:ObjetivoId/:anio/:mes", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  ordenVentaController.getCabecera(req, res, next);
});

ordenVentaRouter.get("/precio/:ObjetivoId/:anio/:mes/:ProductoCodigo", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  ordenVentaController.getPrecioProducto(req, res, next);
});
