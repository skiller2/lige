
import { Component, EventEmitter, Input, Output, SimpleChanges, ViewChild, forwardRef, model } from '@angular/core'
import {
  BehaviorSubject,
  Observable,
  debounceTime,
  firstValueFrom,
  noop,
  switchMap,
  tap,
} from 'rxjs'
import { SearchSituacionRevista } from '../schemas/situacionrevista.shemas'
import { SearchService } from 'src/app/services/search.service'
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms'
import { doOnSubscribe } from 'src/app/services/api.service'
import { NzSelectComponent } from 'ng-zorro-antd/select'
import { SHARED_IMPORTS } from '@shared'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-situacionrevista-search',
  templateUrl: './situacionrevista-search.component.html',
  styleUrls: ['./situacionrevista-search.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SituacionRevistaSearchComponent ),
      multi: true,
    },
  ],
  standalone: true,
  imports: [ ...SHARED_IMPORTS,CommonModule],

})

export class SituacionRevistaSearchComponent  implements ControlValueAccessor {
  tmpInputVal: any
  constructor(private searchService: SearchService) { }

  @Input() valueExtended: any
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>()
  @ViewChild("isc") isc!: NzSelectComponent

  $searchChange = new BehaviorSubject('')
  $isOptionsLoading = new BehaviorSubject<boolean>(false)

  private _selectedId: string = ''
  _selected = ''
  extendedOption = { SituacionRevistaId: 0, SituacionRevistaDescripcion: '' }
  
  private propagateTouched: () => void = noop
  private propagateChange: (_: any) => void = noop

  registerOnChange(fn: any) {

    this.propagateChange = fn
  }

  onBlur() {
    this.propagateTouched()
  }

  onChange() {
//    this.isc?.focus()

  }

  onRemove() {
    //  console.log('onRemove')
  }

  registerOnTouched(fn: any) {
    this.propagateTouched = fn
  }

  ngOnDestroy() { 
    this.isc?.originElement.nativeElement.removeEventListener('keydown', this.onKeydown.bind(this))
  }

  onKeydown(event: KeyboardEvent) {
//    this._lastInputEvent = event;
//    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
    if ( event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
      event.stopImmediatePropagation()
    }
  }



  ngAfterViewInit() {
    setTimeout(() => {
      this.isc?.originElement.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));
      this.isc?.focus()  //Al hacer click en el componente hace foco
     
    }, 1);
  }


  get selectedId() {
    return this._selectedId
  }

  set selectedId(val: string) {

    this.isc?.focus()
    val = (val === null || val === undefined) ? '' : val

    if (val !== this._selectedId) {
      this._selectedId = val

      if (this._selectedId == '' || this._selectedId == '0') {
        this.valueExtendedEmitter.emit({})
        this._selected = ''
        this.propagateChange(this._selectedId)
        return
      }

      firstValueFrom(
        this.searchService
          .getSituacionRevistaFromName('SituacionRevistaId', this._selectedId)
          .pipe(tap(res => {
            if (res[0]?.SituacionRevistaId)
            this.extendedOption = res[0]
            this._selected = this._selectedId
            this.valueExtendedEmitter.emit(this.extendedOption)
            if (this.tmpInputVal!=this._selectedId)
              this.propagateChange(this._selectedId)
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

  $optionsArray: Observable<SearchSituacionRevista[]> = this.$searchChange.pipe(
    debounceTime(500),
    switchMap(value =>
      this.searchService
        .getSituacionRevistaSearch(Number(value) ? 'SituacionRevistaId' : 'SituacionRevistaDescripcion', value)
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
    this.extendedOption = { SituacionRevistaId: 0, SituacionRevistaDescripcion: '' }
    this.$searchChange.next(value)
  }

  focus() { 
    console.log('focus')

  }


  setDisabledState(isDisabled: boolean): void {
    this.isc?.setDisabledState(isDisabled)
  } 

}

