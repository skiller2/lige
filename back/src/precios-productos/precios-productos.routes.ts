import { Request, Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { preciosProductosController } from "../controller/controller.module";

export const preciosProductosRouter = Router();

preciosProductosRouter.get("/cols", authMiddleware.verifyToken, (req, res) => {
    preciosProductosController.getGridCols(req, res);
  });

  preciosProductosRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Administrativo'])],  (req, res, next) => {
    preciosProductosController.listPrecios(req, res, next)
})
  