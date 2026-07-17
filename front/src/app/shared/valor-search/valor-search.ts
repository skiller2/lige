import { ChangeDetectionStrategy, Component, forwardRef, inject, input, resource, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { firstValueFrom, noop } from 'rxjs';
import { SearchService } from '../../services/search.service';
import { SHARED_IMPORTS } from '@shared';
import { Valor } from '../schemas/efecto.schemas';

/**
 * Select de la tabla Valor. Cada Valor pertenece a un Atributo: la lista se limita a los valores de
 * [atributoId], y sin atributo no muestra opciones (valor dependiente del atributo, como subrubro lo
 * es del rubro). Expone el ValorId como valor del control, así que sirve con [formField] (signal
 * forms) o con formControlName / ngModel.
 */
@Component({
  selector: 'app-valor-search',
  imports: [...SHARED_IMPORTS],
  templateUrl: './valor-search.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ValorSearchComponent),
      multi: true,
    },
  ],
})
export class ValorSearchComponent implements ControlValueAccessor {
  private searchService = inject(SearchService);

  readonly placeholder = input('Valor');

  // Filtra las opciones por atributo. La lista se recarga cuando cambia.
  readonly atributoId = input<number | null>(null);

  readonly valores = resource({
    params: () => ({ atributoId: this.atributoId() }),
    // Sin atributo no hay valores que ofrecer: se evita además traer la tabla entera.
    loader: async ({ params }) =>
      params.atributoId == null
        ? [] as Valor[]
        : (await firstValueFrom(this.searchService.getValores(params.atributoId))) ?? [] as Valor[],
  });

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

  // ValorId es DECIMAL(12,0): puede llegar como string y hay que normalizarlo para que el
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
