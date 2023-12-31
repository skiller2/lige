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
import { log } from '@delon/util'
import { SHARED_IMPORTS } from '@shared'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-fecha-search',
  templateUrl: './fecha-search.component.html',
  styleUrls: ['./fecha-search.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FechaSearchComponent),
      multi: true,
    },
  ],
  standalone: true,
  imports: [ ...SHARED_IMPORTS,CommonModule],
  
})

export class FechaSearchComponent implements ControlValueAccessor {
  // constructor(private searchService: SearchService, private apiService:ApiService) { }

  @Input() valueExtended: any
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>()
  @ViewChild("fsc") fsc!: NzSelectComponent


  // $searchChange = new BehaviorSubject('');
  // $isOptionsLoading = new BehaviorSubject<boolean>(false)

  private _selectedId: any = null
  _selected: any
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

  onChange(value: Date): void {
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

  set selectedId(value: Date) {

    let val = (value === null || value === undefined) ? '' : value
    if (val !== this._selectedId) {
      this._selectedId = val
      if(value){
        const dia = value.getDate().toString().padStart(2, '0');
        const mes = (value.getMonth() + 1).toString().padStart(2, '0');
        const año = value.getFullYear().toString();
        this._selectedId = `${dia}/${mes}/${año}`
      }
    if (!this._selectedId && this._selectedId !== null) {
      this.valueExtendedEmitter.emit(null)
      this.propagateChange('')
      return
    }
    this.valueExtendedEmitter.emit({fullName: this._selectedId })
    this.propagateChange(this._operador + this._selectedId)
    }
  }

  writeValue(value: Date) {
    if (value !== this._selectedId) {
      this.selectedId = value
    }
  }

  modelChange(value: Date) {
    this.selectedId = value;
  }


  modelChangeOp(value: any) {
    if (value !== this._operador) 
      this._operador = value;
  }
}