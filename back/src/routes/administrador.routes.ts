import { Router } from "express";
import { administradorController } from "../controller/controller.module.ts";
import { authMiddleware } from "../middlewares/middleware.module.ts";

export const administradorRouter = Router();
const base = "";
administradorRouter.post(`${base}/search`,authMiddleware.verifyToken,(req, res, next) => {
    administradorController.search(req, res, next);
  }
);

