
export interface SearchClient {
    ClienteId: number,
    ClienteApellidoNombre: string
}

export interface ResponseBySearchCliente {
    recordsArray: Array<SearchClient>
}
