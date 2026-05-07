import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { depositoController } from "../controller/controller.module.ts";

export const depositoRouter = Router();

depositoRouter.get('/', authMiddleware.verifyToken, (req, res, next) => {
    depositoController.getAllDepositos(res, req, next)
})
