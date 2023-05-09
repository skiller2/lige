import { Component, Injector, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BehaviorSubject, debounceTime, switchMap, tap } from 'rxjs';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
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

  formChange$ = new BehaviorSubject('');
  tableLoading$ = new BehaviorSubject(false);
  saveLoading$ = new BehaviorSubject(false);
  deleteLoading$ = new BehaviorSubject(false);

  ngAfterViewInit(): void {
    const now = new Date(); //date
    setTimeout(() => {
      const anio =
        Number(localStorage.getItem('anio')) > 0
          ? localStorage.getItem('anio')
          : now.getFullYear();
      const mes =
        Number(localStorage.getItem('mes')) > 0
          ? localStorage.getItem('mes')
          : now.getMonth() + 1;
      this.adelanto.form.get('anio')?.setValue(Number(anio));
      this.adelanto.form.get('mes')?.setValue(Number(mes));
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

  formChanged(event: any) {
    if (
      this.adelanto.controls['anio'].value &&
      this.adelanto.controls['mes'].value
    ) {
      // console.log((this.adelanto.form.get('periodo') as any).controls);
      localStorage.setItem(
        'anio',
        String(this.adelanto.controls['anio'].value)
      );
      localStorage.setItem('mes', String(this.adelanto.controls['mes'].value));
    }
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
