import { Component, Injector, OnInit, ViewChild } from '@angular/core';
import { SettingsService, _HttpClient } from '@delon/theme';
import { BehaviorSubject, Subject, catchError, debounceTime, of, switchMap, takeUntil, tap } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { NgForm } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';

enum Busqueda {
  Sucursal,
  Objetivo,
  Personal
}

@Component({
  selector: 'app-ges-asistenciaexcepcion',
  templateUrl: './asistenciaexcepcion.component.html',
  styleUrls: ['./asistenciaexcepcion.component.less']
})


export class ExcepcionAsistenciaComponent {

  @ViewChild('asistenciaexcepcion', { static: true }) asistenciaexcepcion: NgForm = new NgForm([], []);

  public get Busqueda() { return Busqueda }

  constructor(private searchService: SearchService, private injector: Injector, private settingService: SettingsService    ) { }

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

    switchMap((objetivoId) => { console.log('busqueda', objetivoId); if (!objetivoId) return []; else return this.searchService.getObjetivo(Number(objetivoId), this.asistenciaexcepcion.controls['anio'].value, this.asistenciaexcepcion.controls['mes'].value) }),
//    tap(() => this.$isObjetivoOptionsLoading.next(false))
  )


  $listaExcepciones = this.$selectedObjetivoIdChange.pipe(
    debounceTime(50),
    switchMap((objetivoId) => this.searchService.getExcepxObjetivo(Number(objetivoId), this.asistenciaexcepcion.controls['anio'].value, this.asistenciaexcepcion.controls['mes'].value)),
    tap(() => this.$isObjetivoOptionsLoading.next(false))
  )


  $optionsObjetivos = this.$searchObjetivoChange.pipe(
    debounceTime(500),
    switchMap((event) => this.searchService.getObjetivos((Number(event.charAt(0)) ? 'Codigo' : 'Descripcion'), event, this.asistenciaexcepcion.controls['SucursalId'].value)),
    tap(() => this.$isObjetivoOptionsLoading.next(false))
  )
  $optionsPersonal = this.$searchPersonalChange.pipe(
    debounceTime(500),
    switchMap((values) => this.searchService.getPersonFromName((Number(values)) ? 'CUIT' : 'Nombre', values)),
    tap(() => this.$isPersonalOptionsLoading.next(false))
  )

  $isSucursalDataLoading = new BehaviorSubject(false)
  $isObjetivoDataLoading = new BehaviorSubject(false)
  $isPersonalDataLoading = new BehaviorSubject(false)


  ngAfterViewInit(): void {
    const now = new Date();    //date
    setTimeout(() => {
      this.asistenciaexcepcion.controls['anio'].setValue(now.getFullYear());
      this.asistenciaexcepcion.controls['mes'].setValue(now.getMonth() + 1);
      if (localStorage.getItem('SucursalId')) {
        this.asistenciaexcepcion.controls['SucursalId'].setValue(Number(localStorage.getItem('SucursalId')))
      }
      //this.asistenciaexcepcion.valueChanges

    }, 1)

      


    console.log('dame', this.settingService.getUser())


  }

  selectedValueChange(event: string, busqueda: Busqueda): void {

    //   this.asistenciaexcepcion.controls['anio'].setValue(2023);
    //    this.asistenciaexcepcion.controls['mes'].setValue(3);


    switch (busqueda) {
      case (Busqueda.Sucursal):
        localStorage.setItem('SucursalId', this.asistenciaexcepcion.controls['SucursalId'].value)

        this.$selectedSucursalIdChange.next(event)
        this.$isSucursalDataLoading.next(true)
        return
      case (Busqueda.Objetivo):
        console.log('selectedValueChange',event)
        this.$selectedObjetivoIdChange.next(event)
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


  saveexception() {
    this.searchService.setAsistenciaExcepcion(this.asistenciaexcepcion.value)
      .pipe(
        switchMap(() => this.$listaExcepciones = this.searchService.getExcepxObjetivo(this.asistenciaexcepcion.controls['ObjetivoId'].value, this.asistenciaexcepcion.controls['anio'].value, this.asistenciaexcepcion.controls['mes'].value)),
        //      tap(() => this.$isObjetivoOptionsLoading.next(false))
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data) => console.log('data', data),
        error: (err) => {
          console.log('error', err)
        },
        complete: () => {
          console.log('complete')

          this.asistenciaexcepcion.controls['PersonaId'].setValue('');
          this.asistenciaexcepcion.controls['metodologia'].setValue('');

          this.notification.success('Grabación', 'Existosa')

        }
      })

  }

  endexception() {
    this.searchService.deleteAsistenciaExcepcion(this.asistenciaexcepcion.value)
      .pipe(
        switchMap(() => this.$listaExcepciones = this.searchService.getExcepxObjetivo(this.asistenciaexcepcion.controls['ObjetivoId'].value, this.asistenciaexcepcion.controls['anio'].value, this.asistenciaexcepcion.controls['mes'].value)),
        //      tap(() => this.$isObjetivoOptionsLoading.next(false))
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data) => console.log('data', data),
        error: (err) => {
          console.log('error', err)
        },
        complete: () => {
          console.log('complete')

          this.asistenciaexcepcion.controls['PersonaId'].setValue('');
          this.asistenciaexcepcion.controls['metodologia'].setValue('');

          this.notification.success('Finalización', 'Existosa')

        }
      })

  }

  ngOnDestroy(): void {
    this.destroy$.next('');
    this.destroy$.complete();
  }
}
