import { Component, Input, Output, forwardRef } from '@angular/core';
import { BehaviorSubject, Observable, debounceTime, switchMap, tap } from 'rxjs';
import { Search } from '../schemas/personal.schemas';
import { SearchService } from 'src/app/services/search.service';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'app-personal-search',
  templateUrl: './personal-search.component.html',
  styleUrls: ['./personal-search.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PersonalSearchComponent),
      multi: true
    }],
})
export class PersonalSearchComponent implements ControlValueAccessor {
  @Input() label: string | undefined 
  constructor(private searchService: SearchService) { }
  _selectedPersonalId: string = ''

  get selectedPersonalId() {
    return this._selectedPersonalId;
  }

  set selectedPersonalId(val) {
    this._selectedPersonalId = val;
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
  $selectedValueChange = new BehaviorSubject('')
  $iPersonalDataLoading = new BehaviorSubject<boolean>(false)


  $searchChange = new BehaviorSubject('')
  $isOptionsLoading = new BehaviorSubject<boolean>(false)
  $optionsArray: Observable<Search[]> = this.$searchChange
    .pipe(debounceTime(500))
    .pipe(
      switchMap((value) => {
        const searchfield = (Number(value)) ? 'CUIT' : 'Nombre'

        return this.searchService.getPersonFromName(searchfield, value);
      }),
    )
    .pipe(
      tap(() => this.$isOptionsLoading.next(false))
    )

  selectedValueChange(event: string): void {
    this.selectedPersonalId = event
    if (event) {
      this.$selectedValueChange.next(event)
      this.$iPersonalDataLoading.next(true)
    }
  }

  search(value: string): void {
    if (value) { this.$isOptionsLoading.next(true) }
    else { this.$isOptionsLoading.next(false) }
    this.$searchChange.next(value)
  }

}
