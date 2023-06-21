import { Request, Router } from "express";
import { authMiddleware } from "../middlewares/middleware.module";
import { impuestosAfipController } from "../controller/controller.module";
import multer, { FileFilterCallback } from "multer";
import { existsSync, mkdirSync } from "fs";
import { tmpName } from "../server";

type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

const dirtmp = `${process.env.PATH_MONOTRIBUTO}/temp`;
if (!existsSync(dirtmp)) {
  mkdirSync(dirtmp, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    callback: DestinationCallback
  ) => {
    callback(null, dirtmp);
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

const fileFilter = (
  request: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void => {
  if (file.mimetype !== "application/pdf") {
    callback(null, false);
    return;
  }
  if (request.body.anio == "") {
    callback(new Error("No se especificó un año."));
    return;
  }
  if (request.body.mes == "") {
    callback(new Error("No se especificó un mes."));
    return;
  }
  callback(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1000 * 1000 },
}).single("pdf");

export const impuestosAfipRouter = Router();

impuestosAfipRouter.post("", authMiddleware.verifyToken, (req, res) => {
  upload(req, res, (err) => {
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
      impuestosAfipController.handlePDFUpload(req, res, false);
    }
  });
});
impuestosAfipRouter.post("/forzado", authMiddleware.verifyToken, (req, res) => {
  upload(req, res, (err) => {
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
      impuestosAfipController.handlePDFUpload(req, res, true);
    }
  });
});

impuestosAfipRouter.get("/download/:anio/:mes/:personalIdRel?", (req, res) => {
  impuestosAfipController.downloadComprobantesByPeriodo(
    req.params.anio,
    req.params.mes,
    req.params.personalIdRel,
    res
  );
});

impuestosAfipRouter.get(
  "/:anio/:mes/:personalIdRel?",
  authMiddleware.verifyToken,
  (req, res) => {
    impuestosAfipController.handleGetDescuentos(req, res);
  }
);

impuestosAfipRouter.post("/download_comprobantes/", authMiddleware.verifyToken);

impuestosAfipRouter.get(
  "/:anio/:mes/:CUIT/:PersonalId",
  authMiddleware.verifyToken,
  (req, res) => {
    impuestosAfipController.downloadComprobante(
      req.params.anio,
      req.params.mes,
      req.params.CUIT,
      req.params.PersonalId,
      res
    );
  }
);

impuestosAfipRouter.get("/cols", authMiddleware.verifyToken, (req, res) => {
  impuestosAfipController.getDescuentosGridCols(req, res);
});

impuestosAfipRouter.post("/list", authMiddleware.verifyToken, (req, res) => {
  impuestosAfipController.getDescuentosGridList(req, res);
});

impuestosAfipRouter.post(
  "/download_filtro/",
  authMiddleware.verifyToken,
  impuestosAfipController.handleDownloadInformeByFiltro
);
