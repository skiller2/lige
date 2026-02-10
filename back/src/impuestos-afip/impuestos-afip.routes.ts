import { Router } from "express";
import type { Request } from "express";
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { impuestosAfipController } from "../controller/controller.module.ts";
import multer from "multer";
import type { FileFilterCallback } from "multer";

import { existsSync, mkdirSync } from "fs";
import { tmpName } from "../server.ts";

type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

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

impuestosAfipRouter.post("", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Administrativo'])], (req, res, next) => {
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
      impuestosAfipController.handlePDFUpload(req, res, next, false);
    }
  });
});
impuestosAfipRouter.post("/forzado", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Administrativo'])], (req, res, next) => {
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
      impuestosAfipController.handlePDFUpload(req, res, next, true);
    }
  });
});

impuestosAfipRouter.get("/download/:anio/:mes/:personalIdRel?",authMiddleware.verifyToken, (req, res,next) => {
  impuestosAfipController.downloadComprobantesByPeriodo(
    req.params.anio,
    req.params.mes,
    req.params.personalIdRel,
    res,
    next
  );
});

impuestosAfipRouter.get("/downloadF184/:personalId?", authMiddleware.verifyToken,(req, res,next) => {
  impuestosAfipController.downloadPersonaF184(
    Number(req.params.personalId),
    res,
    next
  );
});

impuestosAfipRouter.get("/documento/download/:id", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Administrativo'])],(req, res, next) => {
  impuestosAfipController.downloadImpuestoAFIP(req, res, next);
});

impuestosAfipRouter.get(
  "/:anio/:mes/:personalIdRel?",
  authMiddleware.verifyToken,
  (req, res, next) => {
    impuestosAfipController.handleGetDescuentos(req, res,next);
  }
);

impuestosAfipRouter.post(
  "/download/comprobantes_filtrados/",
  authMiddleware.verifyToken,
  (req, res, next) => {
    impuestosAfipController.handleDownloadComprobantesByFiltro(req, res,next);
  }
);

impuestosAfipRouter.get(
  "/:anio/:mes/:CUIT/:PersonalId",
  authMiddleware.verifyToken,
  (req, res, next) => {
    impuestosAfipController.downloadComprobante(
      req.params.anio,
      req.params.mes,
      req.params.CUIT,
      req.params.PersonalId,
      res,
      next
    );
  }
);

impuestosAfipRouter.get("/cols", authMiddleware.verifyToken, (req, res) => {
  impuestosAfipController.getDescuentosGridCols(req, res);
});

impuestosAfipRouter.post("/list", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Administrativo','responsables'])], (req, res, next) => {
  impuestosAfipController.getDescuentosGridList(req, res, next);
});

