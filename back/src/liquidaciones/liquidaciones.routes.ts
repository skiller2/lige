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

liquidacionesRouter.post('/movimientosAutomaticos', [authMiddleware.verifyToken, authMiddleware.hasGroup('Liquidaciones')], async (req, res, next) => {
    await movimientosAutomaticosController.procesaCambios(req, res, next)
})

liquidacionesRouter.post('/ingresoPorAsistencia', [authMiddleware.verifyToken, authMiddleware.hasGroup('Liquidaciones')], async (req, res, next) => {
    await ingresoPorAsistenciaController.procesaCambios(req, res, next)
})

liquidacionesRouter.post('/ingresoPorAsistenciaAdministrativosArt42', [authMiddleware.verifyToken, authMiddleware.hasGroup('Liquidaciones')], async (req, res, next) => {
    ingresoAsistenciaAdministrativosArt42Controller.procesaCambios(req, res, next)
})

liquidacionesRouter.post('/ingresosCoordinadorDeCuenta', [authMiddleware.verifyToken, authMiddleware.hasGroup('Liquidaciones')], async (req, res, next) => {
    await ingresoCoordinadorCuentaController.procesaCambios(req, res, next)
})

liquidacionesRouter.post('/descuentoPorDeudaAnterior', [authMiddleware.verifyToken, authMiddleware.hasGroup('Liquidaciones')], async (req, res, next) => {
    await descuentoPorDeudaAnteriorController.procesaCambios(req, res, next)
})

liquidacionesRouter.post('/confirmaMovimientosBanco', [authMiddleware.verifyToken, authMiddleware.hasGroup('Liquidaciones')], async (req, res, next) => {
    await liquidacionesBancoController.confirmaMovimientosBanco(req, res, next)
})

liquidacionesRouter.post('/descuentos', [authMiddleware.verifyToken, authMiddleware.hasGroup('Liquidaciones')], async (req, res, next) => {
    await descuentosController.procesaCambios(req, res, next)
})

liquidacionesRouter.post('/movimientoAcreditacionEnCuenta', [authMiddleware.verifyToken, authMiddleware.hasGroup('Liquidaciones')], async (req, res, next) => {
    await movimientoAcreditacionEnCuentaController.procesaCambios(req, res, next)
})

liquidacionesRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup('Liquidaciones')], (req, res) => {
    liquidacionesController.getLiquidacionesCols(req, res);
});

liquidacionesRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup('Liquidaciones')], (req, res, next) => {
    liquidacionesController.getByLiquidaciones(req, res, next)
});

liquidacionesRouter.post('/add', [authMiddleware.verifyToken, authMiddleware.hasGroup('Liquidaciones')], (req, res, next) => {
    liquidacionesController.setAgregarRegistros(req, res, next)
});

liquidacionesRouter.get('/tipo_movimiento', authMiddleware.verifyToken, (req, res, next) => {
    liquidacionesController.getTipoMovimiento(req, res, next)
});

liquidacionesRouter.get('/tipo_cuenta', authMiddleware.verifyToken, (req, res, next) => {
    liquidacionesController.getTipoCuenta(req, res, next)
});

// seccion de banco
liquidacionesRouter.get("/banco/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup('Liquidaciones')], (req, res) => {
    liquidacionesBancoController.getLiquidacionesBancoCols(req, res);
});

liquidacionesRouter.get("/banco/ayuda/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup('Liquidaciones')], (req, res) => {
    liquidacionesBancoController.getLiquidacionesBancoColsAyuda(req, res);
});

liquidacionesRouter.post('/banco/list', [authMiddleware.verifyToken, authMiddleware.hasGroup('Liquidaciones')], (req, res, next) => {
    liquidacionesBancoController.getByLiquidacionesBanco(req, res, next)
});

liquidacionesRouter.post( "/download/banco/",
    authMiddleware.verifyToken,
    (req, res, next) => {
        liquidacionesBancoController.downloadArchivoBanco(req, res, next);
    }
);

// ayuda asistencial

liquidacionesRouter.post('/banco/listAyudaAsistencial', [authMiddleware.verifyToken, authMiddleware.hasGroup('Liquidaciones')], (req, res, next) => {
    liquidacionesBancoController.getByLiquidacionesBancoAyudaAsistencial(req, res, next)
});


