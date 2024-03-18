import { Request, Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { recibosController } from "../controller/controller.module";

export const recibosRouter = Router();

recibosRouter.post("/generar", [authMiddleware.verifyToken, authMiddleware.hasGroup('Liquidaciones')],
  (req, res, next) => {
    recibosController.generaRecibos(req, res, next);
  }
);

recibosRouter.post("/generarunico", [authMiddleware.verifyToken, authMiddleware.hasGroup('Liquidaciones')],
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


recibosRouter.post('/downloadfull', [authMiddleware.verifyToken], async (req, res, next) => {
  await recibosController.bindPdf(req, res, next)
})





