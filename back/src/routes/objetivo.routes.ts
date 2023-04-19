import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.module";
import { objetivoController } from "../controller/controller.module";

export const objetivoRouter = Router();

objetivoRouter.post('/search', (req, res) => {
    objetivoController.search(req, res)
})

objetivoRouter.post('/:anio/:mes/:objetivoId/i', (req, res) => {
    objetivoController.getById(req.params.objetivoId,req.params.anio,req.params.mes, res)
})