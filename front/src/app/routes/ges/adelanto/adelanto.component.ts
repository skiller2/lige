import { Component, Injector, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  debounceTime,
  defer,
  delay,
  finalize,
  of,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { SearchService } from 'src/app/services/search.service';

@Component({
  selector: 'app-adelanto',
  templateUrl: './adelanto.component.html',
  styleUrls: ['./adelanto.component.less'],
})
export class AdelantoComponent {
  constructor(
    private searchService: SearchService,
    private injector: Injector,
    private apiService: ApiService
  ) {}
  @ViewChild('adelanto', { static: true }) adelanto!: NgForm;

  private get notification(): NzNotificationService {
    return this.injector.get(NzNotificationService);
  }

  anio = new Date().getFullYear();
  mes = new Date().getMonth() + 1;

  formChange$ = new BehaviorSubject('');
  tableLoading$ = new BehaviorSubject(false);
  saveLoading$ = new BehaviorSubject(false);
  deleteLoading$ = new BehaviorSubject(false);

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

  formChanged(event: any) {
    this.formChange$.next('');
  }

  SaveForm() {
    this.apiService
      .addAdelanto(this.adelanto.value)
      .pipe(
        doOnSubscribe(() => this.saveLoading$.next(true)),
        tap({
          complete: () => {
            this.formChanged('');
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
          complete: () => this.formChanged(''),
          finalize: () => this.deleteLoading$.next(false),
        })
      )
      .subscribe();
  }
}

export function doOnSubscribe<T>(
  onSubscribe: () => void
): (source: Observable<T>) => Observable<T> {
  return function inner(source: Observable<T>): Observable<T> {
    return defer(() => {
      onSubscribe();

      return source;
    });
  };
}
