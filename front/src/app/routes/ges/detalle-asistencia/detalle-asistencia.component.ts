import {
  Component, Injector, ViewChild
} from '@angular/core';
import { SettingsService, _HttpClient } from '@delon/theme';
import {
  BehaviorSubject,
  Subject,
  catchError,
  debounceTime,
  filter,
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
import { NavigationEnd, Router } from '@angular/router';

enum Busqueda {
  Sucursal,
  Objetivo,
  Personal,
  Responsable
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
    private apiService: ApiService,
    private router: Router,
    private settingService: SettingsService,
  ) {}

  private destroy$ = new Subject();

  selectedTabIndex = 0;
  responsable = 0


  selectedDate = null;
  selectedPeriod = { year: 0, month: 0 };

  selectedSucursalId = '';
  selectedObjetivoId = '';
  selectedMetodologiaId = '';
  selectedCategoriaId = '';
  listaDescuentosPerTotal = 0
  listaIngresosPerTotal = 0
  listaIngresosExtraPerTotal = 0
  listaAsistenciaPerTotal = 0
  listaAsistenciaObjTotalImporte = 0
  listaAsistenciaPerTotalHoras = 0
  listaIngresosPerTotalHoras = 0
  listaIngresosExtraPerTotalHoras = 0
  listaAsistenciaObjTotalHoras = 0

  $isSucursalOptionsLoading = new BehaviorSubject(false);

  $selectedSucursalIdChange = new BehaviorSubject('');
  $selectedObjetivoIdChange = new BehaviorSubject('');
  $selectedPersonalIdChange = new BehaviorSubject('');
  $selectedResponsablePersonalIdChange = new BehaviorSubject('');

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
      ).pipe(
        tap(data => { this.listaAsistenciaObjTotalImporte = data.totalImporte, this.listaAsistenciaObjTotalHoras = data.totalHoras })
      )
    )
  )

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
        (
          (tap(data => { this.listaAsistenciaPerTotal = data.totalImporte, this.listaAsistenciaPerTotalHoras = data.totalHoras}))

        )
    )
  );

  $listaIngresosPer = this.$selectedPersonalIdChange.pipe(
    debounceTime(500),
    switchMap(PersonalId =>
      this.searchService
        .getIngresosPersona(
          Number(PersonalId),
          this.selectedPeriod.year,
          this.selectedPeriod.month
        )
        .pipe
        //          doOnSubscribe(() => this.tableLoading$.next(true)),
        (tap(data => { this.listaIngresosPerTotal = data.total; this.listaIngresosPerTotalHoras = data.totalHoras})   
        
    
      )))
  
  $listaIngresosExtraPer = this.$selectedPersonalIdChange.pipe(
    debounceTime(500),
    switchMap(PersonalId =>
      this.searchService
        .getIngresosExtraPersona(
          Number(PersonalId),
          this.selectedPeriod.year,
          this.selectedPeriod.month
        )
        .pipe
        //          doOnSubscribe(() => this.tableLoading$.next(true)),
        (tap(data => { this.listaIngresosExtraPerTotal = data.total; this.listaIngresosExtraPerTotalHoras = data.totalHoras})   
        
    
  )))


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
        (tap(data => { this.listaDescuentosPerTotal = data.total})   
        
    
  )))

  $listaPersonal = this.$selectedResponsablePersonalIdChange.pipe(
    debounceTime(500),
    switchMap(PersonalId =>
      this.searchService
        .getPersonalxResponsable(
          Number(PersonalId),
          this.selectedPeriod.year,
          this.selectedPeriod.month
        )
        .pipe
        //          doOnSubscribe(() => this.tableLoading$.next(true)),
        (tap(data => { this.listaDescuentosPerTotal = data.total})   
  )))

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

  $sitrevista  = this.$selectedPersonalIdChange.pipe(
    debounceTime(500),
    switchMap(() =>
      this.apiService
        .getPersonaSitRevista(
          this.selectedPeriod.year,
          this.selectedPeriod.month,
          this.asistenciaPer.controls['PersonalId'].value
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
  $isResponsableDataLoading = new BehaviorSubject(false);

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
        this.$selectedObjetivoIdChange.next(event);
        this.$isObjetivoDataLoading.next(true);
        return;
      case Busqueda.Personal:
        this.$selectedPersonalIdChange.next(event);
        this.$isPersonalDataLoading.next(true);
        return;
      case Busqueda.Responsable:
        this.$selectedResponsablePersonalIdChange.next(event);
        this.$isResponsableDataLoading.next(true);
        return;
    }
  }

  searchObjetivo(event: string) {
    if (!event) return;
    this.$searchObjetivoChange.next(event);
  }

   buscarPorPersona(PersonalId: string) {
    this.asistenciaPer.controls['PersonalId'].setValue(PersonalId);
//    this.router.navigate(['/ges/detalle_asistencia/persona', { state: { PersonalId } }])
    this.router.navigateByUrl('/ges/detalle_asistencia/persona', { state: { PersonalId } });

  }

  buscarPorObjetivo(ObjetivoId: string) {
    console.log('buscarPorObjetivo')
    this.asistenciaObj.controls['ObjetivoId'].setValue(ObjetivoId);
//    this.router.navigate(['/ges/detalle_asistencia/objetivo', { state: { ObjetivoId } }]);
    this.router.navigateByUrl('/ges/detalle_asistencia/objetivo', { state: { ObjetivoId } });

  }



  ngOnInit(): void {
    const user: any = this.settingService.getUser()
    this.responsable = user.PersonalId


/*
    this.router.events.subscribe((val) => {
      // see also 
      console.log(val) 
    });
  
    
    this.router.routerState.
    this.router.events.pipe(filter((event: any) => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
      //Do something with the NavigationEnd event object.
      console.log(event) 
    });
*/
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
