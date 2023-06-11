import { Component, Input, Output, forwardRef } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  debounceTime,
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
  constructor(private searchService: SearchService) {}

  _selectedPersonalId = '';
  _selectedCuit = new BehaviorSubject('Falta');

  get selectedPersonalId() {
    return this._selectedPersonalId;
  }

  set selectedPersonalId(val) {
    this._selectedPersonalId = val;
    this.selectedValueChange(val);
    this.propagateChange(this._selectedPersonalId);
  }

  writeValue(value: any) {
    if (value !== undefined) {
      this.selectedPersonalId = value;
    }
  }
  propagateChange = (_: any) => {};

  registerOnChange(fn: any) {
    this.propagateChange = fn;
  }

  registerOnTouched() {}
  selectedInfoChange$ = new BehaviorSubject<Search[] | null>(null);

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
  selectedValueChange(event: string): void {
    if (!event) return;
    this.searchService
      .getPersonFromName('PersonalId', event)
      .subscribe(info => {
        this.selectedInfoChange$.next(info);
      });
  }

  search(value: string): void {
    this.$searchChange.next(value);
  }
}
