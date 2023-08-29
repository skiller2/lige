import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { movimientosAutomaticosController,
         ingresoPorAsistenciaController,
         ingresoAsistenciaAdministrativosController,
         ingresoArticulo42Controller,
         ingresoCoordinadorCuentaController,
         descuentoPorDeudaAnteriorController,
         descuentosController,
         movimientoAcreditacionEnCuentaController } from "../controller/controller.module";

export const liquidacionesRouter = Router();

  liquidacionesRouter.post('/movimientosAutomaticos', [authMiddleware.verifyToken,authMiddleware.hasGroup('Administrativo')], async (req, res, next) => {
        try {
            const resultado = await movimientosAutomaticosController.procesaCambios(req, res, next)
            const stopTime = performance.now()
            res.status(200).json({ msg: resultado, data: [], stamp: new Date(), ms: stopTime-res.locals.startTime});
        } catch (error) {
            const stopTime = performance.now()
            res.status(409).json({ msg: error.message, data: [], stamp: new Date(), ms: stopTime-res.locals.startTime});
        }
    })

    liquidacionesRouter.post('/ingresoPorAsistencia', [authMiddleware.verifyToken,authMiddleware.hasGroup('Administrativo')], async (req, res, next) => {
        try {
            const resultado = await ingresoPorAsistenciaController.procesaCambios(req, res, next)
            const stopTime = performance.now()
            res.status(200).json({ msg: resultado, data: [], stamp: new Date(), ms: stopTime-res.locals.startTime});
        } catch (error) {
            const stopTime = performance.now()
            res.status(409).json({ msg: error.message, data: [], stamp: new Date(), ms: stopTime-res.locals.startTime});
        }
    })

    liquidacionesRouter.post('/ingresoPorAsistenciaAdministrativos', [authMiddleware.verifyToken,authMiddleware.hasGroup('Administrativo')], async (req, res, next) => {
        try {
            const resultado = await ingresoAsistenciaAdministrativosController.procesaCambios(req, res, next)
            const stopTime = performance.now()
            res.status(200).json({ msg: resultado, data: [], stamp: new Date(), ms: stopTime-res.locals.startTime});
        } catch (error) {
            const stopTime = performance.now()
            res.status(409).json({ msg: error.message, data: [], stamp: new Date(), ms: stopTime-res.locals.startTime});
        }
    })

    liquidacionesRouter.post('/ingresosArt42', [authMiddleware.verifyToken,authMiddleware.hasGroup('Administrativo')], async (req, res, next) => {
        try {
            const resultado = await ingresoArticulo42Controller.procesaCambios(req, res, next)
            const stopTime = performance.now()
            res.status(200).json({ msg: resultado, data: [], stamp: new Date(), ms: stopTime-res.locals.startTime});
        } catch (error) {
            const stopTime = performance.now()
            res.status(409).json({ msg: error.message, data: [], stamp: new Date(), ms: stopTime-res.locals.startTime});
        }
    })

    liquidacionesRouter.post('/ingresosCoordinadorDeCuenta', [authMiddleware.verifyToken,authMiddleware.hasGroup('Administrativo')], async (req, res, next) => {
        try {
            const resultado = await ingresoCoordinadorCuentaController.procesaCambios(req, res, next)
            const stopTime = performance.now()
            res.status(200).json({ msg: resultado, data: [], stamp: new Date(), ms: stopTime-res.locals.startTime});
        } catch (error) {
            const stopTime = performance.now()
            res.status(409).json({ msg: error.message, data: [], stamp: new Date(), ms: stopTime-res.locals.startTime});
        }
    })

    liquidacionesRouter.post('/descuentoPorDeudaAnterior', [authMiddleware.verifyToken,authMiddleware.hasGroup('Administrativo')], async (req, res, next) => {
        try {
            const resultado = await descuentoPorDeudaAnteriorController.procesaCambios(req, res, next)
            const stopTime = performance.now()
            res.status(200).json({ msg: resultado, data: [], stamp: new Date(), ms: stopTime-res.locals.startTime});
        } catch (error) {
            const stopTime = performance.now()
            res.status(409).json({ msg: error.message, data: [], stamp: new Date(), ms: stopTime-res.locals.startTime});
        }
    })

    liquidacionesRouter.post('/descuentos', [authMiddleware.verifyToken,authMiddleware.hasGroup('Administrativo')], async (req, res, next) => {
        try {
            const resultado = await descuentosController.procesaCambios(req, res, next)
            const stopTime = performance.now()
            res.status(200).json({ msg: resultado, data: [], stamp: new Date(), ms: stopTime-res.locals.startTime});
        } catch (error) {
            const stopTime = performance.now()
            res.status(409).json({ msg: error.message, data: [], stamp: new Date(), ms: stopTime-res.locals.startTime});
        }
    })

    liquidacionesRouter.post('/movimientoAcreditacionEnCuenta', [authMiddleware.verifyToken,authMiddleware.hasGroup('Administrativo')], async (req, res, next) => {
        try {
            const resultado = await movimientoAcreditacionEnCuentaController.procesaCambios(req, res, next)
            const stopTime = performance.now()
            res.status(200).json({ msg: resultado, data: [], stamp: new Date(), ms: stopTime-res.locals.startTime});
        } catch (error) {
            const stopTime = performance.now()
            res.status(409).json({ msg: error.message, data: [], stamp: new Date(), ms: stopTime-res.locals.startTime});
        }
    })
    
    
    