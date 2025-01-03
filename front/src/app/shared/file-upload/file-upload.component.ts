import { Component, EventEmitter, forwardRef, inject, Input, input, model, output, Output, signal, SimpleChanges, ViewChild, viewChild } from '@angular/core';
import { BehaviorSubject, debounceTime, firstValueFrom, noop, switchMap } from 'rxjs';
import { SHARED_IMPORTS } from '@shared';
import { ApiService } from 'src/app/services/api.service';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { CommonModule } from '@angular/common';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { pdfDefaultOptions } from 'ngx-extended-pdf-viewer';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { HttpClient } from '@angular/common/http';
import { NzImageModule } from 'ng-zorro-antd/image';


@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [SHARED_IMPORTS, NzUploadModule, CommonModule, NgxExtendedPdfViewerModule, NzImageModule],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.less',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileUploadComponent),
      multi: true
    },
  ],
})
export class FileUploadComponent implements ControlValueAccessor {
  public src = signal<Blob>(new Blob())
  private readonly http = inject(HttpClient);

  constructor() {
    pdfDefaultOptions.assetsFolder = 'assets/bleeding-edge'

  };

  uploading$ = new BehaviorSubject({ loading: false, event: null });
  private apiService = inject(ApiService)
  ArchivosAdd: any[] = []
  // valueFile = input()
  files = signal<any[]>([])
  private notification = inject(NzNotificationService)
  ArchivoIdForDelete = 0
  keyField = input("")
  idForSearh = input(0)
  textForSearch = input("")
  tableForSearch = input("")
  dataBaseForSearch = input("")
  modalViewerVisiable = signal(false)
  blobUrl = ""
  Fullpath = signal("")
  FileName = signal("")
  fileAccept = input("")

  // valueExtended = input()
  // valueExtendedEmitter = output<[]>();

  formChange$ = new BehaviorSubject('');

  $formChange = new BehaviorSubject('');
  $files = this.formChange$.pipe(
    debounceTime(500),
    switchMap(() => {
      // console.log('input');
      // console.log(this.keyField(), this.idForSearh(), this.textForSearch(), this.tableForSearch(), this.tableForSearch(), this.dataBaseForSearch());

      if (this.idForSearh() > 0 && this.textForSearch() != "" && this.tableForSearch() != "" && this.dataBaseForSearch() != "") {
        this.files.set([])
        return this.apiService.getArchivosAnteriores(this.idForSearh(), this.textForSearch(), this.keyField(), this.tableForSearch(), this.dataBaseForSearch())
      } else {
        return []
      }

    })
  )

  ngOnChanges(changes: SimpleChanges) {
    if (changes['idForSearh']) {
      this.formChange$.next('');
    }
  }

  async LoadArchivo(documentId: any, filename: any) {

    this.modalViewerVisiable.set(false)

    const res = await this.LoadArchivoPreview(documentId, filename)
    this.src.set(res)
    this.FileName.set(filename)
    this.modalViewerVisiable.set(true)
  }

  async LoadArchivoPreview(documentId: any, filename: any) {
    const res = await firstValueFrom(this.http.post('api/file-upload/downloadFile',
      { 'documentId': documentId, filename: filename, tableForSearch: this.tableForSearch(), dataBaseForSearch: this.dataBaseForSearch() }, { responseType: 'blob' }
    ))
    return res
  }



  async uploadChange(event: any) {
    switch (event.type) {
      case 'start':

        this.uploading$.next({ loading: true, event })

        break;
      case 'progress':
        //debugger
        break;
      case 'error':
        const Error = event.file.error
        if (Error.error.data?.list) {
        }
        this.uploading$.next({ loading: false, event })
        break;
      case 'success':

        const Response = event.file.response
        var url = await this.triggerFunction(Response.data[0].fieldname, Response.data[0].mimetype)
        Response.data[0].fileUrl = url
        this.files.set([...this.files(), Response.data[0]])
        this.uploading$.next({ loading: false, event })
        this.apiService.response(Response)
        console.log("files ", this.files())
        // this.valueExtendedEmitter
        this.propagateChange(this.files())

        break
      default:
        break;
    }

  }


  async triggerFunction(fieldname: any, mimetype: any) {

    let src = await this.LoadArchivoPreview(0, `${fieldname}.${mimetype.split("/")[1]}`)
    this.blobUrl = await URL.createObjectURL(src)
    return this.blobUrl

  }

  async confirmDeleteArchivo(id: string, tipoDocumentDelete: boolean) {
    try {

      this.ArchivoIdForDelete = parseInt(id);
      if (tipoDocumentDelete) {

        const ArchivoFilter = this.files().filter((item) => item.fieldname === this.ArchivoIdForDelete)
        this.files.set(ArchivoFilter)
        this.notification.success('Respuesta', `Archivo borrado con exito `)

      } else {

        await firstValueFrom(this.apiService.deleteArchivosLicencias(this.ArchivoIdForDelete))
        this.formChange$.next('');
      }


    } catch (error) {

    }
  }
  ////////

  ngOnDestroy() {
    this.files().forEach(file => {
      if (file.fileUrl) {
        URL.revokeObjectURL(file.fileUrl)
      }
    })
  }

  private propagateChange: (_: any) => void = noop

  registerOnChange(fn: any) {
    this.propagateChange = fn
  }

  registerOnTouched(fn: any) {

  }

  writeValue(value: any) {
  }

  ///



  handleCancel(): void {
    this.modalViewerVisiable.set(false)
  }



}

