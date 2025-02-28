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
import { SearchRubro } from '../schemas/rubro.schemas'
import { SearchService } from 'src/app/services/search.service'
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms'
import { doOnSubscribe } from 'src/app/services/api.service'
import { NzSelectComponent } from 'ng-zorro-antd/select'
import { SHARED_IMPORTS } from '@shared'
import { CommonModule } from '@angular/common'

@Component({
    selector: 'app-rubro-search',
    templateUrl: './rubro-search.component.html',
    styleUrls: ['./rubro-search.component.less'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => RubroSearchComponent),
            multi: true,
        },
    ],
    imports: [...SHARED_IMPORTS, CommonModule]
})

export class RubroSearchComponent implements ControlValueAccessor {
  tmpInputVal: any
  constructor(private searchService: SearchService) { }

  @Input() valueExtended: any
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>()
  @ViewChild("isc") isc!: NzSelectComponent

  $searchChange = new BehaviorSubject('')
  $isOptionsLoading = new BehaviorSubject<boolean>(false)

  private _selectedId: string = ''
  _selected = ''
  extendedOption = { RubroClienteId: 0, RubroClienteDescripcion: '' }
  
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
          .getRubroFromName('RubroClienteId', this._selectedId)
            .pipe(tap(res => {
              this.extendedOption = { RubroClienteId: res[0].RubroClienteId, RubroClienteDescripcion: res[0].RubroClienteDescripcion }
              this._selected = this._selectedId
              this.valueExtendedEmitter.emit(this.extendedOption)
              if (this.tmpInputVal != this._selected) {
                this.propagateChange(this._selectedId)
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

  $optionsArray: Observable<SearchRubro[]> = this.$searchChange.pipe(
    debounceTime(500),
    switchMap(value =>
      this.searchService
        .getRubroSearch(Number(value) ? 'RubroClienteId' : 'RubroClienteDescripcion', value)
        .pipe(
          doOnSubscribe(() => this.$isOptionsLoading.next(true)),
          tap({ complete: () => this.$isOptionsLoading.next(false) })
        )
    )
  )

  modelChange(val: string) {
    this.selectedId = val
  }


  setDisabledState(isDisabled: boolean): void {
    this.isc?.setDisabledState(isDisabled)
  } 

  search(value: string): void {
    this.extendedOption = { RubroClienteId: 0, RubroClienteDescripcion: '' }
    this.$searchChange.next(value)
  }



} 