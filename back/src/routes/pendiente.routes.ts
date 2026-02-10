import { Router } from "express";
import { pendienteController } from "../controller/controller.module.ts";
import { authMiddleware } from "../middlewares/middleware.module.ts";

export const pendieteRouter = Router();
const base = "";

pendieteRouter.post(`${base}/search`, authMiddleware.verifyToken,(req, res, next) => {
    pendienteController.search(req, res, next);
  }
);


