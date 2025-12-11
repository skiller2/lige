import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { habilitacionesController } from "../controller/controller.module";

export const habilitacionesRouter = Router();

habilitacionesRouter.get("/cols", [authMiddleware.verifyToken], (req, res) => {
  habilitacionesController.getGridCols(req, res);
});

habilitacionesRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  habilitacionesController.list(req, res, next)
})