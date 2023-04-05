import { Component, OnInit } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { BehaviorSubject, catchError, debounceTime, switchMap, tap } from 'rxjs';
import { SearchService } from '../search.service';

enum Busqueda {
  Sucursal,
  Objetivo,
  Personal
}

@Component({
  selector: 'app-ges-asistenciaexcepcion',
  templateUrl: './asistenciaexcepcion.component.html',
  styles: [
    `
      .card-inline-block {
        display: inline-block;
      }
      .card-container {
        display: block;
      }

      .limit-card-columns{
        max-width: 21cm;
      }
      nz-select {
        width: 200px;
      }
    `
  ]
})


export class ExcepcionAsistenciaComponent {

  public get Busqueda() { return Busqueda }

  constructor(private searchService: SearchService) { }

  $optionsMetodologia = this.searchService.getMetodologia()

  selectedSucursalId = ''
  selectedObjetivoId = ''
  selectedPersonalId = ''
  selectedMetodologiaId = ''

  $isSucursalOptionsLoading = new BehaviorSubject(false)
  $isObjetivoOptionsLoading = new BehaviorSubject(false)
  $isPersonalOptionsLoading = new BehaviorSubject(false)

  $selectedSucursalIdChange = new BehaviorSubject('')
  $selectedObjetivoIdChange = new BehaviorSubject('')
  $selectedPersonalIdChange = new BehaviorSubject('')

  $searchObjetivoChange = new BehaviorSubject('')
  $searchPersonalChange = new BehaviorSubject('')

  $optionsSucursales = this.searchService.getSucursales()
  $optionsObjetivos = this.$searchObjetivoChange
    .pipe(debounceTime(500))
    .pipe(
      switchMap((event) => this.searchService.getObjetivos((Number(event.charAt(0)) ? 'Codigo' : 'Descripcion'), event, this.selectedSucursalId))
    )
    .pipe(
      tap(() => this.$isObjetivoOptionsLoading.next(false))
    )

  $optionsPersonal = this.$searchPersonalChange.pipe(debounceTime(500))
    .pipe(
      switchMap((values) => this.searchService.getPersonFromName((Number(values)) ? 'CUIT' : 'Nombre', values))
    )
    .pipe(
      tap(() => this.$isPersonalOptionsLoading.next(false))
    )

  $isSucursalDataLoading = new BehaviorSubject(false)
  $isObjetivoDataLoading = new BehaviorSubject(false)
  $isPersonalDataLoading = new BehaviorSubject(false)

  selectedValueChange(event: string, busqueda: Busqueda): void {
    switch (busqueda) {
      case (Busqueda.Sucursal):
        this.$selectedSucursalIdChange.next(event)
        this.$isSucursalDataLoading.next(true)
        return
      case (Busqueda.Objetivo):
        this.$selectedObjetivoIdChange.next(event)
        this.$isObjetivoDataLoading.next(true)
        return
      case (Busqueda.Personal):
        this.$selectedPersonalIdChange.next(event)
        this.$isPersonalDataLoading.next(true)
        return
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

}
