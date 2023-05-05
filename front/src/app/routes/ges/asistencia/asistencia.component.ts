import { Component, Injector, OnInit, ViewChild } from '@angular/core';
import { SettingsService, _HttpClient } from '@delon/theme';
import { BehaviorSubject, Subject, catchError, debounceTime, of, switchMap, takeUntil, tap } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { NgForm } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ApiService } from 'src/app/services/api.service';

enum Busqueda {
  Sucursal,
  Objetivo,
  Personal,
  Anio,
  Mes
}

@Component({
  selector: 'app-ges-asistencia',
  templateUrl: './asistencia.component.html',
  styles: [
    `
    `
  ]
})


export class AsistenciaComponent {

  @ViewChild('asistencia', { static: true }) asistencia: NgForm = new NgForm([], []);
  @ViewChild('asistenciaObj', { static: true }) asistenciaObj: NgForm = new NgForm([], []);
  @ViewChild('asistenciaPer', { static: true }) asistenciaPer: NgForm = new NgForm([], []);
  public get Busqueda() { return Busqueda }

  constructor(private searchService: SearchService, private injector: Injector, private settingService: SettingsService, private apiService: ApiService) { }

  private destroy$ = new Subject();

  selectedSucursalId = ''
  selectedObjetivoId = ''
  selectedPersonalId = ''
  selectedMetodologiaId = ''
  selectedCategoriaId = ''

  $isSucursalOptionsLoading = new BehaviorSubject(false)
  $isObjetivoOptionsLoading = new BehaviorSubject(false)
  $isPersonalOptionsLoading = new BehaviorSubject(false)

  $selectedSucursalIdChange = new BehaviorSubject('')
  $selectedObjetivoIdChange = new BehaviorSubject('')
  $selectedPersonalIdChange = new BehaviorSubject('')

  $searchObjetivoChange = new BehaviorSubject('')
  $searchPersonalChange = new BehaviorSubject('')

  $optionsMetodologia = this.searchService.getMetodologia()
  $optionsSucursales = this.searchService.getSucursales()
  $optionsCategoria = this.searchService.getCategorias()





  $objetivoResponsables = this.$selectedObjetivoIdChange.pipe(
    debounceTime(50),

    switchMap((objetivoId) => { console.log('busqueda', objetivoId); if (!objetivoId) return []; else return this.searchService.getObjetivo(Number(objetivoId), this.asistencia.controls['anio'].value, this.asistencia.controls['mes'].value) }),
    //    tap(() => this.$isObjetivoOptionsLoading.next(false))
  )


  $listaAsistencia = this.$selectedObjetivoIdChange.pipe(
    debounceTime(50),
    switchMap((objetivoId) => this.searchService.getAsistenciaObjetivo(Number(objetivoId), this.asistencia.controls['anio'].value, this.asistencia.controls['mes'].value)),
    tap(() => this.$isObjetivoOptionsLoading.next(false))
  )

  $listaExcepciones = this.$selectedObjetivoIdChange.pipe(
    debounceTime(50),
    switchMap((objetivoId) => this.searchService.getExcepxObjetivo(Number(objetivoId), this.asistencia.controls['anio'].value, this.asistencia.controls['mes'].value)),
    tap(() => this.$isObjetivoOptionsLoading.next(false))
  )


  $optionsObjetivos = this.$searchObjetivoChange.pipe(
    debounceTime(500),
    switchMap((event) => this.searchService.getObjetivos((Number(event.charAt(0)) ? 'Codigo' : 'Descripcion'), event, this.asistencia.controls['SucursalId'].value)),
    tap(() => this.$isObjetivoOptionsLoading.next(false))
  )

  $optionsPersonal = this.$searchPersonalChange.pipe(
    debounceTime(500),
    switchMap((values) => this.searchService.getPersonFromName((Number(values)) ? 'CUIT' : 'Nombre', values)),
    tap(() => this.$isPersonalOptionsLoading.next(false))
  )

  $listaAsistenciaPer = this.$selectedPersonalIdChange.pipe(
    debounceTime(500),
    switchMap((PersonalId) =>
    this.searchService.getAsistenciaPersona(Number(PersonalId), this.asistencia.controls['anio'].value, this.asistencia.controls['mes'].value)
        .pipe(
        //          doOnSubscribe(() => this.tableLoading$.next(true)),
        //          tap({ complete: () => this.tableLoading$.next(false) })
      )
    )
  );

  $personaResponsables = this.$selectedPersonalIdChange.pipe(
    debounceTime(500),
    switchMap(() =>
      this.apiService
        .getPersonaResponsables(
          this.asistencia.controls['anio'].value,
          this.asistencia.controls['mes'].value,
          this.asistenciaPer.controls['PersonalId'].value
        )
        .pipe(
        //          doOnSubscribe(() => this.tableLoading$.next(true)),
        //          tap({ complete: () => this.tableLoading$.next(false) })
      )
    )
  );

  $listaExcepcionesPer = this.$selectedPersonalIdChange.pipe(
    debounceTime(500),
    switchMap((PersonalId) => this.searchService.getExcepxPersona(Number(PersonalId), this.asistencia.controls['anio'].value, this.asistencia.controls['mes'].value)),
  );



  $isSucursalDataLoading = new BehaviorSubject(false)
  $isObjetivoDataLoading = new BehaviorSubject(false)
  $isPersonalDataLoading = new BehaviorSubject(false)


  ngAfterViewInit(): void {
    const now = new Date();    //date
    setTimeout(() => {

      const anio = (Number(localStorage.getItem('anio')) > 0) ? localStorage.getItem('anio') : now.getFullYear()
      const mes = (Number(localStorage.getItem('mes')) > 0) ? localStorage.getItem('mes') : now.getMonth() + 1

      this.asistencia.form.get('anio')?.setValue(Number(anio));
      this.asistencia.form.get('mes')?.setValue(Number(mes));

      if (localStorage.getItem('SucursalId')) {
        this.asistencia.controls['SucursalId'].setValue(Number(localStorage.getItem('SucursalId')))
      }
      //this.asistenciaexcepcion.valueChanges

    }, 1)




    console.log('dame', this.settingService.getUser())


  }

  selectedValueChange(event: string, busqueda: Busqueda): void {

    switch (busqueda) {
      case (Busqueda.Sucursal):
        localStorage.setItem('SucursalId', this.asistencia.controls['SucursalId'].value)
        this.$selectedSucursalIdChange.next(event)
        this.$isSucursalDataLoading.next(true)
        return
      case (Busqueda.Objetivo):
        this.$selectedObjetivoIdChange.next(event)
        this.$isObjetivoDataLoading.next(true)
        return
      case (Busqueda.Anio):
        localStorage.setItem(
          'anio',
          this.asistencia.controls['anio'].value
        );

        this.$selectedObjetivoIdChange.next(this.asistenciaObj.controls['ObjetivoId'].value)
        this.$selectedPersonalIdChange.next(this.asistenciaPer.controls['PersonalId'].value)
        this.$isObjetivoDataLoading.next(true)
        return
      case (Busqueda.Mes):
        localStorage.setItem(
          'mes',
          this.asistencia.controls['mes'].value
        );

        this.$selectedObjetivoIdChange.next(this.asistenciaObj.controls['ObjetivoId'].value)
        this.$selectedPersonalIdChange.next(this.asistenciaPer.controls['PersonalId'].value)

        this.$isObjetivoDataLoading.next(true)
        return
      case (Busqueda.Personal):
        this.$selectedPersonalIdChange.next(event)
        this.$isPersonalDataLoading.next(true)
        return
    }

    if (this.$selectedSucursalIdChange.getValue() && this.$selectedObjetivoIdChange.getValue()) {
      console.log('hola')
    }
  }

  searchObjetivo(event: string) {
    if (!event) return
    this.$isObjetivoOptionsLoading.next(true)
    this.$searchObjetivoChange.next(event)
  }

  searchPersonal(event: string) {
    if (!event) return
    this.$isPersonalOptionsLoading.next(true)
    this.$searchPersonalChange.next(event)
  }

  private get notification(): NzNotificationService {
    return this.injector.get(NzNotificationService);
  }


  ngOnDestroy(): void {
    this.destroy$.next('');
    this.destroy$.complete();
  }
}
