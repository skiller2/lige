import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { tipoAsociadoCategoriaController } from "../controller/controller.module";

export const tipoAsociadoCategoriaRouter = Router();

tipoAsociadoCategoriaRouter.post("/searchTipoAsociadoCategoria", authMiddleware.verifyToken, (req, res, next) => {
  tipoAsociadoCategoriaController.searchTipoAsociadoCategoria(req, res, next);
});

