
export interface SearchInasistencia {
    TipoInasistenciaId: number,
    TipoInasistenciaDescripcion: string
}

export interface ResponseBySearchInasistencia {
    recordsArray: Array<SearchInasistencia>
}
