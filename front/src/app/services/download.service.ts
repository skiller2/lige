import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import saveAs from 'file-saver';
import { finalize } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DownloadService {
  readonly error: EventEmitter<any>;
  readonly success: EventEmitter<any>;
  fileName: string 

  constructor(public _http: HttpClient) {
    this.error = new EventEmitter();
    this.success = new EventEmitter();
    this.fileName = ''
  }


//  constructor() { }

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

  getDisposition(data: string | null) {
    const arr = (data || '')
      .split(';')
      .filter(i => i.includes('='))
      .map(v => {
        const strArr = v.split('=');
        const utfId = `UTF-8''`;
        let value = strArr[1];
        if (value.startsWith(utfId))
          value = value.substring(utfId.length);
        return { [strArr[0].trim()]: value };
      });
    return (arr.reduce((_o, item) => item, {}));
  }

  downloadFile(httpMethod: string, httpUrl: string, httpData: any, httpBody: any) {

    this._http
      .request(httpMethod, httpUrl, {
        params: httpData || {},
        responseType: 'blob',
        observe: 'response',
        body: httpBody
      })
      .pipe(finalize(() => { }))
      .subscribe({
        next: (res) => {
          if (res.status !== 200 || res.body!.size <= 0) {
            this.error.emit(res);
            return;
          }
          const disposition = this.getDisposition(res.headers.get('content-disposition'));
          let fileName = this.fileName;
          const newfileName =
            fileName ||
            disposition[`filename*`] ||
            disposition[`filename`] ||
            res.headers.get('filename') ||
            res.headers.get('x-filename')

          saveAs(res.body!, decodeURI(String(newfileName).replace(/['"]+/g, '')));
          this.success.emit(res);
        },
        error: err => this.error.emit(err)
      });
  }

}
