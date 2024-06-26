import { Request, Router, request, response } from "express"
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

function generateRandomDigitNumber() {

  let randomNumber = Math.random();
  randomNumber *= Math.pow(10, 15);
  randomNumber = Math.floor(randomNumber);

  if (randomNumber < Math.pow(10, 14)) {
    randomNumber += Math.pow(10, 14);
  }

  return randomNumber;
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
      
      const originalname = generateRandomDigitNumber();
      file.fieldname = originalname.toString()
      
      //const originalname = file.uid;
      console.log(file)
      callback(null, `${originalname}.pdf`);
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

CargaLicenciaCargaRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], (req, res) => {
  cargaLicenciaController.getGridCols(req, res);
});


CargaLicenciaCargaRouter.post("/list", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], (req, res, next) => {
    cargaLicenciaController.list(req, res, next);
});

CargaLicenciaCargaRouter.post("/listhoras", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], (req, res, next) => {
    cargaLicenciaController.listHoras(req, res, next);
});

CargaLicenciaCargaRouter.get("/:anio/:mes/:PersonalId/:PersonalLicenciaId", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], (req, res, next) => {
    cargaLicenciaController.getLicencia(req, res, next);
});
  
CargaLicenciaCargaRouter.post("/", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], (req, res, next) => {
  cargaLicenciaController.setLicencia(req, res, next);
});

CargaLicenciaCargaRouter.post('/changehours', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], (req, res, next) => {
  cargaLicenciaController.changehours(req, res, next);
})

CargaLicenciaCargaRouter.delete("/", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], (req, res, next) => {
  cargaLicenciaController.deleteLincencia(req, res, next);
});

CargaLicenciaCargaRouter.get('/licencia_anteriores/:anio/:mes/:PersonalId/:PersonalLicenciaId', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], (req, res, next) => {
  cargaLicenciaController.getLicenciaAnteriores(req.params.anio, req.params.mes, req.params.PersonalId, req.params.PersonalLicenciaId, req, res, next)
});

CargaLicenciaCargaRouter.post("/downloadLicencia", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], async (req, res, next) => {
  await cargaLicenciaController.getByDownLicencia(req, res, next);
});


CargaLicenciaCargaRouter.post("/upload", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], (req, res, next) => {
  
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
    }else{
      return res
        .status(200)
        .json({ msg: "archivo subido con exito!", data: [req.file], stamp: new Date() });
    }

    
  });
});




