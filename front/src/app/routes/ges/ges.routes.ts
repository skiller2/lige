import { Routes } from '@angular/router';

export const GesRoutes: Routes = [
  {
    path: 'detalle_asistencia',
    loadComponent: () => import('./detalle-asistencia/detalle-asistencia.component').then(c => c.DetalleAsistenciaComponent),
  },
  {
    path: 'pdf_retiro',
    loadComponent: () => import('./pdf-retiro/pdf-retiro.component').then(c => c.PdfRetiroComponent),
  },
  {
    path: 'impuesto_afip',
    loadComponent: () => import('./impuesto-afip/impuesto-afip.component').then(c => c.ImpuestoAfipComponent),
  },
  {
    path: 'credencial_personal',
    loadComponent: () => import('./credencial-personal/credencial-personal.component').then(c => c.CredencialPersonalComponent),
  },
  {
    path: 'credencial_lista',
    loadComponent: () => import('./credencial-lista/credencial-lista.component').then(c => c.CredencialListaComponent),
  },
  {
    path: 'adelanto',
    loadComponent: () => import('./adelanto/adelanto.component').then(c => c.AdelantoComponent),
  },
  {
    path: 'asistencia_excepcion',
    loadComponent: () => import('./asisexcept/asistenciaexcepcion.component').then(c => c.ExcepcionAsistenciaComponent),
  },
  {
    path: 'asistencia_excepcion/:SucursalId/:ObjetivoId',
    loadComponent: () => import('./asisexcept/asistenciaexcepcion.component').then(c => c.ExcepcionAsistenciaComponent),
  },
];
