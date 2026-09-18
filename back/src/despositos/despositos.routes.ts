import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { depositosController } from "../controller/controller.module.ts";

export const depositosRouter = Router();

depositosRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res) => {
  depositosController.getGridCols(req, res);
});

// depositosRouter.get("/info/:id", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
//   depositosController.getDepositoById(req, res, next);
// });

// depositosRouter.get("/baja/:id", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
//   depositosController.setDepositoInactivo(req, res, next);
// });

depositosRouter.post("/list", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  depositosController.listDepositos(req, res, next);
});

// depositosRouter.post("/add", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
//   depositosController.addDeposito(req, res, next);
// });

// depositosRouter.post("/update", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
//   depositosController.updateDeposito(req, res, next);
// });