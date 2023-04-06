import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DownloadService {

  constructor() { }

  private downloadURL(data: string, fileName: string) {
    const a = document.createElement('a')
    a.href = data
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
