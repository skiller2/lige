import { Component, ViewChild, computed, input, model } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TableAbmLicenciaComponent } from '../../../shared/table-abm-licencia/table-abm-licencia.component'
import { TableHorasLicenciaComponent } from '../../../shared/table-horas-licencia/table-horas-licencia.component'

import {
  BehaviorSubject,
} from 'rxjs';
import { NgForm } from '@angular/forms';
import { LicenciaDrawerComponent } from '../../../shared/licencia-drawer/licencia-drawer.component'
import { AngularGridInstance } from 'angular-slickgrid';



@Component({
  selector: 'app-carga-licencias',
  standalone: true,
  imports: [SHARED_IMPORTS, CommonModule, TableHorasLicenciaComponent,TableAbmLicenciaComponent, LicenciaDrawerComponent],
  templateUrl: './carga-licencias.component.html',
  styleUrl: './carga-licencias.component.less'
})
export class CargaLicenciasComponent {
  tabIndex = 0
  periodo = model(new Date())
  visibleDrawer: boolean = false
  PersonalId = 0
  PersonalLicenciaId = 0
  tituloDrawer = ""
  openDrawerForConsult = false
  inputForConsult = true 

  selectedPeriod = computed(() => {
    const per = this.periodo()
    if (per) {
      localStorage.setItem('anio', String(per.getFullYear()));
      localStorage.setItem('mes', String(per.getMonth() + 1));
      return { year: per.getFullYear(), month: per.getMonth() + 1 }
    } else
      return { year: 0, month: 0 }
  })


  ngAfterViewInit(): void {
    const now = new Date(); //date

    const anio =
      Number(localStorage.getItem('anio')) > 0
        ? Number(localStorage.getItem('anio'))
        : now.getFullYear();
    const mes =
      Number(localStorage.getItem('mes')) > 0
        ? Number(localStorage.getItem('mes'))
        : now.getMonth() + 1;

    this.periodo.set(new Date(anio, mes - 1, 1))
  }


  actualizarValorDrawer(event: any) {
    this.PersonalId = event[0].PersonalId
    this.PersonalLicenciaId = event[0].PersonalLicenciaId
  }

  openDrawerforNew(): void {
    this.PersonalLicenciaId = 0
    this.visibleDrawer = true
    this.tituloDrawer = "Nueva Licencia"
    this.openDrawerForConsult = false
  }
  openDrawerforEdit(): void {
    this.visibleDrawer = true
    this.tituloDrawer = "Editar Licencia"
    this.openDrawerForConsult = false
  }

  openDrawerforConsult(): void{
    this.visibleDrawer = true
    this.tituloDrawer = "Consulta Licencia"
    this.openDrawerForConsult = true
  }

  inputConsult(value:boolean){
    this.inputForConsult = value
  }
  
}
