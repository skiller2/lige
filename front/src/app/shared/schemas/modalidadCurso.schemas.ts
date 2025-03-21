
export interface SearchModalidadCurso {
    ModalidadCursoCodigo: number,
    ModalidadCursoModalidad: string
}

export interface ResponseBySearchModalidadCurso {
    recordsArray: Array<SearchModalidadCurso>
}
