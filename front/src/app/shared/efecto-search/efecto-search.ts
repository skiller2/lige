import { Component, EventEmitter, Input, Output, ViewChild, forwardRef } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  debounceTime,
  firstValueFrom,
  noop,
  switchMap,
  tap,
} from 'rxjs';
import { SearchEfecto } from '../schemas/efecto.schemas';
import { SearchService } from '../../services/search.service';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { doOnSubscribe } from '../../services/api.service';
import { NzSelectComponent } from 'ng-zorro-antd/select';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-efecto-search',
  imports: [...SHARED_IMPORTS, CommonModule],
  templateUrl: './efecto-search.html',
  styleUrl: './efecto-search.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EfectoSearchComponent),
      multi: true,
    },
  ],
})
export class EfectoSearchComponent implements ControlValueAccessor {
  tmpInputVal: any;
  constructor(private searchService: SearchService) { }

  @Input() valueExtended: any
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>()
  @ViewChild("csc") csc!: NzSelectComponent

  private _selectedId: string = ''
  _selected = ''
  // Individual del efecto a mostrar cuando el valor llega sólo por EfectoId (p. ej. una línea precargada).
  // Permite distinguir varios individuales del mismo EfectoId y no quedarse con el primero.
  private _individualId: number | null = null
  extendedOption: { EfectoId: number; EfectoEfectoIndividualId: number | null; fullName: string } =
    { EfectoId: 0, EfectoEfectoIndividualId: null, fullName: "" }

  @Input()
  set individualId(val: number | null | undefined) {
    const n = (val === null || val === undefined || (val as any) === '') ? null : Number(val)
    const norm = Number.isNaN(n as number) ? null : n
    if (norm === this._individualId) return
    this._individualId = norm
    this.scheduleResolve()
  }

  private propagateTouched: () => void = noop
  private propagateChange: (_: any) => void = noop

  registerOnChange(fn: any) {
    this.propagateChange = fn
  }

  onBlur() {
    this.propagateTouched()
  }

  onChange() {
  }

  onRemove() {

  }

  registerOnTouched(fn: any) {
    this.propagateTouched = fn
  }

  ngAfterViewInit() {
    setTimeout(() => {
      // this.csc.focus()
    }, 1);
  }


  get selectedId() {
    return this._selectedId
  }

  set selectedId(val: string) {
    val = (val === null || val === undefined || val == '0') ? '' : val

    if (val !== this._selectedId) {
      this._selectedId = val

      if (this._selectedId == '') {
        this.valueExtendedEmitter.emit({})
        this._selected = ''
        this.extendedOption = { EfectoId: 0, EfectoEfectoIndividualId: null, fullName: "" }
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
    if (this.extendedOption.EfectoId === Number(id) &&
        (this.extendedOption.EfectoEfectoIndividualId ?? null) === this._individualId) {
      this._selected = `${this.extendedOption.EfectoId}|${this.extendedOption.EfectoEfectoIndividualId ?? ''}`
      return
    }

    const res = await firstValueFrom(this.searchService.getEfectoFromName('EfectoId', id))
    if (res && res.length > 0) {
      // Elegimos el registro del individual indicado; si no se indicó (o no está), caemos al primero.
      const match = res.find(r => (r.EfectoEfectoIndividualId ?? null) === this._individualId) ?? res[0]
      this.extendedOption = {
        EfectoId: match.EfectoId,
        EfectoEfectoIndividualId: match.EfectoEfectoIndividualId ?? null,
        fullName: match.EfectoDescripcion
      }
      this._selected = `${this.extendedOption.EfectoId}|${this.extendedOption.EfectoEfectoIndividualId ?? ''}`
      this.valueExtendedEmitter.emit(this.extendedOption)
    }
  }

  writeValue(value: any) {
    this.tmpInputVal = value
    if (value !== this._selectedId) {
      this.selectedId = value
    }
  }

  selectedInfoChange$ = new BehaviorSubject<SearchEfecto[] | null>(null);

  $searchChange = new BehaviorSubject('');
  $isOptionsLoading = new BehaviorSubject<boolean>(false);
  private latestOptions: SearchEfecto[] = [];
  $optionsArray: Observable<SearchEfecto[]> = this.$searchChange.pipe(
    debounceTime(500),
    switchMap(value =>
      this.searchService
        .getEfectoFromName('EfectoDescripcion', value)
        .pipe(
          doOnSubscribe(() => this.$isOptionsLoading.next(true)),
          tap(opts => { this.latestOptions = opts ?? [] }),
          tap({ complete: () => this.$isOptionsLoading.next(false) })
        )
    )
  );

  modelChange(val: string | null) {
    if (!val) {
      this.selectedId = ''
      return
    }
    const [idStr, indivStr] = val.split('|');
    const efectoId = Number(idStr);
    const individualId = indivStr === '' || indivStr === undefined ? null : Number(indivStr);
    const normalizedIndividual = Number.isNaN(individualId as number) ? null : individualId;

    const picked = this.latestOptions.find(efect =>
      efect.EfectoId === efectoId && (efect.EfectoEfectoIndividualId ?? null) === normalizedIndividual
    );

    this.extendedOption = {
      EfectoId: efectoId,
      EfectoEfectoIndividualId: normalizedIndividual,
      fullName: picked?.EfectoDescripcion ?? this.extendedOption.fullName
    }
    this._selected = `${efectoId}|${normalizedIndividual ?? ''}`

    // Siempre emitimos con la selección actual del usuario (incluye individual).
    this.valueExtendedEmitter.emit(this.extendedOption)

    // Sincronizamos el id y propagamos al form si cambió.
    const efectoIdStr = String(efectoId)
    if (efectoIdStr !== this._selectedId) {
      this._selectedId = efectoIdStr
      this.propagateChange(this._selectedId)
    }
  }

  search(value: string): void {
    this.extendedOption = { EfectoId: 0, EfectoEfectoIndividualId: null, fullName: "" }
    this.$searchChange.next(value)
  }

  setDisabledState(isDisabled: boolean): void {
    this.csc?.setDisabledState(isDisabled)
  }

}
