import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { facturacionController } from "../controller/controller.module.ts";

export const facturacionRouter = Router();


facturacionRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas', 'Liquidaciones', 'Liquidaciones Consultas'])], (req, res) => {
    facturacionController.getGridCols(req, res);
});

facturacionRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas' , 'Liquidaciones', 'Liquidaciones Consultas'])], (req, res, next) => {
  facturacionController.list(req, res, next)
})

facturacionRouter.get('/comprobanteTipo_getOptions', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    facturacionController.getComprobanteTipoOptions(req, res, next)
  })

facturacionRouter.get('/facturas/:ComprobanteNro/:FacturacionCodigo', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    facturacionController.getFacturas(req, res, next)
  })

facturacionRouter.post('/save', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  facturacionController.saveFacturacion(req, res, next)
})

facturacionRouter.get("/colsDetail", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res) => {
  facturacionController.getGridColsDetail(req, res);
});
