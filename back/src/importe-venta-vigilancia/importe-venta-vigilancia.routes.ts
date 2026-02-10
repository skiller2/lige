import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { importeVentaVigilanciaController } from "../controller/controller.module.ts";

export const importeVentaVigilanciaRouter = Router();

importeVentaVigilanciaRouter.get("/cols", authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas', 'Liquidaciones', 'Liquidaciones Consultas', 'gComercial', 'gComercialCon']), (req, res) => {
    importeVentaVigilanciaController.getGridCols(req, res);
  });

importeVentaVigilanciaRouter.post('/list', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas','Liquidaciones', 'Liquidaciones Consultas', 'gComercial', 'gComercialCon'])], (req, res, next) => {
    importeVentaVigilanciaController.getListOrdenesDeVenta(req, res, next)
})

importeVentaVigilanciaRouter.get("/cols-import", authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas', 'Liquidaciones', 'Liquidaciones Consultas', 'gComercial', 'gComercialCon']), (req, res) => {
  importeVentaVigilanciaController.getGridColsImport(req, res);
})

importeVentaVigilanciaRouter.get("/importaciones_anteriores/:anio/:mes/:DocumentoTipoCodigo", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas', 'Liquidaciones', 'Liquidaciones Consultas', 'gComercial', 'gComercialCon'])], (req, res, next) => {
  importeVentaVigilanciaController.getImportacionesOrdenesDeVentaAnteriores(req, res, next);
})

importeVentaVigilanciaRouter.post('/import-xls', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas', 'Liquidaciones','gComercial'])], (req, res, next) => {
  importeVentaVigilanciaController.handleXLSUpload(req, res, next);
})
importeVentaVigilanciaRouter.get("/download/:impoexpoId", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas','Liquidaciones', 'gComercial'])], (req, res,next) => {
  importeVentaVigilanciaController.downloadComprobanteExportacion(
    req.params.impoexpoId,
    res,
    req,
    next
  );
});
importeVentaVigilanciaRouter.post('/valorFacturacion', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas','Liquidaciones', 'gComercial'])], (req, res, next) => {importeVentaVigilanciaController.setValorFacturacion(req, res, next)})




