import { Component, ViewChild, computed, inject, model, signal, ChangeDetectionStrategy, viewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router'; 
import { NgForm } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';

import { SettingsService } from '@delon/theme';
import { TableEstudiosComponent } from '../table-estudios/table-estudios.component'
import { EstudiosDrawerComponent } from '../estudios-drawer/estudios-drawer.component';
// import { BehaviorSubject, filter } from 'rxjs';
import { TableCursoComponent } from '../table-curso/table-curso.component'
import { CursoHistorialDrawerComponent } from '../curso-historial-drawer/curso-historial-drawer.component'
import { CursosDrawerComponent } from '../../../shared/cursos-drawer/cursos-drawer.component'
import { TableInstitucionesComponent } from "../table-instituciones/table-instituciones.component";
import { InstitucionesDrawerComponent } from '../../../routes/ges/instituciones-drawer/instituciones-drawer.component';
import { SedesDrawerComponent } from '../../../shared/sedes-drawer/sedes-drawer.component';

// icons
import { NzIconModule, provideNzIconsPatch } from 'ng-zorro-antd/icon';
import {EnvironmentOutline} from '@ant-design/icons-angular/icons';


@Component({
  selector: 'app-estudios',
  templateUrl: './estudios.component.html',
  styleUrls: ['./estudios.component.less'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...SHARED_IMPORTS, NzIconModule, TableEstudiosComponent, EstudiosDrawerComponent, TableCursoComponent, CursoHistorialDrawerComponent, CursosDrawerComponent, TableInstitucionesComponent, InstitucionesDrawerComponent, SedesDrawerComponent],
    providers: [provideNzIconsPatch([EnvironmentOutline])],
})
export class EstudiosComponent {

  @ViewChild('estudiosForm', { static: true }) estudiosForm: NgForm = new NgForm([], []);
  
  tabIndex = signal<number>(0)
  disabled = signal<boolean>(false);
  PersonalId = model<number>(0);
  PersonalEstudioId = model<number>(0);
  visibleDrawer = signal<boolean>(false);
  visibleHistorial = signal<boolean>(false);
  //curso historial
  visibleDrawerCurso = signal<boolean>(false);
  CursoHabilitacionSelectedId = signal<number>(0);
  CentroCapacitacionSedeId = signal<number>(0);
  CursoHabilitacionDescripcion = signal<string>('');
  visibleDrawerInstituciones = signal<boolean>(false);
  //instituciones
  CentroCapacitacionId = signal<number>(0);
  visibleDrawerSedes = signal<boolean>(false);
  CentroCapacitacionName = signal<string>('');

  constructor(private settingsService: SettingsService,private router: Router) {}

  childEstTable = viewChild.required<TableEstudiosComponent>('estudiosTable')
  childCurTable = viewChild.required<TableCursoComponent>('cursoTable')
  childInsTable = viewChild.required<TableInstitucionesComponent>('institucionesTable')

  ngOnInit() {
    this.settingsService.setLayout('collapsed', true);
  }

  openDrawerforConsultHistory(): void{
    this.visibleHistorial.set(true)
  }

  actualizarValorDrawerCurso(row: any | null) {
    this.visibleDrawerCurso.set(false);
    if (row) {
      this.CursoHabilitacionSelectedId.set(row.CursoHabilitacionId);
      this.CentroCapacitacionSedeId.set(row.CentroCapacitacionSedeId);
      this.CursoHabilitacionDescripcion.set(row.CursoHabilitacionDescripcion);
    } else {
      this.CursoHabilitacionSelectedId.set(0);
      this.CentroCapacitacionSedeId.set(0);
      this.CursoHabilitacionDescripcion.set('');
    }
  }

  actualizarValorDrawerInstitucion(row: any | null) {
    this.visibleDrawerInstituciones.set(false);
    if (row) {
      this.CentroCapacitacionId.set(row.CentroCapacitacionId);
      this.CentroCapacitacionName.set(row.CentroCapacitacionRazonSocial);
    } else {
      this.CentroCapacitacionId.set(0);
      this.CentroCapacitacionName.set('');
    }
  }

  openDrawerforEdit() {
    this.disabled.set(false);
    this.visibleDrawer.set(true);
  }


  openDrawerforConsult() {
    this.disabled.set(true);
    this.visibleDrawer.set(true);
  }


  openDrawerforNew() {
   
    this.disabled.set(false);
    this.PersonalEstudioId.set(0);
    this.visibleDrawer.set(true);
  }

  ////// Cursos

  openDrawerCursoforNew() {
   
    this.disabled.set(false);
    this.CursoHabilitacionSelectedId.set(0);
    this.visibleDrawerCurso.set(true);
  }

  openDrawerCursoforConsult() {
    this.disabled.set(true);
    this.visibleDrawerCurso.set(true);
  }

  
  openDrawerCursoforEdit() {
    this.disabled.set(false);
    this.visibleDrawerCurso.set(true);
  }


  ////// Instituciones

  openDrawerInstitucionesforNew() {
   
    this.disabled.set(false);
    this.CentroCapacitacionId.set(0);
    this.visibleDrawerInstituciones.set(true);
  }

  openDrawerInstitucionesforSede() {
   
    this.disabled.set(false);
    this.visibleDrawerSedes.set(true);
  }

  openDrawerInstitucionesforConsult() {
    this.disabled.set(true);
    this.visibleDrawerInstituciones.set(true);
  }
  
  openDrawerInstitucionesforEdit() {
    this.disabled.set(false);
    this.visibleDrawerInstituciones.set(true);
  }
  
  refreshGrid(){
    switch (this.tabIndex()) {
      case 1:
        this.childEstTable().gridData.reload()
        break;
      case 2:
        this.childCurTable().gridData.reload()
        break;
      case 3:
        this.childInsTable().gridData.reload()
        break;
    
      default:
        break;
    }
  }

  onTabsetChange(_event: any){
    switch (_event.index) {
      case 1:
        this.childEstTable().gridData.reload()
        break;
      case 2:
        this.childCurTable().gridData.reload()
        break;
      case 3:
        this.childInsTable().gridData.reload()
        break;
    
      default:
        break;
    }
  }


} 