import { Request, Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { preciosProductosController } from "../controller/controller.module";

export const preciosProductosRouter = Router();

preciosProductosRouter.get("/cols", authMiddleware.verifyToken, (req, res) => {
    preciosProductosController.getGridCols(req, res);
});

preciosProductosRouter.get("/colsHistory", authMiddleware.verifyToken, (req, res) => {
  preciosProductosController.colsHistory(req, res);
});

preciosProductosRouter.get("/:codigoHistory", authMiddleware.verifyToken, (req, res, next) => {
  preciosProductosController.listCodigoHistory(req.params.codigoHistory, res, next);;
});


  preciosProductosRouter.post('/list', authMiddleware.verifyToken, (req, res, next) => {
    preciosProductosController.listPrecios(req, res, next)
})

preciosProductosRouter.post('/changecell', authMiddleware.verifyToken, (req, res, next) => {
  preciosProductosController.changecell(req, res, next)
})

preciosProductosRouter.delete('/', authMiddleware.verifyToken,  (req, res, next) => {
  preciosProductosController.deleteProducto(req, res, next)
})

