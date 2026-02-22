import { CommonModule } from '@angular/common';
import { Component, ViewChild, Injector, ChangeDetectorRef, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, Input, input, output, } from '@angular/core';
import { AngularGridInstance, AngularUtilService, Column, Editors, Formatters, GridOption, EditCommand, SlickGlobalEditorLock, compareObjects, Aggregators, GroupTotalFormatters } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from 'src/app/services/api.service';
import { NgForm, FormArray, FormBuilder, ValueChangeEvent } from '@angular/forms';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
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
import { TableObjetivoDocumentoComponent } from 'src/app/routes/ges/table-objetivo-documentos/table-objetivo-documentos';

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
        ClienteSearchComponent,
        NzAutocompleteModule,
        NzSelectModule,
        FileUploadComponent,
        GrupoActividadSearchComponent,
        NzCheckboxModule,
        DetallePersonaComponent,
        NzInputGroupComponent,
        TableObjetivoDocumentoComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})


export class ObjetivosFormComponent {
  
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

  objActividad = {
    GrupoActividadObjetivoId:0,
    GrupoActividadId:0,
    GrupoActividadOriginal:0,
    GrupoActividadObjetivoDesde:new Date(),
    GrupoActividadObjetivoDesdeOriginal: ''
  }
  ObjetivoId = input(0)
  ClienteId = input(0)
  ClienteElementoDependienteId = input(0)
  selectedValueProvincia = null
  isLoading = signal(false)
  addNew = model()
  onAddorUpdate = output()
  files = []
  pristineChange = output<boolean>()
  mostrarDocs = model<boolean>(false)

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private injector = inject(Injector)
  private router = inject(Router);


  fb = inject(FormBuilder)
  formObj = this.fb.group({
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
    rubrosCliente: [],  
    docsRequerido: [],
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

  clienteIdForm():number {
    const value = this.formObj.get("ClienteId")?.value
    if (value) {
      return value
    }
    return 0
  }

  clienteElementoDependienteIdForm():number {
    const value = this.formObj.get("ClienteElementoDependienteId")?.value
    if (value) {
      return value
    }
    return 0
  }

  idForm():number {
    const value = this.formObj.get("id")?.value
    if (value) {
      return value
    }
    return 0
  }

  childDocsGrid = viewChild.required<TableObjetivoDocumentoComponent>('docsGrid')
 
  $optionsProvincia = this.searchService.getProvincia();
  $optionsLocalidad = this.searchService.getLocalidad();
  $optionsBarrio = this.searchService.getBarrio();
  $optionsDescuento = this.searchService.getDescuento();
  $sucursales = this.searchService.getSucursales();
  $optionsDocumentoTipo = this.searchService.getDocumentoTipoOptions();
  $optionsLugarHabilitacion = this.searchService.getLugarHabilitacionOptions();
  $optionsRubroCliente = this.searchService.getRubroClienteOptions();

  onChangePeriodo(result: Date): void {
    if (result) {
      const date = new Date(result)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      this.periodo.set({ year, month })
    }
  }

  async ngOnInit() {

    this.formObj.statusChanges.subscribe(() => {
      this.checkPristine();
   });

  }

  checkPristine() {
    this.pristineChange.emit(this.formObj.pristine);
  }

  resetForm() {
    this.formObj.reset()
    this.infoCoordinadorCuenta().clear()
    this.infoCoordinadorCuenta().push(this.fb.group({ ...this.objCoordinadorCuenta }))
    this.formObj.markAsPristine()
  }

  async newRecord() {
    if (this.formObj.pristine) {
    
      this.formObj.enable()
      this.formObj.get('codigo')?.disable()
      this.formObj.reset()
      this.infoCoordinadorCuenta().clear()
      this.infoCoordinadorCuenta().push(this.fb.group({ ...this.objCoordinadorCuenta }))
      this.formObj.markAsPristine()
    }
  }

  async viewRecord(readonly:boolean) {
      if (this.ObjetivoId()) 
        await this.load()
      if (readonly){
        this.formObj.disable()
        this.formObj.get('GrupoActividadId')?.disable()
        this.formObj.get('DocumentoTipoCodigo')?.disable()
      }else{
        this.formObj.enable()
      }
        
      this.formObj.get('codigo')?.disable()
      this.formObj.markAsPristine()        

   }



  async load() {

    let infoObjetivo = await firstValueFrom(this.searchService.getInfoObj(this.ObjetivoId(),this.ClienteId(),this.ClienteElementoDependienteId()))
    // console.log('infoObjetivo: ', infoObjetivo);
    
    this.infoCoordinadorCuenta().clear()
    this.infoActividad().clear()
    
    infoObjetivo?.infoCoordinadorCuenta.forEach((obj: any) => {
      this.infoCoordinadorCuenta().push(this.fb.group({ ...this.objCoordinadorCuenta }))
    });

    if(infoObjetivo.infoCoordinadorCuenta.length == 0){
      this.infoCoordinadorCuenta().push(this.fb.group({ ...this.objCoordinadorCuenta }))
     
    }  

    infoObjetivo?.infoActividad.forEach((obj: any) => {
      this.infoActividad().push(this.fb.group({ ...this.objActividad }))
    });
    
    if(infoObjetivo.infoActividad.length == 0){
      this.infoActividad().push(this.fb.group({ ...this.objActividad }))
    }
    
    if (this.formObj.disabled){
      this.infoCoordinadorCuenta().disable()
      this.infoActividad().disable()
    }else {
      this.infoCoordinadorCuenta().enable()
      this.infoActividad().disable()
    }

    this.formObj.reset(infoObjetivo)
    this.formObj.patchValue({
      DireccionModificada:false,
      FechaModificada:false,
      ContratoFechaDesdeOLD:infoObjetivo.ContratoFechaDesde,
      ContratoFechaHastaOLD:infoObjetivo.ContratoFechaHasta,
      codigo: `${infoObjetivo.ClienteId}/${infoObjetivo.ClienteElementoDependienteId}`,
      GrupoActividadId: infoObjetivo.infoActividad.GrupoActividadId,
      clienteOld:this.ClienteId(),
      GrupoActividadJerarquicoPersonalId: infoObjetivo.infoActividadJerarquico[0].GrupoActividadJerarquicoPersonalId
    });


    this.formObj.get('codigo')?.disable()
    //this.formObj.get('ClienteId')?.disable();
    this.formObj.get('GrupoActividadId')?.disable()
    this.formObj.get('DocumentoTipoCodigo')?.disable()
    //this.formObj.reset(infoObjetivo)
  }




  async save() {
    this.isLoading.set(true)
    let form = this.formObj.getRawValue();
    try {
        if (this.idForm()) {
          let CordinadorCuenta = form.infoCoordinadorCuenta
          // este es para cuando es update

          if( CordinadorCuenta.length === 1 && !CordinadorCuenta[0]?.ObjetivoId && String(CordinadorCuenta[0]?.PersonalId) === '')
            form.infoCoordinadorCuenta = []   
          

          let result = await firstValueFrom(this.apiService.updateObjetivo(form, this.idForm()))
          //this.formObj.reset(result.data)
          //console.log("result ", result)
          this.formObj.patchValue({
            infoCoordinadorCuenta: result.data.infoCoordinadorCuenta,
            infoActividad: result.data.infoActividad,
            codigo: `${result.data.ClienteId}/${result.data.ClienteElementoDependienteId}`,
            clienteOld: result.data.ClienteId,
            DomicilioId: result.data.DomicilioId
          });
        
          //this.edit.set(false)

        } else {

          // este es para cuando es un nuevo registro

          let result = await firstValueFrom(this.apiService.addObjetivo(form))
          const infoObjetivo = result.data
          this.formObj.get('ClienteId')?.disable();

          this.formObj.reset(infoObjetivo)
          this.formObj.patchValue({
            DireccionModificada:false,
            FechaModificada:false,
            ContratoFechaDesdeOLD:infoObjetivo.ContratoFechaDesde,
            ContratoFechaHastaOLD:infoObjetivo.ContratoFechaHasta,
            codigo: `${infoObjetivo.ClienteId}/${infoObjetivo.ClienteElementoDependienteId}`,
            GrupoActividadId: infoObjetivo.infoActividad.GrupoActividadId,
            clienteOld: infoObjetivo.ClienteId,
            GrupoActividadJerarquicoPersonalId: infoObjetivo.infoActividadJerarquico[0].GrupoActividadJerarquicoPersonalId
          });
          
          //this.addNew.set(true)
          this.mostrarDocs.set(true)
        }

        if (this.mostrarDocs()) {
          this.childDocsGrid().refreshGrid()
        }

        this.onAddorUpdate.emit()
        this.formObj.markAsUntouched()
        this.formObj.markAsPristine()
    } catch (e) {
        
    }
    this.isLoading.set(false)
}

  infoCoordinadorCuenta(): FormArray {
    return this.formObj.get("infoCoordinadorCuenta") as FormArray
  }

  infoActividad(): FormArray {
    return this.formObj.get("infoActividad") as FormArray
  }

  addCoordinadorCuenta(e?: MouseEvent): void {

    e?.preventDefault();
    this.infoCoordinadorCuenta().push(this.fb.group({ ...this.objCoordinadorCuenta }))
    
  }

  removeCordinadorCuenta(index: number, e: MouseEvent): void {
   
    e.preventDefault();
    if (this.infoCoordinadorCuenta().length > 1 ) {
      this.infoCoordinadorCuenta().removeAt(index)
    }
    this.formObj.markAsDirty();
  }

  async deleteObjetivo() {
    const form = this.formObj.value
    try {
      await firstValueFrom(this.apiService.deleteObjetivos(form));
      this.onAddorUpdate.emit();
      this.router.navigate(['/ges', 'objetivos', 'listado']);
    } catch (error) {
    }
  }

  closeDrawer(): void {
    this.visibleDrawer.set( false)
  }


}
