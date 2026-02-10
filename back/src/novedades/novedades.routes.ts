import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { novedadesController, objetivosController } from "../controller/controller.module.ts";

export const novedadesRouter = Router();


novedadesRouter.get("/cols", [authMiddleware.verifyToken], (req, res) => {
  novedadesController.getGridCols(req, res);
});

novedadesRouter.post('/list', [authMiddleware.verifyToken], (req, res, next) => {
  novedadesController.list(req, res, next)
})

novedadesRouter.get('/tipo_novedad', [authMiddleware.verifyToken], (req, res, next) => {
  novedadesController.getTipoNovedad(req, res, next);
});

novedadesRouter.get('/infNovedad/:NovedadId', [authMiddleware.verifyToken, authMiddleware.verifyGrupoActividad, authMiddleware.authADGroup(['gOperaciones', 'gOperacionesCon'])], (req, res, next) => {
  novedadesController.infNovedad(req, res, next)
})

novedadesRouter.post('/update/:id', [authMiddleware.verifyToken, authMiddleware.hasAuthObjetivo, authMiddleware.hasGroup(['gOperaciones', 'gOperacionesCon'])], (req, res, next) => {
  novedadesController.updateNovedad(req, res, next)
})

novedadesRouter.post('/add', [authMiddleware.verifyToken], (req, res, next) => {
  novedadesController.addNovedad(req, res, next)
})

novedadesRouter.delete('/delete/:id', [authMiddleware.verifyToken, authMiddleware.hasAuthObjetivo, authMiddleware.hasGroup(['gOperaciones', 'gOperacionesCon'])], (req, res, next) => {
  novedadesController.deleteNovedad(req, res, next)
})

novedadesRouter.get("/filters", [authMiddleware.verifyToken, authMiddleware.verifyGrupoActividad, authMiddleware.authADGroup(['gOperaciones', 'gOperacionesCon'])], (req, res, next) => {
  novedadesController.getGridFilters(req, res, next);
});

novedadesRouter.post("/config", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])],
  (req, res, next) => {
    novedadesController.setNovedadConfig(req, res, next);
  }
);

novedadesRouter.get("/config/:prev?", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])],
  (req, res, next) => {
    novedadesController.getNovedadConfig(req, res, next);
  }
);

novedadesRouter.post("/prueba", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])],
  (req, res, next) => {
    novedadesController.downloadNovedadPrueba(req, res, next);
  }
);

novedadesRouter.post("/informes", [authMiddleware.verifyToken, authMiddleware.authADGroup(['gOperaciones', 'gOperacionesCon'])],
  (req, res, next) => {
    novedadesController.generaInformesNovedades(req, res, next);
  }
);
