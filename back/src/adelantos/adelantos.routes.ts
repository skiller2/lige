import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { adelantosController } from "../controller/controller.module";

export const adelantosRouter = Router();

adelantosRouter.get('/:PersonalId/:anio/:mes', authMiddleware.verifyToken, (req, res, next) => {
    adelantosController.getByPersonalId(Number(req.params.PersonalId), req.params.anio, req.params.mes, req, res, next)
})
adelantosRouter.post('', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones', 'Liquidaciones Consultas','gSistemas','gConsejo','responsables'])], (req, res, next) => {
    adelantosController.setAdelanto(Number(req.body.anio),Number(req.body.mes), Number(req.body.PersonalId), req.body.monto, req, res, next)
})
adelantosRouter.delete('/:PersonalId', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones', 'Liquidaciones Consultas','gSistemas','gConsejo','responsables'])], (req, res, next) => {
    adelantosController.delAdelanto(Number(req.params.PersonalId), 0, req.socket.remoteAddress, res, next)
})

adelantosRouter.get("/cols", authMiddleware.verifyToken, (req, res) => {
    adelantosController.getAdelantoPersonaCols(req, res);
});

adelantosRouter.post("/list", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones', 'Liquidaciones Consultas','gSistemas','gConsejo','responsables'])], (req, res, next) => {
    adelantosController.getAdelantoPersonaList(req, res, next);
});
