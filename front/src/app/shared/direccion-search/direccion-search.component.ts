import { Component, EventEmitter, Input, Output, ViewChild, forwardRef, input, model, signal } from '@angular/core'
import {
  BehaviorSubject,
  Observable,
  Subject,
  debounceTime,
  firstValueFrom,
  noop,
  switchMap,
  tap,
} from 'rxjs'
import { SearchGrup } from '../schemas/grupoActividad.shemas'
import { SearchService } from '../../../app/services/search.service'
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms'
import { doOnSubscribe } from '../../../app/services/api.service'
import { NzSelectComponent } from 'ng-zorro-antd/select'
import { SHARED_IMPORTS } from '@shared'
import { CommonModule } from '@angular/common'
import { Injector, inject } from '@angular/core';

@Component({
    selector: 'app-direccion-search',
    templateUrl: './direccion-search.component.html',
    styleUrls: ['./direccion-search.component.less'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DireccionSearchComponent),
            multi: true,
        },
    ],
    imports: [...SHARED_IMPORTS, CommonModule]
})

export class DireccionSearchComponent implements ControlValueAccessor {


  tmpInputVal: any
  constructor(private searchService: SearchService) { }

  @Input() valueExtended: any
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>()
  @ViewChild("dsc") dsc!: NzSelectComponent
  private isDisabled = false
  $searchChange = new BehaviorSubject('')
  $isOptionsLoading = new BehaviorSubject<boolean>(false)
  onItemChanged = new Subject<any>();    // object

  private _selectedId: string = ''
  _selected = signal('')
  extendedOption = { id: '', fullName: "", fullObj: {} }
  selectedItem: any;

  private propagateTouched: () => void = noop
  private propagateChange: (_: any) => void = noop


  registerOnChange(fn: any) {

    this.propagateChange = fn
  }

  onBlur() {
    this.propagateTouched()
  }

  onRemove() {
    //  console.log('onRemove')
  }

  registerOnTouched(fn: any) {
    this.propagateTouched = fn
  }

  ngOnDestroy() {
    this.dsc?.originElement.nativeElement.removeEventListener('keydown', this.onKeydown.bind(this))
  }

  onKeydown(event: KeyboardEvent) {
    //    this._lastInputEvent = event;
    //    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
      event.stopImmediatePropagation()
    }
  }



  ngAfterViewInit() {
    setTimeout(() => {
      this.dsc.originElement.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));
      this.dsc.focus()  //Al hacer click en el componente hace foco
      this.dsc.setDisabledState(this.isDisabled)

    }, 1);
  }


  get selectedId() {
    return this._selectedId
  }

  get selectedIdNum(): number {
    return parseInt(this._selectedId)
  }

  set selectedId(val: string) {
    this.dsc?.focus()
    val = (val === null || val === undefined) ? '' : val

    if (val !== this._selectedId) {
      this._selectedId = val

      if (this._selectedId == '' || this._selectedId == '0') {
        this.extendedOption = { id: '', fullName: "", fullObj: {} }
        this.selectedItem = this.extendedOption

        this.valueExtendedEmitter.emit(this.extendedOption)
        if (this._selected() != '')
          this._selected.set('')
        this.propagateChange(this._selectedId)
        return
      }
      this.searchService
      .getDireccion(this._selectedId)
        .pipe(tap(res => {
            this.extendedOption = { id: res[0].properties.place_id, fullName: res[0].properties.formatted,  fullObj: res[0] }
            this.selectedItem = this.extendedOption
            this._selected.set(this._selectedId)
            this.valueExtendedEmitter.emit(this.extendedOption)
            if (this.tmpInputVal != this._selected) {
              this.propagateChange(this._selectedId)
            }
          }))
      

    }
  }

  writeValue(value: any) {
    this.tmpInputVal = value
    if (value !== this._selectedId) {
      this.selectedId = value
    }
  }

    $optionsArray: Observable<any[]> = this.$searchChange.pipe(
      debounceTime(500),
      switchMap(value =>
        this.searchService
          .getDireccion(value)
          .pipe(
            doOnSubscribe(() => this.$isOptionsLoading.next(true)),
            tap({ complete: () => this.$isOptionsLoading.next(false) })
          )
      )
    )

  modelChange(val: string) {
    if (val == '') val = '0'
    this.selectedId = val
}

  search(value: string): void {
    this.extendedOption = { id: '', fullName: "", fullObj: {} }
    this.$searchChange.next(value)
  }

  focus() {
    console.log('focus')

  }

  visibleDrawer = signal(false)
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled
    this.dsc?.setDisabledState(isDisabled)
  }

  openDrawer(): void {
    this.visibleDrawer.set(true)
  }

  closeDrawer(): void {
    this.visibleDrawer.set(false)
  }

}  