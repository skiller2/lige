import { Component, EventEmitter, Input, Output, ViewChild, effect, forwardRef, inject, input, linkedSignal, model, signal } from '@angular/core'
import {
  BehaviorSubject,
  Observable,
  debounceTime,
  firstValueFrom,
  noop,
  switchMap,
  tap,
} from 'rxjs'
import { SearchService } from '../../services/search.service'
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms'
import { doOnSubscribe } from '../../services/api.service'
import { NzSelectComponent } from 'ng-zorro-antd/select'
import { SHARED_IMPORTS } from '@shared'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-objetivo-search',
  templateUrl: './objetivo-search.component.html',
  styleUrls: ['./objetivo-search.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ObjetivoSearchComponent),
      multi: true,
    },
  ],
  imports: [...SHARED_IMPORTS, CommonModule]
})

export class ObjetivoSearchComponent implements ControlValueAccessor {
  constructor(private searchService: SearchService) { }
  @Input() valueExtended: any
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>()
  @ViewChild("osc") osc!: NzSelectComponent

  $searchChange = new BehaviorSubject('')
  $isOptionsLoading = new BehaviorSubject<boolean>(false)

  private _selectedId: string = ''
  _selected = signal('')
  extendedOption = { objetivoId: 0, clienteId: 0, ClienteElementoDependienteId: 0, descripcion: '', fullName: '' }

  private propagateTouched: () => void = noop
  private propagateChange: (_: any) => void = noop
  sucursalId = input<number | null>(null)
  controlDisabled = signal(true)

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

  ngOnDestroy() {
    this.osc?.originElement.nativeElement.removeEventListener('keydown', this.onKeydown.bind(this))
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
      event.stopImmediatePropagation()
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.osc.originElement.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));
    }, 1);
  }

  get selectedId() {
    return this._selectedId
  }

  get selectedIdNum(): number {
    return parseInt(this._selectedId)
  }

  set selectedId(val: string) {
    this.osc?.focus()
    val = (val === null || val === undefined) ? '' : val

    if (val !== this._selectedId) {
      this._selectedId = val

      if (this._selectedId == '' || this._selectedId == '0') {
        this.extendedOption = { objetivoId: 0, clienteId: 0, ClienteElementoDependienteId: 0, descripcion: '', fullName: '' }
        this.valueExtendedEmitter.emit(this.extendedOption)
        if (this._selected() != '')
          this._selected.set('')
        this.propagateChange(this._selectedId)
        return
      }

      firstValueFrom(
        this.searchService
          .ObjetivoInfoFromId(this._selectedId)
          .pipe(tap(res => {
            if (res?.objetivoId) this.extendedOption = res
            this._selected.set(this._selectedId)
            this.valueExtendedEmitter.emit(this.extendedOption)
            this.propagateChange(this._selectedId)
          }))
      )
    }
  }

  writeValue(value: any) {
    if (value === 0) value = ''
    if (value !== this._selectedId) {
      this.selectedId = value
    }
  }

  $optionsArray = this.$searchChange.pipe(
    debounceTime(500),
    switchMap(value =>
      this.searchService
        .getObjetivos(Number(value.charAt(0)) ? 'Codigo' : 'Descripcion', value, (this.sucursalId()) ? String(this.sucursalId()) : '0')
        .pipe(
          doOnSubscribe(() => this.$isOptionsLoading.next(true)),
          tap({ complete: () => this.$isOptionsLoading.next(false) })
        )
    )
  )

  modelChange(val: string) {
    this.selectedId = val
  }

  search(value: string): void {
    this.extendedOption = { objetivoId: 0, clienteId: 0, ClienteElementoDependienteId: 0, descripcion: '', fullName: '' }
    this.$searchChange.next(value)
  }

  focus() {
    console.log('focus')
  }

  setDisabledState(isDisabled: boolean): void {
    this.controlDisabled.set(isDisabled)
  }
}
