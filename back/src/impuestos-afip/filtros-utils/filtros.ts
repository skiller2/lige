import { log } from "console";
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

  let rowFilterString: String[]=[]
  filtros.forEach((filtro, index) => {
    if (!isFiltro(filtro)) return;

    const columna = findColumnByIndex(filtro.index, cols);
    const fieldName = columna ? columna.fieldName : null;
    const type = String((columna?.searchType) ? columna.searchType : ((columna?.type) ? columna.type : 'string')).toLowerCase();
    if (!fieldName) return;

    if (!isCondition(filtro.condition)) return;

    let filterString: String[]=[]

    for (const valorBusqueda of filtro.valor) {
      switch (filtro.operador) {
        case "LIKE":
          if (fieldName === "ApellidoNombre")
            filterString.push(` (per.PersonalNombre LIKE '%${valorBusqueda}%' OR per.PersonalApellido LIKE '%${valorBusqueda}%')`)
          else if (fieldName === "ApellidoNombreJ")
            filterString.push(` (perjer.PersonalNombre LIKE '%${valorBusqueda}%' OR perjer.PersonalApellido LIKE '%${valorBusqueda}%')`)
          else if(type == 'date'){
            const valor = valorBusqueda.split('/').reverse().join('/');
            filterString.push(`${fieldName} >= '${valor} 00:00:00' AND ${fieldName} <= '${valor} 23:59:59'`)
          }else {
            filterString.push(`${fieldName} LIKE '%${valorBusqueda}%'`)
          }
          break;
        case "=":
          if (type == 'number' || type=='float' || type=='currency') {
            if (valorBusqueda == '' || valorBusqueda == null || valorBusqueda == 'null')
              filterString.push(`${fieldName} IS NULL`)
            else {
              if (String(valorBusqueda).indexOf(';') == 0)
                filterString.push(`${fieldName} = ${valorBusqueda}`)
              else 
                filterString.push(`${fieldName} IN (${String(valorBusqueda).replaceAll(';',',')})`)
            }
          }else if(type == 'date'){
                const valor = valorBusqueda.split('/').reverse().join('/');
                filterString.push(`${fieldName} >= '${valor} 00:00:00' AND ${fieldName} <= '${valor} 23:59:59'`)
          } else
            filterString.push(`${fieldName} = '${valorBusqueda}'`)

          break;
        case ">":
          if(type == 'date'){
            const valor = valorBusqueda.split('/').reverse().join('/');
            filterString.push(`${fieldName} ${filtro.operador} '${valor} 23:59:59'`)
            break;
          }
        case "<":
          if(type == 'date'){
            const valor = valorBusqueda.split('/').reverse().join('/');
            filterString.push(`${fieldName} ${filtro.operador} '${valor} 00:00:00'`)
            break;
          }
        case ">=":
          if(type == 'date'){
            const valor = valorBusqueda.split('/').reverse().join('/');
            filterString.push(`${fieldName} ${filtro.operador} '${valor} 00:00:00'`)
            break;
          }
        case "<=":
          if(type == 'date'){
            const valor = valorBusqueda.split('/').reverse().join('/');
            filterString.push(`${fieldName} ${filtro.operador} '${valor} 23:59:59'`)
            break;
          }
        case "<>":
          if (type == 'number' || type == 'float' || type=='currency') {
            const valor = (!isNaN(parseFloat(valorBusqueda))) ? parseFloat(valorBusqueda) : '0';
            filterString.push(`${fieldName} ${filtro.operador} ${valor}`)
          }else if(type == 'date'){
            const valor = valorBusqueda.split('/').reverse().join('/');
            filterString.push(`${fieldName} < '${valor} 00:00:00' AND ${fieldName} > '${valor} 23:59:59`)
          }else {
            filterString.push(`${fieldName} ${filtro.operador} '${valorBusqueda}'`)
          }

          break;
        default:
          break;
      }
    }

    if (filterString.length>0)
      rowFilterString.push(' ('+filterString.join((filtro.operador=="<>")?' AND ':' OR ')+') ')
  });

  let returnedString = rowFilterString.join(" AND ");

  if (returnedString.trim() == "")
    returnedString = "1=1"
  return returnedString;
};

const getOptionsFromRequest = (req: Request): Options => {
  const _options = req.body.options;
  if (!isOptions(_options)) throw new ClientException("Bad Input. Options");
  _options.filtros = getFiltrosFromOptions(_options);
  _options.extra = req.body.options.extra
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
