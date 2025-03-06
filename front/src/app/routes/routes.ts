import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { startPageGuard } from '@core';
import { PreloadOptionalModules } from '@delon/theme';
import { environment } from '@env/environment';

// layout
import { LayoutBasicComponent } from '../layout/basic/basic.component';
import { LayoutBlankComponent } from '../layout/blank/blank.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutBasicComponent,
    canActivate: [startPageGuard, ],
    canActivateChild: [],
    data: {},
    children: [
      { path: '', redirectTo: 'init', pathMatch: 'full' },
      {
        path: 'init',
        loadChildren: () => import('./init/routes').then(m => m.routes),
        data: { preload: true },
      },
      {
        path: 'widgets',
        loadChildren: () => import('./widgets/widgets.module').then(m => m.WidgetsModule),
      },
//      { path: 'style', loadChildren: () => import('./style/style.module').then(m => m.StyleModule) },
//      { path: 'delon', loadChildren: () => import('./delon/delon.module').then(m => m.DelonModule) },
//      { path: 'extras', loadChildren: () => import('./extras/extras.module').then(m => m.ExtrasModule) },
//      { path: 'pro', loadChildren: () => import('./pro/pro.module').then(m => m.ProModule) },
//      { path: 'sys', loadChildren: () => import('./sys/sys.module').then(m => m.SysModule) },
      { path: 'test', loadChildren: () => import('./test/routes').then(m => m.routes) },
      { path: 'ges', loadChildren: () => import('./ges/ges.routes').then(r => r.GesRoutes) },
      { path: 'lpv', loadChildren: () => import('./lpv/lpv.routes').then(r => r.LpvRoutes) },
      { path: 'config', loadChildren: () => import('./config/config.routes').then(c => c.ConfigRoutes) },
      { path: 'dte', loadChildren: () => import('./dte/dte.routes').then(c => c.DteRoutes) },
      // { path: 'ges', loadChildren: () => import('./ges/ges.module').then(m => m.GesModule) },
    ],
  },
  // Blak Layout 空白布局
  {
    path: 'data-v',
    component: LayoutBlankComponent,
    children: [{ path: '', loadChildren: () => import('./data-v/data-v.module').then(m => m.DataVModule) }],
  },
  // passport
  { path: '', loadChildren: () => import('./passport/routes').then(m => m.routes), data: { preload: true } },
  { path: 'exception', loadChildren: () => import('./exception/exception.module').then(m => m.ExceptionModule) },
  { path: '**', redirectTo: 'exception/404' },
];

@NgModule({
  providers: [PreloadOptionalModules],
  imports: [
    RouterModule.forRoot(routes, {
      useHash: environment.useHash,
      // NOTICE: If you use `reuse-tab` component and turn on keepingScroll you can set to `disabled`
      // Pls refer to https://ng-alain.com/components/reuse-tab
      scrollPositionRestoration: 'top',
      preloadingStrategy: PreloadOptionalModules,
    }),
  ],
  exports: [RouterModule],
})
export class RouteRoutingModule {}
