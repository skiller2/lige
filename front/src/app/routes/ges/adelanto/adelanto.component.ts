import { Component, Injector, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import {
  BehaviorSubject,
  Subject,
  catchError,
  debounceTime,
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

  listaAdelantos$ = this.formChange$.pipe(
    tap(() => {
      this.tableLoading$.next(true);
    }),
    debounceTime(500),
    switchMap(() =>
      this.apiService.getAdelantos(
        this.adelanto.controls['anio'].value,
        this.adelanto.controls['mes'].value,
        this.adelanto.controls['PersonalId'].value
      )
    ),
    tap(() => {
      this.tableLoading$.next(false);
    })
  );

  formChanged(event: any) {
    this.formChange$.next('');
  }

  resetForm() {
    this.adelanto.resetForm({
      anio: new Date().getFullYear(),
      mes: new Date().getMonth() + 1,
      PersonalId: '',
    });
  }
  loadForm() { }
  
  SaveForm() {
    this.apiService
      .addAdelanto(this.adelanto.value)
      .pipe(
        catchError((err, caught) => {
          return of(err);
        }),
        tap(msg => {
          if (msg == 'ok') {
            this.notification.success('Grabación', 'Existosa');
          } else if (msg instanceof Error) {
            console.log(msg);
            this.notification.error('Grabación', msg.message);
          }
        }),
        finalize(() => {
          this.formChanged('');
        })
      )
      .subscribe();
  }

  DeleteForm() {
    this.apiService
      .delAdelanto(this.adelanto.value)
      .pipe(
        catchError((err, caught) => {
          return of(err);
        }),
        tap(msg => {
          if (msg == 'ok') {
            this.notification.success('Eliminación', 'Existosa');
          } else if (msg instanceof Error) {
            console.log(msg);
            this.notification.error('Eliminación', msg.message);
          }
        }),
        finalize(() => {
          this.formChanged('');
        })
      )
      .subscribe();
  }

}
