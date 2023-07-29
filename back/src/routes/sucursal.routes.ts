import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.module";
import { sucursalController } from "../controller/controller.module";

export const sucursalRouter = Router();

sucursalRouter.get('/', authMiddleware.verifyToken, (req, res,next ) => {
    sucursalController.getAllSucursales(res, req, next)
})
