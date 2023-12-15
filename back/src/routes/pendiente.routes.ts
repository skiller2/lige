import { Router } from "express";
import { pendienteController } from "../controller/controller.module";
import { authMiddleware } from "../middlewares/middleware.module";

export const pendieteRouter = Router();
const base = "";

pendieteRouter.post(`${base}/search`, authMiddleware.verifyToken,(req, res, next) => {
    pendienteController.search(req, res, next);
  }
);


