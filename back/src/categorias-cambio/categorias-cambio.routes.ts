import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { categoriasController } from "../controller/controller.module";

export const categoriasRouter = Router();

categoriasRouter.get("/cols", authMiddleware.verifyToken, (req, res) => {
    categoriasController.getGridCols(req, res);
  });

categoriasRouter.post('/list',authMiddleware.verifyToken, (req, res) => {
    categoriasController.getCambiosPendCategoria(req, res)
})

categoriasRouter.post('/cambiarCategorias', authMiddleware.verifyToken, (req, res) => {
    res.locals.startTime = performance.now()
    categoriasController.procesaCambios(req, res)
})
