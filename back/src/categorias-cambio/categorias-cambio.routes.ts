import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { categoriasController } from "../controller/controller.module";

export const categoriasRouter = Router();

categoriasRouter.get("/cols", authMiddleware.verifyToken, (req, res) => {
    categoriasController.getGridCols(req, res);
  });

categoriasRouter.post('/list',authMiddleware.verifyToken, (req, res, next) => {
    categoriasController.getCambiosPendCategoria(req, res, next)
})



categoriasRouter.post('/cambiarCategorias', [authMiddleware.verifyToken, authMiddleware.hasGroup('Administrativo')], async (req, res, next) => {
    categoriasController.procesaCambios(req, res, next)
})
