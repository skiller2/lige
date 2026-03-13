import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { vehiculoController } from "../controller/controller.module.ts";

export const vehiculoRouter = Router();

vehiculoRouter.get(`/tipo/options`, authMiddleware.verifyToken, (req, res, next) => {
  vehiculoController.getTipoVehiculo(req, res, next);
});

vehiculoRouter.post('/marca/options', authMiddleware.verifyToken, (req, res, next) => {
  vehiculoController.getMarcaVehiculo(req, res, next)
});

vehiculoRouter.post('/modelo/options', authMiddleware.verifyToken, (req, res, next) => {
  vehiculoController.getModeloVehiculo(req, res, next)
});
  