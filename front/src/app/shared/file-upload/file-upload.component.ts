import { Component, computed, effect, EventEmitter, forwardRef, inject, Input, input, model, output, Output, signal, SimpleChanges, ViewChild, viewChild } from '@angular/core';
import { BehaviorSubject, debounceTime, firstValueFrom, noop, switchMap, map, of } from 'rxjs';
import { SHARED_IMPORTS } from '@shared';
import { ApiService } from '../../services/api.service';
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
import { FileSyncOutline } from '@ant-design/icons-angular/icons';
import { NzIconModule } from 'ng-zorro-antd/icon';
interface DocTipo {
  doctipo_id: string;
  detalle: string;
}

@Component({
  selector: 'app-file-upload',
  imports: [SHARED_IMPORTS, NzUploadModule, CommonModule, NgxExtendedPdfViewerModule, NzImageModule, NzSelectModule, FormsModule, NzIconModule],
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
/*
    effect(async() => {
      const id = this.idForSearh();
      const text = this.textForSearch();
      this.formChangeArchivos$.next('');
      this.initializeDocumentTypes();
    });
*/  

  }


  uploading$ = new BehaviorSubject({ loading: false, event: null });
  private apiService = inject(ApiService)
  ArchivosAdd: any[] = []
  // valueFile = input()
  files = model<any[]>([])
  prevFiles = output<any[]>()
  private notification = inject(NzNotificationService)
  ArchivoIdForDelete = 0
  
  idForSearh = input(0) 
  textForSearch = input("")
  columnForSearch = input("")
  tableForSearch = input("")
  showTipoDocs = input(false)

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
  docTiposValidos = signal<any[]>([])
  formChangeArchivos$ = new BehaviorSubject('');

  tipoSelected = signal<string>("")
  textForSearchSelected = signal<DocTipo[]>([])

  ngOnChanges(changes: SimpleChanges) {
    if (changes['idForSearh'] || changes['textForSearch'] || changes['columnForSearch'] || changes['tableForSearch']) {
      if (changes['textForSearch']) {
        //Parsear textForSearch y armar arreglo con los tipos de documento.
        this.docTiposValidos.set(this.textForSearch().split(','))
      }

      if (this.docTiposValidos().length==1)
        this.tipoSelected.set(this.docTiposValidos()[0])

      this.formChangeArchivos$.next('');
    }
  }

   async ngOnInit() {

    this.textForSearchSelected.set( await firstValueFrom(this.apiService.getSelectTipoinFile()))

    this.LoadArchivosAnteriores(this.idForSearh())

  }

  async LoadArchivosAnteriores(idForSearh: number) {

    if (this.docTiposValidos().length == 1) 
      this.tipoSelected.set(this.docTiposValidos()[0])

    if (idForSearh> 0 && this.tipoSelected() != "" && this.tableForSearch() != "") {

      const result = await firstValueFrom(this.apiService.getArchivosAnteriores(idForSearh, this.tipoSelected(), this.columnForSearch(), this.tableForSearch()))
      this.cantFilesAnteriores.set(result.length)
      this.prevFiles.emit(result)
      this.files.set(result)
      this.propagateChange(this.files())

    } else {
      this.prevFiles.emit([])
      this.cantFilesAnteriores.set(0)
      this.files.set([])
      this.propagateChange(this.files())
    }
  }

  async LoadArchivo(documentId: any, tableForSearch: string, filename: string) {

    this.modalViewerVisiable.set(false)

    const res = await this.LoadArchivoPreview(documentId, tableForSearch)
    this.src.set(res)
    this.FileName.set(filename)
    this.modalViewerVisiable.set(true)
  }

  async LoadNewArchivo(file:any) {

   
  }

  async LoadArchivoPreview(documentId: string, tableForSearch: string) {
    const res = await firstValueFrom(this.http.post(`api/file-upload/downloadFile/${documentId}/${tableForSearch}/original`, {}, { responseType: 'blob' }))
    return res
  }



  async uploadChange(event: any, file:any) {
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

        if(file){
        
          this.files.set(this.files().map(item => {
            if (item.id === file.id) {
              return { 
                ...item, 
                tempfilename: Response.data[0].tempfilename,
              };
            }
            return item;
          }));

        }else{
          let src = await this.LoadArchivoPreview(`${Response.data[0].fieldname}.${Response.data[0].mimetype.split("/")[1]}`, 'temp')
          this.blobUrl = URL.createObjectURL(src)
          Response.data[0].tableForSearch = this.tableForSearch()
          Response.data[0].doctipo_id = this.tipoSelected()
          Response.data[0].fileUrl = this.blobUrl
          Response.data[0].persona_id = 0
          Response.data[0].den_documento = ""
          Response.data[0].objetivo_id = 0
          Response.data[0].cliente_id = 0
          Response.data[0].fec_doc_ven = null
          Response.data[0].path = ""
          Response.data[0].nombre_archivo = ""
          Response.data[0].TipoArchivo = "pdf"
          this.files.set([...this.files(), Response.data[0]])
        }
        this.uploading$.next({ loading: false, event })
        this.apiService.response(Response)
        // this.valueExtendedEmitter
        this.propagateChange(this.files())

        break
      default:
        break;
    }

  }

  async confirmUpdateArchivo(file:any) {

    try {

      if(file.id){
        this.files.set(this.files().map(item => {

          if (item.id === file.id) 
            return { ...item, update: true };
          
          return item;
        }));
      }else{
        // si file no tiene id, es un archivo temporal y se borra del array
        this.files.set(this.files().filter((item) => item.fieldname !== file.fieldname))
        this.notification.warning('Respuesta', `Archivo borrado con exito `)
      }
    this.propagateChange(this.files())

  } catch (error) {

  }
}

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
    //this.formChangeArchivos$.next('');

  }

  ///



  handleCancel(): void {
    this.modalViewerVisiable.set(false)
  }

  cantFiles(): boolean {
    if ((this.files().length - this.files().filter(file => file.delete === true).length) < this.cantMaxFiles())
      return true
    return false
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled)
  }


}
