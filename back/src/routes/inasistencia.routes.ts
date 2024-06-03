import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.module";
import { inasistenciaController } from "../controller/controller.module";

export const inasistenciaRouter = Router();

inasistenciaRouter.post("/search", authMiddleware.verifyToken,(req, res, next) => {
    inasistenciaController.search(req, res, next)
});

