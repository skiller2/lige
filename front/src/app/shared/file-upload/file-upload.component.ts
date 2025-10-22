import { Component, computed, effect, EventEmitter, forwardRef, inject, Input, input, model, output, Output, signal, SimpleChanges, ViewChild, viewChild, ViewEncapsulation } from '@angular/core';
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
import { NzIconModule } from 'ng-zorro-antd/icon';
import { DA_SERVICE_TOKEN } from '@delon/auth';
import { ImageLoaderComponent } from '../image-loader/image-loader.component';

interface DocTipo {
  doctipo_id: string;
  detalle: string;
}

@Component({
  selector: 'app-file-upload',
  imports: [SHARED_IMPORTS, NzUploadModule, CommonModule, NgxExtendedPdfViewerModule, NzImageModule, NzSelectModule, FormsModule, NzIconModule, ImageLoaderComponent],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.less',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileUploadComponent),
      multi: true
    },
  ],
  encapsulation: ViewEncapsulation.None

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
  private readonly tokenService = inject(DA_SERVICE_TOKEN);

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
  searchById = input<boolean>(false)

  tipoSelected = signal<string>("")
  textForSearchSelected = signal<DocTipo[]>([])

  onTipoSelectedChange(newValue: string) {
    this.tipoSelected.set(newValue)
    console.log("this.idForSearh()", this.idForSearh())
    this.LoadArchivosAnteriores(this.idForSearh())
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['idForSearh'] || changes['textForSearch'] || changes['columnForSearch'] || changes['tableForSearch']) {
      if (changes['textForSearch']) {
        //Parsear textForSearch y armar arreglo con los tipos de documento.
        this.docTiposValidos.set(this.textForSearch().split(','))
      }

      if (this.docTiposValidos().length == 1)
        this.tipoSelected.set(this.docTiposValidos()[0])

      this.LoadArchivosAnteriores(this.idForSearh())

    }
  }

  async ngOnInit() {
    this.textForSearchSelected.set(await firstValueFrom(this.apiService.getSelectTipoinFile()))
  }

  async LoadArchivosAnteriores(idForSearh: any) {
    console.log("searchById", this.searchById())
    if (this.docTiposValidos().length == 1 && this.docTiposValidos()[0] !== "")
      this.tipoSelected.set(this.docTiposValidos()[0])

    if (idForSearh && this.tipoSelected() != "" && this.tableForSearch() != "" && !this.searchById()) {
      console.log("entre 1")
      const result = await firstValueFrom(this.apiService.getArchivosAnteriores(idForSearh, this.tipoSelected(), this.columnForSearch(), this.tableForSearch()))
      this.cantFilesAnteriores.set(result.length)

      this.prevFiles.emit(result)
      this.files.set(result)

    } else if (idForSearh && this.searchById()) {
      console.log("entre 2")

      const result = await firstValueFrom(this.apiService.getArchivoAnterior(idForSearh))
      console.log("result", result)
      console.log("result.length", result.length)
      this.cantFilesAnteriores.set(result.length)
      this.prevFiles.emit(result)
      this.files.set(result)
    } else {
      this.prevFiles.emit([])
      this.cantFilesAnteriores.set(0)
      this.files.set([])
    }
    this.propagateChange(this.files())

  }

  async LoadArchivo(documentId: any, tableForSearch: string, filename: string) {
    this.modalViewerVisiable.set(false)
    this.src.set(await fetch(`api/file-upload/downloadFile/${documentId}/${tableForSearch}/original`, { headers: { token: this.tokenService.get()?.token ?? '' } }).then(res => res.blob()))
    this.FileName.set(filename)
    this.modalViewerVisiable.set(true)
  }


  async uploadChange(event: any, file: any) {
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

        if (file) {
          this.files.set(this.files().map(item => {
            if (item.id === file.id) {
              return {
                ...item,
                path: null,
                nombre: Response.data[0].originalname,
                mimetype: Response.data[0].mimetype,
                tempfilename: Response.data[0].tempfilename,
                url: Response.data[0].url,

              };
            }
            return item;
          }));

        } else {

          //          const src = await fetch(`api/file-upload/downloadFile1/${Response.data[0].fieldname}.${Response.data[0].mimetype.split("/")[1]}/temp/original`,{headers:{token:this.tokenService.get()?.token ?? ''}}).then(res => res.blob())
          //          this.blobUrl = URL.createObjectURL(src)
          Response.data[0].tableForSearch = this.tableForSearch()
          Response.data[0].doctipo_id = this.tipoSelected()
          //          Response.data[0].fileUrl = this.blobUrl
          //          Response.data[0].fileUrl = `api/file-upload/downloadFile1/${Response.data[0].fieldname}.${Response.data[0].mimetype.split("/")[1]}/temp/original`
          Response.data[0].persona_id = 0
          Response.data[0].den_documento = ""
          Response.data[0].objetivo_id = 0
          Response.data[0].cliente_id = 0
          Response.data[0].fec_doc_ven = null
          Response.data[0].nombre_archivo = ""
          console.log('Response.data[0]', Response.data[0])
          console.log('this.files()', this.files())
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

  async confirmUpdateArchivo(file: any) {

    try {

      if (file.id) {
        this.files.set(this.files().map(item => {
          console.log("item", item)
          if (item.id === file.id)
            return { ...item, update: true };

          return item;
        }));
      } else {
        // si file no tiene id, es un archivo temporal y se borra del array
        this.files.set(this.files().filter((item) => item.fieldname !== file.fieldname))
        this.notification.warning('Respuesta', `Archivo borrado con exito `)
      }
      this.propagateChange(this.files())

    } catch (error) {

    }

  }

  async DeleteFileByExporterror(file: any) {

    this.files.set([])

  }

  ngOnDestroy() {
    /*
    this.files().forEach(file => {
      if (file.fileUrl) {
        URL.revokeObjectURL(file.fileUrl)
      }
    })
      */
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
