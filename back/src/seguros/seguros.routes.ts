import { Request, Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { segurosController } from "../controller/controller.module";

export const segurosRouter = Router();

segurosRouter.get(`/lugar/options`, authMiddleware.verifyToken, (req, res, next) => {
//  segurosController.getLugarTelefono(req, rs, next);
});
segurosRouter.get('/tipo/options', authMiddleware.verifyToken, (req, res, next) => {
//  segurosController.getTipoTelefono(req, res, next)
});

