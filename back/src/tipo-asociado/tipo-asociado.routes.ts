import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { tipoAsociadoController } from "../controller/controller.module.ts";

export const tipoAsociadoRouter = Router();


tipoAsociadoRouter.get("/cols", [authMiddleware.verifyToken], (req, res) => {
  tipoAsociadoController.getGridCols(req, res);
});

tipoAsociadoRouter.post('/list', [authMiddleware.verifyToken], (req, res, next) => {
  tipoAsociadoController.list(req, res, next)
})
