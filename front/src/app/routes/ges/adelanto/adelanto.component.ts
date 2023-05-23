import { Component, Injector, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { SharedModule } from '@shared';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BehaviorSubject, debounceTime, switchMap, tap } from 'rxjs';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { SearchService } from 'src/app/services/search.service';

@Component({
  selector: 'app-adelanto',
  templateUrl: './adelanto.component.html',
  styleUrls: ['./adelanto.component.less'],
  standalone: true,
  imports: [SharedModule],
})
export class AdelantoComponent {
  constructor(private apiService: ApiService) {}
  @ViewChild('adelanto', { static: true }) adelanto!: NgForm;

  selectedPeriod = { year: 0, month: 0 };

  formChange$ = new BehaviorSubject('');
  tableLoading$ = new BehaviorSubject(false);
  saveLoading$ = new BehaviorSubject(false);
  deleteLoading$ = new BehaviorSubject(false);

  ngAfterViewInit(): void {
    const now = new Date(); //date
    setTimeout(() => {
      const anio =
        Number(localStorage.getItem('anio')) > 0
          ? Number(localStorage.getItem('anio'))
          : now.getFullYear();
      const mes =
        Number(localStorage.getItem('mes')) > 0
          ? Number(localStorage.getItem('mes'))
          : now.getMonth() + 1;

      this.adelanto.form.get('periodo')?.setValue(new Date(anio, mes - 1, 1));
    }, 1);
  }

  $personaResponsables = this.formChange$.pipe(
    debounceTime(500),
    switchMap(() =>
      this.apiService
        .getPersonaResponsables(
          this.adelanto.controls['anio'].value,
          this.adelanto.controls['mes'].value,
          this.adelanto.controls['PersonalId'].value
        )
        .pipe
        //          doOnSubscribe(() => this.tableLoading$.next(true)),
        //          tap({ complete: () => this.tableLoading$.next(false) })
        ()
    )
  );

  listaAdelantos$ = this.formChange$.pipe(
    debounceTime(500),
    switchMap(() =>
      this.apiService
        .getAdelantos(
          this.adelanto.controls['anio'].value,
          this.adelanto.controls['mes'].value,
          this.adelanto.controls['PersonalId'].value
        )
        .pipe(
          doOnSubscribe(() => this.tableLoading$.next(true)),
          tap({ complete: () => this.tableLoading$.next(false) })
        )
    )
  );

  dateChange(result: Date): void {
    this.selectedPeriod.year = result.getFullYear();
    this.selectedPeriod.month = result.getMonth() + 1;

    localStorage.setItem('anio', String(this.selectedPeriod.year));
    localStorage.setItem('mes', String(this.selectedPeriod.month));

    this.formChange$.next('');
  }

  SaveForm() {
    this.apiService
      .addAdelanto(this.adelanto.value)
      .pipe(
        doOnSubscribe(() => this.saveLoading$.next(true)),
        tap({
          complete: () => {
            this.formChange$.next('');
            this.adelanto.form.get('monto')?.setValue(null);
          },
          finalize: () => this.saveLoading$.next(false),
        })
      )
      .subscribe();
  }

  DeleteForm() {
    this.apiService
      .delAdelanto(this.adelanto.value)
      .pipe(
        doOnSubscribe(() => this.deleteLoading$.next(true)),

        tap({
          complete: () => this.formChange$.next(''),
          finalize: () => this.deleteLoading$.next(false),
        })
      )
      .subscribe();
  }
}
