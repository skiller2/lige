import { Router } from "express";
import { personalController } from "../controller/controller.module";
import { botServer } from "src";
// import { authMiddleware } from "../middlewares/middleware.module";

export const personalRouter = Router();
const base = "";

personalRouter.get(`${base}/encode`, [], async (req, res, next) => {
  const data = req.params.data 
  const ret = await personalController.genTelCode(data);
  res.status(200).json({ msg: '', data: ret, stamp: new Date(), ms: res.locals.stopTime - res.locals.startTime })
});

personalRouter.get(`${base}/ident`, [], (req, res, next) => {
  personalController.getIdentCode(req, res, next);

});

personalRouter.post(`${base}/sendmsg`, [], (req, res, next) => {
  const dst = req.body.dst;
  const msg = req.body.msg;
  botServer.sendMsg(dst, msg);
  res.status(200).json({ msg: '', data: 'ok', stamp: new Date(), ms: res.locals.stopTime - res.locals.startTime })
})


