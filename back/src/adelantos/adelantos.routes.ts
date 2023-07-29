import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { adelantosController } from "../controller/controller.module";

export const adelantosRouter = Router();

adelantosRouter.get('/:PersonalId/:anio/:mes',authMiddleware.verifyToken, (req, res,next) => {
    adelantosController.getByPersonalId(req.params.PersonalId, req.params.anio, req.params.mes, req, res,next)
})
adelantosRouter.post('',authMiddleware.verifyToken, (req, res,next) => {
    adelantosController.setAdelanto(req.body.PersonalId, req.body.monto, req.ip, res,next)
})
adelantosRouter.delete('/:PersonalId',authMiddleware.verifyToken, (req, res,next) => {
    adelantosController.delAdelanto(req.params.PersonalId, 0, req.ip, res,next)
})
