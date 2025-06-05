import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { actasController } from "../controller/controller.module";

export const actasRouter = Router();

actasRouter.get("/cols", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    actasController.getActasGridColumns(req, res, next);
});

actasRouter.post(`/list`, [authMiddleware.verifyToken, authMiddleware.hasGroup([`gSistemas`])], (req, res, next) => {
  actasController.getGridList(req, res, next)
});