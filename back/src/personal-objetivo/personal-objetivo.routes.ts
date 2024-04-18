import { Request, Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { personalObjetivosController } from "../controller/controller.module";

export const personalObjetivoRouter = Router();

personalObjetivoRouter.get("/getpersonalObjetivo/:user", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])],
  (req, res, next) => {
    personalObjetivosController.getpersonalObjetivo(req, res, next);
  }
);
