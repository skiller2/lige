import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { inasistenciaController } from "../controller/controller.module.ts";

export const inasistenciaRouter = Router();

inasistenciaRouter.post("/search", authMiddleware.verifyToken,(req, res, next) => {
    inasistenciaController.search(req, res, next)
});

