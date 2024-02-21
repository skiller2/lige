import { Routes } from '@angular/router';

export const ConfigRoutes: Routes = [
  {
    path: 'mess',
    loadComponent: () => import('./mess/mess.component').then(c => c.MessComponent),
  },
 
];
