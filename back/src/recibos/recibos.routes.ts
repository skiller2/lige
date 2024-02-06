import { Request, Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { recibosController } from "../controller/controller.module";

export const recibosRouter = Router();

recibosRouter.post("/generar", [authMiddleware.verifyToken, authMiddleware.hasGroup('Liquidaciones')],
  (req, res, next) => {
    recibosController.generaRecibos(req, res, next);
  }
);





