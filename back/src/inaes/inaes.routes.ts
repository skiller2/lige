import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { inaesController } from "../controller/controller.module.ts";

export const inaesRouter = Router();

inaesRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  inaesController.getColumnsGrid(req, res, next);
});

inaesRouter.post('/altas-bajas', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], async (req, res, next) => {
    await inaesController.getAltasBajas(req, res, next)
})