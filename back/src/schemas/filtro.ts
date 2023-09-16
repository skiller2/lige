export interface Filtro {
  index: string;
  operador: "FIND" | "LIKE" | "<" | ">" | "=" | ">=" | "<=" | "<>";
  condition: "OR" | "AND";
  valor: string[];
}

export interface CustomSort {
  fieldName: string;
  direction: "ASC" | "DES";
}

export interface Options {
  filtros: Filtro[];
  sort: CustomSort[] | null;
}
