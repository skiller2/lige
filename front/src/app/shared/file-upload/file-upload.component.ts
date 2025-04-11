import { Component, effect, EventEmitter, forwardRef, inject, Input, input, model, output, Output, signal, SimpleChanges, ViewChild, viewChild } from '@angular/core';
import { BehaviorSubject, debounceTime, firstValueFrom, noop, switchMap, map, of } from 'rxjs';
import { SHARED_IMPORTS } from '@shared';
import { ApiService } from 'src/app/services/api.service';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { CommonModule } from '@angular/common';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { pdfDefaultOptions } from 'ngx-extended-pdf-viewer';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { HttpClient } from '@angular/common/http';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-file-upload',
  imports: [SHARED_IMPORTS, NzUploadModule, CommonModule, NgxExtendedPdfViewerModule, NzImageModule, NzSelectModule, FormsModule],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.less',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileUploadComponent),
      multi: true
    },
  ]
})
export class FileUploadComponent implements ControlValueAccessor {
  public src = signal<Blob>(new Blob())
  private readonly http = inject(HttpClient);

  constructor() {
    pdfDefaultOptions.assetsFolder = 'assets/bleeding-edge'

    effect(async() => {
      const id = this.idForSearh();
      this.formChangeArchivos$.next('');
    });
  }
    

  uploading$ = new BehaviorSubject({ loading: false, event: null });
  private apiService = inject(ApiService)
  ArchivosAdd: any[] = []
  // valueFile = input()
  files = signal<any[]>([])
  prevFiles = output<any[]>()
  private notification = inject(NzNotificationService)
  ArchivoIdForDelete = 0
  idForSearh = input(0) 
  textForSearch = input("")
  columnForSearch = input("")
  tableForSearch = input("")

  modalViewerVisiable = signal(false)
  blobUrl = ""
  Fullpath = signal("")
  FileName = signal("")
  fileAccept = input("")
  cantFilesAnteriores = signal(0)
  cantMaxFiles = input(10)
  forceImg = input<boolean>(false)
  previewFile = input<boolean>(true)
  isDisabled = signal(false)

  formChangeArchivos$ = new BehaviorSubject('');

  selectedValue = null;
  tipoSelected = signal<string>("")
  textForSearchSelected = signal<string>("")

  $files = this.formChangeArchivos$.pipe(
    debounceTime(500),
    switchMap(() => {
      this.files.set([])

      if (this.idForSearh() > 0 && this.tipoSelected() != "" && this.tableForSearch() != "") {

        return this.apiService.getArchivosAnteriores(this.idForSearh(), this.tipoSelected(), this.columnForSearch(), this.tableForSearch()).pipe(
          map((list: any) => {
            this.cantFilesAnteriores.set(list.length)
            this.prevFiles.emit(list)

            return list
          }))
      } else {
        this.prevFiles.emit([])
        this.cantFilesAnteriores.set(0)
        return of([])
      }


    })
  )

  ngOnChanges(changes: SimpleChanges) {
    if (changes['idForSearh'] || changes['textForSearch'] || changes['columnForSearch'] || changes['tableForSearch']) {
      if (this.textForSearch() != "" && !this.textForSearch().includes(','))
        this.tipoSelected.set(this.textForSearch())
      this.formChangeArchivos$.next('');
    }
  }

  onChange(event: any) {
    this.tipoSelected.set(event)
    this.formChangeArchivos$.next('');
  }

  ngOnInit() {
    this.initializeDocumentTypes();
  }

  private initializeDocumentTypes() {
    if (this.textForSearch() === "") {
      this.loadDocumentTypesFromApi();
    } else {
      this.setDocumentTypesFromInput();
    }
  }

  private loadDocumentTypesFromApi() {
    this.apiService.getSelectTipoinFile().subscribe((res: any) => {
      const documentTypes = res.map((item: any) => item.detalle.trim()).join(',');
      this.textForSearchSelected.set(documentTypes);
    });
  }

  private setDocumentTypesFromInput() {
    this.textForSearchSelected.set(this.textForSearch());
    if (!this.textForSearchSelected().includes(',')) {
      this.tipoSelected.set(this.textForSearch());
    }
  }


  async LoadArchivo(documentId: any, tableForSearch: string, filename: string) {

    this.modalViewerVisiable.set(false)

    const res = await this.LoadArchivoPreview(documentId, tableForSearch)
    this.src.set(res)
    this.FileName.set(filename)
    this.modalViewerVisiable.set(true)
  }

  async LoadArchivoPreview(documentId: string, tableForSearch: string) {
    const res = await firstValueFrom(this.http.post(`api/file-upload/downloadFile/${documentId}/${tableForSearch}/original`, {}, { responseType: 'blob' }))
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

        let src = await this.LoadArchivoPreview(`${Response.data[0].fieldname}.${Response.data[0].mimetype.split("/")[1]}`, 'temp')
        this.blobUrl = URL.createObjectURL(src)
        Response.data[0].tableForSearch = this.tableForSearch()
        Response.data[0].doctipo_id = this.tipoSelected()
        Response.data[0].fileUrl = this.blobUrl
        this.files.set([...this.files(), Response.data[0]])
        this.uploading$.next({ loading: false, event })
        this.apiService.response(Response)
        // this.valueExtendedEmitter
        this.propagateChange(this.files())

        break
      default:
        break;
    }

  }

  async confirmDeleteArchivo(id: string, tipoDocumentDelete: boolean) {
    try {

      this.ArchivoIdForDelete = parseInt(id);
      if (tipoDocumentDelete) {

        const ArchivoFilter = this.files().filter((item) => item.fieldname === this.ArchivoIdForDelete)
        this.files.set(ArchivoFilter)
        this.notification.success('Respuesta', `Archivo borrado con exito `)

      } else {
        if (this.tableForSearch() == 'docgeneral') {
          await firstValueFrom(this.apiService.deleteArchivosLicencias(this.ArchivoIdForDelete))
        } else {
          await firstValueFrom(this.apiService.deleteArchivosImagen(this.ArchivoIdForDelete, this.tableForSearch()))
        }
        this.formChangeArchivos$.next('');
      }
      this.propagateChange(this.files())

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
    this.formChangeArchivos$.next('');

  }

  ///



  handleCancel(): void {
    this.modalViewerVisiable.set(false)
  }

  cantFiles(): boolean {
    if ((this.files().length + this.cantFilesAnteriores()) < this.cantMaxFiles())
      return true
    return false
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled)
  }


}
