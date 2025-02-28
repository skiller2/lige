
export interface SearchSeguro {
    SeguroId: string,
    SeguroDescripcion: string
}

export interface ResponseBySearchSeguro {
    recordsArray: Array<SearchSeguro>
}
