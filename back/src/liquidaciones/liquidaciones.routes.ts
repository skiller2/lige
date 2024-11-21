import { Request, Router } from "express"
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
import multer, { FileFilterCallback } from "multer";
import { existsSync, mkdirSync } from "fs";
import { tmpName } from "../server";
import { ClientException } from "../controller/baseController";
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { ok } from "assert";


type DestinationCallback = (error: Error | null, destination: string) => void;


const dirtmp = `${process.env.PATH_TELEFONIA}/temp`;
if (!existsSync(dirtmp)) {
  mkdirSync(dirtmp, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    callback: DestinationCallback
  ) => {
    return callback(null, dirtmp);
  },

  filename: (
    req: Request,
    file: Express.Multer.File,
    callback: DestinationCallback
  ) => {
    const fileName = tmpName(dirtmp);
    callback(null, fileName);
  },
});

const fileFilterXLS = (
  request: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void => {
  if (file.mimetype != "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
    callback(new ClientException("El archivo no es del tipo planilla xls."));
    return;
  }
  if (request.body.tipocuenta == "") {
    callback(new ClientException("No se especificó el tipo de cuenta."));
    return;
  }
  if (request.body.movimiento == "") {
    callback(new ClientException("No se especificó el movimiento."));
    return;
  }
  callback(null, true);
};

const uploadXLS = multer({
  storage: storage,
  fileFilter: fileFilterXLS,
  limits: { fileSize: 100 * 1000 * 1000 },
}).single("xls");


export const liquidacionesRouter = Router();


liquidacionesRouter.post('/movimientosAutomaticos', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], async (req, res, next) => {
  await movimientosAutomaticosController.procesaCambios(req, res, next)
})

liquidacionesRouter.post('/ingresoPorAsistencia', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], async (req, res, next) => {
  await ingresoPorAsistenciaController.procesaCambios(req, res, next)
})

liquidacionesRouter.post('/ingresoPorAsistenciaAdministrativosArt42', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], async (req, res, next) => {
  ingresoAsistenciaAdministrativosArt42Controller.procesaCambios(req, res, next)
})

liquidacionesRouter.post('/ingresosCoordinadorDeCuenta', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], async (req, res, next) => {
  await ingresoCoordinadorCuentaController.procesaCambios(req, res, next)
})

liquidacionesRouter.post('/descuentoPorDeudaAnterior', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], async (req, res, next) => {
  await descuentoPorDeudaAnteriorController.procesaCambios(req, res, next)
})

liquidacionesRouter.post('/confirmaMovimientosBanco', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], async (req, res, next) => {
  await liquidacionesBancoController.confirmaMovimientosBanco(req, res, next)
})

liquidacionesRouter.post('/descuentos', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], async (req, res, next) => {
  await descuentosController.procesaCambios(req, res, next)
})

liquidacionesRouter.post('/movimientoAcreditacionEnCuenta', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], async (req, res, next) => {
  await movimientoAcreditacionEnCuentaController.procesaCambios(req, res, next)
})

liquidacionesRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res) => {
  liquidacionesController.getLiquidacionesCols(req, res);
});

liquidacionesRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => {
  liquidacionesController.getByLiquidaciones(req, res, next)
});

liquidacionesRouter.post('/add', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => {
  liquidacionesController.setAgregarRegistros(req, res, next)
});

liquidacionesRouter.post('/delete', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => {
  liquidacionesController.setDeleteImportaciones(req, res, next)
});


liquidacionesRouter.get('/tipo_movimiento/:TipoMovimiento', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => {
  liquidacionesController.getTipoMovimiento(req, res, next)
});

liquidacionesRouter.get('/tipo_movimiento_by_id/:TipoMovimiento', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => {
  liquidacionesController.getTipoMovimientoById(req, res, next)
});

liquidacionesRouter.get('/tipo_cuenta', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => {
  liquidacionesController.getTipoCuenta(req, res, next)
});

liquidacionesRouter.get('/importaciones_anteriores/:anio/:mes', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => {
  liquidacionesController.getImportacionesAnteriores(req.params.anio, req.params.mes, req, res, next)
});

// seccion de banco
liquidacionesRouter.get("/banco/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res) => {
  liquidacionesBancoController.getLiquidacionesBancoCols(req, res);
});

liquidacionesRouter.get("/banco/movimientospendientes", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res) => {
  liquidacionesBancoController.getLiquidacionesBancoMovimientosPendientesCols(req, res);
});

liquidacionesRouter.get("/banco/ayuda/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res) => {
  liquidacionesBancoController.getLiquidacionesBancoColsAyuda(req, res);
});

liquidacionesRouter.post('/banco/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => {
  liquidacionesBancoController.getByLiquidacionesBanco(req, res, next)
});

liquidacionesRouter.post('/banco/listMovimientos', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => {
  liquidacionesBancoController.getByMovimientos(req, res, next)
});

liquidacionesRouter.post("/download/banco/", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])],
  (req, res, next) => {
    liquidacionesBancoController.downloadArchivoBanco(req, res, next);
  }
);

liquidacionesRouter.post("/elimina/banco/", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])],
  (req, res, next) => {
    liquidacionesBancoController.eliminaMovimientosBanco(req, res, next);
  }
);

liquidacionesRouter.post('/deleteMovimiento', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => {
  liquidacionesBancoController.setDeleteMovimiento(req, res, next)
});

// ayuda asistencial

liquidacionesRouter.post('/banco/listAyudaAsistencial', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => {
  liquidacionesBancoController.getByLiquidacionesBancoAyudaAsistencial(req, res, next)
});


liquidacionesRouter.post("/upload", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => {
  uploadXLS(req, res, (err) => {


    // FILE SIZE ERROR
    if (err instanceof multer.MulterError) {
      return res.status(409).json({
        msg: "Max file size 100MB allowed!",
        data: [],
        stamp: new Date(),
      });
    }

    // INVALID FILE TYPE, message will return from fileFilter callback
    else if (err) {
      return res
        .status(409)
        .json({ msg: err.message, data: [], stamp: new Date() });
    }

    // FILE NOT SELECTED
    else if (!req.file) {
      return res
        .status(409)
        .json({ msg: "File is required!", data: [], stamp: new Date() });
    }

    // SUCCESS
    else {
      liquidacionesController.handleXLSUpload(req, res, next);
    }
  });
});


liquidacionesRouter.post("/downloadImportacion", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], async (req, res, next) => {
  await liquidacionesController.getByDownloadDocument(req, res, next);
});

liquidacionesRouter.post("/banco/procesacbu", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], async (req, res, next) => {
  await liquidacionesController.procesaCBU(req, res, next);
});

liquidacionesRouter.post("/periodo",  async (req, res, next) => {
  await liquidacionesController.getPeriodoStatus(req, res, next);
});








