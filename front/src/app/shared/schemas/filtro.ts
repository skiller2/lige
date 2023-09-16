export interface Filtro {
  index: string;
  operador: string;
  condition: string;
  valor: string[];
}

export interface Sort {
  index: string;
  operador: string;
}

export interface Options {
  filtros: Filtro[];
  sort: Sort | null;
}
