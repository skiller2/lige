import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";

import { administradoresController } from "../controller/controller.module.ts";


export const administradoresRouter = Router();

administradoresRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon'])], (req, res) => {
  administradoresController.getAdministradoresCols(req, res);
});

administradoresRouter.get('/info/:id', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  administradoresController.getAdminitradorInfoById(req, res, next)
})

administradoresRouter.post("/list", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon'])], (req, res, next) => {
  administradoresController.listAdministradores(req, res, next);
});

administradoresRouter.post("/add", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  administradoresController.addAdminitrador(req, res, next);
});

administradoresRouter.post("/update", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  administradoresController.updateAdministrador(req, res, next);
});

administradoresRouter.get("/cols-clientes", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon'])], (req, res) => {
  administradoresController.getAdministradoresColsClientes(req, res);
});

administradoresRouter.post("/list-clientes", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon'])], (req, res, next) => {
  administradoresController.listAdministradoresClientes(req, res, next);
});

administradoresRouter.delete("/delete/:id", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  administradoresController.deleteAdministrador(req, res, next);
});