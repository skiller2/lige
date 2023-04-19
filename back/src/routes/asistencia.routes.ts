import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.module";
import { asistenciaController } from "../controller/controller.module";

export const asistenciaRouter = Router();

asistenciaRouter.get('/metodologia', (req, res) => {
    asistenciaController.getMetodologia(req, res)
})
asistenciaRouter.get('/exceporobj/:anio/:mes/:objetivoId', (req, res) => {
    asistenciaController.getExcepAsistenciaPorObjetivo(req, res)
})

asistenciaRouter.get('/categorias', (req, res) => {
    asistenciaController.getCategoria(req, res)
})
asistenciaRouter.post('/excepcion', (req, res) => {
    asistenciaController.setExcepcion(req, res)
})