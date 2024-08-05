import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, Input, input, } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, FileType, Aggregators, GroupTotalFormatters } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from 'src/app/services/api.service';
import { NgForm, FormArray, FormBuilder } from '@angular/forms';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { ClienteSearchComponent } from '../../../shared/cliente-search/cliente-search.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap,startWith, Observable, of } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { DetallePersonaComponent } from '../detalle-persona/detalle-persona.component';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzSelectModule } from 'ng-zorro-antd/select';

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
    NzSelectModule
    ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientesFormComponent {

  periodo = signal({ year: 0, month: 0 })
  visibleDrawer: boolean = false
  objClienteContacto = { personalId: 0, area:"",telefono:"",correo:"" }
  personalId = signal(0)
  edit = model(true)
  ClienteId = model(0)
  selectedValueProvincia = null


  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private injector = inject(Injector)
 

  fb = inject(FormBuilder)
  formCli = this.fb.group({ 
    id: 0, 
    cuit:0,
    condicioniva:"",
    razonsocial:"",
    nombrefantasia:"",
    fechaInicio:"",
    rubros:"",
    domiciliodireccion:"",referencia:"",domiciliocodigopostal:0,
    domiciliopais:"",domicilioprovincia:0,domiciliolocalidad:0,domiciliobarrio:0,
    AdministradorApellidoNombre:"",
    arrayContacto: this.fb.array([this.fb.group({...this.objClienteContacto}),this.fb.group({...this.objClienteContacto})]),estado: 0,})
    // $optionsProvincia: Observable<Provincia[]> | null = null;
    // $optionsLocalidad: Observable<Localidad[]> = of([]);
    // $optionsBarrio: Observable<Barrio[]> = of([]);
    
    $optionsProvincia = this.searchService.getProvincia();
    $optionsLocalidad = this.searchService.getLocalidad();
    $optionsBarrio = this.searchService.getBarrio();

  onChangePeriodo(result: Date): void {
    if (result) {
        const date = new Date(result)
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        this.periodo.set({ year, month })
    }
  }

  ngOnInit() {



    effect(async () => {
        if (this.ClienteId()) {
            await this.load()
        } else {
            this.formCli.reset({estado: 0})
        }
    }, { injector: this.injector });
    
    effect(async () => {
        if (this.edit()) {
            this.formCli.enable()
        }else{
            this.formCli.disable()
        }
    }, { injector: this.injector });

  }
  

  async load() {
    
     let infoCliente= await firstValueFrom(this.searchService.getInfoObjCliente(this.ClienteId()))
     infoCliente.fechaInicio = new Date(infoCliente.fechaInicio)

     this.formCli.patchValue({ 
      domicilioprovincia: infoCliente.ProvinciaId,
      domiciliolocalidad: infoCliente.domiciliolocalidad,
      domiciliobarrio: infoCliente.domiciliobarrio
     });
    this.arrayContacto().clear()
    console.log("infoCliente ",  infoCliente.infoClienteContacto)
    infoCliente.infoClienteContacto.forEach((obj:any) => {
     
      this.arrayContacto().push(this.fb.group({...this.objClienteContacto}))
  });
    if (this.edit()) {
        this.arrayContacto().enable()
       
    }else{
        this.arrayContacto().disable() 
    }
    setTimeout(() => {
        this.formCli.reset(infoCliente)
    }, 100);
    {}
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

arrayContacto():FormArray {
    return this.formCli.get("arrayContacto") as FormArray
  }

  addClienteContacto(e?: MouseEvent): void {
    e?.preventDefault();
    if (this.edit()) {
        this.arrayContacto().controls.push((this.fb.group({...this.objClienteContacto})))
    }
  }

  removeClienteContacto(index: number, e: MouseEvent): void {
    e.preventDefault();
    if (this.arrayContacto().controls.length > 1 && this.edit()) {
        this.arrayContacto().removeAt(index)
    }
  }
  

  openDrawer(index: any): void {
    const personalId = this.formCli.get("personalId")
    //const personalId = this.personal().value[index].personalId
    if (!personalId) return
    this.personalId.set(Number(personalId))
    this.visibleDrawer = true
  }

  closeDrawer(): void {
    this.visibleDrawer = false;
    this.personalId.set(0)
}

}
