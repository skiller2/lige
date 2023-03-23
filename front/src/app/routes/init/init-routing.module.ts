import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { InitAnalysisComponent } from './analysis/analysis.component';
import { InitMonitorComponent } from './monitor/monitor.component';
import { InitV1Component } from './v1/v1.component';
import { InitWorkplaceComponent } from './workplace/workplace.component';

const routes: Routes = [
  { path: '', redirectTo: 'v1', pathMatch: 'full' },
  { path: 'v1', component: InitV1Component },
  { path: 'analysis', component: InitAnalysisComponent },
  { path: 'monitor', component: InitMonitorComponent },
  { path: 'workplace', component: InitWorkplaceComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InitRoutingModule {}
