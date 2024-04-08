import { Router } from "express";
import { impuestosAfipController } from "../controller/controller.module";

export const impuestosAfipRouter = Router();

// impuestosAfipRouter.get("/:anio/:mes/:CUIT/:PersonalId",
//   (req, res, next) => {
//     impuestosAfipController.downloadComprobante(req, res, next);
// });