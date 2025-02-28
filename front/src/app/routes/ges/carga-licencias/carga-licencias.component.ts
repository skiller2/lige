import { Component, SimpleChanges, ViewChild, computed, input, model, signal } from '@angular/core';
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
import { LicenciaHistorialDrawerComponent } from '../../../shared/licencia-historial-drawer/licencia-historial-drawer.component'
import { AngularGridInstance } from 'angular-slickgrid';



@Component({
    selector: 'app-carga-licencias',
    imports: [SHARED_IMPORTS, CommonModule, TableHorasLicenciaComponent, TableAbmLicenciaComponent, LicenciaDrawerComponent, LicenciaHistorialDrawerComponent],
    templateUrl: './carga-licencias.component.html',
    styleUrl: './carga-licencias.component.less'
})
export class CargaLicenciasComponent {
  tabIndex = 0
  periodo = model(new Date())
  visibleDrawer: boolean = false
  visibleHistorial = model<boolean>(false)
  PersonalId = model(0)
  PersonalLicenciaId = 0
  tituloDrawer = ""
  openDrawerForConsult = false
  inputForConsult = true
  RefreshLicencia = false;

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
    this.PersonalId.set(event[0].PersonalId)
    this.PersonalLicenciaId = event[0].PersonalLicenciaId
  }

  openDrawerforNew(): void {
    this.PersonalLicenciaId = 0
    this.PersonalId.set(0)

    this.tituloDrawer = "Nueva Licencia"
    this.openDrawerForConsult = false
    this.RefreshLicencia = false
    this.visibleDrawer = true  
    this.visibleHistorial.set(false)  
  }
  openDrawerforEdit(): void {

    this.tituloDrawer = "Editar Licencia"
    this.openDrawerForConsult = false
    this.RefreshLicencia = false
    this.visibleDrawer = true    
    this.visibleHistorial.set(false)

  }

  openDrawerforConsult(): void{

    this.tituloDrawer = "Consulta Licencia"
    this.openDrawerForConsult = true
    this.visibleDrawer = true    
    this.visibleHistorial.set(false)
  }

  openDrawerforConsultHistory(): void{

    //this.tituloDrawer = ""
    // this.openDrawerForConsult = false
    // this.visibleDrawer = false 
    this.visibleHistorial.set(true)
    
       
  }

  inputConsult(value:boolean){
    this.inputForConsult = value
  }
  
}
