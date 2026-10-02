import { ClientException } from "../../controller/base.controller.ts";
import type { CustomSort,Filtro,Options } from "../../schemas/filtro.ts";
import { findColumnByIndex } from "../comprobantes-utils/lista.ts";
import type { Request } from "express";

const getOptionsSINO: any[] = [
    { label: 'No', value: '0' },
    { label: 'Si', value: '1' },
]


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

// Escapa comillas simples para literales T-SQL
const sqlStr = (valor: any): string => String(valor).replaceAll("'", "''");

// Convierte a número o rechaza el filtro
const sqlNum = (valor: any, columna: any): number => {
  if (typeof valor === 'boolean') return valor ? 1 : 0;
  const txt = String(valor).trim().replaceAll(',', '.');
  const num = Number(txt);
  if (txt === '' || !Number.isFinite(num))
    throw new ClientException(`Valor inválido en filtro '${columna?.name ?? columna?.id}': ${valor}`);
  return num;
};


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

    if (type === 'columncomparison') {
      const compareFieldName = columna?.compareFieldName;
      const allowedOperators = ['=', '>', '<', '>=', '<='];
      if (compareFieldName && allowedOperators.includes(filtro.operador))
        rowFilterString.push(` (${fieldName} ${filtro.operador} ${compareFieldName}) `);
      return;
    }

    let filterString: String[]=[]

    for (let valorBusqueda of filtro.valor) {

      // Filtro compuesto de Efecto: { EfectoId, EfectoEfectoIndividualId }.
      // Se detecta por la forma del valor (la columna sigue siendo type: 'number').
      const vbAny: any = valorBusqueda;
      if (
        vbAny && typeof vbAny === 'object' && !(vbAny instanceof Date)
        && Object.prototype.hasOwnProperty.call(vbAny, 'EfectoId')
      ) {
        const efectoId = vbAny.EfectoId;
        const indivId = vbAny.EfectoEfectoIndividualId;
        if (efectoId === null || efectoId === undefined || efectoId === '') continue;
        // Derivamos el fieldName del individual asumiendo mismo alias (stk.EfectoId -> stk.EfectoEfectoIndividualId)
        const indivFieldName = String(fieldName).replace(/EfectoId$/, 'EfectoEfectoIndividualId');
        const indivPart = (indivId === null || indivId === undefined || indivId === '')
          ? `${indivFieldName} IS NULL`
          : `${indivFieldName} = ${Number(indivId)}`;
        filterString.push(`(${fieldName} = ${Number(efectoId)} AND ${indivPart})`);
        continue;
      }

      if (type == 'date' && filtro.operador!="RAW") {
        const valtmp = new Date(valorBusqueda)
        if (isNaN(valtmp.getTime()))
          throw new ClientException(`Fecha inválida en filtro '${columna?.name ?? columna?.id}': ${valorBusqueda}`)
        valtmp.setHours(0, 0, 0, 0)
        valorBusqueda = valtmp.toISOString().split('T')[0]
      }
//        valorBusqueda = valorBusqueda.split('/').reverse().join('/');

      switch (filtro.operador) {
        case "LIKE":
          if (fieldName === "ApellidoNombre")
            filterString.push(` (per.PersonalNombre LIKE '%${sqlStr(valorBusqueda)}%' OR per.PersonalApellido LIKE '%${sqlStr(valorBusqueda)}%')`)
          else if (fieldName === "ApellidoNombreJ")
            filterString.push(` (perjer.PersonalNombre LIKE '%${sqlStr(valorBusqueda)}%' OR perjer.PersonalApellido LIKE '%${sqlStr(valorBusqueda)}%')`)
          else if(type == 'date'){
            const valor = valorBusqueda.split('/').reverse().join('/');
            filterString.push(`${fieldName} >= '${valor} 00:00:00' AND ${fieldName} <= '${valor} 23:59:59'`)
          } else {
            if (String(valorBusqueda).indexOf(';') == -1)
              filterString.push(`${fieldName} LIKE '%${sqlStr(valorBusqueda)}%'`)
            else {
              const vals = String(valorBusqueda).split(';')
              for (const val of vals)
              filterString.push(`${fieldName} LIKE '%${sqlStr(val.trim())}%'`)
            }
          }
          break;
        case "RAW":
          filterString.push(`${valorBusqueda}`)
          break;
        case "=":
          if (type == 'number' || type == 'float' || type == 'currency') {
            if (valorBusqueda === '' || valorBusqueda === null || valorBusqueda === 'null')
              filterString.push(`${fieldName} IS NULL`)
            else {
              const nums = String(valorBusqueda).split(';').filter(v => v.trim() !== '').map(v => sqlNum(v, columna))
              if (nums.length == 0)
                throw new ClientException(`Valor inválido en filtro '${columna?.name ?? columna?.id}': ${valorBusqueda}`)
              if (nums.length == 1)
                filterString.push(`${fieldName} = ${nums[0]}`)
              else
                filterString.push(`${fieldName} IN (${nums.join(',')})`)
            }
          } else if (type == 'date') {
            filterString.push(`(${fieldName} >= '${valorBusqueda} 00:00:00' AND ${fieldName} <= '${valorBusqueda} 23:59:59') `)
          } else if ((type == 'string' || type == 'text') && (valorBusqueda === 'null' || valorBusqueda == null))
            filterString.push(`${fieldName} IS NULL`)
          else {
            const vals =String(valorBusqueda).split(';').map(value => value.trim());
            // Si el campo es CategoriaCod y el valor contiene "/", usar CHARINDEX en lugar de IN
            if (fieldName.includes('CategoriaCod') && vals.some(v => v.includes('/'))) {
              const charIndexConditions = vals.map(v => `CHARINDEX('${sqlStr(v)}', ${fieldName}) > 0`).join(' OR ');
              filterString.push(`(${charIndexConditions})`)
            } else {
              filterString.push(`${fieldName} IN ('${vals.map(sqlStr).join('\',\'')}')`)
            }
          }
          break;
        case ">":
          if(type == 'date'){
            filterString.push(`(${fieldName} ${filtro.operador} '${valorBusqueda} 23:59:59' OR ${fieldName} IS NULL)`)
            break;
          }
        case "<":
          if(type == 'date'){
            filterString.push(`(${fieldName} ${filtro.operador} '${valorBusqueda} 00:00:00' OR ${fieldName} IS NULL)`)
            break;
          }
        case ">=":
          if(type == 'date'){
            filterString.push(`(${fieldName} ${filtro.operador} '${valorBusqueda} 00:00:00' OR ${fieldName} IS NULL)`)
            break;
          }
        case "<=":
          if(type == 'date'){
            filterString.push(`(${fieldName} ${filtro.operador} '${valorBusqueda} 23:59:59' OR ${fieldName} IS NULL)`)
            break;
          }
        case "<>":
          if (type == 'number' || type == 'float' || type=='currency') {
            filterString.push(`${fieldName} ${filtro.operador} ${sqlNum(valorBusqueda, columna)}`)
          }else if(type == 'date'){
            filterString.push(`${fieldName} < '${valorBusqueda} 00:00:00' AND ${fieldName} > '${valorBusqueda} 23:59:59`)
          }else {
            filterString.push(`${fieldName} ${filtro.operador} '${sqlStr(valorBusqueda)}'`)
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
  if (!(s && s.length)) return ''
  return 'ORDER BY ' + s.map(x => {
    // Solo nombres de columna (alias.Campo) y dirección ASC/DESC
    const fieldName = String(x?.fieldName ?? '')
    const direction = String(x?.direction ?? '').toUpperCase()
    if (!/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)?$/.test(fieldName))
      throw new ClientException(`Orden inválido: ${fieldName}`)
    if (!['', 'ASC', 'DESC'].includes(direction))
      throw new ClientException(`Dirección de orden inválida: ${x?.direction}`)
    return `${fieldName} ${direction}`
  }).join(',')
};



export {
  getOptionsFromRequest,
  filtrosToSql,
  isCondition,
  isFiltro,
  isOptions,
  orderToSQL,
  getOptionsSINO
};
