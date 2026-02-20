import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { condicionesVentaController, facturacionController } from "../controller/controller.module.ts";
import { facturacionRouter } from "../facturacion/facturacion.routes.ts";

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

condicionesVentaRouter.post('/autorizar-multiple', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  condicionesVentaController.autorizarCondicionVentaMultiple(req, res, next)
})

condicionesVentaRouter.post('/rechazar-multiple', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  condicionesVentaController.rechazarCondicionVentaMultiple(req, res, next)
})


condicionesVentaRouter.get('/tipoCantidad_getOptions', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  condicionesVentaController.getTipoCantidadSearchOptions(req, res, next)
})


condicionesVentaRouter.get('/tipoImporte_getOptions', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  condicionesVentaController.getTipoImporteSearchOptions(req, res, next)
})

condicionesVentaRouter.get('/mensaje-horas/:tipoHoras/:ObjetivoId/:anio/:mes', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  condicionesVentaController.getMensajeHoras(req, res, next)
})

condicionesVentaRouter.get('/precio-lista/:ClienteId/:anio/:mes/:ProductoCodigo', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  condicionesVentaController.getPrecioListaPrecios(req, res, next)
})