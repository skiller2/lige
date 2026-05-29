import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { rubroController } from "../controller/controller.module.ts";

export const rubroRouter = Router();

rubroRouter.get("/", authMiddleware.verifyToken,(req, res, next) => {
    rubroController.getAllRubros(req, res, next)
});

rubroRouter.get("/subrubro", authMiddleware.verifyToken,(req, res, next) => {
    rubroController.getAllSubrubros(req, res, next)
});

rubroRouter.get("/rublo-cliente/options", authMiddleware.verifyToken,(req, res, next) => {
    rubroController.getRubroCliente(req, res, next)
});

rubroRouter.post("/search", authMiddleware.verifyToken,(req, res, next) => {
    rubroController.search(req, res, next)
});

