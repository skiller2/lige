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
import { KeyCode } from 'angular-slickgrid'

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
    //  console.log('onRemove')
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
    // firstValueFrom(this.apiService.getTipoMovimiento('').pipe(tap(res => { 
    //   this.tipo_movimiento = res
    //   console.log('this.tipo_movimiento',this.tipo_movimiento);
      
    // })))

    /*
    setTimeout(() => {
      this.msc.originElement.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));

      this.msc.focus()
    }, 1);
    */
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
//      this.propagateChange([val[0].tipo_movimiento_id,val[1].tipo_movimiento_id])
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
    // this.extendedOption = { objetivoId: 0, clienteId: 0, elementoDependienteId: 0, descripcion: '', fullName: '' }
    this.$searchChange.next(value);
  }
}
