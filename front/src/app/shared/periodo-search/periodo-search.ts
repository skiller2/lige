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
import { CommonModule } from '@angular/common'

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
    ],
    imports: [...SHARED_IMPORTS, CommonModule]
})

export class PeriodoSearchComponent implements ControlValueAccessor {
  // constructor(private searchService: SearchService, private apiService:ApiService) { }

  @Input() valueExtended: any
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>()
  @ViewChild("fsc") fsc!: NzSelectComponent




  private _selectedId: string = ''
  _selected: Date | null = null

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
      const mes = (value.getMonth() + 1).toString().padStart(2, '0')
      const anio = value.getFullYear().toString()
      this.selectedId = `${mes}/${anio}`
    } else {
      this.selectedId = ''
    }
  }

  onRemove() {
  }

  registerOnTouched(fn: any) {
    this.propagateTouched = fn
  }

  ngOnDestroy() { 
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

  get selectedId(): string {
    return this._selectedId
  }

  set selectedId(value: string) {
    if (value !== this._selectedId) {
      this._selectedId = value
      if (!this._selectedId) {
        this.valueExtendedEmitter.emit(null)
        this.propagateChange('')
        return
      }
      this.valueExtendedEmitter.emit({ fullName: this._selectedId })
      this.propagateChange(this._selectedId)
    }
  }

  writeValue(value: string) {
    if (value !== this._selectedId) {
      this._selectedId = value || ''
      if (value) {
        const [mes, anio] = value.split('/')
        this._selected = new Date(parseInt(anio), parseInt(mes) - 1, 1)
      } else {
        this._selected = null
      }
    }
  }
  
}