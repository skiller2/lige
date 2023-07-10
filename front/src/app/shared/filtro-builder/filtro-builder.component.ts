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
  selectedPersonalId = "";
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

  //
  // Tags
  //

  addTag() {
    if (this.selections.field == "ApellidoNombreObjJ") {
      let inputValueSearch: HTMLElement = document.getElementById("inpurForPersonalSearch") as HTMLElement;
      this.inputValue = inputValueSearch?.outerText

    } else if (this.selections.field == "ApellidoNombreJ" ) {
      let inputValueSearch: HTMLElement = document.getElementById("inpurForPersonalSearch") as HTMLElement;
      this.inputValue = inputValueSearch?.outerText
    }

    const tagToAdd = `${this.selections.field} | ${this.selections.operator} | ${this.inputValue}`;
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
//    if (this.selections.searchComponent == 'inpurForPersonalSearch')


    this.selections.operator = (this.selections.field != "ApellidoNombreJ" && this.selections.field != "ApellidoNombreObjJ")
      ? this.selections.operator
      : "=";
    if (
      this.selections.field &&
      this.selections.condition &&
      this.selections.operator
    )
      return true;
    return false;
  }

  handleInputConfirm() {
    debugger;
    // if ( this.verifySelections() && this.inputValue && this.tags.indexOf(this.inputValue) === -1 ) {
    if (this.verifySelections()) {
      this.addTag();

      //Si son buscadores especiales le asigno el selectedPersonalId 
      if (this.selections.field == "ApellidoNombreJ" || this.selections.field == "ApellidoNombreObjJ") {
//        this.selections.condition = "AND";
        this.inputValue = this.selectedPersonalId
      }
      const appendedFilter = this.appendFiltro(
        this.selections as any,
        this.inputValue
      );
    }
    this.resetSelections();
    this.inputValue = '';
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
    this.inputSearchview = (this.selections.field != "ApellidoNombreJ" && this.selections.field != "ApellidoNombreObjJ") ? false : true;
  }
}
