import { Component, Injector, viewChild, inject, signal, model, computed, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, debounceTime, map, switchMap, tap } from 'rxjs';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { SearchService } from 'src/app/services/search.service';
import { NgForm, FormArray, FormBuilder } from '@angular/forms';
import { NzUploadChangeParam, NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';

@Component({
  selector: 'app-personal-form',
  templateUrl: './personal-form.component.html',
  styleUrl: './personal-form.component.less',
  standalone: true,
  imports: [...SHARED_IMPORTS, CommonModule, NzUploadModule],
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
  
export class PersonalFormComponent {

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private injector = inject(Injector)
  isLoading = signal(false);
  isSaving= signal(false)
  periodo= signal({anio:0, mes:0})
  ArchivosLicenciasAdd: any[] = [];
  urlUpload = '/api/personal/upload'
  uploading$ = new BehaviorSubject({loading:false,event:null});
  
  fb = inject(FormBuilder)
  formPer = this.fb.group({ personalId:0, nombre:'', apellido:'', cuit:0, nroLegajo:0,
    sucusalId:0, fechaAlta:'', fechaNacimiento:'', foto:'', nacionalidadId:0, dniDorso:'', dniFrente:''
  })

  cuit():number {
    const value = this.formPer.get("cuit")?.value
    if(value) return value
    else return 0
}

  $optionsSucusal = this.searchService.getSucursales();
  $optionsNacionalidad = this.searchService.getNacionalidadList();

  async ngOnInit(){
    let now : Date = new Date()
    this.periodo.set({anio: now.getFullYear(), mes: now.getMonth()+1})
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
       
        this.ArchivosLicenciasAdd = [ ...this.ArchivosLicenciasAdd, Response.data[0] ]
       // console.log(this.ArchivosLicenciasAdd)
        this.uploading$.next({ loading: false, event })
        this.apiService.response(Response) 
        //this.fileUploaded = true;
        this.formPer.markAsDirty()
        break
      default:
        break;
    }

  }

  async save() {
    this.isLoading.set(true)
    const form = this.formPer.value
    console.log('form', form);
    try {
      // this.formPer.markAsUntouched()
      // this.formPer.markAsPristine()
    } catch (e) {
      
    }
    this.isLoading.set(false)
  }
}