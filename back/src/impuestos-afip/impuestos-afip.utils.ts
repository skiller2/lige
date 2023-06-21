import { Request } from "express";

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
  if (!periodo.year) throw new Error("Faltó indicar el anio.");
  if (!periodo.month) throw new Error("Faltó indicar el mes.");
  return periodo;
};

export { getPeriodoFromRequest };
