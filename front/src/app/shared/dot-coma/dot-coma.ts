import {
  Directive,
  HostListener,
  ElementRef,
  Optional,
  Self
} from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appDotToComma]'
})
export class DotToCommaDirective {

  constructor(
    private el: ElementRef,
    @Optional() @Self() private ngControl: NgControl
  ) {}

  @HostListener('input', ['$event'])
  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const originalValue = input.value;
    const transformedValue = originalValue.replace(/\./g, ',');

    if (originalValue !== transformedValue) {
      input.value = transformedValue;

      // Update the form control if present
      if (this.ngControl && this.ngControl.control) {
        this.ngControl.control.setValue(transformedValue, {
          emitEvent: false,
          emitModelToViewChange: true,
          emitViewToModelChange: true
        });
      } else {
        // Fallback for plain input
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        nativeInputValueSetter?.call(input, transformedValue);
        const newEvent = new Event('input', { bubbles: true });
        input.dispatchEvent(newEvent);
      }
    }
  }
}
