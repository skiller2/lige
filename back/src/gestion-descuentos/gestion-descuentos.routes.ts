import { Request, Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { gestionDescuentosController } from "../controller/controller.module";

export const gestionDescuentosRouter = Router();

gestionDescuentosRouter.get("/cols", [authMiddleware.verifyToken], (req, res, next) => {
    gestionDescuentosController.getGridColumns(req, res, next);
});

gestionDescuentosRouter.post('/list/personal', [authMiddleware.verifyToken], (req, res, next) => {
    gestionDescuentosController.getDescuentosPersonal(req, res, next)
});

gestionDescuentosRouter.post('/list/prepaga', [authMiddleware.verifyToken], (req, res, next) => {
    gestionDescuentosController.getDescuentosPrepaga(req, res, next)
});

gestionDescuentosRouter.post('/list/stock', [authMiddleware.verifyToken], (req, res, next) => {
    gestionDescuentosController.getDescuentosStock(req, res, next)
});

gestionDescuentosRouter.post('/list/objetivos', [authMiddleware.verifyToken], (req, res, next) => {
    gestionDescuentosController.getDescuentosObjetivos(req, res, next)
});
