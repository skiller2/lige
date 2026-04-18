import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { recibosController } from "../controller/controller.module.ts";

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

// falta validar la sucursal del usuario para la descarga de recibos individuales
recibosRouter.get("/download/:anio/:mes/:personalIdRel", [authMiddleware.verifyToken, authMiddleware.hasGroup(['DescargaRecibos']), authMiddleware.filterSucursal], (req, res, next) => {
  recibosController.downloadComprobantesByPeriodo(
    req.params.anio,
    req.params.mes,
    req.params.personalIdRel,
    res,
    req,
    next
  );
});


recibosRouter.post('/downloadfull', [authMiddleware.verifyToken, authMiddleware.hasGroup(['DescargaRecibos']), authMiddleware.filterSucursal], async (req, res, next) => {
  await recibosController.bindPdf(req, res, next)
})

recibosRouter.post("/config", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])],
  (req, res, next) => {
    recibosController.setReciboConfig(req, res, next);
  }
);

recibosRouter.post("/prueba", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])],
  (req, res, next) => {
    recibosController.downloadReciboPRueba(req, res, next);
  }
);

recibosRouter.get("/config{/:prev}", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])],
  (req, res, next) => {
    recibosController.getReciboConfig(req, res, next);
  }
);

