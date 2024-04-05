import { Request, Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { recibosController,recibosConfigController } from "../controller/controller.module";

export const recibosRouter = Router();

recibosRouter.post("/generar", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])],
  (req, res, next) => {
    recibosController.generaRecibos(req, res, next);
  }
);

recibosRouter.post("/generarunico", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])],
  (req, res, next) => {
    recibosController.generaRecibos(req, res, next);
  }
);

recibosRouter.get("/download/:anio/:mes/:personalIdRel?", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res,next) => {
  recibosController.downloadComprobantesByPeriodo(
    req.params.anio,
    req.params.mes,
    req.params.personalIdRel,
    res,
    req,
    next
  );
});


recibosRouter.post('/downloadfull', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], async (req, res, next) => {
  await recibosController.bindPdf(req, res, next)
})

recibosRouter.post("/recibosconfig", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])],
  (req, res, next) => {
    console.log("estoy 2......")
    recibosConfigController.generaReciboConfig(req, res, next);
  }
);
