import { Component, Injector, viewChild, inject, signal, model, computed, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, debounceTime, map, switchMap, tap, noop } from 'rxjs';
import { RowDetailViewComponent } from '../../../shared/row-detail-view/row-detail-view.component';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { SearchService } from 'src/app/services/search.service';
import { NgForm, FormArray, FormBuilder } from '@angular/forms';
import { NzUploadChangeParam, NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { NzNotificationService } from 'ng-zorro-antd/notification';

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
  periodo= signal({anio:0, mes:0})
  files = signal<any[]>([])
  personalId = model(0);
  private notification = inject(NzNotificationService)
  urlUpload = '/api/personal/upload'
  uploading$ = new BehaviorSubject({loading:false,event:null});
  
  fb = inject(FormBuilder)
  formPer = this.fb.group({ nombre:'', apellido:'', cuit:0, nroLegajo:0,
    sucusalId:0, fechaAlta:'', fechaNacimiento:'', foto:'', nacionalidadId:0, dniDorso:'', dniFrente:''
  })

  $optionsSucusal = this.searchService.getSucursales();
  $optionsNacionalidad = this.searchService.getNacionalidadList();

  cambios = computed(async () => {
  });

  cuit():number {
    const value = this.formPer.get("cuit")?.value
    if(value) return value
    else return 0
  }
  foto():string {
    const value = this.formPer.get("foto")?.value
    if(value) return value
    else return ''
  }
  dniDorso():string {
    const value = this.formPer.get("dniDorso")?.value
    if(value) return value
    else return ''
  }
  dniFrente():string {
    const value = this.formPer.get("dniFrente")?.value
    if(value) return value
    else return ''
  }

  async ngOnInit(){
    let now : Date = new Date()
    this.periodo.set({anio: now.getFullYear(), mes: now.getMonth()+1})
  }

  uploadChange(event: any, input:string) {
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
        console.log(this.files());
        this.formPer.get(input)?.setValue(Response.data[0].fieldname)
  
        this.uploading$.next({ loading: false, event })
        this.apiService.response(Response) 

        this.formPer.markAsTouched()
        this.formPer.markAsDirty()
        this.propagateChange(this.files())
        break
      default:
        break;
    }

  }

  private propagateChange: (_: any) => void = noop

  registerOnChange(fn: any) {
    this.propagateChange = fn
  }

  async save() {
    this.isLoading.set(true)
    const form = this.formPer.value
    console.log('form', form);
    try {
      if (this.personalId()) {
        
      }else{

      }
      // this.formPer.markAsUntouched()
      // this.formPer.markAsPristine()
    } catch (e) {
      
    }
    this.isLoading.set(false)
  }

  getOriginalName(control: string):string {
    let archivo = this.formPer.get(control)?.value;
    if (archivo) {
      const archivoFind = this.files().find((item) => item.fieldname == archivo)
      return archivoFind.originalname
    }
    return ''
  }

  async confirmDeleteArchivo( control: string, tipoDocumentDelete : boolean) {
    try {
      let ArchivoIdForDelete = this.formPer.get(control)?.value;
      if( tipoDocumentDelete){
        console.log("No se borro")
        const ArchivoFilter = this.files().filter((item) => item.fieldname != ArchivoIdForDelete)
        console.log("fieldname ", ArchivoFilter)
        this.files.set(ArchivoFilter)
        this.formPer.get(control)?.setValue('')
        this.formPer.markAsTouched()
        this.notification.success('Respuesta', `Archivo borrado con exito `)
      }else{
        console.log("Si se borro")
        // await firstValueFrom( this.apiService.deleteArchivosLicencias(ArchivoIdForDelete))
      }

    } catch (error) {
      
    }
  }

}