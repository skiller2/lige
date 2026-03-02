import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';
import { DEFAULT_DECIMAL_MARKER, DEFAULT_THOUSAND_SEPARATOR } from 'src/app/app.config.defaults';

@Directive({
  selector: '[appNumericFormat]',
  standalone: true
})
export class NumericFormatDirective {
  private readonly el = inject(ElementRef);
  private readonly decimalMarker = inject(DEFAULT_DECIMAL_MARKER);
  private readonly thousandSeparator = inject(DEFAULT_THOUSAND_SEPARATOR);

  decimals = input(2, { alias: 'appNumericFormat' });

  private get input(): HTMLInputElement {
    return this.el.nativeElement;
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const allowed = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'];
    if (allowed.includes(event.key)) return;

    // Allow digits
    if (event.key >= '0' && event.key <= '9') return;

    // Allow one decimal separator (dot or comma)
    if (event.key === '.' || event.key === ',') {
      const value = this.input.value;
      if (value.includes(',') || value.includes('.')) {
        event.preventDefault();
      }
      return;
    }

    // Allow select all, copy, paste, cut
    if (event.ctrlKey || event.metaKey) return;

    event.preventDefault();
  }

  @HostListener('blur')
  onBlur() {
    const raw = this.input.value;
    if (!raw) return;

    // Normalize: remove thousand separators, replace comma with dot for parsing
    const cleaned = raw.replace(new RegExp(`\\${this.thousandSeparator}`, 'g'), '').replace(',', '.');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return;

    // Format with thousand separators and decimal marker
    const parts = num.toFixed(this.decimals()).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, this.thousandSeparator);
    const formatted = parts.join(this.decimalMarker);

    this.input.value = formatted;
    this.input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  @HostListener('focus')
  onFocus() {
    const raw = this.input.value;
    if (!raw) return;

    // Remove thousand separators on focus for clean editing
    const cleaned = raw.replace(new RegExp(`\\${this.thousandSeparator}`, 'g'), '');
    this.input.value = cleaned;
  }
}
