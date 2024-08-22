import { Router } from "express";
import { administradorController } from "../controller/controller.module";
import { authMiddleware } from "../middlewares/middleware.module";

export const administradorRouter = Router();
const base = "";
administradorRouter.post(`${base}/search`,authMiddleware.verifyToken,(req, res, next) => {
    administradorController.search(req, res, next);
  }
);

