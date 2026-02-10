import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { sucursalController } from "../controller/controller.module.ts";

export const sucursalRouter = Router();

sucursalRouter.get('/', authMiddleware.verifyToken, (req, res,next ) => {
    sucursalController.getAllSucursales(res, req, next)
})
