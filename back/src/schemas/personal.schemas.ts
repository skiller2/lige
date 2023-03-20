
export interface ResponseByID {
    PersonalId: number,
    PersonalCUITCUILCUIT: string,
    DocumentoImagenFotoBlobNombreArchivo: string,
    image: string,
    NRO_EMPRESA: string
}

export interface ResponseBySearch {
    recordsArray: Array<Search>

}

interface Search {
    PersonalId: number,
    fullName: string
}