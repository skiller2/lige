import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { listaPermisoCargaController } from "../controller/controller.module";

export const listaPersmisoCargaRouter = Router();

listaPersmisoCargaRouter.get("/cols", authMiddleware.verifyToken, (req, res) => {
    listaPermisoCargaController.getGridCols(req, res);
  });

listaPersmisoCargaRouter.post("/list", authMiddleware.verifyToken, (req, res, next) => {
    listaPermisoCargaController.list(req, res, next);
  });

  