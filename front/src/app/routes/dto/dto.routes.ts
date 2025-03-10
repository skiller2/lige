import { Routes } from '@angular/router';

export const DtoRoutes: Routes = [

  { path: 'descuentos', redirectTo: 'descuentos/personal' },
  {
    path: 'descuentos/:tab',
    loadComponent: () => import('./descuentos/descuentos.component').then(c => c.DescuentosComponent),
  },
];