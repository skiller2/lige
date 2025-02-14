
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
    FechaHasta: Date
    mails: string[]
    estudios: string
}

export interface ResponseBySearch {
    recordsArray: Array<Search>

}

interface Search {
    PersonalId: number,
    fullName: string
}