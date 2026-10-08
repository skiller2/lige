import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { RegistroAsistenciaCargaComponent } from '../registro-asistencia-carga/registro-asistencia-carga';

@Component({
  selector: 'app-registro-asistencia',
  standalone: true,
  imports: [SHARED_IMPORTS, RegistroAsistenciaCargaComponent],
  templateUrl: './registro-asistencia.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistroAsistenciaComponent {

}
