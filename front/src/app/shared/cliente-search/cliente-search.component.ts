import { Component, Input, Output, forwardRef } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  debounceTime,
  switchMap,
  tap,
} from 'rxjs';
import { SearchClient } from '../schemas/cliente.schemas';
import { SearchService } from 'src/app/services/search.service';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { ResponseNameFromId } from '../schemas/ResponseJSON';
import { doOnSubscribe } from 'src/app/services/api.service';

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
})

export class ClienteSearchComponent implements ControlValueAccessor {
  constructor(private searchService: SearchService) {}

  _selectedClientId = '';
  _selectedCuit = new BehaviorSubject('Falta');

  get selectedClientId() {
    return this._selectedClientId;
  }

  set selectedClientId(val) {
    this._selectedClientId = val;
    this.selectedValueChange(val);
    this.propagateChange(this._selectedClientId);
  }

  writeValue(value: any)  {
    if (value !== undefined) {
      this.selectedClientId = value;
    }
  }
  propagateChange = (_: any) => {};

  registerOnChange(fn: any) {
    this.propagateChange = fn;
  }

  registerOnTouched() {}
  selectedInfoChange$ = new BehaviorSubject<SearchClient[] | null>(null);

  $searchChange = new BehaviorSubject('');
  $isOptionsLoading = new BehaviorSubject<boolean>(false);
  $optionsArray: Observable<SearchClient[]> = this.$searchChange.pipe(
    debounceTime(500),
     switchMap(value =>
       this.searchService
        .getClientFromName(Number(value) ? 'ClienteId' : 'ClienteApellidoNombre', value)
        .pipe(
          doOnSubscribe(() => this.$isOptionsLoading.next(true)),
          tap({ complete: () => this.$isOptionsLoading.next(false) })
        )
     )
  );

  modelChange(event: string) {
    this.selectedClientId = event;
  }
  selectedValueChange(event: string): void {
    if (!event) return;
    this.searchService
      .getClientFromName('ClienteId', event)
      .subscribe(info => {
        this.selectedInfoChange$.next(info);
      });
  }

  search(value: string): void {
    this.$searchChange.next(value);
  }
}
