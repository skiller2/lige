import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { accesoBotController} from "../controller/controller.module";

export const accesoBotRouter = Router();


accesoBotRouter.get("/cols", authMiddleware.verifyToken, (req, res) => {
  accesoBotController.getGridCols(req, res);
});

accesoBotRouter.post('/list', authMiddleware.verifyToken, (req, res, next) => {
  accesoBotController.list(req, res, next)
})

accesoBotRouter.get("/:PersonalId", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], (req, res, next) => {
  accesoBotController.getAccess(req, res, next);
});

accesoBotRouter.get("/dni/:PersonalId", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], (req, res, next) => {
  accesoBotController.getAccessDni(req, res, next);
});

accesoBotRouter.delete("/:PersonalId", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], (req, res, next) => {
  accesoBotController.deleteAccess(req, res, next);
});


