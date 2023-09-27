import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import {
    movimientosAutomaticosController,
    ingresoPorAsistenciaController,
    ingresoAsistenciaAdministrativosArt42Controller,
    ingresoCoordinadorCuentaController,
    descuentoPorDeudaAnteriorController,
    descuentosController,
    movimientoAcreditacionEnCuentaController,
    liquidacionesController,
    liquidacionesBancoController
} from "../controller/controller.module";

export const liquidacionesRouter = Router();

liquidacionesRouter.post('/movimientosAutomaticos', [authMiddleware.verifyToken, authMiddleware.hasGroup('Administrativo')], async (req, res, next) => {
    await movimientosAutomaticosController.procesaCambios(req, res, next)
})

liquidacionesRouter.post('/ingresoPorAsistencia', [authMiddleware.verifyToken, authMiddleware.hasGroup('Administrativo')], async (req, res, next) => {
    await ingresoPorAsistenciaController.procesaCambios(req, res, next)
})

liquidacionesRouter.post('/ingresoPorAsistenciaAdministrativosArt42', [authMiddleware.verifyToken, authMiddleware.hasGroup('Administrativo')], async (req, res, next) => {
    ingresoAsistenciaAdministrativosArt42Controller.procesaCambios(req, res, next)
})

liquidacionesRouter.post('/ingresosCoordinadorDeCuenta', [authMiddleware.verifyToken, authMiddleware.hasGroup('Administrativo')], async (req, res, next) => {
    await ingresoCoordinadorCuentaController.procesaCambios(req, res, next)
})

liquidacionesRouter.post('/descuentoPorDeudaAnterior', [authMiddleware.verifyToken, authMiddleware.hasGroup('Administrativo')], async (req, res, next) => {
    await descuentoPorDeudaAnteriorController.procesaCambios(req, res, next)
})

liquidacionesRouter.post('/descuentos', [authMiddleware.verifyToken, authMiddleware.hasGroup('Administrativo')], async (req, res, next) => {
    await descuentosController.procesaCambios(req, res, next)
})

liquidacionesRouter.post('/movimientoAcreditacionEnCuenta', [authMiddleware.verifyToken, authMiddleware.hasGroup('Administrativo')], async (req, res, next) => {
    await movimientoAcreditacionEnCuentaController.procesaCambios(req, res, next)
})

liquidacionesRouter.get("/cols", authMiddleware.verifyToken, (req, res) => {
    liquidacionesController.getLiquidacionesCols(req, res);
});

liquidacionesRouter.post('/list', authMiddleware.verifyToken, (req, res, next) => {
    liquidacionesController.getByLiquidaciones(req, res, next)
});

// seccion de banco
liquidacionesRouter.get("/banco/cols", authMiddleware.verifyToken, (req, res) => {
    liquidacionesBancoController.getLiquidacionesBancoCols(req, res);
});

liquidacionesRouter.post('/banco/list', authMiddleware.verifyToken, (req, res, next) => {
    liquidacionesBancoController.getByLiquidacionesBanco(req, res, next)
});

liquidacionesRouter.post( "/download/comprobantes_filtrados/",
    authMiddleware.verifyToken,
    (req, res, next) => {
        liquidacionesBancoController.handleDownloadComprobantesByFiltro(req, res, next);
    }
);


