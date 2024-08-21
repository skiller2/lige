import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, Input, input, } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, FileType, Aggregators, GroupTotalFormatters } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from 'src/app/services/api.service';
import { NgForm, FormArray, FormBuilder, ValueChangeEvent } from '@angular/forms';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { ClienteSearchComponent } from '../../../shared/cliente-search/cliente-search.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, startWith, Observable, of, filter } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { DetallePersonaComponent } from '../detalle-persona/detalle-persona.component';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzSelectModule } from 'ng-zorro-antd/select';
import  { FileUploadComponent } from "../../../shared/file-upload/file-upload.component"
import { Router } from '@angular/router';

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
    DetallePersonaComponent,
    FiltroBuilderComponent,
    NzAutocompleteModule,
    NzSelectModule,
    FileUploadComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})


export class ClientesFormComponent {
  updateAddressFields(event: any) {
    console.log('event',event)
      //ClienteDomicilioLocalidadId
 //   this.formCli.controls['']
}

  public router = inject(Router);

  periodo = signal({ year: 0, month: 0 })
//  visibleDrawer: boolean = false

  objClienteContacto = { 
    ClienteContactoId:0,
    nombre: "", 
    ClienteContactoApellido:"",
    area: "", 
    TipoTelefonoId:null,
    ClienteContactoTelefonoCodigoArea:"",
    telefono: "", 
    correo: "",
    ClienteContactoEmailUltNro:null,
    ClienteContactoTelefonoUltNro:null,
    ClienteContactoTelefonoId:null,
    ClienteContactoEmailId:null
  }

  personalId = signal(0)
  edit = model(true)
  ClienteId = model(0)
  selectedValueProvincia = null
  isLoading = signal(false)
  addNew = model()
  files = []
  textForSearch = "Cliente"
  

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private injector = inject(Injector)


  fb = inject(FormBuilder)
  formCli = this.fb.group({
    id: 0,
    ClienteFacturacionCUIT: 0,
    ClienteFacturacionId:0,
    ClienteCondicionAnteIVAId:0,
    CondicionAnteIVADescripcion: "",
    ClienteDenominacion: "",
    CLienteNombreFantasia: "",
    ClienteFechaAlta: "",
    ClienteDomicilioId:0,ClienteDomicilioDomCalle: "",ClienteDomicilioDomNro:0, referencia: "", ClienteDomicilioCodigoPostal: 0,ClienteDomicilioDomLugar:null,
    domiciliopais: "", ClienteDomicilioProvinciaId: null, ClienteDomicilioLocalidadId: null, ClienteDomicilioBarrioId: null,
    AdministradorId:0, AdministradorApellido: null,AdministradorNombre:null,
    infoClienteContacto: this.fb.array([this.fb.group({ ...this.objClienteContacto })]), estado: 0,
  })
  // $optionsProvincia: Observable<Provincia[]> | null = null;
  // $optionsLocalidad: Observable<Localidad[]> = of([]);
  // $optionsBarrio: Observable<Barrio[]> = of([]);

  $tipoTelefono = this.searchService.getTipoTelefono();
  $optionsProvincia = this.searchService.getProvincia();
  $optionsLocalidad = this.searchService.getLocalidad();
  $optionsBarrio = this.searchService.getBarrio();
  $optionsCondicionAnteIva = this.searchService.getOptionsCondicionAnteIva();

  onChangePeriodo(result: Date): void {
    if (result) {
      const date = new Date(result)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      this.periodo.set({ year, month })
    }
  }

  ngOnInit() {
    this.formCli.events
    .pipe(filter((event) => event instanceof ValueChangeEvent))
    .subscribe((event) => {
      console.log('ValueChangeEvent',event);
    });


    effect(async () => {
      if (this.ClienteId()) {
        await this.load()
      } else {
        this.formCli.reset({ estado: 0 })
      }
    }, { injector: this.injector });

    effect(async () => {
      
      if (this.edit()) {
        this.formCli.enable()
      } else{
       
      }
    }, { injector: this.injector });

  }


  async load() {

    let infoCliente = await firstValueFrom(this.searchService.getInfoObjCliente(this.ClienteId()))
    this.infoClienteContacto().clear()
    infoCliente.infoClienteContacto.forEach((obj: any) => {
      this.infoClienteContacto().push(this.fb.group({ ...this.objClienteContacto }))
    });

    if (this.ClienteId()) {
      this.infoClienteContacto().enable()
      if(infoCliente.infoClienteContacto.length == 0)
        this.infoClienteContacto().push(this.fb.group({ ...this.objClienteContacto }))
    } else {
      this.infoClienteContacto().disable()
    }
    setTimeout(() => {
      this.formCli.reset(infoCliente)
      this.formCli.patchValue({
        ClienteDomicilioProvinciaId: infoCliente.ClienteDomicilioProvinciaId,
        ClienteDomicilioLocalidadId: infoCliente.ClienteDomicilioLocalidadId,
        ClienteDomicilioBarrioId: infoCliente.ClienteDomicilioBarrioId,
        ClienteCondicionAnteIVAId: infoCliente.CondicionAnteIVAId
      });
  
    }, 100);
    { }
  }

  // changeSelect(){

  //   this.formCli.get('domicilioprovincia')!.valueChanges.pipe(
  //     startWith(null),
  //     switchMap(provinciaId => this.searchService.getLocalidad().pipe(
  //       map((Localidad: Localidad[]) => Localidad.filter(Localidad => Localidad.ProvinciaId === provinciaId))
  //     ))
  //   ).subscribe(LocalidadOptions => {
  //     console.log("LocalidadOptions " , LocalidadOptions)
  //     this.$optionsLocalidad = of(LocalidadOptions);
  //     if (LocalidadOptions && LocalidadOptions.length > 0) {
  //       //this.formCli.get('domiciliobarrio')!.enable();
  //     } else {
  //       //this.formCli.get('domiciliobarrio')!.disable();
  //     }
  //   });


  //   console.log("localidades ", this.$optionsLocalidad)
  //   // Deshabilitar el select de Barrio al inicio
  //   this.formCli.get('domiciliobarrio')!.disable();

  //   // Filtrar barrios cuando cambia la localidad
  //   this.formCli.get('domiciliolocalidad')!.valueChanges.pipe(
  //     startWith(null),
  //     switchMap(localidadId => this.searchService.getBarrio().pipe(
  //       map((barrios: Barrio[]) => barrios.filter(barrio => barrio.LocalidadId === localidadId))
  //     ))
  //   ).subscribe(barrioOptions => {
  //     this.$optionsBarrio = of(barrioOptions);
  //     if (barrioOptions && barrioOptions.length > 0) {
  //       this.formCli.get('domiciliobarrio')!.enable();
  //     } else {
  //       this.formCli.get('domiciliobarrio')!.disable();
  //     }
  //   });

  // }

  async save() {
    this.isLoading.set(true)
    let form = this.formCli.value
    let finalObj = [form,...this.files]
    try {
        if (this.ClienteId()) {
          await firstValueFrom(this.apiService.updateCliente(finalObj, this.ClienteId()))
          await firstValueFrom(this.searchService.getInfoObjCliente(this.ClienteId()))
            // this.edit.set(false)
        } else {
          //este es para cuando es un nuevo registro
          await firstValueFrom(this.apiService.addCliente(finalObj))
          this.addNew.set(true)
          this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
            this.router.navigate(['/ges/clientes/clientes']);
          });
        }
        
        this.formCli.markAsUntouched()
        this.formCli.markAsPristine()
    } catch (e) {
        
    }
    this.isLoading.set(false)
}

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
    }
  }

  async deleteCliente() {
    const form = this.formCli.value
    await firstValueFrom(this.apiService.deleteCliente(form))
  }

}
