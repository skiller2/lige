
export interface SearchClient {
    ClienteId: number,
    ClienteDenominacion: string
}

export interface ResponseBySearchCliente {
    recordsArray: Array<SearchClient>
}
