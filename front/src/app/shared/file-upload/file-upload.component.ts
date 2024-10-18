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



@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [SHARED_IMPORTS,NzUploadModule,CommonModule,NgxExtendedPdfViewerModule],
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
export class FileUploadComponent implements ControlValueAccessor{
  public src=signal<Blob>(new Blob())
  private readonly http = inject(HttpClient);

  constructor() {
    pdfDefaultOptions.assetsFolder = 'assets/bleeding-edge'

   };

  uploading$ = new BehaviorSubject({loading:false,event:null});
  private apiService = inject(ApiService)
  ArchivosAdd: any[] = []
  // valueFile = input()
  files = signal<any[]>([])
  private notification = inject(NzNotificationService)
  ArchivoIdForDelete = 0
  keyField = input("")
  idForSearh = input(0)
  textForSearch = input("")
  isVisible = false

  Fullpath = signal("")
  FileName = signal("")

  // valueExtended = input()
  // valueExtendedEmitter = output<[]>();

  formChange$ = new BehaviorSubject('');

  $formChange = new BehaviorSubject('');
  $files = this.formChange$.pipe(
    debounceTime(500),
    switchMap(() => {
      if(this.idForSearh() > 0 && this.textForSearch() != ""){
        this.files.set([])
        return this.apiService.getArchivosAnteriores(this.idForSearh(),this.textForSearch(),this.keyField())
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

  async LoadArchivo(documentId: any, filename:any){
    
    console.log('antes')
  
    const res = await firstValueFrom(this.http.post('api/file-upload/downloadFile',
          { responseType: 'blob','documentId': documentId,filename:filename }
    ))
    console.log('respuesta',res)
//    this.src.set(new Blob(res))
    
    this.FileName.set(filename)
     this.isVisible = true;

  }


  uploadChange(event: any) {
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
        this.uploading$.next({ loading:false,event })
        break;
      case 'success':

        const Response = event.file.response
        this.files.set([ ...this.files(), Response.data[0] ])
  
        this.uploading$.next({ loading: false, event })
        this.apiService.response(Response) 

       // this.valueExtendedEmitter
        this.propagateChange(this.files())

        break
      default:
        break;
    }

  }
 
  async confirmDeleteArchivo( id: string, tipoDocumentDelete : boolean) {
    try {

      this.ArchivoIdForDelete = parseInt(id);
      if( tipoDocumentDelete){

        const ArchivoFilter = this.files().filter((item) => item.fieldname === this.ArchivoIdForDelete)
        this.files.set(ArchivoFilter)
        this.notification.success('Respuesta', `Archivo borrado con exito `)

      }else{

        await firstValueFrom(this.apiService.deleteArchivosLicencias(this.ArchivoIdForDelete))
        this.formChange$.next('');
      }

     
    } catch (error) {
      
    }
  }
  ////////

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
    this.isVisible = false;
  }



} 

