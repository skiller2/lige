import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { valorHoraController } from "../controller/controller.module.ts";

export const valorHoraRouter = Router();

valorHoraRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res) => {
    valorHoraController.getValorHoraCols(req, res);
});

valorHoraRouter.post("/data", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    valorHoraController.getValorHoraData(req, res, next);
});

valorHoraRouter.get("/categorias-personal", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    valorHoraController.getCategoriasPersonal(req, res, next);
});

valorHoraRouter.post("/changecellvalorHora", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    valorHoraController.changecellvalorHora(req, res, next);
});

valorHoraRouter.post("/aumentar", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    valorHoraController.aumentarValores(req, res, next);
});
