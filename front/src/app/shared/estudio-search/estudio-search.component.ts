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
import { SearchEstudio } from '../schemas/estudios.schemas'
import { SearchService } from 'src/app/services/search.service'
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms'
import { doOnSubscribe } from 'src/app/services/api.service'
import { NzSelectComponent } from 'ng-zorro-antd/select'
import { SHARED_IMPORTS } from '@shared'
import { CommonModule } from '@angular/common'

@Component({
    selector: 'app-estudio-search',
    templateUrl: './estudio-search.component.html',
    styleUrls: ['./estudio-search.component.less'],
    standalone: true,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => EstudioSearchComponent),
            multi: true,
        },
    ],
    imports: [...SHARED_IMPORTS, CommonModule]
})
export class EstudioSearchComponent implements ControlValueAccessor {
  constructor(private searchService: SearchService) { }

  @Input() valueExtended: any
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>()
  @ViewChild("esc") esc!: NzSelectComponent
  
  private isDisabled = false
  $searchChange = new BehaviorSubject('')
  $isOptionsLoading = new BehaviorSubject<boolean>(false)

  private _selectedId = signal('')
  _selected = signal('')
  extendedOption = signal({ EstudioId: 0, TipoEstudioDescripcion: "" })
  
  private propagateTouched: () => void = noop
  private propagateChange: (_: any) => void = noop

  registerOnChange(fn: any) {
    this.propagateChange = fn
  }

  onBlur() {
    this.propagateTouched()
  }

  registerOnTouched(fn: any) {
    this.propagateTouched = fn
  }

  ngOnDestroy() { 
    this.esc?.originElement.nativeElement.removeEventListener('keydown', this.onKeydown.bind(this))
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
      event.stopImmediatePropagation()
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.esc?.originElement.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));
      this.esc?.focus()
      this.esc?.setDisabledState(this.isDisabled)
    }, 1);
  }

  get selectedId() {
    return this._selectedId()
  }

  get selectedIdNum(): number {
    return parseInt(this._selectedId())
  }

  set selectedId(val: string) {
    this.esc?.focus()
    val = (val === null || val === undefined) ? '' : val

    if (val !== this._selectedId()) {
      this._selectedId.set(val)

      if (val === '' || val === '0') {
        this.valueExtendedEmitter.emit({})
        if (this._selected() !== '') {
          this._selected.set('')
        }
        this.propagateChange(val)
        return
      }
  
      firstValueFrom(
        this.searchService
          .getEstudioFromName('EstudioId', val)
          .pipe(tap(res => {
            console.log(res)
            this.extendedOption.set({ 
              EstudioId: res[0]?.TipoEstudioId, 
              TipoEstudioDescripcion: res[0]?.TipoEstudioDescripcion 
            })
            this._selected.set(val)
            this.valueExtendedEmitter.emit(this.extendedOption())
            this.propagateChange(val)
          }))
      )
    }
  }

  writeValue(value: any) {
    if (value !== this._selectedId()) {
      this.selectedId = value
    }
  }

  $optionsArray: Observable<SearchEstudio[]> = this.$searchChange.pipe(
    debounceTime(500),
    switchMap(value =>
      this.searchService.getEstudioFromName(Number(value) ? 'TipoEstudioId' : 'TipoEstudioDescripcion', value)
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
    this.extendedOption.set({ EstudioId: 0, TipoEstudioDescripcion: "" })
    this.$searchChange.next(value)
  }

  focus() { 
    console.log('focus')
  }
} 