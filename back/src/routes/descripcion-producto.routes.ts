import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { descripcionProductoController } from "../controller/controller.module.ts";

export const descripcionProductoControllerRouter = Router();

descripcionProductoControllerRouter.get('/', authMiddleware.verifyToken, (req, res,next ) => {
    descripcionProductoController.getAllProductos(res, req, next)
})
