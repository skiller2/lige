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

gestionDescuentosRouter.get("/tipo/options", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getTiposDescuentos(req, res, next);
});

gestionDescuentosRouter.get("/tipo/options", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getTiposDescuentos(req, res, next);
});

gestionDescuentosRouter.post("/personal", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getDescuentosByPersonalId(req, res, next);
});

gestionDescuentosRouter.post('/list/personal', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getDescuentosPersonal(req, res, next)
});

gestionDescuentosRouter.post('/list/objetivos', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getDescuentosObjetivos(req, res, next)
});

gestionDescuentosRouter.post('/add', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.addDescuento(req, res, next)
});

gestionDescuentosRouter.post('/addcuota', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.addDescuentoCuotas(req, res, next)
});

// gestionDescuentosRouter.post('/update', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
//     gestionDescuentosController.updateDescuento(req, res, next)
// });

// gestionDescuentosRouter.delete('/delete', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
//     gestionDescuentosController.deleteDescuentoCuotas(req, res, next)
// });