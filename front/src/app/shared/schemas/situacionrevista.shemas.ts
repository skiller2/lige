export interface SearchSituacionRevista {
    SituacionRevistaId: number,
    SituacionRevistaDescripcion: string
}

export interface ResponseBySearchSituacionRevista {
    recordsArray: Array<SearchSituacionRevista>
}
