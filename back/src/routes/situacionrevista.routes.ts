import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.module";
import { situacionRevistaController } from "../controller/controller.module";

export const situacionrevistaRouter = Router();

situacionrevistaRouter.post("/search", authMiddleware.verifyToken,(req, res, next) => {
    situacionRevistaController.search(req, res, next)
});

