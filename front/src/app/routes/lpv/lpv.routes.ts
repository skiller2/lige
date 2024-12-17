import { Routes } from '@angular/router';

export const LpvRoutes: Routes = [

  { path: 'precios_productos', redirectTo: 'precios_productos/precios' },
  {
    path: 'precios_productos/:tab',
    loadComponent: () => import('./precios-productos/precios-productos.component').then(c => c.PreciosProductosComponent),
  },
];
