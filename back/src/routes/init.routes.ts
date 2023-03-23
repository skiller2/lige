import { Router } from "express";
import { initController } from "../controller/controller.module";
import { authMiddleware } from "../middlewares/middleware.module";

export const initRouter = Router();
const base = "";

initRouter.get(`${base}/stats`,  authMiddleware.verifyToken, (req, res) => {
    initController.getStats(req, res);
})
