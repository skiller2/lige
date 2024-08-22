
export interface SearchAdmind {
    AdministradorId: number,
    AdministradorApellidoNombre: string
}

export interface ResponseBySearchAdministrador {
    recordsArray: Array<SearchAdmind>
}
