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
import { SearchEfectoIndividual } from '../schemas/efecto.schemas';
import { SearchService } from 'src/app/services/search.service';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { ResponseNameFromId } from '../schemas/ResponseJSON';
import { doOnSubscribe } from 'src/app/services/api.service';
import { NzSelectComponent } from 'ng-zorro-antd/select';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-efecto-individual-search',
  imports: [...SHARED_IMPORTS, CommonModule],
  templateUrl: './efecto-individual-search.html',
  styleUrl: './efecto-individual-search.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EfectoIndividualSearchComponent),
      multi: true,
    },
  ],
})
export class EfectoIndividualSearchComponent {
  tmpInputVal: any;
  constructor(private searchService: SearchService) { }

  @Input() valueExtended: any
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>()
  @ViewChild("csc") csc!: NzSelectComponent

  private _selectedId: string = ''
  _selected = ''
  extendedOption = { EfectoEfectoIndividualId: 0, fullName: "" }

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
    val = (val === null || val === undefined || val == '0') ? '' : val

    if (val !== this._selectedId) {
      this._selectedId = val

      if (this._selectedId == '') {
        this.valueExtendedEmitter.emit({})
        this._selected = ''
        this.propagateChange(this._selectedId)
        return
      }

      firstValueFrom(
        this.searchService.getEfectoIndividualFromName('EfectoEfectoIndividualId', this._selectedId)
          .pipe(tap(res => {
            if (res && res.length > 0) {
              this.extendedOption = {EfectoEfectoIndividualId: res[0].EfectoEfectoIndividualId, fullName: res[0].EfectoEfectoIndividualDescripcion }
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

  selectedInfoChange$ = new BehaviorSubject<SearchEfectoIndividual[] | null>(null);

  $searchChange = new BehaviorSubject('');
  $isOptionsLoading = new BehaviorSubject<boolean>(false);
  $optionsArray: Observable<SearchEfectoIndividual[]> = this.$searchChange.pipe(
    debounceTime(500),
    switchMap(value =>this.searchService
        .getEfectoIndividualFromName(Number(value) ? 'EfectoEfectoIndividualId' : 'EfectoEfectoIndividualDescripcion', value)
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
    this.extendedOption = { EfectoEfectoIndividualId: 0, fullName: "" }
    this.$searchChange.next(value)
  }

  setDisabledState(isDisabled: boolean): void {
    this.csc?.setDisabledState(isDisabled)
  }

}
