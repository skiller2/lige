import { Component, inject, input, model, SimpleChanges, viewChild } from '@angular/core';
import { BehaviorSubject, debounceTime, Observable, switchMap } from 'rxjs';
import { SHARED_IMPORTS } from '@shared';
import { ApiService } from 'src/app/services/api.service';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { CommonModule } from '@angular/common';
import { NzNotificationService } from 'ng-zorro-antd/notification';


@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [SHARED_IMPORTS,NzUploadModule,CommonModule],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.less'
})
export class FileUploadComponent {

  uploading$ = new BehaviorSubject({loading:false,event:null});
  private apiService = inject(ApiService)
  ArchivosAdd: any[] = []
  valueFile = input()
  files = model<any[]>([])
  private notification = inject(NzNotificationService)
  ArchivoIdForDelete = 0
  formChange$ = new BehaviorSubject('');

  idForSearh = input(0)
  textForSearch = input("")
  
  $files = this.formChange$.pipe(
    debounceTime(500),
    switchMap(() => {
      if(this.idForSearh() > 0 && this.textForSearch() != ""){
        return this.apiService
        .getArchivosAnteriores(this.idForSearh(),this.textForSearch())
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
        console.log("imprimo ",  this.files())
       // console.log(this.ArchivosLicenciasAdd)
        this.uploading$.next({ loading: false, event })
        this.apiService.response(Response) 
        //this.fileUploaded = true;
        //this.ngForm().form.markAsDirty()
        break
      default:
        break;
    }

  }
 
  async confirmDeleteArchivo( id: string, tipoDocumentDelete : boolean) {
    try {
      this.ArchivoIdForDelete = parseInt(id);
      if( tipoDocumentDelete){
        console.log("fieldname ", this.files())
        console.log("ArchivoIdForDelete ", this.ArchivoIdForDelete)
        const ArchivoFilter = this.files().filter((item) => item.fieldname === this.ArchivoIdForDelete)
        this.files.set(ArchivoFilter)
         
       this.notification.success('Respuesta', `Archivo borrado con exito `);

      }else{
        //await firstValueFrom( this.apiService.deleteArchivosLicencias(this.ArchivoIdForDelete))
      }

      //this.formChange$.next('');
    } catch (error) {
      
    }
  }
}
