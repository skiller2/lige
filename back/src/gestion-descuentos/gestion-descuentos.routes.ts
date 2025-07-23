import { Request, Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { gestionDescuentosController } from "../controller/controller.module";
import multer, { FileFilterCallback } from "multer";
import { existsSync, mkdirSync } from "fs";
import { tmpName } from "../server";
import { ClientException } from "../controller/baseController";

type DestinationCallback = (error: Error | null, destination: string) => void;

const dirtmp = `${process.env.PATH_DOCUMENTS}/temp`;
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
    if (request.body.anio == "") {
      callback(new ClientException("No se especificó un año."));
      return;
    }
    if (request.body.mes == "") {
      callback(new ClientException("No se especificó un mes."));
      return;
    }
    callback(null, true);
  };

const uploadXLS = multer({
    storage: storage,
    fileFilter: fileFilterXLS,
    limits: { fileSize: 100 * 1000 * 1000 },
  }).single("xls");

export const gestionDescuentosRouter = Router();

gestionDescuentosRouter.get("/cols/personal", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getPersonalGridColumns(req, res, next);
});

gestionDescuentosRouter.get("/cols/objetivos", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getObjetivosGridColumns(req, res, next);
});

gestionDescuentosRouter.get("/tipo/options", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getTiposDescuentos(req, res, next);
});

gestionDescuentosRouter.post("/personal", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getDescuentosByPersonalId(req, res, next);
});

gestionDescuentosRouter.post('/list/personal', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getDescuentosPersonal(req, res, next)
});

gestionDescuentosRouter.post('/list/objetivos', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getDescuentosObjetivos(req, res, next)
});

gestionDescuentosRouter.post('/add', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.addDescuento(req, res, next)
});

gestionDescuentosRouter.post('/addcuota', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.addDescuentoCuotas(req, res, next)
});

gestionDescuentosRouter.post('/update', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.updateDescuento(req, res, next)
});

gestionDescuentosRouter.post('/cancellation/personal/', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.cancellationPersonalOtroDescuento(req, res, next)
});

gestionDescuentosRouter.post('/cancellation/objetivo/', [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.cancellationObjetivoDescuento(req, res, next)
});

gestionDescuentosRouter.post("/persona", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getDescuentoPersona(req, res, next);
});

gestionDescuentosRouter.post("/objetivo", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getDescuentoObjetivo(req, res, next);
});

gestionDescuentosRouter.get("/objetivo-descuento/options", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getDescuentoForObjetivo(req, res, next);
});

gestionDescuentosRouter.get("/personal-descuento/options", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getDescuentoForPersonal(req, res, next);
});

gestionDescuentosRouter.get("/tables", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getTableOptions(req, res, next);
});

gestionDescuentosRouter.get("/aplicaa/options", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    gestionDescuentosController.getAplicaAOptions(req, res, next);
});

gestionDescuentosRouter.post("/upload", [authMiddleware.verifyToken,authMiddleware.hasGroup(['liquidaciones','administrativo'])], (req, res, next) => {
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
        gestionDescuentosController.handleXLSUpload(req, res, next);
      }
    });
  });