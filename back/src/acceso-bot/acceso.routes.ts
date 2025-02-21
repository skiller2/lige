import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { accesoBotController } from "../controller/controller.module";
import { existsSync } from "fs";
export const accesoBotRouter = Router();


accesoBotRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gConsejo'])], (req, res) => {
  accesoBotController.getGridCols(req, res);
});

accesoBotRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gConsejo'])], (req, res, next) => {
  accesoBotController.list(req, res, next)
})

accesoBotRouter.get("/:PersonalId", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gConsejo'])], (req, res, next) => {
  accesoBotController.getAccess(req, res, next);
});

accesoBotRouter.get("/dni/:PersonalId", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gConsejo'])], (req, res, next) => {
  accesoBotController.getAccessDni(req, res, next);
});

accesoBotRouter.delete("/:PersonalId", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gConsejo'])], (req, res, next) => {
  accesoBotController.deleteAccess(req, res, next);
});



accesoBotRouter.post("/filedni", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gConsejo'])], (req, res, next) => {
  accesoBotController.getByDownloadFileDni(req, res, next);
});

accesoBotRouter.post('/', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gConsejo'])], (req, res, next) => {
  accesoBotController.updateAcess(req, res, next)
})

accesoBotRouter.post('/add', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  accesoBotController.addAccess(req, res, next)
})

accesoBotRouter.get(`/downloadImagenDni/:path`, (req, res, next) => {
  accesoBotController.downloadImagenDNI(
    req.params.path,
    res,
    next
  );
});

// Fn que usa el bot para registro de asociado

accesoBotRouter.get("/validatecuit/:cuit", (req, res, next) => {
  accesoBotController.validateCuit(req, res, next);
});

accesoBotRouter.get("/validaterecibo/:recibo/:cuit", (req, res, next) => {
  accesoBotController.validateRecibo(req, res, next);
});

accesoBotRouter.get("/validatecbu/:cbu/:cuit/:encTelNro", (req, res, next) => {
  accesoBotController.validateCbu(req, res, next);
});

accesoBotRouter.get("/validateencoded/:encTelNro", (req, res, next) => {
  accesoBotController.validateEncoded(req, res, next);
});




