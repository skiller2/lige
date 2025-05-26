import { Component, Input, ViewChild, inject, signal } from '@angular/core';
import { SettingsService, _HttpClient } from '@delon/theme';
import { BehaviorSubject, Subject, debounceTime, switchMap, tap } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { NgForm } from '@angular/forms';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { SHARED_IMPORTS } from '@shared';
import { CurrencyPipeModule } from '@delon/util';
import { NzResizableModule } from 'ng-zorro-antd/resizable';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { ViewResponsableComponent } from "../../../shared/view-responsable/view-responsable.component";
import { DescuentosComponent } from '../descuentos/descuentos.component';
import { PersonalGrupoComponent } from '../personal-grupo/personal-grupo.component';

enum Busqueda { Sucursal, Objetivo, Personal }

@Component({
  selector: 'app-detalle-asistencia',
  templateUrl: './detalle-asistencia.component.html',
  styleUrls: ['./detalle-asistencia.component.less'],
  imports: [...SHARED_IMPORTS, NzResizableModule, CurrencyPipeModule, CommonModule, PersonalSearchComponent, ObjetivoSearchComponent, ViewResponsableComponent, DescuentosComponent, PersonalGrupoComponent]
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
  //@ViewChild('sfb', { static: false }) sharedFiltroBuilder!: FiltroBuilderComponent;
  @Input('ObjetivoId') ObjetivoId: number | undefined
  @Input('PersonalId') PersonalId: number | undefined


  public get Busqueda() {
    return Busqueda;
  }

  private searchService = inject(SearchService)
  private apiService = inject(ApiService)
  private router = inject(Router)
  private route = inject(ActivatedRoute)
  private settingService = inject(SettingsService)

  private destroy$ = new Subject();

  responsable = signal(0)


  selectedDate = null;
  selectedPeriod = signal({ year: 0, month: 0 });

  //  selectedSucursalId = '';
  selectedObjetivoId = 0;
  selectedPersonalId = 0;
  selectedMetodologiaId = '';
  selectedCategoriaId = '';
  listaDescuentosPerTotalC = 0
  listaDescuentosPerTotalG = 0
  listaIngresosPerTotal = 0
  listaIngresosExtraPerTotalG = 0
  listaIngresosExtraPerTotalC = 0
  listaAsistenciaPerTotal = 0
  //listaAsistenciaObjTotalImporte = 0
  listaAsistenciaPerTotalHoras = 0
  listaIngresosPerTotalHoras = 0
  listaIngresosExtraPerTotalHoras = 0
  //listaAsistenciaObjTotalHoras = 0
  listaCustodiasPerTotal = 0
  listaCustodiasPerTotalHoras = 0
  listaDescuentosObjTotal = 0
  objetivoIdSelected = 0;

  personalIdlist = signal([])


  $isSucursalOptionsLoading = new BehaviorSubject(false);

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
        .getObjetivoResponsables(
          Number(objetivoId),
          this.selectedPeriod().year,
          this.selectedPeriod().month
        )
        .pipe(
          doOnSubscribe(() => {
            this.objetivoIdSelected = parseInt(objetivoId)
            this.objetivoResponsablesLoading$.next(true)
          }),
          tap({
            complete: () => {
              this.objetivoIdSelected = parseInt(objetivoId)
              this.objetivoResponsablesLoading$.next(false)
            },
          })
        );
    })
  );

  $listaAsistencia = this.$selectedObjetivoIdChange.pipe(
    debounceTime(50),
    switchMap(objetivoId =>
      this.searchService.getAsistenciaObjetivo(
        Number(objetivoId),
        this.selectedPeriod().year,
        this.selectedPeriod().month
      )
    )
  )

  $listaExcepciones = this.$selectedObjetivoIdChange.pipe(
    debounceTime(50),
    switchMap(objetivoId =>
      this.searchService.getExcepxObjetivo(
        Number(objetivoId),
        this.selectedPeriod().year,
        this.selectedPeriod().month
      )
    )
  );

  $listaDescuentosPerxObj = this.$selectedObjetivoIdChange.pipe(
    debounceTime(50),
    switchMap(objetivoId =>
      this.searchService.getDescuentosPerxObjetivo(
        Number(objetivoId),
        this.selectedPeriod().year,
        this.selectedPeriod().month
      )
    )
  );


  /*
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
  */

  $listaAsistenciaPer = this.$selectedPersonalIdChange.pipe(
    debounceTime(500),
    switchMap(PersonalId =>
      this.searchService
        .getAsistenciaPersona(
          Number(PersonalId),
          this.selectedPeriod().year,
          this.selectedPeriod().month
        )
        .pipe
        //          doOnSubscribe(() => this.tableLoading$.next(true)),
        //          tap({ complete: () => this.tableLoading$.next(false) })
        (
          (tap(data => { this.listaAsistenciaPerTotal = data.totalImporte, this.listaAsistenciaPerTotalHoras = data.totalHoras }))

        )
    )
  );
  $listaCustodiasPer = this.$selectedPersonalIdChange.pipe(
    debounceTime(500),
    switchMap(PersonalId =>
      this.searchService
        .getCustodiasPersona(
          Number(PersonalId),
          this.selectedPeriod().year,
          this.selectedPeriod().month
        )
        .pipe
        //          doOnSubscribe(() => this.tableLoading$.next(true)),
        //          tap({ complete: () => this.tableLoading$.next(false) })
        (
          (tap(data => { this.listaCustodiasPerTotal = data.totalImporte, this.listaCustodiasPerTotalHoras = data.totalHoras }))

        )
    )
  );

  $listaIngresosPer = this.$selectedPersonalIdChange.pipe(
    debounceTime(500),
    switchMap(PersonalId =>
      this.searchService
        .getIngresosPersona(
          Number(PersonalId),
          this.selectedPeriod().year,
          this.selectedPeriod().month
        )
        .pipe
        //          doOnSubscribe(() => this.tableLoading$.next(true)),
        (tap(data => { this.listaIngresosPerTotal = data.total; this.listaIngresosPerTotalHoras = data.totalHoras })


        )))

  $listaIngresosExtraPer = this.$selectedPersonalIdChange.pipe(
    debounceTime(500),
    switchMap(PersonalId =>
      this.searchService
        .getIngresosExtraPersona(
          Number(PersonalId),
          this.selectedPeriod().year,
          this.selectedPeriod().month
        )
        .pipe
        //          doOnSubscribe(() => this.tableLoading$.next(true)),
        (tap(data => { this.listaIngresosExtraPerTotalC = data.totalC; this.listaIngresosExtraPerTotalG = data.totalG; this.listaIngresosExtraPerTotalHoras = data.totalHoras })


        )))


  $listaDescuentosCoord = this.$selectedPersonalIdChange.pipe(
    debounceTime(500),
    switchMap(PersonalId =>
      this.searchService
        .getDescuentosPersonaCoord(
          Number(PersonalId),
          this.selectedPeriod().year,
          this.selectedPeriod().month
        )
        .pipe
        //          doOnSubscribe(() => this.tableLoading$.next(true)),
        (tap(data => { this.listaDescuentosPerTotalC = data.totalC })
  )))

  $listaDescuentosPer = this.$selectedPersonalIdChange.pipe(
    debounceTime(500),
    switchMap(PersonalId =>
      this.searchService
        .getDescuentosPersona(
          Number(PersonalId),
          this.selectedPeriod().year,
          this.selectedPeriod().month
        )
        .pipe
        //          doOnSubscribe(() => this.tableLoading$.next(true)),
        (tap(data => { this.listaDescuentosPerTotalG = data.totalG })
  )))


  $listaDescuentosObj = this.$selectedObjetivoIdChange.pipe(
    debounceTime(500),
    switchMap(ObjetivoId =>
      this.searchService
        .getDescuentosObjetivo(
          Number(ObjetivoId),
          this.selectedPeriod().year,
          this.selectedPeriod().month
        )
        .pipe
        //          doOnSubscribe(() => this.tableLoading$.next(true)),
        (tap(data => { this.listaDescuentosObjTotal = data.total })
  )))

  $listaCategoriasPer = this.$selectedPersonalIdChange.pipe(
    debounceTime(500),
    switchMap(PersonalId =>
      this.searchService
        .getCategoriasPersona(
          Number(PersonalId),
          this.selectedPeriod().year,
          this.selectedPeriod().month,
          0,
          0
        )
        .pipe
        //          doOnSubscribe(() => this.tableLoading$.next(true)),
        (tap(data => { })


        )))

  $personaMonotributo = this.$selectedPersonalIdChange.pipe(
    debounceTime(500),
    switchMap(() =>
      this.apiService
        .getPersonaMonotributo(
          this.selectedPeriod().year,
          this.selectedPeriod().month,
          Number(this.asistenciaPer.controls['PersonalId'].value)
        )
        .pipe
        //          doOnSubscribe(() => this.tableLoading$.next(true)),
        //          tap({ complete: () => this.tableLoading$.next(false) })
        ()
    )
  );

  $sitrevista = this.$selectedPersonalIdChange.pipe(
    debounceTime(500),
    switchMap(() =>
      this.apiService
        .getPersonaSitRevista(
          Number(this.asistenciaPer.controls['PersonalId'].value),
          this.selectedPeriod().year,
          this.selectedPeriod().month
        )
        .pipe
        //          doOnSubscribe(() => this.tableLoading$.next(true)),
        //          tap({ complete: () => this.tableLoading$.next(false) })
        ()
    )
  )


  $personaResponsables = this.$selectedPersonalIdChange.pipe(
    debounceTime(500),
    switchMap(() =>
      this.apiService
        .getPersonaResponsables(
          Number(this.asistenciaPer.controls['PersonalId'].value),
          this.selectedPeriod().year,
          this.selectedPeriod().month
        )
        .pipe
        //          doOnSubscribe(() => this.tableLoading$.next(true)),
        //          tap({ complete: () => this.tableLoading$.next(false) })
        ()
    ));

  $listaExcepcionesPer = this.$selectedPersonalIdChange.pipe(
    debounceTime(500),
    switchMap(PersonalId =>
      this.searchService.getExcepxPersona(
        Number(PersonalId),
        this.selectedPeriod().year,
        this.selectedPeriod().month
      )
    )
  );

  $isSucursalDataLoading = new BehaviorSubject(false);
  $isObjetivoDataLoading = new BehaviorSubject(false);
  $isPersonalDataLoading = new BehaviorSubject(false);



  ngAfterContentInit(): void {
    const now = new Date(); //date
    const user: any = this.settingService.getUser()
    this.responsable.set(user.PersonalId)

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

    }, 1);

    setTimeout(() => {
      if (this.PersonalId)
        this.asistenciaPer.controls['PersonalId'].setValue(Number(this.PersonalId))
      if (this.ObjetivoId)
        this.asistenciaObj.controls['ObjetivoId'].setValue(Number(this.ObjetivoId))
    }, 100)



  }

  selectedValueChange(event: string, busqueda: Busqueda): void {
    switch (busqueda) {
      case Busqueda.Sucursal:
        /*
        localStorage.setItem(
          'SucursalId',
          this.asistencia.controls['SucursalId'].value
        );
        this.selectedSucursalId = event;
        this.$selectedSucursalIdChange.next(event);
        this.$isSucursalDataLoading.next(true);
        */
        return;
      case Busqueda.Objetivo:
        this.$selectedObjetivoIdChange.next(event);
        this.$isObjetivoDataLoading.next(true);
        if (Number(event) > 0)
          this.router.navigate(['.', { ObjetivoId: event }], {
            relativeTo: this.route,
            skipLocationChange: false,
            replaceUrl: false,
          })


        return;
      case Busqueda.Personal:
        this.$selectedPersonalIdChange.next(event);
        this.$isPersonalDataLoading.next(true);
        if (Number(event) > 0)
          this.router.navigate(['.', { PersonalId: event }], {
            relativeTo: this.route,
            skipLocationChange: false,
            replaceUrl: false,
          })

        return;
    }
  }

  searchObjetivo(event: string) {
    if (!event) return;
    this.$searchObjetivoChange.next(event);
  }

  onTabsetChange(_event: any) {
    if (this.PersonalId)
      this.asistenciaPer.controls['PersonalId'].setValue(Number(this.PersonalId))
    if (this.ObjetivoId)
      this.asistenciaObj.controls['ObjetivoId'].setValue(Number(this.ObjetivoId))
  }

  dateChange(result: Date): void {
    this.selectedPeriod.set({ year: result.getFullYear(), month: result.getMonth() + 1 })

    localStorage.setItem('anio', String(this.selectedPeriod().year));
    localStorage.setItem('mes', String(this.selectedPeriod().month));

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
