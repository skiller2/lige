import { Request, Router, request, response } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { fileUploadController } from "../controller/controller.module";
import multer, { FileFilterCallback } from "multer";
import { existsSync, mkdirSync } from "fs";
import { ClientException } from "../controller/baseController";
import { tmpName } from "../server";


type DestinationCallback = (error: Error | null, destination: string) => void;

let dirtmp = `${process.env.PATH_DOCUMENTS}/temp`;
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
    let type = file.mimetype.split("/")[1]
    if (type == "vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      type = "xlsx"
    callback(null, `${originalname}.${type}`);
  },
});

const fileFilterPdf = (
  request: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void => {
  const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    callback(new ClientException(`El archivo no es del tipo seleccionado, ${file.mimetype}`));
    return;
  }

  callback(null, true);
};

const uploadPdf = multer({
  storage: storage,
  fileFilter: fileFilterPdf,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB en bytes
}).single("pdf");

export const FileUploadRouter = Router();

FileUploadRouter.get("/downloadFile/:id/:tableForSearch/:filename", authMiddleware.verifyToken, async (req, res, next) => {
  await fileUploadController.getByDownloadFile(req, res, next);
});

//Se agrego para solucionar un tema puntual en la descarga de imágenes de los procesos de credencuales, pero no deberían existir
FileUploadRouter.get("/downloadImg/:id/:tableForSearch/:filename",  async (req, res, next) => {
  await fileUploadController.getByDownloadFile(req, res, next);
});

FileUploadRouter.get('/select_tipo_in_file', (req, res, next) => {
  fileUploadController.getSelectTipoinFile(req, res, next)
});

FileUploadRouter.get('/archivos_anteriores/:id/:TipoSearch/:columnForSearch/:tableForSearch', (req, res, next) => {
  fileUploadController.getArchivosAnteriores(req, res, next)
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
    } else {
    
      const fileData = {
        url: `/api/file-upload/downloadFile/${req.file.filename}/temp/original`,
        tempfilename: req.file.filename,
        fieldname: req.file.fieldname,   
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
        size: req.file.size,
      }

      console.log('fileData', fileData)

      return res
        .status(200)
        .json({ msg: "archivo subido con exito!", data: [fileData], stamp: new Date() });
    }


  });
});

FileUploadRouter.delete("/deleteImage", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], async (req, res, next) => {
  await fileUploadController.deleteImage(req, res, next);
});



