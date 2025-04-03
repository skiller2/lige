import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  forwardRef,
  inject,
  input,
  model,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Filtro, Options,Selections } from '../schemas/filtro';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SearchService } from '../../services/search.service';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { SHARED_IMPORTS } from '@shared';
import { FechaSearchComponent } from '../fecha-search/fecha-search.component';
import { TipoMovimientoSearchComponent } from '../tipo-movimiento-search/tipo-movimiento-search.component';
import { ObjetivoSearchComponent } from '../objetivo-search/objetivo-search.component';
import { ClienteSearchComponent } from '../cliente-search/cliente-search.component';
import { PersonalSearchComponent } from '../personal-search/personal-search.component';
import { GrupoActividadSearchComponent } from '../grupo-actividad-search/grupo-actividad-search.component';
import { RequirenteSearchComponent } from '../requirente-search/requirente-search.component';
import { DescripcionProductoSearchComponent } from "../../shared/descripcion-producto-search/descripcion-producto-search.component"
import { AdministradorSearchComponent } from "../../shared/administrador-search/administrador-search.component"
import { SeguroSearchComponent } from "../../shared/seguro-search/seguro-search.component"

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
        ObjetivoSearchComponent, ClienteSearchComponent, PersonalSearchComponent, GrupoActividadSearchComponent,
        RequirenteSearchComponent, AdministradorSearchComponent,SeguroSearchComponent
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
  $optionsTipoPrest = this.searchService.getTipoPrestamo();
  $optionsSitRevista = this.searchService.getSitRevistaOptions();
  $optionsProducto =  this.searchService.getTipoProducto();
  $optionsTipoDocumento = this.searchService.getTiposDocumentoOptions();
  $optionsNivelEstudio = this.searchService.getEstudioSearch();
  $optionsModalidadCurso = this.searchService.getModalidadCursoSearch();

  $optionsSucursales = this.searchService.getSucursales();
  private _options: Options = {
    filtros: [],
    sort: null,
  };

  $optionsSepaga = this.searchService.getSePaga();
  $optionsInactivo = this.searchService.getInactivo();
  $optionsInactivoBoolean = this.searchService.getInactivoBoolean();
  $optionsGrupoActividad = this.searchService.getTipo();
  $optionsCurso = this.searchService.getCursoSearch();
  $optionsCentroCapacitacion = this.searchService.getCentroCapacitacionSearch()
  isFiltroBuilder = false;

  listOfSelectedValue = [];
  selections:Selections = {
    field: { searchComponent: '', name: '', type: '', searchType:'' },
    condition: 'AND',
    operator: '',
    value: null,
    label: '',
    forced: false
  };

  valueExtended = { fullName: '' }


  ngOnInit(): void {
    for (const filter of this.startFilters()) {
      this.addFilter(filter.field, filter.condition, filter.operator, filter.value, filter.forced)
    }
  }

  handleTagInteraction() {
    this.isFiltroBuilder = true;
  }

  verifySelections(): boolean {
    const type = (this.selections.field.searchType)? this.selections.field.searchType : (this.selections.field.type) ? this.selections.field.type : 'string'

    if (this.selections.field.searchComponent && this.selections.operator == "")
      this.selections.operator="="
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
      let value:any

      if ((this.selections.field.type == 'date' || this.selections.field.type == 'dateTime') && this.selections.value instanceof Date != true) {
        const value = new Date(this.selections.value.value)
        const operator = this.selections.value.operator
        this.selections.value = value
        this.selections.operator = operator
      }

      if (this.selections.value instanceof String || this.selections.value instanceof Array)
        Array.isArray(this.selections.value) ? value = this.selections.value : value = String(this.selections.value).trim().split(/\s+/)
      else 
        value = [this.selections.value]


      if (this.selections.label == "" && this.valueExtended?.fullName)
        this.selections.label = this.valueExtended.fullName
//      if (this.selections.label == "")
//        this.selections.label = this.selections.value == "" ? "Vacio" : String(this.selections.value)

      if (this.selections.label == "") {
        if (this.selections.value == "" || ((this.selections.value instanceof Date) && isNaN(this.selections.value.getTime())))
          this.selections.label = "Vacio"
        else
          this.selections.label = (this.selections.value instanceof Date)? String(this.datePipe.transform(this.selections.value)) :String(this.selections.value)
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
    type:string
  ): Filtro {
    const filtro = {
      index: selections.field.field,
      condition: selections.condition,
      operador: selections.operator,
      valor: valueToFilter,
      type: type,
      tagName,
      closeable
  
    };

    this.localoptions.filtros.push(filtro);

    this.optionsChange.emit(this.localoptions);
    return filtro;
  }

  removeFiltro(indexToRemove: number) {
    this.localoptions.filtros.splice(indexToRemove, 1);
    this.optionsChange.emit(this.localoptions);
    //    this.options.set(this.localoptions);
  }

  resetSelections() {
    this.selections = {
      field: { searchComponent: '', name: '', type: '', searchType:'' },
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
    if (val) {
      this.selections.value = val
      //this.valueExtended = { fullName: val.label }
    }
  }

  selectedValueInactivoBoolean(val: any) {
    if (val) {
      this.selections.value = val
      //this.valueExtended = { fullName: val.label }
    }
  }

  selectedValueGrupoActividad(val: any) {
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

  selectedValue(val: any) {
    if (val) {
      this.selections.value = val.value;
      this.valueExtended = { fullName: val.label };
    }
  }

  multipleSelectedValue(values: any) {
    if (values.length) {
      let val = values.map((obj:any) => obj.value).join(";");
      let label = values.map((obj:any) => obj.label).join(";");
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
    
    const fieldObj: any = this.fieldsToSelect().filter(x => x.field === field)[0]
    
    if (!fieldObj)
      return
    let label = ''
    //TODO revisar que pasa con el resto de los filtros
    if (fieldObj.searchComponent == 'inpurForPersonalSearch') {
      const person = await firstValueFrom(this.searchService.getPersonFromName('PersonalId', value))
      label = person[0].fullName
    }

    if (fieldObj.searchComponent == 'inpurForSituacionRevistaSearch') {
      let valueSplit = value.split(";")
      let result = ''
       for (const value of valueSplit) {
        const situacion = await firstValueFrom(this.searchService.getSituacionRevistaSearch('SituacionRevistaId', value))
        result += `${situacion[0].SituacionRevistaDescripcion };`
      }
      label = result
    }

    if (fieldObj.searchComponent == 'inpurForGrupoActividadSearch') {
      const res = await firstValueFrom(this.searchService.getGrupoActividad('GrupoActividadId', value))
      label = res[0].GrupoActividadDetalle
    }


    /*if (fieldObj.searchComponent == 'inpurForCursoSearch') {
      const curso = await firstValueFrom(this.searchService.getCursoFromName('CursoHabilitacionId', value))
      label = curso[0].CursoHabilitacionDescripcion
    }*/
    

    this.selections = { field: fieldObj, condition, operator, value, label, forced }
    this.handleInputConfirm()
  }

}

