import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, Input, input, output, } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, FileType, Aggregators, GroupTotalFormatters } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from 'src/app/services/api.service';
import { NgForm, FormArray, FormBuilder, ValueChangeEvent } from '@angular/forms';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { RubroSearchComponent } from '../../../shared/rubro-search/rubro-search.component';
import { GrupoActividadSearchComponent } from '../../../shared/grupo-actividad/grupo-actividad.component';
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
    RubroSearchComponent,
    ClienteSearchComponent,
    DetallePersonaComponent,
    FiltroBuilderComponent,
    NzAutocompleteModule,
    NzSelectModule,
    FileUploadComponent,
    GrupoActividadSearchComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  
})


export class ObjetivosFormComponent {
  public router = inject(Router);

  periodo = signal({ year: 0, month: 0 })
//  visibleDrawer: boolean = false

  objCoordinadorCuenta = { 
    ObjetivoId:0,
    PersonaId:0,
    ObjetivoPersonalJerarquicoId:0,
    ObjetivoPersonalJerarquicoComision: 0, 
    ObjetivoPersonalJerarquicoDescuentos:false,
  }
  objRubro = {
    ClienteElementoDependienteRubroId:0,
    RubroId:0
  }
  objActividad = {
    GrupoActividadObjetivoId:0,
    GrupoActividadId:0,
    GrupoActividadOriginal:0
  }
  ObjetivoId = model(0)
  ClienteId = model(0)
  ClienteElementoDependienteId = model(0)
  selectedValueProvincia = null
  isLoading = signal(false)
  addNew = model()
  onAddorUpdate = output()
  files = []

  

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private injector = inject(Injector)


  fb = inject(FormBuilder)
  formCli = this.fb.group({
    id: 0,
    ClienteId: 0,
    clienteOld: 0,
    ClienteElementoDependienteId:0,
    ObjetivoId:0,
    Descripcion:"",
    SucursalId:0,
    ContratoFechaDesde:"",
    ContratoFechaHasta:"",
    ContratoId:0,
    ClienteContratoUltNro:0,
    ClienteElementoDependienteContratoUltNro:0,
    ClienteElementoDependienteDomicilioUltNro:0,
    RubroUltNro:0,
    DomicilioId:0,DomicilioDomCalle: "",
    DomicilioFulllAdress:"",
    DomicilioDomNro:0, DomicilioCodigoPostal: 0,DomicilioDomLugar:null,
    DomicilioProvinciaId: null,DomicilioLocalidadId: null, DomicilioBarrioId: null,
    infoCoordinadorCuenta: this.fb.array([this.fb.group({ ...this.objCoordinadorCuenta })]), 
    infoRubro: this.fb.array([this.fb.group({ ...this.objRubro })]), 
    infoActividad: this.fb.array([this.fb.group({ ...this.objActividad })]), 
    estado: 0,
    files:[],
    codigo: "",
    DireccionModificada: false,
    FechaModificada: false,
    ContratoFechaDesdeOLD:"",
    ContratoFechaHastaOLD:"",
    GrupoActividadId:0
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
    // effect(async () => {
    //   if (this.ObjetivoId()) {
    //     await this.load()
    //     this.formCli.markAsPristine()
    //   } else {
    //     this.infoCoordinadorCuenta().clear()
    //     this.infoCoordinadorCuenta().push(this.fb.group({ ...this.objCoordinadorCuenta }))
    //     this.formCli.reset({})
    //     this.formCli.markAsPristine()
    //     this.formCli.enable();

    //   }
    // }, { injector: this.injector });

    // effect(async () => {
      
    //   if (this.edit()) {
    //     this.formCli.enable()
    //     this.formCli.get('codigo')?.disable();
    //   } else{
    //   }
    // }, { injector: this.injector });

  }

  async newRecord() {
    this.formCli.reset()
    this.formCli.get('codigo')?.disable()
    this.formCli.markAsPristine()
    //await this.userEfectFuntion()

  }

  async viewRecord(readonly:boolean) {
      if (this.ObjetivoId()) 
        await this.load()
      if (readonly)
        this.formCli.disable()
      else
        this.formCli.enable()
      this.formCli.get('codigo')?.disable()
      this.formCli.markAsPristine()        

   }



  async load() {

    let infoObjetivo = await firstValueFrom(this.searchService.getInfoObj(this.ObjetivoId(),this.ClienteId(),this.ClienteElementoDependienteId()))
   
    this.infoCoordinadorCuenta().clear()
    this.infoRubro().clear()
    this.infoActividad().clear()
    
    infoObjetivo?.infoCoordinadorCuenta.forEach((obj: any) => {
      this.infoCoordinadorCuenta().push(this.fb.group({ ...this.objCoordinadorCuenta }))
    });

    if(infoObjetivo.infoCoordinadorCuenta.length == 0){
      this.infoCoordinadorCuenta().push(this.fb.group({ ...this.objCoordinadorCuenta }))
     
    }  

    infoObjetivo?.infoRubro.forEach((obj: any) => {
      this.infoRubro().push(this.fb.group({ ...this.objRubro }))
    });
    
    if(infoObjetivo.infoRubro.length == 0){
      this.infoRubro().push(this.fb.group({ ...this.objRubro }))
    }

    infoObjetivo?.infoActividad.forEach((obj: any) => {
      this.infoActividad().push(this.fb.group({ ...this.objActividad }))
    });
    
    if(infoObjetivo.infoActividad.length == 0){
      this.infoActividad().push(this.fb.group({ ...this.objActividad }))
    }
    
    if (this.formCli.disabled){
      this.infoCoordinadorCuenta().disable()
      this.infoRubro().disable()
      this.infoActividad().disable()
    }else {
      this.infoCoordinadorCuenta().enable()
      this.infoRubro().enable()
      this.infoActividad().disable()
    }

    this.formCli.reset(infoObjetivo)
    this.formCli.patchValue({
      DireccionModificada:false,
      FechaModificada:false,
      ContratoFechaDesdeOLD:infoObjetivo.ContratoFechaDesde,
      ContratoFechaHastaOLD:infoObjetivo.ContratoFechaHasta,
      codigo: `${infoObjetivo.ClienteId}/${infoObjetivo.ClienteElementoDependienteId}`,
      GrupoActividadId: infoObjetivo.infoActividad.GrupoActividadId,
      clienteOld:this.ClienteId()
    });


    this.formCli.get('codigo')?.disable()
    this.onAddorUpdate.emit()
    //this.formCli.get('ClienteId')?.disable();

    //this.formCli.reset(infoObjetivo)
  }




  async save() {
    this.isLoading.set(true)
    let form = this.formCli.getRawValue();

    //console.log("combinedData ", combinedData)
    try {
        if (this.ObjetivoId()) {
          let CordinadorCuenta = form.infoCoordinadorCuenta
          let Rubro = form.infoRubro
          // este es para cuando es update

          if( CordinadorCuenta.length === 1 && !CordinadorCuenta[0]?.ObjetivoId && String(CordinadorCuenta[0]?.PersonaId) === '')
            form.infoCoordinadorCuenta = []   
          
          if( Rubro.length === 1 && !Rubro[0]?.ClienteElementoDependienteRubroId && String(Rubro[0]?.RubroId) === '')
            form.infoRubro = []

          let result = await firstValueFrom(this.apiService.updateObjetivo(form, this.ObjetivoId()))
          //this.formCli.reset(result.data)
          //console.log("result ", result)
          this.formCli.patchValue({
            infoCoordinadorCuenta: result.data.infoCoordinadorCuenta,
            infoRubro: result.data.infoRubro,
            codigo: `${result.data.ClienteId}/${result.data.ClienteElementoDependienteId}`,
            clienteOld: result.data.ClienteId
          });
        
          //this.edit.set(false)

        } else {
         

          // este es para cuando es un nuevo registro

          let result = await firstValueFrom(this.apiService.addObjetivo(form))
          this.formCli.get('ClienteId')?.disable();
          this.ObjetivoId.set(result.data.ObjetivoNewId)
          this.ClienteId.set(result.data.ClienteId)
          this.ClienteElementoDependienteId.set(result.data.NewClienteElementoDependienteId)
          this.formCli.patchValue({
            codigo: `${result.data.ClienteId}/${result.data.NewClienteElementoDependienteId}`,
          })
          //this.addNew.set(true)
          
        }
        this.onAddorUpdate.emit()
        this.formCli.markAsUntouched()
        this.formCli.markAsPristine()
    } catch (e) {
        
    }
    this.isLoading.set(false)
}

  infoCoordinadorCuenta(): FormArray {
    return this.formCli.get("infoCoordinadorCuenta") as FormArray
  }

  infoRubro(): FormArray {
    return this.formCli.get("infoRubro") as FormArray
  }

  infoActividad(): FormArray {
    return this.formCli.get("infoActividad") as FormArray
  }

  addCoordinadorCuenta(e?: MouseEvent): void {

    e?.preventDefault();
    this.infoCoordinadorCuenta().push(this.fb.group({ ...this.objCoordinadorCuenta }))
    
  }

  addRubro(e?: MouseEvent): void {

    e?.preventDefault();
    this.infoRubro().push(this.fb.group({ ...this.objRubro }))
    
  }

  removeCordinadorCuenta(index: number, e: MouseEvent): void {
   
    e.preventDefault();
    if (this.infoCoordinadorCuenta().length > 1 ) {
      this.infoCoordinadorCuenta().removeAt(index)
    }
    this.formCli.markAsDirty();
  }

  removeRubro(index: number, e: MouseEvent): void {
   
    e.preventDefault();
    if (this.infoRubro().length > 1 ) {
      this.infoRubro().removeAt(index)
    }
    this.formCli.markAsDirty();
  }

  async deleteObjetivo() {
    const form = this.formCli.value
    await firstValueFrom(this.apiService.deleteObjetivos(form))
  }


}
