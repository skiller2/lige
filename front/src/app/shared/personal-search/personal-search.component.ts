import { Component, Output } from '@angular/core';
import { BehaviorSubject, Observable, debounceTime, switchMap, tap } from 'rxjs';
import { Search } from '../schemas/personal.schemas';
import { SearchService } from 'src/app/services/search.service';

@Component({
  selector: 'app-personal-search',
  templateUrl: './personal-search.component.html',
  styleUrls: ['./personal-search.component.less']
})
export class PersonalSearchComponent {
  constructor(private searchService: SearchService) { }

  @Output() selectedPersonalId: string = ''
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
