import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.module";
import { objetivoController } from "../controller/controller.module";

export const objetivoRouter = Router();

objetivoRouter.post("/search", authMiddleware.verifyToken, (req, res) => {
  objetivoController.search(req, res);
});

objetivoRouter.get(
  "/:anio/:mes/:objetivoId",
  authMiddleware.verifyToken,
  (req, res) => {
    objetivoController.getById(
      Number(req.params.objetivoId),
      Number(req.params.anio),
      Number(req.params.mes),
      res
    );
  }
);

objetivoRouter.get(
  "/name/:objetivoId",
  authMiddleware.verifyToken,
  (req, res) => {
    objetivoController.ObjetivoInfoFromId(req.params.objetivoId, res);
  }
);
