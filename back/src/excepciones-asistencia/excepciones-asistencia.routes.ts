import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { excepcionesAsistenciaController } from "../controller/controller.module";

export const excepcionesAsistenciaRouter = Router();

excepcionesAsistenciaRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas', ])], (req, res, next) => {
    excepcionesAsistenciaController.getGridColums(req, res, next);
});

excepcionesAsistenciaRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas', ])], (req, res, next) => {
  excepcionesAsistenciaController.list(req, res, next)
})