import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { facturacionController } from "../controller/controller.module";

export const facturacionRouter = Router();


facturacionRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon'])], (req, res) => {
    facturacionController.getGridCols(req, res);
});

facturacionRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon'])], (req, res, next) => {
  facturacionController.list(req, res, next)
})


