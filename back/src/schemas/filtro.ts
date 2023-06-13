export interface Filtro {
  index: string;
  operador: "FIND" | "LIKE" | "<" | ">" | "=";
  condition: "OR" | "AND";
  valor: string;
}

export interface Sort {
  index: string;
  operador: "ASC" | "DES";
}

export interface Options {
  filtros: Filtro[];
  sort: Sort | null;
}
