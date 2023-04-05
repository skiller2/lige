import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.module";
import { asistenciaController } from "../controller/controller.module";

export const asistenciaRouter = Router();

asistenciaRouter.get('/metodologia', (req, res) => {
    asistenciaController.getMetodologia(req, res)
})

asistenciaRouter.get('/categorias', (req, res) => {
    asistenciaController.getCategoria(req, res)
})