import { Router } from "express";
import { clienteController } from "../controller/controller.module";
import { authMiddleware } from "../middlewares/middleware.module";

export const clienteRouter = Router();
const base = "";
clienteRouter.post(
  `${base}/search`,
  authMiddleware.verifyToken,
  (req, res, next) => {
    clienteController.search(req, res, next);
  }
);

