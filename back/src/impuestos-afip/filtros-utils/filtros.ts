import { Options } from "body-parser";
import { Filtro } from "src/schemas/filtro";
import { findColumnByIndex, listaColumnas } from "../comprobantes-utils/lista";

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
  condition === "AND" || condition === "OR";

const filtrosToSql = (filtros: Filtro[]): string => {
  if (filtros.length === 0) return "1=1";

  let returnedString = "";
  filtros.forEach((filtro, index) => {
    if (!isFiltro(filtro)) return;

    const columna = findColumnByIndex(filtro.index, listaColumnas);
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
  console.log(returnedString);

  return returnedString;
};

export { filtrosToSql, isCondition, isFiltro, isOptions };
