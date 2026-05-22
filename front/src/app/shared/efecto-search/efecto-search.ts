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
  extendedOption: { EfectoId: number; EfectoEfectoIndividualId: number | null; fullName: string } =
    { EfectoId: 0, EfectoEfectoIndividualId: null, fullName: "" }

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

      firstValueFrom(
        this.searchService.getEfectoFromName('EfectoId', this._selectedId)
          .pipe(tap(res => {
            if (res && res.length > 0) {
              this.extendedOption = {
                EfectoId: res[0].EfectoId,
                EfectoEfectoIndividualId: res[0].EfectoEfectoIndividualId ?? null,
                fullName: res[0].EfectoDescripcion
              }
              this._selected = `${this.extendedOption.EfectoId}|${this.extendedOption.EfectoEfectoIndividualId ?? ''}`
              this.valueExtendedEmitter.emit(this.extendedOption)
              if (this.tmpInputVal != this._selectedId) {
                this.propagateChange(this._selectedId)
              }
            }
          }))
      )
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
  $optionsArray: Observable<SearchEfecto[]> = this.$searchChange.pipe(
    debounceTime(500),
    switchMap(value =>
      this.searchService
        .getEfectoFromName(Number(value) ? 'EfectoId' : 'EfectoDescripcion', value)
        .pipe(
          doOnSubscribe(() => this.$isOptionsLoading.next(true)),
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

    // Capturamos el individual antes de disparar selectedId para que valueExtended lo lleve.
    this.extendedOption = {
      EfectoId: efectoId,
      EfectoEfectoIndividualId: Number.isNaN(individualId as number) ? null : individualId,
      fullName: this.extendedOption.fullName
    }
    this.selectedId = String(efectoId)
  }

  search(value: string): void {
    this.extendedOption = { EfectoId: 0, EfectoEfectoIndividualId: null, fullName: "" }
    this.$searchChange.next(value)
  }

  setDisabledState(isDisabled: boolean): void {
    this.csc?.setDisabledState(isDisabled)
  }

}
