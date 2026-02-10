import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { personalObjetivosController } from "../controller/controller.module.ts";

export const personalObjetivoRouter = Router();

personalObjetivoRouter.get("/getObjetivo/:user", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])],
  (req, res, next) => {
    personalObjetivosController.getObjetivo(req, res, next);
  }
);
personalObjetivoRouter.get("/getpersonal/:objetivo", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])],
  (req, res, next) => {
    personalObjetivosController.getpersonal(req, res, next);
  }
);
personalObjetivoRouter.post("/setPersonalAndGroupDelete", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])],
  (req, res, next) => {
    personalObjetivosController.setPersonalAndGroupDelete(req, res, next);
  }
);
personalObjetivoRouter.post("/setPersonaAndGroup", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])],
  (req, res, next) => {
    personalObjetivosController.setPersonaAndGroup(req, res, next);
  }
);


