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
  }
  getDataURlFromFile(file: File) {
    return new Promise<any>((res, rej) => {
      const reader = new FileReader()
  
      reader.onload = (event) => {
        res(event.target?.result)
      }
      reader.readAsDataURL(file)

    })
  }

  private dataURLtoFile(dataurl: string, filename: string) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)![1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, {type:mime});
    }
}
