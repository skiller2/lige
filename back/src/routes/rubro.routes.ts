import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.module";
import { rubroController } from "../controller/controller.module";

export const rubroRouter = Router();

rubroRouter.post("/search", authMiddleware.verifyToken,(req, res, next) => {
    rubroController.search(req, res, next)
});

