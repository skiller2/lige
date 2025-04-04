import { Request, Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { gestionDescuentosController } from "../controller/controller.module";

export const gestionDescuentosRouter = Router();

gestionDescuentosRouter.get("/cols/personal", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getPersonalGridColumns(req, res, next);
});

gestionDescuentosRouter.get("/cols/objetivos", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getObjetivosGridColumns(req, res, next);
});

gestionDescuentosRouter.get("/cols/prepaga", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getPrepagaGridColumns(req, res, next);
});

gestionDescuentosRouter.get("/cols/stock", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getStockGridColumns(req, res, next);
});

gestionDescuentosRouter.get("/tipo/options", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getTiposDescuentos(req, res, next);
});

gestionDescuentosRouter.get("/cols/stock", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getStockGridColumns(req, res, next);
});

gestionDescuentosRouter.get("/tipo/options", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getTiposDescuentos(req, res, next);
});

gestionDescuentosRouter.post("/personal/:id", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getDescuentosByPersonalId(req, res, next);
});

gestionDescuentosRouter.post('/list/personal', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getDescuentosPersonal(req, res, next)
});

gestionDescuentosRouter.post('/list/prepaga', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getDescuentosPrepaga(req, res, next)
});

gestionDescuentosRouter.post('/list/stock', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getDescuentosStock(req, res, next)
});

gestionDescuentosRouter.post('/list/objetivos', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getDescuentosObjetivos(req, res, next)
});
