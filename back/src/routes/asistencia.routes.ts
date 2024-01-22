import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module"
import { asistenciaController } from "../controller/controller.module"

export const asistenciaRouter = Router()


asistenciaRouter.get('/metodologia', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.getMetodologia(req, res, next) } )

asistenciaRouter.get('/exceporobj/:anio/:mes/:objetivoId', authMiddleware.verifyToken, (req, res, next) => {asistenciaController.getExcepAsistenciaPorObjetivo(req, res, next) })

asistenciaRouter.get('/listaporobj/:anio/:mes/:objetivoId', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.getAsistenciaPorObjetivo(req, res, next) })

asistenciaRouter.get('/exceporper/:anio/:mes/:personalId', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.getExcepAsistenciaPorPersona(req, res, next) })

asistenciaRouter.get('/descuentosxper/:anio/:mes/:personalId', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.getDescuentosPorPersona(req, res, next) })
asistenciaRouter.get('/categoriasxper/:anio/:mes/:personalId/:SucursalId', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.getCategoriasPorPersona(req, res, next) })
asistenciaRouter.get('/hablitacionesxper/:anio/:mes/:personalId', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.getHabilitacionesPorPersona(req, res, next) })
asistenciaRouter.get('/licenciasxper/:anio/:mes/:personalId', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.getLicenciasPorPersona(req, res, next) })
asistenciaRouter.get('/personalxresp/:anio/:mes/:personalId', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.getPersonalxResponsable(req, res, next) })
asistenciaRouter.get('/ingresosxper/:anio/:mes/:personalId', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.getIngresosPorPersona(req, res, next) })
asistenciaRouter.get('/ingresosextraxper/:anio/:mes/:personalId', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.getIngresosExtraPorPersona(req, res, next) })

asistenciaRouter.get('/descuentosxobj/:anio/:mes/:objetivoId', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.getDescuentosPorObjetivo(req, res, next) })

asistenciaRouter.get('/listaporper/:anio/:mes/:personalId', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.getAsistenciaPorPersona(req, res, next) })


asistenciaRouter.get('/categorias', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.getCategoria(req, res, next) })

asistenciaRouter.post('/excepcion', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.setExcepcion(req, res, next) })


asistenciaRouter.delete('/excepcion/:anio/:mes/:ObjetivoId/:PersonalId/:metodo/:metodologiaId', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.deleteExcepcion(req, res, next) })

asistenciaRouter.post('/agregarasistencia', authMiddleware.verifyToken, (req, res, next) => {asistenciaController.addAsistencia(req, res, next)})
asistenciaRouter.post('/periodo/inicio', authMiddleware.verifyToken, (req, res, next) => {asistenciaController.addAsistenciaPeriodoResJson(req, res, next)})
asistenciaRouter.post('/periodo/fin', authMiddleware.verifyToken, (req, res, next) => {asistenciaController.endAsistenciaPeriodo(req, res, next)})
asistenciaRouter.get('/periodo/:anio/:mes/:ObjetivoId', authMiddleware.verifyToken, (req, res, next) => {asistenciaController.getAsistenciaPeriodo(req, res, next)})
asistenciaRouter.get('/listaperasig/:anio/:mes/:ObjetivoId', authMiddleware.verifyToken, (req, res, next) => {asistenciaController.getListaAsistenciaPersonalAsignado(req, res, next)})

asistenciaRouter.get('/listaperasigant/:anio/:mes/:ObjetivoId', authMiddleware.verifyToken, (req, res, next) => { asistenciaController.getListaAsistenciaPersonalAsignadoAnterior(req, res, next) })
