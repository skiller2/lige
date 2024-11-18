import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { accesoBotController} from "../controller/controller.module";
import {  existsSync} from "fs";
export const accesoBotRouter = Router();


accesoBotRouter.get("/cols", authMiddleware.verifyToken, (req, res) => {
  accesoBotController.getGridCols(req, res);
});

accesoBotRouter.post('/list', authMiddleware.verifyToken, (req, res, next) => {
  accesoBotController.list(req, res, next)
})

accesoBotRouter.get("/:PersonalId", authMiddleware.verifyToken, (req, res, next) => {
  accesoBotController.getAccess(req, res, next);
});

accesoBotRouter.get("/dni/:PersonalId", authMiddleware.verifyToken, (req, res, next) => {
  accesoBotController.getAccessDni(req, res, next);
});

accesoBotRouter.delete("/:PersonalId", authMiddleware.verifyToken, (req, res, next) => {
  accesoBotController.deleteAccess(req, res, next);
});

accesoBotRouter.post('/', authMiddleware.verifyToken, (req, res, next) => { 
  accesoBotController.updateAcess(req, res, next)
} )

accesoBotRouter.post('/add', authMiddleware.verifyToken, (req, res, next) => { 
  accesoBotController.addAccess(req, res, next) 
} )

accesoBotRouter.get(`/downloadImagen/:personalId/:documentoImagenParametroId`,(req, res,next) => {
  accesoBotController.downloadImagen(
    Number(req.params.personalId),
    Number(req.params.documentoImagenParametroId),
    res,
    next
  );
});

accesoBotRouter.get(`/downloadImagenDni/:path`, (req, res,next) => {
  accesoBotController.downloadImagenDNI(
    req.params.path,
    res,
    next
  );
});

