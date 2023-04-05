import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.module";
import { objetivoController } from "../controller/controller.module";

export const objetivoRouter = Router();

objetivoRouter.post('/search', (req, res) => {
    objetivoController.search(req, res)
})