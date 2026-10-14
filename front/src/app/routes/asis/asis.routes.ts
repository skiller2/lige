import { Routes } from '@angular/router';

export const AsisRoutes: Routes = [
  {
    path: 'registro-asistencia',
    loadComponent: () => import('./registro-asistencia/registro-asistencia').then(c => c.RegistroAsistenciaComponent),
  },
];
