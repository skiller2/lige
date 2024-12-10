import { Request, Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { telefoniaController } from "../controller/controller.module";
import multer, { FileFilterCallback } from "multer";
import { existsSync, mkdirSync } from "fs";
import { tmpName } from "../server";
import { ClientException } from "../controller/baseController";

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
  

export const telefoniaRouter = Router();

telefoniaRouter.get(`/lugar/options`, authMiddleware.verifyToken, (req, res, next) => {
  telefoniaController.getLugarTelefono(req, res, next);
});
telefoniaRouter.get('/tipo/options', authMiddleware.verifyToken, (req, res, next) => {
  telefoniaController.getTipoTelefono(req, res, next)
});

/*
telefoniaRouter.post('', authMiddleware.verifyToken, (req, res, next) => {
    telefoniaController.setAdelanto(req.body.PersonalId, req.body.monto, req.socket.remoteAddress, res, next)
})
*/

telefoniaRouter.get("/cols", authMiddleware.verifyToken, (req, res) => {
    telefoniaController.getTelefonosCols(req, res);
});

telefoniaRouter.get("/download/:anio/:mes/:impoexpoId?", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res,next) => {
  telefoniaController.downloadComprobantes(
    req.params.anio,
    req.params.mes,
    req.params.impoexpoId,
    res,
    req,
    next
  );
});

telefoniaRouter.post("/list", [authMiddleware.verifyToken,authMiddleware.hasGroup(['liquidaciones','administrativo'])], (req, res, next) => {
    telefoniaController.getTelefonosList(req, res, next);
});

telefoniaRouter.get('/importaciones_anteriores/:anio/:mes', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => {
  telefoniaController.getImportacionesTelefoniaAnteriores(req.params.anio, req.params.mes, req, res, next)
});

telefoniaRouter.post("/upload", [authMiddleware.verifyToken,authMiddleware.hasGroup(['liquidaciones','administrativo'])], (req, res, next) => {
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
        telefoniaController.handleXLSUpload(req, res, next);
      }
    });
  });
  