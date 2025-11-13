import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { excepcionesAsistenciaController } from "../controller/controller.module";

export const excepcionesAsistenciaRouter = Router();

excepcionesAsistenciaRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones', 'Liquidaciones Consultas'])], (req, res, next) => {
    excepcionesAsistenciaController.getGridColums(req, res, next);
});

excepcionesAsistenciaRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones', 'Liquidaciones Consultas'])], (req, res, next) => {
  excepcionesAsistenciaController.list(req, res, next)
})

excepcionesAsistenciaRouter.post('/aprobar', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => {
  excepcionesAsistenciaController.personalArt14AprovarLista(req, res, next)
})

excepcionesAsistenciaRouter.post('/rechazar', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => {
  excepcionesAsistenciaController.personalArt14RechazarLista(req, res, next)
})

excepcionesAsistenciaRouter.post('/pendiente', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => {
  excepcionesAsistenciaController.personalArt14PendienteLista(req, res, next)
})