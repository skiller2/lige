import { Component, EventEmitter, Input, Output, ViewChild, forwardRef, input, model, signal } from '@angular/core'
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
import { SHARED_IMPORTS } from '@shared'
import { CommonModule } from '@angular/common'
import { DetallePersonaComponent } from "../../routes/ges/detalle-persona/detalle-persona.component";

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
  standalone: true,
  imports: [...SHARED_IMPORTS, CommonModule, DetallePersonaComponent],

})

export class PersonalSearchComponent implements ControlValueAccessor {
  tmpInputVal: any
  constructor(private searchService: SearchService) { }

  @Input() valueExtended: any
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>()
  @ViewChild("psc") psc!: NzSelectComponent
  private isDisabled =false
  $searchChange = new BehaviorSubject('')
  $isOptionsLoading = new BehaviorSubject<boolean>(false)

  private _selectedId: string = ''
  _selected =signal('')
  extendedOption = { PersonalId: 0, fullName: "" }
  
  private propagateTouched: () => void = noop
  private propagateChange: (_: any) => void = noop
  anio = input(0)
  mes = input(0)
  sucursalId = input(0)

  registerOnChange(fn: any) {

    this.propagateChange = fn
  }

  onBlur() {
    this.propagateTouched()
  }

  onChange() {
    console.log('onChange',this.psc)
//    this.psc?.focus()

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
    if ( event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
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

  get selectedIdNum():number {
    return parseInt(this._selectedId)
  }

  set selectedId(val: string) {
    this.psc?.focus()
    val = (val === null || val === undefined) ? '' : val

    if (val !== this._selectedId) {
      this._selectedId = val

      if (this._selectedId == '' || this._selectedId == '0') {
        this.valueExtendedEmitter.emit({})
        this._selected.set('')
        this.propagateChange(this._selectedId)
        return
      }
  
/*

      if (!this._selectedId && this._selectedId !== null) {
        this.valueExtendedEmitter.emit({})
        this.propagateChange(this._selectedId)
        return
      }
*/
      firstValueFrom(
        this.searchService
          .getPersonFromName('PersonalId', this._selectedId)
          .pipe(tap(res => {
            if (res[0]?.PersonalId)
            this.extendedOption = res[0]
            this._selected.set(this._selectedId)
            this.valueExtendedEmitter.emit(this.extendedOption)
            //if (val!=this._selected)
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

  focus() { 
    console.log('focus')

  }

  visibleDrawer = signal(false)
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled =  isDisabled
    this.psc?.setDisabledState(isDisabled)
  }

   openDrawer(): void {
    this.visibleDrawer.set( true)
  }
  
  closeDrawer(): void {
    this.visibleDrawer.set( false)
  }

}
