import { Request, Router, request, response } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";

import { administradoresController } from "../controller/controller.module.ts";


export const AdministradoresRouter = Router();

AdministradoresRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon'])], (req, res) => {
  administradoresController.getAdministradoresCols(req, res);
});

AdministradoresRouter.post("/list", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon'])], (req, res, next) => {
  administradoresController.listAdministradores(req, res, next);
});
AdministradoresRouter.get("/cols-clientes", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon'])], (req, res) => {
  administradoresController.getAdministradoresColsClientes(req, res);
});

AdministradoresRouter.post("/list-clientes", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon'])], (req, res, next) => {
  administradoresController.listAdministradoresClientes(req, res, next);
});

