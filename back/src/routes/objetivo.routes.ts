import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.module";
import { objetivoController } from "../controller/controller.module";

export const objetivoRouter = Router();

objetivoRouter.post("/search", authMiddleware.verifyToken,(req, res, next) => {
  objetivoController.search(req, res, next)
});

objetivoRouter.get(
  "/:anio/:mes/:objetivoId",
  authMiddleware.verifyToken,
  (req, res, next) => {
    objetivoController.getById(
      Number(req.params.objetivoId),
      Number(req.params.anio),
      Number(req.params.mes),
      res,
      next
    );
  }
);

objetivoRouter.get(
  "/contratos/:anio/:mes/:objetivoId",
  authMiddleware.verifyToken,
  (req, res, next) => {
    objetivoController.getObjetivoContratosResponse(
      Number(req.params.objetivoId),
      Number(req.params.anio),
      Number(req.params.mes),
      res,
      next
    );
  }
);

objetivoRouter.get(
  "/responsables/:anio/:mes/:objetivoId",
  authMiddleware.verifyToken,
  (req, res, next) => {
    objetivoController.getObjetivoResponsablesResponse(
      Number(req.params.objetivoId),
      Number(req.params.anio),
      Number(req.params.mes),
      res,
      next
    );
  }
);


objetivoRouter.get(
  "/name/:objetivoId",
  authMiddleware.verifyToken,
  (req, res, next) => {
    objetivoController.ObjetivoInfoFromId(req.params.objetivoId, res, next);
  }
);
