import { Component, forwardRef, inject } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { noop } from 'rxjs';
import { SearchService } from '../../services/search.service';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-proveedor-search',
  templateUrl: './proveedor-search.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ProveedorSearchComponent),
      multi: true,
    },
  ],
  imports: [...SHARED_IMPORTS, CommonModule],
})
export class ProveedorSearchComponent implements ControlValueAccessor {
  private searchService = inject(SearchService);

  proveedores = toSignal(
    this.searchService.getStockEfectoProveedores(),
    { initialValue: [] as { ProveedorId: number; ProveedorRazonSocial: string }[] }
  );

  private _selected: number | null = null;
  controlDisabled = false;

  private propagateChange: (_: any) => void = noop;
  private propagateTouched: () => void = noop;

  get selected(): number | null {
    return this._selected;
  }

  set selected(val: number | null) {
    val = val ?? null;
    if (val !== this._selected) {
      this._selected = val;
      this.propagateChange(this._selected);
    }
  }

  modelChange(val: number | null) {
    this.selected = val;
  }

  onBlur() {
    this.propagateTouched();
  }

  writeValue(value: any) {
    this._selected = value ?? null;
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
}
