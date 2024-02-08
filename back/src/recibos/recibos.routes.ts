import { Request, Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { recibosController } from "../controller/controller.module";

export const recibosRouter = Router();

recibosRouter.post("/generar", [authMiddleware.verifyToken, authMiddleware.hasGroup('Liquidaciones')],
  (req, res, next) => {
    recibosController.generaRecibos(req, res, next);
  }
);

recibosRouter.get("/download/:anio/:mes/:personalIdRel?", (req, res,next) => {
  recibosController.downloadComprobantesByPeriodo(
    req.params.anio,
    req.params.mes,
    req.params.personalIdRel,
    res,
    req,
    next
  );
});

recibosRouter.get("/downloadfull/:anio/:mes", (req, res,next) => {
  recibosController.bindPdf(
    req.params.anio,
    req.params.mes,
    res,
    req,
    next
  );
});




