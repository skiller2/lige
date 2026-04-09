import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { valorHoraController } from "../controller/controller.module.ts";

export const valorHoraRouter = Router();

valorHoraRouter.get("/cols", authMiddleware.verifyToken, (req, res) => {
    valorHoraController.getValorHoraCols(req, res);
});

valorHoraRouter.get("/data", authMiddleware.verifyToken, (req, res, next) => {
    valorHoraController.getValorHoraData(req, res, next);
});