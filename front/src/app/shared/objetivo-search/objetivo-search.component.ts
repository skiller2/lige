import { Component, Input, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  BehaviorSubject,
  Observable,
  debounceTime,
  switchMap,
  tap,
} from 'rxjs';
import { doOnSubscribe } from 'src/app/services/api.service';
import { SearchService } from 'src/app/services/search.service';

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
})
export class ObjetivoSearchComponent {
  constructor(private searchService: SearchService) {}

  @Input() sucursalId: number = 0;

  _selectedObjetivoId = '';
  get selectedObjetivoId() {
    return this._selectedObjetivoId;
  }

  public set selectedObjetivoId(v: string) {
    this._selectedObjetivoId = v;
    this.selectedValueChange(v);
    this.propagateChange(this._selectedObjetivoId);
  }

  writeValue(value: any) {
    if (value !== undefined) {
      this.selectedObjetivoId = value;
    }
  }
  propagateChange = (_: any) => {};

  registerOnChange(fn: any) {
    this.propagateChange = fn;
  }

  registerOnTouched() {}
  selectedInfoChange$ = new BehaviorSubject<any>(null);

  $searchChange = new BehaviorSubject('');
  $isOptionsLoading = new BehaviorSubject<boolean>(false);
  $optionsArray = this.$searchChange.pipe(
    debounceTime(500),
    switchMap(value =>
      this.searchService
        .getObjetivos(
          Number(value.charAt(0)) ? 'Codigo' : 'Descripcion',
          value,
          this.sucursalId.toString()
        )
        .pipe(
          doOnSubscribe(() => this.$isOptionsLoading.next(true)),
          tap({ complete: () => this.$isOptionsLoading.next(false) })
        )
    )
  );

  modelChange(event: string) {
    this.selectedObjetivoId = event;
  }
  selectedValueChange(event: string): void {
    if (!event) return;
    this.searchService.ObjetivoInfoFromId(event).subscribe(info => {
      this.selectedInfoChange$.next(info);
    });
  }

  search(value: string): void {
    this.$searchChange.next(value);
  }
}
