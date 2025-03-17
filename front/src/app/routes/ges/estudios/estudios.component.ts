import { Component, ViewChild, computed, inject, model, signal } from '@angular/core';
import { NgForm } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';
import { SettingsService } from '@delon/theme';
import { TableEstudiosComponent } from '../../../shared/table-estudios/table-estudios.component'
import { EstudiosDrawerComponent } from '../../../shared/estudios-drawer/estudios-drawer.component';
import { BehaviorSubject } from 'rxjs';


@Component({
  selector: 'app-estudios',
  templateUrl: './estudios.component.html',
  styleUrls: ['./estudios.component.less'],
  standalone: true,
  imports: [...SHARED_IMPORTS, CommonModule,TableEstudiosComponent, EstudiosDrawerComponent,]
})
export class EstudiosComponent {

  @ViewChild('estudiosForm', { static: true }) estudiosForm: NgForm = new NgForm([], []);
  

  
  PersonalId = signal<number>(0);
  PersonalEstudioId = signal<number>(0);
  visibleDrawer = signal<boolean>(false);
  disabled = signal<boolean>(false);
  tituloDrawer = signal<string>(''); 
  RefreshEstudio = signal<boolean>(false);

  ListEstudios$ = new BehaviorSubject('')

  constructor(private settingsService: SettingsService) {}

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

  openDrawerforEdit() {
    this.tituloDrawer.set('Editar Estudio');
    this.disabled.set(false);
    this.visibleDrawer.set(true);
  }

  openDrawerforConsult() {
    this.tituloDrawer.set('Consultar Estudio');
    this.disabled.set(true);
    this.visibleDrawer.set(true);
  }

  async handleAddOrUpdate(){
   console.log('aca')
   this.RefreshEstudio.set(true)
  }

  openDrawerforNew() {
    this.tituloDrawer.set('Nuevo Estudio');
    this.disabled.set(false);
    this.PersonalEstudioId.set(0);
    this.visibleDrawer.set(true);
  }


} 