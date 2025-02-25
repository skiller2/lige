import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { tipoDocumentoController } from "../controller/controller.module";

export const tipoDocumentoRouter = Router();

tipoDocumentoRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res) => {
  tipoDocumentoController.getGridCols(req, res);
});

tipoDocumentoRouter.get("/cols-download", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res) => {
  tipoDocumentoController.getGridDownloadCols(req, res);
});

tipoDocumentoRouter.get("/cols-no-download", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res) => {
  tipoDocumentoController.getGridNoDownloadCols(req, res);
});

tipoDocumentoRouter.get("/tipos", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  tipoDocumentoController.getTipos(req, res, next);
});

tipoDocumentoRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones', 'gSistemas'])], (req, res, next) => {
  tipoDocumentoController.getdocgenralList(req, res, next)
})

tipoDocumentoRouter.post('/list-download', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones', 'gSistemas'])], (req, res, next) => {
  tipoDocumentoController.getPersonalDescarga(req, res, next)
})

tipoDocumentoRouter.post('/list-no-download', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones', 'gSistemas'])], (req, res, next) => {
  tipoDocumentoController.getPersonalNoDescarga(req, res, next)
})

tipoDocumentoRouter.post('/add', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones', 'gSistemas'])], (req, res, next) => {
  tipoDocumentoController.addTipoDocumento(req, res, next)
})

tipoDocumentoRouter.post('/update', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones', 'gSistemas'])], (req, res, next) => {
  tipoDocumentoController.updateTipoDocumento(req, res, next)
})