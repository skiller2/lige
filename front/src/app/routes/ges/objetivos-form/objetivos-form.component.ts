import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, Input, input, } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, FileType, Aggregators, GroupTotalFormatters } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from 'src/app/services/api.service';
import { NgForm, FormArray, FormBuilder, ValueChangeEvent } from '@angular/forms';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { ClienteSearchComponent } from '../../../shared/cliente-search/cliente-search.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, startWith, Observable, of, filter, merge } from 'rxjs';
import { SearchService } from 'src/app/services/search.service';
import { DetallePersonaComponent } from '../detalle-persona/detalle-persona.component';
import { FiltroBuilderComponent } from "../../../shared/filtro-builder/filtro-builder.component";
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzSelectModule } from 'ng-zorro-antd/select';
import  { FileUploadComponent } from "../../../shared/file-upload/file-upload.component"
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Component({
  selector: 'app-objetivos-form',
  templateUrl: './objetivos-form.component.html',
  styleUrl: './objetivos-form.component.less',
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


export class ObjetivosFormComponent {
  public router = inject(Router);

  periodo = signal({ year: 0, month: 0 })
//  visibleDrawer: boolean = false

  objCoordinadorCuenta = { 
    PersonaId:0,
    Porcentaje: "", 
    Descuento:"",
  }

  personalId = signal(0)
  edit = model(true)
  ObjetivoId = model(0)
  selectedValueProvincia = null
  isLoading = signal(false)
  addNew = model()
  files = []
  textForSearch = "Objetivo"
  

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private injector = inject(Injector)


  fb = inject(FormBuilder)
  formCli = this.fb.group({
    id: 0,
    ClienteId: 0,
    CLienteDescripcion:"",
    ContratoDesde:"",
    ContratoHasta:"",
    ObjetivoDomicilioId:0,ObjetivoDomicilioDomCalle: "",ObjetivoDomicilioDomNro:0, ObjetivoDomicilioCodigoPostal: 0,ObjetivoDomicilioDomLugar:null,
    ObjetivoDomicilioProvinciaId: null, ObjetivoDomicilioLocalidadId: null, ObjetivoDomicilioBarrioId: null,
    infoCoordinadorContacto: this.fb.array([this.fb.group({ ...this.objCoordinadorCuenta })]), estado: 0,
  })

 
  $optionsProvincia = this.searchService.getProvincia();
  $optionsLocalidad = this.searchService.getLocalidad();
  $optionsBarrio = this.searchService.getBarrio();
  $optionsDescuento = this.searchService.getDescuento();
  $sucursales = this.searchService.getSucursales();

  onChangePeriodo(result: Date): void {
    if (result) {
      const date = new Date(result)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      this.periodo.set({ year, month })
    }
  }

  ngOnInit() {
    this.formCli.controls['ObjetivoDomicilioProvinciaId'].valueChanges.subscribe(event => {
      this.formCli.patchValue({ObjetivoDomicilioLocalidadId:null})
    });
    this.formCli.controls['ObjetivoDomicilioLocalidadId'].valueChanges.subscribe(event => {
      this.formCli.patchValue({ObjetivoDomicilioBarrioId:null})
    });


    effect(async () => {
      if (this.ObjetivoId()) {
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

    let infoObjetivo = await firstValueFrom(this.searchService.getInfoObj(this.ObjetivoId()))
    // this.infoCoordinadorContacto().clear()
    // infoCliente.infoClienteContacto.forEach((obj: any) => {
    //   this.infoCoordinadorContacto().push(this.fb.group({ ...this.objCoordinadorCuenta }))
    // });

    // if (this.ObjetivoId()) {
    //   this.infoCoordinadorContacto().enable()
    //   if(infoCliente.infoClienteContacto.length == 0)
    //     this.infoCoordinadorContacto().push(this.fb.group({ ...this.objCoordinadorCuenta }))
    // } else {
    //   this.infoCoordinadorContacto().disable()
    // }
    // setTimeout(() => {
    //   this.formCli.reset(infoCliente)
    //   this.formCli.patchValue({
    //     ObjetivoDomicilioProvinciaId: infoCliente.ClienteDomicilioProvinciaId,
    //     ObjetivoDomicilioLocalidadId: infoCliente.ClienteDomicilioLocalidadId,
    //     ObjetivoDomicilioBarrioId: infoCliente.ClienteDomicilioBarrioId,
    //   });
  
    // }, 100);
    // { }
  }


  async save() {
    this.isLoading.set(true)
    let form = this.formCli.value
    let finalObj = [form,...this.files]
    try {
        if (this.ObjetivoId()) {
          await firstValueFrom(this.apiService.updateCliente(finalObj, this.ObjetivoId()))
          await firstValueFrom(this.searchService.getInfoObjCliente(this.ObjetivoId()))
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

infoCoordinadorContacto(): FormArray {
    return this.formCli.get("infoCoordinadorContacto") as FormArray
  }

  addClienteContacto(e?: MouseEvent): void {

    e?.preventDefault();
    this.infoCoordinadorContacto().push(this.fb.group({ ...this.objCoordinadorCuenta }))
    
  }

  removeClienteContacto(index: number, e: MouseEvent): void {

    e.preventDefault();
    if (this.infoCoordinadorContacto().length > 1 ) {
      this.infoCoordinadorContacto().removeAt(index)
    }
  }

  async deleteCliente() {
    const form = this.formCli.value
    await firstValueFrom(this.apiService.deleteCliente(form))
  }

}
