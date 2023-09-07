import { Component, HostListener, Injector, OnInit, ViewChild } from '@angular/core';
import { SettingsService, _HttpClient } from '@delon/theme';
import { BehaviorSubject, Subject, catchError, debounceTime, of, switchMap, takeUntil, tap } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { FormGroup, NgForm } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { SharedModule } from '@shared';

enum Busqueda {
  Sucursal,
  Objetivo,
  Personal,
  Anio,
  Mes,
}

@Component({
  selector: 'app-ges-asistenciaexcepcion',
  templateUrl: './asistenciaexcepcion.component.html',
  styleUrls: ['./asistenciaexcepcion.component.less'],
  standalone: true,
  imports: [SharedModule],
})
export class ExcepcionAsistenciaComponent {
  @ViewChild('asistenciaexcepcion', { static: true })
  asistenciaexcepcion: NgForm = new NgForm([], []);

  public get Busqueda() {
    return Busqueda;
  }

  constructor(
    private searchService: SearchService,
    private injector: Injector,
    private settingService: SettingsService,
    private _route: ActivatedRoute,
    private _router: Router,
    private apiService: ApiService
  ) {}

  private destroy$ = new Subject();

  selectedSucursalId = '';
  selectedObjetivoId = '';
  selectedPersonalId = '';
  selectedMetodologiaId = '';
  selectedCategoriaId = '';

  $isSucursalOptionsLoading = new BehaviorSubject(false);
  $isObjetivoOptionsLoading = new BehaviorSubject(false);
  $isPersonalOptionsLoading = new BehaviorSubject(false);

  $selectedSucursalIdChange = new BehaviorSubject('');
  $selectedObjetivoIdChange = new BehaviorSubject('');
  $selectedPersonalIdChange = new BehaviorSubject('');

  $searchObjetivoChange = new BehaviorSubject('');
  $searchPersonalChange = new BehaviorSubject('');

  $optionsMetodologia = this.searchService.getMetodologia();
  $optionsSucursales = this.searchService.getSucursales();
  $optionsCategoria = this.searchService.getCategorias();

  $personaResponsables = this.$selectedPersonalIdChange.pipe(
    debounceTime(50),
    switchMap(event =>
      this.apiService
        .getPersonaResponsables(
          this.asistenciaexcepcion.form.get('anio')?.value,
          this.asistenciaexcepcion.form.get('mes')?.value,
          event
        )
        .pipe
        //          doOnSubscribe(() => this.tableLoading$.next(true)),
        //          tap({ complete: () => this.tableLoading$.next(false) })
        ()
    )
  );

  $objetivoResponsables = this.$selectedObjetivoIdChange.pipe(
    debounceTime(50),

    switchMap(objetivoId => {
      if (!objetivoId) return [];
      else
        return this.searchService.getObjetivo(
          Number(objetivoId),
          this.asistenciaexcepcion.controls['anio'].value,
          this.asistenciaexcepcion.controls['mes'].value
        );
    })
    //    tap(() => this.$isObjetivoOptionsLoading.next(false))
  );

  $listaExcepciones = this.$selectedObjetivoIdChange.pipe(
    debounceTime(50),
    switchMap(objetivoId =>
      this.searchService.getExcepxObjetivo(
        Number(objetivoId),
        this.asistenciaexcepcion.controls['anio'].value,
        this.asistenciaexcepcion.controls['mes'].value
      )
    ),
    tap(() => this.$isObjetivoOptionsLoading.next(false))
  );

  $optionsObjetivos = this.$searchObjetivoChange.pipe(
    debounceTime(500),
    switchMap(event =>
      this.searchService.getObjetivos(
        Number(event.charAt(0)) ? 'Codigo' : 'Descripcion',
        event,
        this.asistenciaexcepcion.controls['SucursalId'].value
      )
    ),
    tap(() => this.$isObjetivoOptionsLoading.next(false)),
    catchError(() => {
      return of([]);
    })
  );

  $optionsPersonal = this.$searchPersonalChange.pipe(
    debounceTime(500),
    switchMap(values => this.searchService.getPersonFromName(Number(values) ? 'CUIT' : 'Nombre', values)),
    tap(() => this.$isPersonalOptionsLoading.next(false))
  );

  $isSucursalDataLoading = new BehaviorSubject(false);
  $isObjetivoDataLoading = new BehaviorSubject(false);
  $isPersonalDataLoading = new BehaviorSubject(false);

  ngAfterViewInit(): void {
    const now = new Date(); //date
    setTimeout(() => {
      const anio = Number(localStorage.getItem('anio')) > 0 ? localStorage.getItem('anio') : now.getFullYear();
      const mes = Number(localStorage.getItem('mes')) > 0 ? localStorage.getItem('mes') : now.getMonth() + 1;

      this.asistenciaexcepcion.form.get('anio')?.setValue(Number(anio));
      this.asistenciaexcepcion.form.get('mes')?.setValue(Number(mes));

      const routeParams = this._route.snapshot.paramMap;

      if (routeParams.get('ObjetivoId') != null) {
        this.asistenciaexcepcion.form.get('SucursalId')?.setValue(Number(routeParams.get('SucursalId')));
        this.asistenciaexcepcion.form.get('ObjetivoId')?.setValue(Number(routeParams.get('ObjetivoId')));
      } else if (localStorage.getItem('SucursalId')) {
        this.asistenciaexcepcion.form.get('SucursalId')?.setValue(Number(localStorage.getItem('SucursalId')));
      }

      console.log('ngAfterViewInit');
    }, 1);
  }

  selectedValueChange(event: string, busqueda: Busqueda): void {
    //   this.asistenciaexcepcion.controls['anio'].setValue(2023);
    //    this.asistenciaexcepcion.controls['mes'].setValue(3);

    switch (busqueda) {
      case Busqueda.Anio:
        localStorage.setItem('anio', this.asistenciaexcepcion.controls['anio'].value);
        this.$selectedObjetivoIdChange.next(this.asistenciaexcepcion.controls['ObjetivoId'].value);

        break;
      case Busqueda.Mes:
        localStorage.setItem('mes', this.asistenciaexcepcion.controls['mes'].value);
        this.$selectedObjetivoIdChange.next(this.asistenciaexcepcion.controls['ObjetivoId'].value);
        break;

      case Busqueda.Sucursal:
        localStorage.setItem('SucursalId', this.asistenciaexcepcion.controls['SucursalId'].value);

        this.$selectedSucursalIdChange.next(event);
        this.$isSucursalDataLoading.next(true);

        return;
      case Busqueda.Objetivo:
        this.$selectedObjetivoIdChange.next(event);
        this.$isObjetivoDataLoading.next(true);

        if (this.asistenciaexcepcion.controls['ObjetivoId'].value > 0) {
          /*
          this._router.navigate(
            [
              '/ges/asistenciaexcepcion',
              this.asistenciaexcepcion.controls['SucursalId'].value,
              this.asistenciaexcepcion.controls['ObjetivoId'].value,
            ],
            {
              relativeTo: this._route,
              //          queryParams: {
              //            ObjetivoId: this.asistenciaexcepcion.controls['ObjetivoId'].value,
              //            SucursalId:this.asistenciaexcepcion.controls['SucursalId'].value
              //
              //          },
              //          queryParamsHandling: 'merge',
              //skipLocationChange: false,
              //replaceUrl: false,
              
            }
          );
          */
        }
        return;
      case Busqueda.Personal:
        this.$selectedPersonalIdChange.next(event);
        this.$isPersonalDataLoading.next(true);
        return;
    }
  }

  searchObjetivo(event: string) {
    if (!event) return;
    this.$isObjetivoOptionsLoading.next(true);
    this.$searchObjetivoChange.next(event);
  }

  searchPersonal(event: string) {
    if (!event) return;
    this.$isPersonalOptionsLoading.next(true);
    this.$searchPersonalChange.next(event);
  }

  private get notification(): NzNotificationService {
    return this.injector.get(NzNotificationService);
  }

  saveexception() {
    this.searchService
      .setAsistenciaExcepcion(this.asistenciaexcepcion.value)
      .pipe(
        switchMap(async () => this.$selectedObjetivoIdChange.next(this.asistenciaexcepcion.controls['ObjetivoId'].value)),
        //      tap(() => this.$isObjetivoOptionsLoading.next(false))
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: data => console.log('data', data),
        error: err => {
          console.log('error', err);
        },
        complete: () => {
          console.log('complete');

          this.asistenciaexcepcion.controls['PersonalId'].setValue('');
          this.asistenciaexcepcion.controls['metodologia'].setValue('');

          this.notification.success('Grabación', 'Existosa');
        },
      });
  }

  endexception() {
    this.searchService
      .deleteAsistenciaExcepcion(this.asistenciaexcepcion.value)
      .pipe(
        tap(() => this.$selectedObjetivoIdChange.next(this.asistenciaexcepcion.controls['ObjetivoId'].value)),
        //      tap(() => this.$isObjetivoOptionsLoading.next(false))
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: data => console.log('data', data),
        error: err => {
          console.log('error', err);
        },
        complete: () => {
          console.log('complete');

          this.asistenciaexcepcion.controls['PersonalId'].setValue('');
          this.asistenciaexcepcion.controls['metodologia'].setValue('');

          this.notification.success('Finalización', 'Existosa');
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next('');
    this.destroy$.complete();
  }
}
