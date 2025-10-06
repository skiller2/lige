import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { novedadesController, objetivosController } from "../controller/controller.module";

export const novedadesRouter = Router();


novedadesRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.verifyGrupoActividad, authMiddleware.authADGroup(['gOperaciones', 'gOperacionesCon'])], (req, res) => {
  novedadesController.getGridCols(req, res);
});

novedadesRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.verifyGrupoActividad, authMiddleware.authADGroup(['gOperaciones', 'gOperacionesCon'])], (req, res, next) => {
  novedadesController.list(req, res, next)
})

novedadesRouter.get('/tipo_novedad', [authMiddleware.verifyToken, authMiddleware.verifyGrupoActividad, authMiddleware.authADGroup(['gOperaciones', 'gOperacionesCon'])], (req, res, next) => {
  novedadesController.getTipoNovedad(req, res, next);
});

novedadesRouter.get('/infNovedad/:NovedadId', [authMiddleware.verifyToken, authMiddleware.verifyGrupoActividad, authMiddleware.authADGroup(['gOperaciones', 'gOperacionesCon'])], (req, res, next) => {
  novedadesController.infNovedad(req, res, next)
})

novedadesRouter.post('/update/:id', [authMiddleware.verifyToken, authMiddleware.verifyGrupoActividad, authMiddleware.authADGroup(['gOperaciones', 'gOperacionesCon'])], (req, res, next) => {
  novedadesController.updateNovedad(req, res, next)
})

novedadesRouter.post('/add', [authMiddleware.verifyToken, authMiddleware.verifyGrupoActividad, authMiddleware.authADGroup(['gOperaciones', 'gOperacionesCon'])], (req, res, next) => {
  novedadesController.addNovedad(req, res, next)
})

novedadesRouter.delete('/delete/:id', [authMiddleware.verifyToken, authMiddleware.verifyGrupoActividad, authMiddleware.authADGroup(['gOperaciones', 'gOperacionesCon'])], (req, res, next) => {
  novedadesController.deleteNovedad(req, res, next)
})


