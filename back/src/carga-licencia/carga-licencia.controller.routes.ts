import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { cargaLicenciaController } from "../controller/controller.module";

export const CargaLicenciaCargaRouter = Router();

CargaLicenciaCargaRouter.get("/cols", authMiddleware.verifyToken, (req, res) => {
  cargaLicenciaController.getGridCols(req, res);
  });

CargaLicenciaCargaRouter.post("/list", authMiddleware.verifyToken, (req, res, next) => {
    cargaLicenciaController.list(req, res, next);
  });

CargaLicenciaCargaRouter.get("/listforedit/:PersonalId/:PersonalLicenciaId", authMiddleware.verifyToken, (req, res, next) => {
    cargaLicenciaController.listforedit(req, res, next);
});
  