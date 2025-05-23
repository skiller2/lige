import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { grupoActividadController } from "../controller/controller.module";

export const grupoActividadRouter = Router();

//GRUPO
grupoActividadRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gOperaciones', 'gPersonalCon', 'gOperacionesCon'])], (req, res) => {
    grupoActividadController.getGridColsGrupos(req, res);
});

grupoActividadRouter.post('/listGrupos', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gOperaciones', 'gPersonalCon', 'gOperacionesCon'])], (req, res, next) => {
    grupoActividadController.listGrupoActividadGrupos(req, res, next)
})

grupoActividadRouter.post('/changecellgrupo', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gOperaciones'])], (req, res, next) => {
    grupoActividadController.changecellgrupo(req, res, next)
})

grupoActividadRouter.get('/inactivo_getOptions', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gOperaciones', 'gPersonalCon', 'gOperacionesCon'])], (req, res, next) => {
    grupoActividadController.getOptions(req, res)
});

grupoActividadRouter.get('/inactivoboolean_getOptions', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gOperaciones', 'gPersonalCon', 'gOperacionesCon'])], (req, res, next) => {
    grupoActividadController.getOptionsBoolean(req, res)
});

grupoActividadRouter.delete('/grupo', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gOperaciones'])], (req, res, next) => {
    grupoActividadController.deleteGrupo(req, res, next)
})

//RESPONSABLES

grupoActividadRouter.get("/colsresponsables", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gOperaciones', 'gPersonalCon', 'gOperacionesCon'])], (req, res) => {
    grupoActividadController.getGridColsResponsables(req, res)
})

grupoActividadRouter.post('/listResponsables', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gOperaciones', 'gPersonalCon', 'gOperacionesCon'])], (req, res, next) => {
    grupoActividadController.listGrupoActividadResponsables(req, res, next)
})

grupoActividadRouter.get('/tipo_getOptions', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gOperaciones', 'gPersonalCon', 'gOperacionesCon'])], (req, res, next) => {
    grupoActividadController.getTipos(req, res)
})

grupoActividadRouter.post('/changecellresponsable', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gOperaciones'])], (req, res, next) => {
    grupoActividadController.changecellResponsable(req, res, next)
})

grupoActividadRouter.delete('/responsables', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gOperaciones'])], (req, res, next) => {
    grupoActividadController.deleteResponsables(req, res, next)
})

//OBJETIVOS

grupoActividadRouter.get("/colsobjetivos", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gOperaciones', 'gPersonalCon', 'gOperacionesCon'])], (req, res) => {
    grupoActividadController.getGridColsObjetivos(req, res)
})

grupoActividadRouter.post('/listObjetivos', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gOperaciones', 'gPersonalCon', 'gOperacionesCon'])], (req, res, next) => {
    grupoActividadController.listGrupoActividadObjetivos(req, res, next)
})

grupoActividadRouter.post('/changecellObjetivos', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gOperaciones'])], (req, res, next) => {
    grupoActividadController.changecellObjetivos(req, res, next)
})

//PERSONAL

grupoActividadRouter.get("/colspersonal", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gOperaciones', 'gPersonalCon', 'gOperacionesCon'])], (req, res) => {
    grupoActividadController.getGridColsPersonal(req, res)
})

grupoActividadRouter.post('/listPersonal', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gOperaciones', 'gPersonalCon', 'gOperacionesCon'])], (req, res, next) => {
    grupoActividadController.listGrupoActividadPersonal(req, res, next)
})

grupoActividadRouter.post('/changecellPersonal', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gOperaciones'])], (req, res, next) => {
    grupoActividadController.changecellPersonal(req, res, next)
})
