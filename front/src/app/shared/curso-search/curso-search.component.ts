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
import { SearchCurso } from '../schemas/cursos.schemas'
import { SearchService } from 'src/app/services/search.service'
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms'
import { doOnSubscribe } from 'src/app/services/api.service'
import { NzSelectComponent } from 'ng-zorro-antd/select'
import { SHARED_IMPORTS } from '@shared'
import { CommonModule } from '@angular/common'


@Component({
    selector: 'app-curso-search',
    templateUrl: './curso-search.component.html',
    styleUrls: ['./curso-search.component.less'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CursoSearchComponent),
            multi: true,
        },
    ],
    imports: [...SHARED_IMPORTS, CommonModule]
})

export class CursoSearchComponent implements ControlValueAccessor {
  constructor(private searchService: SearchService) { }

  @Input() valueExtended: any
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>()
  @ViewChild("csc") csc!: NzSelectComponent
  private isDisabled = false
  $searchChange = new BehaviorSubject('')
  $isOptionsLoading = new BehaviorSubject<boolean>(false)

  private _selectedId: string = ''
  _selected = signal('')
  extendedOption = { CursoId: 0, TipoCursoDescripcion: "" }
  
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
    this.csc?.originElement.nativeElement.removeEventListener('keydown', this.onKeydown.bind(this))
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
      event.stopImmediatePropagation()
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.csc?.originElement.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));
      this.csc?.focus()
      this.csc?.setDisabledState(this.isDisabled)
    }, 1);
  }

  get selectedId() {
    return this._selectedId
  }

  get selectedIdNum():number {
    return parseInt(this._selectedId)
  }

  set selectedId(val: string) {
    this.csc?.focus()
    val = (val === null || val === undefined) ? '' : val

    if (val !== this._selectedId) {
      this._selectedId = val

      if (this._selectedId == '' || this._selectedId == '0') {
        this.valueExtendedEmitter.emit({})
        if (this._selected()!='')
          this._selected.set('')
        this.propagateChange(this._selectedId)
        return
      }
  
      firstValueFrom(
        this.searchService
          .getCursoFromName('CursoId', this._selectedId)
          .pipe(tap(res => {
            this._selected.set(this._selectedId)
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

  $optionsArray: Observable<SearchCurso[]> = this.$searchChange.pipe(
    debounceTime(500),
    switchMap(value =>
      this.searchService.getCursoFromName(Number(value) ? 'CursoHabilitacionId' : 'CursoHabilitacionDescripcion', value)
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
    this.extendedOption = { CursoId: 0, TipoCursoDescripcion: "" }
    this.$searchChange.next(value)
  }

  focus() { 
    console.log('focus')
  }
} 