import { Component, ViewChild, computed, inject, model, signal, ChangeDetectionStrategy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router'; 
import { NgForm } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';
import { SettingsService } from '@delon/theme';
import { TableEstudiosComponent } from '../table-estudios/table-estudios.component'
import { EstudiosDrawerComponent } from '../estudios-drawer/estudios-drawer.component';
import { BehaviorSubject, filter } from 'rxjs';
import { TableCursoComponent } from '../table-curso/table-curso.component'
import { CursoHistorialDrawerComponent } from '../curso-historial-drawer/curso-historial-drawer.component'
import { CursosDrawerComponent } from '../../../shared/cursos-drawer/cursos-drawer.component'
import { TableInstitucionesComponent } from "../table-instituciones/table-instituciones.component";
import { InstitucionesDrawerComponent } from 'src/app/routes/ges/instituciones-drawer/instituciones-drawer.component';
import { SedesDrawerComponent } from 'src/app/shared/sedes-drawer/sedes-drawer.component';

// icons
import { NzIconModule, provideNzIconsPatch } from 'ng-zorro-antd/icon';
import {EnvironmentOutline} from '@ant-design/icons-angular/icons';


@Component({
  selector: 'app-estudios',
  templateUrl: './estudios.component.html',
  styleUrls: ['./estudios.component.less'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...SHARED_IMPORTS, CommonModule, NzIconModule, TableEstudiosComponent, EstudiosDrawerComponent, 
    TableCursoComponent, CursoHistorialDrawerComponent, CursosDrawerComponent, TableInstitucionesComponent, 
    InstitucionesDrawerComponent, SedesDrawerComponent],
    providers: [provideNzIconsPatch([EnvironmentOutline])],
})
export class EstudiosComponent {

  @ViewChild('estudiosForm', { static: true }) estudiosForm: NgForm = new NgForm([], []);
  

  
  PersonalId = signal<number>(0);
  PersonalEstudioId = signal<number>(0);
  visibleDrawer = signal<boolean>(false);
  disabled = signal<boolean>(false);
  RefreshEstudio = signal<boolean>(false);
  RefreshCurso = signal<boolean>(false);
  RefreshInstituciones = signal<boolean>(false);
  ListEstudios$ = new BehaviorSubject('');
  selectedTab = signal<string>('estudios');
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

  ngOnInit() {
  
  this.settingsService.setLayout('collapsed', true);
  }



  actualizarValorDrawer(event: any) {
    console.log('event', event)
    this.visibleDrawer.set(false);
    if (event.length > 0) {
      this.PersonalId.set(event[0].PersonalId);
      this.PersonalEstudioId.set(event[0].PersonalEstudioId);
    }
  }

  openDrawerforConsultHistory(): void{


    this.visibleHistorial.set(true)
    
       
  }

  actualizarValorDrawerCurso(event: any) {
    this.visibleDrawerCurso.set(false);
    if (event.length > 0) {
      this.CursoHabilitacionSelectedId.set(event[0].CursoHabilitacionId);
      this.CentroCapacitacionSedeId.set(event[0].CentroCapacitacionSedeId);
      this.CursoHabilitacionDescripcion.set(event[0].CursoHabilitacionDescripcion);
    }
  }

  actualizarValorDrawerInstitucion(event: any) {
    this.visibleDrawerInstituciones.set(false);
    if (event.length > 0) {
      this.CentroCapacitacionId.set(event[0].CentroCapacitacionId);
      this.CentroCapacitacionName.set(event[0].CentroCapacitacionRazonSocial);
    }
  }

  openDrawerforEdit() {
   
    this.disabled.set(false);
    this.visibleDrawer.set(true);
    this.RefreshEstudio.set(false)
  }


  openDrawerforConsult() {
   
    this.disabled.set(true);
    this.visibleDrawer.set(true);
    this.RefreshEstudio.set(false)
  }


  openDrawerforNew() {
   
    this.disabled.set(false);
    this.PersonalEstudioId.set(0);
    this.visibleDrawer.set(true);
    this.RefreshEstudio.set(false)
  }


  ////// Cursos

  openDrawerCursoforNew() {
   
    this.disabled.set(false);
    this.CursoHabilitacionSelectedId.set(0);
    this.visibleDrawerCurso.set(true);
    this.RefreshCurso.set(false)
  }

  openDrawerCursoforConsult() {
   
    this.disabled.set(true);
    this.visibleDrawerCurso.set(true);
    this.RefreshCurso.set(false)
  }

  
  openDrawerCursoforEdit() {
   
    this.disabled.set(false);
    this.visibleDrawerCurso.set(true);
    this.RefreshCurso.set(false)
  }


  ////// Instituciones

  openDrawerInstitucionesforNew() {
   
    this.disabled.set(false);
    this.CentroCapacitacionId.set(0);
    this.visibleDrawerInstituciones.set(true);
    this.RefreshInstituciones.set(false)
  }

  openDrawerInstitucionesforSede() {
   
    this.disabled.set(false);
    this.visibleDrawerSedes.set(true);
    this.RefreshInstituciones.set(false)
  }

  openDrawerInstitucionesforConsult() {
   
    this.disabled.set(true);
    this.visibleDrawerInstituciones.set(true);
    this.RefreshInstituciones.set(false)
  }
  
  openDrawerInstitucionesforEdit() {
   
    this.disabled.set(false);
    this.visibleDrawerInstituciones.set(true);
    this.RefreshInstituciones.set(false)
  }


} 