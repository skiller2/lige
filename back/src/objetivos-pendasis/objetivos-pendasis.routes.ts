import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { objetivosPendasisController } from "../controller/controller.module.ts";

export const objetivosPendasisRouter = Router();

objetivosPendasisRouter.get("/cols", authMiddleware.verifyToken, (req, res) => {
    objetivosPendasisController.getGridCols(req, res);
  });

objetivosPendasisRouter.post('/list', [authMiddleware.verifyToken,authMiddleware.hasGroup(['liquidaciones','administrativo','responsables'])], (req, res, next) => {
    objetivosPendasisController.getObjetivosPendAsis(req, res, next)
})
