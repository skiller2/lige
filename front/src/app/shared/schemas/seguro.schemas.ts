
export interface SearchSeguro {
    TipoSeguroCodigo: string,
    TipoSeguroNombre: string
}

export interface ResponseBySearchSeguro {
    recordsArray: Array<SearchSeguro>
}
