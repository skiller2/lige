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
  { path: 'cambio_categoria', redirectTo: 'cambio_categoria/pendientes' },
  {
    path: 'cambio_categoria/:tab',
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
  { path: 'ayuda_asistencial', redirectTo: 'ayuda_asistencial/listado' },
  {
    path: 'ayuda_asistencial/:tab',
    loadComponent: () => import('./ayuda-asistencial/ayuda-asistencial.component').then(c => c.AyudaAsistencialComponent),
  },
  { path: 'telefonia', redirectTo: 'telefonia/listado' },
  {
    path: 'telefonia/:tab',
    loadComponent: () => import('./telefonia/telefonia.component').then(c => c.TelefoniaComponent),
  },
  { path: 'documento', redirectTo: 'documento/list' },
  {
    path: 'documento/:tab',
    loadComponent: () => import('./documento/documento.component').then(c => c.DocumentoComponent),
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
   
  { path: 'clientes', redirectTo: 'clientes/listado' },
  {
    path: 'clientes/:tab',
    loadComponent: () => import('./clientes/clientes.component').then(c => c.ClientesComponent),
  },
  { path: 'objetivos', redirectTo: 'objetivos/listado' },
  {
    path: 'objetivos/:tab',
    loadComponent: () => import('./objetivos/objetivos.component').then(c => c.ObjetivosComponent),
  },
  { path: 'personal', redirectTo: 'personal/listado' },
  {
    path: 'personal/:tab',
    loadComponent: () => import('./personal/personal.component').then(c => c.PersonalComponent),
  },
  { path: 'acceso-bot', redirectTo: 'acceso-bot/listado' },
  {
    path: 'acceso-bot/:tab',
    loadComponent: () => import('./acceso-bot/acceso-bot.component').then(c => c.AccesoBotComponent),
  },
  { path: 'novedades', redirectTo: 'novedades/listado' },
  {
    path: 'novedades/:tab',
    loadComponent: () => import('./novedades/novedades').then(c => c.NovedadesComponent), 
  },
  { path: 'grupo-actividad', redirectTo: 'grupo-actividad/grupos' },
  {
    path: 'grupo-actividad/:tab',
    loadComponent: () => import('./grupo-actividad/grupo-actividad.component').then(c => c.GrupoActividadComponent),
  },
  {
    path: 'seguro', redirectTo: 'seguro/listado'
  },
  {
    path: 'seguro/:tab',
    loadComponent: () => import('./seguro/seguro.component').then(c => c.SeguroComponent),
  },
  {
    path: 'estudios', redirectTo: 'estudios/estudios'
  },
  {
    path: 'estudios/:tab',
    loadComponent: () => import('./estudios/estudios.component').then(c => c.EstudiosComponent),
  },
  {
    path: 'actas', redirectTo: 'actas/listado'
  },
  {
    path: 'actas/:tab',
    loadComponent: () => import('./actas/actas.component').then(c => c.ActasComponent),
  },

  { path: 'administradores-listado', redirectTo: 'administradores-listado/listado' },
  {
    path: 'administradores-listado/:tab',
    loadComponent: () => import('./administradores-listado/administradores-listado').then(c => c.AdministradoresListadoComponent),
  },
  { path: 'importe-venta-vigilancia', redirectTo: 'importe-venta-vigilancia/listado' },
  {
    path: 'importe-venta-vigilancia/:tab',
    loadComponent: () => import('./importe-venta-vigilancia/importe-venta-vigilancia').then(c => c.ImporteVentaVigilanciaComponent),
  },
  { path: 'parametros-venta', redirectTo: 'parametros-venta/listado' },
  {
    path: 'parametros-venta/:tab',
    loadComponent: () => import('./parametro-venta/parametro-venta.component').then(c => c.ParametroVentaComponent),
  },
  { path: 'facturacion', redirectTo: 'facturacion/listado' },
  {
    path: 'facturacion/:tab',
    loadComponent: () => import('./facturacion/facturacion').then(c => c.FacturacionComponent),
  },
  {
    path: 'procesos-automaticos', redirectTo: 'procesos-automaticos/listado'
  },
  {
    path: 'procesos-automaticos/:tab',
    loadComponent: () => import('./procesos-automaticos/procesos-automaticos').then(c => c.ProcesosAutomaticosComponent),
  },
  {
    path: 'excepciones-asistencia', redirectTo: 'excepciones-asistencia/listado'
  },
  {
    path: 'excepciones-asistencia/:tab',
    loadComponent: () => import('./excepciones-asistencia/excepciones-asistencia').then(c => c.ExcepcionesAsistenciaComponent),
  },
  { path: 'efecto', redirectTo: 'efecto/personal' },
  {
    path: 'efecto/:tab',
    loadComponent: () => import('./efecto/efecto.component').then(c => c.EfectoComponent),
  },
  {
    path: 'habilitaciones', redirectTo: 'habilitaciones/listado'
  },
  {
    path: 'habilitaciones/:tab',
    loadComponent: () => import('./habilitaciones/habilitaciones').then(c => c.HabilitacionesComponent),
  },
  
];
