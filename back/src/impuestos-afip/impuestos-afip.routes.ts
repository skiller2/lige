import { Request, Router } from "express";
import { authMiddleware } from "../middlewares/middleware.module";
import { impuestosAfipController } from "../controller/controller.module";
import multer, { FileFilterCallback } from "multer";
import { existsSync, mkdirSync } from "fs";

type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

const dir = "./uploads/impuestos_afip/";
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    callback: DestinationCallback
  ) => {
    callback(null, dir);
  },

  filename: (
    req: Request,
    file: Express.Multer.File,
    callback: DestinationCallback
  ) => {
    const fileName = `${file.originalname}`;
    callback(null, fileName);
  },
});

const fileFilter = (
  request: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void => {
  if (
    file.mimetype === "application/pdf"
    // true
  ) {
    callback(null, true);
  } else {
    callback(null, false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });
// const upload = multer({ dest: "uploads/" });
export const impuestosAfipRouter = Router();

impuestosAfipRouter.post(
  "",
  authMiddleware.verifyToken,
  upload.single("pdf"),
  (req, res) => {
    console.log(req);
    impuestosAfipController.handlePDFUpload(req.file, res);
  }
);
