import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, Input, input, output, } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, FileType, Aggregators, GroupTotalFormatters } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from 'src/app/services/api.service';
import { NgForm, FormArray, FormBuilder, ValueChangeEvent, FormGroup, FormControl } from '@angular/forms';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { ClienteSearchComponent } from '../../../shared/cliente-search/cliente-search.component';
import { AdministradorSearchComponent } from '../../../shared/administrador-search/administrador-search.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, startWith, Observable, of, filter, merge, Subscription } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { DetallePersonaComponent } from '../detalle-persona/detalle-persona.component';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzSelectModule } from 'ng-zorro-antd/select';
import  { FileUploadComponent } from "../../../shared/file-upload/file-upload.component"
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface Provincia {
  ProvinciaId: number;
  ProvinciaDescripcion: string;
}

interface Localidad {
  LocalidadId: number;
  localidadDescripcion: string;
  ProvinciaId: number;
}

interface Barrio {
  BarrioId: number;
  BarrioDescripcion: string;
  LocalidadId: number;
}


@Component({
  selector: 'app-clientes-form',
  templateUrl: './clientes-form.component.html',
  styleUrl: './clientes-form.component.less',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  providers: [AngularUtilService],
  imports: [
    SHARED_IMPORTS,
    CommonModule,
    PersonalSearchComponent,
    ClienteSearchComponent,
    AdministradorSearchComponent,
    DetallePersonaComponent,
    FiltroBuilderComponent,
    NzAutocompleteModule,
    NzSelectModule,
    FileUploadComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})


export class ClientesFormComponent {
  public router = inject(Router);
  isLoadSelect= signal(false)
  periodo = signal({ year: 0, month: 0 })
  personalId = signal(0)
  ClienteId = model(0)
  selectedValueProvincia = null
  isLoading = signal(false)
  onAddorUpdate = output()
  //files = []
  textForSearch = "Cliente"

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private injector = inject(Injector)
//  visibleDrawer: boolean = false

  objClienteContacto = { 
    ContactoId:0,
    nombre: "", 
    ContactoApellido:"",
    area: "", 
    TipoTelefonoId:null,
    ContactoTelefonoCodigoArea:"",
    telefono: "", 
    correo: "",
    ContactoEmailId:0,
    ContactoTelefonoId:0,
   
  }

  objDomiclio = { 
    ClienteDomicilioId:0,
    ClienteDomicilioDomCalle:"",
    ClienteDomicilioDomNro:"",
    referencia: "", 
    ClienteDomicilioCodigoPostal: "",
    ClienteDomicilioDomLugar:null,
    domiciliopais: "", 
    ClienteDomicilioProvinciaId: null, 
    ClienteDomicilioLocalidadId: null, 
    ClienteDomicilioBarrioId: null
  }

  fb = inject(FormBuilder)
  formCli = this.fb.group({
    id: 0,
    ClienteFacturacionCUIT: 0,
    ClienteFacturacionId:0,
    CondicionAnteIVAId:0,
    CondicionAnteIVADescripcion: "",
    ClienteApellidoNombre: "",
    ClienteNombreFantasia: "",
    ClienteFechaAlta: "",
    ContactoTelefonoUltNro:0,
    ContactoEmailUltNro:0,
    MaxContactoId:0,
    AdministradorId:0,ClienteAdministradorUltNro:0,ClienteDomicilioUltNro:0,
    infoClienteContacto: this.fb.array([this.fb.group({ ...this.objClienteContacto })]), 
    infoClienteContactoOriginal : this.fb.array([this.fb.group({ ...this.objClienteContacto })]),
    infoDomicilio :  this.fb.array([this.fb.group({ ...this.objDomiclio })]),
    //infoDomicilioOriginal :  this.fb.array([this.fb.group({ ...this.objDomiclio })]),
    estado: 0,
    files:[],
    codigo:""
  })
  tipoTelefono: any;
  optionsProvincia: any;
  optionsLocalidad: any;
  optionsBarrio: any;
  optionsCondicionAnteIva: any;



  onChangePeriodo(result: Date): void {
    if (result) {
      const date = new Date(result)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      this.periodo.set({ year, month })
    }
  }

  async ngOnInit() {
    this.tipoTelefono = await firstValueFrom(this.searchService.getTipoTelefono())
    this.optionsProvincia = await firstValueFrom(this.searchService.getProvincia())
    this.optionsLocalidad = await firstValueFrom(this.searchService.getLocalidad())
    this.optionsBarrio = await firstValueFrom(this.searchService.getBarrio())
    this.optionsCondicionAnteIva = await firstValueFrom(this.searchService.getOptionsCondicionAnteIva())

    await this.userEfectFuntion()
  }

  async userEfectFuntion(){

    // effect(async () => {

    //   console.log("ejecuto el efect")
    //   this.formCli.reset()

    //   if (this.ClienteId()) 
    //     await this.load()
    //   else 
    //     this.formCli.reset({ estado: 0 })
      
        
    //   if (this.edit()) 
    //     this.formCli.enable()

    //   if(this.consult())
    //     this.formCli.disable()

    //   this.formCli.get('codigo')?.disable()
    //   this.formCli.markAsPristine()

      
    // }, { injector: this.injector });
  }

  async newRecord() {
    this.formCli.reset()
    this.formCli.get('codigo')?.enable()
    this.formCli.markAsPristine()
    //await this.userEfectFuntion()
    this.formCli.get('codigo')?.disable()

  }

  async viewRecord(readonly:boolean) {
      if (this.ClienteId()) 
        await this.load()
      if (readonly)
        this.formCli.disable()
      else
        this.formCli.enable()
      this.formCli.get('codigo')?.disable()
      this.formCli.markAsPristine()        

   }

  async load() {
   // this.files = []
   
    let infoCliente = await firstValueFrom(this.searchService.getInfoObjCliente(this.ClienteId()))

    this.infoClienteContacto().clear()
    this.infoDomicilio().clear()

    infoCliente.infoClienteContacto.forEach((obj: any) => {
      this.infoClienteContacto().push(this.fb.group({ ...this.objClienteContacto }))
    });

    infoCliente.infoDomicilio.forEach((obj: any) => {
      this.infoDomicilio().push(this.fb.group({ ...this.objDomiclio }))
    });

    if (this.ClienteId()) {
      this.infoClienteContacto().enable()
      this.infoDomicilio().enable()
      if(infoCliente.infoClienteContacto.length == 0)
        this.infoClienteContacto().push(this.fb.group({ ...this.objClienteContacto }))

      if(infoCliente.infoDomicilio.length == 0)
        this.infoDomicilio().push(this.fb.group({ ...this.objDomiclio }))

    } else {
      this.infoDomicilio().disable()
      this.infoClienteContacto().disable()
    }
    
    this.formCli.reset(infoCliente)
    this.formCli.patchValue({
        codigo: infoCliente.id,
    });
    this.formCli.get('codigo')?.disable()
    //this.cdr.detectChanges(); // Asegúrate de que la vista se actualice.

   console.log(" this.formCli.value ",  this.formCli.value)
    { }
  }

  async save() {
    this.isLoading.set(true)
    let form = this.formCli.value
    try {
        if (this.ClienteId()) {
          let result = await firstValueFrom(this.apiService.updateCliente(form, this.ClienteId()))

          this.formCli.patchValue({
            infoClienteContacto: result.data.infoClienteContacto,
            infoDomicilio:result.data.infoDomicilio,
          });

        } else {
          //este es para cuando es un nuevo registro
          let result =  await firstValueFrom(this.apiService.addCliente(form))

          this.formCli.patchValue({
            id:result.data.ClienteNewId,
            infoClienteContacto: result.data.infoClienteContacto,
            infoDomicilio:result.data.infoDomicilio,
          });

          this.ClienteId.set(result.data.ClienteNewId)

         
        }
        
        this.formCli.markAsUntouched()
        this.formCli.markAsPristine()
    } catch (e) {
        
    }
    this.isLoading.set(false)
    this.onAddorUpdate.emit()
}

  infoDomicilio(): FormArray {
    return this.formCli.get("infoDomicilio") as FormArray
  }

  addDomicilio(e?: MouseEvent): void {
    e?.preventDefault();
    this.infoDomicilio().push(this.fb.group({ ...this.objDomiclio }))
    
  }

  removeDomicilio(index: number, e: MouseEvent): void {

    e.preventDefault();
    if (this.infoDomicilio().length > 1 ) {
      this.infoDomicilio().removeAt(index)
    }else{
      this.infoDomicilio().clear()
      this.infoDomicilio().push(this.fb.group({ ...this.objDomiclio }))
    }
    this.formCli.markAsDirty();
  }


  ////////
  infoClienteContacto(): FormArray {
    return this.formCli.get("infoClienteContacto") as FormArray
  }

  addClienteContacto(e?: MouseEvent): void {

    e?.preventDefault();
    this.infoClienteContacto().push(this.fb.group({ ...this.objClienteContacto }))
    
  }

  removeClienteContacto(index: number, e: MouseEvent): void {

    e.preventDefault();
    if (this.infoClienteContacto().length > 1 ) {
      this.infoClienteContacto().removeAt(index)
    }else{
      this.infoClienteContacto().clear()
      this.infoClienteContacto().push(this.fb.group({ ...this.objClienteContacto }))
    }
    this.formCli.markAsDirty();
  }

  async deleteCliente() {
    const form = this.formCli.value
    await firstValueFrom(this.apiService.deleteCliente(form))
    this.onAddorUpdate.emit()
  }

}
