import { Request, Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { importeVentaVigilanciaController } from "../controller/controller.module";

export const importeVentaVigilanciaRouter = Router();

importeVentaVigilanciaRouter.get("/cols", authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas', 'Liquidaciones', 'Liquidaciones Consultas']), (req, res) => {
    importeVentaVigilanciaController.getGridCols(req, res);
  });

importeVentaVigilanciaRouter.post('/list', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas','Liquidaciones', 'Liquidaciones Consultas'])], (req, res, next) => {
    importeVentaVigilanciaController.getListOrdenesDeVenta(req, res, next)
})

importeVentaVigilanciaRouter.get("/cols-import", authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas', 'Liquidaciones', 'Liquidaciones Consultas']), (req, res) => {
  importeVentaVigilanciaController.getGridColsImport(req, res);
})

importeVentaVigilanciaRouter.get("/importaciones_anteriores/:anio/:mes/:DocumentoTipoCodigo", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas', 'Liquidaciones', 'Liquidaciones Consultas'])], (req, res, next) => {
  importeVentaVigilanciaController.getImportacionesOrdenesDeVentaAnteriores(req, res, next);
})

importeVentaVigilanciaRouter.post('/import-xls', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas', 'Liquidaciones', 'Liquidaciones Consultas'])], (req, res, next) => {
  importeVentaVigilanciaController.handleXLSUpload(req, res, next);
})
importeVentaVigilanciaRouter.get("/download/:impoexpoId", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res,next) => {
  importeVentaVigilanciaController.downloadComprobanteExportacion(
    req.params.impoexpoId,
    res,
    req,
    next
  );
});




