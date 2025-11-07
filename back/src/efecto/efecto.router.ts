import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { efectoController } from "../controller/controller.module";

export const efectoRouter = Router();

efectoRouter.get("/personal/:id", [authMiddleware.verifyToken, ], (req, res, next) => {
  efectoController.getEfectoByPersonalId(req, res, next);
});
efectoRouter.get("/objetivo/:id", [authMiddleware.verifyToken, ], (req, res, next) => {
  efectoController.getEfectoByObjetivoId(req, res, next);
});