
export interface SearchRubro {
    RubroClienteId: number,
    RubroClienteDescripcion: string
}

export interface ResponseBySearchRubro {
    recordsArray: Array<SearchRubro>
}
