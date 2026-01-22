import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.module";
import { sueldoMinimoVitalMovilController } from "../controller/controller.module";

export const sueldoMinimoVitalMovilRouter = Router();

sueldoMinimoVitalMovilRouter.get("/cols", [authMiddleware.verifyToken], (req, res, next) => {
    sueldoMinimoVitalMovilController.getGridCols(req, res, next);
});

sueldoMinimoVitalMovilRouter.post(`/list`, [authMiddleware.verifyToken], (req, res, next) => {
    sueldoMinimoVitalMovilController.getGridList(req, res, next);
});

sueldoMinimoVitalMovilRouter.post(`/onchangecell`, [authMiddleware.verifyToken], (req, res, next) => {
    sueldoMinimoVitalMovilController.onchangecellSMVM(req, res, next);
});

sueldoMinimoVitalMovilRouter.get(`/ultimo-periodo`, [authMiddleware.verifyToken], (req, res, next) => {
    sueldoMinimoVitalMovilController.getUltimoPeriodo(req, res, next);
});

sueldoMinimoVitalMovilRouter.delete(`/delete/:SalarioMinimoVitalMovilId`, [authMiddleware.verifyToken], (req, res, next) => {
    sueldoMinimoVitalMovilController.deleteSMVM(req, res, next);
});