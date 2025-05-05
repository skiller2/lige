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
import { SearchClient } from '../schemas/cliente.schemas';
import { SearchService } from 'src/app/services/search.service';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { ResponseNameFromId } from '../schemas/ResponseJSON';
import { doOnSubscribe } from 'src/app/services/api.service';
import { NzSelectComponent } from 'ng-zorro-antd/select';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-cliente-search',
    templateUrl: './cliente-search.component.html',
    styleUrls: ['./cliente-search.component.less'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ClienteSearchComponent),
            multi: true,
        },
    ],
    imports: [...SHARED_IMPORTS, CommonModule]
})

export class ClienteSearchComponent implements ControlValueAccessor {
  tmpInputVal: any;
  constructor(private searchService: SearchService) {}

  @Input() valueExtended: any
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>()
  @ViewChild("csc") csc!: NzSelectComponent
  
  private _selectedId: string = ''
  _selected = ''
  extendedOption = { ClienteId: 0, fullName: "" }

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
        this.searchService
          .getClientFromName('ClienteId', this._selectedId)
          .pipe(tap(res => {
            this.extendedOption = { ClienteId: res[0].ClienteId, fullName: res[0].ClienteDenominacion }
            this._selected = this._selectedId
            this.valueExtendedEmitter.emit(this.extendedOption)
            if (this.tmpInputVal != this._selected) {
              this.propagateChange(this._selectedId)
            }
          }))
      )
    }
  }


/*
  set selectedId(val) {
    this._selectedClientId = val;
    this.selectedValueChange(val);
    this.propagateChange(this._selectedClientId);
  }


  selectedValueChange(event: string): void {
    if (!event) return;
    this.searchService
      .getClientFromName('ClienteId', event)
      .subscribe(info => {
        this.selectedInfoChange$.next(info);
      });
  }
*/











  writeValue(value: any) {
    this.tmpInputVal = value
    if (value !== this._selectedId) {
      this.selectedId = value
    }
  }
  
  selectedInfoChange$ = new BehaviorSubject<SearchClient[] | null>(null);

  $searchChange = new BehaviorSubject('');
  $isOptionsLoading = new BehaviorSubject<boolean>(false);
  $optionsArray: Observable<SearchClient[]> = this.$searchChange.pipe(
    debounceTime(500),
     switchMap(value =>
       this.searchService
        .getClientFromName(Number(value) ? 'ClienteId' : 'ClienteDenominacion', value)
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
    this.extendedOption = { ClienteId: 0, fullName: "" }
    this.$searchChange.next(value)
  }

  setDisabledState(isDisabled: boolean): void {
    this.csc?.setDisabledState(isDisabled)
  } 

}
