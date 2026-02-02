import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { condicionesVentaController, facturacionController } from "../controller/controller.module";
import { facturacionRouter } from "src/facturacion/facturacion.routes";

export const condicionesVentaRouter = Router();


condicionesVentaRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res) => {
  condicionesVentaController.getGridCols(req, res);
});

condicionesVentaRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    condicionesVentaController.listCondicionesVenta(req, res, next)
})

condicionesVentaRouter.post('/add', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  condicionesVentaController.addCondicionVenta(req, res, next)
})

condicionesVentaRouter.get('/options', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  condicionesVentaController.getTipoProductoSearchOptions(req, res, next)
})

condicionesVentaRouter.get('/metodologia_getOptions', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  condicionesVentaController.getMetodologiaSearchOptions(req, res, next)
})


condicionesVentaRouter.get('/infCondicionVenta/:codobjId/:ClienteElementoDependienteId/:PeriodoDesdeAplica', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon'])], (req, res, next) => {
  condicionesVentaController.infCondicionVenta(req, res, next)
})

condicionesVentaRouter.get('/autorizar/:codobj/:ClienteElementoDependienteId/:PeriodoDesdeAplica', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  condicionesVentaController.getAutorizarCondicionVenta(req, res, next)
})

condicionesVentaRouter.delete('/rechazar/:codobj/:ClienteElementoDependienteId/:PeriodoDesdeAplica', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  condicionesVentaController.rechazarCondicionVenta(req, res, next)
})

condicionesVentaRouter.post('/update', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  condicionesVentaController.updateCondicionVenta(req, res, next)
})

// Nuevas rutas para autorizar/rechazar múltiples condiciones de venta
condicionesVentaRouter.post('/autorizar-multiple', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  condicionesVentaController.autorizarCondicionVentaMultiple(req, res, next)
})

condicionesVentaRouter.post('/rechazar-multiple', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  condicionesVentaController.rechazarCondicionVentaMultiple(req, res, next)
})

