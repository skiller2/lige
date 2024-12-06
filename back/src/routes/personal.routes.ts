import { Request, Router } from "express";
import { personalController } from "../controller/controller.module";
import { authMiddleware } from "../middlewares/middleware.module";
import multer, { FileFilterCallback } from "multer";
import { existsSync, mkdirSync } from "fs";
import { ClientException } from "../controller/baseController";

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
      console.log('REQ: ',req);
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
      callback(null, `${originalname}.jpg`);
    },
  });
  
  const fileFilterJpg = (
    request: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback
  ): void => {

    if (file.mimetype !== "image/jpeg") {
      callback(new ClientException("El archivo no es del tipo JPG."));
      return;
    }

    callback(null, true);
  };
  
  const uploadJpg = multer({
    storage: storage,
    fileFilter: fileFilterJpg,
  }).single("jpg");

export const personalRouter = Router();
const base = "";

personalRouter.get(`${base}/domicilio/:id`, authMiddleware.verifyToken, (req, res, next) => {
  personalController.getDomicilioByPersonalId(req, res, next);
});
personalRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Administrativo'])], (req, res, next) => {
  personalController.getGridList(req, res, next)
});
personalRouter.post('/deleteArchivo', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Administrativo'])], (req, res, next) => {
  personalController.deleteArchivo(req, res, next)
});
personalRouter.post("/upload", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Administrativo'])], (req, res, next) => {
  
  uploadJpg(req, res, (err) => {
    
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

personalRouter.post(
  `${base}/search`,
  authMiddleware.verifyToken,
  (req, res, next) => {
    personalController.search(req, res, next);
  }
);

personalRouter.post(`${base}/add`, authMiddleware.verifyToken, (req, res, next) => {
  personalController.addPersonal(req, res, next);
});

personalRouter.post(`${base}/update/:id`, authMiddleware.verifyToken, (req, res, next) => {
  personalController.updatePersonal(req, res, next);
});

personalRouter.get(`${base}/info/:id`, authMiddleware.verifyToken, (req, res, next) => {
  personalController.getFormDataById(req, res, next);
});

personalRouter.get(`/nacionalidad/options`, authMiddleware.verifyToken, (req, res, next) => {
  personalController.getNacionalidadList(req, res, next);
});

personalRouter.get('/sitrevista/options', authMiddleware.verifyToken, (req, res, next) => {
  personalController.getSituacionRevista(req, res, next)
});

personalRouter.get('/cols', authMiddleware.verifyToken, (req, res, next) => {
  personalController.getGridColumns(req, res, next)
});

personalRouter.get(`${base}/telefonos/:id`, authMiddleware.verifyToken, (req, res, next) => {
  //personalRouter.get(`${base}/:id`,  (req, res) => {
  personalController.getTelefonosPorPersona(req.params.id, res, next);
});

personalRouter.get(`${base}/banco/:id`, authMiddleware.verifyToken, (req, res, next) => {
  //personalRouter.get(`${base}/:id`,  (req, res) => {
  personalController.getCuentasBancoPorPersona(req.params.id, res, next);
});

personalRouter.get(`${base}/downloadImagen/:personalId`, (req, res,next) => {
  personalController.downloadPersonaImagen(
    Number(req.params.personalId),
    res,
    next
  );
});


personalRouter.get(
  `${base}/responsables/:personalId/:anio/:mes`,
  authMiddleware.verifyToken,
  (req, res, next) => {
    personalController.getPersonalResponsables(req, res, next);
  }
);

personalRouter.get(
  `${base}/sitrevista/:personalId/:anio/:mes`,
  authMiddleware.verifyToken,
  (req, res, next) => {
    personalController.getPersonalSitRevista(req, res, next);
  }
);

personalRouter.get(
  `${base}/monotributo/:personalId/:anio/:mes`,
  authMiddleware.verifyToken,
  (req, res, next) => {
    personalController.getPersonalMonotributo(req, res, next);
  }
);

personalRouter.get(`${base}/name/:personalId`, authMiddleware.verifyToken, (req, res, next) => {
  personalController.getNameFromId(req.params.personalId, res, next);
});

personalRouter.get(`${base}/:id`, authMiddleware.verifyToken, (req, res, next) => {
  personalController.getById(req.params.id, res, next);
});