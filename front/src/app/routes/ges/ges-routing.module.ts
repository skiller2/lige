import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { GesCcfarmComponent } from './ccfarm/ccfarm.component';

const routes: Routes = [{ path: 'ccfarm', component: GesCcfarmComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GesRoutingModule {}
