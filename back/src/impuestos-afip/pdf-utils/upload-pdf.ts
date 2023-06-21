import { Request } from "express";

interface Params {
  file: Express.Multer.File;
  yearFromRequest: number;
  monthFromRequest: number;
  importeFromRequest: any;
  cuitFromRequest: any;
}

const getParams = (request: Request): Params => {
  return {
    file: request.file,
    yearFromRequest: request.body.anio,
    monthFromRequest: request.body.mes,
    importeFromRequest: request.body.monto,
    cuitFromRequest: request.body.cuit,
  };
};

/**
 * @throws {Error}
 */
const checkDateRequest = (year, month) => {
  if (!year) throw new Error("Faltó indicar el anio.");
  if (!month) throw new Error("Faltó indicar el mes.");
};

export { getParams, checkDateRequest };
