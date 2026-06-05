import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { cuentasBancariasController } from "../controller/controller.module.ts";

export const cuentasBancariasRouter = Router();

cuentasBancariasRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  cuentasBancariasController.getColumnsGrid(req, res, next);
});

cuentasBancariasRouter.post("/list", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  cuentasBancariasController.getCuentasBancarias(req, res, next);
});