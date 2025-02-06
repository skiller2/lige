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
import { CommonModule } from '@angular/common';
import { Filtro, Options } from '../schemas/filtro';
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
  standalone: true,
  imports: [...SHARED_IMPORTS, CommonModule, FechaSearchComponent, TipoMovimientoSearchComponent,
    ObjetivoSearchComponent, ClienteSearchComponent, PersonalSearchComponent, GrupoActividadSearchComponent,
    RequirenteSearchComponent,DescripcionProductoSearchComponent
  ],
  templateUrl: './filtro-builder.component.html',
  styles: [],
  providers: [CUSTOM_INPUT_CONTROL_VALUE_ACCESSOR],
})
export class FiltroBuilderComponent implements ControlValueAccessor {
  readonly startFilters = input<any[]>([])
  readonly fieldsToSelect = input<any[]>([])

  private searchService = inject(SearchService)
  private elRef = inject(ElementRef)


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

  $optionsSucursales = this.searchService.getSucursales();
  private _options: Options = {
    filtros: [],
    sort: null,
  };

  $optionsSepaga = this.searchService.getSePaga();
  $optionsInactivo = this.searchService.getInactivo();
  $optionsGrupoActividad = this.searchService.getTipo();

  isFiltroBuilder = false;

  listOfSelectedValue = [];
  selections = {
    field: { searchComponent: '', name: '', type: '', searchType:'' },
    condition: 'AND',
    operator: '',
    value: '',
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
      let value
      Array.isArray(this.selections.value) ? value = this.selections.value : value = String(this.selections.value).trim().split(/\s+/)

      if (this.selections.label == "" && this.valueExtended?.fullName)
        this.selections.label = this.valueExtended.fullName
      if (this.selections.label == "")
        this.selections.label = this.selections.value == "" ? "Vacio" : this.selections.value
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
    //    this.options.set(this.localoptions);
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

  selectedValueGrupoActividad(val: any) {
    if (val) {
      this.selections.value = val
      //this.valueExtended = { fullName: val.label }
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
    }
  }

  selectedValueProducto(val: any) {
  
    if (val) {
      this.selections.value = val.TipoProductoId;
      this.valueExtended = { fullName: val.TipoProductoDescripcion };
    }
  }

  async addFilter(field: string, condition: string, operator: string, value: string, forced: boolean) {
    const fieldObj: any = this.fieldsToSelect().filter(x => x.field === field)[0]
    if (!fieldObj)
      return
    let label = ''
    //TODO revisar que pasa con el resto de los filtros
    if (fieldObj.searchComponent == 'inpurForPersonalSearch') {
      const person = await firstValueFrom(this.searchService.getPersonFromName('PersonalId', value))
      label = person[0].fullName
    }

    this.selections = { field: fieldObj, condition, operator, value, label, forced }
    this.handleInputConfirm()
  }

}

