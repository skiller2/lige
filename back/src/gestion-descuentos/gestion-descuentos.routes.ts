import { Request, Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { gestionDescuentosController } from "../controller/controller.module";

export const gestionDescuentosRouter = Router();

gestionDescuentosRouter.get("/cols/personal", [authMiddleware.verifyToken,authMiddleware.hasGroup(['Liquidaciones','Liquidaciones Consultas', 'gLogistica', 'gLogisticaCon'])], (req, res, next) => {
    gestionDescuentosController.getPersonalGridColumns(req, res, next);
});

gestionDescuentosRouter.get("/cols/objetivos", [authMiddleware.verifyToken,authMiddleware.hasGroup(['Liquidaciones','Liquidaciones Consultas', 'gLogistica', 'gLogisticaCon'])], (req, res, next) => {
    gestionDescuentosController.getObjetivosGridColumns(req, res, next);
});

gestionDescuentosRouter.get("/tipo/options", [authMiddleware.verifyToken,authMiddleware.hasGroup(['Liquidaciones','Liquidaciones Consultas', 'gLogistica', 'gLogisticaCon'])], (req, res, next) => {
    gestionDescuentosController.getTiposDescuentos(req, res, next);
});

gestionDescuentosRouter.post("/personal", [authMiddleware.verifyToken,authMiddleware.hasGroup(['Liquidaciones','Liquidaciones Consultas', 'gLogistica', 'gLogisticaCon'])], (req, res, next) => {
    gestionDescuentosController.getDescuentosByPersonalId(req, res, next);
});

gestionDescuentosRouter.post('/list/personal', [authMiddleware.verifyToken,authMiddleware.hasGroup(['Liquidaciones','Liquidaciones Consultas', 'gLogistica', 'gLogisticaCon'])], (req, res, next) => {
    gestionDescuentosController.getDescuentosPersonal(req, res, next)
});

gestionDescuentosRouter.post('/list/objetivos', [authMiddleware.verifyToken,authMiddleware.hasGroup(['Liquidaciones','Liquidaciones Consultas', 'gLogistica', 'gLogisticaCon'])], (req, res, next) => {
    gestionDescuentosController.getDescuentosObjetivos(req, res, next)
});

gestionDescuentosRouter.post('/add', [authMiddleware.verifyToken,authMiddleware.hasGroup(['Liquidaciones', 'gLogistica'])], (req, res, next) => {
    gestionDescuentosController.addDescuento(req, res, next)
});

gestionDescuentosRouter.post('/addcuota', [authMiddleware.verifyToken,authMiddleware.hasGroup(['Liquidaciones', 'gLogistica'])], (req, res, next) => {
    gestionDescuentosController.addDescuentoCuotas(req, res, next)
});

gestionDescuentosRouter.post('/update', [authMiddleware.verifyToken,authMiddleware.hasGroup(['Liquidaciones', 'gLogistica'])], (req, res, next) => {
    gestionDescuentosController.updateDescuento(req, res, next)
});

gestionDescuentosRouter.post('/cancellation/personal/', [authMiddleware.verifyToken,authMiddleware.hasGroup(['Liquidaciones', 'gLogistica'])], (req, res, next) => {
    gestionDescuentosController.cancellationPersonalOtroDescuento(req, res, next)
});

gestionDescuentosRouter.post('/cancellation/objetivo/', [authMiddleware.verifyToken,authMiddleware.hasGroup(['Liquidaciones', 'gLogistica'])], (req, res, next) => {
    gestionDescuentosController.cancellationObjetivoDescuento(req, res, next)
});

gestionDescuentosRouter.post("/persona", [authMiddleware.verifyToken,authMiddleware.hasGroup(['Liquidaciones','Liquidaciones Consultas', 'gLogistica', 'gLogisticaCon'])], (req, res, next) => {
    gestionDescuentosController.getDescuentoPersona(req, res, next);
});

gestionDescuentosRouter.post("/objetivo", [authMiddleware.verifyToken,authMiddleware.hasGroup(['Liquidaciones','Liquidaciones Consultas', 'gLogistica', 'gLogisticaCon'])], (req, res, next) => {
    gestionDescuentosController.getDescuentoObjetivo(req, res, next);
});

gestionDescuentosRouter.get("/objetivo-descuento/options", [authMiddleware.verifyToken,authMiddleware.hasGroup(['Liquidaciones','Liquidaciones Consultas', 'gLogistica', 'gLogisticaCon'])], (req, res, next) => {
    gestionDescuentosController.getDescuentoForObjetivo(req, res, next);
});

gestionDescuentosRouter.get("/personal-descuento/options", [authMiddleware.verifyToken,authMiddleware.hasGroup(['Liquidaciones','Liquidaciones Consultas', 'gLogistica', 'gLogisticaCon'])], (req, res, next) => {
    gestionDescuentosController.getDescuentoForPersonal(req, res, next);
});

gestionDescuentosRouter.get("/tables", [authMiddleware.verifyToken,authMiddleware.hasGroup(['Liquidaciones','Liquidaciones Consultas', 'gLogistica', 'gLogisticaCon'])], (req, res, next) => {
    gestionDescuentosController.getTableOptions(req, res, next);
});

gestionDescuentosRouter.post("/import-xls-descuentos", [authMiddleware.verifyToken,authMiddleware.hasGroup(['Liquidaciones', 'gLogistica'])], (req, res, next) => {
    gestionDescuentosController.handleXLSUpload(req, res, next);
});

gestionDescuentosRouter.get("/aplicaa/options", [authMiddleware.verifyToken,authMiddleware.hasGroup(['Liquidaciones','Liquidaciones Consultas', 'gLogistica', 'gLogisticaCon'])], (req, res, next) => {
    gestionDescuentosController.getAplicaAOptions(req, res, next);
});

gestionDescuentosRouter.get("/importaciones_anteriores/:anio/:mes", [authMiddleware.verifyToken,authMiddleware.hasGroup(['Liquidaciones', 'gLogistica'])], (req, res, next) => {
    gestionDescuentosController.getImportacionesDescuentosAnteriores(req, res, next);
}); 

gestionDescuentosRouter.get("/cols/carga-manual-personal", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getPersonalGridColumnsCargaManualPersonal(req, res, next);
});

gestionDescuentosRouter.get("/cols/carga-manual-objetivo", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getPersonalGridColumnsCargaManualObjetivo(req, res, next);
});


gestionDescuentosRouter.post("/addDescuentoCargaManualPersonal", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.addDescuentoCargaManualPersonal(req, res, next);
});

gestionDescuentosRouter.post("/addDescuentoCargaManualObjetivo", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.addDescuentoCargaManualObjetivo(req, res, next); 
}); 
