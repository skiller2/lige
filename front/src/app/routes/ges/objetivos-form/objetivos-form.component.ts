import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation, inject, viewChild, effect, ChangeDetectionStrategy, signal, model, Input, input, output, } from '@angular/core';
import { AngularUtilService } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { ApiService } from '../../../services/api.service';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { GrupoActividadSearchComponent } from '../../../shared/grupo-actividad-search/grupo-actividad-search.component';
import { ClienteSearchComponent } from '../../../shared/cliente-search/cliente-search.component';
import { BehaviorSubject, debounceTime, firstValueFrom, map, switchMap, startWith, Observable, of, filter, merge } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { DetallePersonaComponent } from '../detalle-persona/detalle-persona.component';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { FileUploadComponent } from "../../../shared/file-upload/file-upload.component"
import { Router } from '@angular/router';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { TableObjetivoDocumentoComponent } from '../../../routes/ges/table-objetivo-documentos/table-objetivo-documentos';
import { toSignal } from '@angular/core/rxjs-interop';
import { applyEach, disabled, FieldTree, form, FormField, hidden, readonly, required, submit, type ValidationError } from '@angular/forms/signals';

export interface CoordinadorCuenta {
  ObjetivoId: number,
  PersonalId: number,
  ObjetivoPersonalJerarquicoId: number,
  ObjetivoPersonalJerarquicoComision: string,
  ObjetivoPersonalJerarquicoDescuentos: boolean,
  ObjetivoPersonalJerarquicoSeDescuentaTelefono: boolean,
  DescuentoRetiros: boolean,
}

export interface Actividad {
  GrupoActividadObjetivoId: number,
  GrupoActividadId: number,
  GrupoActividadOriginal: number,
  GrupoActividadObjetivoDesde: Date | null,
  GrupoActividadObjetivoDesdeOriginal: string
}

export interface Objetivo {
  id: number,
  ClienteId: number,
  clienteOld: number,
  ClienteElementoDependienteId: number,
  ObjetivoId: number,
  Descripcion: string,
  SucursalId: number,
  CoberturaServicio: string,
  ContratoFechaDesde: string,
  ContratoFechaHasta: string,
  ContratoId: number,
  ClienteElementoDependienteContratoUltNro: number,
  RubroUltNro: number,
  DomicilioId: number, DomicilioDomCalle: string,
  DomicilioFulllAdress: string,
  DomicilioDomNro: number, DomicilioCodigoPostal: number, DomicilioDomLugar: string,
  DomicilioProvinciaId: number, DomicilioLocalidadId: number, DomicilioBarrioId: number,
  infoCoordinadorCuenta: CoordinadorCuenta[],
  rubrosCliente: any[],
  docsRequerido: any[],
  infoActividad: Actividad[],
  descuentoCoordinador: number[],
  descuentoLince: number[],
  descuentoCliente: number[],
  estado: number,
  files: any[],
  codigo: string,
  DireccionModificada: boolean,
  FechaModificada: boolean,
  ContratoFechaDesdeOLD: string,
  ContratoFechaHastaOLD: string,
  GrupoActividadId: number,
  habilitacion: any[],
  GrupoActividadJerarquicoPersonalId: number,
}

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
    TableObjetivoDocumentoComponent,
    FormField
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})


export class ObjetivosFormComponent {

  visibleDrawer = signal(false)
  periodo = signal({ year: 0, month: 0 })
  //  visibleDrawer: boolean = false
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
  readonly = input<boolean>(false)

  private apiService = inject(ApiService)
  private searchService = inject(SearchService)
  private router = inject(Router);
  private readonly coordinadorCuentaDefault: CoordinadorCuenta = {
    ObjetivoId: 0,
    PersonalId: 0,
    ObjetivoPersonalJerarquicoId: 0,
    ObjetivoPersonalJerarquicoComision: '',
    ObjetivoPersonalJerarquicoDescuentos: false,
    ObjetivoPersonalJerarquicoSeDescuentaTelefono: false,
    DescuentoRetiros: false,
  }
  private readonly actividadDefault: Actividad = {
    GrupoActividadObjetivoId: 0,
    GrupoActividadId: 0,
    GrupoActividadOriginal: 0,
    GrupoActividadObjetivoDesde: null,
    GrupoActividadObjetivoDesdeOriginal: ''
  }
  private readonly objetivoDefault: Objetivo = {
    id: 0,
    ClienteId: 0,
    clienteOld: 0,
    ClienteElementoDependienteId: 0,
    ObjetivoId: 0,
    Descripcion: "",
    SucursalId: 0,
    CoberturaServicio: "",
    ContratoFechaDesde: "",
    ContratoFechaHasta: "",
    ContratoId: 0,
    ClienteElementoDependienteContratoUltNro: 0,
    RubroUltNro: 0,
    DomicilioId: 0, DomicilioDomCalle: "",
    DomicilioFulllAdress: "",
    DomicilioDomNro: NaN, DomicilioCodigoPostal: NaN, DomicilioDomLugar: '',
    DomicilioProvinciaId: 0, DomicilioLocalidadId: 0, DomicilioBarrioId: 0,
    infoCoordinadorCuenta: [structuredClone(this.coordinadorCuentaDefault)],
    rubrosCliente: [],
    docsRequerido: [],
    infoActividad: [structuredClone(this.actividadDefault)],
    descuentoCoordinador: [],
    descuentoLince: [],
    descuentoCliente: [],
    estado: 0,
    files: [],
    codigo: "",
    DireccionModificada: false,
    FechaModificada: false,
    ContratoFechaDesdeOLD: "",
    ContratoFechaHastaOLD: "",
    GrupoActividadId: 0,
    habilitacion: [],
    GrupoActividadJerarquicoPersonalId: 0,
  }

  readonly objetivo = signal<Objetivo>(this.objetivoDefault);
  readonly formObjetivo = form(this.objetivo, (p) => {
    disabled(p, () => this.readonly()),
      disabled(p.codigo, () => true),
      applyEach(p.infoActividad, (infoActividad) => {
        disabled(infoActividad.GrupoActividadId, () => (this.ObjetivoId() ? true : false))
      });
  })

  childDocsGrid = viewChild.required<TableObjetivoDocumentoComponent>('docsGrid')

  optionsProvincia = toSignal(this.searchService.getProvincia(), { initialValue: [] });
  optionsLocalidad = toSignal(this.searchService.getLocalidad(), { initialValue: [] });
  optionsBarrio = toSignal(this.searchService.getBarrio(), { initialValue: [] });
  optionsDecuentosTipo = toSignal(this.searchService.getDecuentosTipoOptions(), { initialValue: [] });
  sucursales = toSignal(this.searchService.getSucursales(), { initialValue: [] });
  optionsDocumentoTipo = toSignal(this.searchService.getDocumentoTipoOptions(), { initialValue: [] });
  optionsLugarHabilitacion = toSignal(this.searchService.getLugarHabilitacionOptions(), { initialValue: [] });
  optionsRubroCliente = toSignal(this.searchService.getRubroClienteOptions(), { initialValue: [] });

  effect = effect(() => {
    const pristine = !this.formObjetivo().dirty()
    this.pristineChange.emit(pristine)
  })

  onChangePeriodo = effect(() => {
    const dirtyContratoFechaDesde = this.formObjetivo.ContratoFechaDesde().dirty()
    const dirtyContratoFechaHasta = this.formObjetivo.ContratoFechaHasta().dirty()
    if (dirtyContratoFechaDesde || dirtyContratoFechaHasta) {
      this.objetivo.update(m => ({
        ...m,
        FechaModificada: true
      }));
    }
  })

  onChangeDireccion = effect(() => {
    const dirtyDomicilioDomCalle = this.formObjetivo.DomicilioDomCalle().dirty()
    const dirtyDomicilioDomNro = this.formObjetivo.DomicilioDomNro().dirty()
    const dirtyDomicilioDomLugar = this.formObjetivo.DomicilioDomLugar().dirty()
    const dirtyDomicilioCodigoPostal = this.formObjetivo.DomicilioCodigoPostal().dirty()
    const dirtyDomicilioProvinciaId = this.formObjetivo.DomicilioProvinciaId().dirty()
    const dirtyDomicilioLocalidadId = this.formObjetivo.DomicilioLocalidadId().dirty()
    const dirtyDomicilioBarrioId = this.formObjetivo.DomicilioBarrioId().dirty()

    if (dirtyDomicilioDomCalle || dirtyDomicilioDomNro || dirtyDomicilioDomLugar || dirtyDomicilioCodigoPostal || dirtyDomicilioProvinciaId || dirtyDomicilioLocalidadId || dirtyDomicilioBarrioId) {
      this.objetivo.update(m => ({
        ...m,
        DireccionModificada: true
      }));
    }
  })

  async ngOnInit() {

    // this.formObj.statusChanges.subscribe(() => {
    //   this.checkPristine();
    // });

  }

  // checkPristine() {
  //   this.pristineChange.emit(!this.formObjetivo().dirty());
  // }

  resetForm() {
    this.objetivo.update(m => ({
      ...this.objetivoDefault
    }))
    this.formObjetivo().reset()
    // this.infoCoordinadorCuenta().clear()
    // this.infoCoordinadorCuenta().push(this.fb.group({ ...this.objCoordinadorCuenta }))
    // this.formObj.markAsPristine()
  }

  async newRecord() {
    if (!this.formObjetivo().dirty()) {

      this.formObjetivo().reset()
    }
  }

  async viewRecord() {
    if (this.ObjetivoId())
      await this.load()
  }



  async load() {

    let infoObjetivo = await firstValueFrom(this.searchService.getInfoObj(this.ObjetivoId(), this.ClienteId(), this.ClienteElementoDependienteId()))


    // this.infoCoordinadorCuenta().clear()
    // this.infoActividad().clear()

    if (!infoObjetivo.infoCoordinadorCuenta.length) {
      infoObjetivo.infoCoordinadorCuenta = [{ ...this.coordinadorCuentaDefault }]
    }
    if (!infoObjetivo.infoActividad?.length || !infoObjetivo.infoActividad[0]) {
      infoObjetivo.infoActividad = [{ ...this.actividadDefault }]
    }
    // infoObjetivo?.infoCoordinadorCuenta.forEach((obj: any) => {
    //   this.infoCoordinadorCuenta().push(this.fb.group({ ...this.objCoordinadorCuenta }))
    // });

    // if(infoObjetivo.infoCoordinadorCuenta.length == 0){
    //   this.infoCoordinadorCuenta().push(this.fb.group({ ...this.objCoordinadorCuenta }))

    // }  

    // infoObjetivo?.infoActividad.forEach((obj: any) => {
    //   this.infoActividad().push(this.fb.group({ ...this.objActividad }))
    // });

    // if(infoObjetivo.infoActividad.length == 0){
    //   this.infoActividad().push(this.fb.group({ ...this.objActividad }))
    // }

    // if (this.formObj.disabled){
    //   this.infoCoordinadorCuenta().disable()
    //   this.infoActividad().disable()
    // }else {
    //   this.infoCoordinadorCuenta().enable()
    //   this.infoActividad().disable()
    // }

    this.objetivo.update(m => ({
      ...m,
      ...infoObjetivo,
      DireccionModificada: false,
      FechaModificada: false,
      ContratoFechaDesdeOLD: infoObjetivo.ContratoFechaDesde,
      ContratoFechaHastaOLD: infoObjetivo.ContratoFechaHasta,
      codigo: `${infoObjetivo.ClienteId}/${infoObjetivo.ClienteElementoDependienteId}`,
      GrupoActividadId: infoObjetivo.infoActividad[0].GrupoActividadId,
      clienteOld: this.ClienteId(),
      GrupoActividadJerarquicoPersonalId: infoObjetivo.infoActividadJerarquico?.[0]?.GrupoActividadJerarquicoPersonalId ?? 0
    }));
    setTimeout(() => { this.formObjetivo().reset() }, 400);
    // this.formObj.patchValue({
    //   DireccionModificada:false,
    //   FechaModificada:false,
    //   ContratoFechaDesdeOLD:infoObjetivo.ContratoFechaDesde,
    //   ContratoFechaHastaOLD:infoObjetivo.ContratoFechaHasta,
    //   codigo: `${infoObjetivo.ClienteId}/${infoObjetivo.ClienteElementoDependienteId}`,
    //   GrupoActividadId: infoObjetivo.infoActividad.GrupoActividadId,
    //   clienteOld: this.ClienteId(),
    //   GrupoActividadJerarquicoPersonalId: infoObjetivo.infoActividadJerarquico[0].GrupoActividadJerarquicoPersonalId
    // });


    // this.formObj.get('codigo')?.disable()
    // //this.formObj.get('ClienteId')?.disable();
    // this.formObj.get('GrupoActividadId')?.disable()
    // this.formObj.get('DocumentoTipoCodigo')?.disable()
    // // this.formObj.reset(infoObjetivo)
  }

  async save() {
    await submit(this.formObjetivo, async (form) => {
      this.isLoading.set(true)
      let value = form().value();
      try {
        if (value.id) { //UPDATE
          let CordinadorCuenta = value.infoCoordinadorCuenta

          if (CordinadorCuenta.length === 1 && !CordinadorCuenta[0]?.ObjetivoId && String(CordinadorCuenta[0]?.PersonalId) === '')
            value.infoCoordinadorCuenta = []


          let result = await firstValueFrom(this.apiService.updateObjetivo(value, this.objetivo().id))
          //this.formObj.reset(result.data)

          this.objetivo.update(m => ({
            ...m,
            infoCoordinadorCuenta: result.data.infoCoordinadorCuenta?.length ? result.data.infoCoordinadorCuenta : [{ ...this.coordinadorCuentaDefault }],
            infoActividad: result.data.infoActividad,
            codigo: `${result.data.ClienteId}/${result.data.ClienteElementoDependienteId}`,
            clienteOld: result.data.ClienteId,
            DomicilioId: result.data.DomicilioId
          }));
          // this.formObj.patchValue({
          //   infoCoordinadorCuenta: result.data.infoCoordinadorCuenta,
          //   infoActividad: result.data.infoActividad,
          //   codigo: `${result.data.ClienteId}/${result.data.ClienteElementoDependienteId}`,
          //   clienteOld: result.data.ClienteId,
          //   DomicilioId: result.data.DomicilioId
          // });

          //this.edit.set(false)

        } else { //INSERT (nuevo registro)

          let result = await firstValueFrom(this.apiService.addObjetivo(value))
          const infoObjetivo = result.data
          if (!infoObjetivo.infoCoordinadorCuenta.length) {
            infoObjetivo.infoCoordinadorCuenta = [{ ...this.coordinadorCuentaDefault }]
          }
          if (!infoObjetivo.infoActividad?.length || !infoObjetivo.infoActividad[0]) {
            infoObjetivo.infoActividad = [{ ...this.actividadDefault }]
          }
          // this.formObj.get('ClienteId')?.disable();

          this.objetivo.update(m => ({
            ...m,
            ...infoObjetivo,
            DireccionModificada: false,
            FechaModificada: false,
            ContratoFechaDesdeOLD: infoObjetivo.ContratoFechaDesde,
            ContratoFechaHastaOLD: infoObjetivo.ContratoFechaHasta,
            codigo: `${infoObjetivo.ClienteId}/${infoObjetivo.ClienteElementoDependienteId}`,
            GrupoActividadId: infoObjetivo.infoActividad[0].GrupoActividadId,
            clienteOld: infoObjetivo.ClienteId,
            GrupoActividadJerarquicoPersonalId: infoObjetivo.infoActividadJerarquico?.[0]?.GrupoActividadJerarquicoPersonalId ?? 0
          }));

          // this.formObj.reset(infoObjetivo)
          // this.formObj.patchValue({
          //   DireccionModificada:false,
          //   FechaModificada:false,
          //   ContratoFechaDesdeOLD:infoObjetivo.ContratoFechaDesde,
          //   ContratoFechaHastaOLD:infoObjetivo.ContratoFechaHasta,
          //   codigo: `${infoObjetivo.ClienteId}/${infoObjetivo.ClienteElementoDependienteId}`,
          //   GrupoActividadId: infoObjetivo.infoActividad.GrupoActividadId,
          //   clienteOld: infoObjetivo.ClienteId,
          //   GrupoActividadJerarquicoPersonalId: infoObjetivo.infoActividadJerarquico[0].GrupoActividadJerarquicoPersonalId
          // });

          //this.addNew.set(true)
          // this.mostrarDocs.set(true)
        }

        if (this.mostrarDocs()) {
          this.childDocsGrid().refreshGrid()
        }

        this.onAddorUpdate.emit()
      } catch (e) {

      }
      this.isLoading.set(false)
    })
  }

  addCoordinadorCuenta(e?: MouseEvent): void {
    e?.preventDefault();

    const newCoordinadorCuenta = structuredClone(this.coordinadorCuentaDefault)

    this.objetivo.update(m => ({
      ...m,
      infoCoordinadorCuenta: [...m.infoCoordinadorCuenta, newCoordinadorCuenta],
    }));
  }

  removeCordinadorCuenta(index: number, e: MouseEvent): void {
    e.preventDefault();
    this.objetivo.update(m => ({
      ...m,
      infoCoordinadorCuenta: m.infoCoordinadorCuenta.filter((_, i) => i !== index),
    }));

    if (this.objetivo().infoCoordinadorCuenta.length == 0) {
      this.addCoordinadorCuenta(undefined)
    }
  }

  async deleteObjetivo() {
    const form = this.formObjetivo().value()
    try {
      await firstValueFrom(this.apiService.deleteObjetivos(form));
      this.onAddorUpdate.emit();
      this.router.navigate(['/ges', 'objetivos', 'listado']);
    } catch (error) {
    }
  }

  closeDrawer(): void {
    this.visibleDrawer.set(false)
  }

}
