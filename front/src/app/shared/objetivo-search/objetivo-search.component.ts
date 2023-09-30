import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core'
import {
  BehaviorSubject,
  Observable,
  debounceTime,
  firstValueFrom,
  noop,
  switchMap,
  tap,
} from 'rxjs'
import { Search } from '../schemas/personal.schemas'
import { SearchService } from 'src/app/services/search.service'
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms'
import { doOnSubscribe } from 'src/app/services/api.service'

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
})

export class ObjetivoSearchComponent implements ControlValueAccessor {
  constructor(private searchService: SearchService) { }

  @Input() sucursalId: number | null = null;
  @Input() valueExtended: any
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>()

  $searchChange = new BehaviorSubject('');
  $isOptionsLoading = new BehaviorSubject<boolean>(false)

  private _selectedId: string = ''
  _selected = ''
  extendedOption = { objetivoId: 0, clienteId: 0, elementoDependienteId: 0, descripcion: '', fullName: '' }

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
    //  console.log('onRemove')
  }

  registerOnTouched(fn: any) {
    this.propagateTouched = fn
  }



  get selectedId() {
    return this._selectedId
  }

  set selectedId(val: string) {
    val = (val === null || val === undefined) ? '' : val
    if (val !== this._selectedId) {
      this._selectedId = val

      if (!this._selectedId && this._selectedId !== null) {
        this.valueExtendedEmitter.emit(null)
        this.propagateChange(this._selectedId)
        return
      }
      firstValueFrom(
        this.searchService
          .ObjetivoInfoFromId(this._selectedId)
          .pipe(tap(res => {
            this.extendedOption = res
            this._selected = this._selectedId
            this.valueExtendedEmitter.emit(this.extendedOption)
            this.propagateChange(this._selectedId)
          }))
      )
    }
  }

  writeValue(value: any) {
    if (value !== this._selectedId) {
      this.selectedId = value
    }
  }

  $optionsArray = this.$searchChange.pipe(
    debounceTime(500),
    switchMap(value => {
      return this.searchService
        .getObjetivos(Number(value.charAt(0)) ? 'Codigo' : 'Descripcion', value, (this.sucursalId) ? String(this.sucursalId) : '0')
        .pipe(
          doOnSubscribe(() => this.$isOptionsLoading.next(true)),
          tap({ complete: () => this.$isOptionsLoading.next(false) })
        );
    })
  )

  modelChange(val: string) {
    this.selectedId = val;
  }

  search(value: string): void {
    this.extendedOption = { objetivoId: 0, clienteId: 0, elementoDependienteId: 0, descripcion: '', fullName: '' }
    this.$searchChange.next(value);
  }
}
