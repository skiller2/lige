
export interface SearchEstudio {
    TipoEstudioId: number,
    TipoEstudioDescripcion: string
}

export interface ResponseBySearchEstudio {
    recordsArray: Array<SearchEstudio>
}
