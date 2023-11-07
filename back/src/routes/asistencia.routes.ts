import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.module";
import { asistenciaController } from "../controller/controller.module";

export const asistenciaRouter = Router();


asistenciaRouter.get('/metodologia', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.getMetodologia(req, res, next) } )

asistenciaRouter.get('/exceporobj/:anio/:mes/:objetivoId', authMiddleware.verifyToken, (req, res, next) => {asistenciaController.getExcepAsistenciaPorObjetivo(req, res, next) })

asistenciaRouter.get('/listaporobj/:anio/:mes/:objetivoId', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.getAsistenciaPorObjetivo(req, res, next) })

asistenciaRouter.get('/exceporper/:anio/:mes/:personalId', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.getExcepAsistenciaPorPersona(req, res, next) })

asistenciaRouter.get('/descuentosxper/:anio/:mes/:personalId', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.getDescuentosPorPersona(req, res, next) })
asistenciaRouter.get('/personalxresp/:anio/:mes/:personalId', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.getPersonalxResponsable(req, res, next) })
asistenciaRouter.get('/ingresosxper/:anio/:mes/:personalId', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.getIngresosPorPersona(req, res, next) })
asistenciaRouter.get('/ingresosextraxper/:anio/:mes/:personalId', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.getIngresosExtraPorPersona(req, res, next) })

asistenciaRouter.get('/descuentosxobj/:anio/:mes/:objetivoId', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.getDescuentosPorObjetivo(req, res, next) })

asistenciaRouter.get('/listaporper/:anio/:mes/:personalId', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.getAsistenciaPorPersona(req, res, next) })


asistenciaRouter.get('/categorias', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.getCategoria(req, res, next) })

asistenciaRouter.post('/excepcion', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.setExcepcion(req, res, next) })


asistenciaRouter.delete('/excepcion/:anio/:mes/:ObjetivoId/:PersonalId/:metodologia', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.deleteExcepcion(req, res, next) })
