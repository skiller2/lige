import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { categoriaPersonalController } from "../controller/controller.module.ts";

export const categoriaPersonalRouter = Router();


categoriaPersonalRouter.get("/cols", [authMiddleware.verifyToken], (req, res) => {
  categoriaPersonalController.getGridCols(req, res);
});

categoriaPersonalRouter.post('/list', [authMiddleware.verifyToken], (req, res, next) => {
  categoriaPersonalController.list(req, res, next)
})

categoriaPersonalRouter.post(`/onchangecell`, [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    categoriaPersonalController.onchangecell(req, res, next);
});

categoriaPersonalRouter.delete(`/delete/:TipoAsociadoId/:CategoriaPersonalId`, [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    categoriaPersonalController.delete(req, res, next);
});