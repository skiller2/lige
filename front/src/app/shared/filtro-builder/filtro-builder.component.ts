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
import { BehaviorSubject } from 'rxjs';

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
  @Input() fieldsToSelect: Array<any> = [];
  @Input() conditionsToSelect = ['AND', 'OR'];
  @Input() operatorsToSelect = ['LIKE', '>', '<'];

  @Output() optionsChange = new EventEmitter<Options>();
  formChange$ = new BehaviorSubject('');
  selectedSucursalId = '';
  selectedSucursalDescription = "";
  $selectedSucursalIdChange = new BehaviorSubject('');
  selectedPersonalId = "";
  inputSucursalview = false;
  $optionsSucursales = this.searchService.getSucursales();
  tags: string[] = [];
  private _options: Options = {
    filtros: [],
    sort: null,
  };


  inputValue = '';
  isFiltroBuilder = false;

  selections = {
    field: '',
    condition: 'AND',
    operator: '',
  };

  constructor(
    private searchService: SearchService
  ) { }
  //
  // Tags
  //

  addTag() {

    const fieldObj: any = this.fieldsToSelect.filter(x => x.field === this.selections.field)[0];
    let inputValueSearch: HTMLElement

    switch (fieldObj?.searchComponent) {
      case 'inpurForPersonalSearch':
        inputValueSearch = document.getElementById("inpurForPersonalSearch") as HTMLElement;
        this.inputValue = inputValueSearch?.outerText
        break;
      case 'Sucursal':
        inputValueSearch = document.getElementById("sucursalName") as HTMLElement;
        let inputValueSearchDescription: HTMLElement = document.getElementById("sucursalDescription") as HTMLElement;
        this.inputValue = inputValueSearch?.outerText + "-" + inputValueSearchDescription?.outerText
        break;

      default:
        break;
    }

    const tagToAdd = `${fieldObj.name} ${this.selections.operator} ${this.inputValue}`;
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
    const fieldObj: any = this.fieldsToSelect.filter(x => x.field === this.selections.field)[0];

    this.selections.operator = (fieldObj?.searchComponent) ? "=" : this.selections.operator

    if (
      this.selections.field &&
      this.selections.condition &&
      this.selections.operator
    )
      return true;
    return false;
  }

  handleInputConfirm() {
    const fieldObj: any = this.fieldsToSelect.filter(x => x.field === this.selections.field)[0];
    debugger;
    // if ( this.verifySelections() && this.inputValue && this.tags.indexOf(this.inputValue) === -1 ) {
    if (this.verifySelections()) {
      this.addTag();

      switch (fieldObj?.searchComponent) {
        case 'inpurForPersonalSearch':
          this.inputValue = this.selectedPersonalId
          break;
        case 'Sucursal':
          this.inputValue = this.selectedSucursalId
          break;
        default:
          break;
      }

      const appendedFilter = this.appendFiltro(
        this.selections as any,
        this.inputValue
      );
    }
    this.resetSelections();
    this.inputValue = '';
    this.selectedSucursalId = '';
    this.selectedSucursalDescription = "";
    this.isFiltroBuilder = false;
    let inputSearch: HTMLElement = document.getElementsByTagName("nz-select-clear")[0] as HTMLElement;
    inputSearch.click()
  }

  //
  // Filtros
  //

  appendFiltro(
    selections: { field: any; condition: any; operator: any },
    valueToFilter: string
  ): Filtro {
    const filtro = {
      index: selections.field,
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
      field: '',
      condition: 'AND',
      operator: '',
    };
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

  //

  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
  };


  listOptionsChange(options: any) {
    this.listOptions = options;
    this.formChange$.next('');

  }

  inputSearchview = false;
  onOptionChange() {
    const fieldObj: any = this.fieldsToSelect.filter(x => x.field === this.selections.field)[0];

    this.inputSucursalview = false;
    this.inputSearchview = false;
    switch (fieldObj?.searchComponent) {
      case 'inpurForPersonalSearch':
        this.inputSearchview = true
        break;
      case 'Sucursal':
        this.inputSucursalview = true
        break;

      default:
        break;
    }

  }

  filterFields(field: any) {
    return !field.searchHidden
  }

  selectedValueSucursal(event: string) {

    this.selectedSucursalId = event;

  }

  selectedValueCodigoDescripcion(event: string) {

    this.selectedSucursalDescription = event;

  }

}

