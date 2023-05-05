import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.module";
import { asistenciaController } from "../controller/controller.module";

export const asistenciaRouter = Router();

asistenciaRouter.get('/metodologia', (req, res) => {
    asistenciaController.getMetodologia(req, res)
})

asistenciaRouter.get('/exceporobj/:anio/:mes/:objetivoId', authMiddleware.verifyToken, (req, res) => {
    asistenciaController.getExcepAsistenciaPorObjetivo(req, res)
})

asistenciaRouter.get('/listaporobj/:anio/:mes/:objetivoId', authMiddleware.verifyToken, (req, res) => {
    asistenciaController.getAsistenciaPorObjetivo(req, res)
})

asistenciaRouter.get('/exceporper/:anio/:mes/:personalId', authMiddleware.verifyToken, (req, res) => {
    asistenciaController.getExcepAsistenciaPorPersona(req, res)
})

asistenciaRouter.get('/listaporper/:anio/:mes/:personalId', authMiddleware.verifyToken, (req, res) => {
    asistenciaController.getAsistenciaPorPersona(req, res)
})


asistenciaRouter.get('/categorias', authMiddleware.verifyToken, (req, res) => {
    asistenciaController.getCategoria(req, res)
})

asistenciaRouter.post('/excepcion', authMiddleware.verifyToken, (req, res) => {
    asistenciaController.setExcepcion(req, res)
})

asistenciaRouter.delete('/excepcion/:anio/:mes/:ObjetivoId/:PersonaId/:metodologia',authMiddleware.verifyToken, (req, res) => {
    asistenciaController.deleteExcepcion( req, res)
})