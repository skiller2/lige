import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { grupoActividadController } from "../controller/controller.module";

export const grupoActividadRouter = Router();

//GRUPO
grupoActividadRouter.get("/cols", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res) => {
    grupoActividadController.getGridColsGrupos(req, res);
});

grupoActividadRouter.post('/listGrupos', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])],  (req, res, next) => {
    grupoActividadController.listGrupoActividadGrupos(req, res, next)
})

grupoActividadRouter.post('/changecellgrupo', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    grupoActividadController.changecellgrupo(req, res, next)
})

grupoActividadRouter.get('/inactivo_getOptions', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    grupoActividadController.getOptions(req, res)
});

grupoActividadRouter.delete('/grupo', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])],  (req, res, next) => {
    grupoActividadController.deleteGrupo(req, res, next)
})

//RESPONSABLES

grupoActividadRouter.get("/colsresponsables", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])],(req, res) => {
    grupoActividadController.getGridColsResponsables(req, res)
})

grupoActividadRouter.post('/listResponsables', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])],  (req, res, next) => {
    grupoActividadController.listGrupoActividadResponsables(req, res, next)
})

grupoActividadRouter.get('/tipo_getOptions', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    grupoActividadController.getTipos(req, res)
})

grupoActividadRouter.post('/changecellresponsable', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])],(req, res, next) => {
    grupoActividadController.changecellResponsable(req, res, next)
})

grupoActividadRouter.delete('/responsables', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])],  (req, res, next) => {
    grupoActividadController.deleteResponsables(req, res, next)
})
//SUPERVISORES
//OBJETIVOS
//PERSONAL