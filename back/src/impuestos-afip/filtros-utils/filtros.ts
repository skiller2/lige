import { Filtro, Options } from "../../schemas/filtro";
import { findColumnByIndex } from "../comprobantes-utils/lista";
import { Request } from "express";

const getFiltrosFromOptions = (options: Options) => {
  const filtrosToReturn = [];
  options.filtros.forEach((filtro) => {
    if (!isFiltro(filtro)) return;
    filtrosToReturn.push(filtro);
  });
  return filtrosToReturn;
};
const isFiltro = (filtro: any): filtro is Filtro => {
  if (
    !filtro ||
    !filtro.index ||
    !filtro.operador ||
    !filtro.condition ||
    !filtro.valor
  )
    return false;
  return (
    "index" in filtro &&
    "operador" in filtro &&
    "condition" in filtro &&
    "valor" in filtro
  );
};

const isOptions = (options: any): options is Options => {
  if (!options) return false;

  return "filtros" in options && "sort" in options;
};

const isCondition = (condition: any): boolean =>
  condition == "AND" || condition == "OR";


/**
 * 
 * @param filtros Objeto de Filtros entregado por el Front
 * @param cols Listado de campos para extraer el fieldname
 * @returns string con el filtro en formato SQL 
 */

const filtrosToSql = (filtros: Filtro[], cols: any[]): string => {
  if (filtros?.length === (0 || undefined)) return "1=1";

  let returnedString = "";
  filtros.forEach((filtro, index) => {
    if (!isFiltro(filtro)) return;

    const columna = findColumnByIndex(filtro.index, cols);
    const fieldName = columna ? columna.fieldName : null;

    if (!fieldName) return;

    if (!isCondition(filtro.condition)) return;

    let filterString;

    const condition = index === 0 ? "" : `${filtro.condition}`;

    switch (filtro.operador) {
      case "LIKE":
        if (fieldName === "ApellidoNombre")
          filterString = `${condition} (per.PersonalNombre LIKE '%${filtro.valor}%' OR per.PersonalApellido LIKE '%${filtro.valor}%')`;
        else if (fieldName === "ApellidoNombreJ")
          filterString = `${condition} (perjer.PersonalNombre LIKE '%${filtro.valor}%' OR perjer.PersonalApellido LIKE '%${filtro.valor}%')`;
        else
          filterString = `${condition} ${fieldName} LIKE '%${filtro.valor}%'`;
        break;
      case "=":
        filterString = `${condition} ${fieldName} = ${filtro.valor}`;
        break;
      case ">":
      case "<":
        const valor = parseFloat(filtro.valor);
        if (isNaN(valor)) return;
        filterString = `${condition} ${fieldName} ${filtro.operador} ${valor}`;
        break;
      default:
        break;
    }
    returnedString += " " + filterString;
  });
  if (returnedString.trim() == "")
    returnedString="1=1"
  return returnedString;
};

const getOptionsFromRequest = (req: Request): Options => {
  const _options = req.body.options;
  if (!isOptions(_options)) throw new Error("Bad Input. Options");
  _options.filtros = getFiltrosFromOptions(_options);
  return _options;
};

export {
  getOptionsFromRequest,
  filtrosToSql,
  isCondition,
  isFiltro,
  isOptions,
};
