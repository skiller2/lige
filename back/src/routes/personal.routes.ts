import { Router } from "express";
import { personalController } from "../controller/controller.module";
import { authMiddleware } from "../middlewares/middleware.module";

export const personalRouter = Router();
const base = "";

personalRouter.post(
  `${base}/search`,
  authMiddleware.verifyToken,
  (req, res) => {
    personalController.search(req, res);
  }
);
personalRouter.get(`${base}/:id`, authMiddleware.verifyToken, (req, res) => {
  //personalRouter.get(`${base}/:id`,  (req, res) => {
  personalController.getById(req.params.id, res);
});
personalRouter.get(
  `${base}/responsables/:personalId/:anio/:mes`,
  authMiddleware.verifyToken,
  (req, res) => {
    personalController.getPersonalResponsables(req, res);
  }
);

personalRouter.get(`${base}/name/:personalId`, (req, res) => {
  personalController.getNameFromId(req.params.personalId, res);
});
