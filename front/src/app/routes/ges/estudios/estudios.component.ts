import { Component, ViewChild, inject, signal } from '@angular/core';
import { NgForm } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';
import { SettingsService } from '@delon/theme';
import { TableEstudiosComponent } from '../../../shared/table-estudios/table-estudios.component'
import { EstudiosDrawerComponent } from '../../../shared/estudios-drawer/estudios-drawer.component';

@Component({
  selector: 'app-estudios',
  templateUrl: './estudios.component.html',
  styleUrls: ['./estudios.component.less'],
  standalone: true,
  imports: [...SHARED_IMPORTS, CommonModule,TableEstudiosComponent, EstudiosDrawerComponent]
})
export class EstudiosComponent {

  @ViewChild('estudiosForm', { static: true }) estudiosForm: NgForm = new NgForm([], []);
  
  periodo: any;
  PersonalId = signal(0);
  PersonalEstudioId = 0;
  visibleDrawer = false;
  visibleHistorial = false;
  openDrawerForConsult = false;
  tituloDrawer = '';
  RefreshEstudio = false;

  selectedPeriod = signal({ year: 0, month: 0 });

  constructor(private settingsService: SettingsService) {}

  ngOnInit() {
    const now = new Date();
    setTimeout(() => {
      const anio = Number(localStorage.getItem('anio')) > 0 
        ? Number(localStorage.getItem('anio')) 
        : now.getFullYear();
      const mes = Number(localStorage.getItem('mes')) > 0
        ? Number(localStorage.getItem('mes'))
        : now.getMonth() + 1;

      this.estudiosForm.form.get('periodo')?.setValue(new Date(anio, mes - 1, 1));
    }, 1);
    this.settingsService.setLayout('collapsed', true);
  }

  actualizarValorDrawer(event: any) {
    if (event.length > 0) {
      this.PersonalId.set(event[0].PersonalId);
      this.PersonalEstudioId = event[0].PersonalEstudioId;
    }
  }

  openDrawerforEdit() {
    this.tituloDrawer = 'Editar Estudio';
    this.openDrawerForConsult = false;
    this.visibleDrawer = true;
  }

  openDrawerforConsult() {
    this.tituloDrawer = 'Consultar Estudio';
    this.openDrawerForConsult = true;
    this.visibleDrawer = true;
  }

  openDrawerforNew() {
    this.tituloDrawer = 'Nuevo Estudio';
    this.openDrawerForConsult = false;
    this.PersonalEstudioId = 0;
    this.visibleDrawer = true;
  }

  openDrawerforConsultHistory() {
    this.visibleHistorial = true;
  }

  deleteEstudio() {
    // Implementar lógica de borrado
  }
} 