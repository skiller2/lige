import { ChangeDetectionStrategy, Component, input } from '@angular/core';
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
  // Enlace de verificación facial del agente de asistencia (matrix param ;encTelNro=..., como
  // init/ident). El input binding del router solo llega a este componente: se le pasa a la carga.
  encTelNro = input('')
}
