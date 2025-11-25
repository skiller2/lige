import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { efectoController } from "../controller/controller.module";

export const efectoRouter = Router();

efectoRouter.get("/personal/:id", [authMiddleware.verifyToken, ], (req, res, next) => {
  efectoController.getEfectoByPersonalId(req, res, next);
});
efectoRouter.get("/objetivo/:id", [authMiddleware.verifyToken, ], (req, res, next) => {
  efectoController.getEfectoByObjetivoId(req, res, next);
});

efectoRouter.get("/colsPersonal", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res) => {
  efectoController.getGridColsPersonal(req, res);
});
efectoRouter.post("/getEfectoPersonal", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  efectoController.getEfectoPersonal(req, res, next);
});

efectoRouter.get("/colsObjetivos", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res) => {
  efectoController.getGridColsObjetivos(req, res);
});
efectoRouter.post("/getEfectoObjetivos", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  efectoController.getEfectoObjetivos(req, res, next);
});