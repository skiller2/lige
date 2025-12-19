import { Column, ColumnEditor, Constants, Editor, EditorValidationResult, EditorValidator } from "angular-slickgrid";

export class CustomFloatEditor implements Editor {
  private _lastInputEvent?: KeyboardEvent;
  inputElm!: HTMLInputElement;
  defaultValue: any;

  private decimal_mark: string
  private thousand_sep: string


  constructor(private args: any) {
    this.thousand_sep = this.columnEditor.params?.thousandSeparator || this.args.grid.getOptions().formatterOptions?.thousandSeparator || ''
    this.decimal_mark = this.columnEditor.params?.decimalSeparator || this.args.grid.getOptions().formatterOptions?.decimalSeparator || '.'

    this.init();
  }

  /** Get Column Definition object */
  get columnDef(): Column {
    return this.args?.column ?? {};
  }

  /** Get Column Editor object */
  get columnEditor(): ColumnEditor {
    return this.columnDef?.editor ?? {};
  }

  get hasAutoCommitEdit(): boolean {
    return this.args.grid.getOptions().autoCommitEdit ?? false;
  }

  /** Get the Validator function, can be passed in Editor property or Column Definition */
  get validator(): EditorValidator | undefined {
    return this.columnEditor.validator || this.columnDef.validator;
  }

  init(): void {



    const placeholder = this.columnEditor?.placeholder || '';
    const title = this.columnEditor?.title || '';

    this.inputElm = document.createElement('input');
    this.inputElm.type = 'text';
    this.inputElm.className = 'editor-text';
    this.inputElm.placeholder = placeholder;
    this.inputElm.title = title;

    this.args.container.appendChild(this.inputElm);

    this.inputElm.addEventListener('keydown', this.onKeydown.bind(this));

    // the lib does not get the focus out event for some reason
    // so register it here
    if (this.hasAutoCommitEdit) {
      this.inputElm.addEventListener('focusout', this.save.bind(this));
    }

    setTimeout(() => {
      this.inputElm.focus();
      this.inputElm.select();
    }, 50);
  }

  onKeydown(event: KeyboardEvent) {
    this._lastInputEvent = event;

    const el = event.target as HTMLInputElement;
    const currInputValue = el.value;


    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.stopImmediatePropagation();
    }

    if (this.decimal_mark === event.key && String(currInputValue).indexOf(this.decimal_mark) >= 0) {
      event.preventDefault();
    }


    if (this.decimal_mark == ',' && event.key === '.') {
      event.preventDefault();

      if (String(currInputValue).indexOf(this.decimal_mark) >= 0)
        return


      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;

      const antes = el.value.slice(0, start);
      const despues = el.value.slice(end);

      el.value = `${antes},${despues}`;

      const newPos = start + 1;
      el.setSelectionRange(newPos, newPos);

      el.dispatchEvent(new Event('input', { bubbles: true }));


    }

    if (event.key.length == 1) {
      const valido = /^[0-9.,-]+$/.test(el.value + event.key);
    
      if (!valido)
        event.preventDefault();
    }
  }

  destroy() {
    this.inputElm.removeEventListener('keydown', this.onKeydown.bind(this));
    this.inputElm.removeEventListener('focusout', this.save.bind(this));
    this.inputElm.remove();
  }

  focus() {
    this.inputElm.focus();
  }

  getValue() {
    return this.inputElm.value;
  }

  setValue(val: string) {
    this.inputElm.value = val;
  }

  loadValue(item: any) {
    this.defaultValue = item[this.args.column.field] || '';


    const decPlaces = this.columnEditor.decimal || 2
    this.defaultValue = parseFloat(String(this.defaultValue))

    if ((this.defaultValue || this.defaultValue === 0) && this.defaultValue !== '')
      this.defaultValue = (+this.defaultValue).toFixed(decPlaces);

    if (isNaN(Number(this.defaultValue)))
      this.defaultValue = ''
    else
      this.defaultValue = `${String(this.defaultValue).replace('.', this.decimal_mark)}`



    this.inputElm.value = this.defaultValue;
    this.inputElm.defaultValue = this.defaultValue;
    this.inputElm.select();

  }

  serializeValue() {
    let elmValue = this.inputElm.value;

    elmValue = String(elmValue).replace(this.thousand_sep, '')
    elmValue = String(elmValue).replace(this.decimal_mark, '.')

    if (elmValue === undefined || elmValue === '' || isNaN(+elmValue)) {
      return elmValue as string;
    }

    let rtn = parseFloat(elmValue);
    const decPlaces = this.columnEditor.decimal || 2
    if (decPlaces !== null && (rtn || rtn === 0) && rtn.toFixed) {
      rtn = parseFloat(rtn.toFixed(decPlaces));
    }
    return rtn;
  }

  applyValue(item: any, state: any) {
    const validation = this.validate(state);
    item[this.args.column.field] = validation && validation.valid ? state : '';
  }

  isValueChanged() {
    const lastKeyEvent = this._lastInputEvent?.key;
    if (this.columnEditor?.alwaysSaveOnEnterKey && lastKeyEvent === 'Enter') {
      return true;
    }
    return !(this.inputElm.value === '' && this.defaultValue === null) && this.inputElm.value !== this.defaultValue;
  }

  save() {
    const validation = this.validate();
    if (validation?.valid) {
      if (this.hasAutoCommitEdit) {
        this.args.grid.getEditorLock().commitCurrentEdit();
      } else {
        this.args.commitChanges();
      }
    }
  }

  floatValidate(value: any): EditorValidationResult {
    const decPlaces = this.columnEditor.decimal || 2
    const errorMsg = this.columnEditor?.errorMessage || '';

    let isValid = true;
    let outputMsg = '';
    const minValue = this.columnEditor.minValue;
    const maxValue = this.columnEditor.maxValue;
    const mapValidation = {
      '{{minValue}}': minValue,
      '{{maxValue}}': maxValue,
      '{{minDecimal}}': 0,
      '{{maxDecimal}}': decPlaces,
    };

    if (decPlaces > 0 && !new RegExp(`^[-+]?(\\d*(\\${this.decimal_mark})?(\\d){0,${decPlaces}})$`).test(value)) {
      // when decimal value is bigger than 0, we only accept the decimal values as that value set
      // for example if we set decimalPlaces to 2, we will only accept numbers between 0 and 2 decimals
      isValid = false;
      outputMsg =
        errorMsg ||
        Constants.VALIDATION_EDITOR_DECIMAL_BETWEEN.replace(/{{minDecimal}}|{{maxDecimal}}/gi, (matched) => (mapValidation as any)[matched]);

    }
    return { valid: isValid, msg: outputMsg };

  }

  validate(inputValue?: any): EditorValidationResult {
    if (this.validator) {
      const value = inputValue !== undefined ? inputValue : this.inputElm?.value;
      return this.validator(value, this.args);
    }

    if (inputValue == undefined)
      return this.floatValidate(inputValue !== undefined ? inputValue : this.inputElm?.value)


    return {
      valid: true,
      msg: null,
    };
  }
}
