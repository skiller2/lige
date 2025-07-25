import { Router } from "express";
import { InfoController } from "../info/info.controller.ts";
//import { authMiddleware } from "../middlewares/middleware.module";

export const infoRouter = Router();
const base = "";
const infoController = new InfoController() 

//router.get(`${base}/dbstatus`, authMiddleware.verifyToken, (req, res) => {
infoRouter.get(`${base}/dbstatus`, (req, res, next) => {
  infoController.dbstatus(req, res, next)
})
