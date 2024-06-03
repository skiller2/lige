import { Router } from "express";
import { personalController } from "../controller/controller.module";
// import { authMiddleware } from "../middlewares/middleware.module";

export const personalRouter = Router();
const base = "";
// personalRouter.get(`/search`, (req, res, next) => { personalController.search(req, res, next) });
// personalRouter.get(`/ultDeposito/:personalId`,  (req, res, next) => { personalController.getUltDeposito(req, res, next) });

personalRouter.get(`${base}/encode`, [], async (req, res, next) => {
  const data = req.params.data 
  const ret = await personalController.genTelCode(data);
  res.status(200).json({ msg: '', data: ret, stamp: new Date(), ms: res.locals.stopTime - res.locals.startTime })
});

personalRouter.get(`${base}/ident`, [], (req, res, next) => {
  personalController.getIdentCode(req, res, next);

});
