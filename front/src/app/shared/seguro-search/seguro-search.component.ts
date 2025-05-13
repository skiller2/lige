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
import { SearchSeguro } from '../schemas/seguro.schemas'
import { SearchService } from 'src/app/services/search.service'
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms'
import { doOnSubscribe } from 'src/app/services/api.service'
import { NzSelectComponent } from 'ng-zorro-antd/select'
import { SHARED_IMPORTS } from '@shared'
import { CommonModule } from '@angular/common'

@Component({
    selector: 'app-seguro-search',
    templateUrl: './seguro-search.component.html',
    styleUrls: ['./seguro-search.component.less'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SeguroSearchComponent),
            multi: true,
        },
    ],
    imports: [...SHARED_IMPORTS, CommonModule]
})

export class SeguroSearchComponent implements ControlValueAccessor {
  tmpInputVal: any
  constructor(private searchService: SearchService) { }

  @Input() valueExtended: any
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>()
  @ViewChild("seg") seg!: NzSelectComponent

  $searchChange = new BehaviorSubject('')
  $isOptionsLoading = new BehaviorSubject<boolean>(false)

  private _selectedId: string = ''
  _selected = ''
  extendedOption = { TipoSeguroCodigo: '', TipoSeguroNombre: '' }
  
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
    this.seg?.originElement.nativeElement.removeEventListener('keydown', this.onKeydown.bind(this))
  }

  onKeydown(event: KeyboardEvent) {

    if ( event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
      event.stopImmediatePropagation()
    }
  }



  ngAfterViewInit() {
    setTimeout(() => {
      this.seg?.originElement.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));
      this.seg?.focus()  //Al hacer click en el componente hace foco
     
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
          .getSeguroFromName('TipoSeguroCodigo', this._selectedId)
            .pipe(tap(res => {
              this.extendedOption = { TipoSeguroCodigo: res[0].TipoSeguroCodigo,TipoSeguroNombre: res[0].TipoSeguroNombre }
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

  $optionsArray: Observable<SearchSeguro[]> = this.$searchChange.pipe(
    debounceTime(500),
    switchMap(value =>
      this.searchService
        .getSeguroSearch(Number(value) ? 'TipoSeguroCodigo' : 'TipoSeguroNombre', value)
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
    this.seg?.setDisabledState(isDisabled)
  } 

  search(value: string): void {
    this.extendedOption = { TipoSeguroCodigo: '', TipoSeguroNombre: '' }
    this.$searchChange.next(value)
  }



} 