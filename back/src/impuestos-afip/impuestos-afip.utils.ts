import { Request, Response } from "express";
import { unlinkSync, writeFileSync } from "fs";
import { tmpName } from "../server.ts";
import { ClientException } from "../controller/basecontroller.ts";

interface Periodo {
  year: number;
  month: number;
}
/**
 * @throws {Error}
 */
const getPeriodoFromRequest = (req: Request): Periodo => {
  const periodo: Periodo = {
    year: req.body.anio,
    month: req.body.mes,
  };
  if (!periodo.year) throw new ClientException("Faltó indicar el año");
  if (!periodo.month) throw new ClientException("Faltó indicar el mes");
  return periodo;
};

export { getPeriodoFromRequest };
