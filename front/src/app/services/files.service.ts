import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FilesService {

  constructor() { }
  getArrayBufferFromFile(file: File) {
    return new Promise<any>((res, rej) => {
      const reader = new FileReader()
  
      reader.onload = (event) => {
        res(event.target?.result)
      }
      reader.readAsArrayBuffer(file)

    })

    // reader.readAsArrayBuffer(file)
  }
}
