import { Constants, EditorArguments, EditorValidationResult, EditorValidator, getDescendantProperty, InputEditor } from "angular-slickgrid";

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
  constructor(protected override readonly args: EditorArguments) {
    super(args, 'number');
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
        const decPlaces = this.getDecimalPlaces();
        if (decPlaces !== null && (this._originalValue || this._originalValue === 0) && this._originalValue !== undefined) {
          this._originalValue = (+this._originalValue).toFixed(decPlaces);
        }
        this._input.value = `${this._originalValue}`;
        this._input.select();
      }
    }
  }

  override serializeValue(): string | number {
    const elmValue = this._input?.value;
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

    const elmValue = inputValue !== undefined ? inputValue : this._input?.value;

    console.log('this.getDecimalPlaces()',this.getDecimalPlaces())
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
