export interface Filtro {
  index: string;
  operador: string;
  condition: string;
  valor: string[];
  tagName: string;
  closeable: boolean
}

export interface Sort {
  index: string;
  operador: string;
}

export interface Options {
  filtros: Filtro[];
  sort: Sort | null;
}
