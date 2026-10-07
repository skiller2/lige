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

tipoAsociadoRouter.post(`/onchangecell`, [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    tipoAsociadoController.onchangecell(req, res, next);
});

tipoAsociadoRouter.delete(`/delete/:TipoAsociadoId`, [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    tipoAsociadoController.delete(req, res, next);
});