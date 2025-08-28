import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { novedadesController } from "../controller/controller.module";

export const novedadesRouter = Router();


novedadesRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon','gSistemas'])], (req, res) => {
  novedadesController.getGridCols(req, res);
});

novedadesRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon','gSistemas'])], (req, res, next) => {
  novedadesController.list(req, res, next)
})

