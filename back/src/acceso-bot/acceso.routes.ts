import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { accesoBotController} from "../controller/controller.module";
import {  existsSync} from "fs";
export const accesoBotRouter = Router();


accesoBotRouter.get("/cols", authMiddleware.verifyToken, (req, res) => {
  accesoBotController.getGridCols(req, res);
});

accesoBotRouter.post('/list', authMiddleware.verifyToken, (req, res, next) => {
  accesoBotController.list(req, res, next)
})

accesoBotRouter.get("/:PersonalId", authMiddleware.verifyToken, (req, res, next) => {
  accesoBotController.getAccess(req, res, next);
});

accesoBotRouter.get("/dni/:PersonalId", authMiddleware.verifyToken, (req, res, next) => {
  accesoBotController.getAccessDni(req, res, next);
});

accesoBotRouter.delete("/:PersonalId", authMiddleware.verifyToken, (req, res, next) => {
  accesoBotController.deleteAccess(req, res, next);
});

accesoBotRouter.post('/', authMiddleware.verifyToken, (req, res, next) => { 
  accesoBotController.updateAcess(req, res, next)
} )

accesoBotRouter.post('/add', authMiddleware.verifyToken, (req, res, next) => { 
  accesoBotController.addAccess(req, res, next) 
} )

accesoBotRouter.get(`/downloadImagen/:personalId/:documentoImagenParametroId`, (req, res,next) => {
  accesoBotController.downloadImagen(
    req.params.personalId,
    Number(req.params.documentoImagenParametroId),
    res,
    next
  );
});

accesoBotRouter.get(`/downloadImagenDni/:path`, (req, res) => {
  const { path } = req.params;
  const filePath = `${process.env.PATH_DOCUMENTS}/temp/${path}`;

  console.log(".........", filePath);

  if (!existsSync(filePath)) {
    return res.status(404).send('Archivo no encontrado');
  }

  try {
    res.setHeader('Content-Type', 'application/octet-stream'); // Asegura el encabezado para descargas
    res.download(filePath, path, (err) => {
      if (err) {
        console.error('Error al descargar el archivo:', err);
        res.status(500).send('Error al procesar la descarga');
      } else {
        console.log('Archivo enviado con éxito');
      }
    });
  } catch (error) {
    console.error('Error en el servidor:', error);
    res.status(500).send('Error interno del servidor');
  }
});