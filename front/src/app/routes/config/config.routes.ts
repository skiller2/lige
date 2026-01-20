import { Routes } from '@angular/router';

export const ConfigRoutes: Routes = [
  {
    path: 'mess',
    loadComponent: () => import('./mess/mess.component').then(c => c.MessComponent),
  },
  {
    path: 'recibo',
    loadComponent: () => import('./recibo/recibo.component').then(c => c.ReciboComponent),
  },
  {
    path: 'novedad',
    loadComponent: () => import('./novedad/novedad').then(c => c.NovedadComponent),
  },
  {
    path: 'sueldo-minimo-vital-movil',
    loadComponent: () => import('./sueldo-minimo-vital-movil/sueldo-minimo-vital-movil').then(c => c.SueldoMinimoVitalMovil),
  },
 
];
