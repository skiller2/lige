import { Component, computed, forwardRef, inject, input, resource } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { firstValueFrom, noop } from 'rxjs';
import { SearchService } from '../../services/search.service';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tipo-destino-search',
  templateUrl: './tipo-destino-search.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TipoDestinoSearchComponent),
      multi: true,
    },
  ],
  imports: [...SHARED_IMPORTS, CommonModule],
})
export class TipoDestinoSearchComponent implements ControlValueAccessor {
  private searchService = inject(SearchService);

  readonly soloIntermediario = input<boolean>(false);

  private tiposResource = resource({
    params: () => ({ soloIntermediario: this.soloIntermediario() }),
    loader: async ({ params }) => await firstValueFrom(
      this.searchService.getStockEfectoTiposDestino(params.soloIntermediario)
    ) as { value: string; label: string }[],
  });

  tiposDestino = computed(() => this.tiposResource.value() ?? []);

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
