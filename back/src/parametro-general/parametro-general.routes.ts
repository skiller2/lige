import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { parametroGeneralController } from "../controller/controller.module.ts";

export const parametroGeneralRouter = Router();

parametroGeneralRouter.get("/cols", [authMiddleware.verifyToken], (req, res) => {
  parametroGeneralController.getGridColsParametrosGenerales(req, res);
});

parametroGeneralRouter.post("/list", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  parametroGeneralController.getListParametrosGenerales(req, res, next);
});

parametroGeneralRouter.post("/save", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  parametroGeneralController.setParametroGeneral(req, res, next);
});

parametroGeneralRouter.post("/baja", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  parametroGeneralController.deleteParametroGeneral(req, res, next);
});

parametroGeneralRouter.get("/:ParametroGeneralCodigo", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  parametroGeneralController.getParametroGeneral(req, res, next);
});
