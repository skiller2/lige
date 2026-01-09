import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { habilitacionesController } from "../controller/controller.module";

export const habilitacionesRouter = Router();

habilitacionesRouter.get("/cols", [authMiddleware.verifyToken], (req, res, next) => {
  habilitacionesController.getGridCols(req, res, next);
});

habilitacionesRouter.get("/detalle-cols", [authMiddleware.verifyToken], (req, res, next) => {
  habilitacionesController.getGridDetalleCols(req, res, next);
});

habilitacionesRouter.get("/doc-cols", [authMiddleware.verifyToken], (req, res, next) => {
  habilitacionesController.getGridDocCols(req, res, next);
});

habilitacionesRouter.get("/estados/options", [authMiddleware.verifyToken], (req, res, next) => {
  habilitacionesController.getEstadosHabilitaciones(req, res, next);
});

habilitacionesRouter.get("/lugar/options", [authMiddleware.verifyToken], (req, res, next) => {
  habilitacionesController.getLugarHabilitacion(req, res, next);
});

habilitacionesRouter.get("/lugar/options/personal/:PersonalId", [authMiddleware.verifyToken], (req, res, next) => {
  habilitacionesController.getLugarHabilitacionByPersonalId(req, res, next);
});

habilitacionesRouter.get("/categoria/options/:LugarHabilitacionId", [authMiddleware.verifyToken], (req, res, next) => {
  habilitacionesController.getHabilitacionCategoria(req, res, next);
});

habilitacionesRouter.get("/necesarias/:PersonalId", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  habilitacionesController.getHabilitacionNecesariaByPersonalId(req, res, next);
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

habilitacionesRouter.post('/add', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  habilitacionesController.addHabilitacion(req, res, next)
})

habilitacionesRouter.post('/necesaria/update', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  habilitacionesController.updatePersonalHabilitacionNecesaria(req, res, next)
})

habilitacionesRouter.post('/gestion/add', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  habilitacionesController.addHabilitacionDetalle(req, res, next)
})

habilitacionesRouter.post('/gestion/update', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  habilitacionesController.updateHabilitacionDetalle(req, res, next)
})

habilitacionesRouter.post('/personal', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  habilitacionesController.getPersonalHabilitacion(req, res, next)
})

habilitacionesRouter.post('/update-hab-necesaria', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  habilitacionesController.updateHabilitacionNecesaria(req, res, next)
})

habilitacionesRouter.post('/gestion', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  habilitacionesController.getGestionHabilitacion(req, res, next)
})