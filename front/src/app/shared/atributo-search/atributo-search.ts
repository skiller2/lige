import { ChangeDetectionStrategy, Component, forwardRef, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { noop } from 'rxjs';
import { SearchService } from '../../services/search.service';
import { SHARED_IMPORTS } from '@shared';
import { Atributo } from '../schemas/efecto.schemas';

/**
 * Select de la tabla Atributo. Expone el AtributoId como valor del control, así que se puede usar
 * tanto con [formField] (signal forms) como con formControlName / ngModel.
 */
@Component({
  selector: 'app-atributo-search',
  imports: [...SHARED_IMPORTS],
  templateUrl: './atributo-search.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AtributoSearchComponent),
      multi: true,
    },
  ],
})
export class AtributoSearchComponent implements ControlValueAccessor {
  private searchService = inject(SearchService);

  readonly placeholder = input('Atributo');

  // Los atributos son pocos y no dependen del efecto: una sola carga para todas las instancias.
  readonly atributos = toSignal(this.searchService.getAtributos(), { initialValue: [] as Atributo[] });

  // Signals y no campos comunes: con OnPush, lo que escribe el form por CVA tiene que notificar.
  readonly selected = signal<number | null>(null);
  readonly controlDisabled = signal(false);

  private propagateChange: (_: any) => void = noop;
  private propagateTouched: () => void = noop;

  modelChange(val: number | null): void {
    const nuevo = val ?? null;
    if (nuevo === this.selected()) return;
    this.selected.set(nuevo);
    this.propagateChange(nuevo);
  }

  onBlur(): void {
    this.propagateTouched();
  }

  // AtributoId es DECIMAL(12,0): puede llegar como string y hay que normalizarlo para que el
  // nz-select lo empareje con el nzValue de la opción.
  writeValue(value: any): void {
    this.selected.set(value == null || value === '' ? null : Number(value));
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.propagateTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.controlDisabled.set(isDisabled);
  }
}
