import { Component, EventEmitter, forwardRef, inject, Input, input, model, output, Output, SimpleChanges, ViewChild, viewChild } from '@angular/core';
import { BehaviorSubject, debounceTime, firstValueFrom, noop, Observable, switchMap, tap } from 'rxjs';
import { SHARED_IMPORTS } from '@shared';
import { ApiService } from 'src/app/services/api.service';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { CommonModule } from '@angular/common';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';


@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [SHARED_IMPORTS,NzUploadModule,CommonModule],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.less',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileUploadComponent),
      multi: true,
    },
  ],
})
export class FileUploadComponent implements ControlValueAccessor{

  uploading$ = new BehaviorSubject({loading:false,event:null});
  private apiService = inject(ApiService)
  ArchivosAdd: any[] = []
  valueFile = input()
  files = model<any[]>([])
  private notification = inject(NzNotificationService)
  ArchivoIdForDelete = 0
  
  valueExtended = input()
  valueExtendedEmitter = output<[]>();

  formChange$ = new BehaviorSubject('');

  idForSearh = input(0)
  textForSearch = input("")

 
  $formChange = new BehaviorSubject('');
  $files = this.formChange$.pipe(
    debounceTime(500),
    switchMap(() => {
      if(this.idForSearh() > 0 && this.textForSearch() != ""){
        this.files.set([])
        return this.apiService.getArchivosAnteriores(this.idForSearh(),this.textForSearch())
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


  uploadChange(event: any) {
    switch (event.type) {
      case 'start':
        
        this.uploading$.next({ loading: true, event })
    
        break;
      case 'progress':
        debugger
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

        this.valueExtendedEmitter
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


} 

