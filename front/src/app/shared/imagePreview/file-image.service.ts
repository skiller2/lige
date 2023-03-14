import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs'
@Injectable({
  providedIn: 'root'
})
export class FileImageService {
  $currentFile: BehaviorSubject<File | undefined> = new BehaviorSubject<File | undefined>(undefined);
  $currentImageData: BehaviorSubject< HTMLImageElement | undefined> = new BehaviorSubject< HTMLImageElement | undefined>(undefined)
  constructor() { }

  updateFile(newFile: File) {
    this.$currentFile.next(newFile)
    this.readFile(this.$currentFile.value!)
  }

  readFile(file: File) {
    if (file.type && !file.type.startsWith('image/')){
      console.log('File is not an image', file.type, file)
      return;
    }

    const reader = new FileReader()

    reader.onload = (event) => {
      const image = new Image()
      const data = event.target?.result


      if (data && typeof data === 'string'){
          image.src = data
          image.onload = () => {
            this.$currentImageData.next(image)
       }
      }
    }
    reader.readAsDataURL(file)
    // reader.readAsArrayBuffer(file)
  }

  dataURLtoFile(dataurl: string, filename: string) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)![1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, {type:mime});
    }
    
}
