export interface ResponseByID {
    PersonalId: number,
    PersonalCUITCUILCUIT: number,
    DocumentoImagenFotoBlobNombreArchivo: string,
    image: Blob
}

export interface ResponseBySearch {
    recordsArray: Array<Search>

}

export interface Search {
    PersonalId: number,
    fullName: string
}