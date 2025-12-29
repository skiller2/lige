import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { condicionesVentaController } from "../controller/controller.module";

export const condicionesVentaRouter = Router();


condicionesVentaRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res) => {
  condicionesVentaController.getGridCols(req, res);
});

condicionesVentaRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    condicionesVentaController.listCondicionesVenta(req, res, next)
})

condicionesVentaRouter.post('/add', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  condicionesVentaController.addCondicionVenta(req, res, next)
})

 condicionesVentaRouter.get('/exist/:codobjId/:PeriodoDesdeAplica',
   [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  condicionesVentaController.existCondicionVenta(req, res, next)
})
