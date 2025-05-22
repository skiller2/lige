import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { documentoController } from "../controller/controller.module";

export const documentoRouter = Router();

documentoRouter.get("/get/:id", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  documentoController.getDocumentoById(req, res, next);
});

documentoRouter.get("/cols", [
  authMiddleware.verifyToken,
  authMiddleware.hasGroup(['gSistemas'])
], (req, res) => {
  documentoController.getGridCols(req, res);
});

documentoRouter.get("/cols-download", [
  authMiddleware.verifyToken,
  authMiddleware.hasGroup(['gSistemas'])
], (req, res) => {
  documentoController.getGridDownloadCols(req, res);
});

documentoRouter.get("/cols-no-download", [
  authMiddleware.verifyToken
  , authMiddleware.hasGroup(['gSistemas'])
], (req, res) => {
  documentoController.getGridNoDownloadCols(req, res);
});

documentoRouter.get("/tipos/options", [
  authMiddleware.verifyToken, 
  authMiddleware.hasGroup(['gSistemas'])
], (req, res, next) => {
  documentoController.getTipos(req, res, next);
});

documentoRouter.post('/list', [
  authMiddleware.verifyToken, 
  authMiddleware.hasGroup(['gSistemas'])
], (req, res, next) => {
  documentoController.getdocgenralList(req, res, next)
})

documentoRouter.post('/list-download', [
  authMiddleware.verifyToken, 
  authMiddleware.hasGroup(['gSistemas'])
], (req, res, next) => {
  documentoController.getPersonalDescarga(req, res, next)
})

documentoRouter.post('/list-no-download', [
  authMiddleware.verifyToken, 
  authMiddleware.hasGroup(['gSistemas'])
], (req, res, next) => {
  documentoController.getPersonalNoDescarga(req, res, next)
})

documentoRouter.post('/add', [
  authMiddleware.verifyToken, 
  authMiddleware.hasGroup(['gSistemas'])
], (req, res, next) => {
  documentoController.addDocumento(req, res, next)
})

documentoRouter.post('/update', [
  authMiddleware.verifyToken, 
  authMiddleware.hasGroup(['gSistemas'])
], (req, res, next) => {
  documentoController.updateDocumento(req, res, next)
})

documentoRouter.delete('/delete', [
  authMiddleware.verifyToken, 
  authMiddleware.hasGroup(['gSistemas'])
], (req, res, next) => {
  documentoController.deleteArchivo(req, res, next)
})