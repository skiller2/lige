export interface ResponseByID {
    PersonalId: number,
    PersonalCUITCUILCUIT: number,
    DocumentoImagenFotoBlobNombreArchivo: string,
    image: string
}

export interface ResponseBySearch {
    recordsArray: Array<Search>

}

interface Search {
    PersonalId: number,
    fullName: string
}