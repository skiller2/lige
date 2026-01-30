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
    path: 'salario-minimo-vital-movil',
    loadComponent: () => import('./salario-minimo-vital-movil/salario-minimo-vital-movil').then(c => c.SalarioMinimoVitalMovil),
  },
 
];
