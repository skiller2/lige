import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { cuentasBancariasController } from "../controller/controller.module.ts";

export const cuentasBancariasRouter = Router();

cuentasBancariasRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones', 'Liquidaciones Consultas'])], (req, res, next) => {
  cuentasBancariasController.getColumnsGrid(req, res, next);
});

cuentasBancariasRouter.post("/list", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones', 'Liquidaciones Consultas'])], (req, res, next) => {
  cuentasBancariasController.getCuentasBancarias(req, res, next);
});

cuentasBancariasRouter.get("/pendientes/:BancoId", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones', 'Liquidaciones Consultas'])], (req, res, next) => {
  cuentasBancariasController.getCuentasPendientesCBU(req, res, next);
});

cuentasBancariasRouter.post("/import-xls", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => {
    cuentasBancariasController.handleXLSUpload(req, res, next);
});

cuentasBancariasRouter.post("/add", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => {
  cuentasBancariasController.addCuentasPendientes(req, res, next);
});

cuentasBancariasRouter.post("/setbanco", [authMiddleware.verifyToken, authMiddleware.hasGroup([`Liquidaciones`])], (req, res, next) => {
  cuentasBancariasController.setPersonalBanco(req, res, next);
});