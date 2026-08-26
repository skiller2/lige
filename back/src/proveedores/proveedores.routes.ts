import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { proveedoresController } from "../controller/controller.module.ts";

export const proveedoresRouter = Router();

proveedoresRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res) => {
  proveedoresController.getGridCols(req, res);
});

proveedoresRouter.get("/info/:id", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  proveedoresController.getProveedorById(req, res, next);
});

proveedoresRouter.get("/baja/:id", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  proveedoresController.setProveedorInactivo(req, res, next);
});

proveedoresRouter.post("/list", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  proveedoresController.listProveedores(req, res, next);
});

proveedoresRouter.post("/add", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  proveedoresController.addProveedor(req, res, next);
});

proveedoresRouter.post("/update", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  proveedoresController.updateProveedor(req, res, next);
});