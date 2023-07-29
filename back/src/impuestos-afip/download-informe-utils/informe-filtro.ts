import { Request } from "express";
import { ClientException } from "../../controller/baseController";

interface InformeFiltro {
  index: string;
  value: string;
}

const ListaIndex = ["Cliente", "Objetivo", "Responsable"];

const getFiltroFromRequest = (req: Request): InformeFiltro => {
  const _filtro = req.body.filtro;
  if (!_filtro) throw new ClientException("Falta indicar el filtro!");
  if (!_filtro.index && typeof _filtro.index !== "string")
    throw new ClientException("Bad input! Index.");
  if (!_filtro.value && typeof _filtro.value !== "string")
    throw new ClientException("Bad input! Value.");

  return _filtro;
};

export { getFiltroFromRequest };
