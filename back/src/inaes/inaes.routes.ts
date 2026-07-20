import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { inaesController } from "../controller/controller.module.ts";

export const inaesRouter = Router();

inaesRouter.get("/altas-bajas/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  inaesController.getColumnsAltaBajasGrid(req, res, next);
});

inaesRouter.get("/recibos/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  inaesController.getColumnsRecibosGrid(req, res, next);
});

inaesRouter.post('/altas-bajas/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], async (req, res, next) => {
    await inaesController.getAltasBajas(req, res, next)
})

inaesRouter.post('/recibos/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], async (req, res, next) => {
    await inaesController.getRecibos(req, res, next)
})

inaesRouter.post('/cuits/from-file', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], async (req, res, next) => {
    await inaesController.getCUITsByINAESFile(req, res, next)
})