import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, Input, input, output, } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, FieldType, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, FileType, Aggregators, GroupTotalFormatters } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from 'src/app/services/api.service';
import { NgForm, FormArray, FormBuilder, ValueChangeEvent } from '@angular/forms';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { RubroSearchComponent } from '../../../shared/rubro-search/rubro-search.component';
import { GrupoActividadSearchComponent } from '../../../shared/grupo-actividad-search/grupo-actividad-search.component';
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
import { NzCheckboxGroupComponent, NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputGroupComponent } from 'ng-zorro-antd/input'

@Component({
    selector: 'app-objetivos-form',
    templateUrl: './objetivos-form.component.html',
    styleUrl: './objetivos-form.component.less',
    encapsulation: ViewEncapsulation.None,
    providers: [AngularUtilService],
    imports: [
        SHARED_IMPORTS,
        CommonModule,
        PersonalSearchComponent,
        RubroSearchComponent,
        ClienteSearchComponent,
        NzAutocompleteModule,
        NzSelectModule,
        FileUploadComponent,
        GrupoActividadSearchComponent,
        NzCheckboxModule,
        DetallePersonaComponent,
        NzInputGroupComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})


export class ObjetivosFormComponent {
  public router = inject(Router);
  visibleDrawer = signal(false)
  periodo = signal({ year: 0, month: 0 })
//  visibleDrawer: boolean = false

  objCoordinadorCuenta = { 
    ObjetivoId:0,
    PersonalId:0,
    ObjetivoPersonalJerarquicoId:0,
    ObjetivoPersonalJerarquicoComision: 0, 
    ObjetivoPersonalJerarquicoDescuentos:false,
    ObjetivoPersonalJerarquicoSeDescuentaTelefono:false,
  }
  objRubro = {
    ClienteElementoDependienteRubroId:0,
    RubroId:0
  }
  objDocRequerido = {
    DocumentoTipoCodigo:0
  }
  objActividad = {
    GrupoActividadObjetivoId:0,
    GrupoActividadId:0,
    GrupoActividadOriginal:0,
    GrupoActividadObjetivoDesde:new Date(),
    GrupoActividadObjetivoDesdeOriginal: ''
  }
  ObjetivoId = model(0)
  ClienteId = model(0)
  ClienteElementoDependienteId = model(0)
  selectedValueProvincia = null
  isLoading = signal(false)
  addNew = model()
  onAddorUpdate = output()
  files = []
  pristineChange = output<boolean>()
  optionsLugarHabilitacion = signal<any[]>([])

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
    CoberturaServicio:"",
    ContratoFechaDesde:"",
    ContratoFechaHasta:"",
    ContratoId:0,
    ClienteElementoDependienteContratoUltNro:0,
    RubroUltNro:0,
    DomicilioId:0,DomicilioDomCalle: "",
    DomicilioFulllAdress:"",
    DomicilioDomNro:0, DomicilioCodigoPostal: 0,DomicilioDomLugar:null,
    DomicilioProvinciaId: null,DomicilioLocalidadId: null, DomicilioBarrioId: null,
    infoCoordinadorCuenta: this.fb.array([this.fb.group({ ...this.objCoordinadorCuenta })]), 
    infoRubro: this.fb.array([this.fb.group({ ...this.objRubro })]), 
    infoDocRequerido: this.fb.array([this.fb.group({ ...this.objDocRequerido })]),
    infoActividad: this.fb.array([this.fb.group({ ...this.objActividad })]), 
    estado: 0,
    files:[],
    codigo: "",
    DireccionModificada: false,
    FechaModificada: false,
    ContratoFechaDesdeOLD:"",
    ContratoFechaHastaOLD:"",
    GrupoActividadId:0,
    habilitacion: [],
    GrupoActividadJerarquicoPersonalId:0,
  })

 
  $optionsProvincia = this.searchService.getProvincia();
  $optionsLocalidad = this.searchService.getLocalidad();
  $optionsBarrio = this.searchService.getBarrio();
  $optionsDescuento = this.searchService.getDescuento();
  $sucursales = this.searchService.getSucursales();
  $optionsDocumentoTipo = this.searchService.getDocumentoTipoOptions();

  onChangePeriodo(result: Date): void {
    if (result) {
      const date = new Date(result)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      this.periodo.set({ year, month })
    }
  }

  async ngOnInit() {
    const optionsLugarHabilitacion = await firstValueFrom(this.searchService.getLugarHabilitacionOptions())
    this.optionsLugarHabilitacion.set(optionsLugarHabilitacion)

    this.formCli.statusChanges.subscribe(() => {
      this.checkPristine();
   });

  }

  checkPristine() {
    this.pristineChange.emit(this.formCli.pristine);
  }

  async newRecord() {
    if (this.formCli.pristine) {

      this.ObjetivoId.set(0)
      this.ClienteId.set(0)
      this.ClienteElementoDependienteId.set(0)
    
      this.formCli.enable()
      this.formCli.get('codigo')?.disable()
      this.formCli.reset()
      this.infoCoordinadorCuenta().clear()
      this.infoRubro().clear()
      this.infoDocRequerido().clear()
      this.infoCoordinadorCuenta().push(this.fb.group({ ...this.objCoordinadorCuenta }))
      this.infoRubro().push(this.fb.group({ ...this.objRubro }))
      this.infoDocRequerido().push(this.fb.group({ ...this.objDocRequerido }))
      this.formCli.markAsPristine()
    }
  }

  async viewRecord(readonly:boolean) {
      if (this.ObjetivoId()) 
        await this.load()
      if (readonly){
        this.formCli.disable()
        this.formCli.get('GrupoActividadId')?.disable()
        this.formCli.get('RubroId')?.disable()
        this.formCli.get('infoRubro')?.disable()
        this.formCli.get('DocumentoTipoCodigo')?.disable()
        this.formCli.get('infoDocRequerido')?.disable()
      }else{
        this.formCli.enable()
      }
        
      this.formCli.get('codigo')?.disable()
      this.formCli.markAsPristine()        

   }



  async load() {

    let infoObjetivo = await firstValueFrom(this.searchService.getInfoObj(this.ObjetivoId(),this.ClienteId(),this.ClienteElementoDependienteId()))
   
    this.infoCoordinadorCuenta().clear()
    this.infoRubro().clear()
    this.infoDocRequerido().clear()
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

    infoObjetivo?.infoDocRequerido.forEach((obj: any) => {
      this.infoDocRequerido().push(this.fb.group({ ...this.objDocRequerido }))
    });
    
    if(infoObjetivo.infoDocRequerido.length == 0){
      this.infoDocRequerido().push(this.fb.group({ ...this.objDocRequerido }))
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
      this.infoDocRequerido().disable()
      this.infoActividad().disable()
    }else {
      this.infoCoordinadorCuenta().enable()
      this.infoRubro().enable()
      this.infoDocRequerido().enable()
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
      clienteOld:this.ClienteId(),
      GrupoActividadJerarquicoPersonalId: infoObjetivo.infoActividadJerarquico[0].GrupoActividadJerarquicoPersonalId
    });


    this.formCli.get('codigo')?.disable()
    //this.formCli.get('ClienteId')?.disable();
    this.formCli.get('GrupoActividadId')?.disable()
    this.formCli.get('RubroId')?.disable()
    this.formCli.get('DocumentoTipoCodigo')?.disable()
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

          if( CordinadorCuenta.length === 1 && !CordinadorCuenta[0]?.ObjetivoId && String(CordinadorCuenta[0]?.PersonalId) === '')
            form.infoCoordinadorCuenta = []   
          
          if( Rubro.length === 1 && !Rubro[0]?.ClienteElementoDependienteRubroId && String(Rubro[0]?.RubroId) === '')
            form.infoRubro = []

          let result = await firstValueFrom(this.apiService.updateObjetivo(form, this.ObjetivoId()))
          //this.formCli.reset(result.data)
          //console.log("result ", result)
          this.formCli.patchValue({
            infoCoordinadorCuenta: result.data.infoCoordinadorCuenta,
            infoRubro: result.data.infoRubro,
            infoActividad: result.data.infoActividad,
            codigo: `${result.data.ClienteId}/${result.data.ClienteElementoDependienteId}`,
            clienteOld: result.data.ClienteId,
            DomicilioId: result.data.DomicilioId
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
            infoCoordinadorCuenta: result.data.infoCoordinadorCuenta,
            infoRubro: result.data.infoRubro,
            infoActividad: result.data.infoActividad,
            codigo: `${result.data.ClienteId}/${result.data.ClienteElementoDependienteId}`,
            clienteOld: result.data.ClienteId,
            DomicilioId: result.data.DomicilioId
          });
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

  infoDocRequerido(): FormArray {
    return this.formCli.get("infoDocRequerido") as FormArray
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

  addDocRequerido(e?: MouseEvent): void {

    e?.preventDefault();
    this.infoDocRequerido().push(this.fb.group({ ...this.objDocRequerido }))
    
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
  
  removeDocRequerido(index: number, e: MouseEvent): void {
   
    e.preventDefault();
    if (this.infoDocRequerido().length > 1 ) {
      this.infoDocRequerido().removeAt(index)
    }
    this.formCli.markAsDirty();
  }

  async deleteObjetivo() {
    const form = this.formCli.value
    await firstValueFrom(this.apiService.deleteObjetivos(form))
    this.onAddorUpdate.emit()
    
  }

  closeDrawer(): void {
    this.visibleDrawer.set( false)
  }


}
