import { Request, Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { cargaLicenciaController } from "../controller/controller.module";
import multer, { FileFilterCallback } from "multer";
import { existsSync, mkdirSync } from "fs";
import { ClientException } from "../controller/baseController";
import { tmpName } from "../server";


type DestinationCallback = (error: Error | null, destination: string) => void;

const dirtmp = `${process.env.PATH_LICENCIA}/temp`;

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
     
      const originalname = file.originalname;
      callback(null, originalname);
    },
  });
  
  const fileFilterPdf = (
    request: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback
  ): void => {
    if (file.mimetype !== "application/pdf") {
      callback(new ClientException("El archivo no es del tipo PDF."));
      return;
    }
    callback(null, true);
  };
  
  const uploadPdf = multer({
    storage: storage,
    fileFilter: fileFilterPdf,
  }).single("pdf");

export const CargaLicenciaCargaRouter = Router();

CargaLicenciaCargaRouter.get("/cols", authMiddleware.verifyToken, (req, res) => {
  cargaLicenciaController.getGridCols(req, res);
  });

CargaLicenciaCargaRouter.post("/list", authMiddleware.verifyToken, (req, res, next) => {
    cargaLicenciaController.list(req, res, next);
  });

CargaLicenciaCargaRouter.get("/:anio/:mes/:PersonalId/:PersonalLicenciaId", authMiddleware.verifyToken, (req, res, next) => {
    cargaLicenciaController.getLicencia(req, res, next);
});
  
CargaLicenciaCargaRouter.post("/", authMiddleware.verifyToken, (req, res, next) => {
  cargaLicenciaController.setLicencia(req, res, next);
});

CargaLicenciaCargaRouter.delete("/", authMiddleware.verifyToken, (req, res, next) => {
  cargaLicenciaController.deleteLincencia(req, res, next);
});

CargaLicenciaCargaRouter.get('/licencia_anteriores/:anio/:mes/:PersonalId/:PersonalLicenciaId', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => {
  cargaLicenciaController.getLicenciaAnteriores(req.params.anio, req.params.mes, req.params.PersonalId, req.params.PersonalLicenciaId, req, res, next)
});

CargaLicenciaCargaRouter.post("/downloadLicencia", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], async (req, res, next) => {
  await cargaLicenciaController.getByDownLicencia(req, res, next);
});

CargaLicenciaCargaRouter.post("/upload", authMiddleware.verifyToken, (req, res, next) => {
  uploadPdf(req, res, (err) => {

    
  
    // FILE SIZE ERROR
    if (err instanceof multer.MulterError) {
      return res.status(409).json({
        msg: "Max file size 100MB allowed!",
        data: [],
        stamp: new Date(),
      });
    }

    else if (err) {
      return res
        .status(409)
        .json({ msg: err.message, data: [], stamp: new Date() });
    }

    else if (!req.file) {
      return res
        .status(409)
        .json({ msg: "File is required!", data: [], stamp: new Date() });
    }

    else {
      cargaLicenciaController.handlePDFUpload(req, res, next);
    }
  });
});


