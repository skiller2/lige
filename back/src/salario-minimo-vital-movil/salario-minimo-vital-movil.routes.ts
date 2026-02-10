import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { salarioMinimoVitalMovilController } from "../controller/controller.module.ts";

export const salarioMinimoVitalMovilRouter = Router();

salarioMinimoVitalMovilRouter.get("/cols", [authMiddleware.verifyToken], (req, res, next) => {
    salarioMinimoVitalMovilController.getGridCols(req, res, next);
});

salarioMinimoVitalMovilRouter.post(`/list`, [authMiddleware.verifyToken], (req, res, next) => {
    salarioMinimoVitalMovilController.getGridList(req, res, next);
});

salarioMinimoVitalMovilRouter.post(`/onchangecell`, [authMiddleware.verifyToken], (req, res, next) => {
    salarioMinimoVitalMovilController.onchangecellSMVM(req, res, next);
});

salarioMinimoVitalMovilRouter.get(`/ultimo-periodo`, [authMiddleware.verifyToken], (req, res, next) => {
    salarioMinimoVitalMovilController.getUltimoPeriodo(req, res, next);
});

salarioMinimoVitalMovilRouter.delete(`/delete/:SalarioMinimoVitalMovilId`, [authMiddleware.verifyToken], (req, res, next) => {
    salarioMinimoVitalMovilController.deleteSMVM(req, res, next);
});