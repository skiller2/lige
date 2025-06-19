import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { actasController } from "../controller/controller.module";

export const actasRouter = Router();

actasRouter.get("/cols", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    actasController.getActasGridColumns(req, res, next);
});

actasRouter.get(`/nro-acta-options`, [authMiddleware.verifyToken], (req, res, next) => {
  actasController.getNrosActas(req, res, next);
});

actasRouter.post(`/list`, [authMiddleware.verifyToken, authMiddleware.hasGroup([`gSistemas`])], (req, res, next) => {
  actasController.getGridList(req, res, next)
});

actasRouter.post(`/add`, [authMiddleware.verifyToken, authMiddleware.hasGroup([`gSistemas`])], (req, res, next) => {
  actasController.addActa(req, res, next)
});

actasRouter.post(`/edit`, [authMiddleware.verifyToken, authMiddleware.hasGroup([`gSistemas`])], (req, res, next) => {
  actasController.updateActa(req, res, next)
});

actasRouter.delete('/delete', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    actasController.deleteActa(req, res, next)
})