import { WritableSignal } from '@angular/core';

export interface Filtro {
  index: string;
  operador: string;
  condition: string;
  valor: any[];
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

export interface Field {
  searchComponent: string;
  name: string;
  type: string;
  searchType: string;
}

export interface Selections {
  index: string;
  condition: string;
  operator: string;
  value: any;
  label?: string;
  closeable?: boolean;
  originIdx?: number|null;
}
