
export interface PersonaObj {
    PersonalId: number,
    PersonalApellido:string,
    PersonalNombre:string,
    PersonalCUITCUILCUIT: string,
    DocumentoImagenFotoBlobNombreArchivo: string,
    PersonalFotoId: number,
    image: string,
    NRO_EMPRESA: string,
    DNI: string,
    CategoriaPersonalDescripcion: string,
    FechaDesde: Date,
    FechaHasta: Date,
    Faltantes:boolean
}

export interface Search {
    PersonalId: number,
    fullName: string
}

export interface ResponseBySearch {
    recordsArray: Array<Search>
}
