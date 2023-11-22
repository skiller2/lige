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

  private _selectedId: string = ''
  _selected = ''
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

  set selectedId(val: string) {
    val = (val === null || val === undefined) ? '' : val
    if (val !== this._selectedId) {
      this._selectedId = val

      if (!this._selectedId && this._selectedId !== null) {
        this.valueExtendedEmitter.emit(null)
        this.propagateChange(this._selectedId)
        return
      }
      firstValueFrom(
        this.apiService.
        getTipoMovimientoById(this._selectedId)
          .pipe(tap(res => {
            console.log('res',res);
            this.extendedOption = res
            this._selected = this._selectedId
            this.valueExtendedEmitter.emit(this.extendedOption)
            this.propagateChange(this._selectedId)
          }))
      )
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

  modelChange(val: string) {
    this.selectedId = val;
  }

  search(value: string): void {
    // this.extendedOption = { objetivoId: 0, clienteId: 0, elementoDependienteId: 0, descripcion: '', fullName: '' }
    this.$searchChange.next(value);
  }
}
