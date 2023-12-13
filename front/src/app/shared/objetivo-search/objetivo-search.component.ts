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
import { doOnSubscribe } from 'src/app/services/api.service'
import { NzSelectComponent } from 'ng-zorro-antd/select'
import { KeyCode } from 'angular-slickgrid'
import { SHARED_IMPORTS } from '@shared'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-objetivo-search',
  templateUrl: './objetivo-search.component.html',
  styleUrls: ['./objetivo-search.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ObjetivoSearchComponent),
      multi: true,
    },
  ],
  standalone: true,
  imports: [ ...SHARED_IMPORTS,CommonModule],

})

export class ObjetivoSearchComponent implements ControlValueAccessor {
  constructor(private searchService: SearchService) { }

  @Input() sucursalId: number | null = null;
  @Input() valueExtended: any
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>()
  @ViewChild("osc") osc!: NzSelectComponent


  $searchChange = new BehaviorSubject('');
  $isOptionsLoading = new BehaviorSubject<boolean>(false)

  private _selectedId: string = ''
  _selected = ''
  extendedOption = { objetivoId: 0, clienteId: 0, elementoDependienteId: 0, descripcion: '', fullName: '' }

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
    this.osc?.originElement.nativeElement.removeEventListener('keydown', this.onKeydown.bind(this))
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
      event.stopImmediatePropagation()
    }
  }


  ngAfterViewInit() {
    setTimeout(() => {
      this.osc.originElement.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));

      this.osc.focus()
    }, 1);
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
        this.searchService
          .ObjetivoInfoFromId(this._selectedId)
          .pipe(tap(res => {
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
      return this.searchService
        .getObjetivos(Number(value.charAt(0)) ? 'Codigo' : 'Descripcion', value, (this.sucursalId) ? String(this.sucursalId) : '0')
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
    this.extendedOption = { objetivoId: 0, clienteId: 0, elementoDependienteId: 0, descripcion: '', fullName: '' }
    this.$searchChange.next(value);
  }
}

