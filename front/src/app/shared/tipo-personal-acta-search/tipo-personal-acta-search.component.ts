import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, forwardRef, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { noop } from 'rxjs';
import { SHARED_IMPORTS } from '@shared';
import { SearchService } from '../../services/search.service';

interface TipoPersonalActaOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-tipo-personal-acta-search',
  templateUrl: './tipo-personal-acta-search.component.html',
  styleUrls: ['./tipo-personal-acta-search.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TipoPersonalActaSearchComponent),
      multi: true,
    },
  ],
  imports: [...SHARED_IMPORTS, CommonModule],
})
export class TipoPersonalActaSearchComponent implements ControlValueAccessor {
  private searchService = inject(SearchService);

  @Input() valueExtended: any;
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>();

  tiposPersonalActa = toSignal(
    this.searchService.getTipoPersonalActaOptions(),
    { initialValue: [] as TipoPersonalActaOption[] }
  );

  private _selected: string | null = null;
  controlDisabled = false;

  private propagateChange: (_: any) => void = noop;
  private propagateTouched: () => void = noop;

  get selected(): string | null {
    return this._selected;
  }

  set selected(val: string | null) {
    val = val ?? null;
    if (val !== this._selected) {
      this._selected = val;
      this.emitExtendedValue();
      this.propagateChange(this._selected);
    }
  }

  modelChange(val: string | null) {
    this.selected = val;
  }

  onBlur() {
    this.propagateTouched();
  }

  writeValue(value: any) {
    this._selected = value ?? null;
    this.emitExtendedValue();
  }

  registerOnChange(fn: any) {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any) {
    this.propagateTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.controlDisabled = isDisabled;
  }

  private emitExtendedValue() {
    const option = this.tiposPersonalActa().find((tipo: TipoPersonalActaOption) => tipo.value === this._selected);
    this.valueExtendedEmitter.emit({ fullName: option?.label || '' });
  }
}
