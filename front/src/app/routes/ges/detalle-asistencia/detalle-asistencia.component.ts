import { Component, Injector, OnInit, ViewChild } from '@angular/core';
import { SettingsService, _HttpClient } from '@delon/theme';
import {
  BehaviorSubject,
  Subject,
  catchError,
  debounceTime,
  of,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { NgForm } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { SharedModule } from '@shared';
import { CurrencyPipeModule } from '@delon/util';
import { NzResizableModule } from 'ng-zorro-antd/resizable';

enum Busqueda {
  Sucursal,
  Objetivo,
  Personal,
}

@Component({
  selector: 'app-detalle-asistencia',
  standalone: true,
  imports: [SharedModule, NzResizableModule, CurrencyPipeModule],
  templateUrl: './detalle-asistencia.component.html',
})
export class DetalleAsistenciaComponent {
  @ViewChild('asistencia', { static: true }) asistencia: NgForm = new NgForm(
    [],
    []
  );
  @ViewChild('asistenciaObj', { static: true }) asistenciaObj: NgForm =
    new NgForm([], []);
  @ViewChild('asistenciaPer', { static: true }) asistenciaPer: NgForm =
    new NgForm([], []);
  public get Busqueda() {
    return Busqueda;
  }

  constructor(
    private searchService: SearchService,
    private apiService: ApiService
  ) {}

  private destroy$ = new Subject();

  selectedTabIndex = 0;

  selectedDate = null;
  selectedPeriod = { year: 0, month: 0 };

  selectedSucursalId = '';
  selectedMetodologiaId = '';
  selectedCategoriaId = '';

  $isSucursalOptionsLoading = new BehaviorSubject(false);

  $selectedSucursalIdChange = new BehaviorSubject('');
  $selectedObjetivoIdChange = new BehaviorSubject('');
  $selectedPersonalIdChange = new BehaviorSubject('');

  $searchObjetivoChange = new BehaviorSubject('');

  $optionsMetodologia = this.searchService.getMetodologia();
  $optionsSucursales = this.searchService.getSucursales();
  $optionsCategoria = this.searchService.getCategorias();

  objetivoResponsablesLoading$ = new BehaviorSubject<boolean | null>(null);
  $objetivoResponsables = this.$selectedObjetivoIdChange.pipe(
    debounceTime(50),
    switchMap(objetivoId => {
      if (!objetivoId) return [];
      return this.searchService
        .getObjetivo(
          Number(objetivoId),
          this.selectedPeriod.year,
          this.selectedPeriod.month
        )
        .pipe(
          doOnSubscribe(() => this.objetivoResponsablesLoading$.next(true)),
          tap({
            complete: () => this.objetivoResponsablesLoading$.next(false),
          })
        );
    })
  );

  $listaAsistencia = this.$selectedObjetivoIdChange.pipe(
    debounceTime(50),
    switchMap(objetivoId =>
      this.searchService.getAsistenciaObjetivo(
        Number(objetivoId),
        this.selectedPeriod.year,
        this.selectedPeriod.month
      )
    )
  );

  $listaExcepciones = this.$selectedObjetivoIdChange.pipe(
    debounceTime(50),
    switchMap(objetivoId =>
      this.searchService.getExcepxObjetivo(
        Number(objetivoId),
        this.selectedPeriod.year,
        this.selectedPeriod.month
      )
    )
  );

  $listaDescuentosObj = this.$selectedObjetivoIdChange.pipe(
    debounceTime(50),
    switchMap(objetivoId =>
      this.searchService.getDescuentosObjetivo(
        Number(objetivoId),
        this.selectedPeriod.year,
        this.selectedPeriod.month
      )
    )
  );



  $optionsObjetivos = this.$searchObjetivoChange.pipe(
    debounceTime(500),
    switchMap(event =>
      this.searchService.getObjetivos(
        Number(event.charAt(0)) ? 'Codigo' : 'Descripcion',
        event,
        this.asistencia.controls['SucursalId'].value
      )
    )
  );

  $listaAsistenciaPer = this.$selectedPersonalIdChange.pipe(
    debounceTime(500),
    switchMap(PersonalId =>
      this.searchService
        .getAsistenciaPersona(
          Number(PersonalId),
          this.selectedPeriod.year,
          this.selectedPeriod.month
        )
        .pipe
        //          doOnSubscribe(() => this.tableLoading$.next(true)),
        //          tap({ complete: () => this.tableLoading$.next(false) })
        ()
    )
  );

  $listaDescuentosPer = this.$selectedPersonalIdChange.pipe(
    debounceTime(500),
    switchMap(PersonalId =>
      this.searchService
        .getDescuentosPersona(
          Number(PersonalId),
          this.selectedPeriod.year,
          this.selectedPeriod.month
        )
        .pipe
        //          doOnSubscribe(() => this.tableLoading$.next(true)),
        //          tap({ complete: () => this.tableLoading$.next(false) })
        ()
    )
  );

  $personaMonotributo = this.$selectedPersonalIdChange.pipe(
    debounceTime(500),
    switchMap(() =>
      this.apiService
        .getPersonaMonotributo(
          this.selectedPeriod.year,
          this.selectedPeriod.month,
          Number(this.asistenciaPer.controls['PersonalId'].value)
        )
        .pipe
        //          doOnSubscribe(() => this.tableLoading$.next(true)),
        //          tap({ complete: () => this.tableLoading$.next(false) })
        ()
    )
  );

  $personaResponsables = this.$selectedPersonalIdChange.pipe(
    debounceTime(500),
    switchMap(() =>
      this.apiService
        .getPersonaResponsables(
          this.selectedPeriod.year,
          this.selectedPeriod.month,
          this.asistenciaPer.controls['PersonalId'].value
        )
        .pipe
        //          doOnSubscribe(() => this.tableLoading$.next(true)),
        //          tap({ complete: () => this.tableLoading$.next(false) })
        ()
    )
  );

  $listaExcepcionesPer = this.$selectedPersonalIdChange.pipe(
    debounceTime(500),
    switchMap(PersonalId =>
      this.searchService.getExcepxPersona(
        Number(PersonalId),
        this.selectedPeriod.year,
        this.selectedPeriod.month
      )
    )
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

      this.asistencia.form.get('periodo')?.setValue(new Date(anio, mes - 1, 1));

      if (localStorage.getItem('SucursalId')) {
        this.asistencia.controls['SucursalId'].setValue(
          Number(localStorage.getItem('SucursalId'))
        );
      }
      //this.asistenciaexcepcion.valueChanges
    }, 1);
  }

  selectedValueChange(event: string, busqueda: Busqueda): void {
    switch (busqueda) {
      case Busqueda.Sucursal:
        localStorage.setItem(
          'SucursalId',
          this.asistencia.controls['SucursalId'].value
        );
        this.selectedSucursalId = event;
        this.$selectedSucursalIdChange.next(event);
        this.$isSucursalDataLoading.next(true);
        return;
      case Busqueda.Objetivo:
        console.log(event);
        this.$selectedObjetivoIdChange.next(event);
        this.$isObjetivoDataLoading.next(true);
        return;
      case Busqueda.Personal:
        this.$selectedPersonalIdChange.next(event);
        this.$isPersonalDataLoading.next(true);
        return;
    }
  }

  searchObjetivo(event: string) {
    if (!event) return;
    this.$searchObjetivoChange.next(event);
  }

  buscarPorPersona(PersonalId: string) {
    this.asistenciaPer.controls['PersonalId'].setValue(PersonalId);
    this.selectedTabIndex = 1;
  }

  buscarPorObjetivo(ObjetivoId: string) {
    this.asistenciaObj.controls['ObjetivoId'].setValue(ObjetivoId);
    this.selectedTabIndex = 0;
  }

  dateChange(result: Date): void {
    this.selectedPeriod.year = result.getFullYear();
    this.selectedPeriod.month = result.getMonth() + 1;

    localStorage.setItem('anio', String(this.selectedPeriod.year));
    localStorage.setItem('mes', String(this.selectedPeriod.month));

    this.$selectedObjetivoIdChange.next(
      this.asistenciaObj.controls['ObjetivoId'].value
    );
    this.$selectedPersonalIdChange.next(
      this.asistenciaPer.controls['PersonalId'].value
    );
    this.$isObjetivoDataLoading.next(true);
  }

  ngOnDestroy(): void {
    this.destroy$.next('');
    this.destroy$.complete();
  }
}
