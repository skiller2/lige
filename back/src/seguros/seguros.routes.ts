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


segurosRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal','Liquidaciones'])], (req, res, next) => {
  segurosController.getGridCols(req, res);
})

segurosRouter.post("/list", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal','Liquidaciones'])], (req, res, next) => {
  segurosController.getSegurosList(req, res, next);
})

segurosRouter.post(`/search`, [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal','Liquidaciones'])], (req, res, next) => {
  segurosController.search(req, res, next);
}
)

segurosRouter.post('/updateSeguros', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal','Liquidaciones'])], (req, res, next) => {
  segurosController.updateSeguros(req, res, req.body.anio, req.body.mes, next)
}
)








