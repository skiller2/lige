import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { tipoDocumentoController } from "../controller/controller.module";

export const tipoDocumentoRouter = Router();

tipoDocumentoRouter.get("/cols", authMiddleware.verifyToken, (req, res) => {
    
    tipoDocumentoController.getGridCols(req, res);
  });

  tipoDocumentoRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => {
    tipoDocumentoController.getdocgenralList(req, res, next)
})
