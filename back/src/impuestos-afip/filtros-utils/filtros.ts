import { ClientException } from "../../controller/baseController";
import { CustomSort, Filtro, Options } from "../../schemas/filtro";
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
    !filtro.condition //||
    //  !filtro.valor
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
    const type = String((columna?.searchType) ? columna.searchType : ((columna?.type) ? columna.type : 'string')).toLowerCase();
    if (!fieldName) return;

    if (!isCondition(filtro.condition)) return;

    let filterString;

    const condition = index === 0 ? "" : `${filtro.condition}`;
    console.log("imprimo los filtros....", filtro)
    returnedString += ' ('
    for (const valorBusqueda in filtro.valor) {
      const valorBusqueda = filtro.valor[0]

      switch (filtro.operador) {
        case "LIKE":
          if (fieldName === "ApellidoNombre")
            filterString = `${condition} (per.PersonalNombre LIKE '%${valorBusqueda}%' OR per.PersonalApellido LIKE '%${valorBusqueda}%')`;
          else if (fieldName === "ApellidoNombreJ")
            filterString = `${condition} (perjer.PersonalNombre LIKE '%${valorBusqueda}%' OR perjer.PersonalApellido LIKE '%${valorBusqueda}%')`;
          else {
            filterString = `${condition} ${fieldName} LIKE '%${valorBusqueda}%'`;
          }
          break;
        case "=":
          if (type == 'number' || type=='float' || type=='currency') {
            if (valorBusqueda == '' || valorBusqueda == null || valorBusqueda == 'null')
              filterString = `${condition} ${fieldName} IS NULL`;
            else
              filterString = `${condition} ${fieldName} = ${filtro.valor}`;
          } else
            filterString = `${condition} ${fieldName} = '${filtro.valor}'`;

          break;
        case ">":
        case "<":
        case ">=":
        case "<=":
        case "<>":
          if (type == 'number' || type == 'float' || type=='currency') {
            const valor = (!isNaN(parseFloat(valorBusqueda))) ? parseFloat(valorBusqueda) : '0';
            filterString = `${condition} ${fieldName} ${filtro.operador} ${valor}`;
          } else {
            filterString = `${condition} ${fieldName} ${filtro.operador} '${valorBusqueda}'`
          }

          break;
        default:
          break;
      }

      if (filtro.operador!="<>")
        returnedString += " " + filterString + " OR ";
      else 
        returnedString += " " + filterString + " AND ";
    }
    returnedString += ' 1!=1) '
  });
  if (returnedString.trim() == "")
    returnedString = "1=1"
  return returnedString;
};

const getOptionsFromRequest = (req: Request): Options => {
  const _options = req.body.options;
  if (!isOptions(_options)) throw new ClientException("Bad Input. Options");
  _options.filtros = getFiltrosFromOptions(_options);
  return _options;
};

const orderToSQL = (s: CustomSort[]): String => {
  return (s && s.length) ? 'ORDER BY ' + s.map(x => `${x.fieldName} ${x.direction}`).join(',') : ''
};



export {
  getOptionsFromRequest,
  filtrosToSql,
  isCondition,
  isFiltro,
  isOptions,
  orderToSQL
};
