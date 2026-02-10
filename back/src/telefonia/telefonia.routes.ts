import { Request, Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { telefoniaController } from "../controller/controller.module";
import multer, { FileFilterCallback } from "multer";
import { existsSync, mkdirSync } from "fs";
import { tmpName } from "../server";
import { ClientException } from "../controller/basecontroller.ts";

const dirtmp = `${process.env.PATH_TELEFONIA}/temp`;
if (!existsSync(dirtmp)) {
    mkdirSync(dirtmp, { recursive: true });
  }

export const telefoniaRouter = Router();

telefoniaRouter.get(`/lugar/options`, authMiddleware.verifyToken, (req, res, next) => {
  telefoniaController.getLugarTelefono(req, res, next);
});
telefoniaRouter.get('/tipo/options', authMiddleware.verifyToken, (req, res, next) => {
  telefoniaController.getTipoTelefono(req, res, next)
});

telefoniaRouter.get("/cols", authMiddleware.verifyToken, (req, res) => {
    telefoniaController.getTelefonosCols(req, res);
});

telefoniaRouter.get("/download/:anio/:mes/:impoexpoId?", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones', 'gLogistica', 'gSistemas'])], (req, res,next) => {
  telefoniaController.downloadComprobantes(
    req.params.anio,
    req.params.mes,
    req.params.impoexpoId,
    res,
    req,
    next
  );
});

telefoniaRouter.post("/list", [authMiddleware.verifyToken,authMiddleware.hasGroup(['Liquidaciones','Liquidaciones Consultas','gLogistica', 'gLogisticaCon', 'gSistemas'])], (req, res, next) => {
    telefoniaController.getTelefonosList(req, res, next);
});

telefoniaRouter.get('/importaciones_anteriores/:anio/:mes', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones', 'gLogistica', 'gSistemas'])], (req, res, next) => {
  telefoniaController.getImportacionesTelefoniaAnteriores(req.params.anio, req.params.mes, req, res, next)
});

telefoniaRouter.post("/import-xls-telefonia", [authMiddleware.verifyToken,authMiddleware.hasGroup(['Liquidaciones','gLogistica', 'gSistemas'])], (req, res, next) => {
  telefoniaController.handleXLSUploadTelefonia(req, res, next)
  });
  