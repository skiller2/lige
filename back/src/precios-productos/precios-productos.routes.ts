import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { preciosProductosController } from "../controller/controller.module.ts";

export const preciosProductosRouter = Router();

preciosProductosRouter.get("/cols-precios", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res) => {
    preciosProductosController.getGridCols(req, res);
});

preciosProductosRouter.get("/colsHistory", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res) => {
  preciosProductosController.colsHistory(req, res);
});

preciosProductosRouter.get("/options", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  preciosProductosController.getProductos(req, res, next);;
});

preciosProductosRouter.get("/:codigoHistory", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  preciosProductosController.listCodigoHistory(req.params.codigoHistory, res, next);;
});

preciosProductosRouter.post('/list-precios', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    preciosProductosController.listPrecios(req, res, next)
})

preciosProductosRouter.post('/changecell', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  preciosProductosController.changecell(req, res, next)
})

preciosProductosRouter.post('/delete', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])],  (req, res, next) => {
  preciosProductosController.deleteProductos(req, res, next)
})

preciosProductosRouter.get("/importaciones_anteriores/:anio/:mes", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    preciosProductosController.getImportacionesPreciosAnteriores(req, res, next);
});

preciosProductosRouter.post("/import-xls-precios", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    preciosProductosController.handleXLSUpload(req, res, next);
});
