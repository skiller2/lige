import { Router } from "express";
import { asistenciaController } from "../controller/controller.module.ts";

export const asistenciaRouter = Router();
const base = "";

// Verificación facial del agente de asistencia: las llama back (registro-asistencia), sin login
asistenciaRouter.get(`${base}/verificacion/:token`, [], (req, res, next) => {
  asistenciaController.getVerificacion(req, res, next);
});

asistenciaRouter.post(`${base}/verificacion`, [], (req, res, next) => {
  asistenciaController.setResultadoVerificacion(req, res, next);
});
