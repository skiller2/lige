export interface SearchTipoAsociadoCategoria {
    TipoAsociadoId: number,
    CategoriaPersonalId: number,
    id: string,
    Label: string
}

export interface ResponseBySearchTipoAsociadoCategoria {
    recordsArray: Array<SearchTipoAsociadoCategoria>
}

