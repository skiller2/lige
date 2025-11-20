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
import { NzInputNumberComponent } from 'ng-zorro-antd/input-number'
import { log } from '@delon/util'
import { SHARED_IMPORTS } from '@shared'
import { CommonModule } from '@angular/common'

@Component({
    selector: 'app-number-advanced-search',
    templateUrl: './number-advanced-search.html',
    styleUrls: ['./number-advanced-search.less'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => NumberAdvancedSearchComponent),
            multi: true,
        }
    ],
    imports: [...SHARED_IMPORTS, CommonModule]
})

export class NumberAdvancedSearchComponent implements ControlValueAccessor {
  // constructor(private searchService: SearchService, private apiService:ApiService) { }

  @Input() valueExtended: any
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>()
  @ViewChild("fsc") fsc!: NzInputNumberComponent


  // $searchChange = new BehaviorSubject('');
  // $isOptionsLoading = new BehaviorSubject<boolean>(false)

  private _selectedId: any = null
  _selected: any = null
  _operador: any  = '='
  operatorsArray: string[] = ['=', '>=', '<=', '<', '>', '<>'];
  // extendedOption = {  }
  // tipo_movimiento:any

  private propagateTouched: () => void = noop
  private propagateChange: (_: any) => void = noop

  registerOnChange(fn: any) {
    this.propagateChange = fn
  }

  onBlur() {
    this.propagateTouched()
  }

  onChange(value: number | null): void {
    this.selectedId = value
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

  set selectedId(value: number | null | undefined) {
    // Normalizar el valor: convertir undefined/null a null
    let val: number | null = null
    if (value !== null && value !== undefined) {
      // Si es string, intentar convertirlo a número
      const numValue = typeof value === 'string' ? parseFloat(value) : value
      if (!isNaN(numValue) && isFinite(numValue)) {
        val = numValue
      }
    }
    
    if (val !== this._selectedId) {
      this._selectedId = val
      
      if (this._selectedId === null || this._selectedId === undefined) {
        this.valueExtendedEmitter.emit(null)
        // Siempre propagar un objeto con operator y value, incluso cuando value es null
        this.propagateChange({ operator: this._operador || '=', value: null })
        return
      }
      
      console.log("el valor seleccionado es: ", this._selectedId)
      const fullName = String(this._selectedId)
      this.valueExtendedEmitter.emit({ fullName })
      this.propagateChange({ operator: this._operador || '=', value: this._selectedId })
    }
  }

  writeValue(value: any) {
    // Manejar valores undefined, null o cadenas vacías
    if (value === undefined || value === null || value === '') {
      this._selected = null
      this._selectedId = null
      this._operador = '='
      return
    }

    if (value && typeof value === 'object' && value.operator !== undefined && value.value !== undefined) {
      // Si viene como objeto { operator, value } desde el filtro-builder
      this._operador = value.operator || '='
      this._selected = value.value
      this._selectedId = value.value
    } else if (value !== this._selectedId) {
      // Si viene como número directo
      this._selected = value
      this.selectedId = value
    }
  }

  modelChangeOp(value: any) {
    if (value !== this._operador && value !== undefined && value !== null) {
      this._operador = value || '='
      // Propagar el cambio cuando el operador cambia
      if (this._selectedId !== null && this._selectedId !== undefined) {
        this.propagateChange({ operator: this._operador, value: this._selectedId })
      } else {
        this.propagateChange({ operator: this._operador, value: null })
      }
    }
  }
}