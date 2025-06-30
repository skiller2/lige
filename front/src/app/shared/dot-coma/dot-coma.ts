import {
  Directive,
  HostListener,
  ElementRef,
  Optional,
  Self,
  inject
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { DEFAULT_DECIMAL_MARKER } from 'src/app/app.config.defaults';

@Directive({
  selector: '[appDotToComma]'
})
export class DotToCommaDirective {
  decimal = inject(DEFAULT_DECIMAL_MARKER)
  el = inject(ElementRef)

//  constructor(
//    @Optional() @Self() private ngControl: NgControl
//  ) { }

  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent) {
    if (this.decimal === ',' && event.key === '.') {
      event.preventDefault();

      const input = this.el.nativeElement;
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const value = input.value;

      // Replace the dot with a comma at the cursor position
      input.value = value.substring(0, start) + ',' + value.substring(end);

      // Move the cursor after the inserted comma
      input.setSelectionRange(start + 1, start + 1);
    }
  }
}
