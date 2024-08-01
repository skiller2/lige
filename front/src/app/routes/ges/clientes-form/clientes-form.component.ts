import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, Input, input, } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, FileType, Aggregators, GroupTotalFormatters } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from 'src/app/services/api.service';
import { NgForm, FormArray, FormBuilder } from '@angular/forms';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { ClienteSearchComponent } from '../../../shared/cliente-search/cliente-search.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { DetallePersonaComponent } from '../detalle-persona/detalle-persona.component';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';


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
    NzAutocompleteModule
    ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientesFormComponent {

  periodo = signal({ year: 0, month: 0 })
  visibleDrawer: boolean = false
  personalId = signal(0)
  objPersonal = { personalId: 0, area: 0 ,telefono:0,correo:"", }
  edit = model(true)
  custodiaId = model(0)

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
    direccion:"",referencia:"",codigopostal:0,
    pais:"",provincia:"",localidad:"",barrio:"",
    adminsitrador:"",
    contacto: this.fb.array([this.fb.group({...this.objPersonal}),this.fb.group({...this.objPersonal})]),
    estado: 0,})

  onChangePeriodo(result: Date): void {
    if (result) {
        const date = new Date(result)
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        this.periodo.set({ year, month })
    }
  }

  ngOnInit() {
    console.log("voy a pasar")
    effect(async () => {
        if (this.custodiaId()) {
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
    // let infoCust= await firstValueFrom(this.searchService.getInfoObjCustodia(this.custodiaId()))
    // infoCust.fechaInicio = new Date(infoCust.fechaInicio)
    // if (infoCust.fechaFinal)
    //     infoCust.fechaFinal = new Date(infoCust.fechaFinal)
    // this.clienteContacto().clear()
    // infoCust.personal.forEach((obj:any) => {
    //     this.clienteContacto().push(this.fb.group({...this.objPersonal}))
    // });
    if (this.edit()) {
      console.log("voy")
        this.contacto().enable()
       
    }else{
        this.contacto().disable() 
    }
    // setTimeout(() => {
    //     this.formCli.reset(infoCust)
    // }, 100);
    {}
}

contacto():FormArray {
    return this.formCli.get("contacto") as FormArray
  }

  addClienteContacto(e?: MouseEvent): void {
    e?.preventDefault();
    if (this.edit()) {
        this.contacto().controls.push((this.fb.group({...this.objPersonal})))
    }
  }

  removeClienteContacto(index: number, e: MouseEvent): void {
    e.preventDefault();
    if (this.contacto().controls.length > 1 && this.edit()) {
        this.contacto().removeAt(index)
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
