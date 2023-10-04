import { Component, EventEmitter, Input, Output, ViewChild, forwardRef } from '@angular/core'
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
import { NzSelectComponent } from 'ng-zorro-antd/select'

@Component({
  selector: 'app-personal-search',
  templateUrl: './personal-search.component.html',
  styleUrls: ['./personal-search.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PersonalSearchComponent),
      multi: true,
    },
  ],
})

export class PersonalSearchComponent implements ControlValueAccessor {
  constructor(private searchService: SearchService) { }

  @Input() valueExtended: any
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>()
  @ViewChild("psc") psc!: NzSelectComponent


  $searchChange = new BehaviorSubject('')
  $isOptionsLoading = new BehaviorSubject<boolean>(false)

  private _selectedId: string = ''
  _selected = ''
  extendedOption = { PersonalId: 0, fullName: "" }
  
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

  ngAfterViewInit() {
    setTimeout(() => {
      this.psc.focus()
      
    }, 1);
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
          .getPersonFromName('PersonalId', this._selectedId)
          .pipe(tap(res => {
            this.extendedOption = res[0]
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

  $optionsArray: Observable<Search[]> = this.$searchChange.pipe(
    debounceTime(500),
    switchMap(value =>
      this.searchService
        .getPersonFromName(Number(value) ? 'CUIT' : 'Nombre', value)
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
    this.extendedOption = { PersonalId: 0, fullName: "" }
    this.$searchChange.next(value)
  }
}
