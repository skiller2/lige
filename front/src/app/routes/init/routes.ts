import { Routes } from '@angular/router';

//import { DashboardAnalysisComponent } from './analysis/analysis.component';
//import { DashboardMonitorComponent } from './monitor/monitor.component';
//import { DashboardV1Component } from './v1/v1.component';
//import { DashboardWorkplaceComponent } from './workplace/workplace.component';
import { InitV1Component } from './v1/v1.component';
import { IdentComponent } from './ident/ident.component';

export const routes: Routes = [
  { path: '', redirectTo: 'v1', pathMatch: 'full' },
  { path: 'v1', component: InitV1Component },
  { path: 'ident', component: IdentComponent },
//  { path: 'analysis', component: DashboardAnalysisComponent },
//  { path: 'monitor', component: DashboardMonitorComponent },
//  { path: 'workplace', component: DashboardWorkplaceComponent }
];