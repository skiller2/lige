import { Router } from "express";
import { infoController } from "../controller/controller.module";
import { authMiddleware } from "../middlewares/middleware.module";

export const infoRouter = Router();
const base = "";

//router.get(`${base}/dbstatus`, authMiddleware.verifyToken, (req, res) => {
infoRouter.get(`${base}/dbstatus`,  (req, res) => {
  infoController.dbstatus(res, req);
});
