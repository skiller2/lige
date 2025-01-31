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
import { SearchService } from 'src/app/services/search.service'
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms'
import { doOnSubscribe } from 'src/app/services/api.service'
import { NzSelectComponent } from 'ng-zorro-antd/select'
import { SHARED_IMPORTS } from '@shared'
import { CommonModule } from '@angular/common'
import { Injector, inject } from '@angular/core';

@Component({
  selector: 'app-grupo-actividad-search',
  templateUrl: './grupo-actividad-search.component.html',
  styleUrls: ['./grupo-actividad-search.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GrupoActividadSearchComponent),
      multi: true,
    },
  ],
  standalone: true,
  imports: [...SHARED_IMPORTS, CommonModule],

})

export class GrupoActividadSearchComponent implements ControlValueAccessor {


  tmpInputVal: any
  constructor(private searchService: SearchService) { }

  @Input() valueExtended: any
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>()
  @ViewChild("psc") psc!: NzSelectComponent
  private isDisabled = false
  $searchChange = new BehaviorSubject('')
  $isOptionsLoading = new BehaviorSubject<boolean>(false)
  onItemChanged = new Subject<any>();    // object

  private _selectedId: string = ''
  _selected = signal('')
  extendedOption = { GrupoActividadId: 0, fullName: "" }
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
    this.psc?.originElement.nativeElement.removeEventListener('keydown', this.onKeydown.bind(this))
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
      this.psc.originElement.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));
      this.psc.focus()  //Al hacer click en el componente hace foco
      this.psc.setDisabledState(this.isDisabled)

    }, 1);
  }


  get selectedId() {
    return this._selectedId
  }

  get selectedIdNum(): number {
    return parseInt(this._selectedId)
  }

  set selectedId(val: string) {
    this.psc?.focus()
    val = (val === null || val === undefined) ? '' : val

    if (val !== this._selectedId) {
      this._selectedId = val

      if (this._selectedId == '' || this._selectedId == '0') {
        this.valueExtendedEmitter.emit({})
        if (this._selected() != '')
          this._selected.set('')
        this.propagateChange(this._selectedId)
        return
      }

      firstValueFrom(
        this.searchService
          .getGrupoActividad('GrupoActividadId', this._selectedId)
          .pipe(tap(res => {
            this.extendedOption = { GrupoActividadId: res[0].GrupoActividadId, fullName: res[0].fullName }
            this._selected.set(this._selectedId)
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

    $optionsArray: Observable<SearchGrup[]> = this.$searchChange.pipe(
      debounceTime(500),
      switchMap(value =>
        this.searchService
          .getGrupoActividad(Number(value) ? 'GrupoActividadId' : 'Detalle', value)
          .pipe(
            doOnSubscribe(() => this.$isOptionsLoading.next(true)),
            tap({ complete: () => this.$isOptionsLoading.next(false) })
          )
      )
    )

  modelChange(val: string) {
    if (val=='') val='0'
    this.selectedId = val
    this.selectedItem = { id: val, fullName: this.valueExtended?.fullName }    
  }

  search(value: string): void {
    this.extendedOption = { GrupoActividadId: 0, fullName: "" }
    this.$searchChange.next(value)
  }

  focus() {
    console.log('focus')

  }

  visibleDrawer = signal(false)
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled
    this.psc?.setDisabledState(isDisabled)
  }

  openDrawer(): void {
    this.visibleDrawer.set(true)
  }

  closeDrawer(): void {
    this.visibleDrawer.set(false)
  }

}  