import { Component, OnInit } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { BehaviorSubject, debounceTime, finalize, Observable, switchMap, tap } from 'rxjs';
import { Search } from 'src/app/shared/schemas/personal.schemas';
import { SearchService } from '../../../services/search.service';

import { SharedModule } from '@shared';

@Component({
  selector: 'app-credencial-personal',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './credencial-personal.component.html',
  styleUrls: ['./credencial-personal.component.less'],
})
export class CredencialPersonalComponent {
  constructor(private searchService: SearchService) {}
  ngOnInit(): void {}
  selectedPersonalId: string = '';
  blobDummy: Blob = new Blob();

  $isOptionsLoading = new BehaviorSubject<boolean>(false);
  $iPersonalDataLoading = new BehaviorSubject<boolean>(false);

  $searchChange = new BehaviorSubject('');
  $selectedValueChange = new BehaviorSubject('');
  $optionsArray: Observable<Search[]> = this.$searchChange
    .pipe(debounceTime(500))
    .pipe(
      switchMap(value => {
        const searchfield = Number(value) ? 'CUIT' : 'Nombre';

        return this.searchService.getPersonFromName(searchfield, value);
      })
    )
    .pipe(tap(() => this.$isOptionsLoading.next(false)));

  $personalData = this.$selectedValueChange.pipe(
    switchMap(value => this.searchService.getInfoFromPersonalId(value).pipe(finalize(() => this.$iPersonalDataLoading.next(false))))
  );

  selectedValueChange(event: string): void {
    if (event) {
      this.$selectedValueChange.next(event);
      this.$iPersonalDataLoading.next(true);
    }
  }

  search(value: string): void {
    if (value) {
      this.$isOptionsLoading.next(true);
    } else {
      this.$isOptionsLoading.next(false);
    }
    this.$searchChange.next(value);
  }
}
