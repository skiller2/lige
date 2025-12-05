import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, forwardRef, inject } from '@angular/core'
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
import { log } from '@delon/util'
import { SHARED_IMPORTS } from '@shared'
import { CommonModule, DatePipe } from '@angular/common'

@Component({
    selector: 'app-periodo-search',
    templateUrl: './periodo-search.html',
    styleUrls: ['./periodo-search.less'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PeriodoSearchComponent),
            multi: true,
        },
        DatePipe
    ],
    imports: [...SHARED_IMPORTS, CommonModule]
})

export class PeriodoSearchComponent implements ControlValueAccessor {

  @Input() valueExtended: any
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>()
  @ViewChild("fsc") fsc!: NzSelectComponent
  private datePipe = inject(DatePipe)



  private _selectedId: any = null
  _selected: any
  _operador: any  = '='
  operatorsArray: string[] = ['=', '>=', '<=', '<', '>', '<>'];
 

  private propagateTouched: () => void = noop
  private propagateChange: (_: any) => void = noop

  registerOnChange(fn: any) {
    this.propagateChange = fn
  }

  onBlur() {
    this.propagateTouched()
  }

  onChange(value: Date): void {
    if (value) {
      // Asegura que siempre sea el primer dia del mes seleccionado
      const firstDayOfMonth = new Date(value.getFullYear(), value.getMonth(), 1)
      this._selected = firstDayOfMonth 
      this.selectedId = firstDayOfMonth
    } else {
      this._selected = value
      this.selectedId = value
    }
  }

  onRemove() {
  }

  registerOnTouched(fn: any) {
    this.propagateTouched = fn
  }

  ngOnDestroy() { 
    // this.fsc.originElement.nativeElement.removeEventListener('keydown', this.onKeydown.bind(this))
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

  set selectedId(value: Date) {

    let val = (value === null || value === undefined) ? '' : value
    
    // Si hay una fecha, normalizarla al primer dia del mes
    if (val instanceof Date) {
      val = new Date(val.getFullYear(), val.getMonth(), 1)
      // Actualizar tambien el modelo del date picker para que muestre el primer dia
      this._selected = val
    }
    
    if (val !== this._selectedId) {
      this._selectedId = val
    if (!this._selectedId && this._selectedId !== null) {
      this.valueExtendedEmitter.emit(null)
      this.propagateChange({})
      return
      }
    const fullName=this.datePipe.transform(this._selectedId)
    this.valueExtendedEmitter.emit({fullName })
//    this.propagateChange(this._operador +' '+ this._selectedId)
      this.propagateChange({ operator: this._operador, value: this._selectedId })
    }
  }

  writeValue(value: Date) {
    if (value) {
      // Normalizar al primer día del mes cuando se recibe un valor externo
      const firstDayOfMonth = new Date(value.getFullYear(), value.getMonth(), 1)
      if (firstDayOfMonth.getTime() !== this._selectedId?.getTime()) {
        this._selected = firstDayOfMonth // Actualizar también el modelo del date picker
        this.selectedId = firstDayOfMonth
      }
    } else if (value !== this._selectedId) {
      this._selected = value
      this.selectedId = value
    }
  }

  modelChangeOp(value: any) {
    if (value !== this._operador) 
      this._operador = value;
  }
}