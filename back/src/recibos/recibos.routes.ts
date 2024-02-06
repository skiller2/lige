import { Request, Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import {
  liquidacionesController,
  recibosController
} from "../controller/controller.module";
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


export const recibosRouter = Router();

recibosRouter.post("/download/recibos/", [authMiddleware.verifyToken, authMiddleware.hasGroup('Liquidaciones')],
  (req, res, next) => {
    recibosController.downloadArchivoRecibo(req, res, next);
  }
);





