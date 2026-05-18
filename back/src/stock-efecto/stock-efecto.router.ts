import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { stockEfectoController } from "../controller/controller.module.ts";

export const stockEfectoRouter = Router();

stockEfectoRouter.get("/tipos-destino",[authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  stockEfectoController.getTiposDestino(req, res, next);
});
