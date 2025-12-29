export interface SearchEfecto {
    EfectoId: number,
    EfectoDescripcion: string
}

export interface ResponseBySearchEfecto {
    recordsArray: Array<SearchEfecto>
}
