import { Router } from "express";
import { impuestosAfipController } from "../controller/controller.module";

export const impuestosAfipRouter = Router();

impuestosAfipRouter.get("/download/:PersonalId/:anio/:mes/:name",
  (req, res, next) => {
     impuestosAfipController.downloadComprobante(req, res, next);
});
