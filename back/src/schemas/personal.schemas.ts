
export interface ResponseByID {
    PersonalId: number,
    PersonalApellido:string,
    PersonalNombre:string,
    PersonalCUITCUILCUIT: string,
    DocumentoImagenFotoBlobNombreArchivo: string,
    image: string,
    NRO_EMPRESA: string,
    DNI: string,
    Categoria: string,
    FechaDesde: Date,
    FechaHasta: Date
}

export interface ResponseBySearch {
    recordsArray: Array<Search>

}

interface Search {
    PersonalId: number,
    fullName: string
}