import { Blob } from 'node-fetch'

export interface ResponseByID {
    PersonalId: number,
    PersonalCUITCUILCUIT: number,
    DocumentoImagenFotoBlobNombreArchivo: string,
    image: Blob
}

export interface ResponseBySearch {
    recordsArray: Array<Search>

}

interface Search {
    PersonalId: number,
    fullName: string
}