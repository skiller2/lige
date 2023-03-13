import { Router } from "express";
import { infoController } from "../controller/controller.module";
import { authMiddleware } from "../middlewares/middleware.module";

const router = Router();
const base = "";

//router.get(`${base}/dbstatus`, authMiddleware.verifyToken, (req, res) => {
router.get(`${base}/dbstatus`,  (req, res) => {
  infoController.dbstatus(res, req);
});

export default router;
