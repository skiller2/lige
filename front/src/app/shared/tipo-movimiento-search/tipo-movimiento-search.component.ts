import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, forwardRef } from '@angular/core'
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
import { ApiService, doOnSubscribe } from 'src/app/services/api.service'
import { NzSelectComponent } from 'ng-zorro-antd/select'
import { SHARED_IMPORTS } from '@shared'
import { CommonModule } from '@angular/common'

@Component({
    selector: 'app-tipo-movimiento-search',
    templateUrl: './tipo-movimiento-search.component.html',
    styleUrls: ['./tipo-movimiento-search.component.less'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TipoMovimientoSearchComponent),
            multi: true,
        },
    ],
    imports: [...SHARED_IMPORTS, CommonModule]
})

export class TipoMovimientoSearchComponent implements ControlValueAccessor {
  constructor(private searchService: SearchService, private apiService:ApiService) { }

  @Input() valueExtended: any
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>()
  @ViewChild("msc") msc!: NzSelectComponent


  $searchChange = new BehaviorSubject('');
  $isOptionsLoading = new BehaviorSubject<boolean>(false)

  private _selectedId: any = null
  _selected: any
  extendedOption = {  }
  tipo_movimiento:any

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

  ngOnDestroy() { 
    this.msc.originElement.nativeElement.removeEventListener('keydown', this.onKeydown.bind(this))
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
      event.stopImmediatePropagation()
    }
  }

  async ngOnInit() { 
  }

  ngAfterViewInit() {
  }

  get selectedId() {
    return this._selectedId
  }

  set selectedId(val: any) {
    val = (val === null || val === undefined) ? '' : val
    if (val !== this._selectedId) {
      this._selectedId = val

      if (val.length==0) {
        this.valueExtendedEmitter.emit(null)
        this.propagateChange('')
        return
      }

      let labelArr:string[] = []
      let valueArr:number[] = []
      for (const row of val) {
        labelArr.push(row.des_movimiento)
        valueArr.push(row.tipo_movimiento_id)
      }

      const fullName = labelArr.join(' o ')
      this.valueExtendedEmitter.emit({fullName})
      this.propagateChange(valueArr)
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
      return this.apiService.getTipoMovimientoById('all')
        .pipe(
          doOnSubscribe(() => this.$isOptionsLoading.next(true)),
          tap({ complete: () => this.$isOptionsLoading.next(false) })
        );
    })
  )

  modelChange(val: any) {
    this.selectedId = val;
  }

  search(value: string): void {
    // this.extendedOption = { objetivoId: 0, clienteId: 0, ClienteElementoDependienteId: 0, descripcion: '', fullName: '' }
    // this.$searchChange.next(value);
  }

  setDisabledState(isDisabled: boolean): void {
    this.msc?.setDisabledState(isDisabled)
  } 

}
