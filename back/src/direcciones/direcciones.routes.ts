import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { direccionesController } from "../controller/controller.module.ts";

export const direccionesRouter = Router();

direccionesRouter.get("/test", [authMiddleware.verifyToken], (req, res, next) => {
  direccionesController.test(req, res, next);
});

direccionesRouter.get('/paises', [authMiddleware.verifyToken, ], (req, res, next) => { direccionesController.getPaises(req, res, next) } )
direccionesRouter.get('/provincias/options', [authMiddleware.verifyToken, ], (req, res, next) => { direccionesController.getProvincias(req, res, next) } )
direccionesRouter.get('/localidades/options', [authMiddleware.verifyToken, ], (req, res, next) => { direccionesController.getLocalidad(req, res, next) } )
direccionesRouter.get('/barrios/options', [authMiddleware.verifyToken, ], (req, res, next) => { direccionesController.getBarrio(req, res, next) } )

direccionesRouter.post('/search/provincia', [authMiddleware.verifyToken, ], (req, res, next) => { direccionesController.searchProvincia(req, res, next) } )
direccionesRouter.post('/search/localidad', [authMiddleware.verifyToken, ], (req, res, next) => { direccionesController.searchLocalidad(req, res, next) } )
direccionesRouter.post('/search/barrio', [authMiddleware.verifyToken, ], (req, res, next) => { direccionesController.searchBarrio(req, res, next) } )

direccionesRouter.post('/provincias', [authMiddleware.verifyToken, ], (req, res, next) => { direccionesController.getProvinciasByPais(req, res, next) } )
direccionesRouter.post('/localidades', [authMiddleware.verifyToken, ], (req, res, next) => { direccionesController.getLocalidadByProvincia(req, res, next) } )
direccionesRouter.post('/barrios', [authMiddleware.verifyToken, ], (req, res, next) => { direccionesController.getBarrioByLocalidad(req, res, next) } )

