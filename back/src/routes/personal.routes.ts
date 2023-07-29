import { Router } from "express";
import { personalController } from "../controller/controller.module";
import { authMiddleware } from "../middlewares/middleware.module";

export const personalRouter = Router();
const base = "";

personalRouter.post(
  `${base}/search`,
  authMiddleware.verifyToken,
  (req, res, next) => {
    personalController.search(req, res, next);
  }
);
personalRouter.get(`${base}/:id`, authMiddleware.verifyToken, (req, res, next) => {
  //personalRouter.get(`${base}/:id`,  (req, res) => {
  personalController.getById(req.params.id, res, next);
});
personalRouter.get(
  `${base}/responsables/:personalId/:anio/:mes`,
  authMiddleware.verifyToken,
  (req, res, next) => {
    personalController.getPersonalResponsables(req, res, next);
  }
);


personalRouter.get(
  `${base}/monotributo/:personalId/:anio/:mes`,
  authMiddleware.verifyToken,
  (req, res, next) => {
    personalController.getPersonalMonotributo(req, res, next);
  }
);


personalRouter.get(`${base}/name/:personalId`, (req, res, next) => {
  personalController.getNameFromId(req.params.personalId, res, next);
});

