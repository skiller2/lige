import { Routes } from '@angular/router';

export const GesRoutes: Routes = [
  {
    path: 'carga_asistencia',
    loadComponent: () => import('./carga-asistencia/carga-asistencia.component').then(c => c.CargaAsistenciaComponent),
  },
  {
    path: 'detalle_asistencia',
    redirectTo: 'detalle_asistencia/objetivo'
  },
  {
    path: 'detalle_asistencia/:tab',
    loadComponent: () => import('./detalle-asistencia/detalle-asistencia.component').then(c => c.DetalleAsistenciaComponent),
  },
  {
    path: 'pdf_retiro',
    loadComponent: () => import('./pdf-retiro/pdf-retiro.component').then(c => c.PdfRetiroComponent),
  },
  {
    path: 'impuesto_afip', redirectTo: 'impuesto_afip/listado'
  },
  {
    path: 'impuesto_afip/:tab',
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
  { path: 'adelanto', redirectTo: 'adelanto/listado' },
  {
    path: 'adelanto/:tab',
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
  {
    path: 'cambio_categoria',
    loadComponent: () => import('./categorias-cambio/categorias-cambio.component').then(c => c.CategoriasCambioComponent),
  },
  { path: 'objetivos_pendasis', redirectTo: 'objetivos_pendasis/pendientes' },
  {
    path: 'objetivos_pendasis/:tab',
    loadComponent: () => import('./objetivos-pendasis/objetivos-pendasis.component').then(c => c.ObjetivosPendAsisComponent),
  },

  { path: 'liquidaciones', redirectTo: 'liquidaciones/listado' },
  {
    path: 'liquidaciones/:tab',
    loadComponent: () => import('./liquidaciones/liquidaciones.component').then(c => c.LiquidacionesComponent),
  },
  { path: 'liquidacion_banco', redirectTo: 'liquidacion_banco/listado' },
  {
    path: 'liquidacion_banco/:tab',
    loadComponent: () => import('./liquidaciones-banco/liquidaciones-banco.component').then(c => c.LiquidacionesBancoComponent),
  },
  { path: 'liquidacion_ayuda_asistencial', redirectTo: 'liquidacion_ayuda_asistencial/listado' },
  {
    path: 'liquidacion_ayuda_asistencial/:tab',
    loadComponent: () => import('./ayuda-asistencial/ayuda-asistencial.component').then(c => c.AyudaAsistencialComponent),
  },
  { path: 'telefonia', redirectTo: 'telefonia/listado' },
  {
    path: 'telefonia/:tab',
    loadComponent: () => import('./telefonia/telefonia.component').then(c => c.TelefoniaComponent),
  },
  {
    path: 'tipo_documento',
    loadComponent: () => import('./tipo-documento/tipo-documento.component').then(c => c.TipoDocumentoComponent),
  },
  { path: 'personal_objetivo', redirectTo: 'personal_objetivo/persona' },
  {
    path: 'personal_objetivo/:tab',
    loadComponent: () => import('./personal-objetivo/personal-objetivo.component').then(c => c.PersonalObjetivoComponnet),
  },
  
  { path: 'cust', redirectTo: 'cust/objetivos' },
  {
    path: 'cust/:tab',
    loadComponent: () => import('./custodias/custodias.component').then(c => c.CustodiaComponent),
  },
  { path: 'carga_licencias', redirectTo: 'carga_licencias/Licencias' },
  {
    path: 'carga_licencias/:tab',
    loadComponent: () => import('./carga-licencias/carga-licencias.component').then(c => c.CargaLicenciasComponent),
  },
];
