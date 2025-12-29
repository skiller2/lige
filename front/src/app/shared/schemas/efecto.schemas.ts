export interface SearchEfecto {
    EfectoId: number,
    EfectoDescripcion: string
}

export interface ResponseBySearchEfecto {
    recordsArray: Array<SearchEfecto>
}

export interface SearchEfectoIndividual {
    EfectoEfectoIndividualId: number,
    EfectoEfectoIndividualDescripcion: string
}

export interface ResponseBySearchEfectoIndividual {
    recordsArray: Array<SearchEfectoIndividual>
}