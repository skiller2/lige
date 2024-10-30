import { Component, Injector, viewChild, inject, signal, model, computed, ChangeDetectionStrategy, effect } from '@angular/core';
import { BehaviorSubject, debounceTime, map, switchMap, tap, noop, firstValueFrom } from 'rxjs';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  inputs = { 
    Nombre:'', Apellido:'', CUIT:0, NroLegajo:0, SucursalId:0, FechaIngreso:'',
    FechaNacimiento:'', Foto:'', NacionalidadId:0, docDorso:'', docFrente:''
  }
  
  fb = inject(FormBuilder)
  formPer = this.fb.group({ ...this.inputs })

  $optionsSucursal = this.searchService.getSucursales();
  $optionsNacionalidad = this.searchService.getNacionalidadList();

  cuit():number {
    const value = this.formPer.get("CUIT")?.value
    if(value) return value
    else return 0
  }
  foto():string {
    const value = this.formPer.get("Foto")?.value
    if(value) return value
    else return ''
  }
  docDorso():string {
    const value = this.formPer.get("docDorso")?.value
    if(value) return value
    else return ''
  }
  docFrente():string {
    const value = this.formPer.get("docFrente")?.value
    if(value) return value
    else return ''
  }

  async ngOnInit(){
    let now : Date = new Date()
    this.periodo.set({anio: now.getFullYear(), mes: now.getMonth()+1})
    effect(async () => {
      console.log(`The personalId is: ${this.personalId()}`);
      if (this.personalId()) {
          await this.load()
      } else {
          
      }
    }, { injector: this.injector });
  }

  async load() {
    let infoPersonal = await firstValueFrom(this.searchService.getPersonalInfoById(this.personalId()))
    let values:any = {...this.inputs}
    
    for (const key in values) {
      values[key] = infoPersonal[key]
    }
    this.formPer.reset(values)
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
      if (archivoFind) return archivoFind.originalname
      return archivo
    }
    return ''
  }

  async confirmDeleteArchivo( control: string, tipoDocumentDelete : boolean) {
    try {
      let ArchivoIdForDelete = this.formPer.get(control)?.value;
      if( tipoDocumentDelete){
        // console.log("No se borro")
        const ArchivoFilter = this.files().filter((item) => item.fieldname != ArchivoIdForDelete)
        // console.log("fieldname ", ArchivoFilter)
        this.files.set(ArchivoFilter)
        this.formPer.get(control)?.setValue('')
        this.formPer.markAsTouched()
        this.notification.success('Respuesta', `Archivo borrado con exito `)
      }else{
        // console.log("Si se borro")
        // await firstValueFrom( this.apiService.deleteArchivosLicencias(ArchivoIdForDelete))
      }

    } catch (error) {
      
    }
  }

}