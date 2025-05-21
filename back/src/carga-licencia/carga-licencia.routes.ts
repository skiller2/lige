import { Request, Router, request, response } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { cargaLicenciaController } from "../controller/controller.module";
import multer, { FileFilterCallback } from "multer";
import { existsSync, mkdirSync } from "fs";
import { ClientException } from "../controller/baseController";
import { tmpName } from "../server";


type DestinationCallback = (error: Error | null, destination: string) => void;

export const CargaLicenciaCargaRouter = Router();

CargaLicenciaCargaRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], (req, res) => {
  cargaLicenciaController.getGridCols(req, res);
});

CargaLicenciaCargaRouter.get("/colsHistory", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], (req, res) => {
  cargaLicenciaController.getGridColsHistory(req, res);
});

CargaLicenciaCargaRouter.get("/colsHoras", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], (req, res) => {
  cargaLicenciaController.getGridColsHoras(req, res);
});

CargaLicenciaCargaRouter.post("/list", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], (req, res, next) => {
    cargaLicenciaController.list(req, res, next);
});

CargaLicenciaCargaRouter.post("/listHistory", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], (req, res, next) => {
  cargaLicenciaController.listHistory(req, res, next);
});


CargaLicenciaCargaRouter.post("/listhoras", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], (req, res, next) => {
    cargaLicenciaController.listHoras(req, res, next);
});

CargaLicenciaCargaRouter.get("/:anio/:mes/:PersonalId/:PersonalLicenciaId", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], (req, res, next) => {
    cargaLicenciaController.getLicencia(req, res, next);
});
  
CargaLicenciaCargaRouter.post("/", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], (req, res, next) => {
  cargaLicenciaController.setLicencia(req, res, next);
});

CargaLicenciaCargaRouter.post('/changehours', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], (req, res, next) => {
  cargaLicenciaController.changehours(req, res, next);
})

CargaLicenciaCargaRouter.delete("/", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], (req, res, next) => {
  cargaLicenciaController.deleteLincencia(req, res, next);
});

/*CargaLicenciaCargaRouter.get('/licencia_anteriores/:anio/:mes/:PersonalId/:PersonalLicenciaId', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], (req, res, next) => {
  cargaLicenciaController.getLicenciaAnteriores(req.params.anio, req.params.mes, req.params.PersonalId, req.params.PersonalLicenciaId, req, res, next)
});*/

CargaLicenciaCargaRouter.get('/sepaga_getOptions', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], (req, res, next) => {
  cargaLicenciaController.getOptions(req, res)
});

/*CargaLicenciaCargaRouter.post("/downloadLicencia", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], async (req, res, next) => {
  await cargaLicenciaController.getByDownLicencia(req, res, next);
});*/




