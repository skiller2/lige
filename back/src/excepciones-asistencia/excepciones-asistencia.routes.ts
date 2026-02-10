import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { excepcionesAsistenciaController } from "../controller/controller.module.ts";

export const excepcionesAsistenciaRouter = Router();

excepcionesAsistenciaRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones', 'Liquidaciones Consultas', 'gOperaciones', 'gOperacionesCon'])], (req, res, next) => {
    excepcionesAsistenciaController.getGridColums(req, res, next);
});

excepcionesAsistenciaRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones', 'Liquidaciones Consultas', 'gOperaciones', 'gOperacionesCon'])], (req, res, next) => {
  excepcionesAsistenciaController.list(req, res, next)
})

// Nota: se agrega 'Liquidaciones Consultas' en acción de aprobar, rechazar y pendiente (Excepcion asistencia) para contemplar caso de ArAy
excepcionesAsistenciaRouter.post('/aprobar', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones', 'Liquidaciones Consultas', 'gOperaciones'])], (req, res, next) => {
  excepcionesAsistenciaController.personalArt14AprovarLista(req, res, next)
})

excepcionesAsistenciaRouter.post('/rechazar', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones', 'Liquidaciones Consultas', 'gOperaciones'])], (req, res, next) => {
  excepcionesAsistenciaController.personalArt14RechazarLista(req, res, next)
})

excepcionesAsistenciaRouter.post('/pendiente', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones', 'Liquidaciones Consultas', 'gOperaciones'])], (req, res, next) => {
  excepcionesAsistenciaController.personalArt14PendienteLista(req, res, next)
})

excepcionesAsistenciaRouter.get('/estados', [authMiddleware.verifyToken], (req, res, next) => { excepcionesAsistenciaController.getEstadoExcepcionAsistencia(req, res, next) } )