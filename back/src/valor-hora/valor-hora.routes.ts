import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { valorHoraController } from "../controller/controller.module.ts";

export const valorHoraRouter = Router();

valorHoraRouter.get("/cols", authMiddleware.verifyToken, (req, res) => {
    valorHoraController.getValorHoraCols(req, res);
});

valorHoraRouter.post("/data", authMiddleware.verifyToken, (req, res, next) => {
    valorHoraController.getValorHoraData(req, res, next);
});

valorHoraRouter.post("/update", authMiddleware.verifyToken, (req, res, next) => {
    valorHoraController.updateValorHora(req, res, next);
});

valorHoraRouter.post("/aumentar", authMiddleware.verifyToken, (req, res, next) => {
    valorHoraController.aumentarValores(req, res, next);
});
