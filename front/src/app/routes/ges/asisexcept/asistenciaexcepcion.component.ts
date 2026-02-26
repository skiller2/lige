import { Component, HostListener, Injector, OnInit, ViewChild, inject, signal } from '@angular/core';
import { SettingsService, _HttpClient } from '@delon/theme';
import { BehaviorSubject, Subject, catchError, debounceTime, of, switchMap, takeUntil, tap } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { FormGroup, NgForm } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';
import { PersonalSearchComponent } from 'src/app/shared/personal-search/personal-search.component';
import { ObjetivoSearchComponent } from 'src/app/shared/objetivo-search/objetivo-search.component';
import { ViewResponsableComponent } from "../../../shared/view-responsable/view-responsable.component";

enum Busqueda {
  Sucursal,
  Objetivo,
  Personal,
  Periodo
}

@Component({
  selector: 'app-ges-asistenciaexcepcion',
  templateUrl: './asistenciaexcepcion.component.html',
  styleUrls: ['./asistenciaexcepcion.component.less'],
  imports: [...SHARED_IMPORTS, CommonModule, PersonalSearchComponent, ObjetivoSearchComponent, ViewResponsableComponent]
})
export class ExcepcionAsistenciaComponent {
  @ViewChild('asistenciaexcepcion', { static: true })
  asistenciaexcepcion: NgForm = new NgForm([], []);

  public get Busqueda() {
    return Busqueda;
  }

  public router = inject(Router)


  constructor(
    private searchService: SearchService,
    private injector: Injector,
    private settingService: SettingsService,
    private _route: ActivatedRoute,
    private apiService: ApiService
  ) { }

  private destroy$ = new Subject();

  selectedSucursalId = signal(0);
  selectedObjetivoId = signal(0);
  selectedPersonalId = signal(0);
  selectedMetodologiaId: any;
  selectedCategoriaId = '';
  selectedPeriod = signal<Date>(new Date());
  anio = signal(0);
  mes = signal(0);
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
          Number(event),
          Number(this.anio()),
          Number(this.mes()),
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
        return this.searchService.getObjetivoResponsables(
          Number(objetivoId),
          Number(this.anio()),
          Number(this.mes())
        );
    })
    //    tap(() => this.$isObjetivoOptionsLoading.next(false))
  );

  $listaExcepciones = this.$selectedObjetivoIdChange.pipe(
    debounceTime(50),
    switchMap(objetivoId =>
      this.searchService.getExcepxObjetivo(
        Number(objetivoId),
        Number(this.anio()),
        Number(this.mes())
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
      const anio =
      Number(localStorage.getItem('anio')) > 0
          ? Number(localStorage.getItem('anio'))
          : now.getFullYear();
      const mes =
        Number(localStorage.getItem('mes')) > 0
          ? Number(localStorage.getItem('mes'))
          : now.getMonth() + 1;

      this.anio.set(anio);
      this.mes.set(mes);
      this.asistenciaexcepcion.form.get('periodo')?.setValue(new Date(anio, mes - 1, 1))
      const routeParams = this._route.snapshot.paramMap;
      const objetivoId = Number(routeParams.get('ObjetivoId')) || 0;

      if (objetivoId > 0) {
        this.asistenciaexcepcion.form.get('ObjetivoId')?.setValue(objetivoId);
        this.selectedObjetivoId.set(objetivoId);
        this.$selectedObjetivoIdChange.next(String(objetivoId));
        this.searchService
          .ObjetivoInfoFromId(String(objetivoId))
          .pipe(takeUntil(this.destroy$))
          .subscribe((objetivoInfo: any) => this.infoObjetivo(objetivoInfo));
      }

      const sucursalId = Number(localStorage.getItem('SucursalId')) || 0;
      if (sucursalId > 0) {
        this.asistenciaexcepcion.form.get('SucursalId')?.setValue(sucursalId);
        this.selectedSucursalId.set(sucursalId);
      }

      console.log('ngAfterViewInit');
    }, 1);
  }

  selectedValueChange(event: any, busqueda: Busqueda): void {
    //   this.asistenciaexcepcion.controls['anio'].setValue(2023);
    //    this.asistenciaexcepcion.controls['mes'].setValue(3);

    switch (busqueda) {

      case Busqueda.Periodo:
        this.anio.set(event.getFullYear());
        this.mes.set(event.getMonth() + 1);
        localStorage.setItem('anio', String(this.anio()));
        localStorage.setItem('mes', String(this.mes()));
        this.$selectedObjetivoIdChange.next(this.asistenciaexcepcion.controls['ObjetivoId'].value);
        break;
      case Busqueda.Objetivo:
        this.selectedObjetivoId.set(Number(event));
        this.$selectedObjetivoIdChange.next(event);
        this.$isObjetivoDataLoading.next(true);
        if (this.asistenciaexcepcion.controls['ObjetivoId'].value > 0) {
          this.router.navigate(['.', { ObjetivoId: this.selectedObjetivoId() }], {
            relativeTo: this._route,
            skipLocationChange: false,
            replaceUrl: false,
          })

        }
        return;
      case Busqueda.Personal:
        this.selectedPersonalId.set(Number(event));
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
        next: (data: any) => console.log('data', data),
        error: (err: any) => {
          console.log('error', err);
        },
        complete: () => {
          console.log('complete');
          /*
          onlySelf?: boolean;
          emitEvent?: boolean;
          emitModelToViewChange?: boolean;
          emitViewToModelChange ?: boolean;
          */
          this.asistenciaexcepcion.controls['PersonalId'].setValue('0', { emitEvent: true });
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
        next: (data: any) => console.log('data', data),
        error: (err: any) => {
          console.log('error', err);
        },
        complete: () => {

          this.asistenciaexcepcion.controls['PersonalId'].setValue('0');
          this.asistenciaexcepcion.controls['metodologia'].setValue('');

          this.notification.success('Finalización', 'Existosa');
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next('');
    this.destroy$.complete();
  }

  gotoCargaAsistencia(): void {
    this.router.navigate(['/ges/carga_asistencia', { ObjetivoId: this.selectedObjetivoId() }])
  }

  infoObjetivo(val: any) {
    this.selectedSucursalId.set(val?.SucursalId)
  }
}
