import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.module";
import { asistenciaController } from "../controller/controller.module";

export const asistenciaRouter = Router();


asistenciaRouter.get('/metodologia', asistenciaController.getMetodologia)

asistenciaRouter.get('/exceporobj/:anio/:mes/:objetivoId', authMiddleware.verifyToken, asistenciaController.getExcepAsistenciaPorObjetivo)

asistenciaRouter.get('/listaporobj/:anio/:mes/:objetivoId', authMiddleware.verifyToken, asistenciaController.getAsistenciaPorObjetivo)

asistenciaRouter.get('/exceporper/:anio/:mes/:personalId', authMiddleware.verifyToken, asistenciaController.getExcepAsistenciaPorPersona)

asistenciaRouter.get('/descuentosxper/:anio/:mes/:personalId', authMiddleware.verifyToken, asistenciaController.getDescuentosPorPersona)

asistenciaRouter.get('/descuentosxobj/:anio/:mes/:objetivoId', authMiddleware.verifyToken, asistenciaController.getDescuentosPorObjetivo)

asistenciaRouter.get('/listaporper/:anio/:mes/:personalId', authMiddleware.verifyToken, asistenciaController.getAsistenciaPorPersona)


asistenciaRouter.get('/categorias', authMiddleware.verifyToken, asistenciaController.getCategoria)

asistenciaRouter.post('/excepcion', authMiddleware.verifyToken, asistenciaController.setExcepcion)

asistenciaRouter.post('/excepcion', authMiddleware.verifyToken, asistenciaController.setExcepcion)


asistenciaRouter.delete('/excepcion/:anio/:mes/:ObjetivoId/:PersonaId/:metodologia', authMiddleware.verifyToken, asistenciaController.deleteExcepcion)
