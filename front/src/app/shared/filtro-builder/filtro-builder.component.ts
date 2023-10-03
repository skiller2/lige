import {
  Component,
  EventEmitter,
  Input,
  Output,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Filtro, Options } from '../schemas/filtro';
import { SharedModule } from '../shared.module';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SearchService } from '../../services/search.service';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

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
  imports: [SharedModule],
  templateUrl: './filtro-builder.component.html',
  styles: [],
  providers: [CUSTOM_INPUT_CONTROL_VALUE_ACCESSOR],
})
export class FiltroBuilderComponent implements ControlValueAccessor {

  @Input() set fieldsToSelect(value: any[]) {
    this._fieldsToSelect = value;
  }

  @Input() conditionsToSelect = ['AND', 'OR'];
  @Input() operatorsToSelect = ['LIKE', '>', '<', '>=', '<=', '!=', '<>', '='];

  @Output() optionsChange = new EventEmitter<Options>();
  _fieldsToSelect: Array<any> = []
  formChange$ = new BehaviorSubject('');
  
  $optionsSucursales = this.searchService.getSucursales();
  tags: string[] = [];
  private _options: Options = {
    filtros: [],
    sort: null,
  };



  isFiltroBuilder = false;

  selections = {
    field: { searchComponent: '', name: '', type: '' },
    condition: 'AND',
    operator: '',
    value: '',
    label: ''
  };

  valueExtended = { fullName:''}


  constructor(
    private searchService: SearchService
  ) { }
  //
  // Tags
  //
  ngOnInit(): void {
  }

  addTag() {
    if (this.selections.label == "" && this.valueExtended?.fullName)
      this.selections.label = this.valueExtended.fullName
    if (this.selections.label == "")
      this.selections.label = this.selections.value == "" ? "Vacio" : this.selections.value
    const tagToAdd = `${this.selections.field.name} ${this.selections.operator} ${this.selections.label}`;
    this.tags.push(tagToAdd);
  }

  closeTag(indexToRemove: number) {
    this.tags.splice(indexToRemove, 1);
    this.removeFiltro(indexToRemove);
  }

  handleTagInteraction() {
    this.isFiltroBuilder = true;
  }

  verifySelections(): boolean {
    const type = (this.selections.field.type) ? this.selections.field.type : 'string'

    this.selections.operator = (this.selections.field.searchComponent) ? "=" : this.selections.operator
    this.selections.value = String(this.selections.value)


    if (this.selections.value.startsWith('>=')) {
      this.selections.value = this.selections.value.substring(2)
      this.selections.operator = '>='
    }

    if (this.selections.value.startsWith('<=')) {
      this.selections.value = this.selections.value.substring(2)
      this.selections.operator = '<='
    }

    if (this.selections.value.startsWith('!=') || this.selections.value.startsWith('<>')) {
      this.selections.value = this.selections.value.substring(2)
      this.selections.operator = '<>'
    }

    if (this.selections.value.startsWith('>')) {
      this.selections.value = this.selections.value.substring(1)
      this.selections.operator = '>'
    }

    if (this.selections.value.startsWith('<')) {
      this.selections.value = this.selections.value.substring(1)
      this.selections.operator = '<'
    }

    if (this.selections.value.startsWith('=')) {
      this.selections.value = this.selections.value.substring(1)
      this.selections.operator = '='
    }



    if (this.selections.operator == '') {
      switch (type) {
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
      this.addTag();
      const appendedFilter = this.appendFiltro(
        this.selections as any,
        this.selections.value.trim().split(/\s+/)
      );
    }
    this.resetSelections();
    this.isFiltroBuilder = false;
    let inputSearch: HTMLElement = document.getElementsByTagName("nz-select-clear")[0] as HTMLElement;
    if (inputSearch)
      inputSearch.click()
  }

  //
  // Filtros
  //

  appendFiltro(
    selections: { field: any; condition: any; operator: any },
    valueToFilter: string[]
  ): Filtro {
    const filtro = {
      index: selections.field.field,
      condition: selections.condition,
      operador: selections.operator,
      valor: valueToFilter,
    };
    this.options.filtros.push(filtro);
    this.optionsChange.emit(this.options);
    return filtro;
  }

  removeFiltro(indexToRemove: number) {
    this.options.filtros.splice(indexToRemove, 1);
    this.optionsChange.emit(this.options);
  }

  resetSelections() {
    this.selections = {
      field: { searchComponent: '', name: '', type: '' },
      condition: 'AND',
      operator: '',
      value: '',
      label: ''
    };
    this.valueExtended = { fullName:''}
  }

  //Control Value Accessor

  //The internal data model

  //Placeholders for the callbacks which are later provided
  //by the Control Value Accessor
  private onTouchedCallback: () => void = noop;
  private onChangeCallback: (_: any) => void = noop;

  //get accessor
  get options(): Options {
    return this._options;
  }

  //set accessor including call the onchange callback
  set options(v: any) {
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

  async addFilter(field: string, condition: string, operator: string, value: string) {
    const fieldObj: any = this._fieldsToSelect.filter(x => x.field === field)[0];
    let label = ''
    if (fieldObj.searchComponent == 'inpurForPersonalSearch') {
      const person = await firstValueFrom(this.searchService.getPersonFromName('PersonalId', value))
      label = person[0].fullName
    }
    this.selections = { field: fieldObj, condition, operator, value, label }
    this.handleInputConfirm()
  }

}

