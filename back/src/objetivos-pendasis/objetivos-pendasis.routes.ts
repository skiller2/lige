import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { objetivosPendasisController } from "../controller/controller.module";

export const objetivosPendasisRouter = Router();

objetivosPendasisRouter.get("/cols", authMiddleware.verifyToken, (req, res) => {
    objetivosPendasisController.getGridCols(req, res);
  });

objetivosPendasisRouter.post('/list', authMiddleware.verifyToken, (req, res, next) => {
    objetivosPendasisController.getObjetivosPendAsis(req, res, next)
})

objetivosPendasisRouter.post('/cambiarCategorias', [authMiddleware.verifyToken,authMiddleware.hasGroup('Administrativo')], async (req, res) => {
    try {
        const resultado = await objetivosPendasisController.procesaCambios(req, res)
        const stopTime = performance.now()
        res.status(200).json({ msg: resultado, data: [], stamp: new Date(), ms: stopTime-res.locals.startTime});
    } catch (error) {
        const stopTime = performance.now()
        res.status(409).json({ msg: error.message, data: [], stamp: new Date(), ms: stopTime-res.locals.startTime});
    }
})
