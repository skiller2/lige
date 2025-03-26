import { Component, ViewChild, computed, inject, model, signal } from '@angular/core';
import { Router } from '@angular/router'; 
import { NgForm } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';
import { SettingsService } from '@delon/theme';
import { TableEstudiosComponent } from '../../../shared/table-estudios/table-estudios.component'
import { EstudiosDrawerComponent } from '../../../shared/estudios-drawer/estudios-drawer.component';
import { BehaviorSubject } from 'rxjs';
import { TableCursoComponent } from '../../../shared/table-curso/table-curso.component'
import { CursoHistorialDrawerComponent } from '../../../shared/curso-historial-drawer/curso-historial-drawer.component'
import { CursosDrawerComponent } from '../../../shared/cursos-drawer/cursos-drawer.component'

@Component({
  selector: 'app-estudios',
  templateUrl: './estudios.component.html',
  styleUrls: ['./estudios.component.less'],
  standalone: true,
  imports: [...SHARED_IMPORTS, CommonModule,TableEstudiosComponent, EstudiosDrawerComponent,TableCursoComponent,CursoHistorialDrawerComponent,CursosDrawerComponent]
})
export class EstudiosComponent {

  @ViewChild('estudiosForm', { static: true }) estudiosForm: NgForm = new NgForm([], []);
  

  
  PersonalId = signal<number>(0);
  PersonalEstudioId = signal<number>(0);
  visibleDrawer = signal<boolean>(false);
  disabled = signal<boolean>(false);
  RefreshEstudio = signal<boolean>(false);
  RefreshCurso = signal<boolean>(false);
  ListEstudios$ = new BehaviorSubject('');
  selectedTab = signal<string>('estudios');
  visibleHistorial = signal<boolean>(false);
  //curso historial
  visibleDrawerCurso = signal<boolean>(false);
  CursoHabilitacionSelectedId = signal<number>(0);
  CentroCapacitacionSedeId = signal<number>(0);
  CursoHabilitacionDescripcion = signal<string>('');

  constructor(private settingsService: SettingsService,private router: Router) {}

  ngOnInit() {
  
    this.settingsService.setLayout('collapsed', true);

    if (!this.router.url.includes('/cursos')) {
      this.router.navigate(['/ges/estudios/estudios']); 
    }
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
    this.visibleDrawer.set(false);
    if (event.length > 0) {
      this.CursoHabilitacionSelectedId.set(event[0].CursoHabilitacionId);
      this.CentroCapacitacionSedeId.set(event[0].CentroCapacitacionSedeId);
      this.CursoHabilitacionDescripcion.set(event[0].CursoHabilitacionDescripcion);
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


} 