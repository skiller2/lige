import { Request, Router, request, response } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { fileUploadController } from "../controller/controller.module";
import multer, { FileFilterCallback } from "multer";
import { existsSync, mkdirSync } from "fs";
import { ClientException } from "../controller/baseController";
import { tmpName } from "../server";


type DestinationCallback = (error: Error | null, destination: string) => void;

let dirtmp = `${process.env.PATH_DOCUMENTS}/temp`;
console.log(".... dirtmp ", dirtmp)
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

export const FileUploadRouter = Router();

FileUploadRouter.post("/downloadFile", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Licencias'])], async (req, res, next) => {
  await fileUploadController.getByDownloadFile(req, res, next);
});

FileUploadRouter.get('/archivos_anteriores/:id/:TipoSearch/:keyField', (req, res, next) => {
  fileUploadController.getArchivosAnteriores(req.params.id, req.params.TipoSearch, req.params.keyField ,req, res, next)
});

FileUploadRouter.post("/upload", authMiddleware.verifyToken, (req, res, next) => {
  
  uploadPdf(req, res, (err) => {
    
    
    //FILE SIZE ERROR
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




