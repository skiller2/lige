import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Filtro, Options, Selections } from '../schemas/filtro';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SearchService } from '../../services/search.service';
import { BehaviorSubject, firstValueFrom, map } from 'rxjs';
import { SHARED_IMPORTS } from '@shared';
import { FechaSearchComponent } from '../fecha-search/fecha-search.component';
import { TipoMovimientoSearchComponent } from '../tipo-movimiento-search/tipo-movimiento-search.component';
import { ObjetivoSearchComponent } from '../objetivo-search/objetivo-search.component';
import { ClienteSearchComponent } from '../cliente-search/cliente-search.component';
import { EfectoSearchComponent } from '../efecto-search/efecto-search';
import { EfectoIndividualSearchComponent } from '../efecto-individual-search/efecto-individual-search';
import { TipoAsociadoCategoriaSearchComponent } from '../tipo-asociado-categoria-search/tipo-asociado-categoria-search';
import { PersonalSearchComponent } from '../personal-search/personal-search.component';
import { GrupoActividadSearchComponent } from '../grupo-actividad-search/grupo-actividad-search.component';
import { RequirenteSearchComponent } from '../requirente-search/requirente-search.component';
import { DescripcionProductoSearchComponent } from "../../shared/descripcion-producto-search/descripcion-producto-search.component"
import { AdministradorSearchComponent } from "../../shared/administrador-search/administrador-search.component"
import { SeguroSearchComponent } from "../../shared/seguro-search/seguro-search.component"
import { ApiService } from '../../services/api.service';
import { NumberAdvancedSearchComponent } from '../number-advanced-search/number-advanced-search';
import { PeriodoSearchComponent } from '../periodo-search/periodo-search';
import { AsyncPipe } from '@angular/common';

type listOptionsT = {
  filtros: any[],
  sort: any,
}


const noop = () => { };

export const CUSTOM_INPUT_CONTROL_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => FiltroBuilderComponent),
  multi: true,
};

@Component({
  selector: 'shared-filtro-builder',
  imports: [...SHARED_IMPORTS, CommonModule, FechaSearchComponent, TipoMovimientoSearchComponent,
    ObjetivoSearchComponent, ClienteSearchComponent, PersonalSearchComponent, GrupoActividadSearchComponent, EfectoSearchComponent, EfectoIndividualSearchComponent,
    TipoAsociadoCategoriaSearchComponent, RequirenteSearchComponent, AdministradorSearchComponent, SeguroSearchComponent, NumberAdvancedSearchComponent, PeriodoSearchComponent, AsyncPipe
  ],
  templateUrl: './filtro-builder.component.html',
  styles: [],
  providers: [CUSTOM_INPUT_CONTROL_VALUE_ACCESSOR, DatePipe]
})
export class FiltroBuilderComponent implements ControlValueAccessor {
  readonly startFilters = input<any[]>([])
  readonly fieldsToSelect = input<any[]>([])

  private searchService = inject(SearchService)
  private elRef = inject(ElementRef)
  private datePipe = inject(DatePipe)
  private apiService = inject(ApiService);

  //conditionsToSelect = ['AND', 'OR'];
  //operatorsToSelect = ['LIKE', '>', '<', '>=', '<=', '!=', '<>', '='];

  @Output() optionsChange = new EventEmitter<Options>();
  //options = model<Options>({
  //    filtros: [],
  //    sort: null
  //  })
  formChange$ = new BehaviorSubject('');

  $optionsEstadoCust = this.searchService.getEstadoCustodia();
  $optionsEstadoPrest = this.searchService.getEstadoPrestamo();
  $optionsEstadoExcepcionAsistencia = this.searchService.getEstadoExcepcionAsistencia();
  $optionsTipoPrest = this.searchService.getTipoPrestamo();
  $optionsSitRevista = this.searchService.getSitRevistaOptions();
  $optionsProducto = this.searchService.getTipoProducto();
  $optionsTipoDocumento = this.searchService.getDocumentoTipoOptions();
  $optionsNivelEstudio = this.searchService.getEstudioSearch();
  $optionsAplicaA = this.searchService.getAplicaAOptions();
  $optionsModalidadCurso = this.searchService.getModalidadCursoSearch();
  $optionsTipoCuenta = this.apiService.getTipoCuenta();
  $optionsTipoNovedad = this.searchService.getTipoNovedad();
  $optionsTipoDescuento = this.searchService.getDecuentosTipoOptions();
  $optionsProcAutoEstado = this.searchService.getProcAutoEstadosOptions();
  $optionsSucursales = this.searchService.getSucursales();
  $optionsMetodologias = this.searchService.getMetodologia();
  $optionsProvincias = this.apiService.getProvinciasOptions();
  $optionsLocalidades = this.apiService.getLocalidadesOptions();
  $optionsBarrios = this.apiService.getBarriosOptions();
  $optionsLugarHabilitacion = this.searchService.getLugarHabilitacionOptions();
  $optionsHabilitacionClase = this.searchService.getHabilitacionClaseOptions();
  $optionsHabilitacionEstado = this.searchService.getEstadosHabilitaciones();

  private _options: Options = {
    filtros: [],
    sort: null,
  };

  $optionsSepaga = this.searchService.getSePaga();
  $optionsInactivo = this.searchService.getInactivo();
  $optionsInactivoBoolean = this.searchService.getInactivoBoolean();
  $optionsActivoBoolean = this.searchService.getBooleanSiNo();
  $optionsGrupoActividad = this.searchService.getTipo();
  $optionsComprobanteTipo = this.searchService.getComprobanteTipoSearch();
  $optionsCurso = this.searchService.getCursoSearch();
  $optionsCompaniaSeguro = this.searchService.getCompaniaSeguroSearch();
  $optionsTipoSeguro = this.searchService.getTipoSeguroSearch();
  $optionsCentroCapacitacion = this.searchService.getCentroCapacitacionSearch()

  isFiltroBuilder = false;

  listOfSelectedValue = [];
  selections: Selections = {
    field: { searchComponent: '', name: '', type: '', searchType: '' },
    condition: 'AND',
    operator: '',
    value: null,
    label: '',
    forced: false
  };

  valueExtended = { fullName: '' }

  private loggingEffect = effect(() => {
    if (this.fieldsToSelect() && this.startFilters()) {
      for (const filter of this.startFilters()) {
        this.addFilter(filter.field, filter.condition, filter.operator, filter.value, filter.forced)
      }
    }
  });


  ngOnInit(): void {
  }

  handleTagInteraction() {
    this.isFiltroBuilder = true;
  }

  verifySelections(): boolean {
    const type = (this.selections.field.searchType) ? this.selections.field.searchType : (this.selections.field.type) ? this.selections.field.type : 'string'

    if (this.selections.field.searchComponent && this.selections.operator == "")
      this.selections.operator = "="
    let value = String(this.selections.value)
    if (value.startsWith('>=')) {
      this.selections.value = value.substring(2)
      value = this.selections.value
      this.selections.operator = '>='
    }

    if (value.startsWith('<=')) {
      this.selections.value = value.substring(2)
      value = this.selections.value
      this.selections.operator = '<='
    }

    if (value.startsWith('!=') || value.startsWith('<>')) {
      this.selections.value = value.substring(2)
      value = this.selections.value
      this.selections.operator = '<>'
    }

    if (value.startsWith('>')) {
      this.selections.value = value.substring(1)
      value = this.selections.value
      this.selections.operator = '>'
    }

    if (value.startsWith('<')) {
      this.selections.value = value.substring(1)
      value = this.selections.value
      this.selections.operator = '<'
    }

    if (value.startsWith('=')) {
      this.selections.value = value.substring(1)
      value = this.selections.value
      this.selections.operator = '='
    }

    if (this.selections.operator == '') {
      switch (type) {
        case 'date':

          break;
        case 'numberAdvanced':
          break;
        case 'number':
        case 'float':
        case 'boolean':
          this.selections.operator = '='
          break;

        default:
          this.selections.operator = 'LIKE'
          break;
      }
    }
    return (this.selections.field.name && this.selections.condition && this.selections.operator) ? true : false
  }

  handleInputConfirm() {

    if (this.verifySelections()) {
      let value: any

      if (this.selections.field.searchType == 'numberAdvanced') {
        if (this.selections.value && typeof this.selections.value === 'object' && this.selections.value.operator !== undefined && this.selections.value.value !== undefined) {
          this.selections.operator = this.selections.value.operator
          this.selections.value = this.selections.value.value
        }
      }

      if ((this.selections.field.type == 'date' || this.selections.field.type == 'dateTime') && this.selections.field.searchComponent != 'inputForNumberAdvancedSearch' && this.selections.value instanceof Date != true) {
        const value = new Date(this.selections.value.value)
        const operator = this.selections.value.operator
        this.selections.value = value
        this.selections.operator = operator
      }

      if (this.selections.value instanceof String || this.selections.value instanceof Array)
        Array.isArray(this.selections.value) ? value = this.selections.value : value = String(this.selections.value).trim().split(/\s+/)
      else
        value = [this.selections.value]


      // Establecer el label apropiado
      if (this.selections.label == "") {
        if (this.valueExtended?.fullName) {
          this.selections.label = this.valueExtended.fullName;
        } else if (this.selections.value == "" || ((this.selections.value instanceof Date) && isNaN(this.selections.value.getTime()))) {
          this.selections.label = "Vacio";
        } else {
          this.selections.label = (this.selections.value instanceof Date) ? String(this.datePipe.transform(this.selections.value)) : String(this.selections.value);
        }
      }

      this.appendFiltro(
        this.selections as any,
        value,
        `${this.selections.field.name} ${this.selections.operator} ${this.selections.label}`,
        !this.selections.forced,
        (this.selections.field.type) ? this.selections.field.type : 'string'
      )
    }
    this.resetSelections();
    this.isFiltroBuilder = false;

    let inputSearch: HTMLElement = this.elRef.nativeElement.querySelector('nz-select-clear');
    //    let inputSearch: HTMLElement = document.getElementsByTagName("nz-select-clear")[0] as HTMLElement;

    if (inputSearch)
      inputSearch.click()
  }


  //
  // Filtros
  //

  appendFiltro(
    selections: { field: any; condition: any; operator: any },
    valueToFilter: any[],
    tagName: string,
    closeable: boolean,
    type: string
  ): Filtro {
    const filtro = {
      index: selections.field.field,
      condition: selections.condition,
      operador: selections.operator,
      valor: valueToFilter,
      type: type,
      tagName: tagName,
      closeable

    };

    // NOTE: Codi por si no se quiere que se repita el filtro
//    const existingIndex = this.localoptions.filtros.findIndex(f => f.index === filtro.index);
    
//    if (existingIndex !== -1) {
//      this.localoptions.filtros[existingIndex] = filtro;
//    } else {
      this.localoptions.filtros.push(filtro);
//    }

    this.optionsChange.emit(this.localoptions);
    return filtro;

  }

  removeFiltro(indexToRemove: number) {
    this.localoptions.filtros.splice(indexToRemove, 1);
    this.optionsChange.emit(this.localoptions);
    //    this.options.set(this.localoptions);
  }

  async editFiltro(indexToEdit: number) {
    const filtro = this.localoptions.filtros[indexToEdit];
    if (!filtro || !filtro.closeable) return;
    const fieldObj = this.fieldsToSelect().find(f => f.field === filtro.index);
    if (!fieldObj || fieldObj.hidden) return;

    // Simplificar obtención de value
    let value = Array.isArray(filtro.valor) && filtro.valor.length === 1 ? filtro.valor[0] : filtro.valor;

    // Extraer label de tagName
    let extractedLabel = '';
    const tagName = filtro.tagName;
    if (filtro.operador) {
      const opPattern = new RegExp(`\\s+${filtro.operador}\\s+`);
      const split = tagName.split(opPattern);
      if (split.length > 1) {
        extractedLabel = split[1];
      } else if (split.length === 1) {
        extractedLabel = split[0];
      }
    }

    // Si no se pudo extraer, fallback sobre fieldName
    if (!extractedLabel) {
      const fieldName = fieldObj.name;
      const afterField = tagName.slice(tagName.indexOf(fieldName) + fieldName.length).trim();
      const operators = ['LIKE', '>=', '<=', '!=', '<>', '>', '<', '='];
      for (const op of operators) {
        if (afterField.startsWith(op + ' ')) {
          extractedLabel = afterField.substring(op.length + 1).trim();
          break;
        }
      }
      if (!extractedLabel) extractedLabel = afterField.trim();
    }

    // Reset valueExtended
    this.valueExtended = { fullName: '' };

    // Ajustar valueExtended segun el componente de búsqueda
    let shouldUseExtendedLabel = false;
    switch (fieldObj.searchComponent) {
      case 'inputForPersonalSearch':
        shouldUseExtendedLabel = true;
        try {
          const person = await firstValueFrom(this.searchService.getPersonFromName('PersonalId', value));
          if (person?.length > 0) {
            this.valueExtended = { fullName: person[0].fullName };
            extractedLabel = person[0].fullName;
          }
        } catch (e) {
          console.error('Error loading person data:', e);
        }
        break;
      case 'inputForClientSearch':
        shouldUseExtendedLabel = true;
        try {
          const cliente = await firstValueFrom(this.searchService.getClientFromName('ClienteId', value));
          if (cliente?.length > 0) {
            this.valueExtended = { fullName: cliente[0].ClienteDenominacion };
            extractedLabel = cliente[0].ClienteDenominacion;
          }
        } catch (e) {
          console.error('Error loading client data:', e);
        }
        break;
      case 'inputForEfectoSearch':
      case 'inputForEfectoIndividualSearch':
      case 'inputForGrupoActividadSearch':
        shouldUseExtendedLabel = true;
        break;
      default:
        if (extractedLabel) this.valueExtended = { fullName: extractedLabel };
        break;
    }

    // Fecha y NumberAdvanced: ambos usan {operator, value}
    if (
      ((fieldObj.type === 'date' || fieldObj.type === 'dateTime') && fieldObj.searchComponent === 'inputForFechaSearch') ||
      fieldObj.searchType === 'numberAdvanced'
    ) {
      value = { operator: filtro.operador, value };
    }

    // Selects múltiples
    const multiSelects = [
      'inputForSituacionRevistaSearch',
      'inputForTipoDocumentoSearch',
      'inputForLugarHabilitacionSearch',
      'inputForHabilitacionClaseSearch',
      'inputForHabilitacionEstadoSearch'
    ];
    if (multiSelects.includes(fieldObj.searchComponent)) {
      const values = String(value).split(';');
      this.listOfSelectedValue = values.map(v => ({ value: v, label: v })) as any;
    }

    // Actualizar selections
    // Resetear label para campos simples (sin searchComponent) y numberAdvanced,
    // para que se recalcule con el nuevo valor en handleInputConfirm()
    const shouldResetLabel = shouldUseExtendedLabel || !fieldObj.searchComponent || fieldObj.searchType === 'numberAdvanced';
    this.selections = {
      field: fieldObj,
      condition: filtro.condition || 'AND',
      operator: filtro.operador,
      value,
      label: shouldResetLabel ? '' : extractedLabel,
      forced: !filtro.closeable,
    };

    this.isFiltroBuilder = true;

    setTimeout(() => {
      const input = this.elRef.nativeElement.querySelector('input[nz-input]');
      input?.focus();
    }, 100);
  }

  resetSelections() {
    this.selections = {
      field: { searchComponent: '', name: '', type: '', searchType: '' },
      condition: 'AND',
      operator: '',
      value: '',
      label: '',
      forced: false
    };
    this.valueExtended = { fullName: '' }
  }

  //Control Value Accessor

  //The internal data model

  //Placeholders for the callbacks which are later provided
  //by the Control Value Accessor
  private onTouchedCallback: () => void = noop;
  private onChangeCallback: (_: any) => void = noop;

  //get accessor
  get localoptions(): Options {
    return this._options;
  }

  //set accessor including call the onchange callback
  set localoptions(v: any) {
    if (v !== this._options) {
      this._options = v;
      this.onChangeCallback(v);
    }
  }

  //Set touched on blur
  onBlur() {
    this.onTouchedCallback();
  }

  //From ControlValueAccessor interface
  writeValue(value: any) {
    if (value !== this._options) {
      this._options = value;
    }
  }

  //From ControlValueAccessor interface
  registerOnChange(fn: any) {
    this.onChangeCallback = fn;
  }

  //From ControlValueAccessor interface
  registerOnTouched(fn: any) {
    this.onTouchedCallback = fn;
  }

  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };

  onOptionChange() {
  }

  filterFields(field: any) {
    return !field.searchHidden
  }

  selectedValueSucursal(val: any) {
    if (val) {
      this.selections.value = val.SucursalId;
      this.valueExtended = { fullName: val.SucursalDescripcion };
    }
  }

  selectedValueSePaga(val: any) {
    if (val) {
      this.selections.value = val
    }
  }
  selectedValueInactivo(val: any) {
    if (val !== null && val !== undefined) {
      this.selections.value = val
      this.selections.label = (val == 1 || val == '1' || val === true) ? 'SI' : 'NO'
    }
  }

  selectedValueInactivoBoolean(val: any) {
    if (val !== null && val !== undefined) {
      this.selections.value = val
      this.selections.label = (val == 1 || val == '1' || val === true) ? 'SI' : 'NO'
    }
  }

  selectedValueGrupoActividad(val: any) {
    if (val) {
      this.selections.value = val
      //this.valueExtended = { fullName: val.label }
    }
  }

  selectedValueComprobanteTipo(val: any) {
    if (val) {
      this.selections.value = val
      //this.valueExtended = { fullName: val.label }
    }
  }

  async selectedValueNivelEstudio(val: any) {

    if (val) {
      this.selections.value = val
      const res = await firstValueFrom(this.searchService.getEstudioSearchId(val))
      this.selections.label = res[0].TipoEstudioDescripcion
    }
  }

  async selectedValueCurso(val: any) {

    if (val) {
      this.selections.value = val
      const res = await firstValueFrom(this.searchService.getCursoSearchId(val))
      this.selections.label = res[0].CursoHabilitacionDescripcion
    }
  }

  async selectedValueCompaniaSeguro(val: any) {

    if (val) {
      this.selections.value = val
      const res = await firstValueFrom(this.searchService.getCompaniaSeguroId(val))
      this.selections.label = res[0].CompaniaSeguroDescripcion
    }
  }

  async selectedValueTipoSeguro(val: any) {

    if (val) {
      this.selections.value = val
      const res = await firstValueFrom(this.searchService.getTipoSeguroId(val))
      this.selections.label = res[0].TipoSeguroNombre
    }
  }

  async selectedValueTipoCuenta(val: any) {

    if (val) {
      this.selections.value = val
      const res = await firstValueFrom(this.apiService.getTipoCuenta())
      this.selections.label = res[0].detalle
    }
  }

  async selectedValueCentroCapacitacion(val: any) {

    if (val) {
      this.selections.value = val
      const res = await firstValueFrom(this.searchService.getCentroCapacitacionSearchId(val))
      this.selections.label = res[0].CentroCapacitacionRazonSocial
    }
  }

  async selectedValueModalidadCurso(val: any) {

    if (val) {
      this.selections.value = val
      const res = await firstValueFrom(this.searchService.getModalidadCursoSearchId(val))
      this.selections.label = res[0].ModalidadCursoModalidad
    }
  }

  async selectedValueMetodologias(val: any) {
    if (val) {
      this.selections.value = val.metodo + '/' + val.conceptoId
      this.selections.label = val.descripcion
    }
  }

  selectedValueOptions(val: any) {
    if (val) {
      this.selections.value = val.value;
      this.selections.label = val.label;
    }
  }

  selectedValue(val: any) {
    if (val) {
      this.selections.value = val.value;
      this.valueExtended = { fullName: val.label };
    }
  }

  multipleSelectedValue(values: any) {
    if (values.length) {
      let val = values.map((obj: any) => obj.value).join(";");
      let label = values.map((obj: any) => obj.label).join(";");
      this.selections.value = val;
      this.valueExtended = { fullName: label };
      if (typeof values[0].value == 'string') {
        this.selections.operator = 'LIKE'
      }
    }
  }

  selectedValueProducto(val: any) {

    if (val) {
      this.selections.value = val.TipoProductoId;
      this.valueExtended = { fullName: val.TipoProductoDescripcion };
    }
  }

  async addFilter(field: string, condition: string, operator: string, value: any, forced: boolean) {
    if (!this.fieldsToSelect()) return
    const fieldObj: any = this.fieldsToSelect().filter(x => x.field === field)[0]

    if (!fieldObj)
      return
    let label = ''
    //TODO revisar que pasa con el resto de los filtros
    if (fieldObj.searchComponent == 'inputForPersonalSearch') {
      const person = await firstValueFrom(this.searchService.getPersonFromName('PersonalId', value))
      label = person[0].fullName
    }

    if (fieldObj.searchComponent == 'inputForClientSearch') {
      const cliente = await firstValueFrom(this.searchService.getClientFromName('ClienteId', value))
      label = cliente[0].ClienteDenominacion
    }

    if (fieldObj.searchComponent == 'inputForEfectoSearch') {
      const efecto = await firstValueFrom(this.searchService.getEfectoFromName('EfectoId', value))
      label = efecto[0].EfectoDescripcion
    }

    if (fieldObj.searchComponent == 'inputForEfectoIndividualSearch') {
      const efectoIndividual = await firstValueFrom(this.searchService.getEfectoIndividualFromName('EfectoEfectoIndividualId', value))
      label = efectoIndividual[0].EfectoEfectoIndividualDescripcion
    }

    if (fieldObj.searchComponent == 'inputForSituacionRevistaSearch') {
      let valueSplit = value.split(";")
      let result = ''
      for (const value of valueSplit) {
        const situacion = await firstValueFrom(this.searchService.getSituacionRevistaSearch('SituacionRevistaId', value))
        result += `${situacion[0].SituacionRevistaDescripcion};`
      }
      label = result
    }

    if (fieldObj.searchComponent == 'inputForGrupoActividadSearch') {
      const res = await firstValueFrom(this.searchService.getGrupoActividad('GrupoActividadId', value))
      label = res[0].GrupoActividadDetalle
    }

    if (fieldObj.searchComponent == 'inputForActivo') {
      label = value == 1 ? 'SI' : 'NO'
    }


    /*if (fieldObj.searchComponent == 'inputForCursoSearch') {
      const curso = await firstValueFrom(this.searchService.getCursoFromName('CursoHabilitacionId', value))
      label = curso[0].CursoHabilitacionDescripcion
    }*/


    this.selections = { field: fieldObj, condition, operator, value, label, forced }
    this.handleInputConfirm()
  }

}

