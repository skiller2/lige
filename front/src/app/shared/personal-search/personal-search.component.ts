import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  debounceTime,
  noop,
  switchMap,
  tap,
} from 'rxjs';
import { Search } from '../schemas/personal.schemas';
import { SearchService } from 'src/app/services/search.service';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { ResponseNameFromId } from '../schemas/ResponseJSON';
import { doOnSubscribe } from 'src/app/services/api.service';

@Component({
  selector: 'app-personal-search',
  templateUrl: './personal-search.component.html',
  styleUrls: ['./personal-search.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PersonalSearchComponent),
      multi: true,
    },
  ],
})
export class PersonalSearchComponent implements ControlValueAccessor {
  constructor(private searchService: SearchService) { }

  _selectedPersonalId:string = ''
  _selected = '';
  _selectedCuit = new BehaviorSubject('Falta');
  private propagateTouched: () => void = noop;
  private propagateChange: (_: any) => void = noop;


  get selectedPersonalId() {
    return this._selectedPersonalId;
  }

  set selectedPersonalId(val: string) {
    val = (val === null || val === undefined)? '':val
    if (val !== this._selectedPersonalId) {
      this._selectedPersonalId = val;

      if (!this._selectedPersonalId && this._selectedPersonalId !==null) {
        this.valueExtendedEmitter.emit(null)
        this.propagateChange(this._selectedPersonalId);
        return
      };

      this.searchService
        .getPersonFromName('PersonalId', this._selectedPersonalId)
        .subscribe(info => {
          this.valueExtendedEmitter.emit(info[0])
          this._selected = this._selectedPersonalId
          this.propagateChange(this._selectedPersonalId);
  
        });
    }
  }

  writeValue(value: any) {
    if (value !== this._selectedPersonalId) {
      this.selectedPersonalId = value;
    }
  }

  registerOnChange(fn: any) {
    this.propagateChange = fn;
  }

  onBlur() {
    this.propagateTouched();
  }

  onChange() {
//    console.log('onChange')
    this.propagateChange(this._selectedPersonalId);
  }

  onRemove() {
  //  console.log('onRemove')
  }

  registerOnTouched(fn: any) {
    this.propagateTouched = fn;
  }

  @Input() valueExtended: any;
  @Output('valueExtendedChange') valueExtendedEmitter: EventEmitter<any> = new EventEmitter<any>();


  $searchChange = new BehaviorSubject('');
  $isOptionsLoading = new BehaviorSubject<boolean>(false);
  $optionsArray: Observable<Search[]> = this.$searchChange.pipe(
    debounceTime(500),
    switchMap(value =>
      this.searchService
        .getPersonFromName(Number(value) ? 'CUIT' : 'Nombre', value)
        .pipe(
          doOnSubscribe(() => this.$isOptionsLoading.next(true)),
          tap({ complete: () => this.$isOptionsLoading.next(false) })
        )
    )
  );

  modelChange(event: string) {
    this.selectedPersonalId = event;
  }

  search(value: string): void {
    this.$searchChange.next(value);
  }
}
