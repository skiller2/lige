import { Request, Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { segurosController } from "../controller/controller.module";

export const segurosRouter = Router();

segurosRouter.get(`/lugar/options`, authMiddleware.verifyToken, (req, res, next) => {
  //  segurosController.getLugarTelefono(req, rs, next);
});
segurosRouter.get('/tipo/options', authMiddleware.verifyToken, (req, res, next) => {
  //  segurosController.getTipoTelefono(req, res, next)
});


segurosRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon', 'Liquidaciones', 'Liquidaciones Consultas', 'gSistemas'])], (req, res, next) => {
  segurosController.getGridCols(req, res);
})

segurosRouter.post("/list", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon', 'Liquidaciones', 'Liquidaciones Consultas', 'gSistemas'])], (req, res, next) => {
  segurosController.getSegurosList(req, res, next);
})

segurosRouter.post(`/search`, [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon', 'Liquidaciones', 'Liquidaciones Consultas', 'gSistemas'])], (req, res, next) => {
  segurosController.search(req, res, next);
}
)

segurosRouter.post('/updateSeguros', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'Liquidaciones', 'gSistemas'])], (req, res, next) => {
  segurosController.updateSeguros(req, res, req.body.anio, req.body.mes, next)
}
)

segurosRouter.get('/cols-poliza', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon', 'Liquidaciones', 'Liquidaciones Consultas', 'gSistemas'])], (req, res, next) => {
  segurosController.getGridColsPoliza(req, res);
})

segurosRouter.post('/list-poliza', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon', 'Liquidaciones', 'Liquidaciones Consultas', 'gSistemas'])], (req, res, next) => {
  segurosController.getListPolizaSeguro(req, res, next);
})

segurosRouter.get('/searchCompaniaSeguro', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon', 'Liquidaciones', 'Liquidaciones Consultas', 'gSistemas'])], (req, res, next) => {
  segurosController.getCompaniaSeguroSearch(req, res, next);
})

segurosRouter.get('/searchCompaniaSeguroId/:id', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon', 'Liquidaciones', 'Liquidaciones Consultas', 'gSistemas'])], (req, res, next) => {
  segurosController.getCompaniaSeguroId(req, res, next);
})

segurosRouter.get('/poliza/:PolizaSeguroNroPoliza/:PolizaSeguroNroEndoso/:CompaniaSeguroId/:TipoSeguroCodigo', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon', 'Liquidaciones', 'Liquidaciones Consultas', 'gSistemas'])], (req, res, next) => {
  segurosController.getPolizaSeguro(req, res, next);
})

segurosRouter.post('/setpoliza', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'Liquidaciones', 'gSistemas'])], (req, res, next) => {
  segurosController.setPolizaSeguro(req, res, next);
})

segurosRouter.get('/searchTipoSeguro', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon', 'Liquidaciones', 'Liquidaciones Consultas', 'gSistemas'])], (req, res, next) => {
  segurosController.getTipoSeguroSearch(req, res, next);
})

segurosRouter.get('/searchTipoSeguroId/:id', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon', 'Liquidaciones', 'Liquidaciones Consultas', 'gSistemas'])], (req, res, next) => {
  segurosController.getTipoSeguroId(req, res, next);
})

segurosRouter.get('/cols-personal-seguro', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon', 'Liquidaciones', 'Liquidaciones Consultas', 'gSistemas'])], (req, res, next) => {
  segurosController.getColsPersonalSeguro(req, res, next);
})

segurosRouter.post('/list-personal-seguro', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon', 'Liquidaciones', 'Liquidaciones Consultas', 'gSistemas'])], (req, res, next) => {
  segurosController.getListPersonalSeguro(req, res, next);
})
















