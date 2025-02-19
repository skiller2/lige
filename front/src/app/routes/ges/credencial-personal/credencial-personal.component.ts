import { Component, OnInit, signal } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { BehaviorSubject, debounceTime, finalize, Observable, switchMap, tap } from 'rxjs';
import { Search } from 'src/app/shared/schemas/personal.schemas';
import { SearchService } from '../../../services/search.service';

import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';
import { ImageContentComponent } from 'src/app/shared/imagePreview/image-content/image-content.component';
import { ViewCredentialComponent } from 'src/app/shared/viewCredential/view-credential.component';

@Component({
  selector: 'app-credencial-personal',
  standalone: true,
  imports: [...SHARED_IMPORTS, CommonModule, ImageContentComponent, ViewCredentialComponent],
  templateUrl: './credencial-personal.component.html',
  styleUrls: ['./credencial-personal.component.less'],
})
export class CredencialPersonalComponent {
  constructor(private searchService: SearchService) { }
  ngOnInit(): void { }
  selectedPersonalId: string = '';
  blobDummy: Blob = new Blob();

  $isOptionsLoading = new BehaviorSubject<boolean>(false);
  isPersonalDataLoading = signal(false)
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
    tap(() => this.isPersonalDataLoading.set(true)),
    switchMap(value => this.searchService.getInfoFromPersonalId(value)),
    tap(() => this.isPersonalDataLoading.set(false)),
  );

  selectedValueChange(event: string): void {
    this.$selectedValueChange.next(event);
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
