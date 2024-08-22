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
import { SearchAdmind } from '../schemas/administrador.schemas'
import { SearchService } from 'src/app/services/search.service'
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms'
import { doOnSubscribe } from 'src/app/services/api.service'
import { NzSelectComponent } from 'ng-zorro-antd/select'
import { SHARED_IMPORTS } from '@shared'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-administrador-search',
  templateUrl: './administrador-search.component.html',
  styleUrls: ['./administrador-search.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AdministradorSearchComponent),
      multi: true,
    },
  ],
  standalone: true,
  imports: [ ...SHARED_IMPORTS,CommonModule],

})

export class AdministradorSearchComponent implements ControlValueAccessor {
  tmpInputVal: any;
  constructor(private searchService: SearchService) {}

  @Input() valueExtended: any
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>()
  @ViewChild("csc") csc!: NzSelectComponent
  
  private _selectedId: string = ''
  _selected = ''
  extendedOption = { AdministradorId: 0, fullName: "" }

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

  ngAfterViewInit() {
    setTimeout(() => {
      this.csc.focus()
    }, 1);
  }


  get selectedId() {
    return this._selectedId
  }

  set selectedId(val: string) {
    val = (val === null || val === undefined) ? '' : val
    
    if (val !== this._selectedId) {     
      this._selectedId = val

      if (this._selectedId == '' || this._selectedId == '0') {
        this.valueExtendedEmitter.emit({})
        this._selected = ''
        this.propagateChange(this._selectedId)
        return
      }

      firstValueFrom(
        this.searchService
          .getAdministradorFromName('AdministradorId', this._selectedId)
          .pipe(tap(res => {
            this.extendedOption = { AdministradorId: res[0].AdministradorId, fullName: res[0].AdministradorApellidoNombre }
            this._selected = this._selectedId
            this.valueExtendedEmitter.emit(this.extendedOption)
            if (this.tmpInputVal != this._selected) {
              this.propagateChange(this._selectedId)
            }
          }))
      )
    }
  }

  writeValue(value: any) {
    this.tmpInputVal = value
    if (value !== this._selectedId) {
      this.selectedId = value
    }
  }
  
  selectedInfoChange$ = new BehaviorSubject<SearchAdmind[] | null>(null);

  $searchChange = new BehaviorSubject('');
  $isOptionsLoading = new BehaviorSubject<boolean>(false);
  $optionsArray: Observable<SearchAdmind[]> = this.$searchChange.pipe(
    debounceTime(500),
     switchMap(value =>
       this.searchService
        .getAdministradorFromName(Number(value) ? 'AdministradorId' : 'AdministradorApellidoNombre', value)
        .pipe(
          doOnSubscribe(() => this.$isOptionsLoading.next(true)),
          tap({ complete: () => this.$isOptionsLoading.next(false) })
        )
     )
  );

  modelChange(val: string) {
    this.selectedId = val
  }

  search(value: string): void {
    this.extendedOption = { AdministradorId: 0, fullName: "" }
    this.$searchChange.next(value)
  }

  setDisabledState(isDisabled: boolean): void {
    this.csc?.setDisabledState(isDisabled)
  } 
}

