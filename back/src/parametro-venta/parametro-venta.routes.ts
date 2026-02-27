import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { parametrosVentaController } from "../controller/controller.module.ts";

export const parametrosVentaRouter = Router();


parametrosVentaRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon', 'Liquidaciones', 'Liquidaciones Consultas'])], (req, res) => {
  parametrosVentaController.getGridCols(req, res);
});

parametrosVentaRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon', 'Liquidaciones', 'Liquidaciones Consultas'])], (req, res, next) => {
    parametrosVentaController.listParametrosVenta(req, res, next)
})

parametrosVentaRouter.post('/add', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'Liquidaciones'])], (req, res, next) => {
  parametrosVentaController.addParametroVenta(req, res, next)
})

parametrosVentaRouter.get('/options', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon', 'Liquidaciones', 'Liquidaciones Consultas'])], (req, res, next) => {
  parametrosVentaController.getTipoProductoSearchOptions(req, res, next)
})

parametrosVentaRouter.get('/infParametroVenta/:ObjetivoId/:PeriodoDesdeAplica', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon', 'Liquidaciones', 'Liquidaciones Consultas'])], (req, res, next) => {
  parametrosVentaController.infParametroVenta(req, res, next)
})

parametrosVentaRouter.get('/autorizar/:ObjetivoId/:PeriodoDesdeAplica', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'Liquidaciones'])], (req, res, next) => {
  parametrosVentaController.getAutorizarParametroVenta(req, res, next)
})

parametrosVentaRouter.delete('/rechazar/:ObjetivoId/:PeriodoDesdeAplica', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'Liquidaciones'])], (req, res, next) => {
  parametrosVentaController.rechazarParametroVenta(req, res, next)
})

parametrosVentaRouter.post('/update', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'Liquidaciones'])], (req, res, next) => {
  parametrosVentaController.updateParametroVenta(req, res, next)
})

parametrosVentaRouter.post('/autorizar-multiple', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'Liquidaciones'])], (req, res, next) => {
  parametrosVentaController.autorizarParametroVentaMultiple(req, res, next)
})

parametrosVentaRouter.post('/rechazar-multiple', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'Liquidaciones'])], (req, res, next) => {
  parametrosVentaController.rechazarParametroVentaMultiple(req, res, next)
})


parametrosVentaRouter.get('/tipoCantidad_getOptions', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon', 'Liquidaciones', 'Liquidaciones Consultas'])], (req, res, next) => {
  parametrosVentaController.getTipoCantidadSearchOptions(req, res, next)
})


parametrosVentaRouter.get('/tipoImporte_getOptions', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon', 'Liquidaciones', 'Liquidaciones Consultas'])], (req, res, next) => {
  parametrosVentaController.getTipoImporteSearchOptions(req, res, next)
})

parametrosVentaRouter.get('/mensaje-horas/:tipoHoras/:ObjetivoId/:anio/:mes', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon', 'Liquidaciones', 'Liquidaciones Consultas'])], (req, res, next) => {
  parametrosVentaController.getMensajeHoras(req, res, next)
})

parametrosVentaRouter.get('/precio-lista/:ObjetivoId/:anio/:mes/:ProductoCodigo', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon', 'Liquidaciones', 'Liquidaciones Consultas'])], (req, res, next) => {
  parametrosVentaController.getPrecioListaPrecios(req, res, next)
})