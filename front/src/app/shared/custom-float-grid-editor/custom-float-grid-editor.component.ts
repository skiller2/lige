import { Constants, createDomElement, EditorArguments, EditorValidationResult, EditorValidator, getDescendantProperty, InputEditor, toSentenceCase } from "angular-slickgrid";

interface FloatValidatorOptions {
  editorArgs: any;
  decimal?: number;
  errorMessage?: string;
  minValue?: string | number;
  maxValue?: string | number;
  operatorConditionalType?: 'inclusive' | 'exclusive';
  required?: boolean;
  validator?: EditorValidator;
}

export class CustomFloatEditor extends InputEditor {
//  protected _bindEventService2: BindingEventService;
  private decimal_mark:string
  private thousand_sep: string

  constructor(protected override readonly args: EditorArguments,
  ) {
    super(args, 'number');

    this.thousand_sep = args.column.params?.thousandSeparator ||  args.grid.getOptions().formatterOptions?.thousandSeparator  ||  ''
    this.decimal_mark = args.column.params?.decimalSeparator || args.grid.getOptions().formatterOptions?.decimalSeparator  || '.'
  }

  override init(): void {
    const columnId = this.columnDef?.id ?? '';
    const compositeEditorOptions = this.args.compositeEditorOptions;

    this._input = createDomElement('input', {
      type:  'text',
      autocomplete: 'off',
      ariaAutoComplete: 'none',
      ariaLabel: this.columnEditor?.ariaLabel ?? `${toSentenceCase(columnId + '')} Input Editor`,
      className: `editor-text editor-${columnId}`,
      placeholder: this.columnEditor?.placeholder ?? '',
      title: this.columnEditor?.title ?? '',
    });

    // add "step" attribute when editor type is integer/float
    if (this.inputType === 'number') {
      this._input.step = `${this.columnEditor.valueStep !== undefined ? this.columnEditor.valueStep : this.getInputDecimalSteps()}`;
    }

    const cellContainer = this.args.container;
    if (cellContainer && typeof cellContainer.appendChild === 'function') {
      cellContainer.appendChild(this._input);
    }

    this._bindEventService.bind(this._input, 'focus', () => this._input?.select());
    this._bindEventService.bind(this._input, 'keydown', ((event: KeyboardEvent) => {
      this._isValueTouched = true;
      this._lastInputKeyEvent = event;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
        event.stopImmediatePropagation();
      }
    }) as EventListener);

    this._bindEventService.bind(this._input, 'keypress', ((event: KeyboardEvent) => {
      this._isValueTouched = true;
      this._lastInputKeyEvent = event;


      if (this.decimal_mark === event.key && String(this._input?.value).indexOf(this.decimal_mark) >= 0) {
        event.preventDefault();
        return
      }

      if (this.decimal_mark==',' && event.key === '.') {
        event.preventDefault();

        if (String(this._input?.value).indexOf(this.decimal_mark) >= 0)
          return



        const input = this._input;
        const start = Number(input?.selectionStart);
        const end = Number(input?.selectionEnd);
        const value = String(input?.value);

        // Replace the dot with a comma at the cursor position
        input!.value = value.substring(0, start) + ',' + value.substring(end);

        // Move the cursor after the inserted comma
        input!.setSelectionRange(start + 1, start + 1);
      }
    }) as EventListener);



    // listen to focusout or blur to automatically call a save
    if (this.hasAutoCommitEdit && !compositeEditorOptions) {
      this._bindEventService.bind(this._input, ['focusout', 'blur'], () => {
        this._isValueTouched = true;
        this.save();
      });
    }

    if (compositeEditorOptions) {
      this._bindEventService.bind(this._input, ['input', 'paste'], this.handleOnInputChange.bind(this) as EventListener);

      // add an extra mousewheel listener when editor type is integer/float
      if (this.inputType === 'number') {
        this._bindEventService.bind(this._input, 'wheel', this.handleOnMouseWheel.bind(this) as EventListener, { passive: true });
      }
    }
  }

  floatValidator(inputValue: any, options: FloatValidatorOptions): EditorValidationResult {
    const floatNumber = !isNaN(inputValue as number) ? parseFloat(inputValue) : null;
    const decPlaces = options.decimal || 0;
    const isRequired = options.required;
    const minValue = options.minValue;
    const maxValue = options.maxValue;
    const operatorConditionalType = options.operatorConditionalType || 'inclusive';
    const errorMsg = options.errorMessage;
    const mapValidation = {
      '{{minValue}}': minValue,
      '{{maxValue}}': maxValue,
      '{{minDecimal}}': 0,
      '{{maxDecimal}}': decPlaces,
    };
    let isValid = true;
    let outputMsg = '';

    if (typeof options.validator === 'function') {
      return options.validator(inputValue, options.editorArgs);
    } else if (isRequired && inputValue === '') {
      isValid = false;
      outputMsg = errorMsg || Constants.VALIDATION_REQUIRED_FIELD;
    } else if (inputValue !== '' && (isNaN(inputValue as number) || (decPlaces === 0 && !/^[-+]?(\d*(\.)?(\d)*)$/.test(inputValue)))) {
      // when decimal value is 0 (which is the default), we accept 0 or more decimal values
      isValid = false;
      outputMsg = errorMsg || Constants.VALIDATION_EDITOR_VALID_NUMBER;
    } else if (
      minValue !== undefined &&
      maxValue !== undefined &&
      floatNumber !== null &&
      ((operatorConditionalType === 'exclusive' && (floatNumber <= +minValue || floatNumber >= +maxValue)) ||
        (operatorConditionalType === 'inclusive' && (floatNumber < +minValue || floatNumber > +maxValue)))
    ) {
      // MIN & MAX Values provided
      // when decimal value is bigger than 0, we only accept the decimal values as that value set
      // for example if we set decimalPlaces to 2, we will only accept numbers between 0 and 2 decimals
      isValid = false;
      outputMsg =
        errorMsg ||
        Constants.VALIDATION_EDITOR_NUMBER_BETWEEN.replace(/{{minValue}}|{{maxValue}}/gi, (matched) => (mapValidation as any)[matched]);
    } else if (
      minValue !== undefined &&
      floatNumber !== null &&
      ((operatorConditionalType === 'exclusive' && floatNumber <= +minValue) ||
        (operatorConditionalType === 'inclusive' && floatNumber < +minValue))
    ) {
      // MIN VALUE ONLY
      // when decimal value is bigger than 0, we only accept the decimal values as that value set
      // for example if we set decimalPlaces to 2, we will only accept numbers between 0 and 2 decimals
      isValid = false;
      const defaultErrorMsg =
        operatorConditionalType === 'inclusive' ? Constants.VALIDATION_EDITOR_NUMBER_MIN_INCLUSIVE : Constants.VALIDATION_EDITOR_NUMBER_MIN;
      outputMsg = errorMsg || defaultErrorMsg.replace(/{{minValue}}/gi, (matched) => (mapValidation as any)[matched]);
    } else if (
      maxValue !== undefined &&
      floatNumber !== null &&
      ((operatorConditionalType === 'exclusive' && floatNumber >= +maxValue) ||
        (operatorConditionalType === 'inclusive' && floatNumber > +maxValue))
    ) {
      // MAX VALUE ONLY
      // when decimal value is bigger than 0, we only accept the decimal values as that value set
      // for example if we set decimalPlaces to 2, we will only accept numbers between 0 and 2 decimals
      isValid = false;
      const defaultErrorMsg =
        operatorConditionalType === 'inclusive' ? Constants.VALIDATION_EDITOR_NUMBER_MAX_INCLUSIVE : Constants.VALIDATION_EDITOR_NUMBER_MAX;
      outputMsg = errorMsg || defaultErrorMsg.replace(/{{maxValue}}/gi, (matched) => (mapValidation as any)[matched]);
    } else if (decPlaces > 0 && !new RegExp(`^[-+]?(\\d*(\\.)?(\\d){0,${decPlaces}})$`).test(inputValue)) {
      // when decimal value is bigger than 0, we only accept the decimal values as that value set
      // for example if we set decimalPlaces to 2, we will only accept numbers between 0 and 2 decimals
      isValid = false;
      outputMsg =
        errorMsg ||
        Constants.VALIDATION_EDITOR_DECIMAL_BETWEEN.replace(/{{minDecimal}}|{{maxDecimal}}/gi, (matched) => (mapValidation as any)[matched]);
    }
    return { valid: isValid, msg: outputMsg };
  }


  override loadValue(item: any): void {
    const fieldName = this.columnDef?.field;

    if (fieldName !== undefined) {
      if (item && fieldName !== undefined && this._input) {
        // is the field a complex object, "address.streetNumber"
        const isComplexObject = fieldName?.indexOf('.') > 0;
        const value = isComplexObject ? getDescendantProperty(item, fieldName) : item[fieldName];

        this._originalValue = value;

        this._originalValue = parseFloat(String(this._originalValue))


        const decPlaces = this.getDecimalPlaces();
        if (decPlaces !== null && (this._originalValue || this._originalValue === 0) && this._originalValue !== undefined) {
          this._originalValue = (+this._originalValue).toFixed(decPlaces);
        }

        if (isNaN(Number(this._originalValue)))
          this._input.value = ''
        else {

          this._input.value = `${String(this._originalValue).replace('.',this.decimal_mark)}`
        } this._input.select();

      }
    }
  }

  override serializeValue(): string | number {
    let elmValue = this._input?.value;

    elmValue = String(elmValue).replace(this.thousand_sep,'')
    elmValue = String(elmValue).replace(this.decimal_mark,'.')

    if (elmValue === undefined || elmValue === '' || isNaN(+elmValue)) {
      return elmValue as string;
    }



    let rtn = parseFloat(elmValue);
    const decPlaces = this.getDecimalPlaces();
    if (decPlaces !== null && (rtn || rtn === 0) && rtn.toFixed) {
      rtn = parseFloat(rtn.toFixed(decPlaces));
    }
    return rtn;
  }

  override validate(_targetElm?: any, inputValue?: any): EditorValidationResult {
    // when using Composite Editor, we also want to recheck if the field if disabled/enabled since it might change depending on other inputs on the composite form
    if (this.args.compositeEditorOptions) {
      this.applyInputUsabilityState();
    }

    // when field is disabled, we can assume it's valid
    if (this.disabled) {
      return { valid: true, msg: '' };
    }

//    let valueFromInput = String(this._input?.value)
//    valueFromInput =  valueFromInput.replace(this.thousand_sep,'')
//    valueFromInput =  valueFromInput.replace(this.decimal_mark,'.')

    let elmValue = inputValue !== undefined ? inputValue : this._input?.value;


    elmValue =  String(elmValue).replace(this.thousand_sep,'')
    elmValue =  String(elmValue).replace(this.decimal_mark,'.')



    return this.floatValidator(elmValue, {
      editorArgs: this.args,
      errorMessage: this.columnEditor.errorMessage,
      decimal: this.getDecimalPlaces(),
      minValue: this.columnEditor.minValue,
      maxValue: this.columnEditor.maxValue,
      operatorConditionalType: this.columnEditor.operatorConditionalType,
      required: this.args?.compositeEditorOptions ? false : this.columnEditor.required,
      validator: this.validator,
    });
  }
}
