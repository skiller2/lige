import { Component, EventEmitter, Input, Output, ViewChild, forwardRef } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  debounceTime,
  firstValueFrom,
  noop,
  switchMap,
  tap,
} from 'rxjs';
import { SearchTipoAsociadoCategoria } from '../schemas/tipo-asociado-categoria.schemas';
import { SearchService } from 'src/app/services/search.service';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { ResponseNameFromId } from '../schemas/ResponseJSON';
import { doOnSubscribe } from 'src/app/services/api.service';
import { NzSelectComponent } from 'ng-zorro-antd/select';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-tipo-asociado-categoria-search',
  imports: [...SHARED_IMPORTS, CommonModule],
  templateUrl: './tipo-asociado-categoria-search.html',
  styleUrl: './tipo-asociado-categoria-search.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TipoAsociadoCategoriaSearchComponent),
      multi: true,
    },
  ],
})
export class TipoAsociadoCategoriaSearchComponent implements ControlValueAccessor {
  tmpInputVal: any;
  constructor(private searchService: SearchService) { }

  @Input() valueExtended: any
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>()
  @ViewChild("csc") csc!: NzSelectComponent

  private _selectedId: string = ''
  _selected = ''
  extendedOption = { id: '', fullName: "" }

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
      // this.csc.focus()
    }, 1);
  }


  get selectedId() {
    return this._selectedId
  }

  set selectedId(val: string) {
    console.log("val tipo asociado categoria",val)
    val = (val === null || val === undefined || val == '0' || val == '') ? '' : val

    if (val !== this._selectedId) {
      this._selectedId = val

      if (this._selectedId == '') {
        this.valueExtendedEmitter.emit({})
        this._selected = ''
        this.propagateChange(this._selectedId)
        return
      }

      firstValueFrom(
        this.searchService.getTipoAsociadoCategoriaFromName('id', this._selectedId)
          .pipe(tap(res => {
            if (res && res.length > 0) {
                console.log("res tipo asociado categoria",res)
              this.extendedOption = { id: res[0].id, fullName: res[0].Label }
              this._selected = this._selectedId
              this.valueExtendedEmitter.emit(this.extendedOption)
              if (this.tmpInputVal != this._selected) {
                this.propagateChange(this._selectedId)
              }
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

  selectedInfoChange$ = new BehaviorSubject<SearchTipoAsociadoCategoria[] | null>(null);

  $searchChange = new BehaviorSubject('');
  $isOptionsLoading = new BehaviorSubject<boolean>(false);
  $optionsArray: Observable<SearchTipoAsociadoCategoria[]> = this.$searchChange.pipe(
    debounceTime(500),
    switchMap(value => {
      // Si el valor es un número o contiene "/", buscar por id, sino por Label
      const isId = Number(value) || value.includes('/');
      return this.searchService
        .getTipoAsociadoCategoriaFromName(isId ? 'id' : 'Label', value)
        .pipe(
          doOnSubscribe(() => this.$isOptionsLoading.next(true)),
          tap({ complete: () => this.$isOptionsLoading.next(false) })
        )
    })
  );

  modelChange(val: string) {
    this.selectedId = val
  }

  search(value: string): void {
    this.extendedOption = { id: '', fullName: "" }
    this.$searchChange.next(value)
  }

  setDisabledState(isDisabled: boolean): void {
    this.csc?.setDisabledState(isDisabled)
  }

}

