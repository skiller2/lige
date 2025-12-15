import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { habilitacionesController } from "../controller/controller.module";

export const habilitacionesRouter = Router();

habilitacionesRouter.get("/cols", [authMiddleware.verifyToken], (req, res) => {
  habilitacionesController.getGridCols(req, res);
});

habilitacionesRouter.get("/detalle-cols", [authMiddleware.verifyToken], (req, res) => {
  habilitacionesController.getGridDetalleCols(req, res);
});

habilitacionesRouter.get("/doc-cols", [authMiddleware.verifyToken], (req, res) => {
  habilitacionesController.getGridDocCols(req, res);
});

habilitacionesRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  habilitacionesController.list(req, res, next)
})

habilitacionesRouter.post('/detalle-list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  habilitacionesController.getDetalleGestiones(req, res, next)
})

habilitacionesRouter.post('/doc-list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  habilitacionesController.getDocRelacionados(req, res, next)
})