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

categoriasRouter.post('/cambiarCategorias', [authMiddleware.verifyToken,authMiddleware.hasGroup('Administrativo')], async (req, res, next) => {
    try {
        const resultado = await categoriasController.procesaCambios(req, res, next)
        const stopTime = performance.now()
        res.status(200).json({ msg: resultado, data: [], stamp: new Date(), ms: stopTime-res.locals.startTime});
    } catch (error) {
        const stopTime = performance.now()
        res.status(409).json({ msg: error.message, data: [], stamp: new Date(), ms: stopTime-res.locals.startTime});
    }
})
