import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DownloadService {

  constructor() { }

  private downloadURL(data: string, fileName: string) {
    const a = document.createElement('a')
//    a.textContent = "Descarga"
    a.href = data
//    a.href = "http://localhost:4200/api/impuestos_afip/2023/3/20423130416/17226"
    a.download = fileName
    document.body.appendChild(a)
    a.style.display = 'none'
    a.click()
    a.remove()
  }
  
  downloadBlob(data: BlobPart, fileName: string, mimeType: string) {
  
    const blob = new Blob([data], {
      type: mimeType
    })
  
    const url = window.URL.createObjectURL(blob)
  
    this.downloadURL(url, fileName)
  
    setTimeout(() => window.URL.revokeObjectURL(url), 1000)
  }

}
