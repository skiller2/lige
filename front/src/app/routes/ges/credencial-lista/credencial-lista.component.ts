import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, Inject, OnInit, Renderer2, signal, ViewChild, DOCUMENT } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { BehaviorSubject, debounceTime, finalize, map, Observable, switchMap, tap } from 'rxjs';
import { PersonaObj, Search } from 'src/app/shared/schemas/personal.schemas';
import { SearchService } from '../../../services/search.service';
import { LoadingService } from '@delon/abc/loading';
import { ViewCredentialComponent } from 'src/app/shared/viewCredential/view-credential.component';

@Component({
    selector: 'app-credencial-lista',
    imports: [...SHARED_IMPORTS, CommonModule, ViewCredentialComponent],
    templateUrl: './credencial-lista.component.html',
    styleUrls: ['./credencial-lista.component.less']
})
export class CredencialListaComponent {
  @ViewChild('credcards', { static: false }) credcards!: ElementRef;

  constructor(
    private searchService: SearchService,
    private loadingSrv: LoadingService
  ) {}
  ngOnInit(): void {
    const credList = JSON.parse(String(localStorage.getItem('credList')))
    console.log('credList',credList)
    if (credList)
      this.credentials.set(credList)
  }
  selectedPersonalId: string = '';
  credentials = signal<PersonaObj[]>([]);
  isOptionsLoading: boolean = false;

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
    .pipe(tap(() => (this.isOptionsLoading = false)));

  $personalData = this.$selectedValueChange.pipe(
    switchMap(value =>
      this.searchService
        .getInfoFromPersonalId(value)
        .pipe(
          tap((persona: PersonaObj) => {
            if (persona != null && persona.PersonalId > 0) {
              if (this.credentials().findIndex(obj => obj.PersonalId === persona.PersonalId) == -1) this.credentials.update(v => { return [persona, ...v] })
              localStorage.setItem('credList',JSON.stringify(this.credentials()))
              this.selectedPersonalId = '';
            }
          })
        )
        .pipe(
          finalize(() => {
            this.loadingSrv.close();
          })
        )
    )
  );

  selectedValueChange(event: string): void {
    if (event != '' && event != null) {
      this.$selectedValueChange.next(event);
      this.loadingSrv.open({ type: 'spin', text: '' });
    } else {
      this.loadingSrv.close();
    }
  }

  search(value: string): void {
    this.isOptionsLoading = true;
    this.$searchChange.next(value);
  }
  emptyList() {
    this.credentials.set([])
    localStorage.setItem('credList',JSON.stringify(this.credentials()))
  }
}
