import { Router } from "express";
import { personalController } from "../controller/controller.module";
import { authMiddleware } from "../middlewares/middleware.module";
import multer, { FileFilterCallback } from "multer";

export const personalRouter = Router();
const base = "";

personalRouter.post(`${base}/list`, [authMiddleware.verifyToken, authMiddleware.hasGroup([`gPersonalCon`, `gPersonal`])], (req, res, next) => {
  personalController.getGridList(req, res, next)
});

personalRouter.post(`${base}/listfull`, [authMiddleware.verifyToken, authMiddleware.hasGroup([`gPersonalCon`, `gPersonal`])], (req, res, next) => {
  personalController.getListFull(req, res, next)
});


personalRouter.post(`${base}/deleteArchivo`, [authMiddleware.verifyToken, authMiddleware.hasGroup([`gPersonal`])], (req, res, next) => {
  personalController.deleteArchivo(req, res, next)
});

personalRouter.post(
  `${base}/search`,
  authMiddleware.verifyToken,
  (req, res, next) => {
    personalController.search(req, res, next);
  }
);

personalRouter.post(`${base}/add`, [authMiddleware.verifyToken, authMiddleware.hasGroup([`gPersonal`])], (req, res, next) => {
  personalController.addPersonal(req, res, next);
});

personalRouter.post(`${base}/update/:id`, [authMiddleware.verifyToken, authMiddleware.hasGroup([`gPersonal`])], (req, res, next) => {
  personalController.updatePersonal(req, res, next);
});

personalRouter.post(`${base}/setsitrevista/:id`, [authMiddleware.verifyToken, authMiddleware.hasGroup([`gPersonal`])], (req, res, next) => {
  personalController.setSituacionRevista(req, res, next)
});

personalRouter.post(`${base}/categorias`, authMiddleware.verifyToken, (req, res, next) => {
  personalController.getCategoriasByTipoAsociado(req, res, next)
});

personalRouter.post(`${base}/setcategoria/:id`, [authMiddleware.verifyToken, authMiddleware.hasGroup([`gPersonal`])], (req, res, next) => {
  personalController.setCategoria(req, res, next)
});

personalRouter.post(`${base}/setgrupactividad/:id`, [authMiddleware.verifyToken, authMiddleware.hasGroup([`gPersonal`])], (req, res, next) => {
  personalController.setGrupoActividadPersonal(req, res, next)
});

personalRouter.post(`${base}/setbanco/:id`, [authMiddleware.verifyToken, authMiddleware.hasGroup([`Liquidaciones`])], (req, res, next) => {
  personalController.setPersonalBanco(req, res, next)
});

personalRouter.post(`${base}/unsubscribe/cbu`, [authMiddleware.verifyToken, authMiddleware.hasGroup([`Liquidaciones`])], (req, res, next) => {
  personalController.unsubscribeCBUs(req, res, next)
});

personalRouter.get(`${base}/domicilio/:id`, [authMiddleware.verifyToken, authMiddleware.hasGroup([`gPersonalCon`, `gPersonal`])], (req, res, next) => {
  personalController.getDomicilioByPersonalId(req, res, next);
});

personalRouter.get(`${base}/info/:id`, [authMiddleware.verifyToken, authMiddleware.hasGroup([`gPersonalCon`, `gPersonal`])], (req, res, next) => {
  personalController.getFormDataById(req, res, next);
});

personalRouter.get(`${base}/nacionalidad/options`, authMiddleware.verifyToken, (req, res, next) => {
  personalController.getNacionalidadList(req, res, next);
});

personalRouter.get(`${base}/sitrevista/options`, authMiddleware.verifyToken, (req, res, next) => {
  personalController.getSituacionRevista(req, res, next)
});

personalRouter.get(`${base}/tipo-asociado/options`, authMiddleware.verifyToken, (req, res, next) => {
  personalController.getTipoAsociado(req, res, next)
});

personalRouter.get(`${base}/sitrevista/no-options`, authMiddleware.verifyToken, (req, res, next) => {
  personalController.getSituacionRevistaInvalidos(req, res, next)
});

personalRouter.get(`${base}/tipo-parentesco/options`, authMiddleware.verifyToken, (req, res, next) => {
  personalController.getTipoParentesco(req, res, next)
});

personalRouter.get(`${base}/bancos/options`, authMiddleware.verifyToken, (req, res, next) => {
  personalController.getBancos(req, res, next)
});

personalRouter.get(`${base}/estado-civil/options`, authMiddleware.verifyToken, (req, res, next) => {
  personalController.getEstadoCivil(req, res, next)
});

personalRouter.get(`${base}/tipo-documento/options`, authMiddleware.verifyToken, (req, res, next) => {
  personalController.getTipoDocumento(req, res, next)
});

personalRouter.get(`${base}/cols`, authMiddleware.verifyToken, (req, res, next) => {
  personalController.getGridColumns(req, res, next)
});

personalRouter.get(`${base}/telefonos/:id`, authMiddleware.verifyToken, (req, res, next) => {
  //personalRouter.get(`${base}/:id`,  (req, res) => {
  personalController.getTelefonosPorPersona(req.params.id, res, next);
});

personalRouter.get(`${base}/banco/:id`, [authMiddleware.verifyToken], (req, res, next) => {
  //TODO: Revisar porque lleva permiso de authMiddleware.hasGroup([`Liquidaciones`])
  personalController.getCuentasBancoPorPersona(req.params.id, res, next);
});

personalRouter.get(`${base}/responsableslist/:personalId`, [authMiddleware.verifyToken, authMiddleware.hasGroup([`gPersonalCon`, `gPersonal`])], (req, res, next) => {
  personalController.getResponsablesListByPersonal(req, res, next);
});

personalRouter.get(`${base}/grupoactividad/options`, authMiddleware.verifyToken, (req, res, next) => {
  personalController.getGrupoActividad(req, res, next);
});

personalRouter.get(`${base}/lugarhabilitacion/options`, authMiddleware.verifyToken, (req, res, next) => {
  personalController.getLugarHabilitacion(req, res, next);
});

personalRouter.get(`${base}/documentos/:personalId`, [authMiddleware.verifyToken, authMiddleware.hasGroup([`gPersonalCon`, `gPersonal`])], (req, res, next) => {
  personalController.getDocumentosByPersonalId(req, res, next);
});

personalRouter.get("/download/:table/:id", authMiddleware.verifyToken, (req, res, next) => {
  personalController.downloadPersonaDocumentoImagen(req, res, next);
});

personalRouter.get(
  `${base}/responsables/:personalId/:anio/:mes`,
  [authMiddleware.verifyToken, authMiddleware.hasGroup([`gPersonal`, `gPersonalCon`, 'Responsables', 'Liquidaciones', 'Liquidaciones Consultas'])],
  (req, res, next) => {
    personalController.getPersonalResponsables(req, res, next);
  }
);

personalRouter.get(
  `${base}/historial/categoria/:personalId`,
  [authMiddleware.verifyToken, authMiddleware.hasGroup([`gPersonal`, `gPersonalCon`])],
  (req, res, next) => {
    personalController.getHistoryPersonalCategoria(req, res, next);
  }
);

personalRouter.get(
  `${base}/historial/sitrevista/:personalId`,
  [authMiddleware.verifyToken, authMiddleware.hasGroup([`gPersonal`, `gPersonalCon`])],
  (req, res, next) => {
    personalController.getHistoryPersonalSitRevista(req, res, next);
  }
);

personalRouter.get(
  `${base}/historial/banco/:personalId`,
  [authMiddleware.verifyToken, authMiddleware.hasGroup([`Liquidaciones`])],
  (req, res, next) => {
    personalController.getHistoryPersonalBanco(req, res, next);
  }
);

personalRouter.get(
  `${base}/sitrevista/:personalId/:anio/:mes`,
  [authMiddleware.verifyToken, authMiddleware.hasGroup([`gPersonal`, `gPersonalCon`, `Responsables`, 'Liquidaciones', 'Liquidaciones Consultas'])],
  (req, res, next) => {
    personalController.getPersonalSitRevista(req, res, next);
  }
);

personalRouter.get(
  `${base}/monotributo/:personalId/:anio/:mes`,
  authMiddleware.verifyToken,
  (req, res, next) => {
    personalController.getPersonalMonotributo(req, res, next);
  }
);

personalRouter.get(`${base}/name/:personalId`, authMiddleware.verifyToken, (req, res, next) => {
  personalController.getNameFromId(req.params.personalId, res, next);
});

personalRouter.get(`${base}/:id`, [authMiddleware.verifyToken, authMiddleware.hasGroup([`gPersonal`, `gPersonalCon`, 'Responsables', 'Liquidaciones', 'Liquidaciones Consultas'])], (req, res, next) => {
  personalController.getById(req.params.id, res, next);
});

personalRouter.get(`${base}/historial/acta/:personalId`, [authMiddleware.verifyToken, authMiddleware.hasGroup([`gPersonal`, `gPersonalCon`])], (req, res, next) => {
  personalController.getPersonalActa(req, res, next);
});

personalRouter.get(`${base}/acta/tipo-acta-options`, [authMiddleware.verifyToken], (req, res, next) => {
  personalController.getTipoPersonalActa(req, res, next);
});

personalRouter.post(`${base}/acta/add/:personalId`, [authMiddleware.verifyToken, authMiddleware.hasGroup([`gPersonal`])], (req, res, next) => {
  personalController.addPersonalActa(req, res, next);
});