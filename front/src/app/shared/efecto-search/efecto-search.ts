import { ChangeDetectionStrategy, Component, forwardRef, input, output, effect, inject, resource, signal, viewChild } from '@angular/core';
import { firstValueFrom, noop } from 'rxjs';
import { SearchEfecto } from '../schemas/efecto.schemas';
import { SearchService } from '../../services/search.service';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { NzSelectComponent } from 'ng-zorro-antd/select';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';

type ExtendedOption = { EfectoId: number; EfectoEfectoIndividualId: number | null; fullName: string };

@Component({
  selector: 'app-efecto-search',
  imports: [...SHARED_IMPORTS, CommonModule],
  templateUrl: './efecto-search.html',
  styleUrl: './efecto-search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EfectoSearchComponent),
      multi: true,
    },
  ],
})
export class EfectoSearchComponent implements ControlValueAccessor {
  private searchService = inject(SearchService);

  readonly valueExtended = input<any>()
  // Param 1 (opcional): si es true, el buscador solo trae efectos con StockStock > 0. Por defecto
  // false para NO afectar a los demás usos del componente (p. ej. el buscador de filtros de grillas).
  readonly soloConStock = input(false)
  // Param 2 (opcional): si es true, solo trae efectos que tengan EfectoEfectoIndividualId (individuales).
  readonly soloConIndividual = input(false)
  readonly valueExtendedChange = output<any>()
  readonly csc = viewChild<NzSelectComponent>('csc')

  // Estado de la vista como signals (habilita OnPush): el valor del nz-select y la opción "fija"
  // que se muestra para un efecto ya seleccionado (cuando no está entre los resultados de búsqueda).
  readonly selectedLabel = signal('')
  readonly extendedOption = signal<ExtendedOption>({ EfectoId: 0, EfectoEfectoIndividualId: null, fullName: '' })

  private _selectedId = ''

  // Individual del efecto a mostrar cuando el valor llega sólo por EfectoId (p. ej. una línea precargada).
  // Permite distinguir varios individuales del mismo EfectoId y no quedarse con el primero.
  // El transform normaliza ('' / undefined / NaN -> null) para que la comparación del signal sea limpia.
  readonly individualId = input<number | null, number | null | undefined | string>(null, {
    transform: (val) => {
      const n = (val === null || val === undefined || (val as any) === '') ? null : Number(val)
      return Number.isNaN(n as number) ? null : n
    }
  })

  // ----- Búsqueda: signals + resource, sin pipelines rxjs -----
  private readonly termino = signal('')
  private readonly terminoDebounced = signal('')
  readonly opciones = resource({
    params: () => ({ q: this.terminoDebounced(), stock: this.soloConStock(), indiv: this.soloConIndividual() }),
    loader: async ({ params }) => {
      if (!params.q) return [] as SearchEfecto[]
      return (await firstValueFrom(
        this.searchService.getEfectoFromName('EfectoDescripcion', params.q, params.stock, params.indiv)
      )) ?? []
    },
  })

  constructor() {
    // Cuando cambia el individual (input), reprogramamos la resolución del label. El signal solo
    // notifica cuando el valor (ya normalizado por el transform) cambia, así que no hay re-resolución
    // redundante (reemplaza la guarda manual que tenía el viejo setter).
    effect(() => {
      this.individualId();
      this.scheduleResolve();
    });
    // Debounce del término de búsqueda SIN rxjs: effect + setTimeout, con onCleanup que cancela el
    // timer anterior en cada tecla. A los 500ms sin cambios se actualiza terminoDebounced -> resource.
    effect((onCleanup) => {
      const t = this.termino();
      const id = setTimeout(() => this.terminoDebounced.set(t), 500);
      onCleanup(() => clearTimeout(id));
    });
  }

  private propagateTouched: () => void = noop
  private propagateChange: (_: any) => void = noop

  registerOnChange(fn: any) {
    this.propagateChange = fn
  }

  registerOnTouched(fn: any) {
    this.propagateTouched = fn
  }

  onBlur() {
    this.propagateTouched()
  }

  get selectedId() {
    return this._selectedId
  }

  set selectedId(val: string) {
    val = (val === null || val === undefined || val == '0') ? '' : val

    if (val !== this._selectedId) {
      this._selectedId = val

      if (this._selectedId == '') {
        this.valueExtendedChange.emit({})
        this.selectedLabel.set('')
        this.extendedOption.set({ EfectoId: 0, EfectoEfectoIndividualId: null, fullName: '' })
        this.propagateChange(this._selectedId)
        return
      }

      // Resolvemos la etiqueta en un microtask: así, si EfectoId e individualId llegan en el mismo
      // ciclo (línea precargada), elegimos el individual correcto en una sola pasada.
      this.scheduleResolve()
    }
  }

  private _resolvePending = false
  private scheduleResolve(): void {
    if (this._resolvePending) return
    this._resolvePending = true
    queueMicrotask(() => {
      this._resolvePending = false
      this.resolveLabel()
    })
  }

  private async resolveLabel(): Promise<void> {
    const id = this._selectedId
    if (!id) return

    // Ya resuelto para este efecto + individual: sólo aseguramos el valor mostrado, sin re-emitir.
    const opt = this.extendedOption()
    if (opt.EfectoId === Number(id) && (opt.EfectoEfectoIndividualId ?? null) === this.individualId()) {
      this.selectedLabel.set(`${opt.EfectoId}|${opt.EfectoEfectoIndividualId ?? ''}`)
      return
    }

    const res = await firstValueFrom(this.searchService.getEfectoFromName('EfectoId', id))
    if (res && res.length > 0) {
      // Elegimos el registro del individual indicado; si no se indicó (o no está), caemos al primero.
      const match = res.find(r => (r.EfectoEfectoIndividualId ?? null) === this.individualId()) ?? res[0]
      const nuevo: ExtendedOption = {
        EfectoId: match.EfectoId,
        EfectoEfectoIndividualId: match.EfectoEfectoIndividualId ?? null,
        fullName: match.EfectoDescripcion
      }
      this.extendedOption.set(nuevo)
      this.selectedLabel.set(`${nuevo.EfectoId}|${nuevo.EfectoEfectoIndividualId ?? ''}`)
      this.valueExtendedChange.emit(nuevo)
    }
  }

  writeValue(value: any) {
    if (value !== this._selectedId) {
      this.selectedId = value
    }
  }

  modelChange(val: string | null) {
    if (!val) {
      this.selectedId = ''
      return
    }
    const [idStr, indivStr] = val.split('|');
    const efectoId = Number(idStr);
    const individualId = indivStr === '' || indivStr === undefined ? null : Number(indivStr);
    const normalizedIndividual = Number.isNaN(individualId as number) ? null : individualId;

    const picked = (this.opciones.value() ?? []).find(efect =>
      efect.EfectoId === efectoId && (efect.EfectoEfectoIndividualId ?? null) === normalizedIndividual
    );

    const nuevo: ExtendedOption = {
      EfectoId: efectoId,
      EfectoEfectoIndividualId: normalizedIndividual,
      fullName: picked?.EfectoDescripcion ?? this.extendedOption().fullName
    }
    this.extendedOption.set(nuevo)
    this.selectedLabel.set(`${efectoId}|${normalizedIndividual ?? ''}`)

    // Siempre emitimos con la selección actual del usuario (incluye individual).
    this.valueExtendedChange.emit(nuevo)

    // Sincronizamos el id y propagamos al form si cambió.
    const efectoIdStr = String(efectoId)
    if (efectoIdStr !== this._selectedId) {
      this._selectedId = efectoIdStr
      this.propagateChange(this._selectedId)
    }
  }

  search(value: string): void {
    this.extendedOption.set({ EfectoId: 0, EfectoEfectoIndividualId: null, fullName: '' })
    this.termino.set(value)
  }

  setDisabledState(isDisabled: boolean): void {
    this.csc()?.setDisabledState(isDisabled)
  }

}
