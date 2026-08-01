import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { direccionesController } from "../controller/controller.module.ts";

export const direccionesRouter = Router();

direccionesRouter.get("/test", [authMiddleware.verifyToken], (req, res, next) => {
  direccionesController.test(req, res, next);
});

