import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { clientesController} from "../controller/controller.module";

export const clientesRouter = Router();

clientesRouter.get("/cols", authMiddleware.verifyToken, (req, res) => {
    clientesController.getGridCols(req, res);
  });

clientesRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => {
    clientesController.listClientes(req, res, next)
})
