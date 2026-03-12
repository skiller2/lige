import { Router } from "express";
import { avisoController } from "../controller/controller.module.ts";
import { authMiddleware } from "../middlewares/middleware.module.ts";

export const avisoRouter = Router();

avisoRouter.get(`/`, authMiddleware.verifyToken,(req, res, next) => {
  avisoController.getAvisos(req, res, next);
});

avisoRouter.put(`/marcar-visto`, authMiddleware.verifyToken, (req, res, next) => {
  avisoController.marcarVisto(req, res, next);
});

avisoRouter.put(`/marcar-todos-vistos`, authMiddleware.verifyToken, (req, res, next) => {
  avisoController.marcarTodosVistos(req, res, next);
});

avisoRouter.put(`/ocultar`, authMiddleware.verifyToken, (req, res, next) => {
  avisoController.ocultarAviso(req, res, next);
});
