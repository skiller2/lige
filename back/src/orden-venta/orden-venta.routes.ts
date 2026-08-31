import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { ordenVentaController } from "../controller/controller.module.ts";

export const ordenVentaRouter = Router();

ordenVentaRouter.get("/cols-ordenes", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res) => {
  ordenVentaController.getGridColsOrdenes(req, res);
});

ordenVentaRouter.post("/list-ordenes", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  ordenVentaController.getListOrdenesVenta(req, res, next);
});

ordenVentaRouter.post("/list", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  ordenVentaController.getListOrdenVenta(req, res, next);
});

ordenVentaRouter.get("/cabecera/:ObjetivoId/:anio/:mes", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  ordenVentaController.getCabecera(req, res, next);
});

ordenVentaRouter.get("/estados", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  ordenVentaController.getEstadosOrdenVenta(req, res, next);
});

ordenVentaRouter.post("/save", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  ordenVentaController.setOrdenVenta(req, res, next);
});

ordenVentaRouter.post("/insert", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  ordenVentaController.insertOrdenVenta(req, res, next);
});

ordenVentaRouter.post("/update-cabecera", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  ordenVentaController.updateCabeceraOrdenVenta(req, res, next);
});

ordenVentaRouter.delete("/:NroOrdenVenta", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  ordenVentaController.deleteOrdenVenta(req, res, next);
});

ordenVentaRouter.get("/precio/:ObjetivoId/:anio/:mes/:ProductoCodigo", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  ordenVentaController.getPrecioProducto(req, res, next);
});
